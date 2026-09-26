import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const blifPath = path.join(
  directory,
  "skill-gate.blif",
);
const truthTablePath = path.join(directory, "truth-table.csv");
const testVectorsPath = path.join(directory, "test-vectors.json");

function expectedOutputs(bits) {
  const skillId =
    (bits.skill_id3 << 3) |
    (bits.skill_id2 << 2) |
    (bits.skill_id1 << 1) |
    bits.skill_id0;
  const licenseType = (bits.license_type1 << 1) | bits.license_type0;
  const allow =
    bits.skill_valid & bits.licensed & bits.service_available ? 1 : 0;
  const routeId = allow ? skillId : 0;
  const royaltyBucket = allow ? licenseType : 0;

  return {
    allow,
    route_id3: (routeId >> 3) & 1,
    route_id2: (routeId >> 2) & 1,
    route_id1: (routeId >> 1) & 1,
    route_id0: routeId & 1,
    royalty_bucket1: (royaltyBucket >> 1) & 1,
    royalty_bucket0: royaltyBucket & 1,
  };
}

function parseBlif(source) {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const inputs = [];
  const outputs = [];
  const cubes = [];
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

  return { inputs, outputs, cubes };
}

function cubeMatches(bitString, values) {
  for (let index = 0; index < bitString.length; index += 1) {
    const expected = bitString[index];
    if (expected !== "-" && Number(expected) !== values[index]) {
      return false;
    }
  }
  return true;
}

function evaluateBlif(model, stimulus) {
  if (stimulus.length !== model.inputs.length) {
    throw new Error(`Expected ${model.inputs.length} inputs`);
  }

  const values = [...stimulus];
  const indexByName = new Map(
    model.inputs.map((name, index) => [name, index]),
  );
  const remaining = [...model.cubes];

  while (remaining.length > 0) {
    let progressed = false;

    for (let cubeIndex = remaining.length - 1; cubeIndex >= 0; cubeIndex -= 1) {
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
    }

    if (!progressed) {
      throw new Error(
        `Could not resolve BLIF cubes: ${remaining
          .map((cube) => cube.output)
          .join(", ")}`,
      );
    }
  }

  return Object.fromEntries(
    model.outputs.map((name) => [name, values[indexByName.get(name)]]),
  );
}

function allInputCombinations() {
  const combinations = [];
  for (let value = 0; value < 2 ** 9; value += 1) {
    combinations.push({
      skill_id3: (value >> 8) & 1,
      skill_id2: (value >> 7) & 1,
      skill_id1: (value >> 6) & 1,
      skill_id0: (value >> 5) & 1,
      skill_valid: (value >> 4) & 1,
      licensed: (value >> 3) & 1,
      service_available: (value >> 2) & 1,
      license_type1: (value >> 1) & 1,
      license_type0: value & 1,
    });
  }
  return combinations;
}

const model = parseBlif(fs.readFileSync(blifPath, "utf8"));
const combinations = allInputCombinations();
const failures = [];

for (const bits of combinations) {
  const stimulus = model.inputs.map((name) => bits[name]);
  const actual = evaluateBlif(model, stimulus);
  const expected = expectedOutputs(bits);

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push({ bits, actual, expected });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify(failures.slice(0, 5), null, 2));
  throw new Error(`BLIF verification failed for ${failures.length} vectors`);
}

const headers = [...model.inputs, ...model.outputs];
const rows = combinations.map((bits) => {
  const output = expectedOutputs(bits);
  return headers.map((name) => bits[name] ?? output[name]).join(",");
});

fs.writeFileSync(
  truthTablePath,
  `${headers.join(",")}\n${rows.join("\n")}\n`,
);

const selected = [
  {
    name: "allow_research_to_story",
    bits: {
      skill_id3: 1,
      skill_id2: 1,
      skill_id1: 0,
      skill_id0: 1,
      skill_valid: 1,
      licensed: 1,
      service_available: 1,
      license_type1: 0,
      license_type0: 1,
    },
  },
  {
    name: "reject_missing_license",
    bits: {
      skill_id3: 1,
      skill_id2: 0,
      skill_id1: 0,
      skill_id0: 0,
      skill_valid: 1,
      licensed: 0,
      service_available: 1,
      license_type1: 1,
      license_type0: 1,
    },
  },
  {
    name: "reject_invalid_skill",
    bits: {
      skill_id3: 0,
      skill_id2: 1,
      skill_id1: 1,
      skill_id0: 1,
      skill_valid: 0,
      licensed: 1,
      service_available: 1,
      license_type1: 0,
      license_type0: 0,
    },
  },
  {
    name: "reject_service_unavailable",
    bits: {
      skill_id3: 1,
      skill_id2: 1,
      skill_id1: 0,
      skill_id0: 0,
      skill_valid: 1,
      licensed: 1,
      service_available: 0,
      license_type1: 1,
      license_type0: 0,
    },
  },
];

const vectors = selected.map(({ name, bits }) => {
  const stimulus = model.inputs.map((inputName) => bits[inputName]);
  return {
    name,
    inputs: bits,
    expected: expectedOutputs(bits),
    blif: evaluateBlif(model, stimulus),
  };
});

fs.writeFileSync(testVectorsPath, `${JSON.stringify(vectors, null, 2)}\n`);

console.log(
  `Verified ${combinations.length} input combinations with ${model.cubes.length} BLIF cubes.`,
);
console.log(`Wrote ${path.basename(truthTablePath)} and ${path.basename(testVectorsPath)}.`);
