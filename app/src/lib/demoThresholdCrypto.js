import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { combine, split } from "shamir-secret-sharing";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class DemoCryptoError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DemoCryptoError";
    this.code = code;
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function createDemoBuyerKey() {
  const privateKey = x25519.utils.randomSecretKey();
  return {
    privateKey,
    publicKey: x25519.getPublicKey(privateKey),
  };
}

function contentAad(assetId, keyEpoch) {
  return encoder.encode(
    JSON.stringify({
      purpose: "skillpass.demo.content.v1",
      assetId,
      keyEpoch,
    }),
  );
}

function shareAad(nodeId, assetId, packageId, orderId, keyEpoch) {
  return encoder.encode(
    JSON.stringify({
      purpose: "skillpass.demo.share.v1",
      nodeId,
      assetId,
      packageId,
      orderId,
      keyEpoch,
    }),
  );
}

export async function createDemoEncryptedAsset({
  assetId,
  orderId,
  keyEpoch,
  plaintext,
}) {
  const resolvedAssetId = assetId ?? orderId;
  const contentKey = crypto.getRandomValues(new Uint8Array(32));
  const contentNonce = crypto.getRandomValues(new Uint8Array(24));
  const plaintextBytes = encoder.encode(plaintext);
  const ciphertext = xchacha20poly1305(
    contentKey,
    contentNonce,
    contentAad(resolvedAssetId, keyEpoch),
  ).encrypt(plaintextBytes);

  const shares = await split(contentKey, 3, 2);
  const plaintextHash = await sha256Hex(plaintextBytes);
  const ciphertextHash = await sha256Hex(ciphertext);
  contentKey.fill(0);
  plaintextBytes.fill(0);

  return {
    content: {
      ciphertext: bytesToBase64(ciphertext),
      ciphertextHash,
      nonce: bytesToBase64(contentNonce),
      plaintextHash,
      assetId: resolvedAssetId,
      keyEpoch,
    },
    shares,
  };
}

export async function decryptDemoContent(content, contentKey) {
  const plaintext = xchacha20poly1305(
    contentKey,
    base64ToBytes(content.nonce),
    contentAad(content.assetId, content.keyEpoch),
  ).decrypt(base64ToBytes(content.ciphertext));
  return decoder.decode(plaintext);
}

export async function combineDemoShares(shares) {
  return combine(shares);
}

export class DemoCustodianNode {
  constructor(nodeId, online = true) {
    this.nodeId = nodeId;
    this.online = online;
    this.privateKey = ed25519.utils.randomSecretKey();
    this.publicKey = ed25519.getPublicKey(this.privateKey);
    this.share = null;
    this.assetId = null;
    this.packageId = null;
    this.keyEpoch = null;
    this.deliveryCache = new Map();
  }

  async installShare({ share, assetId, packageId, orderId, keyEpoch }) {
    if (this.share) {
      throw new DemoCryptoError(
        "share-exists",
        `${this.nodeId} already holds a share`,
      );
    }
    if (!(share instanceof Uint8Array) || share.length !== 33) {
      throw new DemoCryptoError("invalid-share", "share must be 33 bytes");
    }
    const resolvedAssetId = assetId ?? orderId;
    if (!resolvedAssetId) {
      throw new DemoCryptoError("invalid-asset", "assetId is required");
    }
    this.share = new Uint8Array(share);
    this.assetId = resolvedAssetId;
    this.packageId = packageId ?? null;
    this.keyEpoch = keyEpoch;
  }

  async deliver({ assetId, packageId, orderId, keyEpoch, buyerPublicKey }) {
    if (!this.online) {
      throw new DemoCryptoError("node-offline", `${this.nodeId} is offline`);
    }
    if (!this.share || !this.assetId || !this.keyEpoch) {
      throw new DemoCryptoError("share-missing", `${this.nodeId} has no share`);
    }
    if (
      assetId !== this.assetId ||
      (this.packageId && packageId !== this.packageId) ||
      keyEpoch !== this.keyEpoch
    ) {
      throw new DemoCryptoError(
        "asset-mismatch",
        `${this.nodeId} holds a share for another asset package`,
      );
    }

    const cached = this.deliveryCache.get(orderId);
    if (cached) return { ...cached };

    const ephemeralPrivateKey = x25519.utils.randomSecretKey();
    const ephemeralPublicKey = x25519.getPublicKey(ephemeralPrivateKey);
    const sharedSecret = x25519.getSharedSecret(
      ephemeralPrivateKey,
      buyerPublicKey,
    );
    const nonce = crypto.getRandomValues(new Uint8Array(24));
    const ciphertext = xchacha20poly1305(
      sharedSecret,
      nonce,
      shareAad(this.nodeId, assetId, packageId, orderId, keyEpoch),
    ).encrypt(this.share);
    sharedSecret.fill(0);

    const shareHash = await sha256Hex(this.share);
    const signedMessage = encoder.encode(
      JSON.stringify({
        nodeId: this.nodeId,
        assetId,
        packageId,
        orderId,
        keyEpoch,
        shareHash,
        ephemeralPublicKey: bytesToBase64(ephemeralPublicKey),
        nonce: bytesToBase64(nonce),
        ciphertext: bytesToBase64(ciphertext),
      }),
    );
    const envelope = {
      nodeId: this.nodeId,
      assetId,
      packageId,
      orderId,
      keyEpoch,
      shareHash,
      envelope: {
        ephemeralPublicKey: bytesToBase64(ephemeralPublicKey),
        nonce: bytesToBase64(nonce),
        ciphertext: bytesToBase64(ciphertext),
      },
      signature: bytesToBase64(ed25519.sign(signedMessage, this.privateKey)),
      publicKey: bytesToBase64(this.publicKey),
    };
    this.deliveryCache.set(orderId, envelope);
    return { ...envelope };
  }
}

export async function openShareEnvelope({
  nodeId,
  assetId,
  packageId,
  orderId,
  keyEpoch,
  envelope,
  buyerPrivateKey,
}) {
  const sharedSecret = x25519.getSharedSecret(
    buyerPrivateKey,
    base64ToBytes(envelope.ephemeralPublicKey),
  );
  const share = xchacha20poly1305(
    sharedSecret,
    base64ToBytes(envelope.nonce),
    shareAad(nodeId, assetId, packageId, orderId, keyEpoch),
  ).decrypt(base64ToBytes(envelope.ciphertext));
  sharedSecret.fill(0);
  return share;
}
