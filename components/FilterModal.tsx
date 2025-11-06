'use client';

import { useEffect, useState } from 'react';
import { getTaxonomyIcon, getLineaIcon } from '@/lib/taxonomyIcons';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  
  // Filtros disponibles
  taxonomias: { nombre: string; descripcion: string | null }[];
  lineas: string[];
  marcas: string[];
  rubros: { value: string; label: string }[];
  
  // Valores actuales
  taxonomiaSeleccionada: string;
  lineaSeleccionada: string;
  marcaSeleccionada: string;
  rubroSeleccionado: string;
  soloDestacados: boolean;
  
  // Handlers
  onTaxonomiaChange: (taxonomia: string) => void;
  onLineaChange: (linea: string) => void;
  onMarcaChange: (marca: string) => void;
  onRubroChange: (rubro: string) => void;
  onDestacadosChange: (destacados: boolean) => void;
  
  // Total de productos con filtros actuales
  totalResultados?: number;
}

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  taxonomias,
  lineas,
  marcas,
  rubros,
  taxonomiaSeleccionada,
  lineaSeleccionada,
  marcaSeleccionada,
  rubroSeleccionado,
  soloDestacados,
  onTaxonomiaChange,
  onLineaChange,
  onMarcaChange,
  onRubroChange,
  onDestacadosChange,
  totalResultados,
}: FilterModalProps) {
  const [searchMarca, setSearchMarca] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>('tipo');

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

  if (!isOpen) return null;

  const marcasFiltradas = marcas.filter((marca) =>
    marca.toLowerCase().includes(searchMarca.toLowerCase())
  );

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const hayFiltros = 
    taxonomiaSeleccionada || 
    lineaSeleccionada || 
    marcaSeleccionada || 
    rubroSeleccionado !== 'all' || 
    soloDestacados;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-x-0 bottom-0 top-0 bg-white flex flex-col animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* ========== TIPO DE PRODUCTO ========== */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('tipo')}
                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between font-semibold text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <span>📂</span>
                  Tipo de producto
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${activeSection === 'tipo' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeSection === 'tipo' && (
                <div className="p-4 space-y-2 bg-white">
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="taxonomia"
                      checked={!taxonomiaSeleccionada}
                      onChange={() => onTaxonomiaChange('')}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="font-medium">Todos</span>
                  </label>
                  
                  {taxonomias.map((tax) => (
                    <label
                      key={tax.nombre}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="taxonomia"
                        checked={taxonomiaSeleccionada === tax.nombre}
                        onChange={() => onTaxonomiaChange(tax.nombre)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-xl">{getTaxonomyIcon(tax.nombre)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{tax.nombre}</div>
                        {tax.descripcion && (
                          <div className="text-xs text-gray-500">{tax.descripcion}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ========== TEMPORADA ========== */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('temporada')}
                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between font-semibold text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <span>🌡️</span>
                  Temporada
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${activeSection === 'temporada' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeSection === 'temporada' && (
                <div className="p-4 space-y-2 bg-white">
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="linea"
                      checked={!lineaSeleccionada}
                      onChange={() => onLineaChange('')}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="font-medium">Todas</span>
                  </label>
                  
                  {lineas.map((linea) => (
                    <label
                      key={linea}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="linea"
                        checked={lineaSeleccionada === linea}
                        onChange={() => onLineaChange(linea)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-xl">{getLineaIcon(linea)}</span>
                      <span className="font-medium text-gray-900">{linea}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ========== RUBRO ========== */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('rubro')}
                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between font-semibold text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <span>👤</span>
                  Rubro
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${activeSection === 'rubro' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeSection === 'rubro' && (
                <div className="p-4 space-y-2 bg-white">
                  {rubros.map((rubro) => (
                    <label
                      key={rubro.value}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="rubro"
                        checked={rubroSeleccionado === rubro.value}
                        onChange={() => onRubroChange(rubro.value)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="font-medium text-gray-900">{rubro.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ========== MARCA ========== */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('marca')}
                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between font-semibold text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <span>🏷️</span>
                  Marca
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${activeSection === 'marca' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeSection === 'marca' && (
                <div className="p-4 space-y-3 bg-white">
                  {/* Buscador de marcas */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar marca..."
                      value={searchMarca}
                      onChange={(e) => setSearchMarca(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="marca"
                        checked={!marcaSeleccionada}
                        onChange={() => onMarcaChange('')}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="font-medium">Todas</span>
                    </label>
                    
                    {marcasFiltradas.length > 0 ? (
                      marcasFiltradas.map((marca) => (
                        <label
                          key={marca}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="marca"
                            checked={marcaSeleccionada === marca}
                            onChange={() => onMarcaChange(marca)}
                            className="w-5 h-5 text-blue-600"
                          />
                          <span className="font-medium text-gray-900">{marca}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        No se encontraron marcas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ========== DESTACADOS ========== */}
            <label className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 border-2 border-yellow-200 cursor-pointer">
              <input
                type="checkbox"
                checked={soloDestacados}
                onChange={(e) => onDestacadosChange(e.target.checked)}
                className="w-5 h-5 text-yellow-600 rounded"
              />
              <div className="flex-1">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  <span>⭐</span>
                  Solo destacados
                </div>
                <div className="text-xs text-gray-600">
                  Productos seleccionados especialmente
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3 shadow-lg">
          {hayFiltros && (
            <button
              onClick={() => {
                onTaxonomiaChange('');
                onLineaChange('');
                onMarcaChange('');
                onRubroChange('all');
                onDestacadosChange(false);
              }}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              🗑️ Limpiar filtros
            </button>
          )}
          
          <button
            onClick={() => {
              onApply();
              onClose();
            }}
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            {totalResultados !== undefined
              ? `Aplicar (${totalResultados.toLocaleString()} productos)`
              : 'Aplicar filtros'}
          </button>
        </div>
      </div>
    </div>
  );
}
