'use client';

import { useState } from 'react';
import Image from 'next/image';
import { calcularPrecios } from '@/lib/pricing';

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
  precio_lista: number;
  fecha_compra: string | null;
  variantes: VarianteColor[];
}

export default function ProductCardFamily({
  nombre,
  marca_descripcion,
  precio_lista,
  fecha_compra,
  variantes,
}: Props) {
  const [colorSeleccionado, setColorSeleccionado] = useState(variantes[0]?.color || '');
  const [talleSeleccionado, setTalleSeleccionado] = useState('');
  const [imageError, setImageError] = useState(false);

  const { lista, contado, debito, descuento, recargoDeb } = calcularPrecios(precio_lista);

  const varianteActual = variantes.find((v) => v.color === colorSeleccionado);
  const tallesDisponibles = varianteActual?.talles || [];
  const imagenCodigo = varianteActual?.imagen_codigo || variantes[0]?.imagen_codigo;

  const esNuevo = fecha_compra
    ? (new Date().getTime() - new Date(fecha_compra).getTime()) / (1000 * 60 * 60 * 24) < 30
    : false;

  const stockTotal = tallesDisponibles.reduce((sum, t) => sum + t.stock, 0);
  const ultimasUnidades = stockTotal > 0 && stockTotal <= 5;

  const handleWhatsApp = () => {
    const talleInfo = talleSeleccionado ? ` - Talle ${talleSeleccionado}` : '';
    const colorInfo = colorSeleccionado ? ` - Color ${colorSeleccionado}` : '';
    const mensaje = `Hola! Me interesa este producto:\n${nombre}${colorInfo}${talleInfo}\nPrecio contado: $${contado.toLocaleString('es-AR')}`;
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
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">Sin imagen</p>
          </div>
        )}

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
        <h3 className="font-bold text-lg mb-1 line-clamp-2">{nombre}</h3>
        {marca_descripcion && (
          <p className="text-gray-600 text-sm mb-4">{marca_descripcion}</p>
        )}

        {/* Precios */}
        <div className="mb-4 space-y-1 border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Contado (-{descuento}%)</span>
            <span className="text-lg font-bold text-green-600">
              ${contado.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Débito (+{recargoDeb}%)</span>
            <span className="text-sm text-gray-700">
              ${debito.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Precio de lista</span>
            <span className="text-sm text-gray-700">
              ${lista.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        <button
          onClick={handleWhatsApp}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-md transition-colors"
        >
          Consultar por WhatsApp
        </button>
      </div>
    </div>
  );
}
