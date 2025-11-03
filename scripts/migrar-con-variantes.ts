import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ImagenData {
  codigo_barras: string;
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

      // Parsear CSV - ajustar según el separador real
      let columnas = linea.split(',');
      
      if (columnas.length < 7) {
        columnas = linea.split(';');
      }
      
      if (columnas.length < 7) {
        columnas = linea.split('\t');
      }

      if (columnas.length >= 7) {
        // Columna B (índice 1) es el código de barras según el Excel
        const img = {
          codigo_barras: columnas[1].trim().replace(/"/g, ''), // Columna B (Cod.Barras)
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
  const imagePath = `imagenes_2025/${year}/${month}/${day}/${nro_imagen}`;
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
    console.log('🚀 Iniciando PRUEBA de migración con variantes...\n');

    // 1. Verificar servidor
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

    // 2. Leer CSV
    const rutaArchivo = path.join(process.cwd(), 'data', 'imagenes.csv');
    console.log('📂 Buscando archivo de imágenes...');
    
    const imagenesData = leerArchivoImagenes(rutaArchivo);
    
    if (imagenesData.length === 0) {
      console.error('\n❌ No se encontraron datos');
      return;
    }

    console.log(`\n✅ Encontradas ${imagenesData.length} imágenes\n`);

    // 3. Crear mapa: codigo_barras → imagen
    const mapaImagenes = new Map<string, ImagenData>();
    imagenesData.forEach(img => {
      mapaImagenes.set(img.codigo_barras, img);
    });

    console.log(`📊 Mapa creado con ${mapaImagenes.size} códigos de barras únicos\n`);

    // 4. Obtener variantes de productos (las primeras 10)
    console.log('📦 Obteniendo variantes de prueba...\n');
    
    const variantes = await prisma.$queryRaw`
      SELECT 
        pv.id as variante_id,
        pv.producto_id,
        pv.codigo_barras,
        pv.color,
        pv.talle,
        p.nombre as producto_nombre
      FROM producto_variantes pv
      INNER JOIN productos p ON p.id = pv.producto_id
      WHERE pv.codigo_barras IS NOT NULL
      AND p.activo = true
      LIMIT 10
    ` as any[];

    console.log(`✅ Obtenidas ${variantes.length} variantes\n`);
    console.log('='.repeat(80));

    let exitosos = 0;
    let sinMapeo = 0;
    let sinImagen = 0;
    let errores = 0;

    for (let i = 0; i < variantes.length; i++) {
      const variante = variantes[i];

      console.log(`\n📦 Variante ${i + 1}/${variantes.length}:`);
      console.log(`   Variante ID: ${variante.variante_id}`);
      console.log(`   Producto ID: ${variante.producto_id}`);
      console.log(`   Producto: ${variante.producto_nombre}`);
      console.log(`   Color: ${variante.color}`);
      console.log(`   Talle: ${variante.talle}`);
      console.log(`   Código Barras: ${variante.codigo_barras}`);

      try {
        // Verificar si ya tiene imagen
        const imagenExistente = await prisma.$queryRaw`
          SELECT id FROM producto_imagenes 
          WHERE producto_id = ${variante.producto_id}
          AND (variante_id = ${variante.variante_id} OR variante_id IS NULL)
          LIMIT 1
        ` as any[];

        if (imagenExistente.length > 0) {
          console.log(`   ✅ Ya tiene imagen registrada`);
          continue;
        }

        // Buscar en el mapa por código de barras
        const imagenData = mapaImagenes.get(variante.codigo_barras);

        if (!imagenData) {
          sinMapeo++;
          console.log(`   ⚠️  Código de barras NO encontrado en CSV`);
          continue;
        }

        console.log(`   ✅ Encontrado en CSV!`);
        console.log(`      Archivo: ${imagenData.nro_imagen}`);
        console.log(`      Fecha: ${imagenData.year}/${imagenData.month}/${imagenData.day}`);

        // Construir URL
        const urlImagen = construirUrlImagen(imagenData);
        console.log(`   🔗 URL construida: ${urlImagen}`);

        // Verificar imagen
        const imagenValida = await verificarImagen(urlImagen);

        if (!imagenValida) {
          sinImagen++;
          console.log(`   ❌ La imagen NO existe en el servidor`);
          continue;
        }

        console.log(`   ✅ Imagen válida!`);
        console.log(`   💾 Insertando...`);

        // Insertar en producto_imagenes
        await prisma.$executeRaw`
          INSERT INTO producto_imagenes (
            producto_id,
            variante_id,
            url, 
            orden, 
            es_principal, 
            activo,
            fecha_creacion,
            fecha_actualizacion
          ) VALUES (
            ${variante.producto_id},
            ${variante.variante_id},
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
      console.log('💡 Podés ejecutar el script completo eliminando el LIMIT');
    } else {
      console.log('\n⚠️  No se registraron imágenes');
      console.log('💡 Revisá los mensajes arriba');
    }

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
migrarImagenesPrueba();
