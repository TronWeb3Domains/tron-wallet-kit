import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@tron-wallet-kit/auth": `${root}packages/auth/src/index.ts`,
      "@tron-wallet-kit/client": `${root}packages/client/src/index.ts`,
      "@tron-wallet-kit/core": `${root}packages/core/src/index.ts`,
      "@tron-wallet-kit/ui": `${root}packages/ui/src/index.ts`,
      "@tron-wallet-kit/adapter-tronlink": `${root}packages/adapters/tronlink/src/index.ts`,
      "@tron-wallet-kit/adapter-tronwallet-bridge": `${root}packages/adapters/tronwallet-bridge/src/index.ts`,
      "@tron-wallet-kit/adapter-walletconnect": `${root}packages/adapters/walletconnect/src/index.ts`,
    },
  },
});
