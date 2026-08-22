"use client";

/**
 * Last line of defence: this replaces the root layout, so it renders its own
 * document shell and leans on inline styles rather than the design system —
 * if the failure is in the layout or the stylesheet, tokens may never load.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          background: "#faf9f7",
          color: "#171614",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
          Aplikasi gagal dimuat
        </h1>
        <p style={{ maxWidth: 420, margin: 0, color: "#57534e", lineHeight: 1.5 }}>
          Terjadi galat di luar dugaan. Muat ulang halaman; bila terus berulang,
          hubungi tim PANTAS dengan menyertakan kode di bawah.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          style={{
            marginTop: 8,
            minHeight: 48,
            padding: "0 24px",
            border: 0,
            borderRadius: 10,
            /* green-600. Literal karena layar ini menggantikan seluruh
               dokumen: stylesheet-nya sendiri belum tentu ikut termuat. */
            background: "#246634",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Coba lagi
        </button>
        {error.digest && (
          <p style={{ marginTop: 24, fontSize: 12, color: "#a5a09a" }}>
            Kode galat: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
