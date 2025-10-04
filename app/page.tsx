'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCardGrouped from '@/components/ProductCardGrouped';
import Filters, { FilterValues } from '@/components/Filters';
import { Loader2, AlertCircle } from 'lucide-react';

interface Producto {
  id: number;
  codigo: number;
  nombre: string;
  talla?: string | null;
  color?: string | null;
  marca_descripcion?: string | null;
  rubro?: string | null;
  precio_lista: number;
  precio_contado: number;
  precio_debito: number;
  precio_regular: number;
  stock_disponible: number;
  imagen_url?: string | null;
  fecha_compra?: string | null;
  fecha_modificacion?: string | null;
}

interface ProductoAgrupado {
  nombre: string;
  marca_descripcion?: string | null;
  rubro?: string | null;
  precio_contado: number;
  precio_debito: number;
  precio_regular: number;
  imagen_url?: string | null;
  fecha_compra?: string | null;
  variantes: Array<{
    id: number;
    codigo: number;
    talla: string | null;
    color: string | null;
    stock_disponible: number;
  }>;
}

const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosAgrupados, setProductosAgrupados] = useState<ProductoAgrupado[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoAgrupado[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordenamiento, setOrdenamiento] = useState<string>('nombre');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProductos, setTotalProductos] = useState(0);
  const [filtrosActuales, setFiltrosActuales] = useState<FilterValues>({
    search: '',
    marca: '',
    talla: '',
    color: '',
    rubro: '',
  });

  const [marcas, setMarcas] = useState<string[]>([]);
  const [tallas, setTallas] = useState<string[]>([]);
  const [colores, setColores] = useState<string[]>([]);
  const [rubros, setRubros] = useState<string[]>([]);

  const observerTarget = useRef<HTMLDivElement>(null);

  const cargarProductos = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '100',
        ...(filtrosActuales.marca && { marca: filtrosActuales.marca }),
        ...(filtrosActuales.talla && { talla: filtrosActuales.talla }),
        ...(filtrosActuales.color && { color: filtrosActuales.color }),
        ...(filtrosActuales.rubro && { rubro: filtrosActuales.rubro }),
        ...(filtrosActuales.search && { search: filtrosActuales.search }),
      });

      const res = await fetch(`/api/productos?${params}`);
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      
      const data = await res.json();
      
      const nuevosProductos = reset ? data.productos : [...productos, ...data.productos];
      setProductos(nuevosProductos);
      setHasMore(data.pagination.hasMore);
      setTotalProductos(data.pagination.total);
      
      // Agrupar productos
      const grupos: Record<string, ProductoAgrupado> = nuevosProductos.reduce(
        (acc, producto) => {
          const key = `${producto.nombre}-${producto.marca_descripcion || 'sin-marca'}`;

          if (!acc[key]) {
            acc[key] = {
              nombre: producto.nombre,
              marca_descripcion: producto.marca_descripcion ?? null,
              rubro: producto.rubro ?? null,
              precio_contado: producto.precio_contado,
              precio_debito: producto.precio_debito,
              precio_regular: producto.precio_regular,
              imagen_url: producto.imagen_url ?? null,
              fecha_compra: producto.fecha_compra ?? null,
              variantes: [],
            };
          }

          acc[key].variantes.push({
            id: producto.id,
            codigo: producto.codigo,
            talla: producto.talla ?? null,
            color: producto.color ?? null,
            stock_disponible: producto.stock_disponible,
          });

          return acc;
        },
        {} as Record<string, ProductoAgrupado>
      );

      const agrupados: ProductoAgrupado[] = [];
      for (const k in grupos) {
        agrupados.push(grupos[k]);
      }

      setProductosAgrupados(agrupados);
      setFilteredProductos(aplicarOrdenamiento(agrupados, ordenamiento));
      
      // Extraer filtros únicos solo la primera vez
      if (reset) {
        const uniqueMarcas = [...new Set(nuevosProductos.map((p) => p.marca_descripcion).filter(isString))].sort();
        const uniqueTallas = [...new Set(nuevosProductos.map((p) => p.talla).filter(isString))].sort();
        const uniqueColores = [...new Set(nuevosProductos.map((p) => p.color).filter(isString))].sort();
        const uniqueRubros = [...new Set(nuevosProductos.map((p) => p.rubro).filter(isString))].sort();
        
        setMarcas(uniqueMarcas);
        setTallas(uniqueTallas);
        setColores(uniqueColores);
        setRubros(uniqueRubros);
      }
      
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [productos, filtrosActuales, ordenamiento]);

  // Cargar primera página
  useEffect(() => {
    setPage(1);
    setProductos([]);
    cargarProductos(1, true);
  }, [filtrosActuales]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          cargarProductos(nextPage, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, page, cargarProductos]);

  const aplicarOrdenamiento = (prods: ProductoAgrupado[], tipo: string) => {
    const ordenados = [...prods];

    switch (tipo) {
      case 'recientes':
        ordenados.sort((a, b) => {
          if (!a.fecha_compra) return 1;
          if (!b.fecha_compra) return -1;
          return new Date(b.fecha_compra).getTime() - new Date(a.fecha_compra).getTime();
        });
        break;
      case 'antiguos':
        ordenados.sort((a, b) => {
          if (!a.fecha_compra) return 1;
          if (!b.fecha_compra) return -1;
          return new Date(a.fecha_compra).getTime() - new Date(b.fecha_compra).getTime();
        });
        break;
      case 'precio-menor':
        ordenados.sort((a, b) => a.precio_contado - b.precio_contado);
        break;
      case 'precio-mayor':
        ordenados.sort((a, b) => b.precio_contado - a.precio_contado);
        break;
      default:
        ordenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return ordenados;
  };

  const handleFilterChange = (filters: FilterValues) => {
    setFiltrosActuales(filters);
  };

  useEffect(() => {
    const handleOrdenarEvent = (e: Event) => {
      const nuevoOrden = (e as CustomEvent<string>).detail as string;
      setOrdenamiento(nuevoOrden);
      setFilteredProductos(aplicarOrdenamiento(productosAgrupados, nuevoOrden));
    };

    window.addEventListener('ordenar', handleOrdenarEvent as EventListener);
    return () => window.removeEventListener('ordenar', handleOrdenarEvent as EventListener);
  }, [productosAgrupados]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error al cargar productos</h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Calzalindo</h1>
          <p className="text-gray-600 mt-1">Catálogo de productos</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <Filters
              onFilterChange={handleFilterChange}
              marcas={marcas}
              tallas={tallas}
              colores={colores}
              rubros={rubros}
            />
          </aside>

          <main className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                Mostrando {filteredProductos.length} de {totalProductos} productos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProductos.map((producto, index) => (
                <ProductCardGrouped key={`${producto.nombre}-${index}`} {...producto} />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
              {loadingMore && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-500">Cargando más productos...</p>
                </div>
              )}
            </div>

            {!hasMore && filteredProductos.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Has visto todos los productos disponibles</p>
              </div>
            )}

            {filteredProductos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No se encontraron productos</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}