<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, computed, watch, nextTick } from "vue";

const KIT_VERSION = "0.1.0-beta.0-flow-guards";
const WALLETCONNECT_PROJECT_ID = "a4109c95d50e5c136cdafaf9fc44c105";

const mode = ref<"light" | "dark" | "auto">("light");
const themeName = ref("default");
const layout = ref<"list" | "card">("list");
const btnVariant = ref("default");
const btnSize = ref("md");
const accent = ref<string | null>(null);
const radius = ref(12);
const walletRadius = ref(10);
const walletIconRadius = ref(7);
const backdropBlur = ref(0);

const tokens = reactive<Record<string, string>>({
  accentText: "", text: "", textMuted: "", surface: "", surfaceElevated: "", surfaceMuted: "",
  surfaceHover: "", border: "", success: "", warning: "", danger: "", spinnerTrail: "",
  focusRing: "", backdrop: "", fontFamily: "",
});
const colorFields: [string, string][] = [
  ["accentText", "Accent text"], ["text", "Text"], ["textMuted", "Muted text"],
  ["surface", "Surface"], ["surfaceElevated", "Surface elevated"], ["surfaceMuted", "Surface muted"],
  ["surfaceHover", "Surface hover"], ["border", "Border"], ["success", "Success"],
  ["warning", "Warning"], ["danger", "Danger"], ["spinnerTrail", "Spinner trail"],
  ["focusRing", "Focus ring"], ["backdrop", "Backdrop"],
];
const swatches = ["#ef0027", "#ff6a3d", "#e8920c", "#0ca678", "#3b82f6", "#7c6bf0", "#111827"];
const fonts = [
  ["", "System (default)"], ["Inter, sans-serif", "Inter"], ["Poppins, sans-serif", "Poppins"],
  ["Nunito, sans-serif", "Nunito"], ['"DM Sans", sans-serif', "DM Sans"], ["Sora, sans-serif", "Sora"],
  ['"JetBrains Mono", monospace', "JetBrains Mono"],
];

const device = ref<"desktop" | "mobile">("desktop");
const copied = ref(false);
const loaded = ref(false);
const failed = ref(false);
const activePreset = ref("default");
const collapsed = reactive<Record<string, boolean>>({ display: false, button: false, colors: false, radius: false });
function toggle(k: string) { collapsed[k] = !collapsed[k]; }

const presets: Record<string, () => void> = {
  default: () => { mode.value = "light"; themeName.value = "default"; layout.value = "list"; accent.value = null; radius.value = 12; walletRadius.value = 10; resetTokens(); },
  dark: () => { mode.value = "dark"; themeName.value = "dark"; layout.value = "list"; accent.value = null; radius.value = 12; walletRadius.value = 10; resetTokens(); },
  tron: () => { mode.value = "light"; themeName.value = "tron"; layout.value = "list"; accent.value = "#ef0027"; radius.value = 14; walletRadius.value = 12; resetTokens(); },
  minimal: () => { mode.value = "light"; themeName.value = "default"; layout.value = "list"; accent.value = "#111827"; radius.value = 6; walletRadius.value = 6; resetTokens(); },
  rounded: () => { mode.value = "light"; themeName.value = "default"; layout.value = "card"; accent.value = "#7c6bf0"; radius.value = 22; walletRadius.value = 16; resetTokens(); },
};
function resetTokens() { for (const k of Object.keys(tokens)) tokens[k] = ""; backdropBlur.value = 0; walletIconRadius.value = 7; }
function applyPreset(id: string) { activePreset.value = id; presets[id](); }

const modalRef = ref<HTMLElement | null>(null);
const btnRef = ref<HTMLElement | null>(null);
let bundle: any;
let kit: { manager: any; catalog: any } | undefined;
let modalCtl: { open?: () => void; destroy?: () => void } | undefined;
let buttonCtl: { mount?: (target: HTMLElement) => void; destroy?: () => void; setTheme?: (theme: Record<string, unknown>) => void } | undefined;
let reopenTimer: any;

function goBack() {
  if (typeof window === "undefined") return;
  if (window.history.length > 1) window.history.back();
  else window.location.href = "/docs/quick-start";
}

function sdkThemeName(): string | undefined {
  return themeName.value === "default" || themeName.value === "light" ? undefined : themeName.value;
}
function customTheme(): Record<string, string> {
  const t: Record<string, string> = { radius: `${radius.value}px`, walletRadius: `${walletRadius.value}px`, walletIconRadius: `${walletIconRadius.value}px` };
  if (accent.value) t.accent = accent.value;
  for (const k of Object.keys(tokens)) if (tokens[k]) t[k] = tokens[k];
  if (backdropBlur.value) t.backdropBlur = `${backdropBlur.value}px`;
  return t;
}
function themeUi(): Record<string, unknown> {
  return {
    mode: mode.value,
    ...(sdkThemeName() ? { themeName: sdkThemeName() } : {}),
    ...(accent.value ? { accent: accent.value } : {}),
    ...(tokens.fontFamily ? { fontFamily: tokens.fontFamily } : {}),
    customTheme: customTheme(),
    walletList: { layout: layout.value },
    modal: { showCloseButton: true, closeOnBackdropClick: false, closeOnSelect: true },
  };
}
function themeConfig(): Record<string, unknown> {
  return { mode: mode.value, ...(sdkThemeName() ? { themeName: sdkThemeName() } : {}), ...(accent.value ? { accent: accent.value } : {}), tokens: customTheme() };
}

const codeSnippet = computed(() => {
  const t = customTheme();
  const lines = Object.entries(t).map(([k, v]) => `      ${k}: "${v}",`).join("\n");
  const modeLine = mode.value !== "light" ? `\n    mode: "${mode.value}",` : "";
  const nameLine = sdkThemeName() ? `\n    themeName: "${sdkThemeName()}",` : "";
  const layoutLine = layout.value !== "list" ? `\n    walletList: { layout: "${layout.value}" },` : "";
  return `import { createWalletKit } from "@tron-wallet-kit/client";

const kit = createWalletKit({
  appName: "My dApp",
  ui: {${modeLine}${nameLine}${layoutLine}
    customTheme: {
${lines}
    },
  },
});`;
});

async function copy() {
  try { await navigator.clipboard.writeText(codeSnippet.value); copied.value = true; setTimeout(() => (copied.value = false), 1600); } catch {}
}

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

function reopenSoon() {
  clearTimeout(reopenTimer);
  reopenTimer = setTimeout(() => { try { modalCtl?.open?.(); } catch {} }, 30);
}

function renderButtonPreview() {
  const el = btnRef.value;
  if (!el || !bundle || !kit || !modalCtl) return;
  try { buttonCtl?.destroy?.(); } catch {}
  buttonCtl = undefined;
  el.className = "tbx-btnwrap";
  el.innerHTML = "";
  buttonCtl = bundle.createWalletButton({
    manager: kit.manager,
    modal: modalCtl,
    label: "Connect wallet",
    showBalance: true,
    accountPanelMode: "dropdown",
    variant: btnVariant.value === "outline" ? "default" : btnVariant.value,
    size: btnSize.value,
    theme: themeConfig(),
    refreshAccountDetails: async () => {
      await Promise.allSettled([kit?.refreshIdentity?.(), kit?.refreshBalance?.()]);
    },
  });
  buttonCtl.mount?.(el);
}

function render() {
  if (!bundle || !modalRef.value) return;
  if (!kit) kit = bundle.createWalletKit({ appName: "Theme Builder", network: "mainnet", walletConnectProjectId: WALLETCONNECT_PROJECT_ID, ui: { toast: false } });
  try { buttonCtl?.destroy?.(); } catch {}
  try { modalCtl?.destroy?.(); } catch {}
  buttonCtl = undefined;
  modalRef.value.innerHTML = "";
  modalCtl = bundle.createWalletModal({ manager: kit!.manager, ui: { ...themeUi(), catalog: kit!.catalog } });
  (modalCtl as any).mount(modalRef.value);
  renderButtonPreview();
  requestAnimationFrame(() => { try { modalCtl?.open?.(); } catch {} });
}

watch([mode, themeName, layout, accent, radius, walletRadius, walletIconRadius, backdropBlur, btnVariant, btnSize], () => { activePreset.value = "custom"; if (loaded.value) render(); });
watch(tokens, () => { activePreset.value = "custom"; if (loaded.value) render(); }, { deep: true });
watch(device, async () => { if (loaded.value) { await nextTick(); render(); } });

onMounted(async () => {
  try { bundle = await loadKit(); loaded.value = true; render(); } catch { failed.value = true; }
});
onBeforeUnmount(() => { clearTimeout(reopenTimer); try { buttonCtl?.destroy?.(); } catch {}; try { modalCtl?.destroy?.(); } catch {} });
</script>

<template>
  <div class="tbx-root">
    <div class="tbx-topbar">
      <button class="tbx-back" @click="goBack">← Back</button>
      <span class="tbx-brand">TRON Wallet Kit</span>
    </div>

    <div class="tbx-inner">
      <header class="tbx-head">
        <div>
          <h1 class="tbx-title">Theme builder</h1>
          <p class="tbx-sub">Configure the wallet modal live — copy the generated config when you're done.</p>
        </div>
        <div class="tbx-presets">
          <span class="tbx-presets-lab">Presets</span>
          <button v-for="id in Object.keys(presets)" :key="id" class="tbx-preset" :class="{ active: activePreset === id }" @click="applyPreset(id)">{{ id }}</button>
        </div>
      </header>

      <div class="tbx-main">
        <aside class="tbx-controls">
          <div class="tbx-group">
            <button class="tbx-ghd" @click="toggle('display')"><span>Display</span><span class="tbx-arrow" :class="{ open: !collapsed.display }">▾</span></button>
            <div v-show="!collapsed.display" class="tbx-gbd">
              <div class="tbx-field"><span class="tbx-lab">Layout</span>
                <div class="tbx-chips"><button v-for="l in ['list','card']" :key="l" class="tbx-chip" :class="{ active: layout === l }" @click="layout = l as any">{{ l }}</button></div>
              </div>
              <div class="tbx-field"><span class="tbx-lab">Mode</span>
                <div class="tbx-chips"><button v-for="m in ['light','dark','auto']" :key="m" class="tbx-chip" :class="{ active: mode === m }" @click="mode = m as any">{{ m }}</button></div>
              </div>
              <div class="tbx-field"><span class="tbx-lab">Font</span>
                <select :value="tokens.fontFamily" @change="tokens.fontFamily = ($event.target as HTMLSelectElement).value">
                  <option v-for="f in fonts" :key="f[1]" :value="f[0]">{{ f[1] }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="tbx-group">
            <button class="tbx-ghd" @click="toggle('button')"><span>Connect button</span><span class="tbx-arrow" :class="{ open: !collapsed.button }">▾</span></button>
            <div v-show="!collapsed.button" class="tbx-gbd">
              <div class="tbx-field"><span class="tbx-lab">Style</span>
                <select v-model="btnVariant">
                  <option value="default">Default</option><option value="pill">Pill</option>
                  <option value="outline">Outline</option><option value="minimal">Minimal</option>
                </select>
              </div>
              <div class="tbx-field"><span class="tbx-lab">Size</span>
                <div class="tbx-chips"><button v-for="s in ['sm','md','lg']" :key="s" class="tbx-chip" :class="{ active: btnSize === s }" @click="btnSize = s">{{ s.toUpperCase() }}</button></div>
              </div>
            </div>
          </div>

          <div class="tbx-group">
            <button class="tbx-ghd" @click="toggle('colors')"><span>Colors</span><span class="tbx-arrow" :class="{ open: !collapsed.colors }">▾</span></button>
            <div v-show="!collapsed.colors" class="tbx-gbd">
              <div class="tbx-field"><span class="tbx-lab">Accent</span>
                <div class="tbx-swatches">
                  <button class="tbx-chip" :class="{ active: accent === null }" @click="accent = null">Default</button>
                  <button v-for="s in swatches" :key="s" class="tbx-sw" :class="{ active: accent === s }" :style="{ background: s }" @click="accent = s"></button>
                  <input type="color" :value="accent || '#ef0027'" @input="accent = ($event.target as HTMLInputElement).value" />
                </div>
              </div>
              <div class="tbx-field" v-for="c in colorFields" :key="c[0]"><span class="tbx-lab">{{ c[1] }}</span>
                <div class="tbx-crow">
                  <input type="color" :value="tokens[c[0]] || '#000000'" @input="tokens[c[0]] = ($event.target as HTMLInputElement).value" />
                  <input type="text" :value="tokens[c[0]]" placeholder="default" @input="tokens[c[0]] = ($event.target as HTMLInputElement).value" />
                  <button v-if="tokens[c[0]]" class="tbx-reset" @click="tokens[c[0]] = ''">✕</button>
                </div>
              </div>
            </div>
          </div>

          <div class="tbx-group">
            <button class="tbx-ghd" @click="toggle('radius')"><span>Radius &amp; overlay</span><span class="tbx-arrow" :class="{ open: !collapsed.radius }">▾</span></button>
            <div v-show="!collapsed.radius" class="tbx-gbd">
              <div class="tbx-field"><span class="tbx-lab">Modal <b>{{ radius }}px</b></span><input type="range" min="0" max="24" step="2" v-model.number="radius" /></div>
              <div class="tbx-field"><span class="tbx-lab">Wallet <b>{{ walletRadius }}px</b></span><input type="range" min="0" max="20" step="2" v-model.number="walletRadius" /></div>
              <div class="tbx-field"><span class="tbx-lab">Icon <b>{{ walletIconRadius }}px</b></span><input type="range" min="0" max="20" step="1" v-model.number="walletIconRadius" /></div>
              <div class="tbx-field"><span class="tbx-lab">Backdrop blur <b>{{ backdropBlur }}px</b></span><input type="range" min="0" max="24" step="2" v-model.number="backdropBlur" /></div>
            </div>
          </div>
        </aside>

        <div class="tbx-preview-col">
          <div class="tbx-devbar">
            <button class="tbx-dev" :class="{ active: device === 'desktop' }" @click="device = 'desktop'">Desktop</button>
            <button class="tbx-dev" :class="{ active: device === 'mobile' }" @click="device = 'mobile'">Mobile</button>
          </div>
          <div class="tbx-stage" :class="device === 'mobile' ? 'is-mobile' : 'is-desktop'">
            <template v-if="device === 'mobile'">
              <div class="tbx-phone"><div class="tbx-phone-screen">
                <div class="tbx-frame"><div ref="btnRef" class="tbx-btnwrap"></div><div ref="modalRef" class="tbx-modalmount"></div></div>
              </div></div>
            </template>
            <template v-else>
              <div class="tbx-frame"><div ref="btnRef" class="tbx-btnwrap"></div><div ref="modalRef" class="tbx-modalmount"></div></div>
            </template>
            <p v-if="failed" class="tbx-note">Could not load the kit bundle. Rebuild <code>@tron-wallet-kit/browser</code> and copy the IIFE into <code>website/public/</code>.</p>
          </div>
        </div>
      </div>

      <div class="tbx-code">
        <div class="tbx-code-hd"><span>Generated config</span><button class="tbx-copy" @click="copy">{{ copied ? "✓ Copied" : "Copy code" }}</button></div>
        <pre><code>{{ codeSnippet }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tbx-root { position: fixed; inset: 0; z-index: 100; overflow-y: auto; background: var(--vp-c-bg); font-family: var(--vp-font-family-base); }
.tbx-topbar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 16px; padding: 0 24px; height: 48px; background: var(--vp-c-bg); border-bottom: 1px solid var(--vp-c-divider); }
.tbx-back { font-size: 13px; font-weight: 500; color: var(--vp-c-brand-1); background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.tbx-back:hover { background: var(--vp-c-brand-soft); }
.tbx-brand { font-size: 13px; font-weight: 600; color: var(--vp-c-text-2); }
.tbx-inner { max-width: 1400px; margin: 0 auto; padding: 28px 24px 80px; }
.tbx-head { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
.tbx-title { font-family: var(--twk-display, "Space Grotesk", ui-sans-serif, system-ui, sans-serif); font-size: 30px; font-weight: 600; letter-spacing: -0.015em; margin: 0 0 4px; }
.tbx-sub { font-size: 14px; color: var(--vp-c-text-2); margin: 0; }
.tbx-presets { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tbx-presets-lab { font-size: 12px; font-weight: 500; color: var(--vp-c-text-3); }
.tbx-preset { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); color: var(--vp-c-text-1); font-size: 13px; cursor: pointer; text-transform: capitalize; }
.tbx-preset.active { background: var(--vp-c-brand-soft); border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }

.tbx-main { display: grid; grid-template-columns: 260px 1fr; gap: 24px; align-items: start; }
@media (max-width: 860px) { .tbx-main { grid-template-columns: 1fr; } }
.tbx-controls { background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 12px; overflow: hidden; position: sticky; top: 64px; max-height: calc(100vh - 96px); overflow-y: auto; }
.tbx-group { border-bottom: 1px solid var(--vp-c-divider); }
.tbx-group:last-child { border-bottom: none; }
.tbx-ghd { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--vp-c-text-1); }
.tbx-arrow { font-size: 12px; color: var(--vp-c-text-3); transition: transform 0.2s; }
.tbx-arrow:not(.open) { transform: rotate(-90deg); }
.tbx-gbd { padding: 0 14px 12px; display: flex; flex-direction: column; gap: 10px; }
.tbx-field { display: flex; flex-direction: column; gap: 5px; }
.tbx-lab { font-size: 12px; font-weight: 500; color: var(--vp-c-text-2); display: flex; justify-content: space-between; }
.tbx-lab b { color: var(--vp-c-brand-1); font-family: var(--vp-font-family-mono); font-weight: 500; letter-spacing: 0; }
.tbx-field select { padding: 4px 8px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); font-size: 12px; }
.tbx-field input[type="range"] { width: 100%; accent-color: var(--vp-c-brand-1); }
.tbx-chips { display: flex; gap: 5px; flex-wrap: wrap; }
.tbx-chip { padding: 3px 9px; border-radius: 6px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); color: var(--vp-c-text-1); font-size: 11px; cursor: pointer; }
.tbx-chip.active { background: var(--vp-c-brand-soft); border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.tbx-swatches { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
.tbx-sw { width: 18px; height: 18px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 0; }
.tbx-sw.active { border-color: var(--vp-c-text-1); }
.tbx-swatches input[type="color"], .tbx-crow input[type="color"] { width: 22px; height: 22px; border: 1px solid var(--vp-c-divider); border-radius: 50%; padding: 1px; background: none; cursor: pointer; }
.tbx-crow { display: flex; align-items: center; gap: 6px; }
.tbx-crow input[type="text"] { flex: 1; min-width: 0; font-family: var(--vp-font-family-mono); font-size: 11px; padding: 3px 6px; border: 1px solid var(--vp-c-divider); border-radius: 5px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.tbx-reset { width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-mute); color: var(--vp-c-text-3); font-size: 9px; cursor: pointer; }

.tbx-preview-col { display: flex; flex-direction: column; gap: 16px; }
.tbx-devbar { display: flex; justify-content: flex-end; gap: 6px; }
.tbx-dev { padding: 5px 14px; border-radius: 8px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); color: var(--vp-c-text-2); font-size: 12px; cursor: pointer; }
.tbx-dev.active { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.tbx-stage { display: flex; justify-content: center; }
.tbx-frame { width: 100%; min-height: 560px; border: 1px solid var(--vp-c-divider); border-radius: 14px; position: relative; background: var(--vp-c-bg-soft); display: flex; flex-direction: column; align-items: center; overflow: hidden; }
.tbx-btnwrap {
  display: flex;
  justify-content: center;
  min-height: 104px;
  padding: 32px 16px 8px;
  position: relative;
  width: 100%;
  z-index: 3;
}
.tbx-btnwrap :deep(.twk-root) {
  align-items: center;
  display: flex;
  justify-content: center;
  position: relative;
}
.tbx-btnwrap :deep(.twk-button-panel) {
  left: 50%;
  margin: 0;
  position: absolute;
  right: auto;
  top: calc(100% + 14px);
  transform: translateX(-50%);
}
.tbx-btnwrap :deep(.twk-button-panel .twk-account-panel[data-twk-account-view="address-qr"] .twk-header),
.tbx-btnwrap :deep(.twk-button-panel .twk-account-panel[data-twk-account-view="tx-history"] .twk-header) {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  min-height: 44px;
  padding: 8px 16px;
}
.tbx-btnwrap :deep(.twk-button-panel .twk-account-panel[data-twk-account-view="address-qr"] .twk-header-main),
.tbx-btnwrap :deep(.twk-button-panel .twk-account-panel[data-twk-account-view="tx-history"] .twk-header-main) {
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
}
.tbx-modalmount { width: 100%; flex: 1 1 auto; position: relative; }
.tbx-note { font-size: 12px; color: var(--vp-c-text-3); text-align: center; }
.tbx-phone { width: 390px; max-width: 100%; background: #4a4a50; border-radius: 44px; padding: 10px; }
.tbx-phone-screen { border-radius: 36px; overflow: hidden; height: 740px; background: var(--vp-c-bg); }
.tbx-phone .tbx-frame { height: 100%; min-height: 0; border: none; border-radius: 0; position: relative; }
.tbx-phone .tbx-frame {
  display: block;
}
.tbx-phone .tbx-btnwrap {
  position: static;
  z-index: 3;
  width: 100%;
  min-height: 124px;
  padding-top: 48px;
  pointer-events: auto;
}
.tbx-phone .tbx-modalmount {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  min-height: 100%;
  pointer-events: none;
}
.tbx-code { margin-top: 28px; border: 1px solid var(--vp-c-divider); border-radius: 12px; overflow: hidden; }
.tbx-code-hd { display: flex; align-items: center; justify-content: space-between; padding: 11px 16px; background: var(--vp-c-bg-mute); font-size: 13px; font-weight: 500; color: var(--vp-c-text-2); }
.tbx-copy { font-size: 12px; padding: 4px 16px; border-radius: 6px; border: 1px solid var(--vp-c-brand-1); background: var(--vp-c-brand-1); color: #fff; cursor: pointer; text-transform: none; letter-spacing: 0; }
.tbx-code pre { margin: 0; padding: 16px; font-size: 12px; overflow-x: auto; background: var(--vp-c-bg-alt); }

/* Contain the real modal (with header/back/close) inline inside the preview frame */
.tbx-modalmount :deep(.twk-overlay) {
  position: relative !important; inset: auto !important; z-index: auto !important;
  background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
  display: flex !important; align-items: flex-start !important; justify-content: center !important;
  min-height: 100% !important; height: auto !important; width: 100% !important; padding: 8px 16px 24px !important;
}
.tbx-modalmount :deep(.twk-modal) { position: relative !important; margin: 0 auto !important; transform: none !important; }

/* Mobile preview: dock every modal/panel to the bottom as a sheet (the SDK's own
   @media(max-width:420px) can't fire here because the viewport, not the phone frame, is wide). */
.tbx-phone .tbx-modalmount :deep(.twk-overlay) {
  position: absolute !important;
  inset: 0 !important;
  align-items: flex-end !important;
  padding: 0 !important;
  min-height: 100% !important;
  height: 100% !important;
  width: 100% !important;
  background: transparent !important;
}
.tbx-phone .tbx-modalmount :deep(.twk-root) {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 100% !important;
}
.tbx-phone .tbx-modalmount :deep(.twk-modal),
.tbx-phone .tbx-modalmount :deep(.twk-account-panel) {
  display: flex !important;
  width: 100% !important;
  max-width: none !important;
  border-radius: var(--twk-radius, 16px) var(--twk-radius, 16px) 0 0 !important;
  border-bottom: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
  transform: none !important;
}
.tbx-phone .tbx-modalmount :deep(.twk-root),
.tbx-phone .tbx-modalmount :deep(.twk-overlay),
.tbx-phone .tbx-modalmount :deep(.twk-modal) {
  pointer-events: auto;
}
.tbx-phone .tbx-btnwrap :deep(.twk-root) {
  position: static;
}
.tbx-phone .tbx-btnwrap :deep(.twk-button-panel) {
  bottom: 0;
  left: 0;
  margin: 0;
  position: absolute;
  right: 0;
  top: auto;
  transform: none;
  width: 100%;
  z-index: 4;
}
.tbx-phone .tbx-btnwrap :deep(.twk-button-panel .twk-account-panel) {
  width: 100%;
  max-width: none;
  border-bottom: 0;
  border-left: 0;
  border-right: 0;
  border-radius: var(--twk-radius, 16px) var(--twk-radius, 16px) 0 0;
  box-shadow: 0 -18px 42px rgba(15, 23, 42, 0.16);
}
</style>
