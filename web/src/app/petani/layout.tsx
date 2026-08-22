import RequireRole from "@/components/require-role";
import { AppShell } from "@/components/app-shell";
import { LatarPetani } from "@/components/latar-petani";

export default function PetaniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole role="petani">
      {/* Antrean pindai offline (F-14) hanya relevan di aplikasi petani —
          pembeli dan admin tidak memotret panen. Keduanya ditunda; lihat
          latar-petani.tsx. */}
      <LatarPetani />
      <AppShell role="petani">{children}</AppShell>
    </RequireRole>
  );
}
