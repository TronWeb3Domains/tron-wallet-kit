import type { ThemeConfig, WalletUiConfig } from "@tron-wallet-kit/ui";

export function toThemeConfig(ui: WalletUiConfig | undefined): ThemeConfig | undefined {
  if (!ui) return undefined;
  const theme: ThemeConfig = {};
  if (ui.themeName) theme.themeName = ui.themeName;
  if (ui.mode) theme.mode = ui.mode;
  if (ui.themeMode) theme.themeMode = ui.themeMode;
  if (ui.accent) theme.accent = ui.accent;
  if (ui.fontFamily) theme.fontFamily = ui.fontFamily;
  if (ui.customTheme) theme.tokens = ui.customTheme;
  return Object.keys(theme).length > 0 ? theme : undefined;
}
