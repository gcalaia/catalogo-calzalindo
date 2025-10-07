import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const productosSinMarca = await prisma.producto.findMany({
      where: {
        OR: [
          { marca_descripcion: null },
          { marca_descripcion: '' }
        ],
        stock_disponible: { gt: 0 }
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        marca_descripcion: true,
        rubro: true,
        subrubro_nombre: true,
        stock_disponible: true,
        precio_lista: true,
        familia_id: true,
      },
      orderBy: { stock_disponible: 'desc' },
      take: 500
    });

    return NextResponse.json({
      total: productosSinMarca.length,
      productos: productosSinMarca
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al buscar productos' }, { status: 500 });
  }
}
