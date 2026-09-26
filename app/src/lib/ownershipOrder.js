export const OWNERSHIP_STATES = Object.freeze({
  LISTED: "LISTED",
  FUNDED: "FUNDED",
  DELIVERING: "DELIVERING",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  DELIVERY_TIMEOUT: "DELIVERY_TIMEOUT",
  REFUNDED: "REFUNDED",
});

export class OwnershipOrderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "OwnershipOrderError";
    this.code = code;
  }
}

function cloneOrder(order) {
  return {
    ...order,
    committee: [...order.committee],
    attestations: { ...order.attestations },
  };
}

function requireState(order, expected, action) {
  if (!expected.includes(order.state)) {
    throw new OwnershipOrderError(
      "invalid-state",
      `${action} is not allowed from ${order.state}`,
    );
  }
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new OwnershipOrderError("invalid-input", `${field} is required`);
  }
}

export function createOwnershipOrder(input) {
  requireText(input.orderId, "orderId");
  requireText(input.passportId, "passportId");
  requireText(input.version, "version");
  requireText(input.buyer, "buyer");
  requireText(input.buyerPublicKeyHash, "buyerPublicKeyHash");
  requireText(input.paymentAsset, "paymentAsset");
  requireText(input.keyEpoch, "keyEpoch");

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new OwnershipOrderError("invalid-input", "price must be a positive number");
  }
  if (!Array.isArray(input.committee) || input.committee.length < 3) {
    throw new OwnershipOrderError(
      "invalid-input",
      "committee must contain at least three nodes",
    );
  }
  if (!Number.isInteger(input.threshold) || input.threshold < 2) {
    throw new OwnershipOrderError("invalid-input", "threshold must be at least two");
  }
  if (input.threshold > input.committee.length) {
    throw new OwnershipOrderError(
      "invalid-input",
      "threshold cannot exceed committee size",
    );
  }

  return {
    orderId: input.orderId,
    passportId: input.passportId,
    version: input.version,
    buyer: input.buyer,
    buyerPublicKeyHash: input.buyerPublicKeyHash,
    price: input.price,
    paymentAsset: input.paymentAsset,
    keyEpoch: input.keyEpoch,
    committee: [...new Set(input.committee)],
    threshold: input.threshold,
    state: OWNERSHIP_STATES.LISTED,
    paymentEventId: null,
    fundedAt: null,
    deliveryDeadline: null,
    ownershipTxId: null,
    refundTxId: null,
    attestations: {},
  };
}

export function fundOwnershipOrder(order, payment) {
  requireText(payment.eventId, "payment.eventId");
  if (!Number.isFinite(payment.confirmedAt)) {
    throw new OwnershipOrderError("invalid-input", "payment.confirmedAt is required");
  }

  if (order.state === OWNERSHIP_STATES.FUNDED) {
    if (order.paymentEventId === payment.eventId) return cloneOrder(order);
    throw new OwnershipOrderError(
      "duplicate-payment",
      "order is already funded by another payment",
    );
  }

  requireState(order, [OWNERSHIP_STATES.LISTED], "fund");

  const deliveryTtlMs = payment.deliveryTtlMs ?? 72 * 60 * 60 * 1000;
  return {
    ...cloneOrder(order),
    state: OWNERSHIP_STATES.FUNDED,
    paymentEventId: payment.eventId,
    fundedAt: payment.confirmedAt,
    deliveryDeadline: payment.confirmedAt + deliveryTtlMs,
  };
}

export function beginOwnershipDelivery(order) {
  if (order.state === OWNERSHIP_STATES.DELIVERING) return cloneOrder(order);
  requireState(order, [OWNERSHIP_STATES.FUNDED], "begin delivery");
  return {
    ...cloneOrder(order),
    state: OWNERSHIP_STATES.DELIVERING,
  };
}

export function recordDeliveryAttestation(order, attestation) {
  requireText(attestation.nodeId, "attestation.nodeId");
  requireText(attestation.shareHash, "attestation.shareHash");
  requireText(attestation.signature, "attestation.signature");
  if (!Number.isFinite(attestation.createdAt)) {
    throw new OwnershipOrderError("invalid-input", "attestation.createdAt is required");
  }

  requireState(
    order,
    [OWNERSHIP_STATES.FUNDED, OWNERSHIP_STATES.DELIVERING],
    "record attestation",
  );
  if (!order.committee.includes(attestation.nodeId)) {
    throw new OwnershipOrderError(
      "not-committee-member",
      `${attestation.nodeId} is not in the order committee`,
    );
  }

  const existing = order.attestations[attestation.nodeId];
  if (existing) {
    if (
      existing.shareHash === attestation.shareHash &&
      existing.signature === attestation.signature
    ) {
      return cloneOrder(order);
    }
    throw new OwnershipOrderError(
      "conflicting-attestation",
      `${attestation.nodeId} already delivered a different share`,
    );
  }

  const next = cloneOrder(order);
  next.attestations[attestation.nodeId] = {
    shareHash: attestation.shareHash,
    signature: attestation.signature,
    createdAt: attestation.createdAt,
  };
  next.state =
    Object.keys(next.attestations).length >= next.threshold
      ? OWNERSHIP_STATES.DELIVERED
      : OWNERSHIP_STATES.DELIVERING;
  return next;
}

export function completeOwnershipOrder(order, completion) {
  requireText(completion.ownershipTxId, "completion.ownershipTxId");

  if (order.state === OWNERSHIP_STATES.COMPLETED) {
    if (order.ownershipTxId === completion.ownershipTxId) return cloneOrder(order);
    throw new OwnershipOrderError(
      "duplicate-completion",
      "order is already completed by another transaction",
    );
  }

  requireState(order, [OWNERSHIP_STATES.DELIVERED], "complete");
  return {
    ...cloneOrder(order),
    state: OWNERSHIP_STATES.COMPLETED,
    ownershipTxId: completion.ownershipTxId,
  };
}

export function markOwnershipDeliveryTimeout(order, now) {
  requireState(
    order,
    [OWNERSHIP_STATES.FUNDED, OWNERSHIP_STATES.DELIVERING],
    "timeout",
  );
  if (!Number.isFinite(now) || now < order.deliveryDeadline) {
    throw new OwnershipOrderError("not-expired", "delivery deadline has not passed");
  }
  return {
    ...cloneOrder(order),
    state: OWNERSHIP_STATES.DELIVERY_TIMEOUT,
  };
}

export function refundOwnershipOrder(order, refund) {
  requireText(refund.refundTxId, "refund.refundTxId");
  if (order.state === OWNERSHIP_STATES.REFUNDED) {
    if (order.refundTxId === refund.refundTxId) return cloneOrder(order);
    throw new OwnershipOrderError(
      "duplicate-refund",
      "order is already refunded by another transaction",
    );
  }
  requireState(order, [OWNERSHIP_STATES.DELIVERY_TIMEOUT], "refund");
  return {
    ...cloneOrder(order),
    state: OWNERSHIP_STATES.REFUNDED,
    refundTxId: refund.refundTxId,
  };
}
