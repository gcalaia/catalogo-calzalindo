import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Obtener 20 productos con diferentes tipos de imagen_url
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
      take: 100
    });

    // Agrupar por tipo de imagen_url
    const agrupado = productos.reduce((acc: any, p) => {
      const key = p.imagen_url || 'NULL_OR_EMPTY';
      if (!acc[key]) acc[key] = [];
      acc[key].push({ codigo: p.codigo, nombre: p.nombre });
      return acc;
    }, {});

    return NextResponse.json({
      total: productos.length,
      tiposDeImagenUrl: Object.keys(agrupado).map(key => ({
        url: key,
        cantidad: agrupado[key].length,
        ejemplos: agrupado[key].slice(0, 3)
      }))
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
