import { expect, test } from "@playwright/test";

test.describe("Add to Cart", () => {
  test("can add a product to cart from product grid", async ({ page }) => {
    await page.goto("/?skipIntro=1", { waitUntil: "networkidle" });

    // Find the first add button (Plus icon inside a product card)
    const addButton = page.locator("article button").first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Should show quantity stepper (Minus button appears)
    await expect(page.locator("article").first().locator("button").filter({ has: page.locator("svg") })).toHaveCount(2, { timeout: 5000 });
  });

  test("cart badge updates when item is added", async ({ page }) => {
    await page.goto("/?skipIntro=1", { waitUntil: "networkidle" });

    // Add first product
    const addButton = page.locator("article button").first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Cart badge should show "1" in the bottom nav
    const cartBadge = page.locator("nav a[href='/cart'] span").filter({ hasText: /^\d+$/ });
    await expect(cartBadge).toBeVisible({ timeout: 5000 });
  });

  test("cart page shows added items", async ({ page }) => {
    await page.goto("/?skipIntro=1", { waitUntil: "networkidle" });

    // Add first product
    const addButton = page.locator("article button").first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Navigate to cart
    await page.goto("/cart", { waitUntil: "domcontentloaded" });

    // Cart should not be empty
    const emptyState = page.locator("text=Your cart is empty");
    await expect(emptyState).not.toBeVisible({ timeout: 5000 });
  });
});
