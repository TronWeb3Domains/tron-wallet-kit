import { readdir, readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const entriesDir = join(root, "packages", "client", "src", "wallets", "entries");
const iconsDir = join(root, "packages", "client", "src", "wallets", "icons");
const registryFile = join(root, "packages", "client", "src", "wallets", "registry.ts");
const iconExtensions = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp"]);

const entryFiles = (await readdir(entriesDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && !entry.name.startsWith("_"))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));
const iconFiles = (await readdir(iconsDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && iconExtensions.has(extname(entry.name).toLowerCase()))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));
const registrySource = await readFile(registryFile, "utf8");
const descriptorIds = new Map();
const iconIds = new Map();
const errors = [];

for (const file of entryFiles) {
  const source = await readFile(join(entriesDir, file), "utf8");
  const id = source.match(/\bid:\s*["']([^"']+)["']/)?.[1];
  if (!id) {
    errors.push(`Descriptor ${file} is missing an id field.`);
    continue;
  }
  if (descriptorIds.has(id)) {
    errors.push(`Duplicate wallet descriptor id "${id}" in ${file} and ${descriptorIds.get(id)}.`);
  }
  descriptorIds.set(id, file);
  if (basename(file, ".ts") !== id) {
    errors.push(`Descriptor filename ${file} must match id "${id}".`);
  }
  if (!registrySource.includes(`./entries/${basename(file, ".ts")}`)) {
    errors.push(`Descriptor ${file} is not imported by packages/client/src/wallets/registry.ts.`);
  }
}

for (const file of iconFiles) {
  const id = file.slice(0, -extname(file).length);
  if (iconIds.has(id)) {
    errors.push(`Duplicate wallet icon id "${id}" in ${file} and ${iconIds.get(id)}.`);
  }
  iconIds.set(id, file);
}

for (const [id, file] of descriptorIds) {
  if (!iconIds.has(id)) {
    errors.push(`Descriptor ${file} has no matching icon file packages/client/src/wallets/icons/${id}.{svg,png,jpg,jpeg,webp}.`);
  }
}

for (const [id, file] of iconIds) {
  if (!descriptorIds.has(id)) {
    errors.push(`Icon ${file} has no matching descriptor packages/client/src/wallets/entries/${id}.ts.`);
  }
}

if (errors.length > 0) {
  console.error(`Wallet registry validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${descriptorIds.size} wallet descriptors and ${iconIds.size} wallet icons.`);
