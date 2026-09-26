import { id, randomBytes } from "ethers";
import type {
  CallReceipt,
  License,
  RegistryState,
  ServiceBinding,
  SkillPassport,
} from "../types";

const STORAGE_KEY = "skillpass.registry.v1";

export function hashObject(value: unknown) {
  return id(JSON.stringify(value));
}

function passportId(namespace: string, skillKey: string) {
  return `sp_${id(`${namespace}:${skillKey}`).slice(2)}`;
}

function uniqueId(prefix: string) {
  return `${prefix}_${randomBytes(16).slice(2)}`;
}

function seedRegistry(): RegistryState {
  const namespace = "ignix.skillpass.demo";
  const skillKey = "research_to_story";
  const currentPassportId = passportId(namespace, skillKey);

  const passport: SkillPassport = {
    passportId: currentPassportId,
    namespace,
    skillKey,
    displayName: "Research to Story",
    version: "1.0.0",
    creatorAgentId: "agent_controlled_demo_creator",
    creatorProof: id("ignix.skillpass.demo:research_to_story:creator"),
    owner: "SkillPass Demo Creator",
    status: "PUBLISHED",
    licenseMode: "per_call",
    serviceId: "okx-ai:service:research-to-story:demo",
    capabilityCircuitId: String(1),
    updatedAt: new Date().toISOString(),
  };

  const license: License = {
    licenseId: "lic_controlled_demo_buyer",
    passportId: currentPassportId,
    licenseeAgentId: "agent_controlled_demo_buyer",
    mode: "per_call",
    quota: 3,
    revoked: false,
    royaltyBucket: 0,
    startsAt: new Date().toISOString(),
    expiresAt: null,
  };

  const service: ServiceBinding = {
    serviceId: passport.serviceId,
    passportId: currentPassportId,
    operatorAgentId: "agent_imoo_operator",
    name: "Research to Story",
    endpointReference: "controlled-demo://research-to-story",
    price: "0.001 OKB",
    available: true,
    successRate: 1,
  };

  return {
    version: 1,
    passports: [passport],
    licenses: [license],
    services: [service],
    receipts: [],
  };
}

export function loadRegistry(): RegistryState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seeded = seedRegistry();
    saveRegistry(seeded);
    return seeded;
  }

  try {
    return JSON.parse(stored) as RegistryState;
  } catch {
    const seeded = seedRegistry();
    saveRegistry(seeded);
    return seeded;
  }
}

export function saveRegistry(state: RegistryState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetRegistry() {
  const seeded = seedRegistry();
  saveRegistry(seeded);
  return seeded;
}

export function createPassport(
  state: RegistryState,
  input: Omit<SkillPassport, "passportId" | "creatorProof" | "updatedAt">,
) {
  const nextPassport: SkillPassport = {
    ...input,
    passportId: passportId(input.namespace, input.skillKey),
    creatorProof: id(`${input.namespace}:${input.skillKey}:${input.creatorAgentId}`),
    updatedAt: new Date().toISOString(),
  };

  state.passports.unshift(nextPassport);
  saveRegistry(state);
  return nextPassport;
}

export function issueLicense(
  state: RegistryState,
  passportIdValue: string,
  licenseeAgentId: string,
  quota = 3,
) {
  const nextLicense: License = {
    licenseId: uniqueId("lic"),
    passportId: passportIdValue,
    licenseeAgentId,
    mode: "per_call",
    quota,
    revoked: false,
    royaltyBucket: 0,
    startsAt: new Date().toISOString(),
    expiresAt: null,
  };

  state.licenses.unshift(nextLicense);
  saveRegistry(state);
  return nextLicense;
}

export function revokeLicense(state: RegistryState, licenseId: string) {
  const license = state.licenses.find((item) => item.licenseId === licenseId);
  if (!license) {
    throw new Error("License not found");
  }
  license.revoked = true;
  saveRegistry(state);
  return license;
}

export function saveQuota(state: RegistryState, licenseId: string, quota: number) {
  const license = state.licenses.find((item) => item.licenseId === licenseId);
  if (!license) {
    throw new Error("License not found");
  }
  license.quota = quota;
  saveRegistry(state);
  return license;
}

export function createReceipt(
  state: RegistryState,
  input: Omit<CallReceipt, "receiptId" | "createdAt"> & {
    receiptId?: string;
  },
) {
  const receipt: CallReceipt = {
    ...input,
    receiptId: input.receiptId ?? uniqueId("rcpt"),
    createdAt: new Date().toISOString(),
  };
  state.receipts.unshift(receipt);
  saveRegistry(state);
  return receipt;
}

export function toggleServiceAvailability(
  state: RegistryState,
  serviceId: string,
) {
  const service = state.services.find((item) => item.serviceId === serviceId);
  if (!service) {
    throw new Error("Service not found");
  }
  service.available = !service.available;
  saveRegistry(state);
  return service;
}

export function transferPassportOwnership(
  state: RegistryState,
  passportIdValue: string,
  newOwner: string,
) {
  const passport = state.passports.find(
    (item) => item.passportId === passportIdValue,
  );
  if (!passport) {
    throw new Error("Passport not found");
  }
  passport.owner = newOwner;
  passport.updatedAt = new Date().toISOString();
  saveRegistry(state);
  return passport;
}
