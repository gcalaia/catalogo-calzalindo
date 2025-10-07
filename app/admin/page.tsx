'use client';

import { useEffect, useState } from 'react';

interface Producto {
  id: number;
  codigo: number;
  nombre: string;
  marca_descripcion: string | null;
  rubro: string | null;
  subrubro_nombre: string | null;
  stock_disponible: number;
  precio_lista: number;
  familia_id: string | null;
  color?: string | null;
  talla?: string | null;
}

interface Stats {
  totalProductos: number;
  productosConStock: number;
  productosSinFoto: number;
  productosStockBajo: number;
  productosSinPrecio: number;
  productosSinMarca: number;
  totalFamilias: number;
}

type Section = 'sin-foto' | 'stock-bajo' | 'sin-precio' | 'sin-marca';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('sin-foto');
  const [searchTerm, setSearchTerm] = useState('');

  // Verificar autenticación
  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchStats();
      fetchProductos('sin-foto');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('admin_auth', 'true');
        setIsAuthenticated(true);
        fetchStats();
        fetchProductos('sin-foto');
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (err) {
      setError('Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchProductos = async (section: Section) => {
    setLoadingData(true);
    setActiveSection(section);
    setSearchTerm('');
    
    try {
      const endpoints: Record<Section, string> = {
        'sin-foto': '/api/admin/productos-sin-foto',
        'stock-bajo': '/api/admin/stock-bajo',
        'sin-precio': '/api/admin/sin-precio',
        'sin-marca': '/api/admin/sin-marca'
      };

      const res = await fetch(endpoints[section]);
      const data = await res.json();
      setProductos(data.productos || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const exportarCSV = () => {
    const csv = productosFiltrados.map(p => 
      `${p.codigo},"${p.nombre}","${p.marca_descripcion || ''}",${p.stock_disponible},${p.precio_lista}`
    ).join('\n');
    
    const blob = new Blob([`Codigo,Nombre,Marca,Stock,Precio\n${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSection}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const productosFiltrados = productos.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.codigo.toString().includes(term) ||
      p.nombre.toLowerCase().includes(term) ||
      p.marca_descripcion?.toLowerCase().includes(term) ||
      p.rubro?.toLowerCase().includes(term)
    );
  });

  const sections = [
    { key: 'sin-foto' as Section, label: 'Sin foto', count: stats?.productosSinFoto, icon: '📷', color: 'red' },
    { key: 'stock-bajo' as Section, label: 'Stock bajo', count: stats?.productosStockBajo, icon: '⚠️', color: 'orange' },
    { key: 'sin-precio' as Section, label: 'Sin precio', count: stats?.productosSinPrecio, icon: '💲', color: 'yellow' },
    { key: 'sin-marca' as Section, label: 'Sin marca', count: stats?.productosSinMarca, icon: '🏷️', color: 'blue' },
  ];

  // PANTALLA DE LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-500 mt-2">Ingresá la contraseña para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresá tu contraseña"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PANEL ADMIN
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
              ← Volver al catálogo
            </a>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Productos</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProductos.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Con Stock</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.productosConStock.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Familias</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{stats.totalFamilias.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👟</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Requieren Atención</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">
                    {(stats.productosSinFoto + stats.productosStockBajo + stats.productosSinPrecio + stats.productosSinMarca).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            {sections.map(section => (
              <button
                key={section.key}
                onClick={() => fetchProductos(section.key)}
                className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeSection === section.key
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.label}</span>
                {section.count !== undefined && section.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    section.color === 'red' ? 'bg-red-100 text-red-700' :
                    section.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                    section.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {section.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loadingData ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* Barra de búsqueda y acciones */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por código, nombre, marca o rubro..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={exportarCSV}
                    disabled={productosFiltrados.length === 0}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla */}
            {productosFiltrados.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron resultados' : '¡Excelente!'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Probá con otros términos de búsqueda'
                    : 'No hay productos en esta categoría'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Marca
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rubro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productosFiltrados.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {p.codigo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {p.nombre}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {p.marca_descripcion || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {p.rubro || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              p.stock_disponible <= 3 
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {p.stock_disponible}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${p.precio_lista.toLocaleString('es-AR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            
                              href={`/?search=${encodeURIComponent(p.nombre)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Ver en catálogo →
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
