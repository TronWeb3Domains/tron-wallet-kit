<script setup lang="ts">
type Level = "live" | "beta" | "qa";
interface WalletRow {
  name: string;
  platforms: string;
  via: string;
  level: Level;
  note?: string;
}

const wallets: WalletRow[] = [
  { name: "TronLink", platforms: "Extension, Mobile", via: "Custom adapter / 6963", level: "live", note: "Default, featured first" },
  { name: "TokenPocket", platforms: "Extension, Mobile", via: "Injected", level: "live" },
  { name: "OKX Wallet", platforms: "Extension, Mobile", via: "Injected", level: "live" },
  { name: "Bitget Wallet", platforms: "Extension, Mobile", via: "Injected / WalletConnect", level: "live" },
  { name: "WalletConnect", platforms: "Mobile", via: "QR / deep link", level: "live", note: "Requires projectId" },
  { name: "Klever", platforms: "Extension, Mobile", via: "WalletConnect", level: "beta", note: "Mobile QR path first" },
  { name: "SafePal", platforms: "Extension, Mobile", via: "Injected", level: "beta", note: "Live reverify before promotion" },
  { name: "Gate Wallet", platforms: "Extension", via: "Injected", level: "beta", note: "HTTPS-only injection" },
  { name: "Bybit Wallet", platforms: "Extension, Mobile", via: "Injected", level: "beta", note: "Collision QA required" },
  { name: "Backpack", platforms: "Extension", via: "Injected", level: "beta", note: "Sign path under QA" },
  { name: "OneKey", platforms: "Extension", via: "Injected", level: "beta", note: "Collision QA required" },
  { name: "Guarda", platforms: "Extension", via: "Injected", level: "beta", note: "Address return QA required" },
  { name: "Trust Wallet", platforms: "Extension, Mobile", via: "Injected / WalletConnect", level: "beta", note: "Installed only with a usable TRON provider" },
  { name: "Binance Web3", platforms: "Extension, Mobile", via: "Injected", level: "beta", note: "Requires Binance TRON account API" },
  { name: "MetaMask", platforms: "Extension", via: "tronweb3 bridge", level: "qa", note: "TRON bridge only, not EVM-only MetaMask" },
  { name: "Ledger", platforms: "Hardware", via: "tronweb3 bridge", level: "qa", note: "Needs real-device QA" },
  { name: "FoxWallet", platforms: "Mobile", via: "Injected", level: "qa", note: "Desktop false-positive guarded" },
  { name: "imToken", platforms: "Mobile", via: "tronweb3 bridge", level: "qa" },
  { name: "MathWallet", platforms: "Extension, Mobile", via: "Injected", level: "qa", note: "Live QA required before promotion" },
];

const labels: Record<Level, string> = { live: "live", beta: "beta", qa: "qa" };
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>Wallet</th>
        <th>Platforms</th>
        <th>Connect via</th>
        <th>Support</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="w in wallets" :key="w.name">
        <td>
          <strong>{{ w.name }}</strong>
          <div v-if="w.note" style="font-size: 12px; color: var(--vp-c-text-2);">{{ w.note }}</div>
        </td>
        <td>{{ w.platforms }}</td>
        <td>{{ w.via }}</td>
        <td><span :class="['twk-badge', w.level]">{{ labels[w.level] }}</span></td>
      </tr>
    </tbody>
  </table>
</template>
