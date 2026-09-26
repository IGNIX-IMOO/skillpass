import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import {
  Contract,
  Interface,
  JsonRpcProvider,
  getAddress,
  id,
  zeroPadValue,
} from "ethers";
import { runResearchToStory } from "./research-service.mjs";

const DEFAULT_REGISTRY =
  "0xD4B5E16316cB0472C5446Fef4bf3960ae451094B";
const DEFAULT_OWNER =
  "0x60fda8130b7341027147a1b88cd4c2a1af44ecd0";
const DEFAULT_RPC = "https://rpc.xlayer.tech";

const registryInterface = new Interface([
  "function createPassport(bytes32 passportId,bytes32 namespaceHash,bytes32 skillKeyHash,bytes32 versionHash,bytes32 creatorProof,address passportOwner,bytes32 serviceId,uint256 capabilityCircuitId)",
  "function issueLicense(bytes32 licenseId,bytes32 passportId,bytes32 licenseeAgentId,uint8 mode,uint16 quota,uint8 royaltyBucket)",
  "function revokeLicense(bytes32 licenseId)",
  "function recordQuotaStep(bytes32 licenseId,uint8 stateOut,bytes32 receiptId)",
  "function bindService(bytes32 serviceId,bytes32 passportId,bytes32 operatorAgentId,bytes32 endpointHash,bool available)",
  "function setServiceAvailability(bytes32 serviceId,bool available)",
  "function recordReceipt(bytes32 receiptId,bytes32 passportId,bytes32 licenseId,bytes32 serviceId,bytes32 requesterAgentId,bytes32 requestHash,bytes32 resultHash,bytes32 gateOutput,uint8 quotaStateOut,uint8 status)",
  "function getPassport(bytes32 passportId) view returns ((bytes32 namespaceHash,bytes32 skillKeyHash,bytes32 currentVersionHash,bytes32 creatorProof,address owner,bytes32 serviceId,uint256 capabilityCircuitId,uint8 status,uint64 updatedAt))",
  "function getLicense(bytes32 licenseId) view returns ((bytes32 passportId,bytes32 licenseeAgentId,uint8 mode,uint16 quotaRemaining,uint8 royaltyBucket,uint8 status,uint64 updatedAt))",
  "function getService(bytes32 serviceId) view returns ((bytes32 passportId,bytes32 operatorAgentId,bytes32 endpointHash,bool available,uint64 updatedAt))",
  "function getReceipt(bytes32 receiptId) view returns ((bytes32 passportId,bytes32 licenseId,bytes32 serviceId,bytes32 requesterAgentId,bytes32 requestHash,bytes32 resultHash,bytes32 gateOutput,uint8 quotaStateOut,uint8 status,uint64 createdAt))",
]);

const passportStatuses = ["DRAFT", "PUBLISHED", "PAUSED", "RETIRED"];

function nowIso() {
  return new Date().toISOString();
}

function bytes32(value) {
  const text = String(value);
  return /^0x[0-9a-fA-F]{64}$/.test(text) ? text : id(text);
}

function defaultMetadata() {
  return {
    version: 1,
    passports: [
      {
        key: "passport:research_to_story",
        namespace: "ignix.skillpass.demo",
        skillKey: "research_to_story",
        displayName: "Research to Story",
        version: "1.0.0",
        creatorAgentId: "agent_controlled_demo_creator",
        owner: "SkillPass Demo Creator",
        licenseMode: "per_call",
        serviceId: "service:research_to_story",
        capabilityCircuitId: "1",
      },
    ],
    licenses: [
      {
        key: "license:controlled_demo_buyer",
        passportKey: "passport:research_to_story",
        licenseeLabel: "SkillPass Demo Buyer",
      },
    ],
    services: [
      {
        key: "service:research_to_story",
        passportKey: "passport:research_to_story",
        name: "Research to Story",
        operatorLabel: "IMOO Service Operator",
        endpointReference: "controlled-demo://research-to-story",
        price: "0.001 OKB",
      },
    ],
    receipts: [
      {
        key: "receipt:controlled_demo_1",
        note: "Initial seeded receipt",
      },
    ],
  };
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback();
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporaryPath, filePath);
}

function proxyEnvironment() {
  const env = { ...process.env };
  if (env.HTTPS_PROXY || process.platform !== "darwin") {
    return env;
  }

  try {
    const output = spawnSync("scutil", ["--proxy"], {
      encoding: "utf8",
    }).stdout;
    const enabled = /HTTPEnable\s*:\s*1/.test(output);
    const host = /HTTPProxy\s*:\s*([^\s}]+)/.exec(output)?.[1];
    const port = /HTTPPort\s*:\s*(\d+)/.exec(output)?.[1];
    if (enabled && host && port) {
      const proxy = `http://${host}:${port}`;
      env.HTTP_PROXY = proxy;
      env.HTTPS_PROXY = proxy;
      env.ALL_PROXY = `socks5://${host}:${port}`;
    }
  } catch {
    // The wallet CLI will report its own connection error if no proxy exists.
  }
  return env;
}

export function createRegistryBridge({
  registryAddress = DEFAULT_REGISTRY,
  ownerAddress = DEFAULT_OWNER,
  rpcUrl = DEFAULT_RPC,
  metadataFile = path.resolve(".data/registry-metadata.json"),
  runCommand = spawnSync,
} = {}) {
  const provider = new JsonRpcProvider(rpcUrl, 196);
  const registry = new Contract(
    registryAddress,
    registryInterface,
    provider,
  );
  let metadataPromise;
  let writeQueue = Promise.resolve();

  async function loadMetadata() {
    if (!metadataPromise) {
      metadataPromise = readJson(metadataFile, defaultMetadata).then(
        async (value) => {
          if (value.version !== 1) {
            throw new Error("Unsupported registry metadata version");
          }
          return value;
        },
      );
    }
    return metadataPromise;
  }

  async function saveMetadata(metadata) {
    metadataPromise = Promise.resolve(metadata);
    await writeJson(metadataFile, metadata);
  }

  async function safeGet(method, key) {
    try {
      return await registry[method](id(key));
    } catch {
      return null;
    }
  }

  async function snapshot() {
    const metadata = structuredClone(await loadMetadata());
    const passports = [];
    const licenses = [];
    const services = [];
    const receipts = [];

    for (const item of metadata.passports) {
      const chain = await safeGet("getPassport", item.key);
      if (!chain || chain.owner === "0x0000000000000000000000000000000000000000") {
        continue;
      }
      passports.push({
        passportId: item.key,
        namespace: item.namespace,
        skillKey: item.skillKey,
        displayName: item.displayName,
        version: item.version,
        creatorAgentId: item.creatorAgentId,
        creatorProof: chain.creatorProof,
        owner: item.owner,
        status: passportStatuses[Number(chain.status)] ?? "DRAFT",
        licenseMode: item.licenseMode,
        serviceId: item.serviceId,
        capabilityCircuitId: chain.capabilityCircuitId.toString(),
        updatedAt: new Date(Number(chain.updatedAt) * 1000).toISOString(),
      });
    }

    for (const item of metadata.licenses) {
      const chain = await safeGet("getLicense", item.key);
      if (!chain || chain.passportId === zeroPadValue("0x00", 32)) {
        continue;
      }
      licenses.push({
        licenseId: item.key,
        passportId: item.passportKey,
        licenseeAgentId: item.licenseeLabel,
        mode: Number(chain.mode) === 0 ? "per_call" : "limited",
        quota: Number(chain.quotaRemaining),
        revoked: Number(chain.status) === 1,
        royaltyBucket: Number(chain.royaltyBucket),
        startsAt: new Date(Number(chain.updatedAt) * 1000).toISOString(),
        expiresAt: null,
      });
    }

    for (const item of metadata.services) {
      const chain = await safeGet("getService", item.key);
      if (!chain || chain.passportId === zeroPadValue("0x00", 32)) {
        continue;
      }
      services.push({
        serviceId: item.key,
        passportId: item.passportKey,
        operatorAgentId: item.operatorLabel,
        name: item.name,
        endpointReference: item.endpointReference,
        price: item.price,
        available: chain.available,
        successRate: 1,
      });
    }

    for (const item of metadata.receipts) {
      const chain = await safeGet("getReceipt", item.key);
      if (!chain || chain.passportId === zeroPadValue("0x00", 32)) {
        continue;
      }
      receipts.push({
        receiptId: item.key,
        passportId: metadata.passports.find(
          (passport) => id(passport.key) === chain.passportId,
        )?.key ?? chain.passportId,
        licenseId: metadata.licenses.find(
          (license) => id(license.key) === chain.licenseId,
        )?.key ?? chain.licenseId,
        requesterAgentId: item.requesterLabel ?? "Controlled Demo Buyer",
        serviceId: metadata.services.find(
          (service) => id(service.key) === chain.serviceId,
        )?.key ?? chain.serviceId,
        requestHash: chain.requestHash,
        resultHash: chain.resultHash,
        status: Number(chain.status) === 1 ? "DELIVERED" : "REJECTED",
        gateOutput: chain.gateOutput,
        quotaStateOut: `0x${Number(chain.quotaStateOut)
          .toString(16)
          .padStart(2, "0")}`,
        createdAt: new Date(Number(chain.createdAt) * 1000).toISOString(),
        note: item.note,
      });
    }

    return {
      source: "chain",
      registryAddress,
      registry: {
        version: 1,
        passports,
        licenses,
        services,
        receipts,
      },
    };
  }

  async function send(functionName, args) {
    const calldata = registryInterface.encodeFunctionData(functionName, args);
    const result = runCommand(
      "onchainos",
      [
        "wallet",
        "contract-call",
        "--chain",
        "xlayer",
        "--to",
        registryAddress,
        "--input-data",
        calldata,
        "--biz-type",
        "dapp",
        "--strategy",
        `skillpass-registry-${functionName}`,
      ],
      {
        encoding: "utf8",
        env: proxyEnvironment(),
        timeout: 90_000,
      },
    );

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || "Registry call failed");
    }

    const output = JSON.parse(result.stdout.trim());
    if (!output.ok || !output.data?.txHash) {
      throw new Error(JSON.stringify(output));
    }

    for (let attempt = 0; attempt < 45; attempt += 1) {
      const receipt = await provider.getTransactionReceipt(output.data.txHash);
      if (receipt) {
        if (receipt.status !== 1) {
          throw new Error(`Registry transaction reverted: ${output.data.txHash}`);
        }
        return {
          txHash: output.data.txHash,
          blockNumber: receipt.blockNumber,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    throw new Error(`Registry receipt timeout: ${output.data.txHash}`);
  }

  function enqueue(task) {
    const next = writeQueue.then(task, task);
    writeQueue = next.catch(() => {});
    return next;
  }

  const handlers = {
    "POST /api/registry/passport": async (body) => {
      const stamp = nowIso();
      await enqueue(() =>
        send("createPassport", [
          id(body.passportId),
          id(body.namespace),
          id(body.skillKey),
          id(body.version),
          bytes32(body.creatorProof),
          getAddress(body.ownerAddress),
          id(body.serviceId),
          BigInt(body.capabilityCircuitId),
        ]),
      );
      const metadata = await loadMetadata();
      metadata.passports.unshift({
        key: body.passportId,
        namespace: body.namespace,
        skillKey: body.skillKey,
        displayName: body.displayName,
        version: body.version,
        creatorAgentId: body.creatorAgentId,
        owner: body.owner,
        licenseMode: body.licenseMode,
        serviceId: body.serviceId,
        capabilityCircuitId: String(body.capabilityCircuitId),
        updatedAt: stamp,
      });
      await saveMetadata(metadata);
      return snapshot();
    },
    "POST /api/registry/license": async (body) => {
      await enqueue(() =>
        send("issueLicense", [
          id(body.licenseId),
          id(body.passportId),
          id(body.licenseeAgentId),
          0,
          Number(body.quota),
          Number(body.royaltyBucket ?? 0),
        ]),
      );
      const metadata = await loadMetadata();
      metadata.licenses.unshift({
        key: body.licenseId,
        passportKey: body.passportId,
        licenseeLabel: body.licenseeLabel ?? body.licenseeAgentId,
      });
      await saveMetadata(metadata);
      return snapshot();
    },
    "POST /api/registry/revoke": async (body) => {
      await enqueue(() => send("revokeLicense", [id(body.licenseId)]));
      return snapshot();
    },
    "POST /api/registry/quota": async (body) => {
      await enqueue(() =>
        send("recordQuotaStep", [
          id(body.licenseId),
          Number(body.stateOut),
          id(body.receiptId),
        ]),
      );
      return snapshot();
    },
    "POST /api/registry/service": async (body) => {
      await enqueue(() =>
        send("bindService", [
          id(body.serviceId),
          id(body.passportId),
          id(body.operatorAgentId),
          id(body.endpointReference),
          Boolean(body.available),
        ]),
      );
      const metadata = await loadMetadata();
      metadata.services.unshift({
        key: body.serviceId,
        passportKey: body.passportId,
        name: body.name,
        operatorLabel: body.operatorLabel ?? body.operatorAgentId,
        endpointReference: body.endpointReference,
        price: body.price,
      });
      await saveMetadata(metadata);
      return snapshot();
    },
    "POST /api/registry/service-availability": async (body) => {
      await enqueue(() =>
        send("setServiceAvailability", [
          id(body.serviceId),
          Boolean(body.available),
        ]),
      );
      return snapshot();
    },
    "POST /api/registry/receipt": async (body) => {
      await enqueue(() =>
        send("recordReceipt", [
          id(body.receiptId),
          id(body.passportId),
          id(body.licenseId),
          id(body.serviceId),
          id(body.requesterAgentId),
          bytes32(body.requestHash),
          bytes32(body.resultHash),
          zeroPadValue(body.gateOutput, 32),
          Number(body.quotaStateOut),
          body.status === "DELIVERED" ? 1 : 0,
        ]),
      );
      const metadata = await loadMetadata();
      metadata.receipts.unshift({
        key: body.receiptId,
        requesterLabel: body.requesterLabel ?? body.requesterAgentId,
        note: body.note,
      });
      await saveMetadata(metadata);
      return snapshot();
    },
    "POST /api/services/research-to-story": async (body) => {
      return runResearchToStory({
        topic: body.topic,
        sources: body.sources,
      });
    },
  };

  async function handle(req, res) {
    const url = new URL(req.url, "http://127.0.0.1");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");

    try {
      if (req.method === "GET" && url.pathname === "/api/registry/snapshot") {
        res.end(
          JSON.stringify({
            ok: true,
            data: await snapshot(),
          }),
        );
        return;
      }

      const handler = handlers[`${req.method} ${url.pathname}`];
      if (!handler) {
        res.statusCode = 404;
        res.end(JSON.stringify({ ok: false, error: "Not found" }));
        return;
      }

      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = chunks.length
        ? JSON.parse(Buffer.concat(chunks).toString("utf8"))
        : {};
      const data = await handler(body);
      res.end(JSON.stringify({ ok: true, data }));
    } catch (error) {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  return {
    handle,
    snapshot,
    registryAddress,
    ownerAddress,
  };
}
