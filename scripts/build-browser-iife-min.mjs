import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = join(scriptDir, "..", "packages", "browser");
const distDir = join(packageDir, "dist");
const generatedFile = join(distDir, "index.global.js");
const generatedMap = join(distDir, "index.global.js.map");
const minFile = join(distDir, "tron-wallet-kit.iife.min.js");
const minMap = join(distDir, "tron-wallet-kit.iife.min.js.map");

mkdirSync(distDir, { recursive: true });

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "tsup",
    "src/index.ts",
    "--format",
    "iife",
    "--global-name",
    "TronWalletKit",
    "--platform",
    "browser",
    "--external",
    "@gasfree/gasfree-sdk",
    "--external",
    "tronweb",
    "--minify",
    "--sourcemap"
  ],
  {
    cwd: packageDir,
    shell: process.platform === "win32",
    stdio: "inherit"
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (existsSync(minFile)) rmSync(minFile);
if (existsSync(minMap)) rmSync(minMap);
if (existsSync(generatedFile)) renameSync(generatedFile, minFile);
if (existsSync(generatedMap)) renameSync(generatedMap, minMap);
