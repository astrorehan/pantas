import { describe, expect, it } from "vitest";
import { bearerTokenCocok, tokenCocok } from "./server-auth";

describe("bearerTokenCocok", () => {
  it("gagal tertutup ketika secret belum dikonfigurasi", () => {
    expect(bearerTokenCocok(null, undefined)).toBe(false);
    expect(bearerTokenCocok("Bearer apa-saja", "")).toBe(false);
  });

  it("hanya menerima bearer token yang sama persis", () => {
    expect(bearerTokenCocok("Bearer rahasia-ku", "rahasia-ku")).toBe(true);
    expect(bearerTokenCocok("Bearer rahasia-lain", "rahasia-ku")).toBe(false);
    expect(bearerTokenCocok("Basic rahasia-ku", "rahasia-ku")).toBe(false);
  });

  it("membandingkan token header khusus tanpa jalur fail-open", () => {
    expect(tokenCocok("rahasia-ku", "rahasia-ku")).toBe(true);
    expect(tokenCocok("rahasia-lain", "rahasia-ku")).toBe(false);
    expect(tokenCocok("apa-saja", undefined)).toBe(false);
  });
});
