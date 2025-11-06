"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  items: NavItem[];
}

export function MobileMenu({ items }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (label: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const isExpanded = (label: string) => expandedCategories.has(label);

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const expanded = isExpanded(item.label);

    return (
      <div key={item.label} className={cn("border-b border-neutral-200")}>
        <div className="flex items-center">
          {/* Link o botón para expandir */}
          {hasChildren ? (
            <button
              onClick={() => toggleCategory(item.label)}
              className={cn(
                "flex items-center justify-between w-full py-3 px-4 text-left transition-colors",
                "hover:bg-neutral-50",
                level === 0 && "font-semibold text-base",
                level === 1 && "font-medium text-sm pl-8",
                level === 2 && "text-sm pl-12"
              )}
            >
              <span className="flex items-center gap-3">
                {item.icon && <span className="text-lg">{item.icon}</span>}
                {item.label}
                {item.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded">
                    {item.badge}
                  </span>
                )}
              </span>
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <Link
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 w-full py-3 px-4 transition-colors",
                "hover:bg-neutral-50",
                level === 0 && "font-semibold text-base",
                level === 1 && "font-medium text-sm pl-8",
                level === 2 && "text-sm pl-12"
              )}
            >
              {item.icon && <span className="text-lg">{item.icon}</span>}
              {item.label}
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Subcategorías (acordeón) */}
        {hasChildren && expanded && (
          <div className="bg-neutral-50">
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lg:hidden">
      {/* Botón hamburguesa */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-neutral-100 rounded-md transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header del drawer */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-bold">Menú</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-neutral-100 rounded-md transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del drawer */}
        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {items.map((item) => renderNavItem(item))}
        </div>
      </div>
    </div>
  );
}
