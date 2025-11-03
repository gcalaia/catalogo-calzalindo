'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FilterOption {
  id: number;
  nombre: string;
}

interface FiltersProps {
  onFilterChange: (filters: {
    marca_id?: number;
    rubro_id?: number;
    subrubro_id?: number;
  }) => void;
}

export default function Filters({ onFilterChange }: FiltersProps) {
  const [marcas, setMarcas] = useState<FilterOption[]>([]);
  const [rubros, setRubros] = useState<FilterOption[]>([]);
  const [subrubros, setSubrubros] = useState<FilterOption[]>([]);
  
  const [selectedMarca, setSelectedMarca] = useState<number | undefined>();
  const [selectedRubro, setSelectedRubro] = useState<number | undefined>();
  const [selectedSubrubro, setSelectedSubrubro] = useState<number | undefined>();

  // Cargar filtros disponibles
  // Cargar filtros disponibles
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await fetch('/api/filtros');
        if (!response.ok) {
          throw new Error('Error al cargar filtros');
        }
        const data = await response.json();
        
        // Asegurarse de que los datos existen y tienen la propiedad 'nombre'
        setMarcas(Array.isArray(data.marcas) ? data.marcas.filter((m: FilterOption) => m.nombre) : []);
        setRubros(Array.isArray(data.rubros) ? data.rubros.filter((r: FilterOption) => r.nombre) : []);
        setSubrubros(Array.isArray(data.subrubros) ? data.subrubros.filter((s: FilterOption) => s.nombre) : []);
      } catch (error) {
        console.error('Error cargando filtros:', error);
        // Establecer arrays vacíos en caso de error
        setMarcas([]);
        setRubros([]);
        setSubrubros([]);
      }
    };
    
    loadFilters();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    onFilterChange({
      marca_id: selectedMarca,
      rubro_id: selectedRubro,
      subrubro_id: selectedSubrubro,
    });
  }, [selectedMarca, selectedRubro, selectedSubrubro, onFilterChange]);

  const clearFilters = () => {
    setSelectedMarca(undefined);
    setSelectedRubro(undefined);
    setSelectedSubrubro(undefined);
  };

  const hasActiveFilters = selectedMarca || selectedRubro || selectedSubrubro;

  return (
    <div className="space-y-4">
      {/* Botón limpiar filtros */}
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={clearFilters}
        >
          Limpiar filtros
        </Button>
      )}

      {/* Filtro por Rubro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rubros.map((rubro) => (
            <button
              key={rubro.id}
              onClick={() => setSelectedRubro(rubro.id === selectedRubro ? undefined : rubro.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedRubro === rubro.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-gray-100'
              }`}
            >
              {rubro.nombre}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Filtro por Marca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {marcas.map((marca) => (
            <button
              key={marca.id}
              onClick={() => setSelectedMarca(marca.id === selectedMarca ? undefined : marca.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedMarca === marca.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-gray-100'
              }`}
            >
              {marca.nombre}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Filtro por Subrubro */}
      {subrubros.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Subcategoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {subrubros.map((subrubro) => (
              <button
                key={subrubro.id}
                onClick={() => setSelectedSubrubro(subrubro.id === selectedSubrubro ? undefined : subrubro.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedSubrubro === subrubro.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                {subrubro.nombre}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
