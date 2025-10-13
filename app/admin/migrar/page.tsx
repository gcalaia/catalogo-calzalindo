'use client';

import { useState } from 'react';

export default function MigrarImagenesPage() {
  const [migrando, setMigrando] = useState(false);
  const [progreso, setProgreso] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const migrarLote = async (offset = 0) => {
    try {
      const res = await fetch('/api/admin/migrar-imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limite: 500, offset })
      });

      const data = await res.json();
      
      setProgreso(data);
      setLogs(prev => [...prev, data.mensaje]);

      // Si procesó el límite completo, continuar con el siguiente lote
      if (data.procesados === 500) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa de 2 segundos
        await migrarLote(data.siguienteOffset);
      } else {
        setMigrando(false);
        setLogs(prev => [...prev, '\n🎉 ¡Migración completada!']);
      }
    } catch (error) {
      console.error('Error:', error);
      setLogs(prev => [...prev, `❌ Error: ${error}`]);
      setMigrando(false);
    }
  };

  const iniciarMigracion = async () => {
    if (!confirm('¿Iniciar migración automática? Esto procesará todos los productos sin imagen.')) {
      return;
    }

    setMigrando(true);
    setProgreso(null);
    setLogs(['🚀 Iniciando migración...']);
    
    await migrarLote(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Migración Masiva de Imágenes
              </h1>
              <p className="text-gray-600">
                Actualiza automáticamente las URLs de imágenes desde el servidor viejo al nuevo
              </p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Volver al admin
            </a>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Cómo funciona:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Procesa 500 productos por lote automáticamente</li>
              <li>Busca cada imagen en el nuevo servidor (API)</li>
              <li>Actualiza la URL si encuentra la imagen</li>
              <li>Continúa con el siguiente lote hasta terminar</li>
              <li>Tarda aproximadamente 1-2 minutos por cada 500 productos</li>
            </ul>
          </div>

          <button
            onClick={iniciarMigracion}
            disabled={migrando}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
              migrando
                ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {migrando ? '⏳ Migrando...' : '🚀 Iniciar Migración Automática'}
          </button>
        </div>

        {/* Progreso */}
        {progreso && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Progreso</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium">Exitosos</p>
                <p className="text-3xl font-bold text-green-700">{progreso.exitosos}</p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-600 font-medium">Sin imagen</p>
                <p className="text-3xl font-bold text-orange-700">{progreso.sinImagen}</p>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-600 font-medium">Errores</p>
                <p className="text-3xl font-bold text-red-700">{progreso.errores}</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Procesados</p>
                <p className="text-3xl font-bold text-blue-700">{progreso.procesados}</p>
              </div>
            </div>

            {progreso.detalles && progreso.detalles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 font-medium mb-2">
                  Últimos códigos migrados:
                </p>
                <div className="bg-gray-50 rounded border border-gray-200 p-3 max-h-32 overflow-y-auto">
                  <div className="space-y-1 text-xs font-mono">
                    {progreso.detalles.slice(-10).map((d: any, i: number) => (
                      <div key={i} className="text-gray-700">
                        ✅ {d.codigo} → {d.actualizados} productos
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">📝 Log de actividad</h2>
              {migrando && (
                <div className="flex items-center gap-2 text-green-400">
                  <div className="animate-pulse w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">En proceso...</span>
                </div>
              )}
            </div>
            
            <div className="bg-black rounded border border-gray-700 p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className="text-gray-300 whitespace-pre-wrap mb-2">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instrucciones post-migración */}
        {!migrando && progreso && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Próximos pasos</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Ve al <a href="/admin" className="text-blue-600 hover:underline">panel de admin</a></li>
              <li>Revisa la sección "Sin foto" para ver los productos que quedaron pendientes</li>
              <li>Asigna manualmente las imágenes que no se pudieron migrar automáticamente</li>
              <li>Verifica que el catálogo muestre correctamente las imágenes actualizadas</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
