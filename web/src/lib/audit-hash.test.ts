import { describe, expect, it } from "vitest";
import { normalisasiAuditHash } from "./audit-hash";

describe("normalisasiAuditHash", () => {
  it("menerima digest SHA-256 dan bentuk URL-encoded", () => {
    const hash = `sha256:${"a1".repeat(32)}`;
    expect(normalisasiAuditHash(hash)).toBe(hash);
    expect(normalisasiAuditHash(encodeURIComponent(hash))).toBe(hash);
  });

  it("hanya menerima penanda demo yang memang diterbitkan aplikasi", () => {
    expect(normalisasiAuditHash("sha256:demo-mode-no-camera-2")).toBe(
      "sha256:demo-mode-no-camera-2",
    );
    expect(normalisasiAuditHash("sha256:demo-mode-no-camera-99")).toBeNull();
  });

  it("menolak input arbitrer dan encoding rusak", () => {
    expect(normalisasiAuditHash("sembarang")).toBeNull();
    expect(normalisasiAuditHash("%E0%A4%A")).toBeNull();
  });
});
