'use client';

import { useState, useEffect } from 'react';
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
  onImageError?: () => void;
}

const placeholder = process.env.NEXT_PUBLIC_IMG_PLACEHOLDER || '/no_image.png';
const API_IMAGEN_URL = process.env.NEXT_PUBLIC_API_IMAGEN_URL || 'http://200.58.109.125:8007/api/imagen';

export default function ProductCard({ familia, onImageError }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedTalle, setSelectedTalle] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [variantesConError, setVariantesConError] = useState<Set<number>>(new Set());
  const [imagenesUrls, setImagenesUrls] = useState<Map<number, string>>(new Map());
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  
  const { addItem } = useConsulta();

  // Solo cargar la imagen de la variante actual
  useEffect(() => {
    const fetchImageUrl = async () => {
      const variante = familia.variantes[selectedColor];
      
      // Si ya tenemos la URL en cache, no hacer nada
      if (imagenesUrls.has(selectedColor)) {
        return;
      }
      
      // Si ya está marcada como error, no intentar de nuevo
      if (variantesConError.has(selectedColor)) {
        return;
      }
      
      // Si no tiene código, marcar como error
      if (!variante.codigo) {
        setVariantesConError(prev => new Set(prev).add(selectedColor));
        return;
      }
      
      setIsLoadingImage(true);
      
      try {
        const response = await fetch(`${API_IMAGEN_URL}/${variante.codigo}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.url_absoluta) {
          setImagenesUrls(prev => new Map(prev).set(selectedColor, data.url_absoluta));
        } else {
          throw new Error('URL no disponible');
        }
      } catch (error) {
        console.error(`Error cargando imagen para código ${variante.codigo}:`, error);
        setVariantesConError(prev => new Set(prev).add(selectedColor));
      } finally {
        setIsLoadingImage(false);
      }
    };
    
    fetchImageUrl();
  }, [selectedColor, familia.variantes, imagenesUrls, variantesConError]);

  // Verificar si todas las variantes tienen error
  useEffect(() => {
    if (variantesConError.size > 0 && variantesConError.size === familia.variantes.length) {
      if (onImageError) {
        onImageError();
      }
    }
  }, [variantesConError, familia.variantes.length, onImageError]);

  // Si la variante actual tiene error, cambiar a la primera válida
  useEffect(() => {
    if (variantesConError.has(selectedColor)) {
      const primerIndiceValido = familia.variantes.findIndex((_, idx) => !variantesConError.has(idx));
      if (primerIndiceValido !== -1 && primerIndiceValido !== selectedColor) {
        setSelectedColor(primerIndiceValido);
      }
    }
  }, [variantesConError, selectedColor, familia.variantes]);

  const varianteActual = familia.variantes[selectedColor];
  const imageSrc = imagenesUrls.get(selectedColor) || placeholder;

  const { lista, contado, debito, offContado, offDebito } = calcularPrecios(familia.precio_lista);

  type MedioKey = 'contado' | 'debito' | 'lista';
  const opciones = [
    { key: 'contado' as const, label: `Contado (-${offContado}%)`, value: contado, off: offContado },
    { key: 'debito'  as const, label: `Débito (-${offDebito}%)`,   value: debito,  off: offDebito  },
    { key: 'lista'   as const, label: 'Precio de lista',            value: lista,   off: 0          },
  ];
  const [medioSel, setMedioSel] = useState<MedioKey>('contado');
  const sel = opciones.find(o => o.key === medioSel)!;

  const talleActual =
    (selectedTalle && varianteActual?.talles.find(t => t.talla === selectedTalle)) ||
    varianteActual?.talles[0];

  const stockTotal = varianteActual?.talles.reduce((sum, t) => sum + t.stock, 0) || 0;
  const esUltimasUnidades = stockTotal > 0 && stockTotal <= 3;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, variantIndex?: number) => {
    e.currentTarget.src = placeholder;
    const indexToMark = variantIndex ?? selectedColor;
    setVariantesConError(prev => new Set(prev).add(indexToMark));
  };

  const handleWhatsApp = () => {
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5491234567890';
    const t = talleActual?.talla ? `\nTalle: ${talleActual.talla}` : '';
    const s = typeof talleActual?.stock === 'number' ? `\nStock disponible: ${talleActual.stock}` : '';
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
      precio: sel.value,
      stock: talleActual?.stock ?? 0,
    });
    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 2000);
  };

  // Si todas las variantes tienen error, no mostrar la card
  const variantesValidas = familia.variantes.filter((_, index) => !variantesConError.has(index));
  if (variantesValidas.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div
        className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden cursor-zoom-in"
        onClick={() => setShowImageModal(true)}
      >
        {esUltimasUnidades && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg z-10 animate-pulse">
            ¡Últimas unidades!
          </div>
        )}

        {isLoadingImage ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400" />
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={familia.nombre}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => handleImageError(e, selectedColor)}
            loading="lazy"
          />
        )}
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

        {variantesValidas.length > 1 && (
          <div className="mb-3">
            <div className="flex gap-2 items-center flex-wrap mb-2">
              <span className="text-xs text-gray-600">Color:</span>
              <div className="flex gap-2 flex-wrap">
                {familia.variantes.map((variante, index) => {
                  if (variantesConError.has(index)) return null;
                  
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

        <div className="space-y-2">
          <button
            onClick={handleAgregar}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold shadow-md transition-all hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar a mi consulta
          </button>

          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-6 py-2 border-2 border-green-500 text-green-600 hover:bg-green-50 font-medium transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Consultar ahora
          </button>
        </div>
      </div>

      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 font-light"
              aria-label="Cerrar"
            >
              ×
            </button>
            <img
              src={imageSrc}
              alt={familia.nombre}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              onError={(e) => handleImageError(e, selectedColor)}
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

      {showAddedFeedback && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Producto agregado
        </div>
      )}
    </div>
  );
}
