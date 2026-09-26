import {
  mkdir,
  open,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDemoEncryptedAsset,
  sha256Hex,
} from "../../app/src/lib/demoThresholdCrypto.js";

const root = dirname(fileURLToPath(import.meta.url));
const sourceDirectory = join(
  root,
  "assets",
  "research-to-story",
  "v1.0.0",
);
const outputDirectory = join(
  root,
  ".generated",
  "research-to-story",
  "v1.0.0",
);
const publicDirectory = join(outputDirectory, "public");
const nodesDirectory = join(outputDirectory, "nodes");
const assetId = "asset:research-to-story:1.0.0";
const keyEpoch = "demo-epoch-1";
const nodes = ["node-a", "node-b", "node-c"];
const force = process.argv.includes("--force");

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

const sourceBytes = await readFile(join(sourceDirectory, "source.md"));
const sourceText = sourceBytes.toString("utf8");
const sourceHash = await sha256Hex(sourceBytes);
const packageId = await sha256Hex(
  Buffer.from(`${assetId}\u0000v1.0.0\u0000${sourceHash}\u0000${keyEpoch}`),
);

if (!force && existsSync(join(outputDirectory, "package-report.json"))) {
  const existingReport = JSON.parse(
    (
      await readFile(join(outputDirectory, "package-report.json"))
    ).toString("utf8"),
  );
  if (existingReport.sourceHash === sourceHash) {
    console.log(`Package is current: ${outputDirectory}`);
    process.exit(0);
  }
}

const lockDirectory = join(root, ".generated");
const lockPath = join(lockDirectory, ".build.lock");
await mkdir(lockDirectory, { recursive: true });
let lock;
try {
  lock = await open(lockPath, "wx");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Another package build is in progress. Waiting...");
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (existsSync(join(outputDirectory, "package-report.json"))) {
      process.exit(0);
    }
  }
  throw new Error("Timed out waiting for the package build lock.");
}

const asset = await createDemoEncryptedAsset({
  assetId,
  packageId,
  keyEpoch,
  plaintext: sourceText,
});
const ciphertext = Buffer.from(asset.content.ciphertext, "base64");

const manifest = {
  schema: "skillpass.asset.v1",
  assetId,
  packageId,
  skillPassportId: "passport:research_to_story",
  version: "1.0.0",
  keyEpoch,
  contentPath: "encrypted-content.bin",
  contentAlgorithm: "XChaCha20-Poly1305",
  contentNonce: asset.content.nonce,
  ciphertextHash: asset.content.ciphertextHash,
  ciphertextLength: ciphertext.length,
  sourceHash,
  plaintextHash: asset.content.plaintextHash,
  threshold: 2,
  committeeSize: 3,
  committee: nodes,
  publicPreview:
    "Turn a researched topic into a sourced brief and a short narrative.",
};
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
const manifestBytes = Buffer.from(manifestText, "utf8");
const manifestHash = await sha256Hex(manifestBytes);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(publicDirectory, { recursive: true });

for (const nodeId of nodes) {
  const nodeDirectory = join(nodesDirectory, nodeId);
  await mkdir(nodeDirectory, { recursive: true });
}

await writeFile(join(publicDirectory, "manifest.json"), manifestBytes);
await writeFile(join(publicDirectory, "encrypted-content.bin"), ciphertext);

const shareReport = [];
for (let index = 0; index < nodes.length; index += 1) {
  const nodeId = nodes[index];
  const share = asset.shares[index];
  const shareHash = await sha256Hex(share);
  const nodeBundle = {
    schema: "skillpass.node-share.v1",
    nodeId,
    assetId,
    packageId,
    keyEpoch,
    share: bytesToBase64(share),
    shareHash,
  };
  const nodePath = join(nodesDirectory, nodeId, "share.json");
  await writeFile(nodePath, `${JSON.stringify(nodeBundle, null, 2)}\n`);
  shareReport.push({
    nodeId,
    path: `nodes/${nodeId}/share.json`,
    shareHash,
  });
  share.fill(0);
}

const report = {
  schema: "skillpass.package-report.v1",
  assetId,
  packageId,
  version: manifest.version,
  keyEpoch,
  manifestHash,
  sourceHash: manifest.sourceHash,
  ciphertextHash: manifest.ciphertextHash,
  ciphertextLength: manifest.ciphertextLength,
  publicFiles: [
    {
      path: "public/manifest.json",
      bytes: manifestBytes.length,
      sha256: manifestHash,
    },
    {
      path: "public/encrypted-content.bin",
      bytes: ciphertext.length,
      sha256: manifest.ciphertextHash,
    },
  ],
  nodeShares: shareReport,
};
await writeFile(
  join(outputDirectory, "package-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
await lock.close();
await unlink(lockPath);

console.log(`Package built: ${outputDirectory}`);
console.log(`Public files: ${report.publicFiles.length}`);
console.log(`Node shares: ${report.nodeShares.length}`);
console.log(`Manifest: ${manifestHash}`);
