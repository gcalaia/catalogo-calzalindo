import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para verificar si una URL de imagen es válida
async function verificarImagen(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Función para generar URL de imagen
function generarUrlImagen(familiaId: string | null, codigo: number): string {
  const familiaIdPadded = String(familiaId || '0000000').padStart(7, '0');
  const codigoPadded = String(codigo).padStart(13, '0');
  const imagePath = `imagenes_macroges/0001AR${familiaIdPadded}-${codigoPadded}000001.jpg`;
  return `/api/img?p=${encodeURIComponent(imagePath)}`;
}

async function poblarImagenes() {
  try {
    console.log('🚀 Iniciando poblado de tabla producto_imagenes...\n');

    // Obtener productos activos sin imagen registrada
    const productos = await prisma.productos.findMany({
      where: {
        activo: true,
      },
      select: {
        id: true,
        familia_id: true,
        nombre: true,
        nombre_mg: true,
      },
      take: 100, // Procesar solo 100 para prueba
    });

    console.log(`📊 Encontrados ${productos.length} productos para procesar\n`);

    let exitosos = 0;
    let sinImagen = 0;
    let errores = 0;

    for (const producto of productos) {
      try {
        // Generar URL de imagen
        const urlImagen = generarUrlImagen(producto.familia_id, producto.id);
        const urlCompleta = `http://localhost:3000${urlImagen}`;

        // Verificar si la imagen existe
        const imagenValida = await verificarImagen(urlCompleta);

        if (imagenValida) {
          // Verificar si ya existe una imagen para este producto
          const imagenExistente = await prisma.$queryRaw`
            SELECT id FROM producto_imagenes 
            WHERE producto_id = ${producto.id}
            LIMIT 1
          ` as any[];

          if (imagenExistente.length === 0) {
            // Insertar en producto_imagenes
            await prisma.$executeRaw`
              INSERT INTO producto_imagenes (
                producto_id, 
                url, 
                orden, 
                es_principal, 
                activo,
                fecha_creacion,
                fecha_actualizacion
              ) VALUES (
                ${producto.id},
                ${urlImagen},
                1,
                true,
                true,
                NOW(),
                NOW()
              )
            `;

            exitosos++;
            
            if (exitosos % 50 === 0) {
              console.log(`✅ Procesados ${exitosos} productos con imagen válida...`);
            }
          }
        } else {
          sinImagen++;
        }
      } catch (error) {
        console.error(`❌ Error en producto ${producto.id}:`, error);
        errores++;
      }
    }

    console.log('\n🎉 Proceso completado!');
    console.log(`✅ Imágenes registradas: ${exitosos}`);
    console.log(`⚠️  Sin imagen válida: ${sinImagen}`);
    console.log(`❌ Errores: ${errores}`);

    // Estadísticas finales
    const totalImagenes = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM producto_imagenes
    ` as any[];

    console.log(`\n📊 Total de imágenes en la tabla: ${totalImagenes[0].total}`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
poblarImagenes();
