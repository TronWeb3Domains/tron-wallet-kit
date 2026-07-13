import { standardInjected } from "../../adapters/injected-strategy";
import { extractInjectedAddress, getDefaultBase58Address, safeGetProperty } from "../../injected/detect";
import type { InjectedTronProvider } from "../../types";
import type { WalletDescriptor } from "../types";

function getSafePalInjectedProvider(): InjectedTronProvider | undefined {
  const globals = globalThis as unknown as Record<string, unknown>;
  const safePalHook = safeGetProperty(globals, "SafePalHook");
  const tronWeb = safeGetProperty(globals, "tronWeb");
  if (!safePalHook || typeof safePalHook !== "object") return undefined;
  if (!tronWeb || typeof tronWeb !== "object") return undefined;
  const hook = safePalHook as Record<string, unknown>;
  const request = safeGetProperty(hook, "request");
  const provider: InjectedTronProvider = {
    tronWeb: createSafePalTronWeb(tronWeb, hook)
  };

  if (typeof request === "function") {
    provider.request = async (args) => {
      const result = await request.call(hook, args);
      provider.tronWeb = createSafePalTronWeb(tronWeb, hook);
      if (args.method === "tron_requestAccounts" || args.method === "eth_requestAccounts") {
        const address = extractInjectedAddress(result) ?? getDefaultBase58Address(safeGetProperty(hook, "defaultAddress"));
        return typeof address === "string" ? [address] : result;
      }
      return result;
    };
  }

  return provider;
}

function hasSafePalInjectedMarker(): boolean {
  const globals = globalThis as unknown as Record<string, unknown>;
  return Boolean(safeGetProperty(globals, "SafePalHook") || safeGetProperty(globals, "sfpPlatform"));
}

function createSafePalTronWeb(tronWeb: unknown, hook: Record<string, unknown>): NonNullable<InjectedTronProvider["tronWeb"]> {
  const source = tronWeb as Record<string, unknown>;
  const defaultAddress = safeGetProperty(source, "defaultAddress") ?? safeGetProperty(hook, "defaultAddress");
  const trx = safeGetProperty(source, "trx");
  const normalized: NonNullable<InjectedTronProvider["tronWeb"]> = {};
  if (typeof defaultAddress === "object" && defaultAddress !== null) {
    normalized.defaultAddress = defaultAddress as NonNullable<NonNullable<InjectedTronProvider["tronWeb"]>["defaultAddress"]>;
  }
  if (typeof trx === "object" && trx !== null) {
    normalized.trx = trx as NonNullable<NonNullable<InjectedTronProvider["tronWeb"]>["trx"]>;
  }
  return normalized;
}

export const safepal: WalletDescriptor = {
  id: "safepal",
  name: "SafePal",
  integration: "injected",
  homepage: "https://www.safepal.com/",
  downloadUrl: "https://www.safepal.com/download?product=2",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  injected: standardInjected({
    provider: getSafePalInjectedProvider,
    marker: hasSafePalInjectedMarker,
    signMessageMode: "sign",
    addressSettleMs: 2500,
    emptyAddressRetryDelayMs: 300,
    emptyAddressRetryTimeoutMs: 3000
  }),
  detect: { provider: getSafePalInjectedProvider, availabilityProbe: hasSafePalInjectedMarker },
  addressSettleMs: 2500,
  emptyAddressRetryDelayMs: 300,
  emptyAddressRetryTimeoutMs: 3000,
  signMessageMode: "sign"
};
