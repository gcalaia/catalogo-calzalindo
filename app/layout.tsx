import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConsultaProvider } from "./contexts/ConsultaContext";
import { ConsultaFloatingButton } from "@/components/ConsultaFloatingButton";
import { Header } from "@/components/navigation/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Calzalindo - Tienda de Calzado Online",
  description: "Catálogo de productos Calzalindo - Las mejores marcas de calzado deportivo y urbano",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Header con mega menú profesional */}
        <Header />

        {/* Contenido principal */}
        <ConsultaProvider>
          <main className="min-h-screen">
            {children}
          </main>
          <ConsultaFloatingButton />
        </ConsultaProvider>

        {/* Footer */}
        <footer className="bg-neutral-900 text-white py-8 mt-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Columna 1: Info */}
              <div>
                <h3 className="font-bold text-lg mb-4">Calzalindo</h3>
                <p className="text-sm text-neutral-400">
                  Las mejores marcas de calzado deportivo y urbano al mejor precio.
                </p>
              </div>

              {/* Columna 2: Enlaces rápidos */}
              <div>
                <h3 className="font-bold text-lg mb-4">Enlaces Rápidos</h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li><a href="/ofertas" className="hover:text-white transition-colors">Ofertas</a></li>
                  <li><a href="/marcas" className="hover:text-white transition-colors">Marcas</a></li>
                  <li><a href="/deportes" className="hover:text-white transition-colors">Deportes</a></li>
                  <li><a href="/kids" className="hover:text-white transition-colors">Kids</a></li>
                </ul>
              </div>

              {/* Columna 3: Ayuda */}
              <div>
                <h3 className="font-bold text-lg mb-4">Ayuda</h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li><a href="/preguntas-frecuentes" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
                  <li><a href="/envios" className="hover:text-white transition-colors">Envíos</a></li>
                  <li><a href="/cambios" className="hover:text-white transition-colors">Cambios y Devoluciones</a></li>
                  <li><a href="/contacto" className="hover:text-white transition-colors">Contacto</a></li>
                </ul>
              </div>

              {/* Columna 4: Contacto */}
              <div>
                <h3 className="font-bold text-lg mb-4">Contacto</h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li>📞 (011) 1234-5678</li>
                  <li>📧 info@calzalindo.com</li>
                  <li>📍 Buenos Aires, Argentina</li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-neutral-800 mt-8 pt-6 text-center text-sm text-neutral-400">
              <p>&copy; {new Date().getFullYear()} Calzalindo. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
