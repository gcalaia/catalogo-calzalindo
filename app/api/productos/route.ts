import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const COEFICIENTES = {
  contado: -5,
  debito: 5,
  regular: 43,
};

function calcularPrecios(precioBase: number) {
  const contado = Math.round(precioBase * (1 + COEFICIENTES.contado / 100));
  const debito = Math.round(precioBase * (1 + COEFICIENTES.debito / 100));
  const regular = Math.round(precioBase * (1 + COEFICIENTES.regular / 100));
  const regularComercial = Math.ceil(regular / 100) * 100 - 1;
  
  return { contado, debito, regular: regularComercial, precioBase };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const marca = searchParams.get('marca');
    const talla = searchParams.get('talla');
    const color = searchParams.get('color');
    const search = searchParams.get('search');
    const rubro = searchParams.get('rubro');
    
    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    let sqlQuery = `
      SELECT 
        id, codigo, nombre, talla, color, 
        marca_descripcion, rubro, precio_lista, 
        stock_disponible, imagen_url,
        fecha_compra, fecha_modificacion
      FROM "Producto"
      WHERE stock_disponible > 0
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (marca) {
      sqlQuery += ` AND marca_descripcion = $${paramIndex}`;
      params.push(marca);
      paramIndex++;
    }

    if (talla) {
      sqlQuery += ` AND talla = $${paramIndex}`;
      params.push(talla);
      paramIndex++;
    }

    if (color) {
      sqlQuery += ` AND color = $${paramIndex}`;
      params.push(color);
      paramIndex++;
    }

    if (rubro) {
      sqlQuery += ` AND rubro = $${paramIndex}`;
      params.push(rubro);
      paramIndex++;
    }

    if (search) {
      sqlQuery += ` AND (LOWER(nombre) LIKE $${paramIndex} OR codigo::text LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    // Primero obtener el total para saber cuántas páginas hay
    const countQuery = sqlQuery.replace(
      'SELECT id, codigo, nombre, talla, color, marca_descripcion, rubro, precio_lista, stock_disponible, imagen_url, fecha_compra, fecha_modificacion',
      'SELECT COUNT(*) as total'
    );
    
    const countResult = await prisma.$queryRawUnsafe(countQuery, ...params) as any[];
    const total = parseInt(countResult[0].total);

    sqlQuery += ` ORDER BY nombre ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const productos = await prisma.$queryRawUnsafe(sqlQuery, ...params);

    const productosConPrecios = (productos as any[]).map((p: any) => {
      const precios = calcularPrecios(p.precio_lista);
      
      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        talla: (!p.talla || p.talla === 'null' || p.talla === '') ? null : p.talla,
        color: (!p.color || p.color === 'null' || p.color === '' || p.color.startsWith('#')) ? null : p.color,
        marca_descripcion: p.marca_descripcion,
        rubro: p.rubro,
        stock_disponible: p.stock_disponible,
        imagen_url: p.imagen_url,
        precio_lista: precios.precioBase,
        precio_contado: precios.contado,
        precio_debito: precios.debito,
        precio_regular: precios.regular,
        fecha_compra: p.fecha_compra ? new Date(p.fecha_compra).toISOString() : null,
        fecha_modificacion: p.fecha_modificacion ? new Date(p.fecha_modificacion).toISOString() : null,
      };
    });

    return NextResponse.json({
      productos: productosConPrecios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error en API:', error);
    return NextResponse.json({ 
      error: 'Error al cargar productos',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}