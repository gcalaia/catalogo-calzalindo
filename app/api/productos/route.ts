import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const subrubro = searchParams.get('subrubro') || '';
    const proveedor = searchParams.get('proveedor') || '';
    const precioMin = searchParams.get('precioMin');
    const precioMax = searchParams.get('precioMax');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereConditions: any = {
      AND: [
        { anio_coleccion: { in: ['2022', '2023', '2024', '2025'] } },
        { 
          subrubro_id: { 
            in: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 
                 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48] 
          } 
        }
      ]
    };

    if (search) {
      whereConditions.AND.push({
        OR: [
          { descripcion: { contains: search, mode: 'insensitive' } },
          { nombre: { contains: search, mode: 'insensitive' } },
          { codigo_sinonimo: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (subrubro) {
      whereConditions.AND.push({ subrubro: { equals: subrubro } });
    }

    if (proveedor) {
      whereConditions.AND.push({ proveedor: { equals: proveedor } });
    }

    if (precioMin || precioMax) {
      const precioFilter: any = {};
      if (precioMin) precioFilter.gte = parseFloat(precioMin);
      if (precioMax) precioFilter.lte = parseFloat(precioMax);
      whereConditions.AND.push({ precio_lista: precioFilter });
    }

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where: whereConditions,
        select: {
          id: true,
          familia_id: true,
          codigo_sinonimo: true,
          codigo_original: true,
          descripcion: true,
          nombre: true,
          color: true,
          talle: true,
          marca: true,
          proveedor: true,
          subrubro: true,
          subrubro_id: true,
          rubro: true,
          anio_coleccion: true,
          precio_lista: true,
          precio_promocion: true,
          precio_outlet: true,
          imagen_principal: true,
          stock_disponible: true,
          fecha_actualizacion: true
        },
        orderBy: [
          { familia_id: 'asc' },
          { color: 'asc' },
          { talle: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.producto.count({ where: whereConditions })
    ]);

    const [subrubros, proveedores] = await Promise.all([
      prisma.producto.groupBy({
        by: ['subrubro'],
        where: whereConditions,
        _count: { subrubro: true },
        orderBy: { subrubro: 'asc' }
      }),
      prisma.producto.groupBy({
        by: ['proveedor'],
        where: whereConditions,
        _count: { proveedor: true },
        orderBy: { proveedor: 'asc' }
      })
    ]);

    return NextResponse.json({
      productos,
      total,
      hasMore: offset + limit < total,
      filtros: {
        subrubros: subrubros
          .filter(s => s.subrubro)
          .map(s => ({ nombre: s.subrubro, count: s._count.subrubro })),
        proveedores: proveedores
          .filter(p => p.proveedor)
          .map(p => ({ nombre: p.proveedor, count: p._count.proveedor }))
      }
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