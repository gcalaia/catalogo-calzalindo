// app/api/productos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const onlyFilters = searchParams.get('only_filters') === 'true';

    // Si solo piden filtros
    if (onlyFilters) {
      const RUBROS_VALIDOS = ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'];
      const rubro = searchParams.get('rubro');
      
      const whereFilters: any = {
        stock_disponible: { gt: 0 },
        rubro: { in: RUBROS_VALIDOS }
      };
      
      // Si hay rubro específico, filtrar por ese rubro
      if (rubro && rubro !== 'all') {
        whereFilters.rubro = rubro;
      }
      
      const [subrubros, marcas, talles] = await Promise.all([
        prisma.producto.findMany({
          select: { subrubro_nombre: true },
          where: { 
            ...whereFilters,
            subrubro_nombre: { not: null }
          },
          distinct: ['subrubro_nombre'],
        }),
        prisma.producto.findMany({
          select: { marca_descripcion: true },
          where: { 
            ...whereFilters,
            marca_descripcion: { not: null }
          },
          distinct: ['marca_descripcion'],
        }),
        prisma.producto.findMany({
          select: { talla: true },
          where: { 
            ...whereFilters,
            talla: { not: null }
          },
          distinct: ['talla'],
        }),
      ]);

      return NextResponse.json({
        filtros: {
          subrubros: subrubros
            .map(s => s.subrubro_nombre)
            .filter((s): s is string => s !== null)
            .sort(),
          marcas: marcas
            .map(m => m.marca_descripcion)
            .filter((m): m is string => m !== null)
            .sort(),
          talles: talles
            .map(t => t.talla)
            .filter((t): t is string => t !== null)
            .sort((a, b) => {
              const numA = parseFloat(a);
              const numB = parseFloat(b);
              if (isNaN(numA) || isNaN(numB)) return a.localeCompare(b);
              return numA - numB;
            }),
        },
      });
    }

    // Parámetros de búsqueda
    const search = searchParams.get('search') || '';
    const rubro = searchParams.get('rubro');
    const subrubro = searchParams.get('subrubro');
    const marca = searchParams.get('marca');
    const talle = searchParams.get('talle');
    const precioMin = searchParams.get('precioMin');
    const precioMax = searchParams.get('precioMax');
    const orden = searchParams.get('orden') || 'stock_asc';
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

    if (rubro && rubro !== 'all') {
      where.rubro = rubro;
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

    // Definir ordenamiento según parámetro
    let orderBy: any[] = [];
    
    switch (orden) {
      case 'stock_asc':
        orderBy = [
          { stock_disponible: 'asc' },
          { createdAt: 'desc' }
        ];
        break;
      case 'nuevos':
        orderBy = [
          { createdAt: 'desc' },
          { stock_disponible: 'asc' }
        ];
        break;
      case 'precio_asc':
        orderBy = [
          { precio_lista: 'asc' },
          { stock_disponible: 'asc' }
        ];
        break;
      case 'precio_desc':
        orderBy = [
          { precio_lista: 'desc' },
          { stock_disponible: 'asc' }
        ];
        break;
      case 'nombre':
        orderBy = [
          { nombre: 'asc' }
        ];
        break;
      default:
        orderBy = [
          { stock_disponible: 'asc' },
          { createdAt: 'desc' }
        ];
    }

    // Query con ordenamiento dinámico
    const productos = await prisma.producto.findMany({
      where,
      orderBy,
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
