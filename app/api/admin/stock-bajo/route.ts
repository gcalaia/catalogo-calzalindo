import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const productosStockBajo = await prisma.producto.findMany({
      where: {
        stock_disponible: { gt: 0, lte: 3 }
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
        color: true,
        talla: true,
      },
      orderBy: { stock_disponible: 'asc' },
      take: 500
    });

    return NextResponse.json({
      total: productosStockBajo.length,
      productos: productosStockBajo
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al buscar productos' }, { status: 500 });
  }
}
