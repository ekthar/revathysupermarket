import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/products", "/cart", "/login", "/support"];

for (const route of publicRoutes) {
  test(`${route} has stable mobile geometry`, async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __layoutShiftScore?: number }).__layoutShiftScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
          if (!entry.hadRecentInput) (window as Window & { __layoutShiftScore?: number }).__layoutShiftScore! += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const geometry = await page.evaluate(() => ({ viewportWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth }));
    expect(geometry.documentWidth, `horizontal overflow on ${route}`).toBeLessThanOrEqual(geometry.viewportWidth);
    const score = await page.evaluate(() => (window as Window & { __layoutShiftScore?: number }).__layoutShiftScore ?? 0);
    expect(score).toBeLessThanOrEqual(0.05);
  });
}

test("mobile chrome hides without reflow when the keyboard opens", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only shell behavior");
  await page.goto("/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const nav = page.locator(".ios-bottom-bar");
  await expect(nav).toBeVisible();
  const before = await nav.boundingBox();
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-keyboard-open", "");
  });
  await expect(nav).toHaveCSS("opacity", "0");
  await page.evaluate(() => document.documentElement.removeAttribute("data-keyboard-open"));
  await expect(nav).toHaveCSS("opacity", "1");
  const after = await nav.boundingBox();
  expect(after?.x).toBe(before?.x);
  expect(after?.width).toBe(before?.width);
});
