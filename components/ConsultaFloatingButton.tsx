'use client';

import { useState } from 'react';
import { useConsulta } from '@/app/contexts/ConsultaContext';

export function ConsultaFloatingButton() {
  const { items, removeItem, clearAll, itemCount } = useConsulta();
  const [showModal, setShowModal] = useState(false);

  if (itemCount === 0) return null;

  const total = items.reduce((sum, item) => sum + item.precio, 0);

  const handleWhatsApp = () => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5491234567890';
    let mensaje = 'Hola! Me interesan estos productos:\n\n';
    items.forEach((item, i) => {
      mensaje += `${i + 1}. ${item.nombre}\n`;
      if (item.marca) mensaje += `   Marca: ${item.marca}\n`;
      mensaje += `   Color: ${item.color} | Talle: ${item.talle}\n`;
      mensaje += `   Precio contado: $${item.precio.toLocaleString('es-AR')}\n\n`;
    });
    mensaje += `Total aproximado: $${total.toLocaleString('es-AR')}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-40 flex items-center gap-2 transition-all hover:scale-105"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="font-bold">{itemCount}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
             onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Mi Consulta ({itemCount})</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay productos en tu consulta</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{item.nombre}</h3>
                        {item.marca && <p className="text-xs text-gray-500">{item.marca}</p>}
                        <p className="text-sm text-gray-600 mt-1">
                          Color: {item.color} | Talle: {item.talle}
                        </p>
                        <p className="text-sm font-bold text-green-600 mt-1">
                          ${item.precio.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">Total aproximado:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${total.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearAll}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                    Limpiar todo
                  </button>
                  <button onClick={handleWhatsApp}
                          className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884"/>
                    </svg>
                    Enviar consulta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
