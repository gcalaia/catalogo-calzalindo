'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ConsultaItem {
  id: string;
  nombre: string;
  marca: string | null;
  color: string;
  talle: string;
  precio: number;
  stock: number;
}

interface ConsultaContextType {
  items: ConsultaItem[];
  addItem: (item: ConsultaItem) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  itemCount: number;
}

const ConsultaContext = createContext<ConsultaContextType | undefined>(undefined);

export function ConsultaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ConsultaItem[]>([]);

  // Cargar desde localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('consulta_items');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading consulta items:', e);
      }
    }
  }, []);

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('consulta_items', JSON.stringify(items));
  }, [items]);

  const addItem = (item: ConsultaItem) => {
    setItems(prev => {
      // Evitar duplicados (mismo producto, color y talle)
      const exists = prev.find(i => 
        i.nombre === item.nombre && 
        i.color === item.color && 
        i.talle === item.talle
      );
      
      if (exists) {
        return prev; // Ya existe, no agregar
      }
      
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setItems([]);
  };

  return (
    <ConsultaContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearAll,
      itemCount: items.length
    }}>
      {children}
    </ConsultaContext.Provider>
  );
}

export function useConsulta() {
  const context = useContext(ConsultaContext);
  if (!context) {
    throw new Error('useConsulta must be used within ConsultaProvider');
  }
  return context;
}
