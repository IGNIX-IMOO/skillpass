import { createHash } from "node:crypto";

function stableId(prefix, ...parts) {
  const digest = createHash("sha256").update(parts.join("\u0000")).digest("hex");
  return `${prefix}_${digest}`;
}

export function createControlledIdentity({
  operator,
  role,
  displayName,
  namespace,
}) {
  return {
    agentId: stableId("agent", operator, role, namespace),
    displayName,
    role,
    operator,
    namespace,
    controlledDemo: true,
    walletAddress: null,
  };
}

export function createSkillPassportId(namespace, skillKey) {
  return stableId("sp", namespace, skillKey);
}
