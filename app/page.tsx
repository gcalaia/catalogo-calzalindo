// app/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';

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
  { value: 'stock_asc', label: 'Stock bajo primero' },
  { value: 'nuevos', label: 'Más nuevos' },
  { value: 'precio_asc', label: 'Menor precio' },
  { value: 'precio_desc', label: 'Mayor precio' },
  { value: 'nombre', label: 'Alfabético' },
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
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [ordenFilter, setOrdenFilter] = useState('nuevos');
  const [soloSinFoto, setSoloSinFoto] = useState(false);

  const [subrubrosDisponibles, setSubrubrosDisponibles] = useState<string[]>([]);
  const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);

  // ⬇️ NUEVO: trackear imágenes que fallaron
  const [imagenesFallidas, setImagenesFallidas] = useState<Set<string>>(new Set());

  // ⬇️ NUEVO: callback para cuando una imagen falla
  const onImageError = useCallback((familiaId: string) => {
    setImagenesFallidas(prev => new Set(prev).add(familiaId));
  }, []);

  useEffect(() => { fetchFiltros(); }, []);
  useEffect(() => { fetchFiltrosDinamicos(); }, [rubroFilter, subrubroFilter]);

  useEffect(() => {
    const hayBusqueda = searchTerm.trim().length > 0;
    const hayFiltrosEspecificos =
      subrubroFilter || talleFilter || marcaFilter || precioMin || precioMax || soloSinFoto;

    if (hayBusqueda || (rubroFilter === 'all' && hayFiltrosEspecificos) || (rubroFilter !== 'all' && hayFiltrosEspecificos)) {
      const id = setTimeout(fetchProductos, 400);
      return () => clearTimeout(id);
    } else {
      setFamilias([]);
    }
  }, [searchTerm, rubroFilter, subrubroFilter, talleFilter, marcaFilter, precioMin, precioMax, ordenFilter, soloSinFoto]);

  async function fetchFiltros() {
    try {
      setLoadingFilters(true);
      const res = await fetch('/api/productos?only_filters=true', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar filtros');
      const data = await res.json();
      setSubrubrosDisponibles(data.filtros.subrubros || []);
      setMarcasDisponibles(data.filtros.marcas || []);
      setTallesDisponibles(data.filtros.talles || []);
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

      const res = await fetch(`/api/productos?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) return;

      const data = await res.json();
      setMarcasDisponibles(data.filtros.marcas || []);
      setTallesDisponibles(data.filtros.talles || []);
      if (!subrubroFilter) setSubrubrosDisponibles(data.filtros.subrubros || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchProductos() {
    try {
      setLoading(true);
      setError(null);
      // ⬇️ NUEVO: resetear imágenes fallidas al hacer nueva búsqueda
      setImagenesFallidas(new Set());

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (rubroFilter !== 'all') params.append('rubro', rubroFilter);
      if (subrubroFilter) params.append('subrubro', subrubroFilter);
      if (talleFilter) params.append('talle', talleFilter);
      if (marcaFilter) params.append('marca', marcaFilter);
      if (precioMin) params.append('precioMin', precioMin);
      if (precioMax) params.append('precioMax', precioMax);
      if (ordenFilter) params.append('orden', ordenFilter);
      if (soloSinFoto) params.append('sinFoto', '1');
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
    setPrecioMin('');
    setPrecioMax('');
    setSoloSinFoto(false);
    setImagenesFallidas(new Set()); // ⬅️ NUEVO: limpiar también las imágenes fallidas
  }

  const hayBusqueda = searchTerm.trim().length > 0;
  const hayFiltrosEspecificos =
    subrubroFilter || marcaFilter || talleFilter || precioMin || precioMax || soloSinFoto;

  // ⬇️ NUEVO: filtrar familias con imágenes fallidas
  const familiasValidas = familias.filter(f => !imagenesFallidas.has(f.familia_id));

  if (loadingFilters) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar producto, marca o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>

        <div className="bg-white rounded-lg shadow mb-4 overflow-x-auto">
          <div className="flex border-b">
            {RUBROS.map(r => (
              <button
                key={r.value}
                onClick={() => setRubroFilter(r.value)}
                className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  rubroFilter === r.value
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            <select
              value={subrubroFilter}
              onChange={(e) => setSubrubroFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              {subrubrosDisponibles.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={marcaFilter}
              onChange={(e) => setMarcaFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las marcas</option>
              {marcasDisponibles.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={talleFilter}
              onChange={(e) => setTalleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los talles</option>
              {tallesDisponibles.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Precio mínimo"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Precio máximo"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <label className="flex items-center gap-2 px-2">
              <input
                type="checkbox"
                checked={soloSinFoto}
                onChange={(e) => setSoloSinFoto(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Sólo sin foto</span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600">Ordenar por:</label>
              <select
                value={ordenFilter}
                onChange={(e) => setOrdenFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {ORDEN_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {(hayFiltrosEspecificos || hayBusqueda || rubroFilter !== 'all') && (
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <p className="mt-2 text-sm text-gray-600">Buscando productos...</p>
          </div>
        )}

        {!loading && familiasValidas.length > 0 && (
          <p className="text-sm text-gray-600 mt-4">
            Mostrando {familiasValidas.length} {familiasValidas.length === 1 ? 'familia' : 'familias'} de productos
          </p>
        )}

        {!loading && !hayBusqueda && familiasValidas.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow mt-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Buscá tu calzado ideal</h3>
            <p className="mt-1 text-sm text-gray-500">
              {rubroFilter !== 'all'
                ? 'Seleccioná tipo de calzado, marca o talle para ver productos'
                : 'Seleccioná un rubro o aplicá filtros para ver los productos'}
            </p>
          </div>
        )}

        {!loading && familiasValidas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
            {familiasValidas.map(f => (
              <ProductCard 
                key={f.familia_id} 
                familia={f}
                onImageError={() => onImageError(f.familia_id)}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
            <button
              onClick={fetchProductos}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
