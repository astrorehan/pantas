import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

function usage() {
  return [
    "Pemakaian: node scripts/check-health.mjs [opsi]",
    "",
    "  --url <origin>              Origin aplikasi atau URL /api/health",
    "  --allow-database-demo       Izinkan database tidak dikonfigurasi",
    "  --attempts <jumlah>         Ulangi kegagalan sebelum keluar (default 1)",
    "  --interval-ms <milidetik>   Jeda antarpercobaan (default 3000)",
    "  --timeout-ms <milidetik>    Timeout tiap request (default 10000)",
  ].join("\n");
}

function positiveInteger(raw, option) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${option} harus bilangan bulat positif`);
  }
  return value;
}

function optionsFrom(argv) {
  const options = {
    url: process.env.PANTAS_APP_URL ?? "http://127.0.0.1:3000",
    allowDatabaseDemo: false,
    attempts: 1,
    intervalMs: 3_000,
    timeoutMs: 10_000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else if (arg === "--allow-database-demo") {
      options.allowDatabaseDemo = true;
    } else if (arg === "--url") {
      options.url = argv[++index];
    } else if (arg === "--attempts") {
      options.attempts = positiveInteger(argv[++index], arg);
    } else if (arg === "--interval-ms") {
      options.intervalMs = positiveInteger(argv[++index], arg);
    } else if (arg === "--timeout-ms") {
      options.timeoutMs = positiveInteger(argv[++index], arg);
    } else {
      throw new Error(`opsi tidak dikenal: ${arg}\n\n${usage()}`);
    }
  }

  if (!options.url) throw new Error("--url tidak boleh kosong");
  return options;
}

function endpointFrom(value) {
  const url = new URL(value);
  const pathname = url.pathname.replace(/\/+$/, "");
  url.pathname = pathname.endsWith("/api/health")
    ? pathname
    : `${pathname}/api/health`;
  url.search = "";
  url.hash = "";
  return url;
}

function evaluate(body, allowDatabaseDemo) {
  const errors = [];
  const warnings = [];
  const ai = body?.ai_engine;
  const database = body?.database;
  const responsive = new Set(["online", "lambat"]);

  if (!responsive.has(ai?.status)) {
    errors.push(`AI ${ai?.status ?? "tanpa status"}: ${ai?.galat ?? "tanpa detail"}`);
  } else if (ai.status === "lambat") {
    warnings.push(`AI lambat (${ai.rtt_ms ?? "?"} ms)`);
  }

  if (database?.status === "tidak_dikonfigurasi" && allowDatabaseDemo) {
    warnings.push("database tidak dikonfigurasi (diizinkan untuk mode E2E)");
  } else if (!responsive.has(database?.status)) {
    errors.push(
      `database ${database?.status ?? "tanpa status"}: ${database?.galat ?? "tanpa detail"}`,
    );
  } else if (database.status === "lambat") {
    warnings.push(`database lambat (${database.rtt_ms ?? "?"} ms)`);
  }

  return { errors, warnings };
}

async function check(endpoint, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    const result = evaluate(body, options.allowDatabaseDemo);
    if (result.errors.length > 0) throw new Error(result.errors.join("; "));
    return { body, warnings: result.warnings };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const options = optionsFrom(process.argv.slice(2));
  const endpoint = endpointFrom(options.url);
  let lastError;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      const { body, warnings } = await check(endpoint, options);
      process.stdout.write(
        [
          `PANTAS health OK — ${endpoint}`,
          `AI ${body.ai_engine.status} (${body.ai_engine.rtt_ms ?? "?"} ms, versi ${body.ai_engine.versi ?? "?"})`,
          `Database ${body.database.status} (${body.database.rtt_ms ?? "?"} ms)`,
          ...warnings.map((warning) => `Peringatan: ${warning}`),
        ].join("\n") + "\n",
      );
      return;
    } catch (error) {
      lastError = error;
      process.stderr.write(
        `Percobaan ${attempt}/${options.attempts} gagal: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      if (attempt < options.attempts) await delay(options.intervalMs);
    }
  }

  throw lastError;
}

main().catch((error) => {
  process.stderr.write(`PANTAS health FAILED — ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
