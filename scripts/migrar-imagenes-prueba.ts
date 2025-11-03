import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ImagenData {
  codigo: string;
  nro_imagen: string;
  year: string;
  month: string;
  day: string;
}

// Función para leer el archivo CSV/Excel
function leerArchivoImagenes(rutaArchivo: string): ImagenData[] {
  try {
    console.log(`📂 Intentando leer: ${rutaArchivo}`);
    
    if (!fs.existsSync(rutaArchivo)) {
      console.error(`❌ El archivo no existe: ${rutaArchivo}`);
      return [];
    }

    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    const lineas = contenido.split('\n');
    const imagenes: ImagenData[] = [];

    console.log(`📄 Archivo leído. Total de líneas: ${lineas.length}`);
    console.log(`📋 Primera línea (header): ${lineas[0]}`);

    // Saltar la primera línea (encabezados)
    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (!linea) continue;

      // Parsear CSV - ajustar según el separador real (puede ser ; en vez de ,)
      let columnas = linea.split(',');
      
      // Si no funciona con coma, probar con punto y coma
      if (columnas.length < 7) {
        columnas = linea.split(';');
      }
      
      // Si no funciona con punto y coma, probar con tab
      if (columnas.length < 7) {
        columnas = linea.split('\t');
      }

      if (columnas.length >= 7) {
        const img = {
          codigo: columnas[0].trim().replace(/"/g, ''), // Columna A - quitar comillas
          nro_imagen: columnas[2].trim().replace(/"/g, ''), // Columna C
          year: columnas[4].trim().replace(/"/g, ''), // Columna E
          month: columnas[5].trim().replace(/"/g, ''), // Columna F
          day: columnas[6].trim().replace(/"/g, ''), // Columna G
        };

        imagenes.push(img);

        // Mostrar los primeros 3 para debug
        if (imagenes.length <= 3) {
          console.log(`   Imagen ${imagenes.length}:`, img);
        }
      }
    }

    return imagenes;
  } catch (error) {
    console.error('❌ Error al leer el archivo:', error);
    return [];
  }
}

// Función para construir la URL de la imagen
function construirUrlImagen(imagen: ImagenData): string {
  const { year, month, day, nro_imagen } = imagen;
  
  // Patrón: /mnt/imagenes_2025/{year}/{month}/{day}/{nro_imagen}
  const imagePath = `imagenes_2025/${year}/${month}/${day}/${nro_imagen}`;
  
  // Retornar URL para el endpoint de API
  return `/api/img?p=${encodeURIComponent(imagePath)}`;
}

// Función para verificar si la imagen existe
async function verificarImagen(url: string): Promise<boolean> {
  try {
    const baseUrl = 'http://localhost:3000';
    const urlCompleta = `${baseUrl}${url}`;
    
    console.log(`      🔍 Verificando: ${urlCompleta}`);
    
    const response = await fetch(urlCompleta, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    console.log(`      ${response.ok ? '✅' : '❌'} Status: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.log(`      ❌ Error al verificar: ${error}`);
    return false;
  }
}

async function migrarImagenesPrueba() {
  try {
    console.log('🚀 Iniciando PRUEBA de migración (solo 10 productos)...\n');

    // 1. Verificar que el servidor esté corriendo
    console.log('🔍 Verificando servidor...');
    try {
      const response = await fetch('http://localhost:3000', {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok && response.status !== 404) {
        throw new Error('Servidor no responde');
      }
      console.log('✅ Servidor corriendo\n');
    } catch {
      console.error('❌ ERROR: El servidor NO está corriendo');
      console.log('💡 Ejecutá: npm run dev\n');
      process.exit(1);
    }

    // 2. Leer el archivo CSV
    const rutaArchivo = path.join(process.cwd(), 'data', 'imagenes.csv');
    console.log('📂 Buscando archivo de imágenes...');
    
    const imagenesData = leerArchivoImagenes(rutaArchivo);
    
    if (imagenesData.length === 0) {
      console.error('\n❌ No se encontraron datos de imágenes');
      console.log('\n💡 Pasos:');
      console.log('   1. Exportá el Excel como CSV');
      console.log('   2. Guardalo en: /data/imagenes.csv');
      console.log('   3. Verificá el formato del CSV\n');
      return;
    }

    console.log(`\n✅ Encontradas ${imagenesData.length} imágenes en el archivo\n`);

    // 3. Crear mapa de imágenes
    const mapaImagenes = new Map<string, ImagenData>();
    imagenesData.forEach(img => {
      mapaImagenes.set(img.codigo, img);
    });

    // 4. Obtener solo 10 productos para probar
    console.log('📦 Obteniendo 10 productos de prueba...\n');
    
    const productos = await prisma.productos.findMany({
      where: {
        activo: true,
      },
      select: {
        id: true,
        familia_id: true,
        nombre: true,
      },
      take: 10, // ⭐ SOLO 10 PRODUCTOS
    });

    console.log(`✅ Obtenidos ${productos.length} productos\n`);
    console.log('='.repeat(80));

    let exitosos = 0;
    let sinMapeo = 0;
    let sinImagen = 0;
    let errores = 0;

    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];

      console.log(`\n📦 Producto ${i + 1}/${productos.length}:`);
      console.log(`   ID: ${producto.id}`);
      console.log(`   Familia ID: ${producto.familia_id}`);
      console.log(`   Nombre: ${producto.nombre}`);

      try {
        // Verificar si ya tiene imagen
        const imagenExistente = await prisma.$queryRaw`
          SELECT id FROM producto_imagenes 
          WHERE producto_id = ${producto.id}
          LIMIT 1
        ` as any[];

        if (imagenExistente.length > 0) {
          console.log(`   ✅ Ya tiene imagen registrada`);
          continue;
        }

        // Intentar diferentes formas de mapeo
        let imagenData: ImagenData | undefined;
        let metodoMapeo = '';
        
        // Opción 1: Buscar por ID directo
        imagenData = mapaImagenes.get(producto.id.toString());
        if (imagenData) metodoMapeo = 'ID directo';
        
        // Opción 2: Buscar por familia_id sin los últimos 4 dígitos
        if (!imagenData && producto.familia_id) {
          const codigoCorto = producto.familia_id.substring(0, producto.familia_id.length - 4);
          imagenData = mapaImagenes.get(codigoCorto);
          if (imagenData) metodoMapeo = `Familia ID corto (${codigoCorto})`;
        }
        
        // Opción 3: Buscar por familia_id completo
        if (!imagenData && producto.familia_id) {
          imagenData = mapaImagenes.get(producto.familia_id);
          if (imagenData) metodoMapeo = 'Familia ID completo';
        }

        if (!imagenData) {
          sinMapeo++;
          console.log(`   ⚠️  NO encontrado en CSV`);
          console.log(`      Intentó buscar:`);
          console.log(`      - Por ID: ${producto.id}`);
          if (producto.familia_id) {
            const codigoCorto = producto.familia_id.substring(0, producto.familia_id.length - 4);
            console.log(`      - Por Familia corto: ${codigoCorto}`);
            console.log(`      - Por Familia completo: ${producto.familia_id}`);
          }
          continue;
        }

        console.log(`   ✅ Encontrado en CSV (${metodoMapeo})`);
        console.log(`      Archivo: ${imagenData.nro_imagen}`);
        console.log(`      Fecha: ${imagenData.year}/${imagenData.month}/${imagenData.day}`);

        // Construir URL de imagen
        const urlImagen = construirUrlImagen(imagenData);
        console.log(`   🔗 URL construida: ${urlImagen}`);

        // Verificar que la imagen existe
        const imagenValida = await verificarImagen(urlImagen);

        if (!imagenValida) {
          sinImagen++;
          console.log(`   ❌ La imagen NO existe en el servidor`);
          continue;
        }

        console.log(`   ✅ Imagen válida encontrada!`);
        console.log(`   💾 Insertando en base de datos...`);

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
        console.log(`   ✅ ¡Insertado exitosamente!`);

      } catch (error) {
        console.error(`   ❌ Error: ${error}`);
        errores++;
      }

      console.log('─'.repeat(80));
    }

    // Estadísticas finales
    console.log('\n' + '='.repeat(80));
    console.log('🎉 PRUEBA COMPLETADA');
    console.log('='.repeat(80));
    console.log(`✅ Imágenes registradas: ${exitosos}`);
    console.log(`⚠️  Sin mapeo en CSV: ${sinMapeo}`);
    console.log(`❌ Sin imagen válida: ${sinImagen}`);
    console.log(`💥 Errores: ${errores}`);
    console.log('='.repeat(80));

    if (exitosos > 0) {
      console.log('\n✅ ¡La prueba fue exitosa!');
      console.log('💡 Si los resultados son buenos, ejecutá el script completo sin el límite de 10');
    } else {
      console.log('\n⚠️  No se registraron imágenes');
      console.log('💡 Revisá los mensajes de error arriba para identificar el problema');
    }

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
migrarImagenesPrueba();
