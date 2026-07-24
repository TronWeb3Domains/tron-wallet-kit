import { existsSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = join(scriptDir, "..", "packages", "browser");
const distDir = join(packageDir, "dist");
const generatedFile = join(distDir, "index.global.js");
const generatedMap = join(distDir, "index.global.js.map");
const iifeFile = join(distDir, "tron-wallet-kit.iife.js");
const iifeMap = join(distDir, "tron-wallet-kit.iife.js.map");

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
    "--sourcemap"
  ],
  {
    cwd: packageDir,
    shell: process.platform === "win32",
    stdio: "inherit"
  }
);

if (result.status !== 0) process.exit(result.status ?? 1);

if (existsSync(iifeFile)) rmSync(iifeFile);
if (existsSync(iifeMap)) rmSync(iifeMap);
if (existsSync(generatedFile)) renameSync(generatedFile, iifeFile);
if (existsSync(generatedMap)) renameSync(generatedMap, iifeMap);
