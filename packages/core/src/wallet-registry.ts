import type { WalletPlatform } from "./types";

export type TronWalletTransport = "extension" | "walletconnect" | "qr" | "hardware" | "mobile";
export type TronWalletGroup = "featured" | "popular" | "hardware" | "extension" | "mobile";

export type TronWalletRegistryItem = {
  id: string;
  name: string;
  enabled: boolean;
  group: TronWalletGroup;
  transport: TronWalletTransport;
  platforms: readonly WalletPlatform[];
  homepage?: string;
  downloadUrl?: string;
  providerPaths?: readonly string[];
  conflictMarkers?: readonly string[];
  mobileDeepLink?: {
    scheme: string;
    urlTemplate?: string;
  };
  supportsWalletConnect?: boolean;
  upstreamPackage?: string;
};

export const TRON_WALLET_REGISTRY = [
  {
    id: "tronlink",
    name: "TronLink",
    enabled: true,
    group: "featured",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://www.tronlink.org/",
    providerPaths: ["tronLink", "tron", "tronWeb"],
    conflictMarkers: ["isTronLink", "org.tronlink.www"],
    mobileDeepLink: { scheme: "tronlinkoutside", urlTemplate: "tronlinkoutside://pull.activity?param={encodedParams}" },
    upstreamPackage: "@tronweb3/tronwallet-adapter-tronlink"
  },
  {
    id: "tokenpocket",
    name: "TokenPocket",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://www.tokenpocket.pro/",
    providerPaths: ["tokenpocket.tron", "tokenpocket.tronWeb", "tronWeb"],
    conflictMarkers: ["tokenpocket", "TIP6963"],
    mobileDeepLink: { scheme: "tpdapp", urlTemplate: "tpdapp://open?params={encodedParams}" },
    supportsWalletConnect: true,
    upstreamPackage: "@tronweb3/tronwallet-adapter-tokenpocket"
  },
  {
    id: "okx",
    name: "OKX Wallet",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://www.okx.com/web3",
    providerPaths: ["okxwallet.tronLink"],
    mobileDeepLink: { scheme: "okx", urlTemplate: "okx://wallet/dapp/url?dappUrl={encodedUrl}" },
    upstreamPackage: "@tronweb3/tronwallet-adapter-okxwallet"
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://web3.bitget.com/",
    providerPaths: ["bitkeep.tronLink", "bitkeep.tron"],
    conflictMarkers: ["isBitKeep"],
    mobileDeepLink: { scheme: "https", urlTemplate: "https://bkcode.vip?action=dapp&url={encodedUrl}" },
    upstreamPackage: "@tronweb3/tronwallet-adapter-bitkeep"
  },
  {
    id: "trust",
    name: "Trust Wallet",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://trustwallet.com/",
    providerPaths: ["trustwallet.tronLink", "trustwallet.tron"],
    conflictMarkers: ["Trust"],
    mobileDeepLink: { scheme: "https", urlTemplate: "https://link.trustwallet.com/open_url?url={encodedUrl}" },
    supportsWalletConnect: true,
    upstreamPackage: "@tronweb3/tronwallet-adapter-trust"
  },
  {
    id: "metamask",
    name: "MetaMask",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension"],
    homepage: "https://metamask.io/",
    providerPaths: ["ethereum"],
    conflictMarkers: ["isMetaMask"],
    mobileDeepLink: { scheme: "metamask", urlTemplate: "https://metamask.app.link/dapp/{encodedHostAndPath}" },
    upstreamPackage: "@tronweb3/tronwallet-adapter-metamask-tron"
  },
  {
    id: "gate",
    name: "Gate Wallet",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension"],
    homepage: "https://www.gate.io/web3",
    providerPaths: ["gatewallet.tron", "gatewallet.tronLink"],
    conflictMarkers: ["GateApp"],
    mobileDeepLink: { scheme: "https", urlTemplate: "https://gate.onelink.me/Hls0/web3" },
    upstreamPackage: "@tronweb3/tronwallet-adapter-gatewallet"
  },
  {
    id: "foxwallet",
    name: "FoxWallet",
    enabled: true,
    group: "popular",
    transport: "mobile",
    platforms: ["mobile"],
    homepage: "https://foxwallet.com/",
    providerPaths: ["foxwallet.tronLink"],
    mobileDeepLink: { scheme: "foxwallet", urlTemplate: "foxwallet://dapp?url={encodedUrl}" },
    upstreamPackage: "@tronweb3/tronwallet-adapter-foxwallet"
  },
  {
    id: "bybit",
    name: "Bybit Wallet",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://www.bybit.com/web3",
    providerPaths: ["bybitWallet.tronLink", "bybitWallet.tron"],
    conflictMarkers: ["bybit_app"],
    mobileDeepLink: { scheme: "bybitapp" },
    upstreamPackage: "@tronweb3/tronwallet-adapter-bybit"
  },
  {
    id: "imtoken",
    name: "imToken",
    enabled: true,
    group: "popular",
    transport: "mobile",
    platforms: ["mobile"],
    homepage: "https://token.im/",
    providerPaths: ["imToken", "tronWeb"],
    mobileDeepLink: { scheme: "imtokenv2", urlTemplate: "imtokenv2://navigate/DappView?url={encodedUrl}" },
    upstreamPackage: "@tronweb3/tronwallet-adapter-imtoken"
  },
  {
    id: "tomo",
    name: "Tomo Wallet",
    enabled: true,
    group: "popular",
    transport: "mobile",
    platforms: ["mobile"],
    homepage: "https://tomo.inc/"
  },
  {
    id: "binance",
    name: "Binance Web3 Wallet",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension", "mobile"],
    homepage: "https://www.binance.com/en/web3wallet",
    providerPaths: ["binancew3w.tron", "binancew3w.tronLink"],
    conflictMarkers: ["isBinance"],
    mobileDeepLink: { scheme: "bnc" },
    supportsWalletConnect: true,
    upstreamPackage: "@tronweb3/tronwallet-adapter-binance"
  },
  {
    id: "guarda",
    name: "Guarda",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension"],
    homepage: "https://guarda.com/",
    providerPaths: ["guarda.tron", "guarda"],
    upstreamPackage: "@tronweb3/tronwallet-adapter-guarda"
  },
  {
    id: "backpack",
    name: "Backpack",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension"],
    homepage: "https://backpack.app/",
    providerPaths: ["backpack.tron", "backpack.tronLink"],
    conflictMarkers: ["isBackpack"],
    upstreamPackage: "@tronweb3/tronwallet-adapter-backpack"
  },
  {
    id: "onekey",
    name: "OneKey",
    enabled: true,
    group: "popular",
    transport: "extension",
    platforms: ["extension"],
    homepage: "https://onekey.so/",
    providerPaths: ["$onekey.tron", "$onekey.tronLink"],
    upstreamPackage: "@tronweb3/tronwallet-adapter-onekey"
  },
  {
    id: "ledger",
    name: "Ledger",
    enabled: false,
    group: "hardware",
    transport: "hardware",
    platforms: ["extension"],
    homepage: "https://www.ledger.com/"
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    enabled: true,
    group: "featured",
    transport: "walletconnect",
    platforms: ["mobile"],
    homepage: "https://walletconnect.com/",
    supportsWalletConnect: true
  }
] as const satisfies readonly TronWalletRegistryItem[];

export type TronWalletRegistryId = (typeof TRON_WALLET_REGISTRY)[number]["id"];

export function getTronWalletRegistryItem(walletId: string): TronWalletRegistryItem | undefined {
  return TRON_WALLET_REGISTRY.find((wallet) => wallet.id === walletId);
}

export function getEnabledTronWalletRegistryItems(): readonly TronWalletRegistryItem[] {
  return TRON_WALLET_REGISTRY.filter((wallet) => wallet.enabled);
}
