import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vitepress";

export default defineConfig({
  title: "TRON Wallet Kit",
  base: "/tron-wallet-kit/",
  description: "The best way to connect a TRON wallet — a polished, TRON-native wallet UX kit for dApps.",
  cleanUrls: true,
  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
  ],
  themeConfig: {
    nav: [
      { text: "Docs", link: "/docs/introduction" },
      { text: "Wallets", link: "/docs/wallets/catalog" },
      { text: "Playground", link: "/docs/playground" },
      { text: "Theme builder", link: "/docs/theme-builder" },
      { text: "GitHub", link: "https://github.com/TronWeb3Domains/tron-wallet-kit" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/docs/introduction" },
          { text: "Quick start", link: "/docs/quick-start" },
          { text: "Playground", link: "/docs/playground" },
          { text: "Theme builder", link: "/docs/theme-builder" },
        ],
      },
      {
        text: "Frameworks",
        items: [
          { text: "React", link: "/docs/frameworks/react" },
          { text: "Next.js", link: "/docs/frameworks/next" },
          { text: "Vanilla TS", link: "/docs/frameworks/vanilla" },
          { text: "CDN / IIFE", link: "/docs/frameworks/cdn-iife" },
        ],
      },
      {
        text: "Advanced",
        items: [
          { text: "Headless usage", link: "/docs/advanced/headless" },
          { text: "Events and hooks", link: "/docs/advanced/events-hooks" },
          { text: "Bundle performance", link: "/docs/advanced/bundle-performance" },
        ],
      },
      {
        text: "Configuration",
        items: [
          { text: "Connect button", link: "/docs/configuration/connect-button" },
          { text: "App metadata", link: "/docs/configuration/app-metadata" },
          { text: "Wallet list", link: "/docs/configuration/wallet-list" },
          { text: "Theming", link: "/docs/configuration/theming" },
          { text: "WalletConnect", link: "/docs/configuration/walletconnect" },
          { text: "Identity", link: "/docs/configuration/identity" },
          { text: "GasFree", link: "/docs/configuration/gasfree" },
          { text: "Localization", link: "/docs/configuration/localization" },
        ],
      },
      {
        text: "Wallets",
        items: [
          { text: "Catalog", link: "/docs/wallets/catalog" },
        ],
      },
      {
        text: "Transactions",
        items: [
          { text: "Overview", link: "/docs/transactions/overview" },
        ],
      },
      {
        text: "Use cases",
        items: [
          { text: "Payments", link: "/docs/use-cases/payments" },
          { text: "Smart contracts", link: "/docs/use-cases/smart-contracts" },
          { text: "Resources and governance", link: "/docs/use-cases/resources-governance" },
        ],
      },
      {
        text: "Authentication",
        items: [
          { text: "Sign-In with TRON", link: "/docs/auth/sign-in-with-tron" },
          { text: "Custom backend", link: "/docs/auth/custom-backend" },
          { text: "Next.js auth", link: "/docs/auth/nextjs" },
        ],
      },
      {
        text: "Adapters",
        items: [
          { text: "Overview", link: "/docs/adapters/overview" },
          { text: "Contributing wallets", link: "/docs/adapters/contributing" },
          { text: "TronLink", link: "/docs/adapters/tronlink" },
          { text: "WalletConnect", link: "/docs/adapters/walletconnect" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Going live", link: "/docs/guides/going-live" },
          { text: "Troubleshooting", link: "/docs/troubleshooting" },
          { text: "Migration from tronwallet-adapter", link: "/docs/migration-from-tronwallet-adapter" },
        ],
      },
      {
        text: "API reference",
        items: [
          { text: "Generated exports", link: "/docs/api/generated" },
          { text: "Client", link: "/docs/api/client" },
          { text: "Manager", link: "/docs/api/manager" },
          { text: "UI", link: "/docs/api/ui" },
          { text: "Modal and toast", link: "/docs/api/modal-toast" },
          { text: "Errors", link: "/docs/api/errors" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/TronWeb3Domains/tron-wallet-kit" }],
    search: { provider: "local" },
  },
  vite: {
    plugins: [basicSsl()],
  },
});
