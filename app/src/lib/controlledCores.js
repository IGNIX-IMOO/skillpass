export const DENY_REASON = Object.freeze({
  NONE: 0,
  INVALID_LICENSE: 1,
  SERVICE_UNAVAILABLE: 2,
  QUOTA_EXHAUSTED: 3,
});

export function evaluateSkillGate({
  skillId,
  skillValid,
  licensed,
  serviceAvailable,
  licenseType,
}) {
  const allow = Boolean(skillValid && licensed && serviceAvailable);

  return {
    allow,
    routeId: allow ? skillId : 0,
    royaltyBucket: allow ? licenseType : 0,
  };
}

export function stepLicenseQuota({
  quota,
  consume,
  licenseValid,
  serviceAvailable,
}) {
  if (!licenseValid) {
    return {
      allow: false,
      remaining: quota,
      denyReason: DENY_REASON.INVALID_LICENSE,
    };
  }

  if (!serviceAvailable) {
    return {
      allow: false,
      remaining: quota,
      denyReason: DENY_REASON.SERVICE_UNAVAILABLE,
    };
  }

  if (quota <= 0) {
    return {
      allow: false,
      remaining: 0,
      denyReason: DENY_REASON.QUOTA_EXHAUSTED,
    };
  }

  return {
    allow: true,
    remaining: consume ? quota - 1 : quota,
    denyReason: DENY_REASON.NONE,
  };
}
