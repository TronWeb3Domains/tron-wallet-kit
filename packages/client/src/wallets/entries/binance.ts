import { standardInjected } from "../../adapters/injected-strategy";
import { extractInjectedAddress, safeGetProperty } from "../../injected/detect";
import type { InjectedTronProvider } from "../../types";
import type { WalletDescriptor } from "../types";

function getBinanceInjectedProvider(): InjectedTronProvider | undefined {
  const globals = globalThis as unknown as Record<string, unknown>;
  const binancew3w = safeGetProperty(globals, "binancew3w");
  if (!binancew3w || typeof binancew3w !== "object") return undefined;
  const wallet = binancew3w as Record<string, unknown>;
  const tron = safeGetProperty(wallet, "tron");
  if (!tron || typeof tron !== "object") return undefined;

  const provider = tron as Record<string, unknown>;
  const getAccount = safeGetProperty(provider, "getAccount");
  const getChainId = safeGetProperty(provider, "getChainId");
  const signMessageV2 = safeGetProperty(provider, "signMessageV2");
  const signTransaction = safeGetProperty(provider, "signTransaction");
  if (typeof getAccount !== "function") return undefined;
  const trx: NonNullable<NonNullable<InjectedTronProvider["tronWeb"]>["trx"]> = {};
  if (typeof getChainId === "function") {
    trx.getBlockByNumber = async () => {
      const chainId = String(await getChainId.call(provider));
      const suffix = chainId.startsWith("0x") ? chainId.slice(2).slice(-8) : "";
      return { blockID: `${"0".repeat(56)}${suffix}` };
    };
  }
  if (typeof signMessageV2 === "function") {
    trx.signMessageV2 = (message: string) => signMessageV2.call(provider, message);
  }
  if (typeof signTransaction === "function") {
    trx.sign = (transaction: unknown) => signTransaction.call(provider, transaction);
  }

  return {
    request: async ({ method, params }) => {
      if (method === "tron_requestAccounts" || method === "eth_requestAccounts") {
        const account = await getAccount.call(provider);
        const address = extractInjectedAddress(account);
        return address ? [address] : account;
      }
      if (method === "tron_signMessage" && typeof signMessageV2 === "function") {
        const message = typeof params === "object" && params !== null && "message" in params ? (params as { message?: unknown }).message : params;
        return signMessageV2.call(provider, String(message ?? ""));
      }
      if (method === "tron_signTransaction" && typeof signTransaction === "function") {
        const transaction = typeof params === "object" && params !== null && "transaction" in params ? (params as { transaction?: unknown }).transaction : params;
        return signTransaction.call(provider, transaction);
      }
      return undefined;
    },
    tronWeb: {
      trx
    }
  };
}

export const binance: WalletDescriptor = {
  id: "binance",
  name: "Binance Web3 Wallet",
  integration: "injected",
  homepage: "https://www.binance.com/en/web3wallet",
  platforms: ["extension", "mobile"],
  group: "popular",
  supportsWalletConnect: true,
  providerPaths: ["binancew3w.tron"],
  conflictMarkers: ["binancew3w"],
  injected: standardInjected({ provider: getBinanceInjectedProvider }),
  detect: { providerPaths: ["binancew3w.tron"], provider: getBinanceInjectedProvider }
};
