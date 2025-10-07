import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: {
        stock_disponible: { gt: 0 },
        // No podemos usar { precio_lista: null } porque el campo no es nullable en el schema.
        // Consideramos "sin precio" como <= 0
        OR: [
          { precio_lista: { lte: 0 } },
        ],
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        marca_descripcion: true,
        rubro: true,
        subrubro_nombre: true,
        stock_disponible: true,
        precio_lista: true,
        familia_id: true,
      },
      orderBy: [{ marca_descripcion: 'asc' }, { nombre: 'asc' }],
    });

    // Filtro defensivo por si existieran NULLs en DB aunque el schema no lo permita.
    const saneados = productos.filter(
      (p) => (p as any).precio_lista == null || p.precio_lista <= 0
    );

    return NextResponse.json({ productos: saneados });
  } catch (err) {
    console.error('GET /api/admin/sin-precio error:', err);
    return NextResponse.json({ productos: [] }, { status: 500 });
  }
}
