import { expect, test } from "@playwright/test";

test("runs the controlled flow and renders all registry views", async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "SkillPass Control Room" }),
  ).toBeVisible();
  await expect(page.getByText("X Layer 已连接")).toBeVisible();

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasOverflow).toBeFalsy();

  await page.getByRole("button", { name: "运行受控闭环" }).click();
  await expect(page.getByText("Receipt 已写入本地参考 Registry")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator(".metric").nth(2).getByText("1")).toBeVisible();
  await expect(page.getByText("DELIVERED")).toBeVisible();

  await page.getByRole("button", { name: "拒绝场景" }).click();
  await expect(page.getByText("已创建 REJECTED Receipt")).toBeVisible({
    timeout: 20_000,
  });

  const views = [
    ["Use a Skill", "Use a Skill", "demo"],
    ["Own a Skill", "Own a Skill", "ownership"],
    ["Verify", "Verify on X Layer", "verify"],
    ["Skill Passport", "Skill Passport", "passports"],
    ["License Desk", "License Desk", "licenses"],
    ["Service Console", "Service Console", "services"],
    ["Receipts", "Receipts", "receipts"],
    ["Rights & Revenue", "Rights & Revenue", "rights"],
  ] as const;

  for (const [navLabel, heading, hash] of views) {
    if (testInfo.project.name === "mobile") {
      await page.goto(`/#/${hash}`);
    } else {
      await page.getByRole("button", { name: new RegExp(navLabel) }).click();
    }
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }

  await page.goto("/#/demo");
  await page.getByRole("button", { name: /Run Usage Flow/ }).click();
  await expect(page.getByText(/Receipt created/)).toBeVisible({
    timeout: 10_000,
  });

  await page.goto("/#/ownership");
  await expect(page.getByText("Linked Receipt")).toBeVisible();
  await expect(page.getByText("DELIVERED").first()).toBeVisible();
  await page.getByRole("button", { name: /Start Delivery/ }).click();
  await expect(page.getByText("Owned by Agent B")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("2 / 3")).toBeVisible();
  await expect(page.getByText("Content decrypted")).toBeVisible();
  await expect(
    page.locator(".ownership-decrypted"),
  ).toContainText("Research-to-Story v1.0.0");
  await expect(
    page.locator(".ownership-decrypted"),
  ).toBeVisible();
  await expect(
    page.locator(".ownership-link-state").getByText("Agent B"),
  ).toBeVisible();
  const ownershipOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(ownershipOverflow).toBeFalsy();

  await page.goto("/#/overview");
  expect(pageErrors).toEqual([]);
  await page.screenshot({
    path: testInfo.project.name === "mobile"
      ? "/tmp/skillpass-mobile.png"
      : "/tmp/skillpass-desktop.png",
    fullPage: true,
  });
});
