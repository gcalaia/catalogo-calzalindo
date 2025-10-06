// app/api/productos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calcularPrecios } from '@/lib/pricing';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const onlyFilters = searchParams.get('only_filters') === 'true';

    // ── Solo filtros ────────────────────────────────────────────────────────────
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

    // ── Parámetros de búsqueda ─────────────────────────────────────────────────
    const search = searchParams.get('search') || '';
    const subrubro = searchParams.get('subrubro');
    const marca = searchParams.get('marca');
    const talle = searchParams.get('talle');
    const precioMin = searchParams.get('precioMin');
    const precioMax = searchParams.get('precioMax');
    const limit = parseInt(searchParams.get('limit') || '2000', 10);

    // ── Filtros ────────────────────────────────────────────────────────────────
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

    if (subrubro) where.subrubro_nombre = subrubro;
    if (marca) where.marca_descripcion = marca;
    if (talle) where.talla = talle;

    if (precioMin || precioMax) {
      where.precio_lista = {};
      if (precioMin) where.precio_lista.gte = parseFloat(precioMin);
      if (precioMax) where.precio_lista.lte = parseFloat(precioMax);
    }

    // ── Query ──────────────────────────────────────────────────────────────────
    const productos = await prisma.producto.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { nombre: 'asc' }],
      take: limit,
    });

    // ── Calcular precios comerciales (.999 + coeficientes) ─────────────────────
    const productosOut = productos.map((p) => {
      const base = Number(p.precio_lista) || 0;
      const { lista, contado, debito, descuento, recargoDeb } = calcularPrecios(base);

      return {
        ...p,
        // precios calculados (no reemplazo el original por compatibilidad)
        precio_lista_redondeado: lista,
        precio_contado: contado,
        precio_debito: debito,
        descuento_contado_pct: descuento,   // ~33
        recargo_debito_pct: recargoDeb,     // ~7
      };
    });

    return NextResponse.json({ productos: productosOut });
  } catch (error) {
    console.error('Error fetching productos:', error);
    return NextResponse.json(
      { error: 'Error al cargar productos' },
      { status: 500 }
    );
  }
}
