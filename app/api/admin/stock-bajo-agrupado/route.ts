// app/api/admin/stock-bajo-agrupado/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: {
        stock_disponible: { lte: 3, gt: 0 },
        rubro: { in: ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'] },
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        imagen_url: true,
        marca_descripcion: true,
        rubro: true,
        color: true,
        talla: true,
        stock_disponible: true,
        familia_id: true,
        precio_lista: true,
      },
      take: 1000,
      orderBy: [
        { stock_disponible: 'asc' },
        { id: 'desc' }
      ]
    });

    // Agrupar por familia
    const familias = new Map<string, any>();
    
    for (const p of productos) {
      const familiaKey = p.familia_id || `${p.codigo}`;
      
      if (!familias.has(familiaKey)) {
        familias.set(familiaKey, {
          familia_id: familiaKey,
          nombre: p.nombre.split(/\s+/).slice(0, 5).join(' '),
          marca: p.marca_descripcion,
          rubro: p.rubro,
          precio_lista: p.precio_lista,
          colores: new Map(),
          stockTotal: 0,
          stockMinimo: p.stock_disponible,
        });
      }
      
      const fam = familias.get(familiaKey)!;
      
      // Agrupar por color
      if (!fam.colores.has(p.color || 'Sin color')) {
        fam.colores.set(p.color || 'Sin color', {
          color: p.color || 'Sin color',
          talles: []
        });
      }
      
      const colorData = fam.colores.get(p.color || 'Sin color');
      colorData.talles.push({
        talla: p.talla,
        stock: p.stock_disponible
      });
      
      fam.stockTotal += p.stock_disponible;
      if (p.stock_disponible < fam.stockMinimo) {
        fam.stockMinimo = p.stock_disponible;
      }
    }

    const resultado = Array.from(familias.values()).map(f => ({
      familia_id: f.familia_id,
      nombre: f.nombre,
      marca: f.marca,
      rubro: f.rubro,
      precio_lista: f.precio_lista,
      colores: Array.from(f.colores.values()),
      stockTotal: f.stockTotal,
      stockMinimo: f.stockMinimo,
    }));

    // Ordenar por stock mínimo
    resultado.sort((a, b) => a.stockMinimo - b.stockMinimo);

    return NextResponse.json({
      total: resultado.length,
      totalProductos: productos.length,
      productos: resultado,
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al buscar productos con stock bajo' },
      { status: 500 }
    );
  }
}
