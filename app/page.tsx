// app/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import FilterChips from '@/components/FilterChips';

interface Producto {
  id: number;
  codigo: number;
  codigo_sinonimo: string | null;
  familia_id: string | null;
  nombre: string;
  color: string | null;
  talla: string | null;
  marca_descripcion: string | null;
  rubro: string | null;
  subrubro_nombre: string | null;
  taxonomia: string | null;
  linea: string | null;
  destacado: boolean;
  precio_lista: number;
  stock_disponible: number;
  imagen_url: string | null;
}

interface ProductoFamilia {
  familia_id: string;
  nombre: string;
  marca_descripcion: string | null;
  rubro: string | null;
  subrubro_nombre: string | null;
  taxonomia: string | null;
  linea: string | null;
  destacado: boolean;
  precio_lista: number;
  variantes: {
    color: string;
    imagen_url: string | null;
    codigo: number;
    talles: { talla: string; stock: number; codigo: number }[];
  }[];
}

interface PaginacionInfo {
  total: number;
  pagina_actual: number;
  total_paginas: number;
  por_pagina: number;
  tiene_anterior: boolean;
  tiene_siguiente: boolean;
}

const ORDEN_OPTIONS = [
  { value: 'nuevos', label: 'Más nuevos' },
  { value: 'nombre', label: 'Alfabético' },
  { value: 'precio_asc', label: 'Menor precio' },
  { value: 'precio_desc', label: 'Mayor precio' },
];

export default function Home() {
  const [familias, setFamilias] = useState<ProductoFamilia[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [paginacion, setPaginacion] = useState<PaginacionInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [rubroFilter, setRubroFilter] = useState('all');
  const [marcaFilter, setMarcaFilter] = useState('');
  const [taxonomiaFilter, setTaxonomiaFilter] = useState('');
  const [lineaFilter, setLineaFilter] = useState('');
  const [ordenFilter, setOrdenFilter] = useState('nuevos');
  const [soloDestacados, setSoloDestacados] = useState(false);

  // Filtros disponibles
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);
  const [taxonomiasDisponibles, setTaxonomiasDisponibles] = useState<{nombre: string; descripcion: string | null}[]>([]);
  const [lineasDisponibles, setLineasDisponibles] = useState<string[]>([]);

  // UI State
  const [imagenesFallidas, setImagenesFallidas] = useState<Set<string>>(new Set());

  const onImageError = useCallback((familiaId: string) => {
    setImagenesFallidas(prev => new Set(prev).add(familiaId));
  }, []);

  // Generar chips de filtros activos
  const getActiveFilters = () => {
    const chips = [];
    
    if (taxonomiaFilter) {
      chips.push({
        key: 'taxonomia',
        label: taxonomiaFilter,
        value: taxonomiaFilter,
      });
    }
    
    if (lineaFilter) {
      chips.push({
        key: 'linea',
        label: lineaFilter,
        value: lineaFilter,
      });
    }
    
    if (rubroFilter !== 'all') {
      const rubroLabels: Record<string, string> = {
        'DAMAS': 'Mujer',
        'HOMBRES': 'Hombre',
        'NIÑOS': 'Niños',
        'NIÑAS': 'Niñas',
      };
      const rubroLabel = rubroLabels[rubroFilter] || rubroFilter;
      chips.push({
        key: 'rubro',
        label: rubroLabel,
        value: rubroFilter,
      });
    }
    
    if (marcaFilter) {
      chips.push({
        key: 'marca',
        label: marcaFilter,
        value: marcaFilter,
      });
    }
    
    if (soloDestacados) {
      chips.push({
        key: 'destacados',
        label: '⭐ Destacados',
        value: 'true',
      });
    }
    
    return chips;
  };

  const removeFilter = (key: string) => {
    switch (key) {
      case 'taxonomia':
        setTaxonomiaFilter('');
        break;
      case 'linea':
        setLineaFilter('');
        break;
      case 'rubro':
        setRubroFilter('all');
        break;
      case 'marca':
        setMarcaFilter('');
        break;
      case 'destacados':
        setSoloDestacados(false);
        break;
    }
  };

  // Filtros iniciales
  useEffect(() => { fetchFiltros(); }, []);
  
  // Filtros dinámicos
  useEffect(() => { 
    fetchFiltrosDinamicos(); 
  }, [rubroFilter, taxonomiaFilter, lineaFilter]);
  
  // Leer parámetros de URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const rubro = params.get('rubro');
    const marca = params.get('marca');
    const taxonomia = params.get('taxonomia');
    const linea = params.get('linea');
    const orden = params.get('orden');
    const destacados = params.get('destacados');

    if (search) setSearchTerm(search);
    if (rubro && rubro !== 'all') setRubroFilter(rubro);
    if (marca) setMarcaFilter(marca);
    if (taxonomia) setTaxonomiaFilter(taxonomia);
    if (linea) setLineaFilter(linea);
    if (orden) setOrdenFilter(orden);
    if (destacados === '1') setSoloDestacados(true);
  }, []);

  // Búsqueda de productos con reset de página al cambiar filtros
  useEffect(() => {
    const hayBusqueda = searchTerm.trim().length > 0;
    const hayFiltrosEspecificos =
      marcaFilter || taxonomiaFilter || lineaFilter || soloDestacados;

    if (hayBusqueda || (rubroFilter === 'all' && hayFiltrosEspecificos) || (rubroFilter !== 'all' && hayFiltrosEspecificos)) {
      setCurrentPage(1);
      const id = setTimeout(() => fetchProductos(1), 400);
      return () => clearTimeout(id);
    } else {
      setFamilias([]);
      setPaginacion(null);
    }
  }, [searchTerm, rubroFilter, marcaFilter, taxonomiaFilter, lineaFilter, ordenFilter, soloDestacados]);

  // Efecto para cambio de página
  useEffect(() => {
    const hayBusqueda = searchTerm.trim().length > 0;
    const hayFiltrosEspecificos =
      marcaFilter || taxonomiaFilter || lineaFilter || soloDestacados;

    if (currentPage > 1 && (hayBusqueda || hayFiltrosEspecificos || rubroFilter !== 'all')) {
      fetchProductos(currentPage);
    }
  }, [currentPage]);

  async function fetchFiltros() {
    try {
      setLoadingFilters(true);
      const res = await fetch('/api/productos?only_filters=true', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar filtros');
      const data = await res.json();
      setMarcasDisponibles(data.filtros.marcas || []);
      setTaxonomiasDisponibles(data.filtros.taxonomias || []);
      setLineasDisponibles(data.filtros.lineas || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFilters(false);
    }
  }

  async function fetchFiltrosDinamicos() {
    try {
      const params = new URLSearchParams({ only_filters: 'true' });
      if (rubroFilter !== 'all') params.append('rubro', rubroFilter);
      if (taxonomiaFilter) params.append('taxonomia', taxonomiaFilter);
      if (lineaFilter) params.append('linea', lineaFilter);

      const res = await fetch(`/api/productos?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) return;

      const data = await res.json();
      setMarcasDisponibles(data.filtros.marcas || []);
      if (!taxonomiaFilter) setTaxonomiasDisponibles(data.filtros.taxonomias || []);
      if (!lineaFilter) setLineasDisponibles(data.filtros.lineas || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchProductos(page: number = 1) {
    try {
      setLoading(true);
      setError(null);
      setImagenesFallidas(new Set());

      const params = new URLSearchParams();
      
      params.append('page', page.toString());
      params.append('limit', '24');
      
      if (searchTerm) params.append('search', searchTerm);
      if (rubroFilter !== 'all') params.append('rubro', rubroFilter);
      if (marcaFilter) params.append('marca', marcaFilter);
      if (taxonomiaFilter) params.append('taxonomia', taxonomiaFilter);
      if (lineaFilter) params.append('linea', lineaFilter);
      if (ordenFilter) params.append('orden', ordenFilter);
      if (soloDestacados) params.append('destacados', '1');

      const res = await fetch(`/api/productos?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar productos');

      const data = await res.json();
      
      setPaginacion(data.paginacion || null);
      agruparPorFamilia(data.productos || []);
      
      if (page > 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  function agruparPorFamilia(productos: Producto[]) {
    const map: Record<string, ProductoFamilia> = {};

    for (const p of productos) {
      const familiaKey = p.familia_id || `${p.codigo}`;

      if (!map[familiaKey]) {
        const nombreLimpio = p.nombre
          .replace(/^[\d.]+\s+(BLANCO|NEGRO|BORDÓ|BORDO|AZUL|GRIS|ROJO|VERDE|AMARILLO|ROSA|MARRÓN|MARRON|CORAL|FUCSIA|CELESTE|NARANJA|BEIGE|VIOLETA|LEOPARDO|SUELA|NUDE|ORO|PLATA|CAMEL|NATURAL)\s+/i, '')
          .replace(/\s*\/[A-Z]+\/[A-Z]+\s*/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        map[familiaKey] = {
          familia_id: familiaKey,
          nombre: nombreLimpio || p.nombre,
          marca_descripcion: p.marca_descripcion,
          rubro: p.rubro,
          subrubro_nombre: p.subrubro_nombre,
          taxonomia: p.taxonomia,
          linea: p.linea,
          destacado: p.destacado,
          precio_lista: p.precio_lista,
          variantes: [],
        };
      }

      const fam = map[familiaKey];
      let varColor = fam.variantes.find(v => v.color === (p.color || 'Sin color'));
      if (!varColor) {
        varColor = { color: p.color || 'Sin color', imagen_url: p.imagen_url, codigo: p.codigo, talles: [] };
        fam.variantes.push(varColor);
      }
      if (p.talla && p.stock_disponible > 0) {
        varColor.talles.push({ talla: p.talla, stock: p.stock_disponible, codigo: p.codigo });
      }
    }

    const arr = Object.values(map);
    for (const fam of arr) {
      for (const v of fam.variantes) {
        v.talles.sort((a, b) => (parseFloat(a.talla) || 0) - (parseFloat(b.talla) || 0));
      }
    }
    setFamilias(arr);
  }

  function limpiarFiltros() {
    setSearchTerm('');
    setRubroFilter('all');
    setMarcaFilter('');
    setTaxonomiaFilter('');
    setLineaFilter('');
    setSoloDestacados(false);
    setImagenesFallidas(new Set());
    setCurrentPage(1);
    setPaginacion(null);
    window.history.pushState({}, '', '/');
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const hayBusqueda = searchTerm.trim().length > 0;
  const hayFiltrosEspecificos =
    marcaFilter || taxonomiaFilter || lineaFilter || soloDestacados;

  const familiasValidas = familias.filter(f => !imagenesFallidas.has(f.familia_id));
  const activeFilters = getActiveFilters();

  if (loadingFilters) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto" />
          <p className="mt-6 text-lg text-gray-700 font-medium">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Barra de info y ordenar - LIMPIA */}
      <div className="bg-white border-b border-gray-200 sticky top-[140px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Contador de productos */}
            <div>
              {!loading && familiasValidas.length > 0 && paginacion && (
                <div className="flex items-center gap-4">
                  <p className="text-base font-semibold text-gray-900">
                    🎯 {paginacion.total.toLocaleString()} productos
                  </p>
                  <span className="text-sm text-gray-500">
                    Página {paginacion.pagina_actual} de {paginacion.total_paginas}
                  </span>
                </div>
              )}
            </div>

            {/* Ordenar */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
              <select
                value={ordenFilter}
                onChange={(e) => setOrdenFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-white"
              >
                {ORDEN_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Chips de filtros activos */}
      {activeFilters.length > 0 && (
        <FilterChips
          filters={activeFilters}
          onRemove={removeFilter}
          onClearAll={limpiarFiltros}
        />
      )}

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" />
            <p className="mt-4 text-gray-600 font-medium">Buscando productos...</p>
          </div>
        )}

        {/* Sin búsqueda */}
        {!loading && !hayBusqueda && familiasValidas.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Buscá tu calzado ideal</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Usá el buscador o navegá por las categorías del menú superior
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setRubroFilter('DAMAS');
                  window.history.pushState({}, '', '?rubro=DAMAS');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                👩 Ver Mujer
              </button>
              <button
                onClick={() => {
                  setRubroFilter('HOMBRES');
                  window.history.pushState({}, '', '?rubro=HOMBRES');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                👨 Ver Hombre
              </button>
            </div>
          </div>
        )}

        {/* Grid de productos */}
        {!loading && familiasValidas.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {familiasValidas.map(f => (
                <ProductCard 
                  key={f.familia_id} 
                  familia={f}
                  onImageError={() => onImageError(f.familia_id)}
                />
              ))}
            </div>

            {/* Paginación */}
            {paginacion && paginacion.total_paginas > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={paginacion.pagina_actual}
                  totalPages={paginacion.total_paginas}
                  totalItems={paginacion.total}
                  itemsPerPage={paginacion.por_pagina}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16 bg-red-50 rounded-xl border-2 border-red-200">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-600 text-lg font-medium mb-4">{error}</p>
            <button
              onClick={() => fetchProductos(currentPage)}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-lg transition-all"
            >
              🔄 Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
