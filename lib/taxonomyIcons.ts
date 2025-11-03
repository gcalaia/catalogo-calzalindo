// lib/taxonomyIcons.ts
export const taxonomyIcons: Record<string, string> = {
  'Calzado Formal': '🎩',
  'Calzado Deportivo': '👟',
  'Calzado Urbano': '🚶',
  'Calzado Colegial': '🎒',
  'Calzado Bebé': '👶',
  'Accesorios': '🎁',
  'default': '👞'
};

export const lineaIcons: Record<string, string> = {
  'VERANO': '☀️',
  'INVIERNO': '❄️',
  'PRETEMPORADA': '🍂',
  'ATEMPORAL': '🔄',
  'COLEGIAL': '🎒',
  'default': '📅'
};

export function getTaxonomyIcon(taxonomia: string | null): string {
  if (!taxonomia) return taxonomyIcons.default;
  return taxonomyIcons[taxonomia] || taxonomyIcons.default;
}

export function getLineaIcon(linea: string | null): string {
  if (!linea) return lineaIcons.default;
  const lineaUpper = linea.toUpperCase();
  return lineaIcons[lineaUpper] || lineaIcons.default;
}

export function getTaxonomyColor(taxonomia: string | null): string {
  const colors: Record<string, string> = {
    'Calzado Formal': 'bg-purple-100 text-purple-700 border-purple-300',
    'Calzado Deportivo': 'bg-blue-100 text-blue-700 border-blue-300',
    'Calzado Urbano': 'bg-green-100 text-green-700 border-green-300',
    'Calzado Colegial': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Calzado Bebé': 'bg-pink-100 text-pink-700 border-pink-300',
    'Accesorios': 'bg-orange-100 text-orange-700 border-orange-300',
    'default': 'bg-gray-100 text-gray-700 border-gray-300'
  };
  
  if (!taxonomia) return colors.default;
  return colors[taxonomia] || colors.default;
}

export function getLineaColor(linea: string | null): string {
  const colors: Record<string, string> = {
    'VERANO': 'bg-amber-100 text-amber-700 border-amber-300',
    'INVIERNO': 'bg-cyan-100 text-cyan-700 border-cyan-300',
    'PRETEMPORADA': 'bg-orange-100 text-orange-700 border-orange-300',
    'ATEMPORAL': 'bg-slate-100 text-slate-700 border-slate-300',
    'COLEGIAL': 'bg-indigo-100 text-indigo-700 border-indigo-300',
    'default': 'bg-gray-100 text-gray-700 border-gray-300'
  };
  
  if (!linea) return colors.default;
  const lineaUpper = linea.toUpperCase();
  return colors[lineaUpper] || colors.default;
}
