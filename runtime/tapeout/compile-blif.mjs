import fs from "node:fs";

const NAND = 0;
const LATCH = 1;

function parseBlif(source) {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean);

  const model = {
    name: "imported",
    inputs: [],
    outputs: [],
    cells: [],
  };
  let currentNames = null;
  let ended = false;

  for (const line of lines) {
    const parts = line.split(/\s+/);
    const head = parts[0];

    if (head === ".model") {
      model.name = parts[1] || "imported";
      continue;
    }

    if (head === ".inputs") {
      model.inputs.push(...parts.slice(1));
      continue;
    }

    if (head === ".outputs") {
      model.outputs.push(...parts.slice(1));
      continue;
    }

    if (head === ".names") {
      const names = parts.slice(1);
      if (names.length < 1) {
        throw new Error(".names requires at least one signal");
      }
      currentNames = {
        kind: "names",
        inputs: names.slice(0, -1),
        output: names.at(-1),
        cubes: [],
      };
      model.cells.push(currentNames);
      continue;
    }

    if (head === ".latch") {
      if (parts.length < 3) {
        throw new Error(".latch requires an input and output");
      }
      model.cells.push({
        kind: "latch",
        input: parts[1],
        output: parts[2],
      });
      currentNames = null;
      continue;
    }

    if (head === ".end") {
      ended = true;
      currentNames = null;
      continue;
    }

    if (head.startsWith(".")) {
      currentNames = null;
      continue;
    }

    if (!currentNames) {
      throw new Error(`Unexpected BLIF content: ${line}`);
    }

    const pattern = currentNames.inputs.length === 0 ? "" : parts[0];
    const output = currentNames.inputs.length === 0 ? parts[0] : parts[1];

    if (currentNames.inputs.length > 0 && parts.length !== 2) {
      throw new Error(`Invalid truth-table row: ${line}`);
    }
    if (output !== "0" && output !== "1") {
      throw new Error(`Invalid output value: ${line}`);
    }
    if (pattern.length !== currentNames.inputs.length) {
      throw new Error(`Pattern length mismatch: ${line}`);
    }

    currentNames.cubes.push({
      pattern,
      output: output === "1",
    });
  }

  if (!ended) {
    throw new Error("BLIF is missing .end");
  }
  if (model.inputs.length === 0 || model.outputs.length === 0) {
    throw new Error("BLIF must declare inputs and outputs");
  }

  return model;
}

function allocateSignal(context) {
  return context.nextSignal++;
}

function pushNand(context, a, b) {
  const out = allocateSignal(context);
  context.elements.push({ op: NAND, a, b, out });
  return out;
}

function invert(context, signal) {
  return pushNand(context, signal, signal);
}

function andSignal(context, left, right) {
  return invert(context, pushNand(context, left, right));
}

function orSignal(context, left, right) {
  return pushNand(context, invert(context, left), invert(context, right));
}

function compileNamesCell(context, cell) {
  const positive = cell.cubes.filter((cube) => cube.output);
  const negative = cell.cubes.filter((cube) => !cube.output);

  if (positive.length > 0 && negative.length > 0) {
    throw new Error(`Mixed polarity cubes are not supported for ${cell.output}`);
  }

  const selected = negative.length > 0 ? negative : positive;
  const invertResult = negative.length > 0;

  if (selected.length === 0) {
    return 0;
  }

  const cubes = selected.map((cube) => {
    const literals = [];

    for (let index = 0; index < cell.inputs.length; index += 1) {
      const pattern = cube.pattern[index];
      if (pattern === "-") {
        continue;
      }

      const signal = context.signalByName.get(cell.inputs[index]);
      if (signal === undefined) {
        throw new Error(`Undefined signal: ${cell.inputs[index]}`);
      }

      literals.push(pattern === "1" ? signal : invert(context, signal));
    }

    if (literals.length === 0) {
      return 1;
    }

    return literals
      .slice(1)
      .reduce((left, right) => andSignal(context, left, right), literals[0]);
  });

  const result = cubes
    .slice(1)
    .reduce((left, right) => orSignal(context, left, right), cubes[0]);

  return invertResult ? invert(context, result) : result;
}

function serialize(elements) {
  const bytes = [];

  const pushU24 = (value) => {
    if (!Number.isInteger(value) || value < 0 || value > 0xffffff) {
      throw new Error(`Signal is outside u24 range: ${value}`);
    }
    bytes.push((value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
  };

  for (const element of elements) {
    if (element.op === NAND) {
      bytes.push(NAND);
      pushU24(element.a);
      pushU24(element.b);
      continue;
    }

    if (element.op === LATCH) {
      bytes.push(LATCH);
      pushU24(element.d);
      continue;
    }

    throw new Error(`Unknown element opcode: ${element.op}`);
  }

  return Uint8Array.from(bytes);
}

export function compileBlif(source) {
  const model = parseBlif(source);
  const context = {
    elements: [],
    nextSignal: 2 + model.inputs.length,
    signalByName: new Map(),
  };

  model.inputs.forEach((name, index) => {
    context.signalByName.set(name, 2 + index);
  });

  const latches = model.cells.filter((cell) => cell.kind === "latch");
  for (const latch of latches) {
    if (context.signalByName.has(latch.output)) {
      throw new Error(`Duplicate signal: ${latch.output}`);
    }
    const output = allocateSignal(context);
    context.signalByName.set(latch.output, output);
    context.elements.push({ op: LATCH, d: null, out: output });
  }

  const namesCells = model.cells.filter((cell) => cell.kind === "names");
  const pending = new Map();
  const dependents = new Map();

  for (const cell of namesCells) {
    const unresolved = cell.inputs.filter(
      (name) => !context.signalByName.has(name),
    );
    pending.set(cell, new Set(unresolved));
    for (const name of unresolved) {
      if (!dependents.has(name)) {
        dependents.set(name, []);
      }
      dependents.get(name).push(cell);
    }
  }

  const ready = namesCells.filter((cell) => pending.get(cell).size === 0);
  let processed = 0;

  while (ready.length > 0) {
    const cell = ready.pop();
    const output = compileNamesCell(context, cell);
    context.signalByName.set(cell.output, output);
    processed += 1;

    for (const dependent of dependents.get(cell.output) ?? []) {
      const unresolved = pending.get(dependent);
      unresolved.delete(cell.output);
      if (unresolved.size === 0) {
        ready.push(dependent);
      }
    }
  }

  if (processed !== namesCells.length) {
    throw new Error("BLIF contains a combinational loop or undefined signal");
  }

  for (const latch of latches) {
    const element = context.elements.find(
      (candidate) =>
        candidate.op === LATCH &&
        candidate.out === context.signalByName.get(latch.output),
    );
    element.d = context.signalByName.get(latch.input);
    if (element.d === undefined) {
      throw new Error(`Undefined latch input: ${latch.input}`);
    }
  }

  const outputSignals = model.outputs.map((outputName) => {
    const signal = context.signalByName.get(outputName);
    if (signal === undefined) {
      throw new Error(`Undefined output: ${outputName}`);
    }
    return signal;
  });
  const firstBuffers = outputSignals.map((signal) =>
    pushNand(context, signal, signal),
  );
  for (const first of firstBuffers) {
    pushNand(context, first, first);
  }

  const netlist = serialize(context.elements);
  const nNand = context.elements.filter((element) => element.op === NAND).length;
  const nLatch = context.elements.filter(
    (element) => element.op === LATCH,
  ).length;

  return {
    model: model.name,
    inputs: model.inputs,
    outputs: model.outputs,
    elements: context.elements,
    nIn: model.inputs.length,
    nOut: model.outputs.length,
    nNand,
    nLatch,
    nSignals: context.nextSignal,
    bytes: netlist.length,
    netlist,
    netlistHex: `0x${Buffer.from(netlist).toString("hex")}`,
  };
}

export function evaluateNetlist(compiled, inputBits, stateBits = []) {
  const signals = new Uint8Array(compiled.nSignals);
  signals[0] = 0;
  signals[1] = 1;
  compiled.inputs.forEach((_, index) => {
    signals[2 + index] = inputBits[index] ? 1 : 0;
  });

  const nextState = new Uint8Array(compiled.nLatch);
  let latchIndex = 0;

  for (const element of compiled.elements) {
    if (element.op === NAND) {
      signals[element.out] = signals[element.a] & signals[element.b] ? 0 : 1;
      continue;
    }

    signals[element.out] = stateBits[latchIndex] ? 1 : 0;
    latchIndex += 1;
  }

  latchIndex = 0;
  for (const element of compiled.elements) {
    if (element.op !== LATCH) {
      continue;
    }
    nextState[latchIndex] = signals[element.d];
    latchIndex += 1;
  }

  const outputStart = compiled.nSignals - compiled.nOut;
  const outputs = Array.from(
    { length: compiled.nOut },
    (_, index) => signals[outputStart + index],
  );

  return { outputs, nextState };
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: node compile-blif.mjs <file.blif>");
    process.exit(1);
  }

  const compiled = compileBlif(fs.readFileSync(path, "utf8"));
  console.log(
    JSON.stringify(
      {
        model: compiled.model,
        inputs: compiled.inputs,
        outputs: compiled.outputs,
        nIn: compiled.nIn,
        nOut: compiled.nOut,
        nNand: compiled.nNand,
        nLatch: compiled.nLatch,
        bytes: compiled.bytes,
        netlistHex: compiled.netlistHex,
      },
      null,
      2,
    ),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
