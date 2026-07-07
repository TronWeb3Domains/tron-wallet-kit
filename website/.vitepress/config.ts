import { defineConfig } from "vitepress";

export default defineConfig({
  title: "TRON Wallet Kit",
  description: "TRON-native wallet kit with polished wallet UX.",
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Docs", link: "/docs/introduction" },
      { text: "Examples", link: "http://127.0.0.1:5173/" },
      { text: "Theme", link: "/docs/configuration/theming" },
      { text: "API", link: "/docs/api/ui" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/docs/introduction" },
          { text: "Quick Start", link: "/docs/quick-start" },
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
        text: "Adapters",
        items: [
          { text: "Overview", link: "/docs/adapters/overview" },
          { text: "TronLink", link: "/docs/adapters/tronlink" },
          { text: "WalletConnect", link: "/docs/adapters/walletconnect" },
        ],
      },
      {
        text: "API",
        items: [
          { text: "UI", link: "/docs/api/ui" },
          { text: "Client", link: "/docs/api/client" },
        ],
      },
    ],
    socialLinks: [],
    search: {
      provider: "local",
    },
  },
});
