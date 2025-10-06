import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConsultaProvider } from "./contexts/ConsultaContext";
import { ConsultaFloatingButton } from "@/components/ConsultaFloatingButton";
import "./globals.css";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catálogo Calzalindo",
  description: "Catálogo de productos Calzalindo",
  icons: {
    icon: "/favicon.ico", // favicon que subiste a /public/
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
        {/* Header con logo */}
        <header className="flex justify-center py-4 shadow-sm bg-white">
          <Image
            src="/logo.jpg"
            alt="Calzalindo"
            width={200}
            height={60}
            priority
          />
        </header>

        {/* Contenido principal */}
        <ConsultaProvider>
          {children}
          <ConsultaFloatingButton />
        </ConsultaProvider>
      </body>
    </html>
  );
}
