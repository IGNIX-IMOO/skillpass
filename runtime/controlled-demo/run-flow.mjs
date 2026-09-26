import { createControlledIdentity, createSkillPassportId } from "./identities.mjs";
import { evaluateSkillGate, stepLicenseQuota } from "./cores.mjs";
import { ReferenceTrustRegistry } from "./trust-registry.mjs";

const OPERATOR = "IMOO Controlled Operator";
const SKILL_NAMESPACE = "ignix.skillpass.demo";
const SKILL_KEY = "research_to_story";
const SKILL_ID = 13;
const SERVICE_ID = "okx-ai:service:research-to-story:demo";

export function runControlledDemo() {
  const agentA = createControlledIdentity({
    operator: OPERATOR,
    role: "CREATOR_OWNER",
    displayName: "SkillPass Controlled Demo Creator",
    namespace: "agent-a",
  });
  const agentB = createControlledIdentity({
    operator: OPERATOR,
    role: "LICENSEE_BUYER",
    displayName: "SkillPass Controlled Demo Buyer",
    namespace: "agent-b",
  });

  const registry = new ReferenceTrustRegistry();
  const passportId = createSkillPassportId(SKILL_NAMESPACE, SKILL_KEY);
  const passport = registry.createPassport({
    passportId,
    namespace: SKILL_NAMESPACE,
    skillKey: SKILL_KEY,
    version: "1.0.0",
    creatorAgentId: agentA.agentId,
    ownerAddress: agentA.walletAddress,
    serviceId: SERVICE_ID,
  });

  const license = registry.issueLicense({
    passportId,
    licenseeAgentId: agentB.agentId,
    quota: 3,
    licenseType: "per_call",
  });

  const gate = evaluateSkillGate({
    skillId: SKILL_ID,
    skillValid: passport.status === "PUBLISHED",
    licensed: !license.revoked,
    serviceAvailable: true,
    licenseType: 0,
  });

  const quotaStep = stepLicenseQuota({
    quota: registry.getQuota(license.licenseId),
    consume: gate.allow,
    licenseValid: !license.revoked,
    serviceAvailable: true,
  });

  if (quotaStep.allow) {
    registry.saveQuota(license.licenseId, quotaStep.remaining);
  }

  const request = {
    topic: "Why reusable Agent skills need a license and quota layer",
    audience: "general readers",
  };
  const result = {
    brief:
      "Agent skills need stable identity, explicit rights, and verifiable usage records.",
    story:
      "A small cow found a reusable skill in space and discovered that even useful magic needs a passport.",
    imagePrompt:
      "A tiny IMOO calf holding a glowing skill passport inside a quiet spaceship.",
  };

  const receipt = registry.createReceipt({
    passportId,
    licenseId: license.licenseId,
    requesterAgentId: agentB.agentId,
    serviceId: SERVICE_ID,
    request,
    result,
  });

  return {
    mode: "controlled_demo",
    operator: OPERATOR,
    participants: [agentA, agentB],
    passport,
    license,
    gate,
    quotaBefore: 3,
    quotaAfter: registry.getQuota(license.licenseId),
    quotaStep,
    request,
    result,
    receipt,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runControlledDemo(), null, 2));
}
