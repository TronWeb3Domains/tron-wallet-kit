import { getWalletIcon } from "../wallets/icons.generated";

export function normalizeWalletId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/wallet$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function walletIconMetadata(walletId: string): { icon?: string } {
  const icon = getWalletIcon(walletId);
  return icon ? { icon } : {};
}
