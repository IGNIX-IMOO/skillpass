export type OwnershipState =
  | "LISTED"
  | "FUNDED"
  | "DELIVERING"
  | "DELIVERED"
  | "COMPLETED"
  | "DELIVERY_TIMEOUT"
  | "REFUNDED";

export interface DeliveryAttestation {
  shareHash: string;
  signature: string;
  createdAt: number;
}

export interface OwnershipOrder {
  orderId: string;
  passportId: string;
  version: string;
  buyer: string;
  buyerPublicKeyHash: string;
  price: number;
  paymentAsset: string;
  keyEpoch: string;
  committee: string[];
  threshold: number;
  state: OwnershipState;
  paymentEventId: string | null;
  fundedAt: number | null;
  deliveryDeadline: number | null;
  ownershipTxId: string | null;
  refundTxId: string | null;
  attestations: Record<string, DeliveryAttestation>;
}

export interface CreateOwnershipOrderInput {
  orderId: string;
  passportId: string;
  version: string;
  buyer: string;
  buyerPublicKeyHash: string;
  price: number;
  paymentAsset: string;
  keyEpoch: string;
  committee: string[];
  threshold: number;
}

export class OwnershipOrderError extends Error {
  code: string;
}

export const OWNERSHIP_STATES: Readonly<Record<string, OwnershipState>>;

export function createOwnershipOrder(
  input: CreateOwnershipOrderInput,
): OwnershipOrder;

export function fundOwnershipOrder(
  order: OwnershipOrder,
  payment: {
    eventId: string;
    confirmedAt: number;
    deliveryTtlMs?: number;
  },
): OwnershipOrder;

export function beginOwnershipDelivery(order: OwnershipOrder): OwnershipOrder;

export function recordDeliveryAttestation(
  order: OwnershipOrder,
  attestation: {
    nodeId: string;
    shareHash: string;
    signature: string;
    createdAt: number;
  },
): OwnershipOrder;

export function completeOwnershipOrder(
  order: OwnershipOrder,
  completion: { ownershipTxId: string },
): OwnershipOrder;

export function markOwnershipDeliveryTimeout(
  order: OwnershipOrder,
  now: number,
): OwnershipOrder;

export function refundOwnershipOrder(
  order: OwnershipOrder,
  refund: { refundTxId: string },
): OwnershipOrder;
