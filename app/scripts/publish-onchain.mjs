// Publishes dist-public/ into an opened TapeOut circuit container on X Layer.
//
//   node scripts/publish-onchain.mjs --container 0x... [--dry-run]
//
// Files go through SiteRegistry: the first <=24,000-byte chunk with putFile,
// every later chunk with appendChunk (expectIndex guards against a double
// append when a transaction is retried). Each chunk is its own transaction,
// so this is slow by nature. Read-only verification runs after every write.
//
// Signing goes through the onchainos wallet CLI; this script never sees a key.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Interface, JsonRpcProvider, Contract } from "ethers";

const CHUNK_MAX = 24_000;
const SITE_REGISTRY = "0xd6efb7adcc9c83dc4924ad56f6a8e4e969b9adb6";
const RPC = "https://rpc.xlayer.tech";

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : fallback;
};

const container = flag("container");
const holder = flag("from");
const dryRun = argv.includes("--dry-run");
if (!container) {
  console.error(
    "usage: node scripts/publish-onchain.mjs --container 0x... --from 0x... [--dry-run]",
  );
  process.exit(1);
}

const contentTypes = {
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  json: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  ico: "image/x-icon",
};

function contentTypeFor(path) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return contentTypes[ext] ?? "application/octet-stream";
}

const manifest = JSON.parse(readFileSync("dist-public/publish-manifest.json", "utf8"));
const iface = new Interface([
  "function putFile(address container, string path, string contentType, bytes32 sha256Hash, bytes data)",
  "function appendChunk(address container, string path, uint256 expectIndex, bytes data)",
]);

const provider = new JsonRpcProvider(RPC, 196);
const registry = new Contract(
  SITE_REGISTRY,
  [
    "function fileInfo(address container, string path) view returns (uint32 size, string contentType, bytes32 sha256Hash, uint40 updatedAt, uint256 chunkCount)",
    "function fallbackPath(address container) view returns (string)",
  ],
  provider,
);

function walletCall(to, inputData, amount = 0n) {
  const args = [
    "wallet",
    "contract-call",
    "--chain",
    "xlayer",
    "--to",
    to,
    "--input-data",
    inputData,
    // the wallet service's own gas estimation reverts on appendChunk even when
    // estimateGas and eth_call both succeed against a public node, so pin a
    // limit generously above the measured ~5.5M per chunk
    "--gas-limit",
    "9000000",
  ];
  if (amount > 0n) args.push("--amt", amount.toString());

  const raw = execFileSync("onchainos", args, {
    encoding: "utf8",
    env: process.env,
    maxBuffer: 8 * 1024 * 1024,
  });
  const parsed = JSON.parse(raw.trim().split("\n").pop());
  if (!parsed.ok) throw new Error(parsed.error ?? "wallet call failed");
  return parsed.data;
}

async function confirm(txHash) {
  for (let i = 0; i < 40; i += 1) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt) {
      if (receipt.status !== 1) throw new Error(`transaction reverted: ${txHash}`);
      return receipt;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`no receipt after 60s: ${txHash}`);
}

// Public nodes can answer fileInfo from a block before the write landed, so a
// single read right after confirmation reports size 0. Poll until the node
// catches up instead of failing the whole run on a lagging replica.
async function waitForFile(container_, path, expectedSize, expectedHash) {
  for (let i = 0; i < 20; i += 1) {
    const [size, , hash, , chunkCount] = await registry.fileInfo(container_, path);
    const matches =
      Number(size) === expectedSize && hash.toLowerCase() === expectedHash.toLowerCase();
    if (matches) return { size, hash, chunkCount, matches: true };
    if (i === 19) return { size, hash, chunkCount, matches: false };
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { matches: false };
}

let transactions = 0;

for (const entry of manifest.files) {
  const bytes = readFileSync(`dist-public/${entry.path}`);
  const contentType = contentTypeFor(entry.path);
  const declared = `0x${entry.sha256}`;
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += CHUNK_MAX) {
    chunks.push(bytes.subarray(offset, Math.min(offset + CHUNK_MAX, bytes.length)));
  }

  console.log(`\n${entry.path}  ${bytes.length}B  ${chunks.length} chunk(s)  ${contentType}`);

  // resume: skip whatever already landed, so a retry after a failure never
  // double-appends and never pays twice
  let already = 0;
  if (!dryRun) {
    // same lag applies here: read a few times and keep the highest count so a
    // stale replica can never make us append a chunk that is already stored
    let onChainHash = "0x";
    for (let i = 0; i < 4; i += 1) {
      const [, , hash, , chunkCount] = await registry.fileInfo(container, entry.path);
      already = Math.max(already, Number(chunkCount));
      if (Number(chunkCount) > 0) onChainHash = hash;
      if (already >= chunks.length) break;
      await new Promise((r) => setTimeout(r, 800));
    }
    if (already > 0) {
      console.log(`  resuming: ${already} chunk(s) already on chain, hash ${onChainHash.slice(0, 12)}…`);
    }
    // A stored file only counts as this build's file when the hash matches too.
    // Same chunk count with a different hash means an older build is sitting
    // there and chunk 0 has to replace it.
    if (onChainHash.toLowerCase() !== declared.toLowerCase()) {
      if (already > 0) {
        console.log("  stored hash differs, replacing from chunk 0");
      }
      already = 0;
    } else if (already >= chunks.length) {
      console.log("  already complete and matching, skipping");
    }
  }

  for (let index = already; index < chunks.length; index += 1) {
    const data = chunks[index];
    const calldata =
      index === 0
        ? iface.encodeFunctionData("putFile", [container, entry.path, contentType, declared, data])
        : iface.encodeFunctionData("appendChunk", [container, entry.path, index, data]);

    if (dryRun) {
      // Only chunk 0 can be simulated: appendChunk checks expectIndex against
      // the chunk count already stored on chain, so chunks 1+ always revert in
      // a dry run. Chunk 0 exercises the same editor check and encoding.
      if (index === 0) {
        // the editor check reads msg.sender, so the simulation has to carry the
        // holder address or it reverts with NotOwner
        await provider.call({ from: holder, to: SITE_REGISTRY, data: calldata });
        console.log(`  chunk 0: simulated ok (chunks 1+ are verified after writing)`);
      }
      continue;
    }

    const sent = walletCall(SITE_REGISTRY, calldata);
    const receipt = await confirm(sent.txHash);
    transactions += 1;
    console.log(`  chunk ${index}: tx ${receipt.hash} gas ${receipt.gasUsed.toString()}`);

    // The wallet service simulates against its own node before sending. If that
    // node has not seen this chunk yet, the next appendChunk looks like a wrong
    // expectIndex and the service refuses it. Wait for the count to be visible
    // before moving on.
    if (index + 1 < chunks.length) {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const [, , , , seen] = await registry.fileInfo(container, entry.path);
        if (Number(seen) >= index + 1) break;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  if (!dryRun) {
    const read = await waitForFile(container, entry.path, bytes.length, declared);
    console.log(
      `  verified: size ${read.size} chunkCount ${read.chunkCount} hash ${read.matches ? "matches" : "MISMATCH"}`,
    );
    if (!read.matches) {
      console.error("  aborting: on-chain file does not match the local file");
      process.exit(1);
    }
  }
}

if (dryRun) {
  console.log("\ndry run complete, nothing sent.");
} else {
  console.log(`\npublished ${manifest.files.length} file(s) in ${transactions} transaction(s).`);
  console.log(`set the fallback next if the site uses client-side routing.`);
}
