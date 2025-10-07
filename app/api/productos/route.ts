// app/api/productos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const RUBROS_VALIDOS = ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'] as const;

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;

    const onlyFilters = sp.get('only_filters') === 'true';
    const sinFoto    = sp.get('sinFoto') === '1';

    const rubro      = sp.get('rubro');
    const subrubro   = sp.get('subrubro');
    const marca      = sp.get('marca');
    const talle      = sp.get('talle');
    const precioMin  = sp.get('precioMin');
    const precioMax  = sp.get('precioMax');
    const search     = sp.get('search') || '';
    const orden      = sp.get('orden') || 'nuevos';
    const limit      = Math.min(parseInt(sp.get('limit') || '2000', 10), 5000);

    // ===== where base (lo reutilizamos)
    const whereBase: any = {
      stock_disponible: { gt: 0 },
      rubro: { in: RUBROS_VALIDOS as unknown as string[] },
    };

    if (rubro && rubro !== 'all') whereBase.rubro = rubro;
    if (subrubro) whereBase.subrubro_nombre = subrubro;
    if (marca) whereBase.marca_descripcion = marca;
    if (talle) whereBase.talla = talle;

    if (precioMin || precioMax) {
      whereBase.precio_lista = {};
      if (precioMin) whereBase.precio_lista.gte = Number(precioMin);
      if (precioMax) whereBase.precio_lista.lte = Number(precioMax);
    }

    if (search) {
      whereBase.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { marca_descripcion: { contains: search, mode: 'insensitive' } },
        { rubro: { contains: search, mode: 'insensitive' } },
        { subrubro_nombre: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 🔥 sólo productos sin foto
    if (sinFoto) {
      whereBase.AND = [
        ...(whereBase.AND || []),
        {
          OR: [
            { imagen_url: null },
            { imagen_url: '' },
            { imagen_url: { contains: 'no_image', mode: 'insensitive' } },
          ],
        },
      ];
    }

    // ===== Sólo filtros
    if (onlyFilters) {
      const [subrubros, marcas, talles] = await Promise.all([
        prisma.producto.findMany({
          select: { subrubro_nombre: true },
          where: { ...whereBase, subrubro_nombre: { not: null } },
          distinct: ['subrubro_nombre'],
        }),
        prisma.producto.findMany({
          select: { marca_descripcion: true },
          where: { ...whereBase, marca_descripcion: { not: null } },
          distinct: ['marca_descripcion'],
        }),
        prisma.producto.findMany({
          select: { talla: true },
          where: { ...whereBase, talla: { not: null } },
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
              const A = parseFloat(a), B = parseFloat(b);
              return isNaN(A) || isNaN(B) ? a.localeCompare(b) : A - B;
            }),
        },
      });
    }

    // ===== Orden
    // Si no tenés createdAt en el modelo, cambiá por { id: 'desc' }
    let orderBy: any[] = [];
    switch (orden) {
      case 'stock_asc':
        orderBy = [{ stock_disponible: 'asc' }, { id: 'desc' }];
        break;
      case 'nuevos':
        orderBy = [{ id: 'desc' }]; // usa createdAt si existe
        break;
      case 'precio_asc':
        orderBy = [{ precio_lista: 'asc' }, { id: 'desc' }];
        break;
      case 'precio_desc':
        orderBy = [{ precio_lista: 'desc' }, { id: 'desc' }];
        break;
      case 'nombre':
        orderBy = [{ nombre: 'asc' }, { id: 'desc' }];
        break;
      default:
        orderBy = [{ id: 'desc' }];
    }

    const productos = await prisma.producto.findMany({
      where: whereBase,
      orderBy,
      take: Number.isNaN(limit) ? 2000 : limit,
      select: {
        id: true, codigo: true, codigo_sinonimo: true, familia_id: true,
        nombre: true, color: true, talla: true,
        marca_descripcion: true, rubro: true, subrubro_nombre: true,
        precio_lista: true, stock_disponible: true, imagen_url: true,
      },
    });

    return NextResponse.json({ productos });
  } catch (error) {
    console.error('Error fetching productos:', error);
    return NextResponse.json({ error: 'Error al cargar productos' }, { status: 500 });
  }
}
