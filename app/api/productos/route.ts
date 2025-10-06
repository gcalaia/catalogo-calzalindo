// app/api/productos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calcularPrecios } from '@/lib/pricing';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const onlyFilters = sp.get('only_filters') === 'true';

    // Rubros válidos (excluir legacy)
    const RUBROS_VALIDOS = ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'];

    // ── Solo filtros
    if (onlyFilters) {
      const [subrubros, marcas, talles] = await Promise.all([
        prisma.producto.findMany({
          select: { subrubro_nombre: true },
          where: { 
            subrubro_nombre: { not: null },
            rubro: { in: RUBROS_VALIDOS }  // ← Filtrar rubros legacy
          },
          distinct: ['subrubro_nombre'],
        }),
        prisma.producto.findMany({
          select: { marca_descripcion: true },
          where: { 
            marca_descripcion: { not: null },
            rubro: { in: RUBROS_VALIDOS }
          },
          distinct: ['marca_descripcion'],
        }),
        prisma.producto.findMany({
          select: { talla: true },
          where: { 
            talla: { not: null },
            rubro: { in: RUBROS_VALIDOS }
          },
          distinct: ['talla'],
        }),
      ]);

      return NextResponse.json({
        filtros: {
          subrubros: subrubros.map(s => s.subrubro_nombre!).filter(Boolean).sort(),
          marcas: marcas.map(m => m.marca_descripcion!).filter(Boolean).sort(),
          talles: talles
            .map(t => t.talla!).filter(Boolean)
            .sort((a, b) => {
              const na = parseFloat(a), nb = parseFloat(b);
              if (isNaN(na) || isNaN(nb)) return a.localeCompare(b);
              return na - nb;
            }),
        },
      });
    }

    // ── Parámetros
    const search     = sp.get('search') || '';
    const rubro      = sp.get('rubro');  // ← Agregar filtro de rubro
    const subrubro   = sp.get('subrubro');
    const marca      = sp.get('marca');
    const talle      = sp.get('talle');
    const precioMin  = sp.get('precioMin');
    const precioMax  = sp.get('precioMax');
    const orden      = sp.get('orden') || 'stock_asc';  // ← Agregar ordenamiento
    const limit      = parseInt(sp.get('limit') || '2000', 10);

    // ── Filtros
    const where: any = { 
      stock_disponible: { gt: 0 },
      rubro: { in: RUBROS_VALIDOS }  // ← Siempre filtrar legacy
    };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { marca_descripcion: { contains: search, mode: 'insensitive' } },
        { subrubro_nombre: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (rubro && rubro !== 'all') {
      where.rubro = rubro;  // ← Filtro específico por tab
    }

    if (subrubro) where.subrubro_nombre = subrubro;
    if (marca) where.marca_descripcion = marca;
    if (talle) where.talla = talle;

    if (precioMin || precioMax) {
      where.precio_lista = {};
      if (precioMin) where.precio_lista.gte = parseFloat(precioMin);
      if (precioMax) where.precio_lista.lte = parseFloat(precioMax);
    }

    // ── Ordenamiento dinámico
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
        orderBy = [{ nombre: 'asc' }];
        break;
      default:
        orderBy = [
          { stock_disponible: 'asc' },
          { createdAt: 'desc' }
        ];
    }

    // ── Query
    const productos = await prisma.producto.findMany({
      where,
      orderBy,
      take: limit,
    });

    // ── Precios comerciales (.999 y coeficientes)
    const productosOut = productos.map((p) => {
      const base = Number(p.precio_lista) || 0;
      const { lista, contado, debito, offContado, offDebito } = calcularPrecios(base);
      return {
        ...p,
        precio_lista_redondeado: lista,
        precio_contado: contado,
        precio_debito: debito,
        descuento_contado_pct: offContado,
        descuento_debito_pct: offDebito,
      };
    });

    return NextResponse.json({ productos: productosOut });
  } catch (err) {
    console.error('Error fetching productos:', err);
    return NextResponse.json({ error: 'Error al cargar productos' }, { status: 500 });
  }
}
