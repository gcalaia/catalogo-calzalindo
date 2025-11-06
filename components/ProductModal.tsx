'use client';

import { useEffect, useState } from 'react';
import { getColorStyle, isColorDark, getColorHex } from '@/lib/colorMap';
import { calcularPrecios } from '@/lib/pricing';
import { useConsulta } from '@/app/contexts/ConsultaContext';
import { getTaxonomyIcon, getLineaIcon, getTaxonomyColor, getLineaColor } from '@/lib/taxonomyIcons';

interface Talle {
  talla: string;
  stock: number;
  codigo: number;
}

interface Variante {
  color: string;
  imagen_url: string | null;
  codigo: number;
  talles: Talle[];
}

interface ProductoDetalle {
  familia_id: string;
  nombre: string;
  marca_descripcion: string | null;
  rubro: string | null;
  subrubro_nombre?: string | null;
  taxonomia?: string | null;
  linea?: string | null;
  destacado?: boolean;
  descripcion?: string | null;
  precio_lista: number;
  variantes: Variante[];
}

interface ProductModalProps {
  producto: ProductoDetalle;
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
}

export default function ProductModal({ producto, isOpen, onClose, imageSrc }: ProductModalProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedTalle, setSelectedTalle] = useState<string | null>(null);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const { addItem } = useConsulta();

  const varianteActual = producto.variantes[selectedColor];
  const { lista, contado, debito, offContado, offDebito } = calcularPrecios(producto.precio_lista);

  type MedioKey = 'contado' | 'debito' | 'lista';
  const opciones = [
    { key: 'contado' as const, label: `Efectivo/Transferencia`, value: contado, off: offContado, desc: `Ahorrá ${offContado}%` },
    { key: 'debito' as const, label: `Débito`, value: debito, off: offDebito, desc: `Ahorrá ${offDebito}%` },
    { key: 'lista' as const, label: 'Precio de lista', value: lista, off: 0, desc: 'Tarjeta de crédito' },
  ];
  const [medioSel, setMedioSel] = useState<MedioKey>('contado');
  const sel = opciones.find(o => o.key === medioSel)!;

  const talleActual =
    (selectedTalle && varianteActual?.talles.find(t => t.talla === selectedTalle)) ||
    varianteActual?.talles[0];

  const stockTotal = varianteActual?.talles.reduce((sum, t) => sum + t.stock, 0) || 0;
  const esUltimasUnidades = stockTotal > 0 && stockTotal <= 3;

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset states al abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedColor(0);
      setSelectedTalle(null);
      setImageZoom(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5491234567890';
    const t = talleActual?.talla ? `\nTalle: ${talleActual.talla}` : '';
    const s = typeof talleActual?.stock === 'number' ? `\nStock disponible: ${talleActual.stock}` : '';
    const mensaje = `Hola! Me interesa el producto:
${producto.nombre}
Marca: ${producto.marca_descripcion}
Color: ${varianteActual.color}${t}${s}
Medio: ${sel.label}
Precio: $${sel.value.toLocaleString('es-AR')}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleAgregar = () => {
    const talle = talleActual?.talla ?? '';
    const color = varianteActual?.color ?? '';
    const id = `${producto.familia_id}-${color}-${talle}-${sel.key}`;
    addItem({
      id,
      nombre: producto.nombre,
      marca: producto.marca_descripcion,
      color,
      talle,
      precio: sel.value,
      stock: talleActual?.stock ?? 0,
    });
    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 2000);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header sticky con botón cerrar */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {producto.destacado && (
                  <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ Destacado
                  </span>
                )}
                {esUltimasUnidades && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                    🔥 Últimas unidades
                  </span>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all hover:scale-110"
                aria-label="Cerrar"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
              <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-8">
                {/* ========== COLUMNA IZQUIERDA: IMAGEN ========== */}
                <div className="space-y-4">
                  {/* Imagen principal grande */}
                  <div 
                    className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden cursor-zoom-in group"
                    onClick={() => setImageZoom(!imageZoom)}
                  >
                    <img
                      src={imageSrc}
                      alt={producto.nombre}
                      className={`w-full h-full object-contain transition-transform duration-300 ${
                        imageZoom ? 'scale-150' : 'group-hover:scale-105'
                      }`}
                    />
                    
                    {/* Indicador de zoom */}
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      🔍 Click para ampliar
                    </div>
                  </div>

                  {/* Galería de colores con thumbnails (preparado para múltiples imágenes) */}
                  {producto.variantes.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {producto.variantes.map((variante, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedColor(index);
                            setSelectedTalle(null);
                            setImageZoom(false);
                          }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedColor === index
                              ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={imageSrc}
                            alt={variante.color}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tags informativos */}
                  <div className="flex flex-wrap gap-2">
                    {producto.taxonomia && (
                      <div className={`text-sm font-semibold px-4 py-2 rounded-lg border ${getTaxonomyColor(producto.taxonomia)}`}>
                        {getTaxonomyIcon(producto.taxonomia)} {producto.taxonomia}
                      </div>
                    )}
                    {producto.linea && (
                      <div className={`text-sm font-semibold px-4 py-2 rounded-lg border ${getLineaColor(producto.linea)}`}>
                        {getLineaIcon(producto.linea)} {producto.linea}
                      </div>
                    )}
                  </div>
                </div>

                {/* ========== COLUMNA DERECHA: INFORMACIÓN ========== */}
                <div className="space-y-6">
                  {/* Título y metadata */}
                  <div className="space-y-2">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                      {producto.nombre}
                    </h2>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      {producto.marca_descripcion && (
                        <span className="text-lg font-semibold text-blue-600">
                          {producto.marca_descripcion}
                        </span>
                      )}
                      {producto.subrubro_nombre && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {producto.subrubro_nombre}
                        </span>
                      )}
                    </div>

                    {/* SKU / Código */}
                    <p className="text-xs text-gray-400 font-mono">
                      SKU: {producto.familia_id} • Código: {varianteActual.codigo}
                    </p>
                  </div>

                  {/* Descripción larga */}
                  {producto.descripcion ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-blue-900 mb-2">Descripción del producto</h3>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {producto.descripcion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 italic">
                        Consultá por WhatsApp para más información sobre este producto.
                      </p>
                    </div>
                  )}

                  {/* Características técnicas */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Características técnicas
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">📦 SKU:</span>
                        <span className="font-semibold text-gray-900">{producto.familia_id}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">🔢 Código:</span>
                        <span className="font-semibold text-gray-900">{varianteActual.codigo}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">🏷️ Marca:</span>
                        <span className="font-semibold text-gray-900">{producto.marca_descripcion || 'N/A'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">📂 Tipo:</span>
                        <span className="font-semibold text-gray-900">{producto.subrubro_nombre || 'N/A'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">❄️ Temporada:</span>
                        <span className="font-semibold text-gray-900">{producto.linea || 'Atemporal'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">📊 Stock:</span>
                        <span className={`font-semibold ${stockTotal <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                          {stockTotal} {stockTotal === 1 ? 'unidad' : 'unidades'}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">🎨 Colores:</span>
                        <span className="font-semibold text-gray-900">{producto.variantes.length} {producto.variantes.length === 1 ? 'opción' : 'opciones'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">📏 Talles:</span>
                        <span className="font-semibold text-gray-900">
                          {varianteActual.talles.length > 0 
                            ? `${varianteActual.talles[0].talla} - ${varianteActual.talles[varianteActual.talles.length - 1].talla}`
                            : 'Consultar'}
                        </span>
                      </div>
                    </div>

                    {/* Nota sobre materiales */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="leading-relaxed">
                          <strong>Información sobre materiales, origen y características específicas:</strong> Consultá por WhatsApp para conocer todos los detalles técnicos del producto.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200" />

                  {/* ========== SELECTOR DE OPCIONES ========== */}

                  {/* Precio destacado */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-green-800 uppercase tracking-wide">
                        {sel.key === 'lista' ? '💳 Precio de lista' : `💰 ${sel.label}`}
                      </span>
                      {sel.off > 0 && (
                        <span className="bg-green-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
                          -{sel.off}% OFF
                        </span>
                      )}
                    </div>
                    <p className="text-5xl font-black text-green-700 mb-1">
                      ${sel.value.toLocaleString('es-AR')}
                    </p>
                    {sel.off > 0 && (
                      <p className="text-sm text-green-600 font-medium">
                        ✨ {sel.desc}
                      </p>
                    )}
                  </div>

                  {/* Selector de medio de pago mejorado */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      💳 Medio de pago:
                    </label>
                    <div className="grid gap-2">
                      {opciones.map((opcion) => (
                        <button
                          key={opcion.key}
                          onClick={() => setMedioSel(opcion.key)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            medioSel === opcion.key
                              ? 'border-blue-600 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-gray-900">{opcion.label}</p>
                              <p className="text-sm text-gray-600">{opcion.desc}</p>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              ${opcion.value.toLocaleString('es-AR')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de color */}
                  {producto.variantes.length > 1 && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        🎨 Color: <span className="font-bold capitalize text-blue-600">{varianteActual.color.toLowerCase()}</span>
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        {producto.variantes.map((variante, index) => {
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
                              className={`relative w-14 h-14 rounded-full transition-all flex items-center justify-center ${
                                isSelected
                                  ? 'ring-4 ring-blue-600 ring-offset-2 scale-110'
                                  : 'ring-2 ring-gray-300 hover:scale-105'
                              }`}
                              style={colorStyle}
                              title={variante.color}
                            >
                              {isSelected && (
                                <svg
                                  className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-800'}`}
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
                    </div>
                  )}

                  {/* Selector de talle mejorado */}
                  {varianteActual?.talles?.length > 0 && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        📏 Talle disponibles:
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {varianteActual.talles.map((talle, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedTalle(talle.talla)}
                            disabled={talle.stock === 0}
                            className={`relative px-4 py-3 text-sm font-bold rounded-lg transition-all ${
                              selectedTalle === talle.talla
                                ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-600 ring-offset-2'
                                : talle.stock === 0
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-base">{talle.talla}</div>
                              <div className="text-[10px] opacity-75">
                                {talle.stock === 0 ? 'Sin stock' : `(${talle.stock})`}
                              </div>
                            </div>
                            {talle.stock > 0 && talle.stock <= 2 && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-gray-200" />

                  {/* ========== BOTONES DE ACCIÓN ========== */}
                  <div className="space-y-3 sticky bottom-0 bg-white pt-4 pb-2">
                    <button
                      onClick={handleAgregar}
                      disabled={!talleActual || talleActual.stock === 0}
                      className="w-full flex items-center justify-center gap-3 rounded-xl px-6 py-5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar a mi consulta
                    </button>

                    <button
                      onClick={handleWhatsApp}
                      className="w-full flex items-center justify-center gap-3 rounded-xl px-6 py-4 border-2 border-green-500 text-green-600 hover:bg-green-50 font-bold transition-all hover:scale-[1.02]"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Consultar por WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback de agregado mejorado */}
      {showAddedFeedback && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-2xl shadow-2xl z-[60] flex items-center gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-bold text-lg">¡Producto agregado a tu consulta!</span>
        </div>
      )}
    </>
  );
}
