import type { WalletPlatform } from "@tron-wallet-kit/core";
import type { WalletOptionViewModel } from "./types";

type WalletKindInput = {
  id: string;
  transport?: WalletOptionViewModel["transport"] | string | undefined;
  capabilities?: readonly string[] | undefined;
  platforms?: readonly WalletPlatform[] | undefined;
  mobileDeepLink?: WalletOptionViewModel["mobileDeepLink"] | undefined;
  supportsWalletConnect?: boolean | undefined;
};

export function isWalletConnectWallet(wallet: WalletKindInput): boolean {
  return wallet.id === "walletconnect" || wallet.transport === "walletconnect";
}

export function isQrWallet(wallet: WalletKindInput): boolean {
  return isWalletConnectWallet(wallet) || wallet.transport === "qr" || wallet.capabilities?.includes("qr") === true;
}

export function isQrFallbackWallet(wallet: WalletKindInput): boolean {
  return !isWalletConnectWallet(wallet) && (wallet.transport === "qr" || wallet.capabilities?.includes("qr") === true);
}

export function isHardwareWallet(wallet: WalletKindInput): boolean {
  return wallet.transport === "hardware" || wallet.platforms?.includes("hardware") === true;
}

export function isMobileCapableWallet(wallet: WalletKindInput): boolean {
  return isQrWallet(wallet) || inferWalletPlatforms(wallet).includes("mobile") || Boolean(wallet.mobileDeepLink) || wallet.supportsWalletConnect === true;
}

export function inferWalletPlatforms(wallet: WalletKindInput): WalletPlatform[] {
  if (isHardwareWallet(wallet)) return ["hardware"];
  if (wallet.transport === "mobile" || isQrWallet(wallet)) return ["mobile"];
  return ["extension"];
}
