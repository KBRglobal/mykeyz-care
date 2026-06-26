import type { ProviderJob } from "@/src/state/AppState";

const tradeRanges: Record<string, { low: number; high: number; win: number }> = {
  Painting: { low: 320, high: 520, win: 410 },
  Plumbing: { low: 180, high: 320, win: 240 },
  AC: { low: 260, high: 480, win: 360 },
  Electrical: { low: 220, high: 420, win: 330 },
  Carpentry: { low: 300, high: 650, win: 470 },
  Cleaning: { low: 250, high: 520, win: 390 },
};

export function getPriceInsight(job: ProviderJob) {
  const range = tradeRanges[job.trade] ?? {
    low: Math.max(90, job.estimate - 120),
    high: job.estimate + 120,
    win: job.estimate,
  };
  const recommended = Math.min(range.high, Math.max(range.low, job.competitorPrice ? job.competitorPrice - 20 : range.win));

  return {
    ...range,
    recommended,
    marginAfterFee: Math.round(recommended * 0.9),
  };
}
