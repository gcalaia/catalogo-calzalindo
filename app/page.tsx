'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCardFamily from '@/components/ProductCardFamily';
import Filters, { FilterValues } from '@/components/Filters';
import { Loader2, AlertCircle } from 'lucide-react';

interface Producto {
  id: number;
  codigo: number;
  nombre: string;
  talla: string | null;
  color: string | null;
  marca_descripcion: string | null;
  rubro: string | null;
  precio_lista: number;
  precio_contado: number;
  precio_debito: number;
  precio_regular: number;
  stock_disponible: number;
  imagen_url: string | null;
  fecha_compra: string | null;
}

interface VarianteColor {
  color: string;
  imagen_codigo: number;
  talles: Array<{
    talla: string;
    stock: number;
    codigo: number;
  }>;
}

interface ProductoFamilia {
  nombre: string;
  marca_descripcion: string | null;
  rubro: string | null;
  precio_contado: number;
  precio_debito: number;
  precio_regular: number;
  fecha_compra: string | null;
  variantes: VarianteColor[];
}

const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [familias, setFamilias] = useState<ProductoFamilia[]>([]);
  const [filteredFamilias, setFilteredFamilias] = useState<ProductoFamilia[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProductos, setTotalProductos] = useState(0);
  const [ordenamiento, setOrdenamiento] = useState<string>('nombre');
  const [filtrosActuales, setFiltrosActuales] = useState<FilterValues>({
    search: '',
    marca: '',
    talla: '',
    color: '',
    rubro: '',
  });

  const [marcas, setMarcas] = useState<string[]>([]);
  const [colores, setColores] = useState<string[]>([]);
  const [rubros, setRubros] = useState<string[]>([]);

  const observerTarget = useRef<HTMLDivElement>(null);

  const agruparPorFamilia = (productos: Producto[]): ProductoFamilia[] => {
    const familias: Record<string, ProductoFamilia> = {};

    for (const producto of productos) {
      const familiaKey = `${producto.nombre}-${producto.marca_descripcion || 'sin-marca'}`;

      if (!familias[familiaKey]) {
        familias[familiaKey] = {
          nombre: producto.nombre,
          marca_descripcion: producto.marca_descripcion,
          rubro: producto.rubro,
          precio_contado: producto.precio_contado,
          precio_debito: producto.precio_debito,
          precio_regular: producto.precio_regular,
          fecha_compra: producto.fecha_compra,
          variantes: [],
        };
      }

      const familia = familias[familiaKey];
      let varianteColor = familia.variantes.find(v => v.color === (producto.color || 'Sin color'));

      if (!varianteColor) {
        varianteColor = {
          color: producto.color || 'Sin color',
          imagen_codigo: producto.codigo,
          talles: [],
        };
        familia.variantes.push(varianteColor);
      }

      if (producto.talla) {
        varianteColor.talles.push({
          talla: producto.talla,
          stock: producto.stock_disponible,
          codigo: producto.codigo,
        });
      }
    }

    const result: ProductoFamilia[] = [];
    for (const key in familias) {
      // Ordenar talles numéricamente
      for (const variante of familias[key].variantes) {
        variante.talles.sort((a, b) => {
          const numA = parseInt(a.talla);
          const numB = parseInt(b.talla);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return a.talla.localeCompare(b.talla);
        });
      }
      result.push(familias[key]);
    }

    return result;
  };

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
      
      const familiasAgrupadas = agruparPorFamilia(nuevosProductos);
      setFamilias(familiasAgrupadas);
      setFilteredFamilias(familiasAgrupadas);
      
      if (reset) {
        const uniqueMarcas = [...new Set(nuevosProductos.map(p => p.marca_descripcion).filter(isString))].sort();
        const uniqueColores = [...new Set(nuevosProductos.map(p => p.color).filter(isString))].sort();
        const uniqueRubros = [...new Set(nuevosProductos.map(p => p.rubro).filter(isString))].sort();
        
        setMarcas(uniqueMarcas);
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
  }, [productos, filtrosActuales]);

  useEffect(() => {
    setPage(1);
    setProductos([]);
    cargarProductos(1, true);
  }, [filtrosActuales]);

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

  const handleFilterChange = (filters: FilterValues) => {
    setFiltrosActuales(filters);
  };

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
              tallas={[]}
              colores={colores}
              rubros={rubros}
            />
          </aside>

          <main className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                Mostrando {filteredFamilias.length} familias de productos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFamilias.map((familia, index) => (
                <ProductCardFamily key={`${familia.nombre}-${index}`} {...familia} />
              ))}
            </div>

            <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
              {loadingMore && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-500">Cargando más productos...</p>
                </div>
              )}
            </div>

            {!hasMore && filteredFamilias.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Has visto todos los productos disponibles</p>
              </div>
            )}

            {filteredFamilias.length === 0 && (
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