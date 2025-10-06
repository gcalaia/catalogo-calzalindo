// app/api/productos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const onlyFilters = searchParams.get('only_filters') === 'true';

    // Si solo piden filtros
    if (onlyFilters) {
      const [subrubros, marcas, talles] = await Promise.all([
        prisma.producto.findMany({
          select: { subrubro_nombre: true },
          where: { subrubro_nombre: { not: null } },
          distinct: ['subrubro_nombre'],
        }),
        prisma.producto.findMany({
          select: { marca_descripcion: true },
          where: { marca_descripcion: { not: null } },
          distinct: ['marca_descripcion'],
        }),
        prisma.producto.findMany({
          select: { talla: true },
          where: { talla: { not: null } },
          distinct: ['talla'],
        }),
      ]);

      return NextResponse.json({
        filtros: {
          subrubros: subrubros
            .map(s => s.subrubro_nombre)
            .filter(Boolean)
            .sort(),
          marcas: marcas
            .map(m => m.marca_descripcion)
            .filter(Boolean)
            .sort(),
          talles: talles
            .map(t => t.talla)
            .filter(Boolean)
            .sort((a, b) => parseFloat(a) - parseFloat(b)),
        },
      });
    }

    // Parámetros de búsqueda
    const search = searchParams.get('search') || '';
    const subrubro = searchParams.get('subrubro');
    const marca = searchParams.get('marca');
    const talle = searchParams.get('talle');
    const precioMin = searchParams.get('precioMin');
    const precioMax = searchParams.get('precioMax');
    const limit = parseInt(searchParams.get('limit') || '2000');

    // Construir filtros
    const where: any = {
      stock_disponible: { gt: 0 },
    };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { marca_descripcion: { contains: search, mode: 'insensitive' } },
        { subrubro_nombre: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (subrubro) {
      where.subrubro_nombre = subrubro;
    }

    if (marca) {
      where.marca_descripcion = marca;
    }

    if (talle) {
      where.talla = talle;
    }

    if (precioMin || precioMax) {
      where.precio_lista = {};
      if (precioMin) where.precio_lista.gte = parseFloat(precioMin);
      if (precioMax) where.precio_lista.lte = parseFloat(precioMax);
    }

    // 🔥 QUERY CON ORDENAMIENTO: MÁS NUEVOS PRIMERO
    const productos = await prisma.producto.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }, // ✅ Los productos SÍ tienen createdAt
        { nombre: 'asc' },
      ],
      take: limit,
    });

    return NextResponse.json({ productos });

  } catch (error) {
    console.error('Error fetching productos:', error);
    return NextResponse.json(
      { error: 'Error al cargar productos' },
      { status: 500 }
    );
  }
}
