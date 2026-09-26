import { spawnSync } from "node:child_process";
import {
  Contract,
  Interface,
  JsonRpcProvider,
  getAddress,
  id,
  zeroPadValue,
} from "ethers";
import { compileTrustRegistry } from "./compile.mjs";

const registryAddress =
  process.env.SKILLPASS_REGISTRY_ADDRESS ??
  "0xD4B5E16316cB0472C5446Fef4bf3960ae451094B";
const owner = getAddress(
  process.env.SKILLPASS_REGISTRY_OWNER ??
    "0x60fda8130b7341027147a1b88cd4c2a1af44ecd0",
);
const rpcUrl = process.env.XLAYER_RPC_URL ?? "https://rpc.xlayer.tech";
const provider = new JsonRpcProvider(rpcUrl, 196);
const artifact = compileTrustRegistry();
const iface = new Interface(artifact.abi);
const registry = new Contract(registryAddress, artifact.abi, provider);

const ids = {
  passportId: id("passport:research_to_story"),
  namespaceHash: id("namespace:ignix.skillpass.demo"),
  skillKeyHash: id("skill:research_to_story"),
  versionHash: id("version:1.0.0"),
  creatorProof: id("creator:controlled_demo"),
  serviceId: id("service:research_to_story"),
  licenseId: id("license:controlled_demo_buyer"),
  buyerAgentId: id("agent:controlled_demo_buyer"),
  operatorAgentId: id("agent:imoo_operator"),
  endpointHash: id("endpoint:controlled-demo"),
  receiptId: id("receipt:controlled_demo_1"),
  requestHash: id("request:why-agent-skills-need-licenses"),
  resultHash: id("result:research-to-story-demo"),
};

async function exists(promise) {
  try {
    await promise;
    return true;
  } catch {
    return false;
  }
}

async function waitForReceipt(txHash) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt) {
      if (receipt.status !== 1) {
        throw new Error(`Transaction reverted: ${txHash}`);
      }
      return receipt;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Receipt timeout: ${txHash}`);
}

async function send(functionName, args) {
  const calldata = iface.encodeFunctionData(functionName, args);
  const result = spawnSync(
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
      env: process.env,
    },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Registry call failed");
  }

  const output = JSON.parse(result.stdout.trim());
  if (!output.ok || !output.data?.txHash) {
    throw new Error(JSON.stringify(output));
  }

  await waitForReceipt(output.data.txHash);
  return output.data.txHash;
}

const transactions = [];

if (!(await exists(registry.getPassport(ids.passportId)))) {
  transactions.push([
    "createPassport",
    await send("createPassport", [
      ids.passportId,
      ids.namespaceHash,
      ids.skillKeyHash,
      ids.versionHash,
      ids.creatorProof,
      owner,
      ids.serviceId,
      1,
    ]),
  ]);
}

if (!(await exists(registry.getLicense(ids.licenseId)))) {
  transactions.push([
    "issueLicense",
    await send("issueLicense", [
      ids.licenseId,
      ids.passportId,
      ids.buyerAgentId,
      0,
      3,
      0,
    ]),
  ]);
}

if (!(await exists(registry.getService(ids.serviceId)))) {
  transactions.push([
    "bindService",
    await send("bindService", [
      ids.serviceId,
      ids.passportId,
      ids.operatorAgentId,
      ids.endpointHash,
      true,
    ]),
  ]);
}

const currentLicense = await registry.getLicense(ids.licenseId);
if (currentLicense.quotaRemaining === 3n) {
  transactions.push([
    "recordQuotaStep",
    await send("recordQuotaStep", [ids.licenseId, 2, ids.receiptId]),
  ]);
}

if (!(await exists(registry.getReceipt(ids.receiptId)))) {
  transactions.push([
    "recordReceipt",
    await send("recordReceipt", [
      ids.receiptId,
      ids.passportId,
      ids.licenseId,
      ids.serviceId,
      ids.buyerAgentId,
      ids.requestHash,
      ids.resultHash,
      zeroPadValue("0x37", 32),
      2,
      1,
    ]),
  ]);
}

console.log(
  JSON.stringify(
    {
      registryAddress,
      owner,
      transactions,
      passportId: ids.passportId,
      licenseId: ids.licenseId,
      serviceId: ids.serviceId,
      receiptId: ids.receiptId,
    },
    null,
    2,
  ),
);
