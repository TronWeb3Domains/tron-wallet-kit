import type { WalletStorage } from "./types";

export class MemoryWalletStorage implements WalletStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

export function createBrowserWalletStorage(prefix = "tron-wallet-kit"): WalletStorage {
  const resolveKey = (key: string) => `${prefix}:${key}`;
  return {
    getItem(key) {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(resolveKey(key));
    },
    setItem(key, value) {
      if (typeof window !== "undefined") window.localStorage.setItem(resolveKey(key), value);
    },
    removeItem(key) {
      if (typeof window !== "undefined") window.localStorage.removeItem(resolveKey(key));
    }
  };
}
