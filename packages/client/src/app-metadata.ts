import type { WalletKitAppMetadata } from "@tron-wallet-kit/core";

export type ResolvedWalletKitAppMetadata = Required<WalletKitAppMetadata>;

export type AppMetadataInput = {
  metadata?: WalletKitAppMetadata;
  appName?: string;
  appDescription?: string;
  appUrl?: string;
  appIcons?: string[];
};

export function resolveAppMetadata(config: AppMetadataInput = {}): ResolvedWalletKitAppMetadata {
  const name = nonEmptyString(config.metadata?.name) ?? nonEmptyString(config.appName) ?? "TRON dApp";
  const metadataIcons = normalizeIcons(config.metadata?.icons);
  const legacyIcons = normalizeIcons(config.appIcons);
  return {
    name,
    description: nonEmptyString(config.metadata?.description) ?? nonEmptyString(config.appDescription) ?? `${name} TRON wallet connection`,
    url: nonEmptyString(config.metadata?.url) ?? nonEmptyString(config.appUrl) ?? getCurrentOrigin(),
    icons: metadataIcons.length ? metadataIcons : legacyIcons
  };
}

function getCurrentOrigin(): string {
  const origin = typeof globalThis.location === "object" && globalThis.location?.origin ? globalThis.location.origin : undefined;
  return origin && origin !== "null" ? origin : "https://trxdomains.xyz";
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeIcons(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((icon): icon is string => typeof icon === "string" && icon.trim().length > 0).map((icon) => icon.trim());
}
