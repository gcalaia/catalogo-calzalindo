'use client';

import { getTaxonomyIcon, getLineaIcon } from '@/lib/taxonomyIcons';

interface SidebarProps {
  // Filtros disponibles
  taxonomias: { nombre: string; descripcion: string | null }[];
  lineas: string[];
  marcas: string[];
  rubros: { value: string; label: string }[];
  
  // Valores seleccionados
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
  onLimpiarFiltros: () => void;
  
  // Estado
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
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
  onLimpiarFiltros,
  isOpen,
  onToggle,
}: SidebarProps) {
  
  const hayFiltrosActivos = 
    taxonomiaSeleccionada || 
    lineaSeleccionada || 
    marcaSeleccionada || 
    rubroSeleccionado !== 'all' || 
    soloDestacados;

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          w-80 bg-white border-r border-gray-200
          overflow-y-auto z-50
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 space-y-6">
          {/* Header del sidebar */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </h2>
            
            {/* Botón cerrar (solo mobile) */}
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Botón limpiar filtros */}
          {hayFiltrosActivos && (
            <button
              onClick={onLimpiarFiltros}
              className="w-full px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          )}

          {/* ========== FILTRO: TIPO (TAXONOMÍA) ========== */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span>📂</span>
              Tipo de producto
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="taxonomia"
                  checked={!taxonomiaSeleccionada}
                  onChange={() => onTaxonomiaChange('')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-700">Todos</span>
              </label>
              
              {taxonomias.map((tax) => (
                <label
                  key={tax.nombre}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="taxonomia"
                    checked={taxonomiaSeleccionada === tax.nombre}
                    onChange={() => onTaxonomiaChange(tax.nombre)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-lg">{getTaxonomyIcon(tax.nombre)}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{tax.nombre}</div>
                    {tax.descripcion && (
                      <div className="text-xs text-gray-500">{tax.descripcion}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* ========== FILTRO: TEMPORADA (LÍNEA) ========== */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span>🌡️</span>
              Temporada
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="linea"
                  checked={!lineaSeleccionada}
                  onChange={() => onLineaChange('')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-700">Todas</span>
              </label>
              
              {lineas.map((linea) => (
                <label
                  key={linea}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="linea"
                    checked={lineaSeleccionada === linea}
                    onChange={() => onLineaChange(linea)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-lg">{getLineaIcon(linea)}</span>
                  <span className="font-medium text-gray-900">{linea}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* ========== FILTRO: RUBRO ========== */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span>👤</span>
              Rubro
            </h3>
            <div className="space-y-2">
              {rubros.map((rubro) => (
                <label
                  key={rubro.value}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="rubro"
                    checked={rubroSeleccionado === rubro.value}
                    onChange={() => onRubroChange(rubro.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">{rubro.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* ========== FILTRO: MARCA ========== */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span>🏷️</span>
              Marca
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="marca"
                  checked={!marcaSeleccionada}
                  onChange={() => onMarcaChange('')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-700">Todas</span>
              </label>
              
              {marcas.map((marca) => (
                <label
                  key={marca}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="marca"
                    checked={marcaSeleccionada === marca}
                    onChange={() => onMarcaChange(marca)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">{marca}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* ========== FILTRO: DESTACADOS ========== */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 border-2 border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors">
              <input
                type="checkbox"
                checked={soloDestacados}
                onChange={(e) => onDestacadosChange(e.target.checked)}
                className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
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
      </aside>
    </>
  );
}
