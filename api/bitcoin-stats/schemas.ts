import { z } from "zod";

// Mempool.space API schemas
export const MempoolHashrateSchema = z.object({
  timestamp: z.number(),
  avgHashrate: z.number(),
  share: z.number(),
});

export const MempoolFeesSchema = z.object({
  fastestFee: z.number(),
  halfHourFee: z.number(),
  hourFee: z.number(),
  economyFee: z.number(),
  minimumFee: z.number(),
});

export const MempoolDifficultySchema = z.object({
  progressPercent: z.number(),
  difficultyChange: z.number(),
  estimatedRetargetDate: z.number(),
  remainingBlocks: z.number(),
  remainingTime: z.number(),
  previousRetarget: z.number(),
  previousTime: z.number(),
  nextRetargetHeight: z.number(),
  timeAvg: z.number(),
  adjustedTimeAvg: z.number(),
  timeOffset: z.number(),
  expectedBlocks: z.number(),
});

export const MempoolMempoolSchema = z.object({
  count: z.number(),
  vsize: z.number(),
  total_fee: z.number(),
  fee_histogram: z.array(z.array(z.number())),
});

// Bitcoin stats response schema
export const BitcoinStatsDataSchema = z.object({
  hashrate: z.object({
    value: z.string(),
    unit: z.string(),
    timestamp: z.number(),
  }),
  fees: z.object({
    fastest: z.number(),
    halfHour: z.number(),
    hour: z.number(),
    economy: z.number(),
    minimum: z.number(),
  }),
  difficulty: z.object({
    value: z.string(),
    change: z.string().optional(),
    height: z.number(),
  }),
  mempool: z.object({
    count: z.number(),
    size: z.string(),
    totalFee: z.string(),
    status: z.string(),
  }),
  lastUpdated: z.string(),
  source: z.string(),
});

// Type exports for convenience
export type BitcoinStatsData = z.infer<typeof BitcoinStatsDataSchema>;
export type MempoolHashrate = z.infer<typeof MempoolHashrateSchema>;
export type MempoolFees = z.infer<typeof MempoolFeesSchema>;
export type MempoolDifficulty = z.infer<typeof MempoolDifficultySchema>;
export type MempoolMempool = z.infer<typeof MempoolMempoolSchema>;
