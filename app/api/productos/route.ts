import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const rubro = searchParams.get('rubro') || '';
    const tipoCalzado = searchParams.get('tipo_calzado') || '';
    const precioMin = searchParams.get('precioMin');
    const precioMax = searchParams.get('precioMax');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereConditions: any = {
      AND: []
    };

    // Filtro de búsqueda
    if (search) {
      whereConditions.AND.push({
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { codigo_sinonimo: { contains: search, mode: 'insensitive' } },
          { codigo: { equals: parseInt(search) || undefined } }
        ]
      });
    }

    // Filtro por rubro
    if (rubro) {
      whereConditions.AND.push({ rubro: { equals: rubro } });
    }

    // Filtro por tipo de calzado
    if (tipoCalzado) {
      whereConditions.AND.push({ tipo_calzado: { equals: tipoCalzado } });
    }

    // Filtros de precio
    if (precioMin || precioMax) {
      const precioFilter: any = {};
      if (precioMin) precioFilter.gte = parseFloat(precioMin);
      if (precioMax) precioFilter.lte = parseFloat(precioMax);
      whereConditions.AND.push({ precio_lista: precioFilter });
    }

    // Si no hay filtros, quitar el AND vacío
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
          temporada: true,
          precio_lista: true,
          precio_contado: true,
          precio_debito: true,
          precio_credito: true,
          imagen_url: true,
          stock_disponible: true,
          fecha_compra: true,
          fecha_modificacion: true
        },
        orderBy: [
          { familia_id: 'asc' },
          { color: 'asc' },
          { talla: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.producto.count({ where })
    ]);

    // Obtener filtros disponibles
    const [rubros, tiposCalzado] = await Promise.all([
      prisma.producto.groupBy({
        by: ['rubro'],
        where,
        _count: { rubro: true },
        orderBy: { rubro: 'asc' }
      }),
      prisma.producto.groupBy({
        by: ['tipo_calzado'],
        where,
        _count: { tipo_calzado: true },
        orderBy: { tipo_calzado: 'asc' }
      })
    ]);

    return NextResponse.json({
      productos,
      total,
      hasMore: offset + limit < total,
      filtros: {
        rubros: rubros
          .filter(r => r.rubro)
          .map(r => ({ nombre: r.rubro, count: r._count.rubro })),
        tipos_calzado: tiposCalzado
          .filter(t => t.tipo_calzado)
          .map(t => ({ nombre: t.tipo_calzado, count: t._count.tipo_calzado }))
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