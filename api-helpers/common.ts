import { createClient } from "redis";

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

export async function getRedis() {
  if (!redisClient) {
    const url = process.env.REDIS_URL;

    if (!url) {
      throw new Error("REDIS_URL not configured");
    }

    redisClient = createClient({ url });
    await redisClient.connect();
  }

  return redisClient;
}
