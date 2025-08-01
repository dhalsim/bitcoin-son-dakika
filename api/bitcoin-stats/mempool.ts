import { z } from "zod";

const MempoolFeesSchema = z.object({
  fastestFee: z.number(),
  halfHourFee: z.number(),
  hourFee: z.number(),
  economyFee: z.number(),
  minimumFee: z.number(),
});

const MempoolDifficultySchema = z.object({
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

const MempoolMempoolSchema = z.object({
  count: z.number(),
  vsize: z.number(),
  total_fee: z.number(),
  fee_histogram: z.array(z.array(z.number())),
});

const MempoolHashrateSchema = z.object({
  hashrates: z.array(
    z.object({
      avgHashrate: z.number(),
      timestamp: z.number(),
    }),
  ),
  currentHashrate: z.number(),
  currentDifficulty: z.number(),
});

// Bitcoin stats response schema
export const BitcoinStatsDataSchema = z.object({
  hashrate: z.object({
    value: z.string(),
    unit: z.string(),
    timestamp: z.number(),
  }),
  fees: MempoolFeesSchema,
  difficulty: z.object({
    value: z.string(),
    change: z.string(),
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

export type BitcoinStatsData = z.infer<typeof BitcoinStatsDataSchema>;

// Vercel Edge Function handler for GET requests
export async function GET() {
  try {
    // Fetch data from Mempool.space API endpoints in parallel
    const [
      hashrateResponse,
      feesResponse,
      difficultyResponse,
      mempoolResponse,
    ] = await Promise.allSettled([
      fetch("https://mempool.space/api/v1/mining/hashrate/3d"),
      fetch("https://mempool.space/api/v1/fees/recommended"),
      fetch("https://mempool.space/api/v1/difficulty-adjustment"),
      fetch("https://mempool.space/api/mempool"),
    ]);

    // Check if any endpoint failed
    const failedEndpoints: string[] = [];

    if (hashrateResponse.status === "rejected") {
      failedEndpoints.push("Hashrate API failed: " + hashrateResponse.reason);
    }

    if (feesResponse.status === "rejected") {
      failedEndpoints.push("Fees API failed: " + feesResponse.reason);
    }

    if (difficultyResponse.status === "rejected") {
      failedEndpoints.push(
        "Difficulty API failed: " + difficultyResponse.reason,
      );
    }

    if (mempoolResponse.status === "rejected") {
      failedEndpoints.push("Mempool API failed: " + mempoolResponse.reason);
    }

    if (failedEndpoints.length > 0) {
      const errorMessage = `Failed to fetch Bitcoin stats: ${failedEndpoints.join(", ")}`;
      console.error("Bitcoin Stats API error:", errorMessage);

      const errorResponse = ErrorResponse(
        new Error(errorMessage),
        "Failed to fetch Bitcoin statistics",
        500,
      );

      return applyCacheHeaders(errorResponse, {
        maxAge: 60,
        staleWhileRevalidate: 30,
        cdnMaxAge: 60,
      });
    }

    if (hashrateResponse.status !== "fulfilled" || !hashrateResponse.value.ok) {
      throw new Error("Failed to fetch hashrate data");
    }

    if (feesResponse.status !== "fulfilled" || !feesResponse.value.ok) {
      throw new Error("Failed to fetch fees data");
    }

    if (
      difficultyResponse.status !== "fulfilled" ||
      !difficultyResponse.value.ok
    ) {
      throw new Error("Failed to fetch difficulty data");
    }

    if (mempoolResponse.status !== "fulfilled" || !mempoolResponse.value.ok) {
      throw new Error("Failed to fetch mempool data");
    }

    // Process hashrate data
    const rawHashrateData = await hashrateResponse.value.json();
    const hashrateData = MempoolHashrateSchema.parse(rawHashrateData);

    // The 3d hashrate endpoint returns an object with hashrates array and currentHashrate
    const currentHashrate = hashrateData.currentHashrate;
    const hashrateInEH = currentHashrate / 1e18; // Convert to exahash
    const currentDifficulty = hashrateData.currentDifficulty;

    const hashrate = {
      value: hashrateInEH.toFixed(2),
      unit: "EH/s",
      timestamp: Date.now(),
    };

    // Process fees data
    const rawFeesData = await feesResponse.value.json();
    const feesData = MempoolFeesSchema.parse(rawFeesData);

    const rawDifficultyData = await difficultyResponse.value.json();
    const difficultyData = MempoolDifficultySchema.parse(rawDifficultyData);

    const difficulty = {
      value:
        currentDifficulty > 0
          ? (currentDifficulty / 1e12).toFixed(2) + "T"
          : "Current",
      change: `${difficultyData.difficultyChange > 0 ? "+" : ""}${(difficultyData.difficultyChange * 100).toFixed(2)}%`,
      height: difficultyData.nextRetargetHeight,
    };

    // Process mempool data
    const rawMempoolData = await mempoolResponse.value.json();
    const mempoolData = MempoolMempoolSchema.parse(rawMempoolData);

    // Determine mempool status based on transaction count
    let status = "Normal";
    if (mempoolData.count > 50000) {
      status = "Yoğun";
    } else if (mempoolData.count > 20000) {
      status = "Orta";
    } else if (mempoolData.count < 5000) {
      status = "Az";
    }

    const mempool = {
      count: mempoolData.count,
      size: (mempoolData.vsize / 1e6).toFixed(2) + " MB", // Convert to MB
      totalFee: (mempoolData.total_fee / 1e8).toFixed(4) + " BTC", // Convert to BTC
      status,
    };

    // Prepare response data
    const responseData: BitcoinStatsData = {
      hashrate,
      fees: feesData,
      difficulty,
      mempool,
      lastUpdated: new Date().toISOString(),
      source: "Mempool.space",
    };

    const response = SuccessResponse(responseData);

    // Apply Bitcoin stats-specific caching strategy (2 minutes cache)
    return applyCacheHeaders(response, {
      maxAge: 120,
      staleWhileRevalidate: 60,
      cdnMaxAge: 120,
    });
  } catch (error) {
    console.error("Bitcoin Stats API error:", error);

    const errorResponse = ErrorResponse(
      error,
      "Failed to fetch Bitcoin statistics",
      500,
    );

    // Apply error caching strategy
    return applyCacheHeaders(errorResponse, {
      maxAge: 60,
      staleWhileRevalidate: 30,
      cdnMaxAge: 60,
    });
  }
}

// Vercel Edge Function handler for OPTIONS requests (CORS)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export interface CacheConfig {
  maxAge: number; // Primary cache duration in seconds
  staleWhileRevalidate: number; // How long to serve stale content while revalidating
  cdnMaxAge?: number; // CDN-specific cache duration
}

export function applyCacheHeaders(
  response: Response,
  strategy: CacheConfig,
): Response {
  const cacheControl = `s-maxage=${strategy.maxAge}, stale-while-revalidate=${strategy.staleWhileRevalidate}`;

  response.headers.set("Cache-Control", cacheControl);
  response.headers.set(
    "CDN-Cache-Control",
    `s-maxage=${strategy.cdnMaxAge || strategy.maxAge}`,
  );

  // Add ETag for better cache validation
  const etag = `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`;
  response.headers.set("ETag", etag);

  return response;
}

export function ErrorResponse(
  e?: Error,
  message?: string,
  status: number = 500,
) {
  return new Response(
    JSON.stringify({
      success: false,
      message:
        message ||
        (e instanceof Error ? e.message : "Error processing request"),
      error: e instanceof Error ? e.message : "Unknown error",
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

export function SuccessResponse(
  data: Record<string, unknown>,
  status: number = 200,
) {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
