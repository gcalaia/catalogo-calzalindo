import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: {
        stock_disponible: { gt: 0 }
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        imagen_url: true,
      },
      take: 200
    });

    const agrupado: Record<string, any[]> = {};
    
    productos.forEach(p => {
      const key = p.imagen_url || 'NULL_O_VACIO';
      if (!agrupado[key]) agrupado[key] = [];
      agrupado[key].push({ codigo: p.codigo, nombre: p.nombre });
    });

    const resultado = Object.keys(agrupado).map(url => ({
      url: url,
      cantidad: agrupado[url].length,
      ejemplos: agrupado[url].slice(0, 3)
    }));

    return NextResponse.json({
      total: productos.length,
      tiposDeImagenUrl: resultado
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
