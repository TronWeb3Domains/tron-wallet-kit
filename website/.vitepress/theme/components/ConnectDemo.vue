<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
// Uses the framework-agnostic client (DOM-based), which works inside Vue/VitePress.
// Requires "@tron-wallet-kit/client" in website/package.json before this component is registered.
import { createWalletKit } from "@tron-wallet-kit/client";

const root = ref<HTMLElement | null>(null);
let kit: { destroy?: () => void } | undefined;

onMounted(() => {
  if (!root.value) return;
  kit = createWalletKit({
    appName: "TRON Wallet Kit Demo",
    network: "mainnet",
    walletConnectProjectId: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_WC_PROJECT_ID || "a4109c95d50e5c136cdafaf9fc44c105",
    identity: { enabled: true },
    connectButton: { target: root.value, label: "Connect wallet", showBalance: true },
  });
});

onBeforeUnmount(() => {
  kit?.destroy?.();
});
</script>

<template>
  <div class="twk-embed">
    <div ref="root"></div>
  </div>
</template>
