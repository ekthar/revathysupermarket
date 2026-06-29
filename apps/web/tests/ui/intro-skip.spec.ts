import { expect, test } from "@playwright/test";

test.describe("Intro Skip", () => {
  test("?skipIntro=1 skips the intro entirely", async ({ page }) => {
    await page.goto("/?skipIntro=1", { waitUntil: "domcontentloaded" });
    // Intro shell should not be present
    const introShell = page.locator("[aria-hidden='true']").filter({ has: page.locator("text=Skip") });
    await expect(introShell).not.toBeVisible();
    // Homepage content should be visible
    await expect(page.locator("main")).toBeVisible();
  });

  test("intro does not show on admin routes", async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    const skipButton = page.locator("button", { hasText: "Skip" });
    await expect(skipButton).not.toBeVisible();
  });

  test("intro does not replay within same session", async ({ page }) => {
    // First visit — set the session flag as if intro already played
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      sessionStorage.setItem("msm_intro_shown", "1");
    });
    // Reload — should not show intro
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const skipButton = page.locator("button[aria-label='Skip intro']");
    await expect(skipButton).not.toBeVisible();
  });
});
