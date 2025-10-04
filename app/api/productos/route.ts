import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { codigo_sinonimo: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where: whereConditions,
        select: {
          id: true,
          codigo: true,
          codigo_sinonimo: true,
          familia_id: true,
          nombre: true,
          color: true,
          talla: true,
          marca_descripcion: true,
          rubro: true,
          tipo_calzado: true,
          precio_lista: true,
          precio_contado: true,
          imagen_url: true,
          stock_disponible: true
        },
        orderBy: [
          { familia_id: 'asc' },
          { color: 'asc' },
          { talla: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.producto.count({ where: whereConditions })
    ]);

    return NextResponse.json({
      productos,
      total,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error('Error en API productos:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener productos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}