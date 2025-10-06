'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ImageOff, CreditCard, Banknote, ChevronDown, ChevronUp } from 'lucide-react';
import { calcularPrecios } from '@/lib/pricing';

interface Variante {
  id: number;
  codigo: number;
  talla: string | null;
  color: string | null;
  stock_disponible: number;
}

interface ProductCardGroupedProps {
  nombre: string;
  marca_descripcion?: string | null;
  precio_lista: number;
  imagen_url?: string | null;
  fecha_compra?: string | null;
  variantes: Variante[];
}

export default function ProductCardGrouped({
  nombre,
  marca_descripcion,
  precio_lista,
  imagen_url,
  fecha_compra,
  variantes,
}: ProductCardGroupedProps) {
  const [imageError, setImageError] = useState(false);
  const [mostrarPrecios, setMostrarPrecios] = useState(false);

  const { contado, debito, lista, descuento, recargoDeb } = calcularPrecios(precio_lista);

  const variantesOrdenadas = [...variantes].sort((a, b) => {
    const tallaA = parseFloat(a.talla || '0');
    const tallaB = parseFloat(b.talla || '0');
    return tallaA - tallaB;
  });

  const [varianteSeleccionada, setVarianteSeleccionada] = useState<Variante>(variantesOrdenadas[0]);
  const esNuevo = fecha_compra
    ? (new Date().getTime() - new Date(fecha_compra).getTime()) / (1000 * 60 * 60 * 24) < 30
    : false;

  const stockTotal = variantes.reduce((sum, v) => sum + v.stock_disponible, 0);
  const stockBajo = stockTotal <= 5 && stockTotal > 0;

  const whatsappMessage = `Hola! Me interesa el producto:\n*${nombre}*\nCódigo: ${varianteSeleccionada.codigo}${varianteSeleccionada.talla ? `\nTalla: ${varianteSeleccionada.talla}` : ''}${varianteSeleccionada.color ? `\nColor: ${varianteSeleccionada.color}` : ''}\n\nPrecio contado: $${contado.toLocaleString('es-AR')}`;
  const whatsappUrl = `https://wa.me/5491234567890?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-64 bg-gray-100">
        {!imageError && imagen_url ? (
          <Image
            src={imagen_url}
            alt={nombre}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ImageOff className="h-16 w-16 mb-2" />
            <span className="text-sm">Sin imagen</span>
          </div>
        )}

        {esNuevo && (
          <Badge className="absolute top-2 left-2 bg-blue-500">
            ¡Nuevo!
          </Badge>
        )}

        {stockBajo && (
          <Badge className="absolute top-2 right-2 bg-orange-500">
            ¡Últimas unidades!
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        {marca_descripcion && (
          <p className="text-sm text-gray-500 font-medium mb-1">{marca_descripcion}</p>
        )}
        <h3 className="font-semibold text-lg mb-3 line-clamp-2">{nombre}</h3>

        <div className="mb-2 bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wide text-green-700 font-semibold flex items-center gap-1">
              <Banknote className="h-3.5 w-3.5" />
              Precio Contado
            </span>
            <span className="text-xs text-green-600 font-medium">
              + -{offContado}% OFF
            </span>
          </div>
          <p className="text-3xl font-bold text-green-700">
            ${contado.toLocaleString('es-AR')}
          </p>
        </div>

        <button
          onClick={() => setMostrarPrecios(!mostrarPrecios)}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 py-2 hover:bg-blue-50 rounded transition-colors"
        >
          {mostrarPrecios ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Ocultar otros medios de pago
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Ver otros medios de pago
            </>
          )}
        </button>

        {mostrarPrecios && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <div className="pb-3 border-b border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  + Débito (+{offDebito}%)
                </span>
              </div>
              <p className="text-xl font-bold text-gray-800">
                ${debito.toLocaleString('es-AR')}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Precio Lista
                </span>
              </div>
              <p className="text-xl font-bold text-gray-800">
                ${lista.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mt-3">
          Stock: {varianteSeleccionada.stock_disponible}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={() => window.open(whatsappUrl, '_blank')}
          disabled={varianteSeleccionada.stock_disponible === 0}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Consultar por WhatsApp
        </Button>
      </CardFooter>
    </Card>
  );
}
