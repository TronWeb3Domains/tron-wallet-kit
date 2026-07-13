import { standardInjected, withAddressPoll, withSignMode } from "../../adapters/injected-strategy";
import { extractInjectedAddress, getDefaultBase58Address, safeGetProperty } from "../../injected/detect";
import type { InjectedTronProvider } from "../../types";
import type { WalletDescriptor } from "../types";

function getSafePalInjectedProvider(): InjectedTronProvider | undefined {
  const globals = globalThis as unknown as Record<string, unknown>;
  const safePalHook = safeGetProperty(globals, "SafePalHook");
  if (!safePalHook || typeof safePalHook !== "object") return undefined;
  const hook = safePalHook as Record<string, unknown>;
  const tronWeb = resolveSafePalTronWebSource(hook, globals);
  if (!tronWeb || typeof tronWeb !== "object") return undefined;
  const request = safeGetProperty(hook, "request");
  const provider: InjectedTronProvider = {
    tronWeb: createSafePalTronWeb(tronWeb, hook)
  };

  if (typeof request === "function") {
    provider.request = async (args) => {
      const result = await request.call(hook, args);
      provider.tronWeb = createSafePalTronWeb(resolveSafePalTronWebSource(hook, globals) ?? tronWeb, hook);
      if (args.method === "tron_requestAccounts" || args.method === "eth_requestAccounts") {
        const address = extractInjectedAddress(result) ?? readSafePalBase58Address(hook, provider.tronWeb);
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
  const defaultAddress = pickSafePalDefaultAddress(hook, source);
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

function resolveSafePalTronWebSource(hook: Record<string, unknown>, globals: Record<string, unknown>): unknown {
  const hookTronWeb = safeGetProperty(hook, "tronWeb");
  if (hookTronWeb && typeof hookTronWeb === "object") return hookTronWeb;
  return safeGetProperty(globals, "tronWeb");
}

function pickSafePalDefaultAddress(hook: Record<string, unknown>, tronWeb: Record<string, unknown>): unknown {
  const hookDefaultAddress = safeGetProperty(hook, "defaultAddress");
  const tronWebDefaultAddress = safeGetProperty(tronWeb, "defaultAddress");
  const hookTronWeb = safeGetProperty(hook, "tronWeb");
  const hookTronWebDefaultAddress =
    hookTronWeb && typeof hookTronWeb === "object" ? safeGetProperty(hookTronWeb as Record<string, unknown>, "defaultAddress") : undefined;
  return firstDefaultAddressWithBase58(hookDefaultAddress, hookTronWebDefaultAddress, tronWebDefaultAddress) ?? hookDefaultAddress ?? hookTronWebDefaultAddress ?? tronWebDefaultAddress;
}

function firstDefaultAddressWithBase58(...values: unknown[]): unknown {
  return values.find((value) => typeof getDefaultBase58Address(value) === "string" && getDefaultBase58Address(value)!.length > 0);
}

function readSafePalBase58Address(hook: Record<string, unknown>, tronWeb: InjectedTronProvider["tronWeb"]): string | undefined {
  return getDefaultBase58Address(safeGetProperty(hook, "defaultAddress")) ??
    getDefaultBase58Address(safeGetProperty(safeGetProperty(hook, "tronWeb") as Record<string, unknown>, "defaultAddress")) ??
    getDefaultBase58Address(tronWeb?.defaultAddress);
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
  injected: withSignMode(withAddressPoll(standardInjected({
    provider: getSafePalInjectedProvider,
    rdns: ["com.safepal"],
    marker: hasSafePalInjectedMarker
  }), {
    settleMs: 2500,
    retryDelayMs: 300,
    retryTimeoutMs: 3000
  }), "sign"),
  detect: { provider: getSafePalInjectedProvider, availabilityProbe: hasSafePalInjectedMarker }
};
