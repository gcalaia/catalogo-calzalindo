import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const API_IMAGEN_URL = 'http://200.58.109.125:8007/api/imagen';

export async function POST(request: Request) {
  try {
    const { limite = 500, offset = 0 } = await request.json();

    const productos = await prisma.producto.findMany({
      where: {
        imagen_url: null,
        stock_disponible: { gt: 0 },
        rubro: { in: ['DAMAS', 'HOMBRES', 'NIÑOS', 'NIÑAS', 'UNISEX'] }
      },
      select: {
        codigo: true,
      },
      distinct: ['codigo'],
      skip: offset,
      take: limite,
      orderBy: { stock_disponible: 'desc' }
    });

    console.log(`Procesando ${productos.length} codigos (offset: ${offset})...`);

    const resultados = {
      procesados: 0,
      exitosos: 0,
      sinImagen: 0,
      errores: 0,
      detalles: [] as any[]
    };

    const BATCH_SIZE = 10;
    for (let i = 0; i < productos.length; i += BATCH_SIZE) {
      const batch = productos.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (producto) => {
          resultados.procesados++;
          
          try {
            const res = await fetch(`${API_IMAGEN_URL}/${producto.codigo}`, {
              signal: AbortSignal.timeout(5000)
            });
            
            if (!res.ok) {
              resultados.sinImagen++;
              return;
            }

            const data = await res.json();
            
            if (data.url_absoluta) {
              const match = data.url_absoluta.match(/\/imagenes\/(.+)$/);
              if (match) {
                const proxyUrl = `/proxy/imagen/${match[1]}`;
                
                const result = await prisma.producto.updateMany({
                  where: { codigo: producto.codigo },
                  data: { imagen_url: proxyUrl }
                });
                
                resultados.exitosos++;
                resultados.detalles.push({
                  codigo: producto.codigo,
                  url: proxyUrl,
                  actualizados: result.count
                });
                
                console.log(`OK ${producto.codigo} -> ${result.count} productos`);
              }
            } else {
              resultados.sinImagen++;
            }
          } catch (error: any) {
            resultados.errores++;
            console.error(`Error codigo ${producto.codigo}:`, error.message);
          }
        })
      );

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const mensaje = `Exitosos: ${resultados.exitosos}, Sin imagen: ${resultados.sinImagen}, Errores: ${resultados.errores}, Total: ${resultados.procesados}`;

    console.log(mensaje);

    return NextResponse.json({
      success: true,
      ...resultados,
      mensaje,
      siguienteOffset: offset + limite
    });

  } catch (error) {
    console.error('Error critico:', error);
    return NextResponse.json(
      { error: 'Error al migrar imagenes' },
      { status: 500 }
    );
  }
}
