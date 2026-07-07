import { createWalletKitStyles } from "./styles";
import { cssVariableNames, resolveTheme } from "./themes";
import type { ResolvedTheme, ThemeConfig, ThemeTokens } from "./types";

export function createWalletKitRoot(config: ThemeConfig = {}, documentRef = globalThis.document): HTMLElement {
  if (!documentRef) throw new Error("createWalletKitRoot requires a DOM document.");
  const root = documentRef.createElement("div");
  root.className = "twk-root";
  root.dataset.twkRoot = "true";
  applyThemeToElement(root, config);
  return root;
}

export function ensureWalletKitStyles(documentRef = globalThis.document, options: { id?: string; selector?: string } = {}): HTMLStyleElement {
  if (!documentRef) throw new Error("ensureWalletKitStyles requires a DOM document.");
  const id = options.id ?? "twk-styles";
  const existing = documentRef.getElementById(id);
  if (existing instanceof (documentRef.defaultView?.HTMLStyleElement ?? HTMLStyleElement)) return existing;
  const style = documentRef.createElement("style");
  style.id = id;
  style.textContent = createWalletKitStyles(options.selector);
  documentRef.head.append(style);
  return style;
}

export function createElementFromHtml(html: string, documentRef = globalThis.document): HTMLElement {
  if (!documentRef) throw new Error("Creating wallet kit elements requires a DOM document.");
  const template = documentRef.createElement("template");
  template.innerHTML = html.trim();
  const element = template.content.firstElementChild;
  if (!(element instanceof (documentRef.defaultView?.HTMLElement ?? HTMLElement))) {
    throw new Error("Wallet kit HTML did not produce an element.");
  }
  return element;
}

export function applyThemeToElement(element: HTMLElement, config: ThemeConfig = {}): ResolvedTheme {
  const theme = resolveTheme(config);
  element.dataset.twkTheme = theme.name;
  for (const [key, value] of Object.entries(theme.tokens)) {
    element.style.setProperty(cssVariableNames[key as keyof ThemeTokens], value);
  }
  element.style.setProperty("color-scheme", theme.tokens.colorScheme);
  return theme;
}
