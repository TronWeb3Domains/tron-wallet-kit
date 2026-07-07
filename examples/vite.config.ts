import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const browserIifePath = join(root, "packages/browser/dist/tron-wallet-kit.iife.js");
const browserIifeMinPath = join(root, "packages/browser/dist/tron-wallet-kit.iife.min.js");

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: join(root, "examples/index.html"),
        reactBasic: join(root, "examples/react-basic/index.html"),
        htmlCdn: join(root, "examples/html-cdn/index.html"),
      },
    },
  },
  plugins: [
    react(),
    {
      name: "serve-tron-wallet-kit-iife",
      configureServer(server) {
        server.middlewares.use("/vendor/tron-wallet-kit.iife.js", (_request, response) => {
          void (async () => {
            try {
              const bundle = await readFile(browserIifePath, "utf8");
              response.setHeader("Content-Type", "text/javascript; charset=utf-8");
              response.end(bundle);
            } catch {
              response.statusCode = 404;
              response.end("Run pnpm --filter @tron-wallet-kit/browser build before opening the HTML/CDN example.");
            }
          })();
        });
        server.middlewares.use("/vendor/tron-wallet-kit.iife.min.js", (_request, response) => {
          void (async () => {
            try {
              const bundle = await readFile(browserIifeMinPath, "utf8");
              response.setHeader("Content-Type", "text/javascript; charset=utf-8");
              response.end(bundle);
            } catch {
              response.statusCode = 404;
              response.end("Run pnpm --filter @tron-wallet-kit/browser build before opening the HTML/CDN example.");
            }
          })();
        });
      },
    },
  ],
  server: {
    fs: {
      allow: [root],
    },
  },
  optimizeDeps: {
    include: [
      "@tronweb3/tronwallet-adapter-bitkeep",
      "@tronweb3/tronwallet-adapter-backpack",
      "@tronweb3/tronwallet-adapter-binance",
      "@tronweb3/tronwallet-adapter-bybit",
      "@tronweb3/tronwallet-adapter-foxwallet",
      "@tronweb3/tronwallet-adapter-gatewallet",
      "@tronweb3/tronwallet-adapter-guarda",
      "@tronweb3/tronwallet-adapter-imtoken",
      "@tronweb3/tronwallet-adapter-metamask-tron",
      "@tronweb3/tronwallet-adapter-okxwallet",
      "@tronweb3/tronwallet-adapter-onekey",
      "@tronweb3/tronwallet-adapter-tokenpocket",
      "@tronweb3/tronwallet-adapter-trust",
    ],
  },
  resolve: {
    alias: {
      "@tron-wallet-kit/adapter-tronlink": `${root}/packages/adapters/tronlink/src/index.ts`,
      "@tron-wallet-kit/adapter-tronwallet-bridge": `${root}/packages/adapters/tronwallet-bridge/src/index.ts`,
      "@tron-wallet-kit/adapter-walletconnect": `${root}/packages/adapters/walletconnect/src/index.ts`,
      "@tron-wallet-kit/browser": `${root}/packages/browser/src/index.ts`,
      "@tron-wallet-kit/client": `${root}/packages/client/src/index.ts`,
      "@tron-wallet-kit/core": `${root}/packages/core/src/index.ts`,
      "@tron-wallet-kit/react": `${root}/packages/react/src/index.ts`,
      "@tron-wallet-kit/ui": `${root}/packages/ui/src/index.ts`,
    },
  },
});
