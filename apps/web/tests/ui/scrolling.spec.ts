import { expect, test, type Page } from "@playwright/test";

const publicRoutes = ["/", "/products", "/cart", "/login", "/support"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("msm-onboarding-done", "true"));
});

async function addScrollableFixture(page: Page) {
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.dataset.testid = "scroll-fixture";
    fixture.style.height = "2400px";
    fixture.style.pointerEvents = "none";
    document.querySelector(".route-scroll-container")?.append(fixture);
    window.scrollTo(0, 0);
  });
}

async function performScroll(page: Page, browserName: string) {
  if (browserName === "webkit") {
    await page.evaluate(() => window.scrollBy({ top: 700, behavior: "auto" }));
    return;
  }
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(100);
  if (await page.evaluate(() => window.scrollY === 0)) await page.keyboard.press("PageDown");
}

for (const route of publicRoutes) {
  test(`${route} uses document scrolling`, async ({ page, browserName }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await addScrollableFixture(page);

    const before = await page.evaluate(() => ({ y: window.scrollY, root: document.scrollingElement?.tagName }));
    await performScroll(page, browserName);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before.y);
    expect(["HTML", "BODY"]).toContain(before.root);

    const routeOverflow = await page.locator(".route-scroll-container").evaluate((element) => getComputedStyle(element).overflowY);
    expect(["auto", "scroll", "hidden", "clip"]).not.toContain(routeOverflow);
  });
}

test("keyboard scrolling and route navigation retain scroll capability", async ({ page, browserName }) => {
  await page.goto("/products", { waitUntil: "networkidle" });
  await addScrollableFixture(page);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.goto("/cart", { waitUntil: "networkidle" });
  await addScrollableFixture(page);
  await performScroll(page, browserName);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("opening and closing product filters restores document scrolling", async ({ page }) => {
  await page.goto("/products", { waitUntil: "networkidle" });
  const filter = page.getByRole("button", { name: "Filters" });
  test.skip(await filter.count() !== 1, "filter control unavailable without catalogue data");
  await filter.click();
  await expect(page.locator("html")).toHaveAttribute("data-scroll-locked", "true");
  await page.getByRole("button", { name: "Popularity", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-scroll-locked", "true");
});
