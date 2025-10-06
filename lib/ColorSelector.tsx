// lib/ColorSelector.tsx
'use client';

import { getColorStyle, isColorDark, getColorHex } from '@/lib/colorMap';

interface ColorSelectorProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export function ColorSelector({ colors, selectedColor, onColorSelect }: ColorSelectorProps) {
  if (!colors || colors.length === 0) return null;
  
  return (
    <div className="flex gap-2 items-center flex-wrap">
      <span className="text-sm text-gray-600">Color:</span>
      
      <div className="flex gap-2 flex-wrap">
        {colors.map((color) => {
          const isSelected = selectedColor === color;
          const colorStyle = getColorStyle(color);
          const hexColor = getColorHex(color);
          const isDark = isColorDark(hexColor);
          
          return (
            <button
              key={color}
              onClick={() => onColorSelect(color)}
              className={`
                w-9 h-9 rounded-full transition-all flex items-center justify-center
                ${isSelected 
                  ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' 
                  : 'ring-1 ring-gray-300 hover:scale-105'
                }
              `}
              style={colorStyle}
              title={color}
              aria-label={`Seleccionar color ${color}`}
            >
              {isSelected && (
                <svg 
                  className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-800'}`}
                  fill="none" 
                  strokeWidth="3" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      
      <span className="text-sm font-medium text-gray-800 capitalize">
        {selectedColor.toLowerCase()}
      </span>
    </div>
  );
}
