export interface DemoContent {
  ciphertext: string;
  ciphertextHash: string;
  nonce: string;
  plaintextHash: string;
  assetId: string;
  keyEpoch: string;
}

export interface DemoEncryptedAsset {
  content: DemoContent;
  shares: Uint8Array[];
}

export interface ShareEnvelope {
  nodeId: string;
  assetId: string;
  packageId: string;
  orderId: string;
  keyEpoch: string;
  shareHash: string;
  envelope: {
    ephemeralPublicKey: string;
    nonce: string;
    ciphertext: string;
  };
  signature: string;
  publicKey: string;
}

export class DemoCryptoError extends Error {
  code: string;
}

export function sha256Hex(bytes: Uint8Array): Promise<string>;

export function createDemoBuyerKey(): {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
};

export function createDemoEncryptedAsset(input: {
  assetId?: string;
  orderId?: string;
  keyEpoch: string;
  plaintext: string;
}): Promise<DemoEncryptedAsset>;

export function decryptDemoContent(
  content: DemoContent,
  contentKey: Uint8Array,
): Promise<string>;

export function combineDemoShares(
  shares: Uint8Array[],
): Promise<Uint8Array>;

export class DemoCustodianNode {
  constructor(nodeId: string, online?: boolean);
  readonly nodeId: string;
  online: boolean;
  readonly publicKey: Uint8Array;
  installShare(input: {
    share: Uint8Array;
    assetId?: string;
    packageId?: string;
    orderId?: string;
    keyEpoch: string;
  }): Promise<void>;
  deliver(input: {
    assetId: string;
    packageId: string;
    orderId: string;
    keyEpoch: string;
    buyerPublicKey: Uint8Array;
  }): Promise<ShareEnvelope>;
}

export function openShareEnvelope(input: {
  nodeId: string;
  assetId: string;
  packageId: string;
  orderId: string;
  keyEpoch: string;
  envelope: ShareEnvelope["envelope"];
  buyerPrivateKey: Uint8Array;
}): Promise<Uint8Array>;
