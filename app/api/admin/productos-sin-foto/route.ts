import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: {
        stock_disponible: { gt: 0 },
        rubro: { in: ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'] },
        OR: [
          { imagen_url: null },
          { imagen_url: '' },
          { imagen_url: { contains: 'evirtual.calzalindo.com.ar:58000' } },
          { imagen_url: { contains: '0000000000000' } },
          { imagen_url: { endsWith: '000000000001.jpg' } },
          { imagen_url: { contains: 'no_image' } },
          { imagen_url: { contains: 'placeholder' } },
        ],
        NOT: {
          imagen_url: { startsWith: '/proxy/imagen/' }
        }
      },
      select: {
        id: true,
        codigo: true, // ← IMPORTANTE: necesitamos el código
        nombre: true,
        imagen_url: true,
        marca_descripcion: true,
        rubro: true,
        color: true,
        talla: true,
        stock_disponible: true,
        familia_id: true,
      },
      take: 500,
      orderBy: { stock_disponible: 'desc' }
    });

    console.log(`✅ Encontrados ${productos.length} productos con imágenes inválidas`);

    // Agrupar por familia
    const familias = new Map<string, any>();
    
    for (const p of productos) {
      const familiaKey = p.familia_id || `${p.codigo}`;
      
      if (!familias.has(familiaKey)) {
        familias.set(familiaKey, {
          familia_id: familiaKey,
          codigo: p.codigo, // ← NUEVO: guardar el código real
          nombre: p.nombre.split(/\s+/).slice(0, 5).join(' '),
          marca: p.marca_descripcion,
          rubro: p.rubro,
          imagen_url: p.imagen_url,
          colores: new Set(),
          talles: []
        });
      }
      
      const fam = familias.get(familiaKey)!;
      if (p.color) fam.colores.add(p.color);
      fam.talles.push({ talla: p.talla, stock: p.stock_disponible });
    }

    const resultado = Array.from(familias.values()).map(f => ({
      ...f,
      colores: Array.from(f.colores),
      talles: f.talles.slice(0, 5)
    }));

    return NextResponse.json({
      total: resultado.length,
      totalProductos: productos.length,
      productos: resultado,
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Error al buscar productos sin imagen' },
      { status: 500 }
    );
  }
}
