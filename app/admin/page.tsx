'use client';

import { useState, useEffect } from 'react';

interface Producto {
  familia_id: string;
  codigo: number;
  nombre: string;
  marca: string | null;
  rubro: string | null;
  imagen_url: string | null;
  colores: string[];
  talles: Array<{ talla: string; stock: number }>;
}

const API_IMAGEN_URL = '/api/imagen';

export default function ProductosSinFoto() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProductos, setTotalProductos] = useState(0);
  const [procesando, setProcesando] = useState<Set<string>>(new Set());
  const [imagenPreview, setImagenPreview] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/productos-sin-foto');
      const data = await res.json();
      setProductos(data.productos || []);
      setTotalProductos(data.totalProductos || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarImagen = async (codigo: string) => {
    try {
      const res = await fetch(API_IMAGEN_URL + '/' + codigo);
      if (!res.ok) return null;
      
      const data = await res.json();
      if (data.url_absoluta) {
        const match = data.url_absoluta.match(/\/imagenes\/(.+)$/);
        if (match) {
          return '/proxy/imagen/' + match[1];
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const verificarImagen = async (familiaId: string, codigo: string) => {
    setProcesando(prev => new Set(prev).add(familiaId));
    
    const urlImagen = await buscarImagen(codigo);
    
    if (urlImagen) {
      setImagenPreview(prev => new Map(prev).set(familiaId, urlImagen));
    } else {
      alert('No se encontro imagen');
    }
    
    setProcesando(prev => {
      const next = new Set(prev);
      next.delete(familiaId);
      return next;
    });
  };

  const asignarImagen = async (familiaId: string, codigo: string) => {
    const urlImagen = imagenPreview.get(familiaId);
    if (!urlImagen) return;

    setProcesando(prev => new Set(prev).add(familiaId));

    try {
      const res = await fetch('/api/admin/actualizar-imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, imagen_url: urlImagen })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('Actualizado: ' + data.actualizados + ' productos');
        setProductos(prev => prev.filter(p => p.familia_id !== familiaId));
        setImagenPreview(prev => {
          const next = new Map(prev);
          next.delete(familiaId);
          return next;
        });
      } else {
        alert('Error al actualizar');
      }
    } catch (error) {
      alert('Error');
    } finally {
      setProcesando(prev => {
        const next = new Set(prev);
        next.delete(familiaId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Productos sin Foto</h1>
          <div className="flex gap-4">
            <span className="bg-orange-100 px-3 py-1 rounded">{productos.length} familias</span>
            <span className="bg-blue-100 px-3 py-1 rounded">{totalProductos} productos</span>
          </div>
        </div>

        {productos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Todos tienen imagen</h2>
          </div>
        ) : (
          <div className="grid gap-4">
            {productos.map((producto) => {
              const codigo = producto.codigo.toString();
              const procesandoActual = procesando.has(producto.familia_id);
              const tienePreview = imagenPreview.has(producto.familia_id);

              return (
                <div key={producto.familia_id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex gap-6">
                    <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                      {tienePreview ? (
                        <img
                          src={imagenPreview.get(producto.familia_id)}
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <p className="text-gray-400 text-sm">Sin imagen</p>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{producto.nombre}</h3>
                      <p className="text-sm text-gray-600 mb-4">Codigo: {codigo}</p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => verificarImagen(producto.familia_id, codigo)}
                          disabled={procesandoActual}
                          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                        >
                          {procesandoActual ? 'Buscando...' : 'Buscar imagen'}
                        </button>

                        {tienePreview && (
                          <button
                            onClick={() => asignarImagen(producto.familia_id, codigo)}
                            disabled={procesandoActual}
                            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
                          >
                            {procesandoActual ? 'Guardando...' : 'Asignar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
