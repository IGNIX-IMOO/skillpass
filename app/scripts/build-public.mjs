// Builds the static bundle that gets published into a TapeOut circuit
// container, where there is no registry bridge and no server.
//
//   npm run build:public
//
// Two differences from the normal build:
//   1. an empty hash lands on #/demo, not on the Control Room. The Control
//      Room reads /api/registry/snapshot, which does not exist on chain, so
//      it would open as an empty console.
//   2. every file plus its SHA-256 is printed, because that hash is what gets
//      declared on chain and verified byte for byte by every reader.

import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const source = join(root, "dist");
const target = join(root, "dist-public");

console.log("building static bundle…");
execFileSync("npm", ["run", "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, VITE_PUBLIC_BUILD: "1" },
});

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

const indexPath = join(target, "index.html");
const html = readFileSync(indexPath, "utf8");
const redirect = [
  "    <script>",
  "      // The public bundle opens on the unified competition overview.",
  "      if (!location.hash) location.replace('#/overview');",
  "    </script>",
  "",
].join("\n");

writeFileSync(indexPath, html.replace("  </head>", `${redirect}  </head>`));

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(target).sort();
let total = 0;
const manifest = [];

for (const file of files) {
  const bytes = readFileSync(file);
  total += bytes.length;
  manifest.push({
    path: relative(target, file),
    size: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    chunks: Math.ceil(bytes.length / 24000),
  });
}

console.log(`\n${target}`);
console.log(`files: ${manifest.length}   bytes: ${total}   chunks: ${manifest.reduce((n, f) => n + f.chunks, 0)}\n`);
for (const item of manifest) {
  console.log(`  ${String(item.size).padStart(7)}  ${String(item.chunks).padStart(2)}c  ${item.sha256}  ${item.path}`);
}

writeFileSync(
  join(target, "publish-manifest.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), totalBytes: total, files: manifest }, null, 2)}\n`,
);
console.log("\nwrote publish-manifest.json");
