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
  const [searchTerm, setSearchTerm] = useState('');
  const [rubroFilter, setRubroFilter] = useState('');
  const [rubrosDisponibles, setRubrosDisponibles] = useState<string[]>([]);

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
      
      // Extraer rubros únicos
      const rubros = Array.from(new Set(
        (data.productos || [])
          .map((p: Producto) => p.rubro)
          .filter(Boolean)
      )) as string[];
      setRubrosDisponibles(rubros.sort());
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
        familiasMap[familiaKey] = {
          familia_id: familiaKey,
          nombre: producto.nombre,
          marca_descripcion: producto.marca_descripcion,
          rubro: producto.rubro,
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

  const filteredFamilias = familias.filter(familia => {
    const matchSearch = familia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       familia.marca_descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRubro = !rubroFilter || familia.rubro === rubroFilter;
    return matchSearch && matchRubro;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Catálogo Calzalindo
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <select
              value={rubroFilter}
              onChange={(e) => setRubroFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los rubros</option>
              {rubrosDisponibles.map(rubro => (
                <option key={rubro} value={rubro}>{rubro}</option>
              ))}
            </select>
          </div>
          
          <p className="text-sm text-gray-600">
            Mostrando {filteredFamilias.length} familias de productos
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
              No se encontraron productos que coincidan con tu búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
