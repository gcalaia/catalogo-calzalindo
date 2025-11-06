"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface MegaMenuProps {
  items: NavItem[];
}

export function MegaMenu({ items }: MegaMenuProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  return (
    <nav className="hidden lg:block border-b border-neutral-200">
      {/* Tabs principales */}
      <div className="container mx-auto px-4">
        <ul className="flex items-center gap-6 h-12">
          {items.map((item) => (
            <li
              key={item.label}
              className="relative"
              onMouseEnter={() => setActiveTab(item.label)}
              onMouseLeave={() => {
                setActiveTab(null);
                setActiveSubmenu(null);
              }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-colors h-12",
                  "hover:text-neutral-900",
                  activeTab === item.label ? "text-neutral-900" : "text-neutral-600"
                )}
              >
                {item.icon && <span className="text-base">{item.icon}</span>}
                {item.label}
                {item.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded">
                    {item.badge}
                  </span>
                )}
              </Link>

              {/* Mega menú desplegable */}
              {item.children && activeTab === item.label && (
                <div className="absolute left-0 top-full bg-white shadow-xl border-t border-neutral-200 z-50 rounded-b-lg">
                  <div className="p-6 min-w-[800px] max-w-5xl">
                    <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                      {item.children.slice(0, 6).map((category) => (
                        <div key={category.label}>
                          {/* Categoría principal */}
                          <div
                            className="mb-3"
                            onMouseEnter={() => setActiveSubmenu(category.label)}
                          >
                            <Link
                              href={category.href}
                              className="flex items-center gap-2 text-xs font-bold text-neutral-900 hover:text-blue-600 transition-colors uppercase tracking-wide"
                            >
                              {category.icon && (
                                <span className="text-sm">{category.icon}</span>
                              )}
                              {category.label}
                            </Link>
                          </div>

                          {/* Subcategorías */}
                          {category.children && (
                            <ul className="space-y-1.5">
                              {category.children.slice(0, 6).map((subcategory) => (
                                <li
                                  key={subcategory.label}
                                  onMouseEnter={() => setActiveSubmenu(subcategory.label)}
                                >
                                  <Link
                                    href={subcategory.href}
                                    className="flex items-center justify-between text-xs text-neutral-600 hover:text-blue-600 transition-colors group py-1"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      {subcategory.icon && (
                                        <span className="text-sm">{subcategory.icon}</span>
                                      )}
                                      {subcategory.label}
                                    </span>
                                    {subcategory.children && (
                                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                  </Link>

                                  {/* Sub-subcategorías (nivel 3) */}
                                  {subcategory.children &&
                                    activeSubmenu === subcategory.label && (
                                      <ul className="ml-3 mt-1.5 space-y-1 pl-2 border-l-2 border-neutral-200">
                                        {subcategory.children.slice(0, 5).map((item) => (
                                          <li key={item.label}>
                                            <Link
                                              href={item.href}
                                              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-blue-600 transition-colors py-0.5"
                                            >
                                              {item.icon && (
                                                <span className="text-xs">{item.icon}</span>
                                              )}
                                              {item.label}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Ver todos si hay más de 6 items */}
                          {category.children && category.children.length > 6 && (
                            <Link
                              href={category.href}
                              className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Ver todos →
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
