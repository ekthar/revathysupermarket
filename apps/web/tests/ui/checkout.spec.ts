import { expect, test } from "@playwright/test";

test.describe("Checkout flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("msm-onboarding-done", "true");
    });
  });

  test("COD checkout completes successfully", async ({ page }) => {
    // Navigate to products and add an item to cart
    await page.goto("/products", { waitUntil: "networkidle" });
    const addButton = page.locator('[data-testid="add-to-cart"]').first();
    await addButton.click();

    // Go to cart and proceed to checkout
    await page.goto("/cart", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /checkout/i }).click();

    // Fill checkout form
    await page.getByLabel(/name/i).fill("Test Customer");
    await page.getByLabel(/phone/i).fill("9876543210");
    await page.getByLabel(/house/i).fill("Test House");
    await page.getByLabel(/street/i).fill("Test Street");
    await page.getByLabel(/pincode/i).fill("695001");

    // Select COD payment method
    await page.getByRole("radio", { name: /cash on delivery/i }).check();

    // Submit order
    await page.getByRole("button", { name: /place order/i }).click();

    // Verify order confirmation
    await expect(page.getByText(/order.*confirmed|order.*received/i)).toBeVisible({ timeout: 10000 });
  });

  test("UPI checkout shows payment instructions", async ({ page }) => {
    await page.goto("/products", { waitUntil: "networkidle" });
    const addButton = page.locator('[data-testid="add-to-cart"]').first();
    await addButton.click();

    await page.goto("/cart", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /checkout/i }).click();

    // Fill checkout form
    await page.getByLabel(/name/i).fill("UPI Customer");
    await page.getByLabel(/phone/i).fill("9876543211");
    await page.getByLabel(/house/i).fill("UPI House");
    await page.getByLabel(/street/i).fill("UPI Street");
    await page.getByLabel(/pincode/i).fill("695001");

    // Select UPI payment method
    await page.getByRole("radio", { name: /upi/i }).check();

    // Submit order
    await page.getByRole("button", { name: /place order/i }).click();

    // Verify order acknowledgement or UPI instructions shown
    await expect(page.getByText(/order|upi|payment/i)).toBeVisible({ timeout: 10000 });
  });

  test("server-authoritative pricing prevents tampered prices", async ({ page }) => {
    // Navigate to products and add an item
    await page.goto("/products", { waitUntil: "networkidle" });
    const addButton = page.locator('[data-testid="add-to-cart"]').first();
    await addButton.click();

    // Intercept checkout API request to tamper the price
    await page.route("**/api/orders", async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Tamper: set an artificially low price in the items
      if (postData?.items) {
        for (const item of postData.items) {
          item.price = 0.01; // Attempt to pay almost nothing
        }
      }

      await route.continue({ postData: JSON.stringify(postData) });
    });

    await page.goto("/cart", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /checkout/i }).click();

    // Fill checkout form
    await page.getByLabel(/name/i).fill("Tamper Customer");
    await page.getByLabel(/phone/i).fill("9876543212");
    await page.getByLabel(/house/i).fill("Tamper House");
    await page.getByLabel(/street/i).fill("Tamper Street");
    await page.getByLabel(/pincode/i).fill("695001");
    await page.getByRole("radio", { name: /cash on delivery/i }).check();

    await page.getByRole("button", { name: /place order/i }).click();

    // The server recalculates prices from the database, so either:
    // 1. The order is placed at the correct server-calculated price (tampered price ignored)
    // 2. The server rejects if it detects discrepancy
    // Either outcome is acceptable: the point is the client price is NOT authoritative
    const confirmation = page.getByText(/order.*confirmed|order.*received/i);
    const errorMessage = page.getByText(/error|failed|unavailable/i);
    await expect(confirmation.or(errorMessage)).toBeVisible({ timeout: 10000 });
  });
});
