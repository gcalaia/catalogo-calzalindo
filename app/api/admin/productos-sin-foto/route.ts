import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const productosSinFoto = await prisma.producto.findMany({
      where: {
        OR: [
          { imagen_url: null },
          { imagen_url: '' },
          { imagen_url: { contains: 'no_image.png' } }
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
      take: 500 // Limitar a 500 para no saturar
    });

    return NextResponse.json({
      total: productosSinFoto.length,
      productos: productosSinFoto
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al buscar productos' }, { status: 500 });
  }
}
