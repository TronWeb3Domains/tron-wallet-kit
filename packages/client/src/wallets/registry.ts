import { backpack } from "./entries/backpack";
import { binance } from "./entries/binance";
import { bitget } from "./entries/bitget";
import { bybit } from "./entries/bybit";
import { foxwallet } from "./entries/foxwallet";
import { gate } from "./entries/gate";
import { guarda } from "./entries/guarda";
import { imtoken } from "./entries/imtoken";
import { metamask } from "./entries/metamask";
import { okx } from "./entries/okx";
import { onekey } from "./entries/onekey";
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
  binance,
  guarda,
  onekey,
  backpack,
  walletconnect
] as const satisfies readonly WalletDescriptor[];

export function getEnabledWalletDescriptors(wallets: readonly WalletDescriptor[] = BUILTIN_WALLET_DESCRIPTORS): readonly WalletDescriptor[] {
  return wallets.filter((wallet) => wallet.enabled !== false);
}
