// components/Header.tsx
'use client';
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full flex justify-center py-4">
      <Image
        src="/logo.jpg"
        alt="Calzalindo"
        width={220}
        height={60}
        priority
        className="h-auto"
      />
    </header>
  );
}
