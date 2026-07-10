import type { WalletAdapter, WalletSession } from "@tron-wallet-kit/core";

export type SessionWalletMetadata = {
  id?: string;
  name?: string;
  icon?: string;
};

export function resolveSessionWalletMetadata(session: WalletSession | null | undefined, adapter?: WalletAdapter | null): SessionWalletMetadata {
  const metadata = session?.metadata;
  const id = getString(metadata?.walletId) ?? session?.adapterId ?? adapter?.metadata.id;
  const name = getString(metadata?.walletName) ?? session?.walletName ?? adapter?.metadata.name;
  const icon = getString(metadata?.walletIcon) ?? adapter?.metadata.icon;
  return {
    ...(id ? { id } : {}),
    ...(name ? { name } : {}),
    ...(icon ? { icon } : {})
  };
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
