import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || "3200";
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;
const useExternal = !!process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    headless: process.env.HEADED ? false : true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: useExternal
    ? undefined
    : {
        command: `PORT=${PORT} npm run dev`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
