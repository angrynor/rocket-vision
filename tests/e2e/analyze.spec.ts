import { expect, test } from "@playwright/test";
import { generateChartDataUrl } from "./fixtures/generate";

const SECTION_HEADINGS = [
  "WHAT'S ON THE CHART",
  "PATTERNS DETECTED",
  "KEY LEVELS",
  "STRATEGY MATCH",
  "THE TRADE",
  "RISK FLAGS",
  "VERDICT",
];

async function uploadDataUrl(page: import("@playwright/test").Page, dataUrl: string, name: string) {
  // Convert the data URL to a Buffer and inject via setInputFiles.
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const buf = Buffer.from(base64, "base64");
  await page
    .locator('[data-testid="chart-input"]')
    .setInputFiles({ name, mimeType: "image/png", buffer: buf });
  await expect(page.locator('[data-testid="chart-dropzone"] img')).toBeVisible();
}

async function runAnalysis(page: import("@playwright/test").Page) {
  const btn = page.getByTestId("analyze-button");
  await expect(btn).toBeEnabled();
  await btn.click();
  // Wait for streaming to finish — the indicator disappears when done.
  await expect(page.getByTestId("streaming-indicator")).toBeVisible();
  await expect(page.getByTestId("streaming-indicator")).toBeHidden({
    timeout: 75_000,
  });
  return (await page.getByTestId("report-body").textContent()) || "";
}

test.describe("Rocket Vision — vision analysis", () => {
  test("home page renders core elements", async ({ page }) => {
    await page.goto("/");
    const h1Text = (await page.locator("h1").textContent()) || "";
    expect(h1Text).toMatch(/ROCKET/);
    expect(h1Text).toMatch(/VISION/);
    await expect(
      page.getByText(/Drop your chart\. Pick your strategy/),
    ).toBeVisible();
    await expect(page.getByTestId("strategy-selector")).toBeVisible();
    await expect(page.getByTestId("analyze-button")).toBeDisabled();
    await expect(page.getByTestId("footer-link")).toHaveAttribute(
      "href",
      /oma/i,
    );
  });

  test("Test 1: breakout chart with Breakout strategy", async ({ page }) => {
    await page.goto("/");
    const url = await generateChartDataUrl(page, "breakout");
    await uploadDataUrl(page, url, "breakout-chart.png");
    await page.getByTestId("strategy-radio-breakout").check();

    const text = await runAnalysis(page);
    for (const h of SECTION_HEADINGS) expect(text).toContain(h);

    const matchBadge = await page.getByTestId("match-badge").textContent();
    expect(matchBadge).toMatch(/MATCH|PARTIAL/);
    expect(matchBadge).not.toMatch(/NO MATCH/);

    const verdictBadge = await page.getByTestId("verdict-badge").textContent();
    expect(verdictBadge).toMatch(/TAKE IT|WAIT/);
  });

  test("Test 2: range chart with Breakout strategy → mismatch", async ({ page }) => {
    await page.goto("/");
    const url = await generateChartDataUrl(page, "range");
    await uploadDataUrl(page, url, "range-chart.png");
    await page.getByTestId("strategy-radio-breakout").check();

    const text = await runAnalysis(page);
    for (const h of SECTION_HEADINGS) expect(text).toContain(h);

    const matchBadge = await page.getByTestId("match-badge").textContent();
    expect(matchBadge).toMatch(/NO MATCH|PARTIAL/);
    const verdictBadge = await page.getByTestId("verdict-badge").textContent();
    expect(verdictBadge).toMatch(/SKIP|WAIT/);

    // Section 5 should explain what the chart actually IS (mean reversion / range).
    const lower = text.toLowerCase();
    expect(lower).toMatch(/range|mean.reversion|consolidation/);
  });

  test("Test 3: auto-detect on a trend chart names the strategy", async ({ page }) => {
    await page.goto("/");
    const url = await generateChartDataUrl(page, "trend");
    await uploadDataUrl(page, url, "trend-chart.png");
    // auto is default; just confirm it
    await page.getByTestId("strategy-radio-auto").check();

    const text = await runAnalysis(page);
    for (const h of SECTION_HEADINGS) expect(text).toContain(h);

    // Section 4 should explicitly name a strategy.
    expect(text.toLowerCase()).toMatch(
      /trend continuation|breakout|mean reversion|smart money|reversal/,
    );
  });
});

test.describe("Rocket Vision — API validation", () => {
  test("rejects unknown strategy", async ({ request }) => {
    const r = await request.post("/api/analyze", {
      data: {
        imageBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8//8/AwAI/AL+ZxJP/AAAAABJRU5ErkJggg==",
        strategy: "nonsense",
      },
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error).toMatch(/strategy/i);
  });

  test("rejects missing image", async ({ request }) => {
    const r = await request.post("/api/analyze", {
      data: { strategy: "auto" },
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error).toMatch(/imageBase64|required/i);
  });

  test("rejects unsupported image format", async ({ request }) => {
    const r = await request.post("/api/analyze", {
      data: {
        imageBase64: "data:image/svg+xml;base64,PHN2Zy8+",
        strategy: "auto",
      },
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error).toMatch(/Unsupported/i);
  });
});
