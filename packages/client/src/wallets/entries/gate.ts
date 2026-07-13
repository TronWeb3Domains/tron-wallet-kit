import { standardInjected } from "../../adapters/injected-strategy";
import { cloneInjectedProvider, isInjectedTronProvider, safeGetProperty } from "../../injected/detect";
import type { InjectedTronProvider } from "../../types";
import type { WalletDescriptor } from "../types";

function getGateInjectedProvider(): InjectedTronProvider | undefined {
  const gatewallet = safeGetProperty(globalThis as unknown as Record<string, unknown>, "gatewallet");
  if (!gatewallet || typeof gatewallet !== "object") return undefined;
  const wallet = gatewallet as Record<string, unknown>;
  const walletRequest = safeGetProperty(wallet, "request");
  const walletTronWeb = safeGetProperty(wallet, "tronWeb") as InjectedTronProvider["tronWeb"] | undefined;
  const tronLink = safeGetProperty(wallet, "tronLink");
  const provider = mergeGateProvider(safeGetProperty(wallet, "tron")) ?? mergeGateProvider(tronLink) ?? mergeGateProvider(wallet);
  if (provider) return provider;
  if (tronLink && typeof tronLink === "object" && walletTronWeb) return { tronWeb: walletTronWeb };
  return undefined;

  function mergeGateProvider(value: unknown): InjectedTronProvider | undefined {
    if (!isInjectedTronProvider(value)) return undefined;
    const provider = cloneInjectedProvider(value);
    if (!provider.request && typeof walletRequest === "function") {
      provider.request = walletRequest.bind(wallet) as (args: { method: string; params?: unknown }) => Promise<unknown>;
    }
    if (!provider.tronWeb && walletTronWeb) provider.tronWeb = walletTronWeb;
    return provider;
  }
}

async function hasGateInjectedMarker(): Promise<boolean> {
  const gatewallet = safeGetProperty(globalThis as unknown as Record<string, unknown>, "gatewallet");
  if (!gatewallet || typeof gatewallet !== "object") return false;
  return Boolean(safeGetProperty(gatewallet as Record<string, unknown>, "tronLink"));
}

export const gate: WalletDescriptor = {
  id: "gate",
  name: "Gate Wallet",
  integration: "injected",
  homepage: "https://www.gate.io/web3",
  platforms: ["extension"],
  group: "popular",
  availabilityTimeoutMs: 5000,
  injected: standardInjected({
    providerPaths: ["gatewallet.tron", "gatewallet.tronLink", "gatewallet.tronWeb"],
    provider: getGateInjectedProvider,
    rdns: ["io.gate.wallet"],
    marker: hasGateInjectedMarker,
    requestMethods: ["eth_requestAccounts"],
    addressTimeoutMs: 15000,
    addressSettleMs: 8000,
    accountChangeEventNames: ["accountsChanged"],
    accountChangeTimeoutMs: 5000
  }),
  detect: {
    providerPaths: ["gatewallet.tron", "gatewallet.tronLink", "gatewallet.tronWeb"],
    provider: getGateInjectedProvider,
    availabilityProbe: hasGateInjectedMarker
  }
};
