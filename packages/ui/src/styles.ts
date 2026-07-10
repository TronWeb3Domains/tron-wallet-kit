export function createWalletKitStyles(selector = ".twk-root"): string {
  return `${selector} {
  box-sizing: border-box;
  color: var(--twk-text);
  color-scheme: var(--twk-color-scheme);
  font-family: var(--twk-font-family);
  position: relative;
}
${selector} *, ${selector} *::before, ${selector} *::after { box-sizing: inherit; }
${selector} .twk-sr-only {
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
${selector} .twk-overlay {
  align-items: center;
  backdrop-filter: blur(var(--twk-backdrop-blur));
  background: var(--twk-backdrop);
  display: flex;
  inset: 0;
  justify-content: center;
  min-height: 100dvh;
  padding: 16px;
  position: fixed;
  z-index: 2147483000;
}
${selector} .twk-modal, ${selector} .twk-account-panel {
  background: var(--twk-surface);
  border: 1px solid var(--twk-border);
  border-radius: var(--twk-radius);
  box-shadow: var(--twk-shadow);
  color: var(--twk-text);
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  min-height: 0;
  overflow: hidden;
  width: min(400px, calc(100vw - 32px));
}
${selector} .twk-modal:focus, ${selector} .twk-inline:focus {
  outline: none;
}
${selector} .twk-inline {
  background: var(--twk-surface);
  border: 1px solid var(--twk-border);
  border-radius: var(--twk-radius);
  color: var(--twk-text);
  overflow: hidden;
  width: min(400px, 100%);
}
${selector} .twk-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  padding: 8px 20px 12px;
}
${selector} .twk-body[data-twk-entering="true"] { animation: twk-view-in .24s cubic-bezier(.25, 1, .5, 1); }
@keyframes twk-view-in { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { ${selector} .twk-body[data-twk-entering="true"] { animation: none; } }
${selector} .twk-header, ${selector} .twk-section { padding: 16px; }
${selector} .twk-header {
  align-items: center;
  border-bottom: 0;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  min-height: 44px;
  padding: 8px 16px;
  position: relative;
}
${selector} .twk-header-main {
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
}
${selector} .twk-title { font-size: 16px; font-weight: 500; line-height: 1.25; margin: 0; }
${selector} .twk-title[data-tone="danger"] { color: var(--twk-danger); font-weight: 600; }
${selector} .twk-subtitle, ${selector} .twk-muted {
  color: var(--twk-text-muted);
  font-size: 13px;
  line-height: 1.45;
  margin: 4px 0 0;
}
${selector} .twk-close, ${selector} .twk-back, ${selector} .twk-action, ${selector} .twk-address-qr-action, ${selector} .twk-tx-header-link, ${selector} .twk-wallet-row, ${selector} .twk-wallet-card, ${selector} .twk-connect-button, ${selector} .twk-search-trigger {
  align-items: center;
  appearance: none;
  background: var(--twk-surface-elevated);
  border: 1px solid var(--twk-border);
  border-radius: var(--twk-wallet-radius);
  box-shadow: none;
  color: var(--twk-text);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  line-height: 1;
  margin: 0;
  min-height: 44px;
  outline: none;
  overflow: hidden;
  touch-action: manipulation;
  transform: none;
  transition: background-color .16s ease, border-color .16s ease, color .16s ease, opacity .16s ease;
  -webkit-tap-highlight-color: transparent;
}
${selector} .twk-close, ${selector} .twk-back {
  background: transparent;
  border-color: transparent;
  border-radius: 999px;
  color: var(--twk-text-muted);
  flex: 0 0 40px;
  height: 40px;
  justify-content: center;
  min-height: 40px;
  padding: 0;
  width: 40px;
}
${selector} .twk-back[data-hidden="true"] { opacity: 0; pointer-events: none; }
${selector} .twk-action {
  background: var(--twk-surface-muted);
  border-color: color-mix(in srgb, var(--twk-border) 60%, transparent);
  font-size: 14px;
  font-weight: 560;
  gap: 8px;
  justify-content: center;
  min-height: 48px;
  padding: 0 14px;
  text-decoration: none;
}
${selector} .twk-action:disabled { cursor: not-allowed; opacity: 0.58; }
${selector} .twk-action[data-busy="true"] { cursor: wait; opacity: 1; }
${selector} .twk-action-icon {
  align-items: center;
  color: currentColor;
  display: inline-flex;
  flex: 0 0 17px;
  height: 17px;
  justify-content: center;
  opacity: 0.58;
  width: 17px;
}
${selector} .twk-action-icon svg {
  display: block;
  height: 16px;
  width: 16px;
}
${selector} .twk-action-icon[data-state="success"] {
  animation: twk-pop .2s cubic-bezier(.25, 1, .5, 1);
  color: var(--twk-success);
  opacity: 1;
}
@keyframes twk-pop {
  0% { transform: scale(.5) rotate(-14deg); }
  60% { transform: scale(1.14) rotate(5deg); }
  100% { transform: scale(1) rotate(0); }
}
${selector} .twk-action-icon[data-state="busy"] { opacity: 1; }
${selector} .twk-action-label {
  color: currentColor;
  display: inline-block;
  line-height: 1.28;
  min-width: 0;
  overflow: hidden;
  padding-block: 1px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${selector} .twk-action-spin {
  animation: twk-spin .9s linear infinite;
  border: 2px solid var(--twk-spinner-trail);
  border-radius: 999px;
  border-top-color: currentColor;
  display: block;
  height: 16px;
  width: 16px;
}
${selector} .twk-close:hover, ${selector} .twk-back:hover, ${selector} .twk-action:hover, ${selector} .twk-address-qr-action:hover, ${selector} .twk-tx-header-link:hover, ${selector} .twk-wallet-row:hover, ${selector} .twk-wallet-card:hover, ${selector} .twk-connect-button:hover, ${selector} .twk-search-trigger:hover {
  background: var(--twk-surface-hover);
}
${selector} .twk-close:focus-visible, ${selector} .twk-back:focus-visible, ${selector} .twk-action:focus-visible, ${selector} .twk-address-qr-action:focus-visible, ${selector} .twk-tx-header-link:focus-visible, ${selector} .twk-wallet-row:focus-visible, ${selector} .twk-wallet-card:focus-visible, ${selector} .twk-search-trigger:focus-visible, ${selector} .twk-wallet-search-input:focus-visible, ${selector} .twk-connect-button:focus-visible, ${selector} .twk-toast-link:focus-visible, ${selector} .twk-toast-dismiss:focus-visible {
  outline: 2px solid var(--twk-focus-ring);
  outline-offset: 2px;
}
${selector} .twk-primary {
  background: var(--twk-accent);
  border-color: var(--twk-accent);
  color: var(--twk-accent-text);
}
${selector} .twk-primary:hover {
  background: var(--twk-accent);
  border-color: var(--twk-accent);
}
${selector} .twk-primary .twk-action-icon { opacity: 0.78; }
${selector} .twk-connect-button {
  background: var(--twk-surface);
  border-color: var(--twk-border);
  gap: 8px;
  justify-content: center;
  max-width: 100%;
  min-height: 46px;
  padding: 0 12px 0 10px;
  white-space: nowrap;
}
${selector} .twk-connect-button[data-size="sm"] { min-height: 44px; }
${selector} .twk-connect-button[data-size="lg"] { min-height: 50px; padding-left: 12px; padding-right: 14px; }
${selector} .twk-connect-button[data-variant="pill"] { border-radius: 999px; }
${selector} .twk-connect-button[data-variant="minimal"] {
  background: transparent;
  border-color: transparent;
}
${selector} .twk-connect-button[data-status="connecting"] { cursor: wait; opacity: 0.72; }
${selector} .twk-button-icon-wrap {
  display: inline-flex;
  flex: 0 0 auto;
  position: relative;
}
${selector} .twk-button-icon {
  align-items: center;
  background: var(--twk-fallback-icon-background);
  border: 0;
  border-radius: var(--twk-wallet-icon-radius);
  color: var(--twk-fallback-icon-color);
  display: inline-flex;
  font-size: 13px;
  font-weight: 700;
  height: 28px;
  justify-content: center;
  overflow: hidden;
  width: 28px;
}
${selector} .twk-button-icon img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}
${selector} .twk-button-icon-generic {
  background: transparent;
  color: var(--twk-text-muted);
}
${selector} .twk-button-icon-generic svg { height: 18px; width: 18px; }
${selector} .twk-button-label {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.28;
  max-width: 220px;
  min-width: 0;
  overflow: hidden;
  padding-block: 1px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${selector} .twk-button-balance {
  color: var(--twk-text-muted);
  font-size: 12px;
  line-height: 1.25;
}
${selector} .twk-skeleton-name {
  border-radius: 999px;
  height: 24px;
  max-width: 132px;
  min-width: 96px;
  width: min(132px, 34vw);
}
${selector} .twk-skeleton-balance {
  border-radius: 999px;
  height: 18px;
  min-width: 80px;
  width: 80px;
}
${selector} .twk-button-chevron {
  align-items: center;
  background: var(--twk-surface-muted);
  border-radius: 999px;
  color: var(--twk-text-muted);
  display: inline-flex;
  height: 26px;
  justify-content: center;
  width: 26px;
}
${selector} .twk-button-pending {
  background: var(--twk-accent);
  border: 2px solid var(--twk-surface);
  border-radius: 999px;
  height: 9px;
  position: absolute;
  right: -2px;
  top: -2px;
  width: 9px;
}
${selector} .twk-button-panel {
  min-width: min(360px, calc(100vw - 32px));
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 2147482999;
}
${selector} .twk-button-panel .twk-account-panel {
  box-shadow: none;
  min-height: 0;
  width: min(360px, calc(100vw - 32px));
}
${selector} .twk-button-panel[data-twk-account-panel-mode="dropdown"] .twk-header {
  display: none;
}
${selector} .twk-button-panel-overlay {
  align-items: center;
  background: var(--twk-backdrop);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 16px;
  position: fixed;
  z-index: 2147483000;
}
${selector} .twk-button-panel-overlay .twk-account-panel {
  height: auto;
  max-height: min(560px, calc(100dvh - 48px));
  width: min(400px, calc(100vw - 32px));
}
${selector} .twk-button-panel-overlay .twk-account-panel[data-has-recent="true"] {
  height: min(650px, calc(100dvh - 48px));
}
${selector} .twk-wallet-row, ${selector} .twk-wallet-card {
  border-color: color-mix(in srgb, var(--twk-border) 72%, transparent);
}
${selector} .twk-wallet-row {
  gap: 8px;
  justify-content: space-between;
  min-height: 56px;
  padding: 0 12px;
  text-align: left;
  width: 100%;
}
${selector} .twk-wallet-row:disabled { cursor: not-allowed; opacity: 0.68; }
${selector} .twk-wallet-icon-wrap {
  display: inline-flex;
  position: relative;
}
${selector} .twk-wallet-status {
  align-items: center;
  background: var(--twk-surface);
  border: 1.5px solid var(--twk-surface);
  border-radius: 999px;
  bottom: -4px;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--twk-text) 16%, transparent);
  display: inline-flex;
  height: 18px;
  justify-content: center;
  position: absolute;
  right: -5px;
  width: 18px;
}
${selector} .twk-wallet-status[data-status="installed"]::before {
  background: var(--twk-success);
  border-radius: 999px;
  content: "";
  display: block;
  height: 8px;
  width: 8px;
}
${selector} .twk-wallet-status[data-status="qr"] {
  color: var(--twk-badge-qr-fg);
}
${selector} .twk-wallet-status[data-status="qr"] svg {
  height: 12px;
  width: 12px;
}
${selector} .twk-wallet-status[data-status="connecting"] {
  background: var(--twk-surface);
  color: var(--twk-accent);
}
${selector} .twk-wallet-status[data-status="connecting"] .twk-action-spin {
  height: 10px;
  width: 10px;
}
${selector} .twk-wallet-status[data-status="error"] {
  background: var(--twk-danger);
  color: var(--twk-surface);
}
${selector} .twk-wallet-status[data-status="error"] svg {
  height: 8px;
  width: 8px;
}
${selector} .twk-search-trigger {
  background: color-mix(in srgb, var(--twk-surface-muted) 72%, transparent);
  border-color: transparent;
  border-radius: calc(var(--twk-wallet-radius) + 2px);
  box-shadow: none;
  gap: 12px;
  justify-content: space-between;
  margin-top: 10px;
  min-height: 64px;
  padding: 0 16px;
  width: 100%;
}
${selector} .twk-search-trigger:hover {
  background: color-mix(in srgb, var(--twk-surface-muted) 88%, var(--twk-surface-hover));
}
${selector} .twk-search-label {
  align-items: center;
  display: flex;
  gap: 10px;
  min-width: 0;
}
${selector} .twk-search-icon {
  align-items: center;
  background: color-mix(in srgb, var(--twk-surface-elevated) 72%, transparent);
  border-radius: 6px;
  color: var(--twk-text-muted);
  display: inline-flex;
  flex: 0 0 32px;
  height: 32px;
  justify-content: center;
  opacity: 0.72;
  width: 32px;
}
${selector} .twk-search-trigger .twk-wallet-name {
  color: var(--twk-text-muted);
  font-size: 16px;
  font-weight: 400;
}
${selector} .twk-search-trigger .twk-badge {
  background: color-mix(in srgb, var(--twk-surface-elevated) 64%, transparent);
  color: color-mix(in srgb, var(--twk-text-muted) 70%, transparent);
  flex: 0 0 auto;
  min-width: 0;
  padding: 2px 10px;
}
${selector} .twk-wallet-main { align-items: center; display: flex; gap: 10px; min-width: 0; }
${selector} .twk-wallet-icon {
  align-items: center;
  background: var(--twk-fallback-icon-background);
  border: 0;
  border-radius: var(--twk-wallet-icon-radius);
  color: var(--twk-fallback-icon-color);
  display: flex;
  flex: 0 0 32px;
  height: 32px;
  justify-content: center;
  overflow: hidden;
  width: 32px;
}
${selector} .twk-wallet-icon img { display: block; height: 100%; object-fit: cover; width: 100%; }
${selector} .twk-wallet-icon:has(img),
${selector} .twk-wallet-icon-large:has(img) { background: transparent; }
${selector} .twk-wallet-icon:has(img) .twk-wallet-icon-fallback,
${selector} .twk-wallet-icon-large:has(img) .twk-wallet-icon-fallback { display: none; }
${selector} .twk-wallet-icon[data-loading="true"] {
  color: transparent;
}
${selector} .twk-skeleton {
  animation: twk-skeleton-pulse 1.4s ease-in-out infinite;
  background: linear-gradient(90deg, var(--twk-surface-muted) 25%, var(--twk-surface-hover) 50%, var(--twk-surface-muted) 75%);
  background-size: 200% 100%;
  border-radius: inherit;
  display: block;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
}
@keyframes twk-skeleton-pulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
${selector} .twk-skeleton::after {
  animation: twk-skeleton-shimmer 1.2s ease-in-out infinite;
  background: linear-gradient(90deg, transparent, var(--twk-surface-hover), transparent);
  content: "";
  inset: 0;
  position: absolute;
  transform: translateX(-100%);
}
${selector} .twk-wallet-name, ${selector} .twk-address {
  line-height: 1.28;
  overflow: hidden;
  padding-block: 1px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${selector} .twk-wallet-name[data-loading="true"] {
  border-radius: 999px;
  display: inline-flex;
  height: 14px;
  min-width: 92px;
  width: min(120px, 32vw);
}
${selector} .twk-footer {
  color: var(--twk-text-muted);
  font-size: 11px;
  min-height: 0;
  padding: 8px 16px 10px;
  text-align: center;
}
${selector} .twk-all-wallets {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
${selector} .twk-search-field {
  align-items: center;
  background: var(--twk-surface-elevated);
  border: 1px solid var(--twk-border);
  border-radius: var(--twk-wallet-radius);
  display: flex;
  gap: 8px;
  height: 46px;
  margin: 0 0 14px;
  padding: 0 12px 0 14px;
  width: 100%;
}
${selector} .twk-wallet-search-input {
  background: transparent;
  border: 0;
  border-radius: 0;
  color: var(--twk-text);
  flex: 1 1 auto;
  font: inherit;
  height: 100%;
  min-width: 0;
  outline: none;
  padding: 0;
}
${selector} .twk-wallet-search-input::placeholder { color: var(--twk-text-muted); }
${selector} .twk-wallet-search-input:focus,
${selector} .twk-wallet-search-input:focus-visible {
  outline: none;
}
${selector} .twk-search-field .twk-search-icon {
  background: transparent;
  border-radius: 0;
  flex-basis: 22px;
  height: 22px;
  opacity: 0.78;
  order: 2;
  width: 22px;
}
${selector} .twk-search-field .twk-search-icon svg {
  height: 18px;
  width: 18px;
}
${selector} .twk-wallet-grid {
  align-content: start;
  display: grid;
  gap: 10px;
  grid-auto-rows: max-content;
  height: 360px;
  margin: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 2px 14px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
${selector} .twk-wallet-grid[data-layout="list"] {
  grid-template-columns: 1fr;
}
${selector} .twk-wallet-grid[data-layout="card"] {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
${selector} .twk-wallet-grid[data-scope="featured"] {
  height: auto;
  max-height: min(360px, 52vh);
}
${selector} .twk-wallet-grid[data-scope="featured"][data-overflow="bottom"] {
  mask-image: linear-gradient(to bottom, black calc(100% - 28px), transparent);
}
${selector} .twk-wallet-grid[data-scope="featured"][data-overflow="top"] {
  mask-image: linear-gradient(to bottom, transparent, black 28px);
}
${selector} .twk-wallet-grid[data-scope="featured"][data-overflow="both"] {
  mask-image: linear-gradient(to bottom, transparent, black 28px, black calc(100% - 28px), transparent);
}
${selector} .twk-wallet-grid::-webkit-scrollbar { display: none; height: 0; width: 0; }
${selector} .twk-wallet-card {
  align-content: center;
  display: grid;
  gap: 8px;
  height: 116px;
  justify-items: center;
  min-height: 116px;
  padding: 10px 8px;
  text-align: center;
}
${selector} .twk-wallet-card[data-loading="true"] {
  opacity: 1;
}
${selector} .twk-wallet-card[data-loading="true"] .twk-wallet-icon,
${selector} .twk-wallet-card[data-loading="true"] .twk-wallet-name {
  justify-self: center;
}
${selector} .twk-wallet-card[data-loading="true"] .twk-wallet-name {
  min-width: 78px;
  width: 78px;
}
${selector} .twk-wallet-card[data-loading="true"] .twk-wallet-icon {
  flex-basis: 56px;
  height: 56px;
  width: 56px;
}
${selector} .twk-wallet-card:disabled { cursor: not-allowed; opacity: 0.64; }
${selector} .twk-wallet-card:disabled[data-loading="true"] { opacity: 1; }
${selector} .twk-wallet-card .twk-wallet-icon {
  flex-basis: 56px;
  height: 56px;
  width: 56px;
}
${selector} .twk-wallet-card .twk-wallet-name {
  font-size: 13px;
  max-width: 100%;
}
${selector} .twk-network-badge {
  align-items: center;
  align-self: flex-start;
  background: var(--twk-surface-muted);
  border: 1px solid var(--twk-border);
  border-radius: 999px;
  color: var(--twk-text-muted);
  display: inline-flex;
  font-size: 11px;
  font-weight: 650;
  gap: 6px;
  line-height: 1.28;
  margin: 0 0 8px;
  min-height: 28px;
  padding: 1px 10px;
  text-transform: uppercase;
}
${selector} .twk-network-badge[data-tone="mainnet"] {
  background: var(--twk-badge-qr-bg);
  color: var(--twk-badge-qr-fg);
}
${selector} .twk-network-badge[data-tone="testnet"] {
  background: var(--twk-badge-muted-bg);
  color: var(--twk-badge-muted-fg);
}
${selector} .twk-no-wallets {
  align-items: center;
  color: var(--twk-text-muted);
  display: flex;
  font-size: 13px;
  justify-content: center;
  height: 360px;
  text-align: center;
}
${selector} .twk-connect-detail {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 0;
  padding: 6px 0 0;
  text-align: center;
  width: 100%;
}
${selector} .twk-connect-detail .twk-title { line-height: 1.4; }
${selector} .twk-wallet-icon-large {
  align-items: center;
  background: var(--twk-fallback-icon-background);
  border: 0;
  border-radius: var(--twk-wallet-icon-radius);
  color: var(--twk-fallback-icon-color);
  display: flex;
  font-size: 30px;
  height: 66px;
  justify-content: center;
  overflow: hidden;
  width: 66px;
}
${selector} .twk-wallet-icon-large img { display: block; height: 100%; object-fit: cover; width: 100%; }
${selector} .twk-connecting-icon-wrap {
  align-items: center;
  display: inline-flex;
  height: 110px;
  justify-content: center;
  margin-bottom: 16px;
  position: relative;
  width: 110px;
}
${selector} .twk-connecting-ring {
  height: 110px;
  position: absolute;
  width: 110px;
}
${selector} .twk-connecting-ring-svg {
  display: block;
  height: 110px;
  overflow: visible;
  width: 110px;
}
${selector} .twk-connecting-ring-accent {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3.5;
}
${selector} .twk-connecting-ring-accent {
  animation: twk-connecting-dash 1.1s linear infinite;
  stroke: var(--twk-accent);
  stroke-dasharray: 78 162;
  stroke-dashoffset: 0;
}
${selector} .twk-connecting-error-dot {
  align-items: center;
  background: var(--twk-danger);
  border: 2px solid var(--twk-surface);
  border-radius: 999px;
  color: var(--twk-accent-text);
  display: inline-flex;
  height: 22px;
  justify-content: center;
  position: absolute;
  right: 13px;
  top: 74px;
  width: 22px;
}
${selector} .twk-detail-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
  margin: 0;
}
${selector} .twk-detail-title[data-tone="danger"] { color: var(--twk-danger); font-weight: 600; }
${selector} .twk-detail-subtitle {
  color: var(--twk-text-muted);
  font-size: 14px;
  line-height: 1.5;
  margin: 8px 0 0;
  max-width: min(100%, 360px);
  overflow-wrap: anywhere;
  word-break: normal;
}
${selector} .twk-qr-slot + .twk-detail-subtitle {
  margin-top: 14px;
}
${selector} .twk-detail-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 16px;
}
${selector} .twk-install-row {
  align-items: center;
  background: color-mix(in srgb, var(--twk-surface-muted) 72%, transparent);
  border-radius: calc(var(--twk-wallet-radius) - 4px);
  color: var(--twk-text-muted);
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-top: 18px;
  min-height: 48px;
  padding: 0 8px 0 14px;
  width: 100%;
}
${selector} .twk-install-row > span {
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${selector} .twk-install-action {
  border-radius: 14px;
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0 12px;
}
${selector} .twk-install-action svg {
  height: 14px;
  width: 14px;
}
${selector} .twk-link {
  color: var(--twk-accent);
  font-size: 14px;
  font-weight: 560;
  text-decoration: none;
}
${selector} .twk-link:hover, ${selector} .twk-link:focus, ${selector} .twk-toast-link:hover, ${selector} .twk-toast-link:focus { text-decoration: none; }
${selector} .twk-qr-slot.twk-qr-large {
  background: var(--twk-qr-background);
  border: 1px solid color-mix(in srgb, var(--twk-border) 70%, transparent);
  border-radius: 8px;
  box-shadow: none;
  box-sizing: border-box;
  height: min(76vw, 340px);
  margin: 0 auto;
  max-width: 340px;
  overflow: hidden;
  padding: 0;
  position: relative;
  width: min(100%, 340px);
}
${selector} .twk-qr-code {
  align-items: center;
  aspect-ratio: 1 / 1;
  background: transparent;
  border-radius: 0;
  display: flex;
  height: 100%;
  justify-content: center;
  margin: 0 auto;
  max-width: 100%;
  overflow: hidden;
  padding: 0;
  width: 100%;
}
${selector} .twk-qr-code > img {
  aspect-ratio: 1 / 1;
  height: auto;
  object-fit: contain;
  width: 100%;
}
${selector} .twk-qr-code svg, ${selector} .twk-qr-code canvas {
  display: block;
  height: 100%;
  width: 100%;
}
${selector} .twk-qr-code[data-twk-qr-renderer="error"] {
  background: color-mix(in srgb, var(--twk-danger) 7%, var(--twk-qr-background));
  border: 1px dashed color-mix(in srgb, var(--twk-danger) 58%, var(--twk-border));
  border-radius: var(--twk-wallet-radius);
  color: var(--twk-danger);
  min-height: min(76vw, 304px);
  padding: 18px;
}
${selector} .twk-qr-error {
  color: var(--twk-danger);
  display: block;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  max-width: 180px;
  text-align: center;
}
${selector} .twk-qr-skeleton {
  background: color-mix(in srgb, var(--twk-qr-foreground) 8%, var(--twk-qr-background));
  border-radius: 8px;
  display: block;
  height: 100%;
  max-height: none;
  max-width: none;
  overflow: hidden;
  position: relative;
  width: 100%;
}
${selector} .twk-qr-skeleton::after {
  animation: twk-skeleton-shimmer 1.2s ease-in-out infinite;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--twk-qr-foreground) 12%, transparent), transparent);
  content: "";
  inset: 0;
  position: absolute;
  transform: translateX(-100%);
}
${selector} .twk-qr-center-logo {
  align-items: center;
  background: var(--twk-surface);
  border: 1px solid var(--twk-border);
  border-radius: var(--twk-wallet-icon-radius);
  display: flex;
  height: 56px;
  justify-content: center;
  left: 50%;
  overflow: hidden;
  padding: 7px;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 56px;
}
${selector} .twk-qr-center-logo .twk-wallet-icon {
  border: 0;
  flex-basis: 42px;
  height: 42px;
  width: 42px;
}
${selector} .twk-qr-uri {
  color: var(--twk-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.35;
  margin-top: 8px;
  max-width: 100%;
  overflow-wrap: anywhere;
}
${selector} .twk-pill {
  background: var(--twk-surface-muted);
  border: 1px solid var(--twk-border);
  border-radius: 999px;
  color: var(--twk-text-muted);
  flex: 0 0 auto;
  font-size: 12px;
  line-height: 1.28;
  padding: 7px 9px;
}
${selector} .twk-badge {
  background: var(--twk-badge-muted-bg);
  border: 0;
  border-radius: 4px;
  color: var(--twk-badge-muted-fg);
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.28;
  min-height: 18px;
  min-width: 68px;
  padding: 3px 6px 4px;
  text-align: center;
  text-transform: uppercase;
}
${selector} .twk-badge[data-loading="true"] {
  align-items: center;
  display: inline-flex;
}
${selector} .twk-badge[data-tone="installed"] {
  background: var(--twk-badge-installed-bg);
  color: var(--twk-badge-installed-fg);
}
${selector} .twk-badge[data-tone="qr"], ${selector} .twk-badge[data-tone="tron"] {
  background: var(--twk-badge-qr-bg);
  color: var(--twk-badge-qr-fg);
}
${selector} .twk-badge[data-tone="recent"] {
  background: var(--twk-badge-recent-bg);
  color: var(--twk-badge-recent-fg);
}
${selector} .twk-status {
  align-items: center;
  color: var(--twk-text-muted);
  display: flex;
  font-size: 13px;
  line-height: 1.35;
  min-height: 32px;
  overflow-wrap: anywhere;
  padding: 8px 0 0;
}
${selector} .twk-status[data-tone="danger"] {
  color: var(--twk-danger);
}
${selector} .twk-error {
  border-top: 1px solid var(--twk-border);
  color: var(--twk-danger);
  font-size: 13px;
  line-height: 1.4;
  min-height: 48px;
  overflow-wrap: anywhere;
  padding: 12px 16px;
}
${selector} .twk-account-body {
  display: grid;
  gap: 12px;
  min-height: 0;
  overflow: auto;
  padding: 18px 22px 22px;
}
${selector} .twk-button-panel .twk-account-body {
  padding: 18px;
}
${selector} .twk-account-card {
  background: transparent;
  border: 0;
  border-radius: 0;
  display: grid;
  gap: 12px;
  min-height: 0;
  padding: 0;
}
${selector} .twk-account-hero {
  align-items: center;
  display: grid;
  gap: 12px;
  justify-items: center;
  min-width: 0;
  text-align: center;
}
${selector} .twk-account-avatar {
  align-items: center;
  background:
    radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--twk-surface) 90%, transparent) 0 6px, transparent 7px),
    radial-gradient(circle at 28% 24%, color-mix(in srgb, var(--twk-accent) 72%, white) 0 18px, transparent 19px),
    linear-gradient(135deg, var(--twk-accent), color-mix(in srgb, var(--twk-accent) 42%, var(--twk-surface-muted)));
  border: 0;
  border-radius: 999px;
  display: flex;
  height: 118px;
  justify-content: center;
  overflow: hidden;
  position: relative;
  width: 118px;
}
${selector} .twk-avatar-spot {
  background: color-mix(in srgb, white 18%, transparent);
  border-radius: 999px;
  display: block;
  height: 50px;
  width: 50px;
}
${selector} .twk-button-panel .twk-account-avatar {
  height: 104px;
  width: 104px;
}
${selector} .twk-account-avatar img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}
${selector} .twk-account-card[data-avatar-tone="1"] .twk-account-avatar,
${selector} .twk-account-card[data-avatar-tone="4"] .twk-account-avatar {
  background:
    radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--twk-surface) 90%, transparent) 0 6px, transparent 7px),
    radial-gradient(circle at 28% 24%, color-mix(in srgb, var(--twk-success) 70%, white) 0 18px, transparent 19px),
    linear-gradient(135deg, var(--twk-success), var(--twk-accent));
}
${selector} .twk-account-card[data-avatar-tone="2"] .twk-account-avatar,
${selector} .twk-account-card[data-avatar-tone="5"] .twk-account-avatar {
  background:
    radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--twk-surface) 90%, transparent) 0 6px, transparent 7px),
    radial-gradient(circle at 28% 24%, color-mix(in srgb, var(--twk-warning) 72%, white) 0 18px, transparent 19px),
    linear-gradient(135deg, var(--twk-warning), var(--twk-accent));
}
${selector} .twk-identity-row, ${selector} .twk-actions, ${selector} .twk-tx-row {
  align-items: center;
  display: flex;
  gap: 10px;
}
${selector} .twk-identity { display: grid; gap: 8px; justify-items: center; min-width: 0; }
${selector} .twk-domain {
  font-size: 21px;
  font-weight: 650;
  line-height: 1.32;
  max-width: 100%;
  overflow: hidden;
  padding-block: 1px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${selector} .twk-button-panel .twk-domain {
  font-size: 18px;
}
${selector} .twk-domain[data-loading="true"] {
  border-radius: 999px;
  height: 26px;
  width: min(180px, 56vw);
}
${selector} .twk-account-address-row {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) 40px;
  max-width: min(100%, 320px);
  min-height: 40px;
}
${selector} .twk-account-meta-pill {
  align-items: center;
  background: var(--twk-surface);
  border: 1px solid var(--twk-border);
  border-radius: 14px;
  display: inline-flex;
  font-size: 13px;
  font-weight: 560;
  gap: 8px;
  max-width: min(100%, 340px);
  min-height: 44px;
  min-width: 0;
  padding: 2px 4px 2px 12px;
}
${selector} .twk-pill-address {
  color: var(--twk-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${selector} .twk-pill-divider {
  background: var(--twk-border);
  display: block;
  flex: 0 0 1px;
  height: 18px;
  opacity: .8;
}
${selector} .twk-pill-balance {
  color: var(--twk-text);
  flex: 0 0 auto;
  font-weight: 650;
  white-space: nowrap;
}
${selector} .twk-pill-balance[data-loading="true"] {
  align-items: center;
  display: inline-flex;
  height: 24px;
  justify-content: center;
  width: 80px;
}
${selector} .twk-address-chip {
  background: var(--twk-surface-muted);
  border: 1px solid var(--twk-border);
  border-radius: 14px;
  color: var(--twk-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.28;
  min-height: 40px;
  min-width: 0;
  overflow: hidden;
  padding: 10px 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${selector} .twk-address-qr-action {
  align-items: center;
  background: transparent;
  border-color: transparent;
  border-radius: 14px;
  color: var(--twk-text-muted);
  display: inline-flex;
  height: 40px;
  justify-content: center;
  min-height: 40px;
  padding: 0;
  width: 40px;
}
${selector} .twk-address-qr-action:hover {
  background: var(--twk-surface-hover);
}
${selector} .twk-address-chip-full {
  border-radius: var(--twk-wallet-radius);
  line-height: 1.45;
  max-width: 100%;
  overflow-wrap: anywhere;
  text-align: center;
  white-space: normal;
}
${selector} .twk-account-meta {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 42px;
}
${selector} .twk-balance {
  background: var(--twk-surface-muted);
  border: 1px solid var(--twk-border);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.28;
  min-height: 42px;
  min-width: 96px;
  padding: 13px 16px;
}
${selector} .twk-balance[data-loading="true"] {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  padding: 0 16px;
  width: 128px;
}
${selector} .twk-actions {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr;
}
${selector} .twk-actions .twk-action {
  min-height: 46px;
  width: 100%;
}
${selector} .twk-qr-slot {
  align-items: center;
  align-self: center;
  background: var(--twk-qr-background);
  border: 1px solid var(--twk-border);
  border-radius: var(--twk-wallet-radius);
  color: var(--twk-qr-foreground);
  display: flex;
  height: 168px;
  justify-content: center;
  margin: 0 auto;
  overflow: hidden;
  width: 168px;
}
${selector} .twk-qr-slot img { display: block; height: 100%; object-fit: contain; width: 100%; }
${selector} .twk-address-qr-view {
  display: grid;
  gap: 12px;
  justify-items: stretch;
}
${selector} .twk-address-qr-slot {
  background: var(--twk-qr-background);
  border: 1px solid color-mix(in srgb, var(--twk-border) 70%, transparent);
  border-radius: 8px;
  box-shadow: none;
  box-sizing: border-box;
  height: auto;
  margin: 0 auto;
  padding: 0;
  position: relative;
  width: min(300px, 100%);
}
${selector} .twk-address-qr-slot img, ${selector} .twk-address-qr-slot svg {
  aspect-ratio: 1 / 1;
  display: block;
  height: auto;
  object-fit: contain;
  width: 100%;
}
${selector} .twk-tx-section {
  background: var(--twk-surface);
  border: 1px solid var(--twk-border);
  border-radius: var(--twk-wallet-radius);
  display: grid;
  min-height: 0;
  overflow: hidden;
}
${selector} .twk-tx-header {
  align-items: center;
  background: transparent;
  border-radius: 0;
  color: var(--twk-text-muted);
  display: flex;
  font-size: 10px;
  font-weight: 650;
  gap: 8px;
  justify-content: space-between;
  letter-spacing: .07em;
  min-height: 34px;
  padding: 0 10px;
  text-transform: uppercase;
  width: 100%;
}
${selector} .twk-tx-header-link {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 999px;
  color: var(--twk-accent);
  display: inline-flex;
  font-size: 11px;
  font-weight: 650;
  gap: 4px;
  height: 28px;
  justify-content: center;
  letter-spacing: 0;
  margin-left: auto;
  min-height: 28px;
  padding: 0 8px;
  text-decoration: none;
  text-transform: none;
}
${selector} .twk-tx-header-link svg {
  height: 13px;
  width: 13px;
}
${selector} .twk-tx-count {
  align-items: center;
  background: var(--twk-surface-muted);
  border-radius: 999px;
  color: var(--twk-text-muted);
  display: inline-flex;
  font-size: 10px;
  font-weight: 700;
  justify-content: center;
  min-height: 16px;
  min-width: 18px;
  padding: 0 5px;
}
${selector} .twk-tx-list {
  display: grid;
  grid-template-rows: 1fr;
  min-height: 0;
  transition: grid-template-rows .18s ease;
}
${selector} .twk-tx-list-inner {
  min-height: 0;
  overflow: hidden;
}
${selector} .twk-tx-row {
  border-top: 1px solid var(--twk-border);
  display: grid;
  gap: 8px;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  min-height: 42px;
  padding: 7px 10px;
}
${selector} .twk-tx-row:first-child {
  border-top: 0;
}
${selector} .twk-tx-empty {
  border-top: 1px solid var(--twk-border);
  color: var(--twk-text-muted);
  font-size: 12px;
  line-height: 1.4;
  min-height: 42px;
  padding: 12px 10px;
  text-align: center;
}
${selector} .twk-tx-icon {
  align-self: center;
  background: var(--twk-surface-muted);
  border-radius: 999px;
  height: 24px;
  position: relative;
  width: 24px;
}
${selector} .twk-tx-icon::after {
  background: currentColor;
  border-radius: 999px;
  content: "";
  height: 8px;
  left: 8px;
  position: absolute;
  top: 8px;
  width: 8px;
}
${selector} .twk-tx-icon[data-status="pending"]::before {
  animation: twk-pulse 1.4s ease-out infinite;
  border: 1px solid currentColor;
  border-radius: 999px;
  content: "";
  inset: -3px;
  opacity: .45;
  position: absolute;
}
${selector} .twk-tx-main {
  display: grid;
  gap: 2px;
  min-width: 0;
}
${selector} .twk-tx-label {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${selector} .twk-tx-hash {
  color: var(--twk-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${selector} .twk-tx-status {
  align-self: center;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.25;
  text-transform: capitalize;
}
${selector} .twk-tx-link {
  align-self: center;
  align-items: center;
  color: var(--twk-accent);
  display: inline-flex;
  font-size: 11px;
  font-weight: 650;
  gap: 4px;
  line-height: 1.25;
  text-decoration: none;
}
${selector} .twk-tx-link:hover {
  text-decoration: none;
}
${selector} .twk-tx-history-view .twk-tx-list-inner {
  max-height: 468px;
  overflow: auto;
}
${selector} .twk-tx-icon[data-status="pending"], ${selector} .twk-tx-status[data-status="pending"], ${selector} .twk-toast[data-status="pending"] .twk-toast-icon { color: var(--twk-warning); }
${selector} .twk-tx-icon[data-status="success"], ${selector} .twk-tx-status[data-status="success"], ${selector} .twk-toast[data-status="success"] .twk-toast-icon { color: var(--twk-success); }
${selector} .twk-tx-icon[data-status="failed"], ${selector} .twk-tx-status[data-status="failed"], ${selector} .twk-toast[data-status="failed"] .twk-toast-icon { color: var(--twk-danger); }
${selector} .twk-toast-root {
  bottom: 24px;
  display: flex;
  flex-direction: column-reverse;
  gap: 10px;
  pointer-events: none;
  position: fixed;
  z-index: 2147483001;
}
${selector} .twk-toast-root[data-position="bottom-right"] { right: 24px; }
${selector} .twk-toast-root[data-position="bottom-left"] { left: 24px; }
${selector} .twk-toast-root[data-position="bottom-center"] { left: 50%; transform: translateX(-50%); }
${selector} .twk-toast {
  align-items: center;
  background: var(--twk-surface);
  border: 1px solid var(--twk-border);
  border-radius: var(--twk-radius);
  box-shadow: var(--twk-shadow);
  color: var(--twk-text);
  display: flex;
  gap: 12px;
  max-width: 420px;
  min-height: 64px;
  min-width: 320px;
  padding: 10px 12px;
  pointer-events: auto;
  animation: twk-toast-in .18s ease-out both;
}
${selector} .twk-toast-icon {
  align-items: center;
  background: var(--twk-surface-muted);
  border: 1px solid var(--twk-border);
  border-radius: 999px;
  display: flex;
  flex: 0 0 34px;
  height: 34px;
  justify-content: center;
  width: 34px;
}
${selector} .twk-toast-spinner {
  animation: twk-spin .9s linear infinite;
  border: 2px solid var(--twk-spinner-trail);
  border-radius: 999px;
  border-top-color: currentColor;
  display: block;
  height: 18px;
  width: 18px;
}
${selector} .twk-toast-body { display: grid; flex: 1 1 auto; gap: 2px; min-width: 0; }
${selector} .twk-toast-label, ${selector} .twk-toast-hash {
  line-height: 1.28;
  overflow: hidden;
  padding-block: 1px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${selector} .twk-toast-label { font-size: 13px; font-weight: 700; }
${selector} .twk-toast-hash {
  color: var(--twk-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
}
${selector} .twk-toast-link {
  align-items: center;
  border-radius: var(--twk-wallet-radius);
  color: var(--twk-accent);
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 700;
  gap: 4px;
  min-height: 32px;
  padding: 0 6px;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}
${selector} .twk-toast-dismiss {
  align-items: center;
  background: transparent;
  border: 1px solid var(--twk-border);
  border-radius: var(--twk-wallet-radius);
  color: var(--twk-text);
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 44px;
  font: inherit;
  height: 44px;
  justify-content: center;
  min-height: 44px;
  padding: 0;
  width: 44px;
}
${selector} .twk-toast-link:hover, ${selector} .twk-toast-dismiss:hover { background: var(--twk-surface-hover); }
@keyframes twk-spin { to { transform: rotate(360deg); } }
@keyframes twk-connecting-dash { to { stroke-dashoffset: -240; } }
@keyframes twk-pulse { from { opacity: .45; transform: scale(.9); } to { opacity: 0; transform: scale(1.65); } }
@keyframes twk-skeleton-shimmer { to { transform: translateX(100%); } }
@keyframes twk-toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) {
  ${selector} .twk-toast, ${selector} .twk-toast-spinner, ${selector} .twk-action-spin, ${selector} .twk-connecting-ring-accent, ${selector} .twk-tx-icon::before, ${selector} .twk-skeleton::after, ${selector} .twk-qr-skeleton::after { animation: none; }
  ${selector} .twk-close, ${selector} .twk-back, ${selector} .twk-action, ${selector} .twk-address-qr-action, ${selector} .twk-tx-header-link, ${selector} .twk-wallet-row, ${selector} .twk-wallet-card, ${selector} .twk-search-trigger, ${selector} .twk-connect-button { transition: none; }
}
@media (max-width: 420px) {
  ${selector} .twk-overlay {
    align-items: end;
    padding: max(12px, env(safe-area-inset-top)) 0 0;
  }
  ${selector} .twk-modal, ${selector} .twk-account-panel {
    border-radius: var(--twk-radius) var(--twk-radius) 0 0;
    border-bottom: 0;
    border-left: 0;
    border-right: 0;
    max-height: calc(100dvh - env(safe-area-inset-top));
    width: 100vw;
  }
  ${selector} .twk-body {
    max-height: calc(100dvh - 56px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  }
  ${selector} .twk-wallet-grid, ${selector} .twk-no-wallets {
    height: min(360px, calc(100dvh - 150px - env(safe-area-inset-top) - env(safe-area-inset-bottom)));
  }
  ${selector} .twk-button-panel {
    bottom: 0;
    left: 0;
    min-width: 100vw;
    position: fixed;
    right: 0;
    top: auto;
    z-index: 2147483000;
  }
  ${selector} .twk-button-panel .twk-account-panel {
    border-radius: var(--twk-radius) var(--twk-radius) 0 0;
    border-bottom: 0;
    border-left: 0;
    border-right: 0;
    width: 100vw;
  }
  ${selector} .twk-toast-root { bottom: max(12px, env(safe-area-inset-bottom)); left: 12px; right: 12px; transform: none; }
  ${selector} .twk-toast { min-width: 0; width: 100%; }
}`;
}
