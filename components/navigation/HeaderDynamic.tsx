import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, User, Heart } from "lucide-react";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { getNavigationFromAPI } from "@/lib/get-navigation-api";

/**
 * Header dinámico simplificado - Sin duplicados
 */
export async function HeaderDynamic() {
  // Obtener navegación desde tu API
  const navigationTree = await getNavigationFromAPI();

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Barra promocional */}
      <div className="bg-neutral-900 text-white text-center py-2 text-sm">
        <p>
          🔥 <strong>Envío gratis</strong> en compras mayores a $50.000 |{" "}
          <strong>3 cuotas sin interés</strong>
        </p>
      </div>

      {/* Barra principal */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo y menú mobile */}
          <div className="flex items-center gap-4">
            <MobileMenu items={navigationTree} />
            
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.jpg"
                alt="Calzalindo"
                width={150}
                height={45}
                priority
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Buscador (desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <form action="/buscar" method="GET" className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="search"
                name="q"
                placeholder="Buscar productos, marcas..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </form>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Favoritos */}
            <Link
              href="/favoritos"
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Favoritos"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Usuario */}
            <Link
              href="/cuenta"
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Mi cuenta"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Carrito */}
            <Link
              href="/carrito"
              className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Carrito"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
        </div>

        {/* Buscador mobile */}
        <div className="md:hidden pb-3">
          <form action="/buscar" method="GET" className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="search"
              name="q"
              placeholder="Buscar..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-sm"
            />
          </form>
        </div>
      </div>

      {/* Mega menú desktop */}
      <MegaMenu items={navigationTree} />
    </header>
  );
}
