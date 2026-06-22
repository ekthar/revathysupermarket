import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  timeout: 45_000,
  workers: 2,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "android-small", use: { browserName: "chromium", viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true } },
    { name: "android-medium", use: { browserName: "chromium", viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true } },
    { name: "iphone-webkit", use: { ...devices["iPhone 13"], browserName: "webkit" } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } }
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
