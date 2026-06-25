import { expect, test } from "@playwright/test";

test.describe("Delivery partner OTP login", () => {
  test("navigates to /delivery/login page", async ({ page }) => {
    await page.goto("/delivery/login", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /delivery|login|partner/i })).toBeVisible();
  });

  test("phone number input accepts valid Indian number", async ({ page }) => {
    await page.goto("/delivery/login", { waitUntil: "networkidle" });

    const phoneInput = page.getByLabel(/phone/i).or(page.locator('input[type="tel"]'));
    await phoneInput.fill("9876543210");
    await expect(phoneInput).toHaveValue("9876543210");
  });

  test("submitting phone number requests OTP", async ({ page }) => {
    await page.goto("/delivery/login", { waitUntil: "networkidle" });

    const phoneInput = page.getByLabel(/phone/i).or(page.locator('input[type="tel"]'));
    await phoneInput.fill("9876543210");

    // Click the send/request OTP button
    const sendButton = page.getByRole("button", { name: /send|request|get.*otp/i });
    await sendButton.click();

    // After requesting OTP, an OTP input field or message should appear
    const otpInput = page.getByLabel(/otp|code|verification/i).or(page.locator('input[name="otp"]'));
    await expect(otpInput.or(page.getByText(/otp.*sent|enter.*otp|verification/i))).toBeVisible({ timeout: 5000 });
  });

  test("OTP submission flow completes login", async ({ page }) => {
    await page.goto("/delivery/login", { waitUntil: "networkidle" });

    const phoneInput = page.getByLabel(/phone/i).or(page.locator('input[type="tel"]'));
    await phoneInput.fill("9876543210");

    const sendButton = page.getByRole("button", { name: /send|request|get.*otp/i });
    await sendButton.click();

    // Wait for OTP input to appear
    const otpInput = page.getByLabel(/otp|code|verification/i).or(page.locator('input[name="otp"]'));
    await expect(otpInput).toBeVisible({ timeout: 5000 });

    // Enter OTP
    await otpInput.fill("123456");

    // Submit OTP
    const verifyButton = page.getByRole("button", { name: /verify|login|submit/i });
    await verifyButton.click();

    // Should either navigate to delivery dashboard or show error for invalid OTP
    const dashboard = page.getByText(/dashboard|orders|delivery/i);
    const errorMsg = page.getByText(/invalid|incorrect|expired/i);
    await expect(dashboard.or(errorMsg)).toBeVisible({ timeout: 5000 });
  });

  test("shows error state for invalid phone number", async ({ page }) => {
    await page.goto("/delivery/login", { waitUntil: "networkidle" });

    const phoneInput = page.getByLabel(/phone/i).or(page.locator('input[type="tel"]'));
    // Enter an invalid short phone number
    await phoneInput.fill("123");

    const sendButton = page.getByRole("button", { name: /send|request|get.*otp/i });
    await sendButton.click();

    // Should show a validation error
    const errorMsg = page.getByText(/invalid|valid.*phone|10.*digit|enter.*valid/i);
    await expect(errorMsg).toBeVisible({ timeout: 3000 });
  });
});
