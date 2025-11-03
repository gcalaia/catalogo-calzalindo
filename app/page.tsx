// app/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';
import { getTaxonomyIcon, getLineaIcon } from '@/lib/taxonomyIcons';

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

const RUBROS = [
  { value: 'all', label: 'Todos' },
  { value: 'DAMAS', label: 'Damas' },
  { value: 'HOMBRES', label: 'Hombres' },
  { value: 'NIÑOS', label: 'Niños' },
  { value: 'NIÑAS', label: 'Niñas' },
];

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

  const [searchTerm, setSearchTerm] = useState('');
  const [rubroFilter, setRubroFilter] = useState('all');
  const [subrubroFilter, setSubrubroFilter] = useState('');
  const [talleFilter, setTalleFilter] = useState('');
  const [marcaFilter, setMarcaFilter] = useState('');
  const [taxonomiaFilter, setTaxonomiaFilter] = useState('');
  const [lineaFilter, setLineaFilter] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [ordenFilter, setOrdenFilter] = useState('nuevos');
  const [soloDestacados, setSoloDestacados] = useState(false);

  const [subrubrosDisponibles, setSubrubrosDisponibles] = useState<string[]>([]);
  const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);
  const [taxonomiasDisponibles, setTaxonomiasDisponibles] = useState<{nombre: string; descripcion: string | null}[]>([]);
  const [lineasDisponibles, setLineasDisponibles] = useState<string[]>([]);

  const [imagenesFallidas, setImagenesFallidas] = useState<Set<string>>(new Set());

  const onImageError = useCallback((familiaId: string) => {
    setImagenesFallidas(prev => new Set(prev).add(familiaId));
  }, []);

  // Filtros iniciales
  useEffect(() => { fetchFiltros(); }, []);
  
  // Filtros dinámicos
  useEffect(() => { 
    fetchFiltrosDinamicos(); 
  }, [rubroFilter, subrubroFilter, taxonomiaFilter, lineaFilter]);
  
  // Leer parámetros de URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const rubro = params.get('rubro');
    const subrubro = params.get('subrubro');
    const marca = params.get('marca');
    const taxonomia = params.get('taxonomia');
    const linea = params.get('linea');
    const talle = params.get('talle');
    const precioMinParam = params.get('precioMin');
    const precioMaxParam = params.get('precioMax');
    const orden = params.get('orden');

    if (search) setSearchTerm(search);
    if (rubro && rubro !== 'all') setRubroFilter(rubro);
    if (subrubro) setSubrubroFilter(subrubro);
    if (marca) setMarcaFilter(marca);
    if (taxonomia) setTaxonomiaFilter(taxonomia);
    if (linea) setLineaFilter(linea);
    if (talle) setTalleFilter(talle);
    if (precioMinParam) setPrecioMin(precioMinParam);
    if (precioMaxParam) setPrecioMax(precioMaxParam);
    if (orden) setOrdenFilter(orden);
  }, []);

  // Búsqueda de productos
  useEffect(() => {
    const hayBusqueda = searchTerm.trim().length > 0;
    const hayFiltrosEspecificos =
      subrubroFilter || talleFilter || marcaFilter || taxonomiaFilter || 
      lineaFilter || precioMin || precioMax || soloDestacados;

    if (hayBusqueda || (rubroFilter === 'all' && hayFiltrosEspecificos) || (rubroFilter !== 'all' && hayFiltrosEspecificos)) {
      const id = setTimeout(fetchProductos, 400);
      return () => clearTimeout(id);
    } else {
      setFamilias([]);
    }
  }, [searchTerm, rubroFilter, subrubroFilter, talleFilter, marcaFilter, taxonomiaFilter, lineaFilter, precioMin, precioMax, ordenFilter, soloDestacados]);
 
  async function fetchFiltros() {
    try {
      setLoadingFilters(true);
      const res = await fetch('/api/productos?only_filters=true', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar filtros');
      const data = await res.json();
      setSubrubrosDisponibles(data.filtros.subrubros || []);
      setMarcasDisponibles(data.filtros.marcas || []);
      setTallesDisponibles(data.filtros.talles || []);
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
      if (subrubroFilter) params.append('subrubro', subrubroFilter);
      if (taxonomiaFilter) params.append('taxonomia', taxonomiaFilter);
      if (lineaFilter) params.append('linea', lineaFilter);

      const res = await fetch(`/api/productos?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) return;

      const data = await res.json();
      setMarcasDisponibles(data.filtros.marcas || []);
      setTallesDisponibles(data.filtros.talles || []);
      if (!subrubroFilter) setSubrubrosDisponibles(data.filtros.subrubros || []);
      if (!taxonomiaFilter) setTaxonomiasDisponibles(data.filtros.taxonomias || []);
      if (!lineaFilter) setLineasDisponibles(data.filtros.lineas || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchProductos() {
    try {
      setLoading(true);
      setError(null);
      setImagenesFallidas(new Set());

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (rubroFilter !== 'all') params.append('rubro', rubroFilter);
      if (subrubroFilter) params.append('subrubro', subrubroFilter);
      if (talleFilter) params.append('talle', talleFilter);
      if (marcaFilter) params.append('marca', marcaFilter);
      if (taxonomiaFilter) params.append('taxonomia', taxonomiaFilter);
      if (lineaFilter) params.append('linea', lineaFilter);
      if (precioMin) params.append('precioMin', precioMin);
      if (precioMax) params.append('precioMax', precioMax);
      if (ordenFilter) params.append('orden', ordenFilter);
      if (soloDestacados) params.append('destacados', '1');
      params.append('limit', '2000');

      const res = await fetch(`/api/productos?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar productos');

      const data = await res.json();
      agruparPorFamilia(data.productos || []);
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
    setSubrubroFilter('');
    setTalleFilter('');
    setMarcaFilter('');
    setTaxonomiaFilter('');
    setLineaFilter('');
    setPrecioMin('');
    setPrecioMax('');
    setSoloDestacados(false);
    setImagenesFallidas(new Set());
  }

  const hayBusqueda = searchTerm.trim().length > 0;
  const hayFiltrosEspecificos =
    subrubroFilter || marcaFilter || talleFilter || taxonomiaFilter || 
    lineaFilter || precioMin || precioMax || soloDestacados;

  const familiasValidas = familias.filter(f => !imagenesFallidas.has(f.familia_id));

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Buscador */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por producto, marca o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 pl-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg shadow-sm"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tabs de Rubros */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-200">
          <div className="flex overflow-x-auto">
            {RUBROS.map(r => (
              <button
                key={r.value}
                onClick={() => setRubroFilter(r.value)}
                className={`px-8 py-4 font-semibold transition-all whitespace-nowrap border-b-4 ${
                  rubroFilter === r.value
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros principales */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Tipo (Subrubro) */}
            <select
              value={subrubroFilter}
              onChange={(e) => setSubrubroFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="">Todos los tipos</option>
              {subrubrosDisponibles.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Marca */}
            <select
              value={marcaFilter}
              onChange={(e) => setMarcaFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="">Todas las marcas</option>
              {marcasDisponibles.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Talle */}
            {/* TEMPORALMENTE DESHABILITADO - Requiere datos de producto_variantes
            <select
              value={talleFilter}
              onChange={(e) => setTalleFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="">Todos los talles</option>
              {tallesDisponibles.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            */}

            {/* Uso/Ocasión (Taxonomía) */}
            <select
              value={taxonomiaFilter}
              onChange={(e) => setTaxonomiaFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="">Uso/Ocasión</option>
              {taxonomiasDisponibles.map(t => (
                <option key={t.nombre} value={t.nombre}>
                  {getTaxonomyIcon(t.nombre)} {t.nombre}
                </option>
              ))}
            </select>

            {/* Temporada (Línea) */}
            <select
              value={lineaFilter}
              onChange={(e) => setLineaFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="">Temporada</option>
              {lineasDisponibles.map(l => (
                <option key={l} value={l}>
                  {getLineaIcon(l)} {l}
                </option>
              ))}
            </select>

            {/* Destacados */}
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
              <input
                type="checkbox"
                checked={soloDestacados}
                onChange={(e) => setSoloDestacados(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">⭐ Destacados</span>
            </label>
          </div>

          {/* Precio y ordenar */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
            {/* TEMPORALMENTE DESHABILITADO - Requiere datos de producto_variantes
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="$ Min"
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
                className="w-32 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="$ Max"
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                className="w-32 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            */}

            <div className="flex items-center gap-3 flex-1">
              <label className="text-sm font-medium text-gray-600">Ordenar:</label>
              <select
                value={ordenFilter}
                onChange={(e) => setOrdenFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                {ORDEN_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {(hayFiltrosEspecificos || hayBusqueda || rubroFilter !== 'all') && (
              <button
                onClick={limpiarFiltros}
                className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all border-2 border-blue-200"
              >
                🗑️ Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" />
            <p className="mt-4 text-gray-600 font-medium">Buscando productos...</p>
          </div>
        )}

        {/* Contador de resultados */}
        {!loading && familiasValidas.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-700">
              🎯 {familiasValidas.length} {familiasValidas.length === 1 ? 'producto encontrado' : 'productos encontrados'}
            </p>
          </div>
        )}

        {/* Sin búsqueda */}
        {!loading && !hayBusqueda && familiasValidas.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Buscá tu calzado ideal</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {rubroFilter !== 'all'
                ? 'Usá los filtros para encontrar el producto perfecto'
                : 'Seleccioná un rubro o aplicá filtros para ver los productos'}
            </p>
          </div>
        )}

        {/* Grid de productos */}
        {!loading && familiasValidas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {familiasValidas.map(f => (
              <ProductCard 
                key={f.familia_id} 
                familia={f}
                onImageError={() => onImageError(f.familia_id)}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16 bg-red-50 rounded-xl border-2 border-red-200">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-600 text-lg font-medium mb-4">{error}</p>
            <button
              onClick={fetchProductos}
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
