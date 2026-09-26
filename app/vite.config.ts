import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error Plain ESM server module has no TypeScript declaration.
import { createRegistryBridge } from "./server/registry-bridge.mjs";

const demoAssetDirectory = fileURLToPath(
  new URL(
    "../runtime/ownership-demo/.generated/research-to-story/v1.0.0/public/",
    import.meta.url,
  ),
);
const demoAssetPrefix = "/demo-assets/research-to-story/v1.0.0/";
const demoAssetFiles = ["manifest.json", "encrypted-content.bin"];

function contentType(path: string) {
  if (extname(path) === ".json") return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function demoAssetPlugin(): Plugin {
  return {
    name: "skillpass-demo-assets",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith(demoAssetPrefix)) {
          next();
          return;
        }
        const fileName = request.url
          .slice(demoAssetPrefix.length)
          .split("?")[0];
        if (!demoAssetFiles.includes(fileName)) {
          response.statusCode = 404;
          response.end("Not found");
          return;
        }
        try {
          const bytes = readFileSync(join(demoAssetDirectory, fileName));
          response.statusCode = 200;
          response.setHeader("Content-Type", contentType(fileName));
          response.end(bytes);
        } catch {
          response.statusCode = 503;
          response.end("Demo asset package is not built.");
        }
      });
    },
    generateBundle() {
      for (const fileName of demoAssetFiles) {
        this.emitFile({
          type: "asset",
          fileName: `demo-assets/research-to-story/v1.0.0/${fileName}`,
          source: readFileSync(join(demoAssetDirectory, fileName)),
        });
      }
    },
  };
}

export default defineConfig(() => ({
  base: "./",
  plugins: [
    react(),
    demoAssetPlugin(),
    {
      name: "skillpass-registry-api",
      configureServer(server) {
        if (process.env.SKILLPASS_REGISTRY_MODE === "local") {
          return;
        }
        const bridge = createRegistryBridge();
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/api/")) {
            void bridge.handle(req, res);
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    host: "127.0.0.1",
  },
}));
