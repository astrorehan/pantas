"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const emptySubscribe = () => () => {};

/**
 * Client-side session gate. Real protection arrives with Supabase RLS —
 * this only keeps the demo honest (no petani screens without logging in).
 *
 * Renders during SSR for immediate sub-second FCP/LCP paint, then verifies
 * the hydrated session on the client and redirects if unauthorized.
 */
export default function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const store = useStore();
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const ok = store.sesi?.role === role;

  useEffect(() => {
    // Redirect once client store is ready if session does not match
    if (mounted && store.ready && !ok) {
      router.replace("/masuk");
    }
  }, [mounted, store.ready, ok, router]);

  // If client hydration has resolved and user is definitely unauthorized, suppress content
  if (mounted && store.ready && !ok) return null;

  return <>{children}</>;
}
