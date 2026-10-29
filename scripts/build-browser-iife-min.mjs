import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "tsup";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = join(scriptDir, "..", "packages", "browser");
const distDir = join(packageDir, "dist");
const generatedFile = join(distDir, "index.global.js");
const generatedMap = join(distDir, "index.global.js.map");
const minFile = join(distDir, "tron-wallet-kit.iife.min.js");
const minMap = join(distDir, "tron-wallet-kit.iife.min.js.map");

mkdirSync(distDir, { recursive: true });

process.chdir(packageDir);
await build({
  entry: ["src/index.ts"],
  format: ["iife"],
  globalName: "TronWalletKit",
  platform: "browser",
  esbuildOptions(options) {
    options.external = ["@gasfree/gasfree-sdk", "tronweb", "@tronweb3/tronwallet-adapter-ledger"];
  },
  minify: true,
  sourcemap: true
});

if (existsSync(minFile)) rmSync(minFile);
if (existsSync(minMap)) rmSync(minMap);
if (existsSync(generatedFile)) renameSync(generatedFile, minFile);
if (existsSync(generatedMap)) renameSync(generatedMap, minMap);
