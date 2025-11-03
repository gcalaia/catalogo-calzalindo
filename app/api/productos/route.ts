import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Si solo quieren filtros
    const onlyFilters = searchParams.get('only_filters');
    if (onlyFilters === 'true') {
      return await getFiltros(searchParams);
    }
    
    // Parámetros de filtrado
    const search = searchParams.get('search');
    const rubro = searchParams.get('rubro');
    const subrubro = searchParams.get('subrubro');
    const marca = searchParams.get('marca');
    const talle = searchParams.get('talle');
    const taxonomia = searchParams.get('taxonomia'); // ⬅️ NUEVO
    const linea = searchParams.get('linea'); // ⬅️ NUEVO
    const precioMin = searchParams.get('precioMin');
    const precioMax = searchParams.get('precioMax');
    const orden = searchParams.get('orden') || 'nuevos';
    const sinFoto = searchParams.get('sinFoto');
    const destacados = searchParams.get('destacados'); // ⬅️ NUEVO
    const limit = parseInt(searchParams.get('limit') || '100');

    // Construir filtros
    const where: any = {
      activo: true,
    };

    if (rubro && rubro !== 'all') {
      where.prod_rubros = {
        nombre: {
          equals: rubro,
          mode: 'insensitive'
        }
      };
    }

    if (subrubro) {
      where.prod_subrubros = {
        nombre: {
          equals: subrubro,
          mode: 'insensitive'
        }
      };
    }

    if (marca) {
      where.prod_marcas = {
        nombre: {
          equals: marca,
          mode: 'insensitive'
        }
      };
    }

    // ⬅️ NUEVO: Filtro por taxonomía (Uso/Ocasión)
    if (taxonomia) {
      where.prod_taxonomias = {
        nombre: {
          equals: taxonomia,
          mode: 'insensitive'
        }
      };
    }

    // ⬅️ NUEVO: Filtro por línea (Temporada)
    if (linea) {
      where.prod_lineas = {
        nombre: {
          equals: linea,
          mode: 'insensitive'
        }
      };
    }

    // ⬅️ NUEVO: Solo destacados
    if (destacados === 'true') {
      where.destacado = true;
    }

    // Búsqueda por texto
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { nombre_mg: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { keywords: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { prod_marcas: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Orden
    let orderBy: any = { fecha_creacion: 'desc' };
    switch (orden) {
      case 'nombre':
        orderBy = { nombre: 'asc' };
        break;
      case 'precio_asc':
      case 'precio_desc':
        orderBy = { nombre: 'asc' }; // Por ahora, hasta que tengamos precios en variantes
        break;
      case 'stock_asc':
        orderBy = { fecha_creacion: 'desc' }; // Por ahora
        break;
    }

    // Obtener productos
    const productos = await prisma.productos.findMany({
      where,
      take: limit,
      include: {
        prod_marcas: true,
        prod_rubros: true,
        prod_subrubros: true,
        prod_lineas: true, // ⬅️ NUEVO
        prod_taxonomias: true, // ⬅️ NUEVO
      },
      orderBy
    });

    // Generar datos en el formato esperado por el frontend
    const productosFormateados = productos.map((p) => {
      // Extraer posible color del nombre
      const colores = ['NEGRO', 'BLANCO', 'AZUL', 'ROJO', 'VERDE', 'GRIS', 'MARRÓN', 'MARRON', 'BEIGE', 'ROSA', 'CAMEL', 'BORDÓ', 'BORDO'];
      let colorExtraido = 'Sin color';
      const nombreUpper = (p.nombre || '').toUpperCase();
      for (const color of colores) {
        if (nombreUpper.includes(color)) {
          colorExtraido = color.charAt(0) + color.slice(1).toLowerCase();
          if (colorExtraido === 'Marron') colorExtraido = 'Marrón';
          if (colorExtraido === 'Bordo') colorExtraido = 'Bordó';
          break;
        }
      }

      return {
        codigo: p.id,
        codigo_sinonimo: p.sku,
        familia_id: p.familia_id || String(p.id),
        nombre: p.nombre || 'Sin nombre',
        color: colorExtraido,
        talla: '39', // Talle temporal
        marca_descripcion: p.prod_marcas?.nombre || null,
        rubro: p.prod_rubros?.nombre || null,
        subrubro_nombre: p.prod_subrubros?.nombre || null,
        taxonomia: p.prod_taxonomias?.nombre || null, // ⬅️ NUEVO
        linea: p.prod_lineas?.nombre || null, // ⬅️ NUEVO
        destacado: p.destacado || false, // ⬅️ NUEVO
        precio_lista: 50000, // Precio temporal
        stock_disponible: 5, // Stock temporal
        imagen_url: null,
      };
    });

    return NextResponse.json({
      productos: productosFormateados,
      total: productosFormateados.length
    });

  } catch (error) {
    console.error('Error al cargar productos:', error);
    return NextResponse.json(
      { 
        error: 'Error al cargar productos', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function getFiltros(searchParams: URLSearchParams) {
  try {
    const rubro = searchParams.get('rubro');
    const subrubro = searchParams.get('subrubro');
    const taxonomia = searchParams.get('taxonomia');
    const linea = searchParams.get('linea');

    const whereProductos: any = {
      activo: true
    };

    if (rubro && rubro !== 'all') {
      whereProductos.prod_rubros = {
        nombre: {
          equals: rubro,
          mode: 'insensitive'
        }
      };
    }

    if (subrubro) {
      whereProductos.prod_subrubros = {
        nombre: {
          equals: subrubro,
          mode: 'insensitive'
        }
      };
    }

    if (taxonomia) {
      whereProductos.prod_taxonomias = {
        nombre: {
          equals: taxonomia,
          mode: 'insensitive'
        }
      };
    }

    if (linea) {
      whereProductos.prod_lineas = {
        nombre: {
          equals: linea,
          mode: 'insensitive'
        }
      };
    }

    // Obtener subrubros únicos
    const subrubrosData = await prisma.prod_subrubros.findMany({
      where: {
        productos: {
          some: whereProductos
        }
      },
      select: {
        nombre: true,
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Obtener marcas únicas
    const marcasData = await prisma.prod_marcas.findMany({
      where: {
        productos: {
          some: whereProductos
        }
      },
      select: {
        nombre: true,
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // ⬅️ NUEVO: Obtener taxonomías únicas
    const taxonomiasData = await prisma.prod_taxonomias.findMany({
      where: {
        productos: {
          some: whereProductos
        }
      },
      select: {
        nombre: true,
        descripcion: true,
      },
      orderBy: {
        orden: 'asc'
      }
    });

    // ⬅️ NUEVO: Obtener líneas únicas
    const lineasData = await prisma.prod_lineas.findMany({
      where: {
        productos: {
          some: whereProductos
        }
      },
      select: {
        nombre: true,
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Talles temporales (hasta que se migren los datos)
    const talles = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

    return NextResponse.json({
      filtros: {
        subrubros: subrubrosData.map(s => s.nombre).filter(Boolean),
        marcas: marcasData.map(m => m.nombre).filter(Boolean),
        taxonomias: taxonomiasData.map(t => ({
          nombre: t.nombre,
          descripcion: t.descripcion
        })).filter(t => t.nombre),
        lineas: lineasData.map(l => l.nombre).filter(Boolean),
        talles: talles
      }
    });

  } catch (error) {
    console.error('Error al cargar filtros:', error);
    return NextResponse.json(
      { error: 'Error al cargar filtros' },
      { status: 500 }
    );
  }
}
