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
  { name: "TronLink", platforms: "Extension, Mobile", via: "Injected (6963)", level: "live", note: "Default, featured first" },
  { name: "OKX Wallet", platforms: "Extension, Mobile", via: "Injected", level: "live" },
  { name: "TokenPocket", platforms: "Extension, Mobile", via: "Injected", level: "live" },
  { name: "Bitget Wallet", platforms: "Extension, Mobile", via: "Injected / WalletConnect", level: "live" },
  { name: "Gate Wallet", platforms: "Extension", via: "Injected", level: "live", note: "HTTPS-only injection" },
  { name: "OneKey", platforms: "Extension", via: "Injected", level: "live" },
  { name: "SafePal", platforms: "Extension, Mobile", via: "Injected", level: "live" },
  { name: "Klever", platforms: "Mobile", via: "WalletConnect", level: "live" },
  { name: "WalletConnect", platforms: "Mobile", via: "QR / deep link", level: "live", note: "Requires projectId" },
  { name: "Trust Wallet", platforms: "Mobile", via: "WalletConnect", level: "beta", note: "Desktop extension has no TRON provider" },
  { name: "MetaMask", platforms: "Extension", via: "tronweb3 bridge", level: "beta" },
  { name: "Binance Web3", platforms: "Extension, Mobile", via: "Injected", level: "beta", note: "Confirm TRON path" },
  { name: "Backpack", platforms: "Extension", via: "Injected", level: "beta", note: "Sign path under QA" },
  { name: "Ledger", platforms: "Hardware", via: "tronweb3 bridge", level: "qa", note: "Needs real-device QA" },
  { name: "FoxWallet", platforms: "Extension", via: "Injected", level: "qa" },
  { name: "imToken", platforms: "Mobile", via: "Injected", level: "qa" },
  { name: "MathWallet", platforms: "Extension", via: "Injected", level: "qa", note: "Namespace collision risk" },
  { name: "Coin98", platforms: "Extension", via: "Injected", level: "qa" },
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
