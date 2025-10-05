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
  tipo_calzado: string | null;
  precio_lista: number;
  precio_contado: number | null;
  precio_debito: number | null;
  imagen_url: string | null;
  stock_disponible: number;
}

interface ProductoFamilia {
  familia_id: string;
  nombre: string;
  marca_descripcion: string | null;
  rubro: string | null;
  tipo_calzado: string | null;
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

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [familias, setFamilias] = useState<ProductoFamilia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoCalzadoFilter, setTipoCalzadoFilter] = useState('');
  const [talleFilter, setTalleFilter] = useState('');
  const [marcaFilter, setMarcaFilter] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  
  // Opciones disponibles
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([]);
  const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/productos?limit=500');
      
      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await response.json();
      setProductos(data.productos || []);
      agruparPorFamilia(data.productos || []);
      
      // Extraer valores únicos para filtros
      const tipos = Array.from(new Set(
        (data.productos || []).map((p: Producto) => p.tipo_calzado).filter(Boolean)
      )) as string[];
      
      const talles = Array.from(new Set(
        (data.productos || []).map((p: Producto) => p.talla).filter(Boolean)
      )) as string[];
      
      const marcas = Array.from(new Set(
        (data.productos || []).map((p: Producto) => p.marca_descripcion).filter(Boolean)
      )) as string[];
      
      setTiposDisponibles(tipos.sort());
      setTallesDisponibles(talles.sort((a, b) => parseFloat(a) - parseFloat(b)));
      setMarcasDisponibles(marcas.sort());
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
        // Limpiar nombre: quitar código y color del inicio
        const nombreLimpio = producto.nombre
          .replace(/^[\d.]+\s+(BLANCO|NEGRO|BORDÓ|BORDO|AZUL|GRIS|ROJO|VERDE|AMARILLO|ROSA|MARRÓN|MARRON|CORAL|FUCSIA|CELESTE|NARANJA|BEIGE|VIOLETA|LEOPARDO|SUELA|NUDE|ORO|PLATA|CAMEL|NATURAL)\s+/i, '')
          .trim();
        
        familiasMap[familiaKey] = {
          familia_id: familiaKey,
          nombre: nombreLimpio,
          marca_descripcion: producto.marca_descripcion,
          rubro: producto.rubro,
          tipo_calzado: producto.tipo_calzado,
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

    // Ordenar talles numéricamente
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
    setTipoCalzadoFilter('');
    setTalleFilter('');
    setMarcaFilter('');
    setPrecioMin('');
    setPrecioMax('');
  };

  const filteredFamilias = familias.filter(familia => {
    const matchSearch = familia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       familia.marca_descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTipo = !tipoCalzadoFilter || familia.tipo_calzado === tipoCalzadoFilter;
    const matchMarca = !marcaFilter || familia.marca_descripcion === marcaFilter;
    
    const matchTalle = !talleFilter || familia.variantes.some(v => 
      v.talles.some(t => t.talla === talleFilter)
    );
    
    const matchPrecio = (!precioMin || familia.precio_lista >= parseFloat(precioMin)) &&
                        (!precioMax || familia.precio_lista <= parseFloat(precioMax));
    
    return matchSearch && matchTipo && matchMarca && matchTalle && matchPrecio;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold">Error al cargar productos</p>
          <p className="mt-2">{error}</p>
          <button
            onClick={fetchProductos}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const hayFiltrosActivos = searchTerm || tipoCalzadoFilter || marcaFilter || talleFilter || precioMin || precioMax;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Catálogo Calzalindo
          </h1>
          
          {/* Filtros principales */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <select
                value={tipoCalzadoFilter}
                onChange={(e) => setTipoCalzadoFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                {tiposDisponibles.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
              
              <select
                value={talleFilter}
                onChange={(e) => setTalleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los talles</option>
                {tallesDisponibles.map(talle => (
                  <option key={talle} value={talle}>Talle {talle}</option>
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
            </div>
            
            {/* Filtro de precio */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Precio desde:</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={precioMin}
                  onChange={(e) => setPrecioMin(e.target.value)}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">hasta:</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {hayFiltrosActivos && (
                <button
                  onClick={limpiarFiltros}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Mostrando {filteredFamilias.length} {filteredFamilias.length === 1 ? 'familia' : 'familias'} de productos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFamilias.map((familia) => (
            <ProductCard key={familia.familia_id} familia={familia} />
          ))}
        </div>

        {filteredFamilias.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No se encontraron productos que coincidan con los filtros seleccionados
            </p>
            <button
              onClick={limpiarFiltros}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
