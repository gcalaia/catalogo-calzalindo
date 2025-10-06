'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ConsultaItem {
  id: string;              // único: ej "familiaId-color-talle"
  nombre: string;
  marca: string | null;
  color: string;
  talle: string;
  precio: number;          // precio contado mostrado en la card
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

const LS_KEY = 'consulta_items_v1';

export function ConsultaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ConsultaItem[]>([]);

  // Cargar desde localStorage al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch (e) {
      console.error('Error loading consulta items:', e);
    }
  }, []);

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (item: ConsultaItem) => {
    setItems(prev => {
      // evitar duplicados por id
      if (prev.some(i => i.id === item.id)) return prev;
      return [item, ...prev];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => setItems([]);

  return (
    <ConsultaContext.Provider
      value={{ items, addItem, removeItem, clearAll, itemCount: items.length }}
    >
      {children}
    </ConsultaContext.Provider>
  );
}

export function useConsulta() {
  const ctx = useContext(ConsultaContext);
  if (!ctx) throw new Error('useConsulta must be used within ConsultaProvider');
  return ctx;
}
