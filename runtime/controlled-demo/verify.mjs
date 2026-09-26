import assert from "node:assert/strict";
import { DENY_REASON, evaluateSkillGate, stepLicenseQuota } from "./cores.mjs";
import { runControlledDemo } from "./run-flow.mjs";

const flow = runControlledDemo();

assert.equal(flow.mode, "controlled_demo");
assert.equal(flow.participants.length, 2);
assert.equal(flow.participants[0].operator, flow.participants[1].operator);
assert.notEqual(flow.participants[0].agentId, flow.participants[1].agentId);
assert.equal(flow.participants[0].role, "CREATOR_OWNER");
assert.equal(flow.participants[1].role, "LICENSEE_BUYER");
assert.equal(flow.gate.allow, true);
assert.equal(flow.gate.routeId, 13);
assert.equal(flow.quotaBefore, 3);
assert.equal(flow.quotaAfter, 2);
assert.equal(flow.quotaStep.denyReason, DENY_REASON.NONE);
assert.equal(flow.receipt.status, "DELIVERED");
assert.equal(flow.receipt.controlledDemo, true);

const rejectedGate = evaluateSkillGate({
  skillId: 13,
  skillValid: true,
  licensed: false,
  serviceAvailable: true,
  licenseType: 0,
});

assert.equal(rejectedGate.allow, false);
assert.equal(rejectedGate.routeId, 0);
assert.equal(rejectedGate.royaltyBucket, 0);

const exhaustedQuota = stepLicenseQuota({
  quota: 0,
  consume: true,
  licenseValid: true,
  serviceAvailable: true,
});

assert.equal(exhaustedQuota.allow, false);
assert.equal(exhaustedQuota.remaining, 0);
assert.equal(exhaustedQuota.denyReason, DENY_REASON.QUOTA_EXHAUSTED);

console.log("Controlled demo verification passed.");
