import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para generar slug único
function generarSlug(nombre: string, id: number): string {
  let slug = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno solo
    .substring(0, 200); // Máximo 200 caracteres

  // Si el slug queda vacío, usar el ID
  if (!slug) {
    slug = `producto-${id}`;
  }

  return slug;
}

// Función para generar keywords
function generarKeywords(producto: any): string {
  const keywords: string[] = [];

  // Agregar nombre
  if (producto.nombre) {
    keywords.push(producto.nombre);
  }

  // Agregar marca
  if (producto.prod_marcas?.nombre) {
    keywords.push(producto.prod_marcas.nombre);
  }

  // Agregar rubro
  if (producto.prod_rubros?.nombre) {
    keywords.push(producto.prod_rubros.nombre);
  }

  // Agregar subrubro
  if (producto.prod_subrubros?.nombre) {
    keywords.push(producto.prod_subrubros.nombre);
  }

  // Agregar taxonomía
  if (producto.prod_taxonomias?.nombre) {
    keywords.push(producto.prod_taxonomias.nombre);
  }

  // Agregar línea
  if (producto.prod_lineas?.nombre) {
    keywords.push(producto.prod_lineas.nombre);
  }

  // Extraer palabras clave del nombre
  if (producto.nombre) {
    const palabras = producto.nombre.split(' ').filter((p: string) => p.length > 3);
    keywords.push(...palabras);
  }

  // Eliminar duplicados y unir
  return [...new Set(keywords)]
    .filter(k => k && k.length > 0)
    .join(', ')
    .toLowerCase();
}

// Función para generar meta description
function generarMetaDescription(producto: any): string {
  const parts: string[] = [];

  if (producto.nombre) {
    parts.push(producto.nombre);
  }

  if (producto.prod_marcas?.nombre) {
    parts.push(`de ${producto.prod_marcas.nombre}`);
  }

  if (producto.prod_taxonomias?.nombre) {
    parts.push(`- ${producto.prod_taxonomias.nombre}`);
  }

  if (producto.prod_lineas?.nombre) {
    parts.push(`${producto.prod_lineas.nombre}`);
  }

  let description = parts.join(' ');

  // Agregar llamado a la acción
  description += '. ¡Comprá ahora con los mejores precios y envíos a todo el país!';

  // Limitar a 160 caracteres (óptimo para SEO)
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  return description;
}

// Script principal
async function completarDatos() {
  try {
    console.log('🚀 Iniciando script de completado de datos...\n');

    // Obtener productos sin slug, keywords o meta_description
    const productos = await prisma.productos.findMany({
      where: {
        OR: [
          { slug: null },
          { keywords: null },
          { meta_description: null },
        ],
        activo: true,
      },
      include: {
        prod_marcas: true,
        prod_rubros: true,
        prod_subrubros: true,
        prod_taxonomias: true,
        prod_lineas: true,
      },
      take: 1000, // Procesar de a 1000
    });

    console.log(`📊 Encontrados ${productos.length} productos para procesar\n`);

    let actualizados = 0;
    let errores = 0;

    for (const producto of productos) {
      try {
        const updates: any = {};

        // Generar slug si no existe
        if (!producto.slug) {
          let slug = generarSlug(producto.nombre || `producto-${producto.id}`, producto.id);
          
          // Verificar que sea único
          let slugFinal = slug;
          let contador = 1;
          while (true) {
            const existe = await prisma.productos.findUnique({
              where: { slug: slugFinal },
            });
            if (!existe || existe.id === producto.id) break;
            slugFinal = `${slug}-${contador}`;
            contador++;
          }
          
          updates.slug = slugFinal;
        }

        // Generar keywords si no existen
        if (!producto.keywords) {
          updates.keywords = generarKeywords(producto);
        }

        // Generar meta_description si no existe
        if (!producto.meta_description) {
          updates.meta_description = generarMetaDescription(producto);
        }

        // Actualizar fecha de actualización
        updates.fecha_actualizacion = new Date();

        // Guardar cambios
        if (Object.keys(updates).length > 0) {
          await prisma.productos.update({
            where: { id: producto.id },
            data: updates,
          });

          actualizados++;

          if (actualizados % 100 === 0) {
            console.log(`✅ Procesados ${actualizados} productos...`);
          }
        }
      } catch (error) {
        console.error(`❌ Error en producto ${producto.id}:`, error);
        errores++;
      }
    }

    console.log('\n🎉 Proceso completado!');
    console.log(`✅ Productos actualizados: ${actualizados}`);
    console.log(`❌ Errores: ${errores}`);

    // Mostrar estadísticas
    const stats = await prisma.productos.aggregate({
      where: { activo: true },
      _count: {
        slug: true,
        keywords: true,
        meta_description: true,
      },
    });

    console.log('\n📊 Estadísticas finales:');
    console.log(`- Productos con slug: ${stats._count.slug}`);
    console.log(`- Productos con keywords: ${stats._count.keywords}`);
    console.log(`- Productos con meta_description: ${stats._count.meta_description}`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
completarDatos();
