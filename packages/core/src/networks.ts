import { WalletKitError } from "./errors";
import type { WalletNetwork, WalletNetworkId } from "./types";

export const TRON_MAINNET: WalletNetwork = {
  id: "mainnet",
  name: "TRON Mainnet",
  family: "tron",
  networkType: "MAINNET",
  nativeAsset: "TRX",
  nativeAssetDecimals: 6,
  rpcUrl: "https://api.trongrid.io",
  httpRpcUrl: "https://api.trongrid.io",
  walletConnectChainId: "tron:0x2b6653dc",
  explorerTxUrl: "https://tronscan.org/#/transaction/{hash}",
  explorerAccountUrl: "https://tronscan.org/#/address/{address}",
  fullHost: "https://api.trongrid.io",
  solidityNode: "https://api.trongrid.io",
  eventServer: "https://api.trongrid.io"
};

export const TRON_NILE: WalletNetwork = {
  id: "nile",
  name: "TRON Nile",
  family: "tron",
  networkType: "TESTNET",
  nativeAsset: "TRX",
  nativeAssetDecimals: 6,
  rpcUrl: "https://nile.trongrid.io",
  httpRpcUrl: "https://nile.trongrid.io",
  walletConnectChainId: "tron:0xcd8690dc",
  explorerTxUrl: "https://nile.tronscan.org/#/transaction/{hash}",
  explorerAccountUrl: "https://nile.tronscan.org/#/address/{address}",
  fullHost: "https://nile.trongrid.io",
  solidityNode: "https://nile.trongrid.io",
  eventServer: "https://nile.trongrid.io"
};

export const TRON_SHASTA: WalletNetwork = {
  id: "shasta",
  name: "TRON Shasta",
  family: "tron",
  networkType: "TESTNET",
  nativeAsset: "TRX",
  nativeAssetDecimals: 6,
  rpcUrl: "https://api.shasta.trongrid.io",
  httpRpcUrl: "https://api.shasta.trongrid.io",
  walletConnectChainId: "tron:0x94a9059e",
  explorerTxUrl: "https://shasta.tronscan.org/#/transaction/{hash}",
  explorerAccountUrl: "https://shasta.tronscan.org/#/address/{address}",
  fullHost: "https://api.shasta.trongrid.io",
  solidityNode: "https://api.shasta.trongrid.io",
  eventServer: "https://api.shasta.trongrid.io"
};

export const DEFAULT_TRON_NETWORKS = [TRON_MAINNET, TRON_NILE, TRON_SHASTA] as const;

export class NetworkRegistry {
  readonly networks = new Map<WalletNetworkId, WalletNetwork>();

  constructor(networks: WalletNetwork[] = [...DEFAULT_TRON_NETWORKS]) {
    networks.forEach((network) => this.register(network));
  }

  register(network: WalletNetwork): this {
    this.networks.set(network.id, network);
    return this;
  }

  resolve(network: WalletNetwork | WalletNetworkId | undefined): WalletNetwork {
    if (!network) return TRON_MAINNET;
    if (typeof network !== "string") return network;
    const resolved = this.networks.get(network);
    if (!resolved) {
      throw new WalletKitError("UNKNOWN_NETWORK", `Unknown TRON network: ${network}`);
    }
    return resolved;
  }
}
