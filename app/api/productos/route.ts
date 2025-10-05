import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Endpoint para solo obtener opciones de filtros
    const onlyFilters = searchParams.get('only_filters') === 'true';
    
    if (onlyFilters) {
      const [tipos, marcas, talles] = await Promise.all([
        prisma.producto.groupBy({
          by: ['tipo_calzado'],
          where: { tipo_calzado: { not: null } },
          orderBy: { tipo_calzado: 'asc' }
        }),
        prisma.producto.groupBy({
          by: ['marca_descripcion'],
          where: { marca_descripcion: { not: null } },
          orderBy: { marca_descripcion: 'asc' }
        }),
        prisma.producto.groupBy({
          by: ['talla'],
          where: { talla: { not: null } },
          orderBy: { talla: 'asc' }
        })
      ]);
      
      const tallesOrdenados = talles
        .map(t => t.talla!)
        .sort((a, b) => parseFloat(a) - parseFloat(b));
      
      return NextResponse.json({
        filtros: {
          tipos: tipos.map(t => t.tipo_calzado!),
          marcas: marcas.map(m => m.marca_descripcion!),
          talles: tallesOrdenados
        }
      });
    }
    
    // Búsqueda normal con filtros aplicados
    const search = searchParams.get('search') || '';
    const tipoCalzado = searchParams.get('tipo_calzado') || '';
    const talle = searchParams.get('talle') || '';
    const marca = searchParams.get('marca') || '';
    const precioMin = searchParams.get('precioMin');
    const precioMax = searchParams.get('precioMax');
    const limit = parseInt(searchParams.get('limit') || '2000');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereConditions: any = {
      AND: []
    };

    if (search) {
      whereConditions.AND.push({
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { codigo_sinonimo: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (tipoCalzado) {
      whereConditions.AND.push({ tipo_calzado: { equals: tipoCalzado } });
    }

    if (marca) {
      whereConditions.AND.push({ marca_descripcion: { equals: marca } });
    }

    if (talle) {
      whereConditions.AND.push({ talla: { equals: talle } });
    }

    if (precioMin || precioMax) {
      const precioFilter: any = {};
      if (precioMin) precioFilter.gte = parseFloat(precioMin);
      if (precioMax) precioFilter.lte = parseFloat(precioMax);
      whereConditions.AND.push({ precio_lista: precioFilter });
    }

    const where = whereConditions.AND.length > 0 ? whereConditions : {};

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
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
        orderBy: { id: 'asc' },
        skip: offset,
        take: limit
      }),
      prisma.producto.count({ where })
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
