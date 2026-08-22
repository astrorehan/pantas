import type { Metadata } from "next";

/**
 * The reset form is a client component, so its title lives here — a
 * `"use client"` module cannot export `metadata` (F-83).
 */
export const metadata: Metadata = {
  title: "Atur Ulang Kata Sandi",
  description: "Setel kata sandi baru untuk akun PANTAS Anda.",
  robots: { index: false },
};

export default function ResetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
