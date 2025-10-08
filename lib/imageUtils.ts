// lib/imageUtils.ts

interface Producto {
  codigo?: string;
  imagen_url?: string;
  imagen_path?: string;
  year?: string;
  month?: string;
  day?: string;
  nombre?: string;
}

/**
 * Construye la URL de la imagen basándose en el producto
 * Prioridad:
 * 1. Si tiene imagen_url completa, usarla
 * 2. Si tiene imagen_path, construir URL
 * 3. Si tiene código y fecha, construir path
 * 4. Fallback a placeholder
 */
export function getImageUrl(producto: Producto): string {
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || 'http://200.58.109.125:8080/img';
  
  // Si ya tiene URL completa
  if (producto.imagen_url?.startsWith('http')) {
    return producto.imagen_url;
  }
  
  // Si tiene path relativo
  if (producto.imagen_path) {
    return `${baseUrl}/${producto.imagen_path}`;
  }
  
  // Si tiene código y datos de fecha
  if (producto.codigo) {
    // Valores por defecto basados en tu estructura actual
    const year = producto.year || '2025';
    const month = producto.month?.padStart(2, '0') || '01';
    const day = producto.day?.padStart(2, '0') || '04';
    
    // Formato del archivo: codigo + 000001.webp
    const filename = `${producto.codigo}000001.webp`;
    
    return `${baseUrl}/${year}/${month}/${day}/${filename}`;
  }
  
  // Fallback a placeholder
  return '/placeholder.jpg';
}

/**
 * Verifica si una imagen existe (útil para debugging)
 */
export async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Obtiene múltiples URLs de imagen para un producto (si tiene varias fotos)
 */
export function getMultipleImageUrls(producto: Producto, maxImages: number = 5): string[] {
  const urls: string[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || 'http://200.58.109.125:8080/img';
  
  if (!producto.codigo) {
    return [getImageUrl(producto)];
  }
  
  const year = producto.year || '2025';
  const month = producto.month?.padStart(2, '0') || '01';
  const day = producto.day?.padStart(2, '0') || '04';
  
  // Generar URLs para múltiples imágenes (000001, 000002, etc.)
  for (let i = 1; i <= maxImages; i++) {
    const imageNumber = i.toString().padStart(6, '0');
    const filename = `${producto.codigo}${imageNumber}.webp`;
    urls.push(`${baseUrl}/${year}/${month}/${day}/${filename}`);
  }
  
  return urls;
}

/**
 * Construye URL de thumbnail (misma imagen por ahora)
 */
export function getThumbnailUrl(producto: Producto): string {
  // Por ahora usa la misma imagen
  // En el futuro podrías tener una carpeta /thumbnails/
  return getImageUrl(producto);
}
