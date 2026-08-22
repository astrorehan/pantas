"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Sonner wrapped so screens never touch its full API surface. Colours come
 * from our tokens via CSS variables, which is why `theme` stays "system" —
 * sonner's own light/dark switch would fight the `data-theme` attribute.
 *
 * Dipisah dari `toast.tsx` supaya `next/dynamic` di sana punya modul tersendiri
 * untuk dimuat belakangan; lihat komentar di berkas itu.
 */
export default function ToasterSonner() {
  return (
    <Sonner
      position="top-center"
      theme="system"
      toastOptions={{
        unstyled: false,
        style: {
          background: "var(--surface-overlay)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "10px",
          boxShadow: "var(--shadow-e3)",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}
