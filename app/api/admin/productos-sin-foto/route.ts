import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Primero, veamos cuántos productos hay EN TOTAL con stock
    const totalConStock = await prisma.producto.count({
      where: {
        stock_disponible: { gt: 0 },
        rubro: { in: ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'] },
      }
    });

    // 2. Cuántos tienen imagen_url null o vacía
    const sinImagenUrl = await prisma.producto.count({
      where: {
        stock_disponible: { gt: 0 },
        rubro: { in: ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'] },
        OR: [
          { imagen_url: null },
          { imagen_url: '' },
        ]
      }
    });

    // 3. Cuántos tienen proxy
    const conProxy = await prisma.producto.count({
      where: {
        stock_disponible: { gt: 0 },
        rubro: { in: ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'] },
        imagen_url: { startsWith: '/proxy/imagen/' }
      }
    });

    // 4. Traer algunos ejemplos de URLs para ver qué formato tienen
    const ejemplos = await prisma.producto.findMany({
      where: {
        stock_disponible: { gt: 0 },
        rubro: { in: ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'] },
      },
      select: {
        codigo: true,
        imagen_url: true,
      },
      take: 10
    });

    console.log('=== DEBUG IMÁGENES ===');
    console.log('Total con stock:', totalConStock);
    console.log('Sin imagen_url:', sinImagenUrl);
    console.log('Con proxy:', conProxy);
    console.log('Ejemplos de URLs:', ejemplos);

    // 5. Ahora sí, traer los productos sin imagen
    const productos = await prisma.producto.findMany({
      where: {
        stock_disponible: { gt: 0 },
        rubro: { in: ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'] },
        OR: [
          { imagen_url: null },
          { imagen_url: '' },
        ]
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        imagen_url: true,
        marca_descripcion: true,
        rubro: true,
        color: true,
        talla: true,
        stock_disponible: true,
        familia_id: true,
      },
      take: 500,
      orderBy: { id: 'desc' }
    });

    console.log('Productos sin imagen encontrados:', productos.length);

    // Agrupar por familia
    const familias = new Map<string, any>();
    
    for (const p of productos) {
      const familiaKey = p.familia_id || `${p.codigo}`;
      
      if (!familias.has(familiaKey)) {
        familias.set(familiaKey, {
          familia_id: familiaKey,
          nombre: p.nombre.split(/\s+/).slice(0, 5).join(' '),
          marca: p.marca_descripcion,
          rubro: p.rubro,
          imagen_url: p.imagen_url,
          colores: new Set(),
          talles: []
        });
      }
      
      const fam = familias.get(familiaKey)!;
      if (p.color) fam.colores.add(p.color);
      fam.talles.push({ talla: p.talla, stock: p.stock_disponible });
    }

    const resultado = Array.from(familias.values()).map(f => ({
      ...f,
      colores: Array.from(f.colores),
      talles: f.talles.slice(0, 5)
    }));

    return NextResponse.json({
      debug: {
        totalConStock,
        sinImagenUrl,
        conProxy,
        ejemplos: ejemplos.map(e => ({ codigo: e.codigo, url: e.imagen_url }))
      },
      total: resultado.length,
      totalProductos: productos.length,
      productos: resultado,
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al buscar productos sin imagen' },
      { status: 500 }
    );
  }
}
