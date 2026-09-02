import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { bearerTokenCocok, tokenCocok } from "@/lib/server-auth";

/**
 * Restores the demo accounts to their seeded state (F-03).
 *
 * Runs on Vercel Cron every 6 hours through the judging window so the third
 * judge sees the same dashboard as the first, after earlier ones have published
 * listings and placed orders.
 *
 * The service role key is read here and only here (NFR-SEC-02) — a route
 * handler never reaches the client bundle. All the mutation lives in the
 * `reset_demo()` security-definer function, so this file holds no SQL and no
 * table names to drift out of sync with the seed.
 */

export const dynamic = "force-dynamic";

function berwenang(req: Request): boolean {
  const token = process.env.DEMO_RESET_TOKEN;
  if (!token) return false;
  const auth = req.headers.get("authorization");
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; a manual call can
  // use the dedicated header instead.
  return (
    tokenCocok(req.headers.get("x-demo-reset-token"), token) ||
    bearerTokenCocok(auth, token)
  );
}

async function reset(req: Request) {
  if (!berwenang(req)) {
    return Response.json(
      { error: "Tidak berwenang." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY atau URL belum diset." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // `reset_demo` is not in database.types.ts until the types are regenerated
  // against migration 0003 + seed_demo.sql; the cast keeps this file honest
  // about that rather than widening the generated types by hand.
  const { error } = await (
    admin.rpc as unknown as (
      fn: string,
    ) => Promise<{ data: unknown; error: { message: string } | null }>
  )("reset_demo");

  if (error) {
    console.error("[pantas] reset demo gagal:", error.message);
    return Response.json(
      { error: "Reset data demo gagal. Periksa log server." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export const POST = reset;
/** Vercel Cron issues GET, so both verbs land on the same handler. */
export const GET = reset;
