// lib/colorMap.ts
// Mapeo de nombres de colores comunes en calzado a códigos hexadecimales

export const COLOR_MAP: Record<string, string> = {
  // BÁSICOS
  'NEGRO': '#000000',
  'BLANCO': '#FFFFFF',
  'GRIS': '#808080',
  'MARRON': '#8B4513',
  'BEIGE': '#F5F5DC',
  
  // MARRONES Y NATURALES
  'CAMEL': '#C19A6B',
  'COGNAC': '#9F5733',
  'CHOCOLATE': '#3D2817',
  'CUERO': '#C19A6B',
  'SUELA': '#D2B48C',
  'ARENA': '#E6D7B8',
  'TOSTADO': '#A0826D',
  'TAUPE': '#B38B6D',
  'CARAMELO': '#AF6E4D',
  
  // GRISES
  'GRIS CLARO': '#D3D3D3',
  'GRIS OSCURO': '#4B4B4B',
  'PLOMO': '#71797E',
  'GRAFITO': '#383838',
  
  // AZULES
  'AZUL': '#1E40AF',
  'MARINO': '#001F3F',
  'NAVY': '#001F3F',
  'CELESTE': '#87CEEB',
  'PETROLEO': '#2C5F70',
  
  // ROJOS Y ROSAS
  'ROJO': '#DC2626',
  'BORDO': '#8B0000',
  'VINO': '#722F37',
  'ROSA': '#EC4899',
  'FUCSIA': '#FF00FF',
  
  // VERDES
  'VERDE': '#16A34A',
  'MILITAR': '#4B5320',
  'OLIVA': '#808000',
  'MENTA': '#98FF98',
  
  // METÁLICOS
  'DORADO': '#FFD700',
  'PLATEADO': '#C0C0C0',
  'ORO': '#FFD700',
  'PLATA': '#C0C0C0',
  'BRONCE': '#CD7F32',
  'COBRE': '#B87333',
  
  // COLORES ESPECIALES
  'NUDE': '#E8BEAC',
  'PIEL': '#E8BEAC',
  'NARANJA': '#F97316',
  'AMARILLO': '#FCD34D',
  'VIOLETA': '#8B5CF6',
  'PURPURA': '#9333EA',
  'TURQUESA': '#14B8A6',
  
  // COMBINADOS (se muestra el color principal)
  'NEGRO/BLANCO': '#000000',
  'BLANCO/NEGRO': '#FFFFFF',
  'MARRON/BEIGE': '#8B4513',
  'GRIS/NEGRO': '#808080',
  
  // DEFAULT para colores no mapeados
  'DEFAULT': '#9CA3AF'
};

/**
 * Obtiene el código hexadecimal de un color por su nombre
 * @param colorName - Nombre del color (ej: "NEGRO", "Camel", "azul marino")
 * @returns Código hexadecimal del color
 */
export function getColorHex(colorName: string): string {
  if (!colorName) return COLOR_MAP['DEFAULT'];
  
  // Normalizar: mayúsculas y sin espacios extra
  const normalized = colorName.toUpperCase().trim();
  
  // Buscar coincidencia exacta
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }
  
  // Buscar coincidencia parcial (ej: "AZUL OSCURO" → buscar "AZUL")
  const partialMatch = Object.keys(COLOR_MAP).find(key => 
    normalized.includes(key) || key.includes(normalized)
  );
  
  if (partialMatch) {
    return COLOR_MAP[partialMatch];
  }
  
  return COLOR_MAP['DEFAULT'];
}

/**
 * Obtiene el estilo CSS para colores complejos (bicolor, gradientes, etc.)
 * @param colorName - Nombre del color
 * @returns Objeto con estilos CSS
 */
export function getColorStyle(colorName: string): React.CSSProperties {
  if (!colorName) return { backgroundColor: COLOR_MAP['DEFAULT'] };
  
  const normalized = colorName.toUpperCase().trim();
  
  // BICOLOR con "/"
  if (normalized.includes('/')) {
    const colors = normalized.split('/').map(c => getColorHex(c.trim()));
    return {
      background: `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`
    };
  }
  
  // ANIMAL PRINT / LEOPARDO
  if (normalized.includes('ANIMAL') || normalized.includes('LEOPARDO') || normalized.includes('JAGUAR')) {
    return {
      backgroundColor: '#D2691E',
      backgroundImage: `
        radial-gradient(circle at 20% 50%, #8B4513 5px, transparent 5px),
        radial-gradient(circle at 60% 20%, #654321 4px, transparent 4px),
        radial-gradient(circle at 80% 70%, #8B4513 6px, transparent 6px)
      `,
      backgroundSize: '30px 30px'
    };
  }
  
  // CEBRA / RAYAS
  if (normalized.includes('CEBRA') || normalized.includes('RAYAS')) {
    return {
      background: 'repeating-linear-gradient(45deg, #000 0px, #000 8px, #fff 8px, #fff 16px)'
    };
  }
  
  // MULTICOLOR
  if (normalized.includes('MULTI') || normalized.includes('VARIOS')) {
    return {
      background: 'linear-gradient(90deg, #FF0000 0%, #FFA500 20%, #FFFF00 40%, #00FF00 60%, #0000FF 80%, #800080 100%)'
    };
  }
  
  // Color sólido normal
  return {
    backgroundColor: getColorHex(normalized)
  };
}

/**
 * Determina si un color es oscuro (para ajustar el color del texto)
 * @param hex - Código hexadecimal del color
 * @returns true si el color es oscuro
 */
export function isColorDark(hex: string): boolean {
  // Convertir hex a RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Calcular luminosidad
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance < 0.5;
}
