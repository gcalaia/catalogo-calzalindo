'use client';

import { useState, useEffect } from 'react';
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

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosAgrupados, setProductosAgrupados] = useState<ProductoAgrupado[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoAgrupado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordenamiento, setOrdenamiento] = useState<string>('nombre');
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

  useEffect(() => {
    fetch('/api/productos')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setProductos(data);
        
        const grupos = data.reduce((acc: Record<string, ProductoAgrupado>, producto: Producto) => {
          const key = `${producto.nombre}-${producto.marca_descripcion || 'sin-marca'}`;
          
          if (!acc[key]) {
            acc[key] = {
              nombre: producto.nombre,
              marca_descripcion: producto.marca_descripcion,
              rubro: producto.rubro,
              precio_contado: producto.precio_contado,
              precio_debito: producto.precio_debito,
              precio_regular: producto.precio_regular,
              imagen_url: producto.imagen_url,
              fecha_compra: producto.fecha_compra,
              variantes: [],
            };
          }
          
          acc[key].variantes.push({
            id: producto.id,
            codigo: producto.codigo,
            talla: producto.talla,
            color: producto.color,
            stock_disponible: producto.stock_disponible,
          });
          
          return acc;
        }, {});

        const agrupados = Object.values(grupos);
        setProductosAgrupados(agrupados);
        setFilteredProductos(agrupados);
        
        const uniqueMarcas = [...new Set(data.map((p: Producto) => p.marca_descripcion).filter(Boolean))].sort();
        const uniqueTallas = [...new Set(data.map((p: Producto) => p.talla).filter(Boolean))].sort();
        const uniqueColores = [...new Set(data.map((p: Producto) => p.color).filter(Boolean))].sort();
        const uniqueRubros = [...new Set(data.map((p: Producto) => p.rubro).filter(Boolean))].sort();
        
        setMarcas(uniqueMarcas as string[]);
        setTallas(uniqueTallas as string[]);
        setColores(uniqueColores as string[]);
        setRubros(uniqueRubros as string[]);
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando productos:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const aplicarOrdenamiento = (productos: ProductoAgrupado[], tipo: string) => {
    const ordenados = [...productos];
    
    switch(tipo) {
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
    let filtered = productosAgrupados;

    if (filters.search) {
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.variantes.some(v => v.codigo.toString().includes(filters.search))
      );
    }

    if (filters.rubro) {
      filtered = filtered.filter(p => p.rubro === filters.rubro);
    }

    if (filters.marca) {
      filtered = filtered.filter(p => p.marca_descripcion === filters.marca);
    }

    if (filters.talla) {
      filtered = filtered.filter(p => 
        p.variantes.some(v => v.talla === filters.talla)
      );
    }

    if (filters.color) {
      filtered = filtered.filter(p => 
        p.variantes.some(v => v.color === filters.color)
      );
    }

    filtered = aplicarOrdenamiento(filtered, ordenamiento);
    setFilteredProductos(filtered);
  };

  useEffect(() => {
    const handleOrdenarEvent = (e: any) => {
      const nuevoOrden = e.detail;
      setOrdenamiento(nuevoOrden);
      
      let filtered = productosAgrupados;

      if (filtrosActuales.search) {
        filtered = filtered.filter(p => 
          p.nombre.toLowerCase().includes(filtrosActuales.search.toLowerCase()) ||
          p.variantes.some(v => v.codigo.toString().includes(filtrosActuales.search))
        );
      }

      if (filtrosActuales.rubro) {
        filtered = filtered.filter(p => p.rubro === filtrosActuales.rubro);
      }

      if (filtrosActuales.marca) {
        filtered = filtered.filter(p => p.marca_descripcion === filtrosActuales.marca);
      }

      if (filtrosActuales.talla) {
        filtered = filtered.filter(p => 
          p.variantes.some(v => v.talla === filtrosActuales.talla)
        );
      }

      if (filtrosActuales.color) {
        filtered = filtered.filter(p => 
          p.variantes.some(v => v.color === filtrosActuales.color)
        );
      }

      filtered = aplicarOrdenamiento(filtered, nuevoOrden);
      setFilteredProductos(filtered);
    };
    
    window.addEventListener('ordenar', handleOrdenarEvent);
    return () => window.removeEventListener('ordenar', handleOrdenarEvent);
  }, [filtrosActuales, productosAgrupados]);

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
                {filteredProductos.length} {filteredProductos.length === 1 ? 'producto' : 'productos'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProductos.map((producto, index) => (
                <ProductCardGrouped key={`${producto.nombre}-${index}`} {...producto} />
              ))}
            </div>

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