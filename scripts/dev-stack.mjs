import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB_DIR = path.join(ROOT, "web");
const AI_DIR = path.join(ROOT, "ai_engine");
const WINDOWS = process.platform === "win32";
const E2E = process.argv.includes("--e2e");
const children = [];

let stopping = false;

function log(message) {
  process.stdout.write(`[pantas] ${message}\n`);
}

function portFrom(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error(`${name} harus berupa port 1-65535, diterima: ${process.env[name]}`);
  }
  return value;
}

function pythonCommand() {
  if (process.env.PANTAS_PYTHON) return process.env.PANTAS_PYTHON;

  const virtualenv = WINDOWS
    ? path.join(AI_DIR, ".venv", "Scripts", "python.exe")
    : path.join(AI_DIR, ".venv", "bin", "python");

  if (existsSync(virtualenv)) return virtualenv;
  return WINDOWS ? "python" : "python3";
}

function run(command, args, options, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.once("error", (error) => reject(new Error(`${label}: ${error.message}`)));
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} berhenti (${signal ?? `exit ${code}`})`));
    });
  });
}

function startService(label, command, args, options) {
  const child = spawn(command, args, {
    ...options,
    detached: !WINDOWS,
    stdio: "inherit",
  });

  children.push({ label, child });
  child.once("error", (error) => {
    if (!stopping) void shutdown(1, `${label} gagal dimulai: ${error.message}`);
  });
  child.once("exit", (code, signal) => {
    if (!stopping) {
      void shutdown(
        code ?? 1,
        `${label} berhenti tanpa diminta (${signal ?? `exit ${code}`})`,
      );
    }
  });
  return child;
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(timeoutMs),
  ]);
}

async function stopService({ child }) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;

  if (WINDOWS) {
    const graceful = spawnSync("taskkill", ["/pid", String(child.pid), "/T"], {
      stdio: "ignore",
      windowsHide: true,
    });
    if (graceful.status !== 0) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    }
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }

  await waitForExit(child, 4_000);
  if (child.exitCode === null && child.signalCode === null) {
    if (WINDOWS) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }
  }
}

async function shutdown(code, reason) {
  if (stopping) return;
  stopping = true;
  if (reason) log(reason);
  log("Menghentikan web dan grading engine...");
  await Promise.all([...children].reverse().map(stopService));
  process.exit(code);
}

async function waitForHealth(url, child, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "belum menjawab";

  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`grading engine berhenti sebelum sehat (${child.exitCode ?? child.signalCode})`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2_000);
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      if (response.ok) {
        const body = await response.json();
        if (body?.status === "ok") return;
        lastError = `payload status=${String(body?.status)}`;
      } else {
        lastError = `HTTP ${response.status}`;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    } finally {
      clearTimeout(timer);
    }

    await delay(300);
  }

  throw new Error(`grading engine tidak sehat setelah ${timeoutMs / 1000} detik: ${lastError}`);
}

async function main() {
  const webPort = portFrom("PANTAS_WEB_PORT", E2E ? 3100 : 3000);
  const aiPort = portFrom("PANTAS_AI_PORT", E2E ? 7861 : 7860);
  const webHost = process.env.PANTAS_WEB_HOST ?? "127.0.0.1";
  const aiHost = process.env.PANTAS_AI_HOST ?? "127.0.0.1";
  const publicAiHost = aiHost === "0.0.0.0" ? "127.0.0.1" : aiHost;
  const predictUrl = `http://${publicAiHost}:${aiPort}`;
  const python = pythonCommand();
  if (!existsSync(path.join(WEB_DIR, "package.json"))) {
    throw new Error(`frontend tidak ditemukan di ${WEB_DIR}`);
  }
  if (!existsSync(path.join(AI_DIR, "api.py"))) {
    throw new Error(`grading engine tidak ditemukan di ${AI_DIR}`);
  }

  log(`Memeriksa dependency Python melalui ${python}`);
  await run(
    python,
    ["-c", "import fastapi, uvicorn, cv2, ultralytics"],
    { cwd: AI_DIR, stdio: "inherit", windowsHide: true },
    "dependency grading engine belum siap; jalankan pip install -r ai_engine/requirements.txt",
  );

  log("Menyinkronkan data komoditas dan metrik frontend");
  for (const generator of ["gen-komoditas.mjs", "gen-metrik-model.mjs"]) {
    await run(
      process.execPath,
      [path.join(WEB_DIR, "scripts", generator)],
      { cwd: WEB_DIR, stdio: "inherit", windowsHide: true },
      `generator frontend ${generator} gagal`,
    );
  }

  const aiArgs = [
    "-m",
    "uvicorn",
    "api:app",
    "--host",
    aiHost,
    "--port",
    String(aiPort),
  ];
  const reload = !E2E && process.env.PANTAS_AI_RELOAD !== "0";
  if (reload) aiArgs.push("--reload");

  log(`Menyalakan grading engine di ${predictUrl}${reload ? " (reload aktif)" : ""}`);
  const ai = startService("grading engine", python, aiArgs, {
    cwd: AI_DIR,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
    windowsHide: true,
  });

  await waitForHealth(`${predictUrl}/health`, ai);
  log("Grading engine sehat; menyalakan frontend");

  const webEnvironment = {
    ...process.env,
    NEXT_PUBLIC_PREDICT_URL: predictUrl,
  };
  if (E2E && process.env.PANTAS_E2E_USE_SUPABASE !== "1") {
    webEnvironment.NEXT_PUBLIC_SUPABASE_URL = "";
    webEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
  }

  const nextBin = path.join(WEB_DIR, "node_modules", "next", "dist", "bin", "next");
  if (!existsSync(nextBin)) {
    throw new Error("dependency frontend belum siap; jalankan npm install di folder web");
  }

  startService(
    "frontend",
    process.execPath,
    [nextBin, "dev", "--hostname", webHost, "--port", String(webPort)],
    { cwd: WEB_DIR, env: webEnvironment, windowsHide: true },
  );

  log(`Stack siap: web http://${webHost}:${webPort} → AI ${predictUrl}`);
}

process.once("SIGINT", () => void shutdown(130));
process.once("SIGTERM", () => void shutdown(0));

main().catch((error) => {
  void shutdown(1, error instanceof Error ? error.message : String(error));
});
