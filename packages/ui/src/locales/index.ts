import { en } from "./en";
import { zh } from "./zh";
import type { WalletKitLabelPack, WalletUiLabels } from "../types";

export const BUILTIN_LOCALES = { en, zh } as const;
export type BuiltinLocaleId = keyof typeof BUILTIN_LOCALES;

export function resolveLabelPack(locale?: string, overrides?: WalletUiLabels): WalletKitLabelPack {
  const base = BUILTIN_LOCALES[(locale as BuiltinLocaleId) || "en"] ?? BUILTIN_LOCALES.en;
  return {
    connectModal: { ...BUILTIN_LOCALES.en.connectModal, ...base.connectModal, ...overrides?.connectModal },
    accountPanel: { ...BUILTIN_LOCALES.en.accountPanel, ...base.accountPanel, ...overrides?.accountPanel },
    walletButton: { ...BUILTIN_LOCALES.en.walletButton, ...base.walletButton, ...overrides?.walletButton },
    toast: { ...BUILTIN_LOCALES.en.toast, ...base.toast, ...overrides?.toast },
    errors: {
      ...BUILTIN_LOCALES.en.errors,
      ...base.errors,
      ...overrides?.errors,
      codes: {
        ...BUILTIN_LOCALES.en.errors.codes,
        ...base.errors.codes,
        ...overrides?.errors?.codes
      }
    }
  };
}

export { en, zh };
