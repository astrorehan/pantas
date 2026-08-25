import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  haptic,
  isHapticSupported,
  getHapticEnabled,
  setHapticEnabled,
  vibrate,
  cancelHaptic,
  HAPTIC_PATTERNS,
  HAPTIC_STORAGE_KEY,
} from "./haptic";

describe("haptic utility module", () => {
  const originalNavigator = globalThis.navigator;
  const originalLocalStorage = globalThis.localStorage;

  let vibrateMock: ReturnType<typeof vi.fn>;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    vibrateMock = vi.fn().mockReturnValue(true);
    mockStorage = {};

    Object.defineProperty(globalThis, "navigator", {
      value: {
        ...originalNavigator,
        vibrate: vibrateMock,
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => mockStorage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {
          mockStorage = {};
        }),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe("isHapticSupported", () => {
    it("returns true when navigator.vibrate is a function", () => {
      expect(isHapticSupported()).toBe(true);
    });

    it("returns false when navigator.vibrate is undefined", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });
      expect(isHapticSupported()).toBe(false);
    });
  });

  describe("getHapticEnabled & setHapticEnabled", () => {
    it("defaults to true when localStorage is empty", () => {
      expect(getHapticEnabled()).toBe(true);
    });

    it("persists false in localStorage when set to false", () => {
      setHapticEnabled(false);
      expect(mockStorage[HAPTIC_STORAGE_KEY]).toBe("false");
      expect(getHapticEnabled()).toBe(false);
    });

    it("persists true in localStorage when set to true", () => {
      setHapticEnabled(false);
      setHapticEnabled(true);
      expect(mockStorage[HAPTIC_STORAGE_KEY]).toBe("true");
      expect(getHapticEnabled()).toBe(true);
    });
  });

  describe("vibrate execution", () => {
    it("calls navigator.vibrate with the provided pattern when enabled", () => {
      const res = vibrate(100);
      expect(res).toBe(true);
      expect(vibrateMock).toHaveBeenCalledWith(100);
    });

    it("does not call navigator.vibrate when disabled by user preference", () => {
      setHapticEnabled(false);
      const res = vibrate(100);
      expect(res).toBe(false);
      expect(vibrateMock).not.toHaveBeenCalled();
    });

    it("does not call navigator.vibrate when not supported", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });
      const res = vibrate(100);
      expect(res).toBe(false);
    });

    it("handles errors thrown by navigator.vibrate gracefully", () => {
      vibrateMock.mockImplementation(() => {
        throw new Error("Vibration permission error");
      });
      const res = vibrate(100);
      expect(res).toBe(false);
    });
  });

  describe("haptic API methods", () => {
    it("triggers selection haptic pattern (15ms)", () => {
      haptic.selection();
      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.selection);
    });

    it("triggers light haptic pattern (20ms)", () => {
      haptic.light();
      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.light);
    });

    it("triggers medium haptic pattern (40ms)", () => {
      haptic.medium();
      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.medium);
    });

    it("triggers heavy haptic pattern (70ms)", () => {
      haptic.heavy();
      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.heavy);
    });

    it("triggers shutter haptic pattern (35ms)", () => {
      haptic.shutter();
      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.shutter);
    });

    it("triggers scan haptic pattern (50ms)", () => {
      haptic.scan();
      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.scan);
    });

    it("triggers success double-vibration pattern [40, 60, 40]", () => {
      haptic.success();
      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.success);
    });

    it("triggers warning pattern [70, 50, 70]", () => {
      haptic.warning();
      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.warning);
    });

    it("triggers error triple-vibration pattern [100, 50, 100, 50, 100]", () => {
      haptic.error();
      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.error);
    });

    it("triggers custom pattern", () => {
      haptic.custom([25, 25, 25]);
      expect(vibrateMock).toHaveBeenCalledWith([25, 25, 25]);
    });

    it("cancels vibration via cancelHaptic / haptic.cancel", () => {
      cancelHaptic();
      expect(vibrateMock).toHaveBeenCalledWith(0);

      vibrateMock.mockClear();
      haptic.cancel();
      expect(vibrateMock).toHaveBeenCalledWith(0);
    });
  });
});
