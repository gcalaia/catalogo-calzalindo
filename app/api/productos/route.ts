// app/api/productos/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const RUBROS_VALIDOS = ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'] as const;

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const onlyFilters = sp.get('only_filters') === 'true';

    const search     = sp.get('search') || '';
    const rubro      = sp.get('rubro');
    const subrubro   = sp.get('subrubro');
    const marca      = sp.get('marca');
    const talle      = sp.get('talle');
    const precioMin  = sp.get('precioMin');
    const precioMax  = sp.get('precioMax');
    const orden      = sp.get('orden') || 'nuevos';
    const limit      = Math.min(parseInt(sp.get('limit') || '2000', 10), 5000);
    
    // ⬇️ NUEVO: detectar si viene desde admin o si quiere ver "sin foto"
    const soloSinFoto = sp.get('sinFoto') === '1';

    const whereBase: any = {
      stock_disponible: { gt: 0 },
      rubro: { in: RUBROS_VALIDOS as unknown as string[] },
    };

    // ⬇️ NUEVO: filtro de imagen
    if (soloSinFoto) {
      // Si está activado el toggle "sólo sin foto" → mostrar SOLO los que no tienen
      whereBase.OR = [
        { imagen_url: null },
        { imagen_url: '' },
        { imagen_url: 'no_image.png' },
        { imagen_url: { contains: 'no_image' } }
      ];
    } else {
      // ✅ Catálogo normal: EXCLUIR productos sin imagen
      whereBase.NOT = {
        OR: [
          { imagen_url: null },
          { imagen_url: '' },
          { imagen_url: 'no_image.png' },
          { imagen_url: { contains: 'no_image' } }
        ]
      };
    }

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
      whereBase.AND = whereBase.AND || [];
      whereBase.AND.push({
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { marca_descripcion: { contains: search, mode: 'insensitive' } },
          { rubro: { contains: search, mode: 'insensitive' } },
          { subrubro_nombre: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    if (onlyFilters) {
      const [subrubros, marcas, talles] = await Promise.all([
        prisma.producto.groupBy({
          by: ['subrubro_nombre'],
          where: { ...whereBase, subrubro_nombre: { not: null } },
          _count: { _all: true },
        }),
        prisma.producto.groupBy({
          by: ['marca_descripcion'],
          where: { ...whereBase, marca_descripcion: { not: null } },
          _count: { _all: true },
        }),
        prisma.producto.groupBy({
          by: ['talla'],
          where: { ...whereBase, talla: { not: null } },
          _count: { _all: true },
        }),
      ]);

      return NextResponse.json({
        filtros: {
          subrubros: subrubros.map(s => s.subrubro_nombre as string).filter(Boolean).sort(),
          marcas: marcas.map(m => m.marca_descripcion as string).filter(Boolean).sort(),
          talles: talles
            .map(t => t.talla as string).filter(Boolean)
            .sort((a, b) => {
              const A = parseFloat(a), B = parseFloat(b);
              return isNaN(A) || isNaN(B) ? a.localeCompare(b) : A - B;
            }),
        },
      });
    }

    let orderBy: any[] = [];
    switch (orden) {
      case 'stock_asc':  orderBy = [{ stock_disponible: 'asc' }, { id: 'desc' }]; break;
      case 'precio_asc': orderBy = [{ precio_lista: 'asc' }, { id: 'desc' }]; break;
      case 'precio_desc':orderBy = [{ precio_lista: 'desc' }, { id: 'desc' }]; break;
      case 'nombre':     orderBy = [{ nombre: 'asc' }, { id: 'desc' }]; break;
      case 'nuevos':
      default:           orderBy = [{ id: 'desc' }];
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
  } catch (e) {
    console.error('GET /api/productos', e);
    return NextResponse.json({ error: 'Error al cargar productos' }, { status: 500 });
  }
}
