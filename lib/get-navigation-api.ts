// lib/get-navigation-api.ts
import { type NavItem } from './navigation';

/**
 * Obtiene el árbol de navegación dinámicamente desde tu API
 * GENERA URLs CON PARÁMETROS (compatible con tu sistema actual)
 */
export async function getNavigationFromAPI(): Promise<NavItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const apiUrl = baseUrl ? `${baseUrl}/api/productos?only_filters=true` : '/api/productos?only_filters=true';
    
    const response = await fetch(apiUrl, { 
      cache: 'no-store',
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.error('Error obteniendo filtros:', response.status);
      return getFallbackNavigation();
    }

    const data = await response.json();
    const filtros = data.filtros || {};

    console.log('📊 Filtros obtenidos:', {
      marcas: filtros.marcas?.length || 0,
      taxonomias: filtros.taxonomias?.length || 0,
      lineas: filtros.lineas?.length || 0
    });

    const navigationTree: NavItem[] = [];

    // Iconos
    const rubroIconMap: Record<string, string> = {
      'DAMAS': '👩',
      'HOMBRES': '👨',
      'NIÑOS': '👦',
      'NIÑAS': '👧',
    };

    const taxonomiaIconMap: Record<string, string> = {
      'DEPORTIVO': '👟',
      'URBANO': '👞',
      'FORMAL': '👔',
      'CASUAL': '👟',
      'SANDALIAS': '🩴',
      'SANDALIA': '🩴',
      'BOTAS': '🥾',
      'BOTA': '🥾',
      'PANTUFLAS': '🏠',
      'ZAPATILLAS': '👟',
    };

    const lineaIconMap: Record<string, string> = {
      'RUNNING': '🏃',
      'TRAINING': '🏋️',
      'FUTBOL': '⚽',
      'FÚTBOL': '⚽',
      'BASKET': '🏀',
      'TENIS': '🎾',
      'OUTDOOR': '🥾',
      'SKATE': '🛹',
    };

    // ========================================
    // 1. CATEGORÍAS POR RUBRO
    // ========================================
    const rubros = [
      { value: 'DAMAS', label: 'Mujer' },
      { value: 'HOMBRES', label: 'Hombre' },
      { value: 'NIÑOS', label: 'Niños' },
      { value: 'NIÑAS', label: 'Niñas' },
    ];
    
    for (const rubro of rubros) {
      const icon = rubroIconMap[rubro.value] || '👤';

      const rubroItem: NavItem = {
        label: rubro.label,
        href: `/?rubro=${rubro.value}`, // ✅ URL con parámetros
        icon,
        children: [],
      };

      // Subcategorías por TAXONOMÍA
      if (filtros.taxonomias && filtros.taxonomias.length > 0) {
        const taxonomiaChildren: NavItem[] = [];
        
        const taxonomiasTop = filtros.taxonomias.slice(0, 8);
        
        for (const tax of taxonomiasTop) {
          const taxNombre = typeof tax === 'string' ? tax : tax.nombre;
          if (!taxNombre) continue;
          
          const taxNombreUpper = taxNombre.toUpperCase();
          const taxIcon = taxonomiaIconMap[taxNombreUpper] || '📦';
          
          taxonomiaChildren.push({
            label: taxNombre,
            href: `/?rubro=${rubro.value}&taxonomia=${encodeURIComponent(taxNombre)}`, // ✅ Parámetros
            icon: taxIcon,
          });
        }

        if (taxonomiaChildren.length > 0) {
          rubroItem.children!.push({
            label: 'Por Tipo',
            href: `/?rubro=${rubro.value}`,
            children: taxonomiaChildren,
          });
        }
      }

      // Subcategorías por LÍNEA
      if (filtros.lineas && filtros.lineas.length > 0) {
        const lineaChildren: NavItem[] = [];
        
        const lineasTop = filtros.lineas.slice(0, 8);
        
        for (const linea of lineasTop) {
          if (!linea) continue;
          
          const lineaUpper = linea.toUpperCase();
          const lineaIcon = lineaIconMap[lineaUpper] || '🏃';
          
          lineaChildren.push({
            label: linea,
            href: `/?rubro=${rubro.value}&linea=${encodeURIComponent(linea)}`, // ✅ Parámetros
            icon: lineaIcon,
          });
        }

        if (lineaChildren.length > 0) {
          rubroItem.children!.push({
            label: 'Por Deporte',
            href: `/?rubro=${rubro.value}`,
            children: lineaChildren,
          });
        }
      }

      // Marcas
      if (filtros.marcas && filtros.marcas.length > 0) {
        const marcasChildren: NavItem[] = filtros.marcas
          .slice(0, 6)
          .map((marca: string) => ({
            label: marca,
            href: `/?rubro=${rubro.value}&marca=${encodeURIComponent(marca)}`, // ✅ Parámetros
          }));

        if (marcasChildren.length > 0) {
          rubroItem.children!.push({
            label: 'Marcas',
            href: `/?rubro=${rubro.value}`,
            children: marcasChildren,
          });
        }
      }

      if (rubroItem.children && rubroItem.children.length > 0) {
        navigationTree.push(rubroItem);
      }
    }

    // ========================================
    // 2. MARCAS GLOBALES
    // ========================================
    if (filtros.marcas && filtros.marcas.length > 0) {
      const marcasTop = filtros.marcas.slice(0, 15);
      
      navigationTree.push({
        label: 'Marcas',
        href: '/marcas', // Mantener por si tienes una página de marcas
        icon: '⭐',
        children: marcasTop.map((marca: string) => ({
          label: marca,
          href: `/?marca=${encodeURIComponent(marca)}`, // ✅ Parámetros
        })),
      });
    }

    // ========================================
    // 3. DEPORTES GLOBALES
    // ========================================
    if (filtros.lineas && filtros.lineas.length > 0) {
      const deporteChildren: NavItem[] = filtros.lineas.map((linea: string) => {
        const lineaUpper = linea.toUpperCase();
        const lineaIcon = lineaIconMap[lineaUpper] || '🏃';
        
        return {
          label: linea,
          href: `/?linea=${encodeURIComponent(linea)}`, // ✅ Parámetros
          icon: lineaIcon,
        };
      });

      navigationTree.push({
        label: 'Deportes',
        href: '/',
        icon: '⚽',
        children: deporteChildren,
      });
    }

    // ========================================
    // 4. OFERTAS
    // ========================================
    navigationTree.push({
      label: 'Ofertas',
      href: '/?destacados=1', // ✅ Parámetros
      icon: '🔥',
      badge: 'HOT',
    });

    console.log('✅ Navegación construida:', navigationTree.length, 'categorías principales');
    
    return navigationTree;

  } catch (error) {
    console.error('❌ Error obteniendo navegación desde API:', error);
    return getFallbackNavigation();
  }
}

/**
 * Navegación fallback
 */
function getFallbackNavigation(): NavItem[] {
  console.warn('⚠️ Usando navegación fallback');
  
  return [
    {
      label: 'Mujer',
      href: '/?rubro=DAMAS',
      icon: '👩',
    },
    {
      label: 'Hombre',
      href: '/?rubro=HOMBRES',
      icon: '👨',
    },
    {
      label: 'Niños',
      href: '/?rubro=NIÑOS',
      icon: '👦',
    },
    {
      label: 'Niñas',
      href: '/?rubro=NIÑAS',
      icon: '👧',
    },
    {
      label: 'Ofertas',
      href: '/?destacados=1',
      icon: '🔥',
      badge: 'HOT',
    },
  ];
}

export async function getCachedNavigation(): Promise<NavItem[]> {
  return getNavigationFromAPI();
}
