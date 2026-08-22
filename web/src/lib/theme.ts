export type Theme = "light" | "dark" | "system";

export const THEME_KEY = "pantas-theme";

/**
 * Runs before first paint, inlined in <head>. Without it a user who pinned a
 * theme that disagrees with their OS sees the wrong palette for one frame.
 *
 * Deliberately tiny and dependency-free — it executes before React exists.
 * `system` writes no attribute at all, which lets the `light-dark()` tokens in
 * globals.css follow `prefers-color-scheme` on their own.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`;

/**
 * Memindahkan pilihan bahasa lama dari localStorage ke cookie, sekali saja.
 *
 * Sebelum cookie ada, pilihan bahasa hanya hidup di localStorage — yang tidak
 * bisa dibaca komponen server, sehingga `/lacak/[hash]` selalu Indonesia.
 * Skrip ini berjalan sebelum React ada, jadi pengunjung lama yang sudah
 * memilih Inggris sudah membawa cookie-nya pada permintaan berikutnya alih-alih
 * kehilangan pilihannya diam-diam.
 */
export const LOCALE_SCRIPT = `(function(){try{if(/(^|;\\s*)pantas-locale=/.test(document.cookie))return;var l=localStorage.getItem("pantas-locale");if(l==="en"||l==="id"){document.cookie="pantas-locale="+l+"; path=/; max-age=31536000; samesite=lax";document.documentElement.lang=l}}catch(e){}})()`;

/**
 * Minimal external store so components can read the preference with
 * `useSyncExternalStore`. Reading localStorage in a mount effect would work but
 * costs an extra render pass and trips react-hooks/set-state-in-effect.
 */
const listeners = new Set<() => void>();
let snapshot: Theme = "system";
let hydrated = false;

function read(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

/** getSnapshot must be referentially stable, hence the cached value. */
export function getTheme(): Theme {
  if (!hydrated) {
    snapshot = read();
    hydrated = true;
  }
  return snapshot;
}

/** The server has no localStorage; `system` is what the inline script assumes. */
export function getServerTheme(): Theme {
  return "system";
}

export function subscribeTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab changing the preference should move this one too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) {
      snapshot = read();
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  try {
    if (theme === "system") {
      root.removeAttribute("data-theme");
      localStorage.removeItem(THEME_KEY);
    } else {
      root.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
    }
  } catch {
    // Private mode / storage disabled: the attribute still applies for this
    // session, it just will not survive a reload.
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }
  snapshot = theme;
  hydrated = true;
  listeners.forEach((l) => l());
}
