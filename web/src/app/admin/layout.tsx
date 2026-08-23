import RequireRole from "@/components/require-role";
import { AppShell, BottomNav } from "@/components/app-shell";

/**
 * The console mounts the tab bar here rather than behind a `(tabs)` group:
 * both of its screens are destinations, not steps of a focused flow, so there
 * is no subtree to keep it out of. Without it, `SideNav` is `md:flex` and the
 * operator on a phone had no navigation at all — `/admin` and `/admin/rute`
 * could only be reached by typing the URL.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole role="admin">
      <AppShell role="admin">
        <div className="flex flex-1 flex-col">{children}</div>
        <BottomNav role="admin" />
      </AppShell>
    </RequireRole>
  );
}
