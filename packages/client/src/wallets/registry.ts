import { backpack } from "./entries/backpack";
import { binance } from "./entries/binance";
import { bitget } from "./entries/bitget";
import { bybit } from "./entries/bybit";
import { foxwallet } from "./entries/foxwallet";
import { gate } from "./entries/gate";
import { guarda } from "./entries/guarda";
import { imtoken } from "./entries/imtoken";
import { klever } from "./entries/klever";
import { ledger } from "./entries/ledger";
import { metamask } from "./entries/metamask";
import { okx } from "./entries/okx";
import { onekey } from "./entries/onekey";
import { safepal } from "./entries/safepal";
import { tokenpocket } from "./entries/tokenpocket";
import { tronlink } from "./entries/tronlink";
import { trust } from "./entries/trust";
import { walletconnect } from "./entries/walletconnect";
import type { WalletDescriptor } from "./types";

export const BUILTIN_WALLET_DESCRIPTORS = [
  tronlink,
  tokenpocket,
  okx,
  bitget,
  trust,
  metamask,
  gate,
  foxwallet,
  bybit,
  imtoken,
  klever,
  binance,
  safepal,
  guarda,
  onekey,
  backpack,
  ledger,
  walletconnect
] as const satisfies readonly WalletDescriptor[];

export function getEnabledWalletDescriptors(wallets: readonly WalletDescriptor[] = BUILTIN_WALLET_DESCRIPTORS): readonly WalletDescriptor[] {
  return wallets.filter((wallet) => wallet.enabled !== false);
}

export function defineWallet<TWallet extends WalletDescriptor>(wallet: TWallet): TWallet {
  return wallet;
}

export function isWalletDescriptor(value: unknown): value is WalletDescriptor {
  return typeof value === "object" && value !== null && "id" in value && "name" in value && "integration" in value;
}

export function resolveWalletDescriptors(wallets: "all" | readonly (string | WalletDescriptor)[] | undefined): readonly WalletDescriptor[] {
  if (wallets === "all" || !wallets) return getEnabledWalletDescriptors();
  const explicitDescriptors = wallets.filter(isWalletDescriptor);
  const requestedIds = new Set(wallets.filter((wallet): wallet is string => typeof wallet === "string"));
  const requestedBuiltIns = getEnabledWalletDescriptors().filter((wallet) => requestedIds.has(wallet.id));
  return [...requestedBuiltIns, ...explicitDescriptors.filter((wallet) => !requestedIds.has(wallet.id))];
}
