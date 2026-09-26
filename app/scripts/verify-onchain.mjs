// Read-only verification that the taped-out Circuits are live on X Layer and
// still return the values recorded in the deployment notes.
//
//   npm run verify:onchain
//
// It never signs or sends anything. Addresses and circuit ids are read from
// src/config.ts so this script cannot drift from the app it is checking.

import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { Contract, JsonRpcProvider } from "ethers";

const configSource = readFileSync(new URL("../src/config.ts", import.meta.url), "utf8");

function fromConfig(key) {
  const match = configSource.match(new RegExp(`${key}:\\s*"([^"]+)"`));
  assert.ok(match, `src/config.ts does not define ${key}`);
  return match[1];
}

function fromConfigNumber(key) {
  const match = configSource.match(new RegExp(`${key}:\\s*(\\d+)`));
  assert.ok(match, `src/config.ts does not define ${key}`);
  return Number(match[1]);
}

const rpcUrl = fromConfig("rpcUrl");
const chainId = fromConfigNumber("chainId");
const processorAddress = fromConfig("processorAddress");
const trustRegistryAddress = fromConfig("trustRegistryAddress");
const skillGateId = fromConfigNumber("skillGateCircuitId");
const licenseQuotaId = fromConfigNumber("licenseQuotaCircuitId");

// Expected values come from the deployment notes and the Circuit truth tables,
// not from the app: the whole point is to catch the app drifting from them.
const skillGateCases = [
  { name: "allow_research_to_story", input: "0xfb00", output: "0x37" },
  { name: "reject_missing_license", input: "0xd100", output: "0x00" },
];
const licenseQuotaCase = {
  name: "consume_one",
  stateIn: "0x03",
  input: "0x07",
  stateOut: "0x02",
  output: "0x21",
};

const provider = new JsonRpcProvider(rpcUrl, chainId);
const processor = new Contract(
  processorAddress,
  [
    "function eval(uint256 circuitId, bytes input) view returns (bytes output)",
    "function step(uint256 circuitId, bytes stateIn, bytes input) view returns (bytes stateOut, bytes output)",
  ],
  provider,
);

const failures = [];
function check(label, actual, expected) {
  const ok = String(actual).toLowerCase() === String(expected).toLowerCase();
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(34)} ${actual}   expected ${expected}`);
  if (!ok) failures.push(label);
}

console.log(`X Layer on-chain verification · chain ${chainId} · ${rpcUrl}`);

const network = await provider.getNetwork();
assert.equal(Number(network.chainId), chainId, "RPC chain id does not match config");

for (const [label, address] of [
  ["Processor", processorAddress],
  ["TrustRegistry", trustRegistryAddress],
]) {
  const code = await provider.getCode(address);
  const deployed = code !== "0x";
  console.log(`  ${deployed ? "ok  " : "FAIL"}  ${label.padEnd(34)} ${address} (${(code.length - 2) / 2} bytes)`);
  if (!deployed) failures.push(`${label} bytecode missing`);
}

console.log(`\nCircuit ${skillGateId} · Skill Gate`);
for (const item of skillGateCases) {
  const output = await processor.eval(skillGateId, item.input);
  check(`${item.name} ${item.input}`, output, item.output);
}

console.log(`\nCircuit ${licenseQuotaId} · License Quota`);
const [stateOut, output] = await processor.step(
  licenseQuotaId,
  licenseQuotaCase.stateIn,
  licenseQuotaCase.input,
);
check(
  `${licenseQuotaCase.name} stateOut`,
  stateOut,
  licenseQuotaCase.stateOut,
);
check(`${licenseQuotaCase.name} output`, output, licenseQuotaCase.output);

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:`);
  for (const item of failures) console.error(`  - ${item}`);
  process.exit(1);
}

console.log("\nAll on-chain checks passed.");
