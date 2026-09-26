import { useCallback, useEffect, useState } from "react";
import type { CallReceipt, RegistryState, SkillPassport } from "../types";
import { DEMO_AGENTS, DEMO_OWNER_ADDRESS } from "../config";
import {
  createPassport as createLocalPassport,
  createReceipt as createLocalReceipt,
  issueLicense as issueLocalLicense,
  loadRegistry,
  resetRegistry,
  revokeLicense as revokeLocalLicense,
  saveRegistry,
  saveQuota as saveLocalQuota,
  toggleServiceAvailability,
  transferPassportOwnership as transferLocalPassportOwnership,
} from "../lib/registry";

type RegistrySource = "loading" | "chain" | "local";

function localId(prefix: string) {
  return `${prefix}:${crypto.randomUUID()}`;
}

export function useRegistry() {
  const [registry, setRegistry] = useState<RegistryState>(() => loadRegistry());
  const [source, setSource] = useState<RegistrySource>("loading");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/registry/snapshot");
      if (!response.ok) {
        throw new Error("Chain registry bridge unavailable");
      }
      const payload = await response.json();
      setRegistry(payload.data.registry as RegistryState);
      setSource("chain");
      setError("");
    } catch {
      setRegistry(loadRegistry());
      setSource("local");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const chainWrite = useCallback(
    async (endpoint: string, body: Record<string, unknown>) => {
      if (source !== "chain") {
        return false;
      }
      setPending(true);
      setError("");
      try {
        const response = await fetch(`/api/registry/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Registry write failed");
        }
        setRegistry(payload.data.registry as RegistryState);
        return true;
      } catch (writeError) {
        setError(
          writeError instanceof Error ? writeError.message : String(writeError),
        );
        return false;
      } finally {
        setPending(false);
      }
    },
    [source],
  );

  const mutateLocal = useCallback((action: (state: RegistryState) => void) => {
    setRegistry((current) => {
      const next = structuredClone(current);
      action(next);
      return next;
    });
  }, []);

  const createPassport = useCallback(
    async (
      input: Omit<SkillPassport, "passportId" | "creatorProof" | "updatedAt">,
    ) => {
      if (source === "chain") {
        return chainWrite("passport", {
          passportId: `passport:${input.skillKey}`,
          namespace: input.namespace,
          skillKey: input.skillKey,
          displayName: input.displayName,
          version: input.version,
          creatorProof: `creator:${input.creatorAgentId}`,
          ownerAddress: DEMO_OWNER_ADDRESS,
          creatorAgentId: input.creatorAgentId,
          owner: input.owner,
          licenseMode: input.licenseMode,
          serviceId: input.serviceId,
          capabilityCircuitId: input.capabilityCircuitId,
        });
      }
      mutateLocal((state) => createLocalPassport(state, input));
      return true;
    },
    [chainWrite, mutateLocal, source],
  );

  const issueLicense = useCallback(
    async (passportId: string, agentId: string, quota = 3) => {
      if (source === "chain") {
        return chainWrite("license", {
          licenseId: localId("license"),
          passportId,
          licenseeAgentId: agentId,
          licenseeLabel: DEMO_AGENTS.buyer.displayName,
          quota,
          royaltyBucket: 0,
        });
      }
      mutateLocal((state) => issueLocalLicense(state, passportId, agentId, quota));
      return true;
    },
    [chainWrite, mutateLocal, source],
  );

  const revokeLicense = useCallback(
    async (licenseId: string) => {
      if (source === "chain") {
        return chainWrite("revoke", { licenseId });
      }
      mutateLocal((state) => revokeLocalLicense(state, licenseId));
      return true;
    },
    [chainWrite, mutateLocal, source],
  );

  const updateQuota = useCallback(
    async (licenseId: string, stateOut: number, receiptId: string) => {
      if (source === "chain") {
        return chainWrite("quota", { licenseId, stateOut, receiptId });
      }
      mutateLocal((state) => saveLocalQuota(state, licenseId, stateOut));
      return true;
    },
    [chainWrite, mutateLocal, source],
  );

  const addReceipt = useCallback(
    async (
      input: Omit<CallReceipt, "receiptId" | "createdAt">,
      receiptId = localId("receipt"),
    ) => {
      if (source === "chain") {
        return chainWrite("receipt", {
          receiptId,
          ...input,
          requesterLabel: DEMO_AGENTS.buyer.displayName,
        });
      }
      mutateLocal((state) =>
        createLocalReceipt(state, {
          ...input,
          receiptId,
          requesterAgentId: DEMO_AGENTS.buyer.displayName,
        }),
      );
      return true;
    },
    [chainWrite, mutateLocal, source],
  );

  const toggleService = useCallback(
    async (serviceId: string) => {
      if (source === "chain") {
        const service = registry.services.find(
          (item) => item.serviceId === serviceId,
        );
        return chainWrite("service-availability", {
          serviceId,
          available: !service?.available,
        });
      }
      mutateLocal((state) => toggleServiceAvailability(state, serviceId));
      return true;
    },
    [chainWrite, mutateLocal, registry.services, source],
  );

  const transferPassportOwnership = useCallback(
    (passportId: string, newOwner: string) => {
      if (source === "chain") {
        setError(
          "Ownership transfer is available in the local competition demo only.",
        );
        return false;
      }
      mutateLocal((state) =>
        transferLocalPassportOwnership(state, passportId, newOwner),
      );
      return true;
    },
    [mutateLocal, source],
  );

  const replace = useCallback(
    (state: RegistryState) => {
      setRegistry(state);
      if (source === "local") {
        saveRegistry(state);
      }
    },
    [source],
  );

  return {
    registry,
    source,
    error,
    pending,
    refresh,
    replace,
    createPassport,
    issueLicense,
    revokeLicense,
    updateQuota,
    addReceipt,
    toggleService,
    transferPassportOwnership,
    reset: () => {
      if (source === "local") {
        setRegistry(resetRegistry());
      }
    },
  };
}

export type RegistryApi = ReturnType<typeof useRegistry>;
