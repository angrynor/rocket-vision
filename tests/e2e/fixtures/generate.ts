/**
 * Generate three TradingView-style chart fixtures by drawing onto a Playwright
 * page <canvas>. Returns base64 data URLs the tests upload via setInputFiles.
 *
 * Three scenarios:
 *  - "breakout": tight range, then a clear breakout candle above resistance.
 *  - "range":    tight range, no break.
 *  - "trend":    a clean uptrend with a recent pullback to a moving average.
 */
import type { Page } from "@playwright/test";

export type FixtureKind = "breakout" | "range" | "trend";

export async function generateChartDataUrl(
  page: Page,
  kind: FixtureKind,
): Promise<string> {
  return await page.evaluate(async (k: FixtureKind) => {
    const W = 1200;
    const H = 720;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;

    // Background
    ctx.fillStyle = "#131722";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "#1f2738";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, H - 80); ctx.stroke();
    }
    for (let y = 40; y < H - 80; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Header
    ctx.fillStyle = "#d1d4dc";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("BTCUSDT.P · 4H · BINANCE", 16, 26);

    // Generate 60 candles per scenario.
    type C = { o: number; h: number; l: number; cl: number };
    const N = 60;
    const candles: C[] = [];
    let price = 100;
    const rng = (() => {
      let s = k === "breakout" ? 11 : k === "range" ? 22 : 33;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    })();

    if (k === "breakout") {
      // Tight range 95..105 for ~50 bars, then a breakout candle to 116.
      for (let i = 0; i < 50; i++) {
        const o = 95 + rng() * 10;
        const cl = 95 + rng() * 10;
        const h = Math.max(o, cl) + rng() * 1.2;
        const l = Math.min(o, cl) - rng() * 1.2;
        candles.push({ o, h, l, cl });
        price = cl;
      }
      // Breakout
      candles.push({ o: 104.5, h: 117, l: 104, cl: 116 });
      candles.push({ o: 116, h: 119, l: 114, cl: 118 });
      candles.push({ o: 118, h: 121, l: 116, cl: 120 });
      while (candles.length < N) {
        const last = candles[candles.length - 1].cl;
        const cl = last + (rng() - 0.4) * 1.5;
        candles.push({
          o: last,
          h: Math.max(last, cl) + rng(),
          l: Math.min(last, cl) - rng(),
          cl,
        });
      }
    } else if (k === "range") {
      for (let i = 0; i < N; i++) {
        const o = 95 + rng() * 10;
        const cl = 95 + rng() * 10;
        const h = Math.max(o, cl) + rng() * 1.2;
        const l = Math.min(o, cl) - rng() * 1.2;
        candles.push({ o, h, l, cl });
      }
    } else {
      // Trend up with a pullback near the end.
      let p = 100;
      for (let i = 0; i < 45; i++) {
        const drift = 0.6;
        const o = p;
        const cl = p + drift + (rng() - 0.5) * 1.4;
        const h = Math.max(o, cl) + rng() * 1.0;
        const l = Math.min(o, cl) - rng() * 1.0;
        candles.push({ o, h, l, cl });
        p = cl;
      }
      // Pullback (8 candles) toward a 20-MA-ish level
      for (let i = 0; i < 8; i++) {
        const o = p;
        const cl = p - 0.5 - rng() * 0.6;
        const h = Math.max(o, cl) + rng() * 0.6;
        const l = Math.min(o, cl) - rng() * 0.6;
        candles.push({ o, h, l, cl });
        p = cl;
      }
      // Resumption
      while (candles.length < N) {
        const o = p;
        const cl = p + 0.6 + rng() * 0.6;
        const h = Math.max(o, cl) + rng() * 0.6;
        const l = Math.min(o, cl) - rng() * 0.6;
        candles.push({ o, h, l, cl });
        p = cl;
      }
    }

    // Compute price extents
    const allHigh = candles.reduce((a, c) => Math.max(a, c.h), -Infinity);
    const allLow = candles.reduce((a, c) => Math.min(a, c.l), Infinity);
    const pad = (allHigh - allLow) * 0.1 || 1;
    const yTop = allHigh + pad;
    const yBot = allLow - pad;
    const chartTop = 60;
    const chartBot = H - 100;
    const yToPx = (v: number) =>
      chartTop + ((yTop - v) / (yTop - yBot)) * (chartBot - chartTop);

    // Draw candles
    const candleW = (W - 40) / N;
    const bodyW = candleW * 0.7;
    candles.forEach((c, i) => {
      const cx = 20 + i * candleW + candleW / 2;
      const isUp = c.cl >= c.o;
      ctx.strokeStyle = isUp ? "#26a69a" : "#ef5350";
      ctx.fillStyle = isUp ? "#26a69a" : "#ef5350";
      // Wick
      ctx.beginPath();
      ctx.moveTo(cx, yToPx(c.h));
      ctx.lineTo(cx, yToPx(c.l));
      ctx.stroke();
      // Body
      const bodyTop = yToPx(Math.max(c.o, c.cl));
      const bodyBottom = yToPx(Math.min(c.o, c.cl));
      const h = Math.max(1, bodyBottom - bodyTop);
      ctx.fillRect(cx - bodyW / 2, bodyTop, bodyW, h);
    });

    // Optional MA overlay for trend chart
    if (k === "trend") {
      ctx.strokeStyle = "#f5b041";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const period = 20;
      for (let i = period - 1; i < candles.length; i++) {
        const slice = candles.slice(i - period + 1, i + 1);
        const avg = slice.reduce((a, x) => a + x.cl, 0) / period;
        const x = 20 + i * candleW + candleW / 2;
        const y = yToPx(avg);
        if (i === period - 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = "#f5b041";
      ctx.font = "12px sans-serif";
      ctx.fillText("MA(20)", W - 90, 20);
    }

    // Resistance line (relevant for breakout/range)
    if (k === "breakout" || k === "range") {
      ctx.strokeStyle = "#9b59b6";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      const res = 105;
      ctx.moveTo(0, yToPx(res));
      ctx.lineTo(W, yToPx(res));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#9b59b6";
      ctx.font = "12px sans-serif";
      ctx.fillText(`R: ${res}`, 8, yToPx(res) - 4);
    }

    // Right axis with last close
    const last = candles[candles.length - 1];
    ctx.fillStyle = "#d1d4dc";
    ctx.font = "13px sans-serif";
    ctx.fillText(last.cl.toFixed(2), W - 70, yToPx(last.cl) + 4);

    // Footer / time axis
    ctx.fillStyle = "#7c8493";
    ctx.font = "12px sans-serif";
    ctx.fillText("4h · last 60 bars", 16, H - 20);

    return c.toDataURL("image/png");
  }, kind);
}
