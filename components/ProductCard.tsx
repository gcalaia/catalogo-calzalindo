'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getColorStyle, isColorDark, getColorHex } from '@/lib/colorMap';
import { calcularPrecios } from '@/lib/pricing'; // ← NUEVO

// ... (tus interfaces igual)

export default function ProductCard({ familia }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedTalle, setSelectedTalle] = useState<string | null>(null);
  const [showPrices, setShowPrices] = useState(false);

  const varianteActual = familia.variantes[selectedColor];
  const imageUrl = varianteActual?.imagen_url || 'https://placehold.co/600x600/f3f4f6/6b7280?text=Sin+Imagen';

  const productoActual = selectedTalle
    ? varianteActual?.talles.find(t => t.talla === selectedTalle)
    : varianteActual?.talles[0];

  // Base = precio_lista del talle (si existe) o de la familia
  const precioBase = productoActual?.precio_lista ?? familia.precio_lista;

  // Precios comerciales centralizados (.999 y coeficientes)
  const precios = calcularPrecios(precioBase);

  const stockTotal = varianteActual?.talles.reduce((s, t) => s + t.stock, 0) || 0;
  const esUltimasUnidades = stockTotal > 0 && stockTotal <= 3;

  const handleWhatsApp = () => {
    const talleInfo = selectedTalle ? `\nTalle: ${selectedTalle}` : '';
    const stockInfo = productoActual ? `\nStock disponible: ${productoActual.stock}` : '';
    const mensaje = `Hola! Me interesa el producto:\n${familia.nombre}\nMarca: ${familia.marca_descripcion}\nColor: ${varianteActual.color}${talleInfo}${stockInfo}\nPrecio contado: $${precios.contado.toLocaleString('es-AR')}`;
    window.open(`https://wa.me/5491234567890?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-md bg-white">
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {esUltimasUnidades && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg z-10 animate-pulse">
            ¡Últimas unidades!
          </div>
        )}
        <Image
          src={imageUrl}
          alt={familia.nombre}
          fill
          className="object-cover hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 h-10">
          {familia.nombre}
        </h3>
        {familia.marca_descripcion && (
          <p className="text-xs text-gray-500 mb-2">{familia.marca_descripcion}</p>
        )}

        <div className="mb-2 bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-green-700 uppercase">Precio Contado</span>
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              -{precios.descuento}% OFF
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${precios.contado.toLocaleString('es-AR')}
          </p>
        </div>

        <button
          onClick={() => setShowPrices(!showPrices)}
          className="text-xs text-blue-600 hover:text-blue-800 mb-3 underline"
        >
          {showPrices ? 'Ocultar precios' : 'Ver otros medios de pago'}
        </button>

        {showPrices && (
          <div className="bg-gray-50 rounded p-3 mb-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Precio de lista:</span>
              <span className="font-semibold">${precios.lista.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Débito:</span>
              <span className="font-semibold">${precios.debito.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-green-600 font-medium">
                Contado (-{precios.descuento}%):
              </span>
              <span className="font-bold text-green-600">
                ${precios.contado.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        )}

        {/* …resto igual (colores, talles, WhatsApp)… */}
      </div>
    </div>
  );
}
