'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductCardProps {
  familia: {
    familia_id: string;
    nombre: string;
    marca_descripcion: string | null;
    rubro: string | null;
    precio_lista: number;
    variantes: {
      color: string;
      imagen_url: string | null;
      codigo: number;
      talles: {
        talla: string;
        stock: number;
        codigo: number;
      }[];
    }[];
  };
}

// Mapeo de colores a códigos hex
const COLOR_MAP: { [key: string]: string } = {
  'Rojo': '#DC2626',
  'Azul': '#2563EB',
  'Negro': '#1F2937',
  'Blanco': '#F3F4F6',
  'Verde': '#16A34A',
  'Amarillo': '#EAB308',
  'Rosa': '#EC4899',
  'Naranja': '#EA580C',
  'Marrón': '#92400E',
  'Gris': '#6B7280',
  'Violeta': '#9333EA',
  'Celeste': '#0EA5E9',
  'Beige': '#D2B48C',
  'Coral': '#FF7F50',
  'Fucsia': '#E879F9',
  'Sin color': '#E5E7EB'
};

function getColorHex(colorName: string): string {
  return COLOR_MAP[colorName] || COLOR_MAP['Sin color'];
}

export default function ProductCard({ familia }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedTalle, setSelectedTalle] = useState<string | null>(null);

  const varianteActual = familia.variantes[selectedColor];
  const imageUrl = varianteActual?.imagen_url || 'https://placehold.co/400x400/e5e7eb/6b7280?text=Sin+Imagen';
  const talleSeleccionado = varianteActual?.talles.find(t => t.talla === selectedTalle);

  const handleWhatsApp = () => {
    const talleInfo = selectedTalle ? `\nTalle: ${selectedTalle}` : '';
    const stockInfo = talleSeleccionado ? `\nStock disponible: ${talleSeleccionado.stock}` : '';
    const mensaje = `Hola! Me interesa el producto:\n${familia.nombre}\nMarca: ${familia.marca_descripcion}\nColor: ${varianteActual.color}${talleInfo}${stockInfo}\nPrecio: $${familia.precio_lista.toLocaleString()}`;
    const url = `https://wa.me/5491234567890?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Imagen */}
      <div className="relative h-64 bg-gray-100">
        <Image
          src={imageUrl}
          alt={familia.nombre}
          fill
          className="object-contain p-4"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://placehold.co/400x400/e5e7eb/6b7280?text=Sin+Imagen';
          }}
        />
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Nombre y marca */}
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 h-10">
          {familia.nombre}
        </h3>
        {familia.marca_descripcion && (
          <p className="text-xs text-gray-500 mb-2">{familia.marca_descripcion}</p>
        )}

        {/* Precio */}
        <p className="text-lg font-bold text-blue-600 mb-3">
          ${familia.precio_lista.toLocaleString()}
        </p>

        {/* Selector de colores con círculos */}
        {familia.variantes.length > 1 && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">
              Color: {varianteActual.color}
            </p>
            <div className="flex gap-2 flex-wrap">
              {familia.variantes.map((variante, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedColor(index);
                    setSelectedTalle(null);
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === index
                      ? 'border-blue-600 ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: getColorHex(variante.color) }}
                  title={variante.color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Talles disponibles con stock */}
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
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Consultar
        </button>
      </div>
    </div>
  );
}
