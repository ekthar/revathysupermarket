import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["/", "/products", "/cart"];

for (const route of pages) {
  test(`${route} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );

    expect(
      seriousOrCritical,
      `Found ${seriousOrCritical.length} serious/critical violations on ${route}:\n` +
        seriousOrCritical.map((v) => `  - [${v.impact}] ${v.id}: ${v.description}`).join("\n")
    ).toHaveLength(0);
  });
}
