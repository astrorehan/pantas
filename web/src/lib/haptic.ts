"use client";

import { useEffect, useState } from "react";

/**
 * Utilitas Haptic Feedback (Web Vibration API) — F-108.
 *
 * Memberikan respon taktil seketika pada interaksi operasional penting PWA:
 * - Pemindaian QR code krat & kode serah terima
 * - Rana pemotretan dan penyelesaian grading AI
 * - Konfirmasi pesanan, serah terima, dan checklist rantai dingin
 * - Notifikasi pemrosesan antrean offline
 *
 * Bekerja secara fail-safe: jika peramban tidak mendukung Vibration API
 * (seperti iOS Safari atau desktop browser tertentu), fungsi memprosesnya
 * tanpa galat (graceful fallback).
 */

export const HAPTIC_STORAGE_KEY = "pantas:haptic:enabled";
export const HAPTIC_CHANGE_EVENT = "pantas:haptic:change";

export type HapticPattern = number | number[];

/**
 * Pola getaran taktil terkalibrasi (dalam milidetik).
 */
export const HAPTIC_PATTERNS = {
  /** Sentuhan mikro saat memilih item, radio, filter, atau bintang ulasan */
  selection: 15,
  /** Sentuhan ringan */
  light: 20,
  /** Sentuhan sedang untuk tombol aksi standar / transisi status */
  medium: 40,
  /** Sentuhan berat / tegas untuk aksi konfirmasi primer */
  heavy: 70,
  /** Respon mekanis rana kamera saat memotret panen */
  shutter: 35,
  /** Konfirmasi pemindaian saat QR code / barcode terdeteksi */
  scan: 50,
  /** Pola getar ganda harmonis untuk keberhasilan aksi operasional */
  success: [40, 60, 40] as const,
  /** Pola getar peringatan untuk foto buram (veto) atau antrean offline */
  warning: [70, 50, 70] as const,
  /** Pola getar tripel tegas untuk kegagalan / kode tidak cocok */
  error: [100, 50, 100, 50, 100] as const,
} as const;

/**
 * Periksa apakah Web Vibration API didukung oleh peramban saat ini.
 */
export function isHapticSupported(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return typeof navigator.vibrate === "function";
}

/**
 * Periksa apakah haptic feedback diaktifkan dalam preferensi pengguna.
 * Bawaan: true (aktif bila didukung).
 */
export function getHapticEnabled(): boolean {
  if (typeof localStorage === "undefined") {
    return true;
  }
  try {
    const saved = localStorage.getItem(HAPTIC_STORAGE_KEY);
    if (saved === null) return true;
    return saved === "true";
  } catch {
    return true;
  }
}

/**
 * Setel preferensi haptic feedback pengguna dan broadcast perubahan ke komponen lain.
 */
export function setHapticEnabled(enabled: boolean): void {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(HAPTIC_STORAGE_KEY, String(enabled));
    } catch {
      /* localStorage tidak tersedia (mode privat ketat) */
    }
  }
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent(HAPTIC_CHANGE_EVENT, { detail: { enabled } }),
      );
    } catch {
      /* CustomEvent dispatch fallback */
    }
  }
}

/**
 * Eksekusi getaran dengan pola yang ditentukan jika didukung dan diaktifkan.
 */
export function vibrate(pattern: HapticPattern): boolean {
  if (!isHapticSupported()) return false;
  if (!getHapticEnabled()) return false;

  try {
    return navigator.vibrate(pattern as VibratePattern);
  } catch {
    return false;
  }
}

/**
 * Hentikan semua getaran yang sedang berlangsung.
 */
export function cancelHaptic(): boolean {
  if (!isHapticSupported()) return false;
  try {
    return navigator.vibrate(0);
  } catch {
    return false;
  }
}

/**
 * API Haptic terstruktur untuk pemanggilan di seluruh aplikasi.
 */
export const haptic = {
  /** Sentuhan mikro untuk pemilihan (15ms) */
  selection: () => vibrate(HAPTIC_PATTERNS.selection),
  /** Sentuhan ringan (20ms) */
  light: () => vibrate(HAPTIC_PATTERNS.light),
  /** Sentuhan sedang (40ms) */
  medium: () => vibrate(HAPTIC_PATTERNS.medium),
  /** Sentuhan berat (70ms) */
  heavy: () => vibrate(HAPTIC_PATTERNS.heavy),
  /** Respon tombol rana kamera (35ms) */
  shutter: () => vibrate(HAPTIC_PATTERNS.shutter),
  /** Respon QR code terdeteksi (50ms) */
  scan: () => vibrate(HAPTIC_PATTERNS.scan),
  /** Pola keberhasilan ganda [40, 60, 40] ms */
  success: () => vibrate(HAPTIC_PATTERNS.success as unknown as number[]),
  /** Pola peringatan [70, 50, 70] ms */
  warning: () => vibrate(HAPTIC_PATTERNS.warning as unknown as number[]),
  /** Pola kesalahan [100, 50, 100, 50, 100] ms */
  error: () => vibrate(HAPTIC_PATTERNS.error as unknown as number[]),
  /** Pola getar kustom */
  custom: (pattern: HapticPattern) => vibrate(pattern),
  /** Hentikan getaran */
  cancel: () => cancelHaptic(),
  /** Periksa ketersediaan */
  isSupported: isHapticSupported,
  /** Status aktif/nonaktif */
  isEnabled: getHapticEnabled,
  /** Ubah preferensi */
  setEnabled: setHapticEnabled,
};

/**
 * Hook React untuk membaca status dukungan dan mengelola preferensi haptic pengguna.
 */
export function useHaptic() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    setSupported(isHapticSupported());
    setEnabledState(getHapticEnabled());

    const handleHapticChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.enabled === "boolean") {
        setEnabledState(customEvent.detail.enabled);
      } else {
        setEnabledState(getHapticEnabled());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === HAPTIC_STORAGE_KEY) {
        setEnabledState(getHapticEnabled());
      }
    };

    window.addEventListener(HAPTIC_CHANGE_EVENT, handleHapticChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(HAPTIC_CHANGE_EVENT, handleHapticChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setEnabled = (next: boolean) => {
    setEnabledState(next);
    setHapticEnabled(next);
    if (next) {
      // Sentuhan konfirmasi instan saat sakelar diaktifkan
      haptic.success();
    }
  };

  const toggle = () => {
    setEnabled(!enabled);
  };

  return {
    isSupported: supported,
    enabled,
    setEnabled,
    toggle,
    haptic,
  };
}
