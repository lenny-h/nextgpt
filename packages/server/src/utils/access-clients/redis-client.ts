import { createClient, type RedisClientType } from "redis";
import { createLogger } from "../../logger.js";

const logger = createLogger("redis-client");

const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      // Reconnect after exponential backoff (max 3 seconds)
      const delay = Math.min(retries * 100, 3000);
      logger.debug(`Redis reconnect attempt ${retries}, waiting ${delay}ms`);
      return delay;
    },
  },
});

redisClient.on("error", (err) => {
  logger.error("Redis client error", err);
});

redisClient.on("ready", () => {
  logger.info("Redis connection ready");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis client reconnecting...");
});

redisClient.on("end", () => {
  logger.warn("Redis connection ended");
});

// Connect once on module load
let clientPromise: Promise<typeof redisClient> | null = null;

export async function getRedisClient(): Promise<typeof redisClient> {
  // If connection is broken, reset the promise to force reconnection
  if (clientPromise && !redisClient.isOpen && !redisClient.isReady) {
    logger.warn("Redis connection lost, reinitializing...");
    clientPromise = null;
  }

  if (!clientPromise) {
    logger.info("Initializing Redis connection", {
      url: process.env.REDIS_URL ? "configured" : "not configured",
    });
    clientPromise = redisClient
      .connect()
      .then(() => {
        logger.info("Redis client connected successfully");
        return redisClient;
      })
      .catch((err) => {
        logger.error("Failed to connect to Redis", err);
        clientPromise = null; // Reset promise on connection failure
        throw err;
      });
  }
  return clientPromise;
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  if (redisClient.isOpen) {
    logger.info("SIGTERM received, closing Redis connection");
    try {
      await redisClient.quit();
      logger.info("Redis connection closed gracefully");
    } catch (err) {
      logger.error("Error closing Redis connection", err);
    }
  }
});

export function getUserPermissionsCacheKey(userId: string): string {
  return `user:${userId}:permissions`;
}

export const PERMISSIONS_CACHE_TTL = 7 * 24 * 60 * 60;

export interface UserPermissionsCache {
  bucket_ids: string[];
  course_ids: string[];
  file_ids: string[];
  document_ids: string[];
  prompt_ids: string[];
}
