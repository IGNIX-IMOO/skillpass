import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  combineDemoShares,
  createDemoBuyerKey,
  decryptDemoContent,
  openShareEnvelope,
} from "../../app/src/lib/demoThresholdCrypto.js";
import { startCustodianNode } from "./node-service.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const generated = join(
  root,
  ".generated",
  "research-to-story",
  "v1.0.0",
);
const manifest = JSON.parse(
  (
    await readFile(join(generated, "public", "manifest.json"))
  ).toString("utf8"),
);
const ciphertext = await readFile(
  join(generated, "public", "encrypted-content.bin"),
);
const sourceText = await readFile(
  join(root, "assets", "research-to-story", "v1.0.0", "source.md"),
  "utf8",
);

const nodeA = await startCustodianNode({
  nodeId: "node-a",
  sharePath: join(generated, "nodes", "node-a", "share.json"),
});
const nodeB = await startCustodianNode({
  nodeId: "node-b",
  sharePath: join(generated, "nodes", "node-b", "share.json"),
});

const buyer = createDemoBuyerKey();
const orderId = "ownership:research-to-story:http-node-test";
const requestBody = {
  assetId: manifest.assetId,
  packageId: manifest.packageId,
  orderId,
  keyEpoch: manifest.keyEpoch,
  buyerPublicKey: Buffer.from(buyer.publicKey).toString("base64"),
};

const health = await fetch(`http://127.0.0.1:${nodeA.port}/health`);
assert.equal(health.status, 200);

const deliveryA = await fetch(`http://127.0.0.1:${nodeA.port}/deliver`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(requestBody),
}).then((response) => response.json());
const deliveryB = await fetch(`http://127.0.0.1:${nodeB.port}/deliver`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(requestBody),
}).then((response) => response.json());

const shareA = await openShareEnvelope({
  nodeId: "node-a",
  assetId: manifest.assetId,
  packageId: manifest.packageId,
  orderId,
  keyEpoch: manifest.keyEpoch,
  envelope: deliveryA.envelope,
  buyerPrivateKey: buyer.privateKey,
});
const shareB = await openShareEnvelope({
  nodeId: "node-b",
  assetId: manifest.assetId,
  packageId: manifest.packageId,
  orderId,
  keyEpoch: manifest.keyEpoch,
  envelope: deliveryB.envelope,
  buyerPrivateKey: buyer.privateKey,
});
const key = await combineDemoShares([shareA, shareB]);
const plaintext = await decryptDemoContent(
  {
    assetId: manifest.assetId,
    keyEpoch: manifest.keyEpoch,
    nonce: manifest.contentNonce,
    ciphertext: ciphertext.toString("base64"),
    ciphertextHash: manifest.ciphertextHash,
    plaintextHash: manifest.plaintextHash,
  },
  key,
);
assert.equal(plaintext, sourceText);

key.fill(0);
shareA.fill(0);
shareB.fill(0);
buyer.privateKey.fill(0);
await Promise.all([nodeA.close(), nodeB.close()]);

console.log("Custodian node service verification passed.");
