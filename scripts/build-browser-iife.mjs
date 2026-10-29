import { existsSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "tsup";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = join(scriptDir, "..", "packages", "browser");
const distDir = join(packageDir, "dist");
const generatedFile = join(distDir, "index.global.js");
const generatedMap = join(distDir, "index.global.js.map");
const iifeFile = join(distDir, "tron-wallet-kit.iife.js");
const iifeMap = join(distDir, "tron-wallet-kit.iife.js.map");

process.chdir(packageDir);
await build({
  entry: ["src/index.ts"],
  format: ["iife"],
  globalName: "TronWalletKit",
  platform: "browser",
  esbuildOptions(options) {
    options.external = ["@gasfree/gasfree-sdk", "tronweb", "@tronweb3/tronwallet-adapter-ledger"];
  },
  sourcemap: true
});

if (existsSync(iifeFile)) rmSync(iifeFile);
if (existsSync(iifeMap)) rmSync(iifeMap);
if (existsSync(generatedFile)) renameSync(generatedFile, iifeFile);
if (existsSync(generatedMap)) renameSync(generatedMap, iifeMap);
