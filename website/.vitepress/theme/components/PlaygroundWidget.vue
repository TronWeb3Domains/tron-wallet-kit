<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const KIT_VERSION = "0.1.0-beta.0-account-panel-identity-cooldown";
const network = ref<"mainnet" | "shasta" | "nile">("mainnet");
const mode = ref<"light" | "dark" | "auto">("auto");
const layout = ref<"list" | "card">("list");
const accent = ref<string | null>(null); // null = kit default (--twk-accent)
const loaded = ref(false);
const failed = ref(false);

const accentSwatches = ["#ef0027", "#ff6a3d", "#0ca678", "#3b82f6", "#7c6bf0"];

const rootRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);
let kit: { destroy?: () => void } | undefined;
let bundle: any;

function loadKit(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).TronWalletKit) return resolve((window as any).TronWalletKit);
    const s = document.createElement("script");
    s.src = `${import.meta.env.BASE_URL}tron-wallet-kit.iife.min.js?v=${KIT_VERSION}`;
    s.onload = () => resolve((window as any).TronWalletKit);
    s.onerror = () => reject(new Error("load failed"));
    document.head.appendChild(s);
  });
}

function render() {
  if (!bundle || !rootRef.value || !buttonRef.value) return;
  try { kit?.destroy?.(); } catch {}
  buttonRef.value.innerHTML = "";
  const wcProjectId = ((window as any).__TWK_WC_PROJECT_ID__ as string | undefined) || "a4109c95d50e5c136cdafaf9fc44c105";
  kit = bundle.createBrowserKit({
    appName: "TRON Wallet Kit Playground",
    network: network.value,
    ...(wcProjectId ? { walletConnectProjectId: wcProjectId } : {}),
    identity: { enabled: true },
    root: rootRef.value,
    ui: {
      mode: mode.value,
      ...(accent.value ? { accent: accent.value } : {}),
      walletList: { layout: layout.value },
      toast: true,
    },
    connectButton: { target: buttonRef.value, label: "Connect wallet", showBalance: true },
  });
}

watch([network, mode, layout, accent], () => { if (loaded.value) render(); });

onMounted(async () => {
  try { bundle = await loadKit(); loaded.value = true; render(); }
  catch { failed.value = true; }
});
onBeforeUnmount(() => { try { kit?.destroy?.(); } catch {} });
</script>

<template>
  <div class="pg" ref="rootRef">
    <div class="pg-controls">
      <label>Network
        <select v-model="network">
          <option value="mainnet">Mainnet</option>
          <option value="shasta">Shasta</option>
          <option value="nile">Nile</option>
        </select>
      </label>
      <label>Mode
        <select v-model="mode">
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label>Wallet layout
        <select v-model="layout">
          <option value="list">List</option>
          <option value="card">Card</option>
        </select>
      </label>
      <label>Accent
        <span class="pg-accent">
          <button class="pg-chip" :class="{ active: accent === null }" @click="accent = null">Default</button>
          <button
            v-for="s in accentSwatches" :key="s"
            class="pg-sw" :class="{ active: accent === s }"
            :style="{ background: s }" @click="accent = s"
          ></button>
          <input type="color" :value="accent || '#ef0027'" @input="accent = ($event.target as HTMLInputElement).value" />
        </span>
      </label>
    </div>

    <div class="pg-stage">
      <div ref="buttonRef" class="pg-button"></div>
      <p v-if="failed" class="pg-note">Could not load the kit bundle. Rebuild <code>@tron-wallet-kit/browser</code> and copy the IIFE to <code>website/public/</code>.</p>
      <p v-else-if="!loaded" class="pg-note">Loading the live kit…</p>
      <p v-else class="pg-note">Real connect flow — click the button, pick a wallet, connect on your device.</p>
    </div>
  </div>
</template>

<style scoped>
.pg { border: 1px solid var(--vp-c-divider); border-radius: 12px; overflow: hidden; margin: 16px 0; }
.pg-controls { display: flex; flex-wrap: wrap; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); }
.pg-controls label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--vp-c-text-2); }
.pg-controls select { padding: 5px 8px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); font-size: 13px; }
.pg-accent { display: inline-flex; align-items: center; gap: 6px; }
.pg-chip { padding: 3px 8px; border-radius: 6px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); color: var(--vp-c-text-1); font-size: 11px; cursor: pointer; }
.pg-chip.active { background: var(--vp-c-brand-soft); border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.pg-sw { width: 20px; height: 20px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 0; }
.pg-sw.active { border-color: var(--vp-c-text-1); }
.pg-accent input[type="color"] { width: 24px; height: 24px; border: 1px solid var(--vp-c-divider); border-radius: 50%; padding: 1px; background: none; cursor: pointer; }
.pg-stage { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 16px; }
.pg-note { font-size: 12px; color: var(--vp-c-text-3); margin: 0; text-align: center; }
</style>
