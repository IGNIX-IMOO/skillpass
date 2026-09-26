export type RegistryStatus = "PUBLISHED" | "PAUSED" | "RETIRED";

export interface SkillPassport {
  passportId: string;
  namespace: string;
  skillKey: string;
  displayName: string;
  version: string;
  creatorAgentId: string;
  creatorProof: string;
  owner: string;
  status: RegistryStatus;
  licenseMode: "per_call" | "subscription" | "limited" | "exclusive";
  serviceId: string;
  capabilityCircuitId: string;
  updatedAt: string;
}

export interface License {
  licenseId: string;
  passportId: string;
  licenseeAgentId: string;
  mode: "per_call" | "subscription" | "limited" | "exclusive";
  quota: number;
  revoked: boolean;
  royaltyBucket: 0 | 1 | 2 | 3;
  startsAt: string;
  expiresAt: string | null;
}

export interface ServiceBinding {
  serviceId: string;
  passportId: string;
  operatorAgentId: string;
  name: string;
  endpointReference: string;
  price: string;
  available: boolean;
  successRate: number;
}

export interface CallReceipt {
  receiptId: string;
  passportId: string;
  licenseId: string;
  requesterAgentId: string;
  serviceId: string;
  requestHash: string;
  resultHash: string;
  status: "DELIVERED" | "REJECTED";
  gateOutput: string;
  quotaStateOut: string | null;
  createdAt: string;
  note: string;
}

export interface RegistryState {
  version: 1;
  passports: SkillPassport[];
  licenses: License[];
  services: ServiceBinding[];
  receipts: CallReceipt[];
}

export interface FlowLog {
  id: string;
  label: string;
  detail: string;
  status: "pending" | "success" | "error" | "neutral";
}

export interface ResearchSource {
  title: string;
  url: string;
  excerpt: string;
}

export interface ResearchResult {
  provider: string;
  model: string;
  modelDisplayName: string;
  topic: string;
  sources: Array<Pick<ResearchSource, "title" | "url">>;
  result: {
    brief: string;
    keyFacts: string[];
    risks: string[];
    contentAngles: string[];
    story: string;
    imagePrompt: string;
    citations: Array<{
      title: string;
      url: string;
      claim: string;
    }>;
  };
  resultHash: string;
}
