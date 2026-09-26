import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRegistryBridge } from "./server/registry-bridge.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.join(directory, "dist");
const bridge = createRegistryBridge({
  metadataFile: path.join(directory, ".data/registry-metadata.json"),
});

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith("/api/")) {
    await bridge.handle(req, res);
    return;
  }

  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const candidate = path.join(distDirectory, requestPath.split("?")[0]);
  const safePath = path.normalize(candidate);
  const filePath = safePath.startsWith(distDirectory)
    ? safePath
    : path.join(distDirectory, "index.html");

  try {
    const content = fs.readFileSync(filePath);
    res.setHeader(
      "Content-Type",
      mimeTypes[path.extname(filePath)] ?? "application/octet-stream",
    );
    res.end(content);
  } catch {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(fs.readFileSync(path.join(distDirectory, "index.html")));
  }
});

const port = Number(process.env.PORT ?? 4174);
server.listen(port, "127.0.0.1", () => {
  console.log(`SkillPass Control Room: http://127.0.0.1:${port}/`);
});
