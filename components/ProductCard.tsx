// components/ProductCard.tsx
'use client'

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ImageOff } from 'lucide-react';

interface ProductCardProps {
  codigo: number;
  nombre: string;
  talla?: string | null;
  color?: string | null;
  marca_descripcion?: string | null;
  precio_lista: number;
  stock_disponible: number;
  imagen_url?: string | null;
}

export default function ProductCard({
  codigo,
  nombre,
  talla,
  color,
  marca_descripcion,
  precio_lista,
  stock_disponible,
  imagen_url,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const whatsappMessage = `Hola! Me interesa el producto:\n*${nombre}*\nCódigo: ${codigo}${talla ? `\nTalla: ${talla}` : ''}${color ? `\nColor: ${color}` : ''}\nPrecio: $${precio_lista.toLocaleString('es-AR')}`;
  const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

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
        
        {stock_disponible <= 5 && stock_disponible > 0 && (
          <Badge className="absolute top-2 right-2 bg-orange-500">
            ¡Últimas unidades!
          </Badge>
        )}
        {stock_disponible === 0 && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            Sin stock
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        {marca_descripcion && (
          <p className="text-sm text-gray-500 font-medium mb-1">
            {marca_descripcion}
          </p>
        )}

        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {nombre}
        </h3>

        {/* Solo mostrar badges si tienen valores válidos */}
        {(talla || color) && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {talla && (
              <Badge variant="outline" className="text-xs">
                Talla {talla}
              </Badge>
            )}
            {color && (
              <Badge variant="outline" className="text-xs">
                {color}
              </Badge>
            )}
          </div>
        )}

        <p className="text-2xl font-bold text-primary mb-1">
          ${precio_lista.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

        <p className="text-sm text-gray-600">
          Stock: {stock_disponible} {stock_disponible === 1 ? 'unidad' : 'unidades'}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          onClick={() => window.open(whatsappUrl, '_blank')}
          disabled={stock_disponible === 0}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Consultar por WhatsApp
        </Button>
      </CardFooter>
    </Card>
  );
}