<script setup lang="ts">
import { ref } from "vue";
import { withBase } from "vitepress";
import { version } from "../../../package.json";

const installCmd = "npm i @tron-wallet-kit/react";
const copied = ref(false);

function copyInstall() {
  try {
    navigator.clipboard?.writeText(installCmd);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1400);
  } catch {
    /* clipboard unavailable */
  }
}

const features = [
  { n: "01", title: "Beautiful by default", body: "A polished connect modal and account panel that look great with zero configuration." },
  { n: "02", title: "Three-line integration", body: "getDefaultConfig, TronKitProvider, TronConnectButton — wrap your app and drop the button." },
  { n: "03", title: "React hooks", body: "useTronAccount, useTronConnect, useTronBalance, useTrxName — build any custom UI you want." },
  { n: "04", title: "Themeable", body: "Light, dark, and custom themes via lightTheme / darkTheme and CSS token overrides." },
  { n: "05", title: ".trx identity", body: "Resolves TRON domain names and avatars for a friendlier account experience." },
  { n: "06", title: "WalletConnect built in", body: "Mobile QR flow, loaded only when needed — TronLink, OKX, Bitget, Klever, and more." },
];
</script>

<template>
  <div class="hl">
    <section class="hl-hero">
      <div class="hl-copy">
        <div class="hl-eyebrow"><span class="hl-dot"></span> TRON-native wallet UX · v{{ version }}</div>
        <h1 class="hl-title">Connect a TRON wallet in <span class="hl-mark">three lines.</span></h1>
        <p class="hl-lede">
          A product-grade wallet experience for TRON dApps — connect, sign, and transact.
          ConnectKit-class polish, TRON-native. You ship the app, not the wallet plumbing.
        </p>

        <div class="hl-cta">
          <a class="hl-btn hl-btn-primary" :href="withBase('/docs/quick-start')">Get started</a>
          <a class="hl-btn" :href="withBase('/docs/playground')">Live playground</a>
          <a class="hl-btn hl-btn-ghost" :href="withBase('/docs/introduction')">Introduction <span aria-hidden="true">→</span></a>
        </div>

        <button class="hl-install" @click="copyInstall" :aria-label="'Copy: ' + installCmd">
          <span class="hl-prompt">$</span>
          <span class="hl-cmd">{{ installCmd }}</span>
          <span class="hl-copy">{{ copied ? "copied" : "copy" }}</span>
        </button>
      </div>

      <div class="hl-proof" aria-hidden="false">
        <div class="hl-window">
          <div class="hl-winbar">
            <span class="hl-file">App.tsx</span>
          </div>
<pre class="hl-code"><code><span class="k">import</span> { getDefaultConfig, TronKitProvider, TronConnectButton } <span class="k">from</span> <span class="s">"@tron-wallet-kit/react"</span>;

<span class="c">// one config, sensible defaults</span>
<span class="k">const</span> config = <span class="fn">getDefaultConfig</span>({ metadata: { name: <span class="s">"My TRON dApp"</span> } });

<span class="k">export function</span> <span class="fn">App</span>() {
  <span class="k">return</span> (
    &lt;<span class="t">TronKitProvider</span> config={config}&gt;
      &lt;<span class="t">TronConnectButton</span> /&gt;
    &lt;/<span class="t">TronKitProvider</span>&gt;
  );
}</code></pre>
        </div>
      </div>
    </section>

    <div class="hl-rule"></div>

    <section class="hl-features">
      <div class="hl-features-head">
        <h2 class="hl-h2">Everything the drop-in kit gives you</h2>
        <p class="hl-sub">Sits on top of the TRON wallet ecosystem — and <code>tronweb3/tronwallet-adapter</code> for hardware and MetaMask.</p>
      </div>
      <ul class="hl-grid">
        <li v-for="f in features" :key="f.n" class="hl-feat">
          <span class="hl-num">{{ f.n }}</span>
          <div>
            <h3 class="hl-feat-title">{{ f.title }}</h3>
            <p class="hl-feat-body">{{ f.body }}</p>
          </div>
        </li>
      </ul>
    </section>

    <section class="hl-band">
      <div>
        <h2 class="hl-band-title">Drop it into your dApp today</h2>
        <p class="hl-band-sub">Three lines to a connect flow that looks like you built it.</p>
      </div>
      <div class="hl-band-cta">
        <a class="hl-btn hl-btn-primary" :href="withBase('/docs/quick-start')">Read the quick start</a>
        <a class="hl-btn" :href="withBase('/docs/theme-builder')">Open the theme builder</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hl {
  --hl-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px 72px;
}

/* ── Hero: asymmetric, left-biased ── */
.hl-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 48px;
  align-items: center;
  padding: 72px 0 56px;
}
.hl-copy, .hl-proof { min-width: 0; }
.hl-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px; color: var(--vp-c-text-2); margin-bottom: 22px;
}
.hl-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--vp-c-brand-1); }
.hl-title {
  font-family: var(--hl-display);
  font-weight: 600;
  font-size: 60px;
  line-height: 1.02;
  letter-spacing: -0.02em;
  margin: 0 0 24px;
  color: var(--vp-c-text-1);
}
.hl-mark {
  color: var(--vp-c-brand-1);
  box-shadow: inset 0 -0.12em 0 var(--vp-c-brand-soft);
}
.hl-lede {
  font-size: 18px; line-height: 1.6; color: var(--vp-c-text-2);
  max-width: 30em; margin: 0 0 30px;
}
.hl-cta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 26px; }
.hl-btn {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 15px; font-weight: 500;
  padding: 11px 20px; border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1); background: var(--vp-c-bg);
  transition: border-color .18s cubic-bezier(.25,1,.5,1), transform .18s cubic-bezier(.25,1,.5,1);
  text-decoration: none;
}
.hl-btn:hover { border-color: var(--vp-c-brand-1); transform: translateY(-1px); }
.hl-btn-primary {
  background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1);
  color: #fff;
}
.hl-btn-primary:hover { background: var(--vp-c-brand-2); border-color: var(--vp-c-brand-2); }
.hl-btn-ghost { border-color: transparent; padding-left: 8px; padding-right: 8px; color: var(--vp-c-text-2); }
.hl-btn-ghost:hover { border-color: transparent; color: var(--vp-c-brand-1); }

.hl-install {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--vp-font-family-mono); font-size: 13.5px;
  padding: 9px 14px; border-radius: 10px;
  border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1); cursor: pointer;
}
.hl-install:hover { border-color: var(--vp-c-brand-1); }
.hl-prompt { color: var(--vp-c-brand-1); }
.hl-cmd { color: var(--vp-c-text-1); }
.hl-copy { margin-left: 4px; font-size: 12px; color: var(--vp-c-text-3); text-transform: none; }

/* ── Proof: code window ── */
.hl-window {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px; overflow: hidden;
  background: #0d0f14;
  max-width: 100%;
}
.hl-winbar {
  display: flex; align-items: center;
  padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,.08);
}
.hl-file { font-family: var(--vp-font-family-mono); font-size: 12.5px; color: #9aa0aa; }
.hl-code {
  margin: 0; padding: 18px 18px 20px; overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px; line-height: 1.7; color: #e6e6e9;
  background: transparent;
}
.hl-code .k { color: #ff7e8b; }
.hl-code .s { color: #7fe7c4; }
.hl-code .fn { color: #ffb454; }
.hl-code .t { color: #82aaff; }
.hl-code .c { color: #6b7280; }

/* ── Rule (bias element) ── */
.hl-rule { height: 2px; width: 64px; background: var(--vp-c-brand-1); margin: 8px 0 56px; }

/* ── Features: typographic, numbered, not icon tiles ── */
.hl-features-head { max-width: 46em; margin-bottom: 36px; }
.hl-h2 {
  font-family: var(--hl-display); font-weight: 600;
  font-size: 32px; line-height: 1.1; letter-spacing: -0.01em;
  margin: 0 0 10px; color: var(--vp-c-text-1);
}
.hl-sub { font-size: 16px; color: var(--vp-c-text-2); margin: 0; }
.hl-sub code, .hl-band code { font-size: 0.9em; }
.hl-grid {
  list-style: none; padding: 0; margin: 0;
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 4px 48px;
}
.hl-feat {
  display: flex; gap: 18px;
  padding: 24px 0;
  border-top: 1px solid var(--vp-c-divider);
}
.hl-num {
  font-family: var(--hl-display); font-weight: 500;
  font-size: 15px; color: var(--vp-c-brand-1);
  padding-top: 3px; min-width: 24px;
}
.hl-feat-title { font-size: 17px; font-weight: 600; margin: 0 0 6px; color: var(--vp-c-text-1); }
.hl-feat-body { font-size: 14.5px; line-height: 1.55; color: var(--vp-c-text-2); margin: 0; }

/* ── Bottom band ── */
.hl-band {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 20px;
  margin-top: 64px; padding: 36px 40px;
  border: 1px solid var(--vp-c-divider); border-radius: 16px;
  background: var(--vp-c-bg-soft);
}
.hl-band-title { font-family: var(--hl-display); font-weight: 600; font-size: 26px; margin: 0 0 6px; color: var(--vp-c-text-1); }
.hl-band-sub { font-size: 15px; color: var(--vp-c-text-2); margin: 0; }
.hl-band-cta { display: flex; flex-wrap: wrap; gap: 12px; }

@media (max-width: 860px) {
  .hl-hero { grid-template-columns: 1fr; gap: 36px; padding: 48px 0 40px; }
  .hl-title { font-size: 44px; }
  .hl-grid { grid-template-columns: 1fr; gap: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .hl-btn { transition: none; }
}
</style>
