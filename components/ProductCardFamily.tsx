'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Talle {
  talla: string;
  stock: number;
  codigo: number;
}

interface VarianteColor {
  color: string;
  imagen_codigo: number;
  talles: Talle[];
}

interface Props {
  nombre: string;
  marca_descripcion: string | null;
  precio_contado: number;
  precio_debito: number;
  precio_regular: number;
  fecha_compra: string | null;
  variantes: VarianteColor[];
}

export default function ProductCardFamily({
  nombre,
  marca_descripcion,
  precio_contado,
  precio_debito,
  precio_regular,
  fecha_compra,
  variantes,
}: Props) {
  const [colorSeleccionado, setColorSeleccionado] = useState(variantes[0]?.color || '');
  const [talleSeleccionado, setTalleSeleccionado] = useState('');
  const [imageError, setImageError] = useState(false);

  const varianteActual = variantes.find((v) => v.color === colorSeleccionado);
  const tallesDisponibles = varianteActual?.talles || [];
  const imagenCodigo = varianteActual?.imagen_codigo || variantes[0]?.imagen_codigo;

  // Calcular si es nuevo (menos de 30 días)
  const esNuevo = fecha_compra
    ? (new Date().getTime() - new Date(fecha_compra).getTime()) / (1000 * 60 * 60 * 24) < 30
    : false;

  // Calcular stock total de la variante seleccionada
  const stockTotal = tallesDisponibles.reduce((sum, t) => sum + t.stock, 0);
  const ultimasUnidades = stockTotal > 0 && stockTotal <= 5;

  const handleWhatsApp = () => {
    const talleInfo = talleSeleccionado
      ? ` - Talle ${talleSeleccionado}`
      : '';
    const colorInfo = colorSeleccionado ? ` - Color ${colorSeleccionado}` : '';
    const mensaje = `Hola! Me interesa este producto:\n${nombre}${colorInfo}${talleInfo}\nPrecio contado: $${precio_contado.toLocaleString()}`;
    const whatsappUrl = `https://wa.me/5491234567890?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      {/* Imagen */}
      <div className="relative h-64 bg-gray-100">
        {!imageError ? (
          <Image
            src={`http://190.221.84.98:8082/imagenes/${imagenCodigo}.jpg`}
            alt={nombre}
            fill
            className="object-contain p-4"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <svg
                className="mx-auto h-12 w-12 mb-2"
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
              <p className="text-sm">Sin imagen</p>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {esNuevo && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
              ¡Nuevo!
            </span>
          )}
          {ultimasUnidades && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              ¡Últimas unidades!
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Nombre y Marca */}
        <h3 className="font-bold text-lg mb-1 line-clamp-2">{nombre}</h3>
        {marca_descripcion && (
          <p className="text-gray-600 text-sm mb-4">{marca_descripcion}</p>
        )}

        {/* Selector de Color */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Color: <span className="font-bold">{colorSeleccionado}</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {variantes.map((variante) => (
              <button
                key={variante.color}
                onClick={() => {
                  setColorSeleccionado(variante.color);
                  setTalleSeleccionado('');
                  setImageError(false);
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  colorSeleccionado === variante.color
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {variante.color}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Talle */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Talle:
          </label>
          <select
            value={talleSeleccionado}
            onChange={(e) => setTalleSeleccionado(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar talle</option>
            {tallesDisponibles.map((talle) => (
              <option key={talle.codigo} value={talle.talla}>
                Talle {talle.talla} - Stock: {talle.stock}
              </option>
            ))}
          </select>
        </div>

        {/* Precios */}
        <div className="mb-4 space-y-1 border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Contado (-5%)</span>
            <span className="text-lg font-bold text-green-600">
              ${precio_contado.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Débito (+5%)</span>
            <span className="text-sm text-gray-700">
              ${precio_debito.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">12 cuotas s/int</span>
            <span className="text-sm text-gray-700">
              ${Math.round(precio_regular / 12).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Total crédito: ${precio_regular.toLocaleString()} (+43% costo financiero)
          </p>
        </div>

        {/* Botón WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          Consultar por WhatsApp
        </button>
      </div>
    </div>
  );
}