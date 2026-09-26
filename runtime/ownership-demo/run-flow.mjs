import {
  OWNERSHIP_STATES,
  beginOwnershipDelivery,
  completeOwnershipOrder,
  createOwnershipOrder,
  fundOwnershipOrder,
  recordDeliveryAttestation,
} from "../../app/src/lib/ownershipOrder.js";
import {
  DemoCustodianNode,
  combineDemoShares,
  createDemoBuyerKey,
  createDemoEncryptedAsset,
  decryptDemoContent,
  openShareEnvelope,
  sha256Hex,
} from "../../app/src/lib/demoThresholdCrypto.js";

const demoPlaintext =
  "Research-to-Story: a verified result can become an owned capability.";

export async function runOwnershipCryptoFlow() {
  const orderId = "ownership:research_to_story:crypto-demo";
  const assetId = "asset:research-to-story:1.0.0";
  const packageId = "package:research-to-story:1.0.0:in-process";
  const keyEpoch = "demo-epoch-1";
  const { privateKey: buyerPrivateKey, publicKey: buyerPublicKey } =
    createDemoBuyerKey();

  let order = createOwnershipOrder({
    orderId,
    passportId: "passport:research_to_story",
    version: "1.0.0",
    buyer: "agent_b",
    buyerPublicKeyHash: await sha256Hex(buyerPublicKey),
    price: 100,
    paymentAsset: "LOCAL_TEST_VALUE",
    keyEpoch,
    committee: ["node-a", "node-b", "node-c"],
    threshold: 2,
  });

  const asset = await createDemoEncryptedAsset({
    assetId,
    keyEpoch,
    plaintext: demoPlaintext,
  });
  const nodes = [
    new DemoCustodianNode("node-a", true),
    new DemoCustodianNode("node-b", true),
    new DemoCustodianNode("node-c", false),
  ];

  for (let index = 0; index < nodes.length; index += 1) {
    await nodes[index].installShare({
      share: asset.shares[index],
      assetId,
      packageId,
      keyEpoch,
    });
  }

  order = fundOwnershipOrder(order, {
    eventId: "payment:crypto-demo",
    confirmedAt: 1_000,
    deliveryTtlMs: 1_000,
  });
  order = beginOwnershipDelivery(order);

  const deliveryA = await nodes[0].deliver({
    assetId,
    packageId,
    orderId,
    keyEpoch,
    buyerPublicKey,
  });
  order = recordDeliveryAttestation(order, {
    nodeId: "node-a",
    shareHash: deliveryA.shareHash,
    signature: deliveryA.signature,
    createdAt: 1_100,
  });

  const deliveryB = await nodes[1].deliver({
    assetId,
    packageId,
    orderId,
    keyEpoch,
    buyerPublicKey,
  });
  order = recordDeliveryAttestation(order, {
    nodeId: "node-b",
    shareHash: deliveryB.shareHash,
    signature: deliveryB.signature,
    createdAt: 1_200,
  });

  let nodeCError = null;
  try {
    await nodes[2].deliver({
      assetId,
      packageId,
      orderId,
      keyEpoch,
      buyerPublicKey,
    });
  } catch (error) {
    nodeCError = error.code;
  }

  const shareA = await openShareEnvelope({
    nodeId: "node-a",
    assetId,
    packageId,
    orderId,
    keyEpoch,
    envelope: deliveryA.envelope,
    buyerPrivateKey,
  });
  const shareB = await openShareEnvelope({
    nodeId: "node-b",
    assetId,
    packageId,
    orderId,
    keyEpoch,
    envelope: deliveryB.envelope,
    buyerPrivateKey,
  });
  const reconstructedKey = await combineDemoShares([shareA, shareB]);
  const plaintext = await decryptDemoContent(asset.content, reconstructedKey);
  reconstructedKey.fill(0);
  shareA.fill(0);
  shareB.fill(0);
  buyerPrivateKey.fill(0);

  order = completeOwnershipOrder(order, {
    ownershipTxId: "ownership-tx:crypto-demo",
  });

  return {
    order,
    content: asset.content,
    plaintext,
    expectedPlaintext: demoPlaintext,
    deliveredShares: [deliveryA.shareHash, deliveryB.shareHash],
    nodeCError,
  };
}
