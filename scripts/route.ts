import { NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { prisma } from '@/lib/prisma';

const API_IMAGEN_URL = 'http://200.58.109.125:8007/api/imagen';
const CONCURRENCY = 8;
const TIMEOUT_MS = 5000;

function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

async function getJsonWithTimeout(url: string, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
  finally { clearTimeout(t); }
}

export async function POST(req: Request) {
  try {
    const { limite = 500, offset = 0 } = await req.json();

    // Trae sólo pendientes y con stock
    const productos = await prisma.producto.findMany({
      where: {
        imagen_url: null,
        stock_disponible: { gt: 0 },
        rubro: { in: ['DAMAS','HOMBRES','NIÑOS','NIÑAS','UNISEX'] },
      },
      select: { codigo: true },
      distinct: ['codigo'],
      skip: offset,
      take: limite,
      orderBy: { stock_disponible: 'desc' },
    });

    const limit = pLimit(CONCURRENCY);
    let procesados = 0, exitosos = 0, sinImagen = 0, errores = 0;
    const detalles: any[] = [];

    await Promise.all(productos.map(p => limit(async () => {
      procesados++;
      const url = `${API_IMAGEN_URL}/${p.codigo}`;

      // pequeño retry 2 intentos
      let data = await getJsonWithTimeout(url);
      if (!data) { await sleep(120); data = await getJsonWithTimeout(url); }

      if (!data || !data.url_absoluta) {
        sinImagen++;
        await prisma.producto.updateMany({
          where: { codigo: p.codigo, imagen_url: null },
          data: { imagen_status: 'missing', imagen_checked_at: new Date() },
        });
        return;
      }

      const m = String(data.url_absoluta).match(/\/imagenes\/(.+)$/);
      if (!m) {
        errores++;
        await prisma.producto.updateMany({
          where: { codigo: p.codigo, imagen_url: null },
          data: { imagen_status: 'error', imagen_checked_at: new Date() },
        });
        return;
      }

      const proxyUrl = `/proxy/imagen/${m[1]}`;

      // Idempotente: sólo si sigue null
      const result = await prisma.producto.updateMany({
        where: { codigo: p.codigo, imagen_url: null },
        data: { imagen_url: proxyUrl, imagen_status: 'ok', imagen_checked_at: new Date() },
      });

      if (result.count > 0) {
        exitosos++;
        detalles.push({ codigo: p.codigo, url: proxyUrl, actualizados: result.count });
      } else {
        // ya estaba seteado por otro proceso
      }
    })));

    const mensaje = `OK:${exitosos} SIN:${sinImagen} ERR:${errores} TOT:${procesados}`;
    return NextResponse.json({ success: true, procesados, exitosos, sinImagen, errores, detalles, mensaje, siguienteOffset: offset + limite });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Error al migrar imagenes' }, { status: 500 });
  }
}
