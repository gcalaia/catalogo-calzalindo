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
        <ul className="flex items-center gap-8 h-14">
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
                  "flex items-center gap-2 text-sm font-medium transition-colors h-14",
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
                <div
                  className="absolute left-0 top-full w-screen bg-white shadow-lg border-t border-neutral-200 z-50"
                  style={{ left: "50%", transform: "translateX(-50%)" }}
                >
                  <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-4 gap-8">
                      {item.children.map((category) => (
                        <div key={category.label}>
                          {/* Categoría principal */}
                          <div
                            className="mb-4"
                            onMouseEnter={() => setActiveSubmenu(category.label)}
                          >
                            <Link
                              href={category.href}
                              className="flex items-center gap-2 text-sm font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
                            >
                              {category.icon && (
                                <span className="text-lg">{category.icon}</span>
                              )}
                              {category.label}
                            </Link>
                          </div>

                          {/* Subcategorías */}
                          {category.children && (
                            <ul className="space-y-2">
                              {category.children.map((subcategory) => (
                                <li
                                  key={subcategory.label}
                                  onMouseEnter={() => setActiveSubmenu(subcategory.label)}
                                >
                                  <Link
                                    href={subcategory.href}
                                    className="flex items-center justify-between text-sm text-neutral-600 hover:text-neutral-900 transition-colors group"
                                  >
                                    <span className="flex items-center gap-2">
                                      {subcategory.icon && (
                                        <span className="text-base">{subcategory.icon}</span>
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
                                      <ul className="ml-4 mt-2 space-y-1.5 pl-3 border-l-2 border-neutral-200">
                                        {subcategory.children.map((item) => (
                                          <li key={item.label}>
                                            <Link
                                              href={item.href}
                                              className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                                            >
                                              {item.icon && (
                                                <span>{item.icon}</span>
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
