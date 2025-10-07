import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalProductos,
      productosConStock,
      productosSinFoto,
      productosStockBajo,
      productosSinPrecio,
      productosSinMarca,
      totalFamilias
    ] = await Promise.all([
      prisma.producto.count(),
      prisma.producto.count({ where: { stock_disponible: { gt: 0 } } }),
      prisma.producto.count({
        where: {
          OR: [
            { imagen_url: null },
            { imagen_url: '' },
            { imagen_url: { contains: 'no_image.png' } }
          ],
          stock_disponible: { gt: 0 }
        }
      }),
      prisma.producto.count({
        where: {
          stock_disponible: { gt: 0, lte: 3 }
        }
      }),
      prisma.producto.count({
        where: {
          OR: [
            { precio_lista: null },
            { precio_lista: 0 }
          ],
          stock_disponible: { gt: 0 }
        }
      }),
      prisma.producto.count({
        where: {
          OR: [
            { marca_descripcion: null },
            { marca_descripcion: '' }
          ],
          stock_disponible: { gt: 0 }
        }
      }),
      prisma.producto.groupBy({
        by: ['familia_id'],
        where: { familia_id: { not: null } }
      }).then(result => result.length)
    ]);

    return NextResponse.json({
      totalProductos,
      productosConStock,
      productosSinFoto,
      productosStockBajo,
      productosSinPrecio,
      productosSinMarca,
      totalFamilias
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
