'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getColorStyle, isColorDark, getColorHex } from '@/lib/colorMap';

interface Talle {
  talla: string;
  stock: number;
  codigo: number;
  precio_lista?: number;
  precio_contado?: number;
  precio_debito?: number;
}

interface Variante {
  color: string;
  imagen_url: string | null;
  codigo: number;
  talles: Talle[];
}

interface ProductCardProps {
  familia: {
    familia_id: string;
    nombre: string;
    marca_descripcion: string | null;
    rubro: string | null;
    precio_lista: number;
    variantes: Variante[];
  };
}

// ✅ Redondeo comercial tipo "termina en .99"
const aComercial = (x: number) => {
  const abs = Math.abs(x);
  const paso = abs < 20000 ? 100 : abs < 100000 ? 1000 : 10000;
  const signo = x < 0 ? -1 : 1;
  const base = Math.ceil(abs / paso) * paso - paso * 0.01; // termina en .99
  return signo * Math.round(base);
};

// ✅ Calculadora de precios comerciales
function calcularPrecios(precioBase: number) {
  const lista = aComercial(precioBase);
  const contado = aComercial(precioBase * 0.95);
  const debito = aComercial(precioBase * 1.05);
  return { lista, contado, debito, descuento: 5 };
}

export default function ProductCard({ familia }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedTalle, setSelectedTalle] = useState<string | null>(null);
  const [showPrices, setShowPrices] = useState(false);

  const varianteActual = familia.variantes[selectedColor];
  const imageUrl =
    varianteActual?.imagen_url ||
    'https://placehold.co/600x600/f3f4f6/6b7280?text=Sin+Imagen';

  const productoActual = selectedTalle
    ? varianteActual?.talles.find(t => t.talla === selectedTalle)
    : varianteActual?.talles[0];

  const precioBase = productoActual?.precio_lista ?? familia.precio_lista;

  const precios =
    productoActual?.precio_contado && productoActual?.precio_debito
      ? {
          lista: productoActual.precio_lista ?? precioBase,
          contado: productoActual.precio_contado,
          debito: productoActual.precio_debito,
          descuento: 5,
        }
      : calcularPrecios(precioBase);

  const stockTotal =
    varianteActual?.talles.reduce((sum, t) => sum + t.stock, 0) || 0;
  const esUltimasUnidades = stockTotal > 0 && stockTotal <= 3;

  const handleWhatsApp = () => {
    const talleInfo = selectedTalle ? `\nTalle: ${selectedTalle}` : '';
    const stockInfo = productoActual
      ? `\nStock disponible: ${productoActual.stock}`
      : '';
    const mensaje = `Hola! Me interesa el producto:\n${familia.nombre}\nMarca: ${familia.marca_descripcion}\nColor: ${varianteActual.color}${talleInfo}${stockInfo}\nPrecio contado: $${precios.contado.toLocaleString(
      'es-AR'
    )}`;
    const url = `https://wa.me/5491234567890?text=${encodeURIComponent(
      mensaje
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-md bg-white">
      {/* Imagen */}
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

      {/* Contenido */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 h-10">
          {familia.nombre}
        </h3>
        {familia.marca_descripcion && (
          <p className="text-xs text-gray-500 mb-2">{familia.marca_descripcion}</p>
        )}

        {/* Precio principal */}
        <div className="mb-2 bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-green-700 uppercase">
              Precio Contado
            </span>
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              -{precios.descuento}% OFF
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${precios.contado.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Toggle precios */}
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
              <span className="font-semibold">
                ${precios.lista.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Débito:</span>
              <span className="font-semibold">
                ${precios.debito.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-green-600 font-medium">
                Contado (-5%):
              </span>
              <span className="font-bold text-green-600">
                ${precios.contado.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        )}

        {/* Selector de colores */}
        {familia.variantes.length > 1 && (
          <div className="mb-3">
            <div className="flex gap-2 items-center flex-wrap mb-2">
              <span className="text-xs text-gray-600">Color:</span>
              <div className="flex gap-2 flex-wrap">
                {familia.variantes.map((variante, index) => {
                  const isSelected = selectedColor === index;
                  const colorStyle = getColorStyle(variante.color);
                  const hexColor = getColorHex(variante.color);
                  const isDark = isColorDark(hexColor);

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedColor(index);
                        setSelectedTalle(null);
                      }}
                      className={`w-9 h-9 rounded-full transition-all flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                          : 'ring-1 ring-gray-300 hover:scale-105'
                      }`}
                      style={colorStyle}
                      title={variante.color}
                      aria-label={`Seleccionar color ${variante.color}`}
                    >
                      {isSelected && (
                        <svg
                          className={`w-4 h-4 ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}
                          fill="none"
                          strokeWidth="3"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-medium text-gray-800 capitalize">
                {varianteActual.color.toLowerCase()}
              </span>
            </div>
          </div>
        )}

        {/* Selector de talles */}
        {varianteActual?.talles && varianteActual.talles.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">Talles disponibles:</p>
            <div className="flex flex-wrap gap-2">
              {varianteActual.talles.map((talle, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTalle(talle.talla)}
                  className={`px-3 py-1 text-xs rounded transition-all ${
                    selectedTalle === talle.talla
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {talle.talla}
                  <span className="ml-1 text-[10px] opacity-75">
                    ({talle.stock})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botón WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
          </svg>
          Consultar
        </button>
      </div>
    </div>
  );
}
