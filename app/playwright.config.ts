import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4175",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "SKILLPASS_REGISTRY_MODE=local npm run dev -- --host 127.0.0.1 --port 4175",
      url: "http://127.0.0.1:4175",
      reuseExistingServer: false,
    },
    {
      command: "node ../runtime/ownership-demo/start-nodes.mjs",
      url: "http://127.0.0.1:4181/health",
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
