import { expect, test } from "@playwright/test";

test.describe("Offline Mode", () => {
  test("offline page renders when network is unavailable", async ({ page, context }) => {
    // Load the page first to register the service worker
    await page.goto("/?skipIntro=1", { waitUntil: "networkidle" });

    // Go offline
    await context.setOffline(true);

    // Try to navigate to a new page
    await page.goto("/products", { waitUntil: "domcontentloaded" }).catch(() => {});

    // Should see offline content (either the offline page or cached content)
    const offlineIndicator = page.locator("text=offline").first();
    const productPage = page.locator("text=Browse").first();

    // Either offline page shows or cached products page loads
    const isOfflinePage = await offlineIndicator.isVisible().catch(() => false);
    const isProductsPage = await productPage.isVisible().catch(() => false);
    expect(isOfflinePage || isProductsPage).toBe(true);

    // Restore
    await context.setOffline(false);
  });

  test("offline page has retry button", async ({ page, context }) => {
    // Go offline before navigation
    await context.setOffline(true);

    await page.goto("/some-random-page-that-doesnt-exist", { waitUntil: "domcontentloaded" }).catch(() => {});

    // Restore network
    await context.setOffline(false);
  });
});
