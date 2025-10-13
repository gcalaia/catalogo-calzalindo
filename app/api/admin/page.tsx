'use client';

import { useState, useEffect } from 'react';

interface Producto {
  familia_id: string;
  nombre: string;
  marca: string;
  rubro: string;
  imagen_url: string | null;
  colores: string[];
  talles: Array<{ talla: string; stock: number }>;
}

const API_IMAGEN_URL = process.env.NEXT_PUBLIC_API_IMAGEN_URL || '/api/imagen';

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
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarImagen = async (codigo: string) => {
    try {
      const res = await fetch(`${API_IMAGEN_URL}/${codigo}`);
      if (!res.ok) throw new Error('Imagen no encontrada');
      
      const data = await res.json();
      if (data.url_absoluta) {
        // Convertir a proxy local
        const match = data.url_absoluta.match(/\/imagenes\/(.+)$/);
        if (match) {
          return `/proxy/imagen/${match[1]}`;
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
      alert('No se encontró imagen para este código');
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
        alert(`✅ ${data.actualizados} producto(s) actualizados`);
        // Remover de la lista
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
      console.error('Error:', error);
      alert('Error al actualizar imagen');
    } finally {
      setProcesando(prev => {
        const next = new Set(prev);
        next.delete(familiaId);
        return next;
      });
    }
  };

  const extraerCodigo = (familiaId: string): string => {
    // Intenta extraer el código de la familia_id
    // Ejemplo: "72250702" o "FXXX-72250702" -> "72250702"
    const match = familiaId.match(/(\d{6,})/);
    return match ? match[1] : familiaId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Productos sin Foto
          </h1>
          <div className="flex gap-4 text-sm text-gray-600">
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
              {productos.length} familias sin imagen
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              {totalProductos} productos individuales
            </span>
          </div>
        </div>

        {/* Lista de productos */}
        {productos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Todos los productos tienen imagen!
            </h2>
            <p className="text-gray-600">
              No hay productos sin foto en este momento
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {productos.map((producto) => {
              const codigo = extraerCodigo(producto.familia_id);
              const tieneProcesando = procesando.has(producto.familia_id);
              const tienePreview = imagenPreview.has(producto.familia_id);

              return (
                <div
                  key={producto.familia_id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-6">
                    {/* Columna de imagen */}
                    <div className="flex-shrink-0">
                      <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {tienePreview ? (
                          <img
                            src={imagenPreview.get(producto.familia_id)}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/no_image.png';
                            }}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <svg
                              className="w-16 h-16 text-gray-300 mx-auto mb-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="text-xs text-gray-400">Sin imagen</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Columna de información */}
                    <div className="flex-1">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {producto.nombre}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          {producto.marca && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {producto.marca}
                            </span>
                          )}
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {producto.rubro}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                            Código: {codigo}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Colores:</p>
                          <div className="flex flex-wrap gap-1">
                            {producto.colores.map((color, i) => (
                              <span
                                key={i}
                                className="text-xs bg-gray-100 px-2 py-1 rounded"
                              >
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Talles:</p>
                          <div className="flex flex-wrap gap-1">
                            {producto.talles.slice(0, 8).map((talle, i) => (
                              <span
                                key={i}
                                className="text-xs bg-gray-100 px-2 py-1 rounded"
                              >
                                {talle.talla} ({talle.stock})
                              </span>
                            ))}
                            {producto.talles.length > 8 && (
                              <span className="text-xs text-gray-400 px-2 py-1">
                                +{producto.talles.length - 8} más
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => verificarImagen(producto.familia_id, codigo)}
                          disabled={tieneProcesando}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          {tieneProcesando ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              Buscando...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              Buscar imagen
                            </>
                          )}
                        </button>

                        {tienePreview && (
                          <button
                            onClick={() => asignarImagen(producto.familia_id, codigo)}
                            disabled={tieneProcesando}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            {tieneProcesando ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Asignar imagen
                              </>
                            )}
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
