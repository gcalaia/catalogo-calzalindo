'use client';

import { useState, useEffect } from 'react';
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
    talles: {
      talla: string;
      stock: number;
      codigo: number;
    }[];
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
  
  const [subrubrosDisponibles, setSubrubrosDisponibles] = useState<string[]>([]);
  const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);

  useEffect(() => {
    fetchFiltros();
  }, []);

  // Actualizar filtros cuando cambia rubro o subrubro
  useEffect(() => {
    fetchFiltrosDinamicos();
  }, [rubroFilter, subrubroFilter]);

  useEffect(() => {
    const hayBusqueda = searchTerm.length > 0;
    const hayFiltrosEspecificos = subrubroFilter || talleFilter || marcaFilter || precioMin || precioMax;
    
    // Solo buscar si:
    // 1. Hay búsqueda por texto
    // 2. Está en "Todos" Y tiene filtros específicos
    // 3. Está en un rubro específico Y tiene filtros específicos
    if (hayBusqueda || (rubroFilter === 'all' && hayFiltrosEspecificos) || (rubroFilter !== 'all' && hayFiltrosEspecificos)) {
      const timeoutId = setTimeout(() => {
        fetchProductos();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setFamilias([]);
    }
  }, [searchTerm, rubroFilter, subrubroFilter, talleFilter, marcaFilter, precioMin, precioMax, ordenFilter]);

  const fetchFiltros = async () => {
    try {
      setLoadingFilters(true);
      const response = await fetch('/api/productos?only_filters=true');
      
      if (!response.ok) {
        throw new Error('Error al cargar filtros');
      }

      const data = await response.json();
      setSubrubrosDisponibles(data.filtros.subrubros);
      setMarcasDisponibles(data.filtros.marcas);
      setTallesDisponibles(data.filtros.talles);
    } catch (err) {
      console.error('Error fetching filtros:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchFiltrosDinamicos = async () => {
    try {
      const params = new URLSearchParams();
      params.append('only_filters', 'true');
      
      if (rubroFilter !== 'all') params.append('rubro', rubroFilter);
      if (subrubroFilter) params.append('subrubro', subrubroFilter);
      
      const response = await fetch(`/api/productos?${params.toString()}`);
      if (!response.ok) return;
      
      const data = await response.json();
      setMarcasDisponibles(data.filtros.marcas);
      setTallesDisponibles(data.filtros.talles);
      
      // Solo actualizar subrubros si no hay uno seleccionado
      if (!subrubroFilter) {
        setSubrubrosDisponibles(data.filtros.subrubros);
      }
    } catch (err) {
      console.error('Error fetching filtros dinámicos:', err);
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (rubroFilter !== 'all') params.append('rubro', rubroFilter);
      if (subrubroFilter) params.append('subrubro', subrubroFilter);
      if (talleFilter) params.append('talle', talleFilter);
      if (marcaFilter) params.append('marca', marcaFilter);
      if (precioMin) params.append('precioMin', precioMin);
      if (precioMax) params.append('precioMax', precioMax);
      if (ordenFilter) params.append('orden', ordenFilter);
      params.append('limit', '2000');
      
      const response = await fetch(`/api/productos?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await response.json();
      agruparPorFamilia(data.productos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching productos:', err);
    } finally {
      setLoading(false);
    }
  };

  const agruparPorFamilia = (productos: Producto[]) => {
    const familiasMap: { [key: string]: ProductoFamilia } = {};

    for (const producto of productos) {
      const familiaKey = producto.familia_id || `${producto.codigo}`;

      if (!familiasMap[familiaKey]) {
        const nombreLimpio = producto.nombre
          .replace(/^[\d.]+\s+(BLANCO|NEGRO|BORDÓ|BORDO|AZUL|GRIS|ROJO|VERDE|AMARILLO|ROSA|MARRÓN|MARRON|CORAL|FUCSIA|CELESTE|NARANJA|BEIGE|VIOLETA|LEOPARDO|SUELA|NUDE|ORO|PLATA|CAMEL|NATURAL)\s+/i, '')
          .replace(/\s*\/[A-Z]+\/[A-Z]+\s*/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        familiasMap[familiaKey] = {
          familia_id: familiaKey,
          nombre: nombreLimpio || producto.nombre,
          marca_descripcion: producto.marca_descripcion,
          rubro: producto.rubro,
          subrubro_nombre: producto.subrubro_nombre,
          precio_lista: producto.precio_lista,
          variantes: [],
        };
      }

      const familia = familiasMap[familiaKey];
      let varianteColor = familia.variantes.find(
        v => v.color === (producto.color || 'Sin color')
      );

      if (!varianteColor) {
        varianteColor = {
          color: producto.color || 'Sin color',
          imagen_url: producto.imagen_url,
          codigo: producto.codigo,
          talles: [],
        };
        familia.variantes.push(varianteColor);
      }

      if (producto.talla && producto.stock_disponible > 0) {
        varianteColor.talles.push({
          talla: producto.talla,
          stock: producto.stock_disponible,
          codigo: producto.codigo,
        });
      }
    }

    const result: ProductoFamilia[] = Object.values(familiasMap);

    for (const familia of result) {
      for (const variante of familia.variantes) {
        variante.talles.sort((a, b) => {
          const numA = parseFloat(a.talla) || 0;
          const numB = parseFloat(b.talla) || 0;
          return numA - numB;
        });
      }
    }

    setFamilias(result);
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setRubroFilter('all');
    setSubrubroFilter('');
    setTalleFilter('');
    setMarcaFilter('');
    setPrecioMin('');
    setPrecioMax('');
  };

  const hayFiltrosEspecificos = subrubroFilter || marcaFilter || talleFilter || precioMin || precioMax;
  const hayBusqueda = searchTerm.length > 0;

  if (loadingFilters) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Catálogo Calzalindo
          </h1>
          
          {/* Búsqueda */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar producto, marca o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Tabs de Rubro */}
          <div className="bg-white rounded-lg shadow mb-4 overflow-x-auto">
            <div className="flex border-b">
              {RUBROS.map((rubro) => (
                <button
                  key={rubro.value}
                  onClick={() => setRubroFilter(rubro.value)}
                  className={`
                    px-6 py-4 font-medium transition-colors whitespace-nowrap
                    ${rubroFilter === rubro.value
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  {rubro.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <select
                value={subrubroFilter}
                onChange={(e) => setSubrubroFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                {subrubrosDisponibles.map(subrubro => (
                  <option key={subrubro} value={subrubro}>{subrubro}</option>
                ))}
              </select>
              
              <select
                value={marcaFilter}
                onChange={(e) => setMarcaFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las marcas</option>
                {marcasDisponibles.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
              
              <select
                value={talleFilter}
                onChange={(e) => setTalleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los talles</option>
                {tallesDisponibles.map(talle => (
                  <option key={talle} value={talle}>{talle}</option>
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
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600">Ordenar por:</label>
                <select
                  value={ordenFilter}
                  onChange={(e) => setOrdenFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ORDEN_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-gray-600">Buscando productos...</p>
            </div>
          )}
          
          {!loading && familias.length > 0 && (
            <p className="text-sm text-gray-600 mt-4">
              Mostrando {familias.length} {familias.length === 1 ? 'familia' : 'familias'} de productos
            </p>
          )}
          
          {/* Mensaje cuando no hay filtros aplicados */}
          {!loading && !hayBusqueda && familias.length === 0 && (
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
        </div>

        {!loading && familias.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {familias.map((familia) => (
              <ProductCard key={familia.familia_id} familia={familia} />
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
