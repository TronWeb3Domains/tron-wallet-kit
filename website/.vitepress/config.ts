import { defineConfig } from "vitepress";

export default defineConfig({
  title: "TRON Wallet Kit",
  description: "The best way to connect a TRON wallet — a polished, TRON-native wallet UX kit for dApps.",
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Docs", link: "/docs/introduction" },
      { text: "Wallets", link: "/docs/wallets/catalog" },
      { text: "Theme", link: "/docs/configuration/theming" },
      { text: "Demo", link: "http://127.0.0.1:5173/" },
      { text: "GitHub", link: "https://github.com/" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/docs/introduction" },
          { text: "Quick start", link: "/docs/quick-start" },
        ],
      },
      {
        text: "Frameworks",
        items: [
          { text: "React", link: "/docs/frameworks/react" },
          { text: "HTML / CDN", link: "/docs/frameworks/html-cdn" },
        ],
      },
      {
        text: "Configuration",
        items: [
          { text: "Theming", link: "/docs/configuration/theming" },
          { text: "WalletConnect", link: "/docs/configuration/walletconnect" },
          { text: "Identity", link: "/docs/configuration/identity" },
        ],
      },
      {
        text: "Wallets",
        items: [
          { text: "Catalog", link: "/docs/wallets/catalog" },
        ],
      },
      {
        text: "Adapters",
        items: [
          { text: "Overview", link: "/docs/adapters/overview" },
          { text: "TronLink", link: "/docs/adapters/tronlink" },
          { text: "WalletConnect", link: "/docs/adapters/walletconnect" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Troubleshooting", link: "/docs/troubleshooting" },
          { text: "Migration from tronwallet-adapter", link: "/docs/migration-from-tronwallet-adapter" },
        ],
      },
      {
        text: "API reference",
        items: [
          { text: "Client", link: "/docs/api/client" },
          { text: "UI", link: "/docs/api/ui" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/" }],
    search: { provider: "local" },
  },
});
