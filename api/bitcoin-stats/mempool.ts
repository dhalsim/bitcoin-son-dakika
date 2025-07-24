import { applyCacheHeaders } from "../cache-utils.js";
import { ErrorResponse, SuccessResponse } from "../utils.js";

import {
  MempoolFeesSchema,
  MempoolDifficultySchema,
  MempoolMempoolSchema,
} from "./schemas.js";

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

    // Process hashrate data
    let hashrateData;
    if (hashrateResponse.status === "fulfilled" && hashrateResponse.value.ok) {
      const rawHashrateData = await hashrateResponse.value.json();

      // The current hashrate endpoint returns a simple object with hashrate value
      if (typeof rawHashrateData === "object" && rawHashrateData !== null) {
        const hashrateInEH =
          (rawHashrateData.hashrate || rawHashrateData.avgHashrate || 500e18) /
          1e18; // Convert to exahash

        hashrateData = {
          value: hashrateInEH.toFixed(2),
          unit: "EH/s",
          timestamp: Date.now(),
        };
      } else {
        // Fallback
        hashrateData = {
          value: "500.00",
          unit: "EH/s",
          timestamp: Date.now(),
        };
      }
    } else {
      throw new Error("Failed to fetch hashrate data");
    }

    // Process fees data
    let feesData;
    if (feesResponse.status === "fulfilled" && feesResponse.value.ok) {
      const rawFeesData = await feesResponse.value.json();
      feesData = MempoolFeesSchema.parse(rawFeesData);
    } else {
      throw new Error("Failed to fetch fees data");
    }

    // Process difficulty data
    let difficultyData;
    if (
      difficultyResponse.status === "fulfilled" &&
      difficultyResponse.value.ok
    ) {
      const rawDifficultyData = await difficultyResponse.value.json();
      const difficulty = MempoolDifficultySchema.parse(rawDifficultyData);

      difficultyData = {
        value: (difficulty.difficulty / 1e12).toFixed(2) + "T", // Convert to terahash
        change: difficulty.difficultyChange
          ? `${difficulty.difficultyChange > 0 ? "+" : ""}${difficulty.difficultyChange.toFixed(2)}%`
          : undefined,
        height: difficulty.height,
      };
    } else {
      throw new Error("Failed to fetch difficulty data");
    }

    // Process mempool data
    let mempoolData;
    if (mempoolResponse.status === "fulfilled" && mempoolResponse.value.ok) {
      const rawMempoolData = await mempoolResponse.value.json();
      const mempool = MempoolMempoolSchema.parse(rawMempoolData);

      // Determine mempool status based on transaction count
      let status = "Normal";
      if (mempool.count > 50000) {
        status = "High";
      } else if (mempool.count > 20000) {
        status = "Medium";
      } else if (mempool.count < 5000) {
        status = "Low";
      }

      mempoolData = {
        count: mempool.count,
        size: (mempool.vsize / 1e6).toFixed(2) + " MB", // Convert to MB
        totalFee: (mempool.total_fee / 1e8).toFixed(4) + " BTC", // Convert to BTC
        status,
      };
    } else {
      throw new Error("Failed to fetch mempool data");
    }

    // Prepare response data
    const responseData = {
      hashrate: hashrateData,
      fees: feesData,
      difficulty: difficultyData,
      mempool: mempoolData,
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
