import type { BitcoinStatsData } from "../../api-helpers/bitcoin-stats/schemas.js";
import {
  MempoolFeesSchema,
  MempoolDifficultySchema,
  MempoolMempoolSchema,
  MempoolHashrateSchema,
} from "../../api-helpers/bitcoin-stats/schemas.js";
import {
  applyCacheHeaders,
  ErrorResponse,
  SuccessResponse,
} from "../../api-helpers/utils.js";

// Vercel Edge Function handler for GET requests
export async function GET() {
  try {
    // Fetch data from Mempool.space API endpoints in parallel
    const [
      hashrateResponse,
      feesResponse,
      difficultyResponse,
      mempoolResponse,
      heightResponse,
    ] = await Promise.allSettled([
      fetch("https://mempool.space/api/v1/mining/hashrate/3d"),
      fetch("https://mempool.space/api/v1/fees/recommended"),
      fetch("https://mempool.space/api/v1/difficulty-adjustment"),
      fetch("https://mempool.space/api/mempool"),
      fetch("https://mempool.space/api/blocks/tip/height"),
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

    if (heightResponse.status === "rejected") {
      failedEndpoints.push("Height API failed: " + heightResponse.reason);
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

    if (heightResponse.status !== "fulfilled" || !heightResponse.value.ok) {
      throw new Error("Failed to fetch height data");
    }

    // Process hashrate data
    const rawHashrateData = await hashrateResponse.value.json();
    const hashrateData = MempoolHashrateSchema.parse(rawHashrateData);

    // The 3d hashrate endpoint returns an object with hashrates array and currentHashrate
    const currentHashrate = hashrateData.currentHashrate;
    const hashrateInEH = currentHashrate / 1e18; // Convert to exahash

    const hashrate = {
      value: hashrateInEH.toFixed(2),
      unit: "EH/s",
      timestamp: Date.now(),
    };

    // Process fees data
    const rawFeesData = await feesResponse.value.json();
    const feesData = MempoolFeesSchema.parse(rawFeesData);

    // Process difficulty data
    const rawDifficultyData = await difficultyResponse.value.json();
    const difficultyData = MempoolDifficultySchema.parse(rawDifficultyData);
    const previousChange = (difficultyData.previousRetarget - 1) * 100;
    const estimatedChange = (difficultyData.difficultyChange - 1) * 100;
    const difficulty = {
      previousChange,
      estimatedChange,
      estimatedRetargetDate: difficultyData.estimatedRetargetDate,
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

    // Halving calculations
    const currentHeight = Number(await heightResponse.value.text());

    const HALVING_INTERVAL = 210_000;
    const LAST_HALVING_HEIGHT = 840_000;
    const NEXT_HALVING_HEIGHT = LAST_HALVING_HEIGHT + HALVING_INTERVAL; // 1_050_000

    const blocksSinceHalving = currentHeight - LAST_HALVING_HEIGHT; // 69,031
    const blocksUntilNextHalving = NEXT_HALVING_HEIGHT - currentHeight; // 140,969
    const progressPercent = (blocksSinceHalving / HALVING_INTERVAL) * 100; // ~32.87%

    const halving = {
      nextHalvingDate: NEXT_HALVING_HEIGHT,
      remainingBlocks: blocksUntilNextHalving,
      remainingDays: Math.round(blocksUntilNextHalving / (6 * 24)), // ~10 minutes per block
      progressPercent,
    };

    // Prepare response data
    const responseData: BitcoinStatsData = {
      hashrate,
      fees: feesData,
      difficulty,
      mempool,
      halving,
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
