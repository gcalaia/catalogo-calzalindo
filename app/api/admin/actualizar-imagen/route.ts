import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { codigo, imagen_url } = await request.json();

    if (!codigo || !imagen_url) {
      return NextResponse.json(
        { error: 'Código e imagen_url requeridos' },
        { status: 400 }
      );
    }

    // Actualizar todos los productos con ese código
    const resultado = await prisma.producto.updateMany({
      where: { codigo: parseInt(codigo) },
      data: { imagen_url }
    });

    return NextResponse.json({
      success: true,
      actualizados: resultado.count,
      codigo,
      imagen_url
    });

  } catch (error) {
    console.error('Error actualizando imagen:', error);
    return NextResponse.json(
      { error: 'Error al actualizar imagen' },
      { status: 500 }
    );
  }
}
