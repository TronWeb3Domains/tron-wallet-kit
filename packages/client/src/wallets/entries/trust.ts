import { standardInjected } from "../../adapters/injected-strategy";
import { safeGetProperty } from "../../injected/detect";
import type { InjectedTronProvider } from "../../types";
import type { WalletDescriptor } from "../types";

function getTrustInjectedProvider(): InjectedTronProvider | undefined {
  const globals = globalThis as unknown as Record<string, unknown>;
  const trustwallet = safeGetProperty(globals, "trustwallet");
  if (!trustwallet || typeof trustwallet !== "object") return undefined;
  const wallet = trustwallet as Record<string, unknown>;
  const mobileProvider = asUsableTrustProvider(safeGetProperty(wallet, "tron"));
  if (/Android|iPhone|iPad|iPod/i.test(globalThis.navigator?.userAgent ?? "") && mobileProvider) return mobileProvider;
  return asUsableTrustProvider(safeGetProperty(wallet, "tronLink")) ?? asUsableTrustProvider(safeGetProperty(wallet, "tron"));
}

function asUsableTrustProvider(value: unknown): InjectedTronProvider | undefined {
  if (!value || typeof value !== "object") return undefined;
  const provider = value as Record<string, unknown>;
  const request = safeGetProperty(provider, "request");
  const tronWeb = safeGetProperty(provider, "tronWeb") as InjectedTronProvider["tronWeb"] | undefined;
  const hasTronWebTrx = Boolean(tronWeb && typeof tronWeb === "object" && typeof tronWeb.trx === "object");
  if (typeof request !== "function" && !hasTronWebTrx) return undefined;
  return value as InjectedTronProvider;
}

export const trust: WalletDescriptor = {
  id: "trust",
  name: "Trust Wallet",
  integration: "injected",
  homepage: "https://trustwallet.com/",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  conflictMarkers: ["trustwallet"],
  injected: standardInjected({ provider: getTrustInjectedProvider }),
  detect: { provider: getTrustInjectedProvider }
};
