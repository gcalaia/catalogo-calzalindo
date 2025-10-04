'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X } from 'lucide-react';

export interface FilterValues {
  search: string;
  marca: string;
  talla: string;
  color: string;
  rubro: string;
}

interface FiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  marcas: string[];
  tallas: string[];
  colores: string[];
  rubros: string[];
}

export default function Filters({ 
  onFilterChange, 
  marcas, 
  tallas, 
  colores,
  rubros
}: FiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    marca: '',
    talla: '',
    color: '',
    rubro: '',
  });

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      marca: '',
      talla: '',
      color: '',
      rubro: '',
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filtros</CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
            >
              <X className="mr-1 h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar producto..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Ordenar por */}
        <div>
          <label className="text-sm font-medium mb-2 block">Ordenar por</label>
          <select
            onChange={(e) => {
              const event = new CustomEvent('ordenar', { detail: e.target.value });
              window.dispatchEvent(event);
            }}
            className="w-full p-2 border rounded-md bg-white"
          >
            <option value="nombre">Nombre (A-Z)</option>
            <option value="recientes">Recién llegados</option>
            <option value="antiguos">Más antiguos (rotar stock)</option>
            <option value="precio-menor">Precio: menor a mayor</option>
            <option value="precio-mayor">Precio: mayor a menor</option>
          </select>
        </div>

        {/* Categoría (Rubro) */}
        <div>
          <label className="text-sm font-medium mb-2 block">Categoría</label>
          <select
            value={filters.rubro}
            onChange={(e) => handleFilterChange('rubro', e.target.value)}
            className="w-full p-2 border rounded-md bg-white"
          >
            <option value="">Todas las categorías</option>
            {rubros.map((rubro) => (
              <option key={rubro} value={rubro}>
                {rubro}
              </option>
            ))}
          </select>
        </div>

        {/* Marca */}
        <div>
          <label className="text-sm font-medium mb-2 block">Marca</label>
          <select
            value={filters.marca}
            onChange={(e) => handleFilterChange('marca', e.target.value)}
            className="w-full p-2 border rounded-md bg-white"
          >
            <option value="">Todas las marcas</option>
            {marcas.map((marca) => (
              <option key={marca} value={marca}>
                {marca}
              </option>
            ))}
          </select>
        </div>

        {/* Talla */}
        <div>
          <label className="text-sm font-medium mb-2 block">Talla</label>
          <select
            value={filters.talla}
            onChange={(e) => handleFilterChange('talla', e.target.value)}
            className="w-full p-2 border rounded-md bg-white"
          >
            <option value="">Todas las tallas</option>
            {tallas.map((talla) => (
              <option key={talla} value={talla}>
                {talla}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="text-sm font-medium mb-2 block">Color</label>
          <select
            value={filters.color}
            onChange={(e) => handleFilterChange('color', e.target.value)}
            className="w-full p-2 border rounded-md bg-white"
          >
            <option value="">Todos los colores</option>
            {colores.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}