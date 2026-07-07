import type { WalletManager } from "@tron-wallet-kit/core";
import { getSharedTronWeb } from "./tronweb";
import type { TronIdentity, TronIdentityResolver, WalletClientIdentityConfig } from "./types";

export const TRX_DOMAINS_MAINNET_CONTRACT = "TAtgoVq9xqv1C65hjFTerJQZFt4rbAPea6";

export function createTronDomainIdentityResolver(config: {
  manager?: WalletManager;
  contractAddress?: string;
  metadataKeys?: string[];
  timeoutMs?: number;
  resolverTimeoutMs?: number;
} = {}): TronIdentityResolver {
  const contractAddress = config.contractAddress ?? TRX_DOMAINS_MAINNET_CONTRACT;
  const metadataKeys = config.metadataKeys ?? ["avatar", "website"];
  const timeoutMs = config.timeoutMs ?? config.resolverTimeoutMs ?? 8000;
  let contractPromise: Promise<TronDomainContract> | undefined;

  return async (account, context) => {
    const network = context.network ?? config.manager?.getNetwork();
    if (network?.networkType !== "MAINNET") return undefined;

    const run = (async () => {
      const tronWeb = await getSharedTronWeb(config.manager, network, context.walletId);
      tronWeb.setAddress?.(account.address);
      contractPromise ??= tronWeb.contract().at(contractAddress) as Promise<TronDomainContract>;
      const contract = await contractPromise;
      const domain = normalizeDomain(await contract.reverseOf(account.address).call()) ?? await firstOwnedDomain(contract, account.address);
      if (!domain) return undefined;

      const identity: TronIdentity = { domain, displayName: domain };
      if (metadataKeys.length > 0) {
        try {
          const tokenId = await contract.genTokenId(domain).call();
          const values = (await contract.getMany(metadataKeys, tokenId).call()) as unknown[];
          const metadata = Object.fromEntries(
            metadataKeys.map((key, index) => [key, typeof values[index] === "string" ? values[index].trim() : ""] as const).filter(([, value]) => value.length > 0)
          );
          if (Object.keys(metadata).length > 0) identity.metadata = metadata;
          if (metadata.avatar) identity.avatar = metadata.avatar;
          if (metadata.website) identity.website = metadata.website;
        } catch {
          // Metadata is optional; keep the resolved domain when metadata fails.
        }
      }
      return identity;
    })();

    return promiseWithTimeout(run, timeoutMs, undefined);
  };
}

export function resolveIdentityResolver(config: WalletClientIdentityConfig | undefined, manager: WalletManager): TronIdentityResolver | undefined {
  if (!config?.enabled) return undefined;
  return config.resolver ?? createTronDomainIdentityResolver({
    manager,
    ...(config.contractAddress ? { contractAddress: config.contractAddress } : {}),
    ...(config.metadataKeys ? { metadataKeys: config.metadataKeys } : {}),
    ...(config.resolverTimeoutMs ? { resolverTimeoutMs: config.resolverTimeoutMs } : {})
  });
}

function normalizeDomain(domain: unknown): string | undefined {
  if (typeof domain !== "string") return undefined;
  const trimmed = domain.trim();
  if (!trimmed || trimmed === "0x") return undefined;
  return trimmed;
}

async function firstOwnedDomain(contract: TronDomainContract, address: string): Promise<string | undefined> {
  try {
    const balance = Number(String(await contract.balanceOf(address).call()));
    if (!Number.isFinite(balance) || balance <= 0) return undefined;
    for (let index = 0; index < balance; index += 1) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(address, index).call();
        const domain = normalizeDomain(await contract._tokenURIs(tokenId).call());
        if (domain) return domain;
      } catch {
        // Skip malformed token metadata without failing the whole identity lookup.
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => resolve(fallback), timeoutMs);
    promise.then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

type TronDomainContract = {
  reverseOf(address: string): TronDomainContractCall;
  balanceOf(address: string): TronDomainContractCall;
  tokenOfOwnerByIndex(address: string, index: number): TronDomainContractCall;
  _tokenURIs(tokenId: unknown): TronDomainContractCall;
  genTokenId(domain: string): TronDomainContractCall;
  getMany(keys: string[], tokenId: unknown): TronDomainContractCall;
};

type TronDomainContractCall = {
  call(): Promise<unknown>;
};
