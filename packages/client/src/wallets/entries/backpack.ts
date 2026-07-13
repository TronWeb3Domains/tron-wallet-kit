import { standardInjected, withRequestMethods } from "../../adapters/injected-strategy";
import { cloneInjectedProvider, isInjectedTronProvider, safeGetProperty } from "../../injected/detect";
import type { InjectedTronProvider } from "../../types";
import type { WalletDescriptor } from "../types";

function getBackpackInjectedProvider(): InjectedTronProvider | undefined {
  const globals = globalThis as unknown as Record<string, unknown>;
  const backpack = safeGetProperty(globals, "backpack");
  if (!backpack || typeof backpack !== "object") return undefined;
  const wallet = backpack as Record<string, unknown>;
  return mergeBackpackProvider(safeGetProperty(wallet, "tron")) ?? mergeBackpackProvider(safeGetProperty(wallet, "tronLink"));
}

function mergeBackpackProvider(value: unknown): InjectedTronProvider | undefined {
  if (!isInjectedTronProvider(value)) return undefined;
  const provider = cloneInjectedProvider(value);
  const globalTronWeb = safeGetProperty(globalThis as unknown as Record<string, unknown>, "tronWeb") as InjectedTronProvider["tronWeb"] | undefined;
  if (!provider.tronWeb && globalTronWeb && typeof globalTronWeb === "object") provider.tronWeb = globalTronWeb;
  return provider;
}

export const backpack: WalletDescriptor = {
  id: "backpack",
  name: "Backpack",
  integration: "injected",
  homepage: "https://backpack.app/",
  platforms: ["extension"],
  group: "popular",
  providerPaths: ["backpack.tron", "backpack.tronLink"],
  conflictMarkers: ["backpack"],
  injected: withRequestMethods(standardInjected({ provider: getBackpackInjectedProvider, rdns: ["app.backpack"] }), ["tron_requestAccounts"]),
  detect: { providerPaths: ["backpack.tron", "backpack.tronLink"], provider: getBackpackInjectedProvider }
};
