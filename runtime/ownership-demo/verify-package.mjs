import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  combineDemoShares,
  decryptDemoContent,
  sha256Hex,
} from "../../app/src/lib/demoThresholdCrypto.js";

const root = dirname(fileURLToPath(import.meta.url));
const packageDirectory = join(
  root,
  ".generated",
  "research-to-story",
  "v1.0.0",
);
const manifestBytes = await readFile(
  join(packageDirectory, "public", "manifest.json"),
);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const report = JSON.parse(
  (
    await readFile(join(packageDirectory, "package-report.json"))
  ).toString("utf8"),
);
const ciphertext = await readFile(
  join(packageDirectory, "public", "encrypted-content.bin"),
);
const sourceText = await readFile(
  join(root, "assets", "research-to-story", "v1.0.0", "source.md"),
  "utf8",
);

assert.equal(await sha256Hex(manifestBytes), report.manifestHash);
assert.equal(manifest.packageId, report.packageId);
assert.equal(await sha256Hex(ciphertext), manifest.ciphertextHash);
assert.equal(await sha256Hex(Buffer.from(sourceText)), manifest.sourceHash);
assert.equal(ciphertext.length, manifest.ciphertextLength);

const nodeShares = [];
for (const nodeId of manifest.committee) {
  const bundle = JSON.parse(
    (
      await readFile(
        join(packageDirectory, "nodes", nodeId, "share.json"),
      )
    ).toString("utf8"),
  );
  const share = new Uint8Array(Buffer.from(bundle.share, "base64"));
  assert.equal(bundle.packageId, manifest.packageId);
  assert.equal(await sha256Hex(share), bundle.shareHash);
  nodeShares.push(share);
}

const content = {
  assetId: manifest.assetId,
  keyEpoch: manifest.keyEpoch,
  nonce: manifest.contentNonce,
  ciphertext: ciphertext.toString("base64"),
  ciphertextHash: manifest.ciphertextHash,
  plaintextHash: manifest.plaintextHash,
};

for (const [left, right] of [
  [0, 1],
  [0, 2],
  [1, 2],
]) {
  const key = await combineDemoShares([nodeShares[left], nodeShares[right]]);
  const plaintext = await decryptDemoContent(content, key);
  assert.equal(plaintext, sourceText);
  key.fill(0);
}

await assert.rejects(() => combineDemoShares([nodeShares[0]]));

const tampered = new Uint8Array(ciphertext);
tampered[Math.floor(tampered.length / 2)] ^= 0x01;
const key = await combineDemoShares([nodeShares[0], nodeShares[1]]);
await assert.rejects(() =>
  decryptDemoContent(
    { ...content, ciphertext: Buffer.from(tampered).toString("base64") },
    key,
  ),
);
key.fill(0);
for (const share of nodeShares) share.fill(0);

console.log("Skill package verification passed.");
