import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { compileBlif, evaluateNetlist } from "./compile-blif.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(directory, "../..");

function verifyCircuit(relativeDirectory, expected) {
  const circuitDirectory = path.join(
    repositoryRoot,
    "hackathons/tapeout-xlayer-2026/circuits",
    relativeDirectory,
  );
  const blifPath = path.join(
    circuitDirectory,
    `${relativeDirectory}.blif`,
  );
  const truthTablePath = path.join(circuitDirectory, "truth-table.csv");
  const compiled = compileBlif(fs.readFileSync(blifPath, "utf8"));

  assert.equal(compiled.nIn, expected.nIn);
  assert.equal(compiled.nOut, expected.nOut);
  assert.equal(compiled.nNand, expected.nNand);
  assert.equal(compiled.nLatch, expected.nLatch);
  assert.equal(compiled.bytes, expected.bytes);

  const [headerLine, ...rowLines] = fs
    .readFileSync(truthTablePath, "utf8")
    .trim()
    .split(/\r?\n/);
  const headers = headerLine.split(",");
  const inputNames = compiled.inputs;
  const outputNames = compiled.outputs;
  const latchNames = expected.latchNames ?? [];

  for (const rowLine of rowLines) {
    const values = rowLine.split(",").map(Number);
    const row = Object.fromEntries(
      headers.map((header, index) => [header, values[index]]),
    );
    const inputs = inputNames.map((name) => row[name]);
    const state = latchNames.map((name) => row[name]);
    const { outputs } = evaluateNetlist(compiled, inputs, state);
    const actual = Object.fromEntries(
      outputNames.map((name, index) => [name, outputs[index]]),
    );
    const expectedOutputs = Object.fromEntries(
      outputNames.map((name) => [name, row[name]]),
    );
    assert.deepEqual(actual, expectedOutputs);
  }

  return compiled;
}

const skillGate = verifyCircuit("skill-gate", {
  nIn: 9,
  nOut: 7,
  nNand: 62,
  nLatch: 0,
  bytes: 434,
});

const licenseQuota = verifyCircuit("license-quota-step", {
  nIn: 3,
  nOut: 7,
  nNand: 108,
  nLatch: 4,
  bytes: 772,
  latchNames: ["quota0", "quota1", "quota2", "quota3"],
});

console.log(
  JSON.stringify(
    {
      skillGate: {
        nNand: skillGate.nNand,
        nLatch: skillGate.nLatch,
        bytes: skillGate.bytes,
      },
      licenseQuota: {
        nNand: licenseQuota.nNand,
        nLatch: licenseQuota.nLatch,
        bytes: licenseQuota.bytes,
      },
    },
    null,
    2,
  ),
);
