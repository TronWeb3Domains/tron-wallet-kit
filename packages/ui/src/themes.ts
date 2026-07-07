import type { ThemeConfig, ThemeName, ThemeTokens, UiMode, ResolvedTheme } from "./types";

const systemFont =
  'Inter, "Inter var", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const themePresets: Record<ThemeName, ThemeTokens> = {
  default: polishedLight(),
  light: polishedLight(),
  dark: polishedDark(),
  tron: preset("dark", "#151515", "#242424", "#302323", "#3a2b2b", "#514040", "#fff7ed", "#d6c5bc", "#ec1a2b", "#ffffff"),
  "tron-energy": preset("dark", "#071b17", "#102d26", "#173a31", "#1d4a3e", "#2a6358", "#ecfdf5", "#a7f3d0", "#00e5a8", "#022c22"),
  nile: preset("light", "#f0fdfa", "#ffffff", "#cffafe", "#e0f7fb", "#8bd5df", "#083344", "#0e7490", "#0891b2", "#ffffff"),
  shasta: preset("light", "#fff7ed", "#ffffff", "#ffedd5", "#fff1e6", "#fed7aa", "#27140a", "#9a3412", "#f97316", "#ffffff"),
  bandwidth: preset("dark", "#08111f", "#101d32", "#172944", "#1d3455", "#2f4d75", "#eff6ff", "#93c5fd", "#3b82f6", "#06111f"),
  energy: preset("dark", "#09201b", "#12352e", "#183f37", "#1f4d43", "#2a6358", "#ecfdf5", "#a7f3d0", "#2dd4bf", "#042f2e"),
  sun: preset("light", "#fffaf0", "#ffffff", "#fef3c7", "#ffedd5", "#f2d28b", "#1f2937", "#7c5f2a", "#ea580c", "#ffffff"),
  graphite: preset("dark", "#18181b", "#27272a", "#303033", "#36363a", "#3f3f46", "#fafafa", "#a1a1aa", "#e4e4e7", "#18181b"),
  midnight: preset("dark", "#0b1020", "#171d34", "#202842", "#26304c", "#334155", "#eef2ff", "#a5b4fc", "#818cf8", "#0b1020"),
  ocean: preset("light", "#f0fdfa", "#ffffff", "#cffafe", "#e0f7fb", "#8bd5df", "#083344", "#0e7490", "#0891b2", "#ffffff"),
  glass: {
    ...preset("light", "rgba(255,255,255,.78)", "rgba(255,255,255,.64)", "rgba(255,255,255,.50)", "rgba(255,255,255,.72)", "rgba(255,255,255,.58)", "#172033", "#64748b", "#ef4444", "#ffffff"),
    backdrop: "rgba(15,23,42,.34)",
    backdropBlur: "18px",
    radius: "20px",
    walletRadius: "14px",
    shadow: "0 18px 64px rgba(15,23,42,.18), 0 0 0 1px rgba(255,255,255,.28)"
  },
  rounded: {
    ...preset("light", "#fff7f7", "#ffffff", "#ffe4e6", "#fff1f2", "#fecdd3", "#1f2937", "#7f1d1d", "#e11d48", "#ffffff"),
    radius: "24px",
    walletRadius: "16px",
    shadow: "0 16px 48px rgba(225,29,72,.14)"
  },
  crisp: {
    ...preset("light", "#ffffff", "#ffffff", "#f4f4f5", "#f8fafc", "#111827", "#111827", "#52525b", "#111827", "#ffffff"),
    radius: "4px",
    walletRadius: "4px",
    shadow: "none"
  },
  soft: {
    ...preset("light", "#faf5ff", "#ffffff", "#f3e8ff", "#f5f0ff", "#e9d5ff", "#312e81", "#6b21a8", "#7c3aed", "#ffffff"),
    radius: "16px",
    walletRadius: "12px",
    shadow: "0 14px 42px rgba(124,58,237,.12)"
  },
  neon: preset("dark", "#09090b", "#14141b", "#1f1f2b", "#242438", "#3f3f46", "#faf5ff", "#c4b5fd", "#22d3ee", "#001317"),
  terminal: {
    ...preset("dark", "#020617", "#07110d", "#0d1b14", "#102419", "#214330", "#d1fae5", "#86efac", "#22c55e", "#02120a"),
    radius: "6px",
    walletRadius: "6px",
    shadow: "none"
  },
  minimal: {
    ...preset("light", "#ffffff", "#ffffff", "#f3f4f6", "#f9fafb", "#d1d5db", "#111827", "#6b7280", "#111827", "#ffffff"),
    radius: "8px",
    walletRadius: "8px",
    shadow: "none"
  },
  highContrast: {
    ...preset("dark", "#000000", "#111111", "#1f1f1f", "#242424", "#ffffff", "#ffffff", "#e5e5e5", "#ffff00", "#000000"),
    focusRing: "#ffff00",
    shadow: "none"
  }
};

export const cssVariableNames: Record<keyof ThemeTokens, string> = {
  colorScheme: "--twk-color-scheme",
  fontFamily: "--twk-font-family",
  radius: "--twk-radius",
  walletRadius: "--twk-wallet-radius",
  walletIconRadius: "--twk-wallet-icon-radius",
  shadow: "--twk-shadow",
  backdrop: "--twk-backdrop",
  backdropBlur: "--twk-backdrop-blur",
  surface: "--twk-surface",
  surfaceElevated: "--twk-surface-elevated",
  surfaceMuted: "--twk-surface-muted",
  surfaceHover: "--twk-surface-hover",
  border: "--twk-border",
  text: "--twk-text",
  textMuted: "--twk-text-muted",
  accent: "--twk-accent",
  accentText: "--twk-accent-text",
  success: "--twk-success",
  warning: "--twk-warning",
  danger: "--twk-danger",
  focusRing: "--twk-focus-ring",
  spinnerTrail: "--twk-spinner-trail",
  badgeInstalledBackground: "--twk-badge-installed-bg",
  badgeInstalledText: "--twk-badge-installed-fg",
  badgeQrBackground: "--twk-badge-qr-bg",
  badgeQrText: "--twk-badge-qr-fg",
  badgeRecentBackground: "--twk-badge-recent-bg",
  badgeRecentText: "--twk-badge-recent-fg",
  badgeMutedBackground: "--twk-badge-muted-bg",
  badgeMutedText: "--twk-badge-muted-fg",
  fallbackIconBackground: "--twk-fallback-icon-background",
  fallbackIconColor: "--twk-fallback-icon-color",
  qrForeground: "--twk-qr-foreground",
  qrBackground: "--twk-qr-background"
};

export function resolveTheme(config: ThemeConfig = {}): ResolvedTheme {
  const name = config.themeName ?? (resolveMode(config.themeMode ?? config.mode) === "dark" ? "dark" : "light");
  return {
    name,
    tokens: {
      ...themePresets[name],
      ...config.tokens
    }
  };
}

export function getThemeNames(): ThemeName[] {
  return Object.keys(themePresets) as ThemeName[];
}

export function createThemeStyleText(config: ThemeConfig = {}, selector = ".twk-root"): string {
  const { tokens } = resolveTheme(config);
  const variables = Object.entries(tokens)
    .map(([key, value]) => `  ${cssVariableNames[key as keyof ThemeTokens]}: ${value};`)
    .join("\n");
  return `${selector} {\n  color-scheme: ${tokens.colorScheme};\n${variables}\n}`;
}

export function createThemeStyleProperties(config: ThemeConfig = {}): Record<string, string> {
  const { tokens } = resolveTheme(config);
  const properties: Record<string, string> = { "color-scheme": tokens.colorScheme };
  for (const [key, value] of Object.entries(tokens)) {
    properties[cssVariableNames[key as keyof ThemeTokens]] = value;
  }
  return properties;
}

export function resolveMode(mode: UiMode | undefined): "light" | "dark" {
  if (mode === "dark") return "dark";
  if (mode === "auto" && typeof globalThis.matchMedia === "function") {
    return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function preset(
  colorScheme: "light" | "dark",
  surface: string,
  surfaceElevated: string,
  surfaceMuted: string,
  surfaceHover: string,
  border: string,
  text: string,
  textMuted: string,
  accent: string,
  accentText: string
): ThemeTokens {
  return {
    colorScheme,
    fontFamily: systemFont,
    radius: "10px",
    walletRadius: "8px",
    walletIconRadius: "7px",
    shadow: "0 4px 12px color-mix(in srgb, var(--twk-text) 6%, transparent), 0 24px 64px color-mix(in srgb, var(--twk-text) 16%, transparent)",
    backdrop: "color-mix(in srgb, var(--twk-text) 38%, transparent)",
    backdropBlur: "0px",
    surface,
    surfaceElevated,
    surfaceMuted,
    surfaceHover,
    border,
    text,
    textMuted,
    accent,
    accentText,
    success: "#16a34a",
    warning: "#ca8a04",
    danger: "#dc2626",
    focusRing: accent,
    spinnerTrail: "color-mix(in srgb, var(--twk-text-muted) 24%, transparent)",
    badgeInstalledBackground: "color-mix(in srgb, var(--twk-success) 20%, transparent)",
    badgeInstalledText: "var(--twk-success)",
    badgeQrBackground: "color-mix(in srgb, var(--twk-accent) 12%, transparent)",
    badgeQrText: "var(--twk-accent)",
    badgeRecentBackground: "color-mix(in srgb, var(--twk-accent) 12%, transparent)",
    badgeRecentText: "var(--twk-accent)",
    badgeMutedBackground: "var(--twk-surface-muted)",
    badgeMutedText: "var(--twk-text-muted)",
    fallbackIconBackground: surfaceMuted,
    fallbackIconColor: text,
    qrForeground: "#111827",
    qrBackground: "#ffffff"
  };
}

function polishedLight(): ThemeTokens {
  return {
    ...preset("light", "#ffffff", "#fbfbfb", "#f3f3f3", "#f3f3f3", "#e4e4e7", "#0a0a0a", "#6f6f6f", "#0988f0", "#ffffff"),
    radius: "28px",
    walletRadius: "16px",
    shadow: "0 4px 12px color-mix(in srgb, var(--twk-text) 5%, transparent), 0 24px 64px color-mix(in srgb, var(--twk-text) 12%, transparent)",
    backdrop: "rgba(0,0,0,.30)",
    success: "#30a46b",
    warning: "#f3a13f",
    danger: "#e04b4b",
    focusRing: "#0988f0",
    fallbackIconBackground: "#f3f3f3",
    fallbackIconColor: "#202020",
    qrForeground: "#0a0a0a",
    qrBackground: "#ffffff"
  };
}

function polishedDark(): ThemeTokens {
  return {
    ...preset("dark", "#141414", "#1c1c1c", "#202020", "#242424", "rgba(255,255,255,.07)", "#e4e7e7", "#9a9a9a", "#0988f0", "#ffffff"),
    radius: "28px",
    walletRadius: "16px",
    shadow: "0 4px 16px rgba(6,8,16,.5), 0 28px 72px rgba(6,8,16,.62)",
    backdrop: "rgba(0,0,0,.60)",
    success: "#30a46b",
    warning: "#f3a13f",
    danger: "#f25a67",
    focusRing: "#0988f0",
    fallbackIconBackground: "#242424",
    fallbackIconColor: "#e4e7e7",
    qrForeground: "#111827",
    qrBackground: "#ffffff"
  };
}
