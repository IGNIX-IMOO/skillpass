export interface SkillGateInput {
  skillId: number;
  skillValid: boolean;
  licensed: boolean;
  serviceAvailable: boolean;
  licenseType: number;
}

export interface SkillGateOutput {
  allow: boolean;
  routeId: number;
  royaltyBucket: number;
}

export interface QuotaStepInput {
  quota: number;
  consume: boolean;
  licenseValid: boolean;
  serviceAvailable: boolean;
}

export interface QuotaStepOutput {
  allow: boolean;
  remaining: number;
  denyReason: number;
}

export const DENY_REASON: Readonly<{
  NONE: number;
  INVALID_LICENSE: number;
  SERVICE_UNAVAILABLE: number;
  QUOTA_EXHAUSTED: number;
}>;

export function evaluateSkillGate(input: SkillGateInput): SkillGateOutput;
export function stepLicenseQuota(input: QuotaStepInput): QuotaStepOutput;
