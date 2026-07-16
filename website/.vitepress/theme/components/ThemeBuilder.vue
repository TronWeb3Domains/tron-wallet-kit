<script setup lang="ts">
import { computed, ref } from "vue";

const accent = ref("#ef0027");
const accentForeground = ref("#ffffff");
const radius = ref<"none" | "small" | "medium" | "large">("medium");
const font = ref<"system" | "rounded">("system");
const mode = ref<"light" | "dark" | "system">("system");
const copied = ref(false);

const radiusPx: Record<string, string> = { none: "0px", small: "8px", medium: "12px", large: "18px" };
const fontStack: Record<string, string> = {
  system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  rounded: '"Nunito", ui-rounded, system-ui, sans-serif',
};

const previewMode = computed(() => (mode.value === "dark" ? "dark" : "light"));
const surface = computed(() => (previewMode.value === "light" ? "#ffffff" : "#17181c"));
const rowBg = computed(() => (previewMode.value === "light" ? "#f7f7f8" : "#0e0f12"));
const textColor = computed(() => (previewMode.value === "light" ? "#1a1a1e" : "#f2f2f4"));
const mutedColor = computed(() => (previewMode.value === "light" ? "#6b6b72" : "#9a9aa2"));
const borderColor = computed(() => (previewMode.value === "light" ? "#ececef" : "#26272c"));

const exportSnippet = computed(() => {
  const options = `{
  accentColor: "${accent.value}",
  accentColorForeground: "${accentForeground.value}",
  borderRadius: "${radius.value}",
  fontStack: "${font.value}",
}`;
  if (mode.value === "system") {
    return `import { TronKitProvider, darkTheme, lightTheme } from "@tron-wallet-kit/react";

const theme = {
  light: lightTheme(${options}),
  dark: darkTheme(${options}),
};

<TronKitProvider config={config} theme={theme}>
  <TronConnectButton />
</TronKitProvider>`;
  }
  const fn = mode.value === "light" ? "lightTheme" : "darkTheme";
  return `import { TronKitProvider, ${fn} } from "@tron-wallet-kit/react";

const theme = ${fn}(${options});

<TronKitProvider config={config} theme={theme}>
  <TronConnectButton />
</TronKitProvider>`;
});

function copy() {
  navigator.clipboard?.writeText(exportSnippet.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
  <div class="tb">
    <div class="tb-controls">
      <label>Accent
        <span class="tb-color">
          <input type="color" v-model="accent" />
          <input type="text" v-model="accent" class="tb-hex" />
        </span>
      </label>
      <label>Accent foreground
        <span class="tb-color">
          <input type="color" v-model="accentForeground" />
          <input type="text" v-model="accentForeground" class="tb-hex" />
        </span>
      </label>
      <label>Radius
        <select v-model="radius">
          <option value="none">none</option>
          <option value="small">small</option>
          <option value="medium">medium</option>
          <option value="large">large</option>
        </select>
      </label>
      <label>Font
        <select v-model="font">
          <option value="system">system</option>
          <option value="rounded">rounded</option>
        </select>
      </label>
      <label>Mode
        <select v-model="mode">
          <option value="system">system</option>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>
      </label>
    </div>

    <div
      class="tb-preview"
      :style="{
        background: rowBg,
        borderColor: borderColor,
        fontFamily: fontStack[font],
      }"
    >
      <div
        class="tb-modal"
        :style="{
          background: surface,
          color: textColor,
          borderColor: borderColor,
          borderRadius: radiusPx[radius],
        }"
      >
        <div class="tb-modal-head" :style="{ color: textColor }">
          <span>Connect a wallet</span>
          <span :style="{ color: mutedColor }">✕</span>
        </div>
        <div
          v-for="w in ['TronLink', 'OKX Wallet', 'WalletConnect']"
          :key="w"
          class="tb-row"
          :style="{ background: rowBg, borderColor: borderColor, borderRadius: radiusPx[radius], color: textColor }"
        >
          <span class="tb-dot" :style="{ background: accent, borderRadius: radiusPx[radius] }"></span>
          <span style="flex:1">{{ w }}</span>
        </div>
        <button
          class="tb-cta"
          :style="{ background: accent, borderRadius: radiusPx[radius], color: accentForeground }"
        >Get started</button>
      </div>
    </div>

    <div class="tb-export">
      <button class="tb-copy" @click="copy">{{ copied ? "Copied" : "Copy config" }}</button>
      <pre>{{ exportSnippet }}</pre>
    </div>
  </div>
</template>

<style scoped>
.tb { border: 1px solid var(--vp-c-divider); border-radius: 12px; overflow: hidden; margin: 16px 0; }
.tb-controls { display: flex; flex-wrap: wrap; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--vp-c-divider); }
.tb-controls label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--vp-c-text-2); }
.tb-color { display: inline-flex; align-items: center; gap: 6px; }
.tb-color input[type="color"] { width: 28px; height: 28px; border: none; background: none; padding: 0; }
.tb-hex { width: 84px; font-family: var(--vp-font-family-mono); font-size: 12px; padding: 4px 6px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.tb-controls select { padding: 5px 8px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); font-size: 13px; }
.tb-preview { display: flex; justify-content: center; padding: 28px 16px; border-bottom: 1px solid var(--vp-c-divider); }
.tb-modal { width: 260px; border: 1px solid; padding: 14px; }
.tb-modal-head { display: flex; justify-content: space-between; font-weight: 500; font-size: 14px; margin-bottom: 12px; }
.tb-row { display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid; font-size: 13px; margin-bottom: 6px; }
.tb-dot { width: 24px; height: 24px; display: inline-block; }
.tb-cta { width: 100%; border: none; color: #fff; padding: 9px; font-size: 13px; margin-top: 6px; cursor: pointer; }
.tb-export { position: relative; }
.tb-export pre { margin: 0; padding: 14px 16px; font-size: 12px; overflow-x: auto; background: var(--vp-c-bg-alt); }
.tb-copy { position: absolute; top: 10px; right: 12px; font-size: 12px; padding: 4px 10px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); cursor: pointer; }
</style>
