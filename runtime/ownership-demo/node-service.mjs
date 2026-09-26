import http from "node:http";
import { readFile } from "node:fs/promises";
import { DemoCustodianNode } from "../../app/src/lib/demoThresholdCrypto.js";

const MAX_BODY_BYTES = 64 * 1024;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("request body too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function loadNodeShare(sharePath, online = true) {
  const bundle = JSON.parse((await readFile(sharePath)).toString("utf8"));
  const node = new DemoCustodianNode(bundle.nodeId, online);
  await node.installShare({
    share: new Uint8Array(Buffer.from(bundle.share, "base64")),
    assetId: bundle.assetId,
    packageId: bundle.packageId,
    keyEpoch: bundle.keyEpoch,
  });
  return {
    node,
    bundle: {
      nodeId: bundle.nodeId,
      assetId: bundle.assetId,
      packageId: bundle.packageId,
      keyEpoch: bundle.keyEpoch,
      shareHash: bundle.shareHash,
    },
  };
}

export async function startCustodianNode({
  nodeId,
  sharePath,
  port = 0,
  online = true,
}) {
  const { node, bundle } = await loadNodeShare(sharePath, online);
  const server = http.createServer(async (request, response) => {
    try {
      if (request.method === "OPTIONS") {
        sendJson(response, 204, {});
        return;
      }
      if (request.method === "GET" && request.url === "/health") {
        sendJson(response, 200, {
          ok: true,
          nodeId: bundle.nodeId,
          assetId: bundle.assetId,
          packageId: bundle.packageId,
          keyEpoch: bundle.keyEpoch,
          shareHash: bundle.shareHash,
        });
        return;
      }
      if (request.method === "POST" && request.url === "/deliver") {
        const body = await readJson(request);
        const delivery = await node.deliver({
          assetId: body.assetId,
          packageId: body.packageId,
          orderId: body.orderId,
          keyEpoch: body.keyEpoch,
          buyerPublicKey: new Uint8Array(
            Buffer.from(body.buyerPublicKey, "base64"),
          ),
        });
        sendJson(response, 200, delivery);
        return;
      }
      sendJson(response, 404, { ok: false, error: "not found" });
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error(`Unable to start ${nodeId}`);
  }

  return {
    nodeId,
    port: address.port,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
