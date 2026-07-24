import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const packages = [
  { packageName: "@tron-wallet-kit/core", dir: "packages/core" },
  { packageName: "@tron-wallet-kit/client", dir: "packages/client" },
  { packageName: "@tron-wallet-kit/ui", dir: "packages/ui" },
  { packageName: "@tron-wallet-kit/react", dir: "packages/react" },
  { packageName: "@tron-wallet-kit/next", dir: "packages/next" },
  { packageName: "@tron-wallet-kit/browser", dir: "packages/browser" },
  { packageName: "@tron-wallet-kit/auth", dir: "packages/auth" },
  { packageName: "@tron-wallet-kit/adapter-tronlink", dir: "packages/adapters/tronlink" },
  { packageName: "@tron-wallet-kit/adapter-walletconnect", dir: "packages/adapters/walletconnect" },
  { packageName: "@tron-wallet-kit/adapter-tronwallet-bridge", dir: "packages/adapters/tronwallet-bridge" },
];

const outputPath = path.join(root, "website/docs/api/generated.md");

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveLocalModule(fromFile, specifier) {
  if (!specifier.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  return candidates.find(fileExists);
}

function sourceFile(filePath) {
  return ts.createSourceFile(filePath, fs.readFileSync(filePath, "utf8"), ts.ScriptTarget.Latest, true);
}

function hasExportModifier(node) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function textOfName(name) {
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return name.getText();
}

function addExport(exports, name, kind, filePath, source = filePath) {
  if (!name || name === "default") return;
  const key = `${name}:${kind}:${source}`;
  if (exports.seen.has(key)) return;
  exports.seen.add(key);
  exports.items.push({
    name,
    kind,
    source: normalizeSource(source),
    file: normalizeSource(filePath),
  });
}

function normalizeSource(filePath) {
  if (!filePath) return "";
  if (!path.isAbsolute(filePath)) return filePath;
  return path.relative(root, filePath).replaceAll("\\", "/");
}

function collectFromFile(filePath, exports, visited) {
  const normalizedFile = path.resolve(filePath);
  if (visited.has(normalizedFile) || !fileExists(normalizedFile)) return;
  visited.add(normalizedFile);
  const source = sourceFile(normalizedFile);

  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
        ? statement.moduleSpecifier.text
        : undefined;
      const localModule = moduleSpecifier ? resolveLocalModule(normalizedFile, moduleSpecifier) : undefined;

      if (!statement.exportClause && localModule) {
        collectFromFile(localModule, exports, visited);
        continue;
      }

      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          const exportedName = element.name.text;
          addExport(exports, exportedName, "re-export", normalizedFile, localModule ?? moduleSpecifier ?? normalizedFile);
        }
      }
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && hasExportModifier(statement)) {
      addExport(exports, textOfName(statement.name), "function", normalizedFile);
      continue;
    }

    if (ts.isClassDeclaration(statement) && hasExportModifier(statement)) {
      addExport(exports, textOfName(statement.name), "class", normalizedFile);
      continue;
    }

    if (ts.isInterfaceDeclaration(statement) && hasExportModifier(statement)) {
      addExport(exports, textOfName(statement.name), "interface", normalizedFile);
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement) && hasExportModifier(statement)) {
      addExport(exports, textOfName(statement.name), "type", normalizedFile);
      continue;
    }

    if (ts.isEnumDeclaration(statement) && hasExportModifier(statement)) {
      addExport(exports, textOfName(statement.name), "enum", normalizedFile);
      continue;
    }

    if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        addExport(exports, textOfName(declaration.name), "const", normalizedFile);
      }
    }
  }
}

function collectPackageExports(pkg) {
  const entry = path.join(root, pkg.dir, "src/index.ts");
  const exports = { items: [], seen: new Set() };
  collectFromFile(entry, exports, new Set());
  const byName = new Map();
  for (const item of exports.items) {
    const current = byName.get(item.name);
    if (!current) {
      byName.set(item.name, { ...item, kinds: new Set([item.kind]), sources: new Set([item.source]) });
      continue;
    }
    current.kinds.add(item.kind);
    current.sources.add(item.source);
    if (current.kind === "re-export" && item.kind !== "re-export") {
      current.kind = item.kind;
      current.source = item.source;
      current.file = item.file;
    }
  }
  return Array.from(byName.values())
    .map((item) => ({
      name: item.name,
      kind: Array.from(item.kinds).sort((a, b) => (a === "re-export" ? 1 : b === "re-export" ? -1 : a.localeCompare(b))).join(", "),
      source: item.source,
      file: item.file,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function createMarkdown() {
  const lines = [
    "# Generated API reference",
    "",
    "<!-- This file is generated by `pnpm docs:api`. Do not edit by hand. -->",
    "",
    "This page lists the public exports detected from each package entrypoint. Use the hand-written API pages for usage examples and lifecycle notes.",
    "",
    "## Packages",
    "",
  ];

  for (const pkg of packages) {
    lines.push(`- [${pkg.packageName}](#${anchorFor(pkg.packageName)})`);
  }

  for (const pkg of packages) {
    const items = collectPackageExports(pkg);
    lines.push("", `## ${pkg.packageName}`, "");
    lines.push(`Entrypoint: \`${pkg.dir}/src/index.ts\``, "");

    if (items.length === 0) {
      lines.push("_No public exports detected._", "");
      continue;
    }

    lines.push("| Export | Kind | Source |", "|---|---|---|");
    for (const item of items) {
      lines.push(`| \`${item.name}\` | ${item.kind} | \`${item.source}\` |`);
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function anchorFor(value) {
  return value.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, createMarkdown());
console.log(`Generated ${normalizeSource(outputPath)}`);
