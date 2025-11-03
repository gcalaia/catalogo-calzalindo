import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Obtener todas las marcas que tienen productos activos
    const marcas = await prisma.prod_marcas.findMany({
      where: {
        productos: {
          some: {
            activo: true
          }
        }
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Obtener todos los rubros que tienen productos activos
    const rubros = await prisma.prod_rubros.findMany({
      where: {
        productos: {
          some: {
            activo: true
          }
        }
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Obtener todos los subrubros que tienen productos activos
    const subrubros = await prisma.prod_subrubros.findMany({
      where: {
        productos: {
          some: {
            activo: true
          }
        }
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Obtener todas las líneas que tienen productos activos
    const lineas = await prisma.prod_lineas.findMany({
      where: {
        productos: {
          some: {
            activo: true
          }
        }
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json({
      marcas,
      rubros,
      subrubros,
      lineas
    });

  } catch (error) {
    console.error('Error al cargar filtros:', error);
    return NextResponse.json(
      { error: 'Error al cargar filtros' },
      { status: 500 }
    );
  }
}
