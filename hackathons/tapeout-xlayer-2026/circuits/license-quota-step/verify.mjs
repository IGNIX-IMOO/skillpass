import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const blifPath = path.join(directory, "license-quota-step.blif");
const truthTablePath = path.join(directory, "truth-table.csv");
const testVectorsPath = path.join(directory, "test-vectors.json");

function bitsToInt(bits, names) {
  return names.reduce((value, name) => (value << 1) | bits[name], 0);
}

function expected(bits) {
  const quota = bitsToInt(bits, [
    "quota3",
    "quota2",
    "quota1",
    "quota0",
  ]);
  const active = bits.license_valid & bits.service_available;
  const validQuota = quota > 0;
  const allow = active & validQuota;
  const decrement = allow & bits.consume;
  const remaining = decrement ? quota - 1 : quota;
  let denyReason = 0;

  if (!bits.license_valid) {
    denyReason = 1;
  } else if (!bits.service_available) {
    denyReason = 2;
  } else if (!validQuota) {
    denyReason = 3;
  }

  return {
    allow,
    deny_reason1: (denyReason >> 1) & 1,
    deny_reason0: denyReason & 1,
    remaining3: (remaining >> 3) & 1,
    remaining2: (remaining >> 2) & 1,
    remaining1: (remaining >> 1) & 1,
    remaining0: remaining & 1,
  };
}

function parseBlif(source) {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean);

  const inputs = [];
  const outputs = [];
  const cubes = [];
  const latches = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith(".inputs ")) {
      inputs.push(...line.slice(8).trim().split(/\s+/));
      continue;
    }

    if (line.startsWith(".outputs ")) {
      outputs.push(...line.slice(9).trim().split(/\s+/));
      continue;
    }

    if (line.startsWith(".latch ")) {
      const parts = line.split(/\s+/);
      if (parts.length < 3) {
        throw new Error(`Invalid latch: ${line}`);
      }
      latches.push({ d: parts[1], q: parts[2] });
      continue;
    }

    if (line.startsWith(".names")) {
      const names = line.split(/\s+/).slice(1);
      current = {
        inputs: names.slice(0, -1),
        output: names.at(-1),
        cover: [],
      };
      cubes.push(current);
      continue;
    }

    if (line.startsWith(".")) {
      current = null;
      continue;
    }

    if (!current) {
      throw new Error(`Unexpected BLIF content: ${line}`);
    }

    const parts = line.split(/\s+/);
    current.cover.push({
      match: parts.slice(0, -1).join(""),
      output: parts.at(-1),
    });
  }

  return { inputs, outputs, cubes, latches };
}

function cubeMatches(pattern, values) {
  for (let index = 0; index < pattern.length; index += 1) {
    const expectedBit = pattern[index];
    if (expectedBit !== "-" && Number(expectedBit) !== values[index]) {
      return false;
    }
  }
  return true;
}

function evaluate(model, bits) {
  const values = model.inputs.map((name) => bits[name]);
  const indexByName = new Map(
    model.inputs.map((name, index) => [name, index]),
  );

  for (const latch of model.latches) {
    values.push(bits[latch.q]);
    indexByName.set(latch.q, values.length - 1);
  }

  const remaining = [...model.cubes];

  while (remaining.length > 0) {
    let progressed = false;

    for (let cubeIndex = 0; cubeIndex < remaining.length; cubeIndex += 1) {
      const cube = remaining[cubeIndex];
      const inputIndices = cube.inputs.map((name) => indexByName.get(name));

      if (inputIndices.some((index) => index === undefined)) {
        continue;
      }

      const cubeValues = inputIndices.map((index) => values[index]);
      const output = cube.cover.some(
        (entry) =>
          cubeMatches(entry.match, cubeValues) && entry.output === "1",
      )
        ? 1
        : 0;

      values.push(output);
      indexByName.set(cube.output, values.length - 1);
      remaining.splice(cubeIndex, 1);
      progressed = true;
      break;
    }

    if (!progressed) {
      throw new Error(
        `Unresolved signals: ${remaining.map((cube) => cube.output).join(", ")}`,
      );
    }
  }

  const output = Object.fromEntries(
    model.outputs.map((name) => [name, values[indexByName.get(name)]]),
  );
  const stateOut = model.latches.map((latch) => values[indexByName.get(latch.d)]);

  return { output, stateOut };
}

function allInputCombinations() {
  const combinations = [];

  for (let quota = 0; quota < 16; quota += 1) {
    for (let control = 0; control < 8; control += 1) {
      combinations.push({
        quota3: (quota >> 3) & 1,
        quota2: (quota >> 2) & 1,
        quota1: (quota >> 1) & 1,
        quota0: quota & 1,
        consume: (control >> 2) & 1,
        license_valid: (control >> 1) & 1,
        service_available: control & 1,
      });
    }
  }

  return combinations;
}

const model = parseBlif(fs.readFileSync(blifPath, "utf8"));
const combinations = allInputCombinations();
const failures = [];

for (const bits of combinations) {
  const result = evaluate(model, bits);
  const expectedResult = expected(bits);
  const expectedState = [
    expectedResult.remaining0,
    expectedResult.remaining1,
    expectedResult.remaining2,
    expectedResult.remaining3,
  ];

  if (
    JSON.stringify(result.output) !== JSON.stringify(expectedResult) ||
    JSON.stringify(result.stateOut) !== JSON.stringify(expectedState)
  ) {
    failures.push({ bits, result, expectedResult, expectedState });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify(failures.slice(0, 5), null, 2));
  throw new Error(`Verification failed for ${failures.length} vectors`);
}

const headers = [
  "quota3",
  "quota2",
  "quota1",
  "quota0",
  "consume",
  "license_valid",
  "service_available",
  "allow",
  "deny_reason1",
  "deny_reason0",
  "remaining3",
  "remaining2",
  "remaining1",
  "remaining0",
];

const rows = combinations.map((bits) => {
  const output = expected(bits);
  return headers.map((name) => bits[name] ?? output[name]).join(",");
});

fs.writeFileSync(
  truthTablePath,
  `${headers.join(",")}\n${rows.join("\n")}\n`,
);

const selected = [
  {
    name: "consume_one",
    bits: {
      quota3: 0,
      quota2: 1,
      quota1: 0,
      quota0: 1,
      consume: 1,
      license_valid: 1,
      service_available: 1,
    },
  },
  {
    name: "probe_only",
    bits: {
      quota3: 0,
      quota2: 0,
      quota1: 1,
      quota0: 1,
      consume: 0,
      license_valid: 1,
      service_available: 1,
    },
  },
  {
    name: "invalid_license",
    bits: {
      quota3: 0,
      quota2: 1,
      quota1: 0,
      quota0: 0,
      consume: 1,
      license_valid: 0,
      service_available: 1,
    },
  },
  {
    name: "service_unavailable",
    bits: {
      quota3: 0,
      quota2: 1,
      quota1: 0,
      quota0: 0,
      consume: 1,
      license_valid: 1,
      service_available: 0,
    },
  },
  {
    name: "quota_exhausted",
    bits: {
      quota3: 0,
      quota2: 0,
      quota1: 0,
      quota0: 0,
      consume: 1,
      license_valid: 1,
      service_available: 1,
    },
  },
];

const vectors = selected.map(({ name, bits }) => {
  const result = evaluate(model, bits);
  return {
    name,
    inputs: bits,
    expected: expected(bits),
    blif: result.output,
    stateOut: result.stateOut,
  };
});

fs.writeFileSync(testVectorsPath, `${JSON.stringify(vectors, null, 2)}\n`);

console.log(
  `Verified ${combinations.length} input combinations with ${model.cubes.length} combinational cubes and ${model.latches.length} latches.`,
);
console.log(`Wrote ${path.basename(truthTablePath)} and ${path.basename(testVectorsPath)}.`);
