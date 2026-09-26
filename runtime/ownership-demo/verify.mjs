import assert from "node:assert/strict";
import {
  OWNERSHIP_STATES,
  beginOwnershipDelivery,
  completeOwnershipOrder,
  createOwnershipOrder,
  fundOwnershipOrder,
  markOwnershipDeliveryTimeout,
  recordDeliveryAttestation,
  refundOwnershipOrder,
} from "../../app/src/lib/ownershipOrder.js";
import { runOwnershipCryptoFlow } from "./run-flow.mjs";

const base = {
  orderId: "ownership:research_to_story:demo-1",
  passportId: "passport:research_to_story",
  version: "1.0.0",
  buyer: "agent_b",
  buyerPublicKeyHash: "0xbuyerpublickey",
  price: 100,
  paymentAsset: "LOCAL_TEST_VALUE",
  keyEpoch: "demo-epoch-1",
  committee: ["node-a", "node-b", "node-c"],
  threshold: 2,
};

let order = createOwnershipOrder(base);
assert.equal(order.state, OWNERSHIP_STATES.LISTED);

const funded = fundOwnershipOrder(order, {
  eventId: "payment:demo-1",
  confirmedAt: 1_000,
  deliveryTtlMs: 1_000,
});
assert.equal(funded.state, OWNERSHIP_STATES.FUNDED);
assert.equal(funded.deliveryDeadline, 2_000);
assert.deepEqual(
  fundOwnershipOrder(funded, {
    eventId: "payment:demo-1",
    confirmedAt: 1_000,
  }),
  funded,
);

order = beginOwnershipDelivery(funded);
assert.equal(order.state, OWNERSHIP_STATES.DELIVERING);

order = recordDeliveryAttestation(order, {
  nodeId: "node-a",
  shareHash: "share-hash-a",
  signature: "signature-a",
  createdAt: 1_100,
});
assert.equal(order.state, OWNERSHIP_STATES.DELIVERING);

assert.throws(
  () =>
    completeOwnershipOrder(order, {
      ownershipTxId: "ownership-tx-too-early",
    }),
  (error) => error.code === "invalid-state",
);

order = recordDeliveryAttestation(order, {
  nodeId: "node-a",
  shareHash: "share-hash-a",
  signature: "signature-a",
  createdAt: 1_100,
});
assert.equal(order.state, OWNERSHIP_STATES.DELIVERING);

assert.throws(
  () =>
    recordDeliveryAttestation(order, {
      nodeId: "node-a",
      shareHash: "different-share",
      signature: "different-signature",
      createdAt: 1_200,
    }),
  (error) => error.code === "conflicting-attestation",
);

order = recordDeliveryAttestation(order, {
  nodeId: "node-b",
  shareHash: "share-hash-b",
  signature: "signature-b",
  createdAt: 1_200,
});
assert.equal(order.state, OWNERSHIP_STATES.DELIVERED);
assert.deepEqual(Object.keys(order.attestations).sort(), ["node-a", "node-b"]);

order = completeOwnershipOrder(order, {
  ownershipTxId: "ownership-tx-demo-1",
});
assert.equal(order.state, OWNERSHIP_STATES.COMPLETED);
assert.deepEqual(
  completeOwnershipOrder(order, {
    ownershipTxId: "ownership-tx-demo-1",
  }),
  order,
);

let timeoutOrder = beginOwnershipDelivery(
  fundOwnershipOrder(createOwnershipOrder(base), {
    eventId: "payment:demo-2",
    confirmedAt: 2_000,
    deliveryTtlMs: 1_000,
  }),
);
timeoutOrder = markOwnershipDeliveryTimeout(timeoutOrder, 3_000);
assert.equal(timeoutOrder.state, OWNERSHIP_STATES.DELIVERY_TIMEOUT);
timeoutOrder = refundOwnershipOrder(timeoutOrder, {
  refundTxId: "refund-tx-demo-2",
});
assert.equal(timeoutOrder.state, OWNERSHIP_STATES.REFUNDED);

const cryptoFlow = await runOwnershipCryptoFlow();
assert.equal(cryptoFlow.order.state, OWNERSHIP_STATES.COMPLETED);
assert.equal(cryptoFlow.plaintext, cryptoFlow.expectedPlaintext);
assert.equal(cryptoFlow.nodeCError, "node-offline");
assert.equal(cryptoFlow.deliveredShares.length, 2);
assert.notEqual(
  cryptoFlow.deliveredShares[0],
  cryptoFlow.deliveredShares[1],
);

console.log("Ownership order verification passed.");
