'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface ConsultaItem {
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

// ---------- Ajustes de persistencia ----------
const STORAGE_KEY = 'consulta_state_v1';
// Poné NEXT_PUBLIC_APP_VERSION en tu .env si querés controlarlo desde el deploy.
// Si no existe, usa '1' y solo cambiará cuando actualices este archivo.
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1';
// Tiempo de vida: 7 días
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

type StoredShape = {
  version: string;
  savedAt: number;
  items: ConsultaItem[];
};

export function ConsultaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ConsultaItem[]>([]);

  // Cargar (con chequeo de versión y vencimiento)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw) as StoredShape;
      const expired = Date.now() - data.savedAt > TTL_MS;
      const versionChanged = data.version !== APP_VERSION;

      if (expired || versionChanged) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // si falla el parse, empezamos vacío
      setItems([]);
    }
  }, []);

  // Guardar cada cambio
  useEffect(() => {
    try {
      const payload: StoredShape = {
        version: APP_VERSION,
        savedAt: Date.now(),
        items,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [items]);

  const addItem = (item: ConsultaItem) => {
    setItems((prev) => {
      const exists = prev.find(
        (i) => i.id === item.id || (i.nombre === item.nombre && i.color === item.color && i.talle === item.talle)
      );
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clearAll = () => setItems([]);

  return (
    <ConsultaContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearAll,
        itemCount: items.length,
      }}
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
