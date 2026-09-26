import {
  Contract,
  JsonRpcProvider,
  dataLength,
  id,
  keccak256,
  toUtf8Bytes,
} from "ethers";
import { CHAIN_CONFIG } from "../config";

const provider = new JsonRpcProvider(CHAIN_CONFIG.rpcUrl, CHAIN_CONFIG.chainId);

const processor = new Contract(
  CHAIN_CONFIG.processorAddress,
  [
    "function eval(uint256 circuitId, bytes input) view returns (bytes output)",
    "function step(uint256 circuitId, bytes stateIn, bytes input) view returns (bytes stateOut, bytes output)",
  ],
  provider,
);

const trustRegistry = new Contract(
  CHAIN_CONFIG.trustRegistryAddress,
  [
    "function getPassport(bytes32 passportId) view returns ((bytes32 namespaceHash,bytes32 skillKeyHash,bytes32 currentVersionHash,bytes32 creatorProof,address owner,bytes32 serviceId,uint256 capabilityCircuitId,uint8 status,uint64 updatedAt))",
    "function getLicense(bytes32 licenseId) view returns ((bytes32 passportId,bytes32 licenseeAgentId,uint8 mode,uint16 quotaRemaining,uint8 royaltyBucket,uint8 status,uint64 updatedAt))",
    "function getService(bytes32 serviceId) view returns ((bytes32 passportId,bytes32 operatorAgentId,bytes32 endpointHash,bool available,uint64 updatedAt))",
    "function getReceipt(bytes32 receiptId) view returns ((bytes32 passportId,bytes32 licenseId,bytes32 serviceId,bytes32 requesterAgentId,bytes32 requestHash,bytes32 resultHash,bytes32 gateOutput,uint8 quotaStateOut,uint8 status,uint64 createdAt))",
  ],
  provider,
);

export interface GateResult {
  raw: string;
  allow: boolean;
  routeId: number;
  royaltyBucket: number;
}

export interface QuotaResult {
  rawOutput: string;
  rawStateOut: string;
  allow: boolean;
  denyReason: number;
  remaining: number;
}

export interface PublicRegistrySnapshot {
  passport: {
    key: string;
    owner: string;
    currentVersionHash: string;
    capabilityCircuitId: string;
    status: number;
  };
  license: {
    key: string;
    quotaRemaining: number;
    status: number;
    royaltyBucket: number;
  };
  service: {
    key: string;
    available: boolean;
    operatorAgentId: string;
    operatorName: string | null;
  };
  receipt: {
    key: string;
    resultHash: string;
    gateOutput: string;
    quotaStateOut: number;
    status: number;
  };
}

function byte(hex: string) {
  return Number(BigInt(hex));
}

export async function readSkillGate(inputHex: string): Promise<GateResult> {
  const raw = (await processor.eval(
    CHAIN_CONFIG.skillGateCircuitId,
    inputHex,
  )) as string;
  const value = byte(raw);
  // Fields are packed in declaration order onto ascending bits, verified
  // against the circuit truth table and the recorded on-chain case
  // (input 0xfb00 -> output 0x37 -> allow=1, route_id=1101, royalty=10).
  // route_id is a 4-bit number, so its most significant bit lands on bit 1.
  const routeId =
    (((value >> 1) & 1) << 3) |
    (((value >> 2) & 1) << 2) |
    (((value >> 3) & 1) << 1) |
    ((value >> 4) & 1);
  const royaltyBucket = (((value >> 5) & 1) << 1) | ((value >> 6) & 1);

  return {
    raw,
    allow: Boolean(value & 1),
    routeId,
    royaltyBucket,
  };
}

export async function stepLicenseQuota(
  stateInHex: string,
  inputHex: string,
): Promise<QuotaResult> {
  const [rawStateOut, rawOutput] = (await processor.step(
    CHAIN_CONFIG.licenseQuotaCircuitId,
    stateInHex,
    inputHex,
  )) as [string, string];
  const state = byte(rawStateOut);
  const output = byte(rawOutput);

  return {
    rawStateOut,
    rawOutput,
    allow: Boolean(output & 1),
    denyReason: ((output >> 1) & 1) | (((output >> 2) & 1) << 1),
    remaining: state & 0x0f,
  };
}

export function assertBytePayload(hex: string) {
  if (!/^0x[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error(`Invalid byte payload: ${hex}`);
  }
  return dataLength(hex);
}

export function quotaToStateHex(quota: number) {
  return `0x${(quota & 0x0f).toString(16).padStart(2, "0")}`;
}

export async function readPublicRegistrySnapshot(keys: {
  passportKey: string;
  licenseKey: string;
  serviceKey: string;
  receiptKey: string;
}): Promise<PublicRegistrySnapshot> {
  const [passport, license, service, receipt] = await Promise.all([
    trustRegistry.getPassport(id(keys.passportKey)),
    trustRegistry.getLicense(id(keys.licenseKey)),
    trustRegistry.getService(id(keys.serviceKey)),
    trustRegistry.getReceipt(id(keys.receiptKey)),
  ]);

  return {
    passport: {
      key: keys.passportKey,
      owner: passport.owner,
      currentVersionHash: passport.currentVersionHash,
      capabilityCircuitId: passport.capabilityCircuitId.toString(),
      status: Number(passport.status),
    },
    license: {
      key: keys.licenseKey,
      quotaRemaining: Number(license.quotaRemaining),
      status: Number(license.status),
      royaltyBucket: Number(license.royaltyBucket),
    },
    service: {
      key: keys.serviceKey,
      available: service.available,
      operatorAgentId: service.operatorAgentId,
      operatorName: agentNameOf(service.operatorAgentId),
    },
    receipt: {
      key: keys.receiptKey,
      resultHash: receipt.resultHash,
      gateOutput: receipt.gateOutput,
      quotaStateOut: Number(receipt.quotaStateOut),
      status: Number(receipt.status),
    },
  };
}

export type RegistryObjectKind = "passport" | "license" | "service" | "receipt";

export type RegistryObject = {
  kind: RegistryObjectKind;
  key: string;
  fields: Array<{ label: string; value: string; mono?: boolean; note?: string }>;
};

const OBJECT_KINDS: RegistryObjectKind[] = [
  "passport",
  "license",
  "service",
  "receipt",
];

export function kindOfId(value: string): RegistryObjectKind | null {
  const prefix = value.trim().split(":")[0];
  return OBJECT_KINDS.includes(prefix as RegistryObjectKind)
    ? (prefix as RegistryObjectKind)
    : null;
}

function hex(value: bigint): string {
  return `0x${value.toString(16).padStart(2, "0")}`;
}

function short(value: string): string {
  return value.length > 20 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
}

function time(value: bigint): string {
  const seconds = Number(value);
  return seconds > 0
    ? new Date(seconds * 1000).toISOString().replace("T", " ").slice(0, 19)
    : "—";
}

// The registry stores keccak256(agent id), never the id itself, so a readable
// name can only be shown for ids this build knows about. Kept next to the ids
// that were actually written when the records were created.
const KNOWN_AGENT_IDS: Record<string, string> = {
  "agent:imoo_operator": "IMOO Service Operator",
  "agent:controlled_demo_creator": "SkillPass Demo Creator",
  "agent:controlled_demo_buyer": "SkillPass Demo Buyer",
};

export function agentNameOf(hash: string): string | null {
  const wanted = hash.toLowerCase();
  for (const [agentId, name] of Object.entries(KNOWN_AGENT_IDS)) {
    if (keccak256(toUtf8Bytes(agentId)).toLowerCase() === wanted) return name;
  }
  return null;
}

// Reads one registry object straight from X Layer. The contract only answers
// by id, so the caller must already know the id it wants.
export async function readRegistryObject(value: string): Promise<RegistryObject> {
  const key = value.trim();
  const kind = kindOfId(key);
  if (!kind) {
    throw new Error(
      "无法识别的 ID。前缀必须是 passport: / license: / service: / receipt: 之一。",
    );
  }
  const keyHash = id(key);

  if (kind === "passport") {
    const item = await trustRegistry.getPassport(keyHash);
    return {
      kind,
      key,
      fields: [
        { label: "持有者 Owner", value: item.owner, mono: true },
        { label: "能力电路 Capability circuit", value: `#${item.capabilityCircuitId}` },
        {
          label: "版本哈希 Version hash",
          value: short(item.currentVersionHash),
          mono: true,
        },
        { label: "创作者证明 Creator proof", value: short(item.creatorProof), mono: true },
        { label: "状态 Status", value: Number(item.status) === 1 ? "PUBLISHED" : "其他" },
        { label: "更新时间 Updated", value: time(item.updatedAt) },
      ],
    };
  }

  if (kind === "license") {
    const item = await trustRegistry.getLicense(keyHash);
    return {
      kind,
      key,
      fields: [
        { label: "剩余额度 Quota remaining", value: String(item.quotaRemaining) },
        { label: "许可模式 Mode", value: Number(item.mode) === 0 ? "per_call" : String(item.mode) },
        { label: "版税桶 Royalty bucket", value: String(item.royaltyBucket) },
        {
          label: "被许可方 Licensee",
          value: agentNameOf(item.licenseeAgentId) ?? short(item.licenseeAgentId),
          note: agentNameOf(item.licenseeAgentId)
            ? "链上只存这个名字的哈希"
            : "未登记的名字，显示哈希",
        },
        {
          label: "状态 Status",
          value: Number(item.status) === 1 ? "ACTIVE" : "REVOKED / 其他",
        },
        { label: "更新时间 Updated", value: time(item.updatedAt) },
      ],
    };
  }

  if (kind === "service") {
    const item = await trustRegistry.getService(keyHash);
    return {
      kind,
      key,
      fields: [
        { label: "可用 Available", value: item.available ? "是" : "否" },
        {
          label: "运营方 Operator",
          value: agentNameOf(item.operatorAgentId) ?? short(item.operatorAgentId),
          note: agentNameOf(item.operatorAgentId)
            ? "链上只存这个名字的哈希"
            : "未登记的名字，显示哈希",
        },
        { label: "端点哈希 Endpoint hash", value: short(item.endpointHash), mono: true },
        { label: "更新时间 Updated", value: time(item.updatedAt) },
      ],
    };
  }

  const item = await trustRegistry.getReceipt(keyHash);
  return {
    kind,
    key,
    fields: [
      { label: "状态 Status", value: Number(item.status) === 1 ? "DELIVERED" : "REJECTED" },
      { label: "闸门输出 Gate output", value: hex(BigInt(item.gateOutput)), mono: true },
      { label: "额度状态输出 Quota stateOut", value: hex(BigInt(item.quotaStateOut)) },
      { label: "结果哈希 Result hash", value: item.resultHash, mono: true },
      { label: "请求哈希 Request hash", value: short(item.requestHash), mono: true },
      { label: "许可 License", value: short(item.licenseId), mono: true },
      { label: "创建时间 Created", value: time(item.createdAt) },
    ],
  };
}
