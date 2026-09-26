import { createHash, randomUUID } from "node:crypto";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

export class ReferenceTrustRegistry {
  #passports = new Map();
  #licenses = new Map();
  #quotaStates = new Map();
  #receipts = new Map();

  createPassport({
    passportId,
    namespace,
    skillKey,
    version,
    creatorAgentId,
    ownerAddress,
    serviceId,
  }) {
    if (this.#passports.has(passportId)) {
      throw new Error(`Passport already exists: ${passportId}`);
    }

    const passport = {
      passportId,
      namespace,
      skillKey,
      version,
      creatorProof: digest(`${namespace}:${skillKey}:${creatorAgentId}`),
      creatorAgentId,
      ownerAddress,
      serviceId,
      status: "PUBLISHED",
    };

    this.#passports.set(passportId, passport);
    return passport;
  }

  getPassport(passportId) {
    return this.#passports.get(passportId) ?? null;
  }

  issueLicense({
    passportId,
    licenseeAgentId,
    quota,
    licenseType = "per_call",
  }) {
    if (!this.#passports.has(passportId)) {
      throw new Error(`Unknown passport: ${passportId}`);
    }

    const licenseId = `lic_${digest(
      `${passportId}:${licenseeAgentId}:${randomUUID()}`,
    )}`;
    const license = {
      licenseId,
      passportId,
      licenseeAgentId,
      licenseType,
      quota,
      revoked: false,
      controlledDemo: true,
    };

    this.#licenses.set(licenseId, license);
    this.#quotaStates.set(licenseId, quota);
    return license;
  }

  getLicense(licenseId) {
    return this.#licenses.get(licenseId) ?? null;
  }

  getQuota(licenseId) {
    return this.#quotaStates.get(licenseId) ?? null;
  }

  saveQuota(licenseId, remaining) {
    if (!this.#licenses.has(licenseId)) {
      throw new Error(`Unknown license: ${licenseId}`);
    }
    this.#quotaStates.set(licenseId, remaining);
    return remaining;
  }

  createReceipt({
    passportId,
    licenseId,
    requesterAgentId,
    serviceId,
    request,
    result,
  }) {
    const receiptId = `rcpt_${digest(
      `${passportId}:${licenseId}:${requesterAgentId}:${randomUUID()}`,
    )}`;
    const receipt = {
      receiptId,
      passportId,
      licenseId,
      requesterAgentId,
      serviceId,
      requestHash: digest(JSON.stringify(request)),
      resultHash: digest(JSON.stringify(result)),
      status: "DELIVERED",
      controlledDemo: true,
    };

    this.#receipts.set(receiptId, receipt);
    return receipt;
  }

  getReceipt(receiptId) {
    return this.#receipts.get(receiptId) ?? null;
  }
}
