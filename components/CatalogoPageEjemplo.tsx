'use client';

import { useState, useEffect } from 'react';
import Pagination from '@/components/Pagination';
import ProductCard from '@/components/ProductCard';

interface Producto {
  codigo: number;
  codigo_sinonimo: string;
  familia_id: string;
  nombre: string;
  color: string;
  talla: string;
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

interface PaginacionInfo {
  total: number;
  pagina_actual: number;
  total_paginas: number;
  por_pagina: number;
  tiene_anterior: boolean;
  tiene_siguiente: boolean;
}

export default function CatalogoPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [paginacion, setPaginacion] = useState<PaginacionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtros actuales (ejemplo)
  const [filtros, setFiltros] = useState({
    rubro: 'all',
    marca: '',
    taxonomia: '',
    linea: '',
    search: '',
  });

  // Función para cargar productos
  const cargarProductos = async (page: number) => {
    setLoading(true);
    
    try {
      // Construir query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24',
      });

      // Agregar filtros si están activos
      if (filtros.rubro !== 'all') params.append('rubro', filtros.rubro);
      if (filtros.marca) params.append('marca', filtros.marca);
      if (filtros.taxonomia) params.append('taxonomia', filtros.taxonomia);
      if (filtros.linea) params.append('linea', filtros.linea);
      if (filtros.search) params.append('search', filtros.search);

      const response = await fetch(`/api/productos?${params}`);
      const data = await response.json();

      setProductos(data.productos);
      setPaginacion(data.paginacion);
      
      // Scroll suave hacia arriba al cambiar de página
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos al montar o cambiar página/filtros
  useEffect(() => {
    cargarProductos(currentPage);
  }, [currentPage, filtros]);

  // Handler para cambio de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handler para cambio de filtros
  const handleFilterChange = (newFilters: Partial<typeof filtros>) => {
    setFiltros((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Volver a página 1 al cambiar filtros
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del catálogo */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Catálogo Calzalindo
          </h1>
          {paginacion && (
            <p className="text-gray-600 mt-2">
              {paginacion.total} productos disponibles
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar de filtros (tu componente Filters.tsx) */}
          <aside className="w-64 flex-shrink-0">
            {/* Aquí van tus filtros existentes */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-4">Filtros</h3>
              {/* ... tus filtros ... */}
            </div>
          </aside>

          {/* Grid de productos + paginación */}
          <main className="flex-1">
            {/* Loading state */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow h-96 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                {/* Grid de productos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productos.map((producto) => (
                    <ProductCard
                      key={producto.codigo}
                      producto={producto}
                    />
                  ))}
                </div>

                {/* Mensaje si no hay productos */}
                {productos.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      No se encontraron productos con los filtros seleccionados
                    </p>
                  </div>
                )}

                {/* Componente de paginación */}
                {paginacion && (
                  <Pagination
                    currentPage={paginacion.pagina_actual}
                    totalPages={paginacion.total_paginas}
                    totalItems={paginacion.total}
                    itemsPerPage={paginacion.por_pagina}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
