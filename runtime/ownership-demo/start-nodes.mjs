import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { startCustodianNode } from "./node-service.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const generated = join(
  root,
  ".generated",
  "research-to-story",
  "v1.0.0",
);

async function waitForPackage(timeoutMs = 15_000) {
  if (!existsSync(join(generated, "package-report.json"))) {
    const result = spawnSync(
      process.execPath,
      [join(root, "build-package.mjs")],
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      throw new Error("Unable to build the competition demo package.");
    }
  }
  const started = Date.now();
  while (!existsSync(join(generated, "package-report.json"))) {
    if (Date.now() - started > timeoutMs) {
      throw new Error(
        "Demo package is missing. Run runtime/ownership-demo/build-package.mjs first.",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

await waitForPackage();

const nodeA = await startCustodianNode({
  nodeId: "node-a",
  sharePath: join(generated, "nodes", "node-a", "share.json"),
  port: Number(process.env.IMOO_NODE_A_PORT ?? 4181),
});
const nodeB = await startCustodianNode({
  nodeId: "node-b",
  sharePath: join(generated, "nodes", "node-b", "share.json"),
  port: Number(process.env.IMOO_NODE_B_PORT ?? 4182),
});

console.log(`Node A: http://127.0.0.1:${nodeA.port}`);
console.log(`Node B: http://127.0.0.1:${nodeB.port}`);
console.log("Node C: intentionally offline");

async function shutdown() {
  await Promise.all([nodeA.close(), nodeB.close()]);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
