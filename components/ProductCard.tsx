'use client';

import { useState } from 'react';
import { getColorStyle, isColorDark, getColorHex } from '@/lib/colorMap';
import { calcularPrecios } from '@/lib/pricing';
import { useConsulta } from '@/app/contexts/ConsultaContext';

interface Talle {
  talla: string;
  stock: number;
  codigo: number;
  precio_lista?: number;
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

export default function ProductCard({ familia }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedTalle, setSelectedTalle] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { addItem } = useConsulta();

  const varianteActual = familia.variantes[selectedColor];
  const imageUrl =
    varianteActual?.imagen_url ||
    'https://evirtual.calzalindo.com.ar:58000/clz_ventas/static/images/no_image.png';

  // precios comerciales desde el precio de lista de la familia
  const { lista, contado, debito, offContado, offDebito } = calcularPrecios(
    familia.precio_lista
  );

  type MedioKey = 'contado' | 'debito' | 'lista';
  const opciones = [
    { key: 'contado' as const, label: `Contado (-${offContado}%)`, value: contado, off: offContado },
    { key: 'debito'  as const, label: `Débito (-${offDebito}%)`,   value: debito,  off: offDebito  },
    { key: 'lista'   as const, label: 'Precio de lista',            value: lista,   off: 0          },
  ];
  const [medioSel, setMedioSel] = useState<MedioKey>('contado');
  const sel = opciones.find(o => o.key === medioSel)!;

  // talle activo
  const talleActual =
    (selectedTalle && varianteActual?.talles.find(t => t.talla === selectedTalle)) ||
    varianteActual?.talles[0];

  // stock y badge
  const stockTotal = varianteActual?.talles.reduce((sum, t) => sum + t.stock, 0) || 0;
  const esUltimasUnidades = stockTotal > 0 && stockTotal <= 3;

  // acciones
  const handleWhatsApp = () => {
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5491234567890';
    const t = talleActual?.talla ? `\nTalle: ${talleActual.talla}` : '';
    const s =
      typeof talleActual?.stock === 'number' ? `\nStock disponible: ${talleActual.stock}` : '';
    const mensaje = `Hola! Me interesa el producto:
${familia.nombre}
Marca: ${familia.marca_descripcion}
Color: ${varianteActual.color}${t}${s}
Medio: ${sel.label}
Precio: $${sel.value.toLocaleString('es-AR')}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleAgregar = () => {
    const talle = talleActual?.talla ?? '';
    const color = varianteActual?.color ?? '';
    const id = `${familia.familia_id}-${color}-${talle}-${sel.key}`;
    addItem({
      id,
      nombre: familia.nombre,
      marca: familia.marca_descripcion,
      color,
      talle,
      precio: sel.value, // precio elegido
      stock: talleActual?.stock ?? 0,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Imagen */}
      <div
        className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden cursor-zoom-in"
        onClick={() => setShowImageModal(true)}
      >
        {esUltimasUnidades && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg z-10 animate-pulse">
            ¡Últimas unidades!
          </div>
        )}

        <img
          src={imageError ? 'https://evirtual.calzalindo.com.ar:58000/clz_ventas/static/images/no_image.png' : imageUrl}
          alt={familia.nombre}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
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

        {/* Recuadro de precio: refleja el medio seleccionado */}
        <div className="mb-2 bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-green-700 uppercase">
              Precio {sel.key === 'lista' ? 'de lista' : sel.label.split(' ')[0]}
            </span>
            {sel.off > 0 && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                -{sel.off}% OFF
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${sel.value.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Selector de medio */}
        <label className="block text-xs text-gray-700 mb-1">Quiero consultar por:</label>
        <select
          value={medioSel}
          onChange={(e) => setMedioSel(e.target.value as MedioKey)}
          className="w-full mb-3 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {opciones.map(o => (
            <option key={o.key} value={o.key}>
              {o.label} — ${o.value.toLocaleString('es-AR')}
            </option>
          ))}
        </select>

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
                        setImageError(false);
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
                          className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-800'}`}
                          fill="none"
                          strokeWidth="3"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
        {varianteActual?.talles?.length > 0 && (
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
                  <span className="ml-1 text-[10px] opacity-75">({talle.stock})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-center gap-3 mt-4">
          {/* + Agregar */}
          <button
            onClick={handleAgregar}
            className="flex items-center justify-center gap-2 rounded-full px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all hover:scale-105"
            title="Agregar a mi consulta"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Agregar</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 rounded-full px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold shadow-md transition-all hover:scale-105"
            title="Consultar por WhatsApp"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
            </svg>
            <span className="hidden sm:inline">Consultar</span>
          </button>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 font-light"
              aria-label="Cerrar"
            >
              ×
            </button>
            <img
              src={imageError ? 'https://evirtual.calzalindo.com.ar:58000/clz_ventas/static/images/no_image.png' : imageUrl}
              alt={familia.nombre}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 text-white text-center">
              <p className="text-lg font-semibold">{familia.nombre}</p>
              {familia.marca_descripcion && (
                <p className="text-sm text-gray-300">{familia.marca_descripcion}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
