import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "../../app/node_modules/@playwright/test/index.js";

const { chromium } = playwright;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outputDirectory = join(root, "artifacts", "competition-demo");
const localUrl = process.env.IMOO_LOCAL_URL ?? "http://127.0.0.1:4177";

async function expectHeading(page, text, timeout = 120_000) {
  await page.getByRole("heading", { name: text }).waitFor({ timeout });
}

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  recordVideo: {
    dir: outputDirectory,
    size: { width: 1600, height: 900 },
  },
});
const page = await context.newPage();
const video = page.video();

await page.goto(`${localUrl}/#/overview`, { waitUntil: "networkidle" });
await expectHeading(page, "From using a Skill to owning it.");
await page.waitForTimeout(4_000);

await page.goto(`${localUrl}/#/demo`, { waitUntil: "networkidle" });
await expectHeading(page, "Use a Skill");
await page.getByRole("button", { name: /Run Usage Flow/ }).click();
await page.getByText(/Receipt created/).waitFor();
await page.waitForTimeout(4_000);

await page.getByRole("button", { name: /Continue to Ownership/ }).click();
await expectHeading(page, "Own a Skill");
await page.waitForTimeout(3_000);

await page.getByRole("button", { name: /Start Delivery/ }).click();
await page.getByText("Content decrypted").waitFor({ timeout: 30_000 });
await page.locator(".ownership-link-state").getByText("Agent B").waitFor();
await page.waitForTimeout(5_000);

await page.goto(`${localUrl}/#/verify`, { waitUntil: "networkidle" });
await expectHeading(page, "Verify on X Layer");
await page.waitForTimeout(5_000);

await page.goto(`${localUrl}/#/overview`, { waitUntil: "networkidle" });
await expectHeading(page, "From using a Skill to owning it.");
await page.waitForTimeout(5_000);

await context.close();
await browser.close();

console.log(`Recorded video: ${await video.path()}`);
