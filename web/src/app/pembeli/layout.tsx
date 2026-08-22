import RequireRole from "@/components/require-role";
import { AppShell } from "@/components/app-shell";

export default function PembeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole role="pembeli">
      <AppShell role="pembeli">{children}</AppShell>
    </RequireRole>
  );
}
