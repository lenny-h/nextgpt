import { createClient } from "redis";

// Track when the client was created
let redisClientInstance: ReturnType<typeof createClient> | null = null;
let clientCreationTime: number | null = null;
let isConnecting = false;

// Client expires after 1 hour to prevent stale connections
const CLIENT_MAX_AGE = 60 * 60 * 1000;

export async function getRedisClient(): Promise<
  ReturnType<typeof createClient>
> {
  const now = Date.now();

  if (
    !redisClientInstance ||
    !clientCreationTime ||
    now - clientCreationTime > CLIENT_MAX_AGE
  ) {
    if (redisClientInstance) {
      try {
        await redisClientInstance.quit();
      } catch (error) {
        console.error("[Redis Client]: Error closing Redis client:", error);
      }
      redisClientInstance = null;
      isConnecting = false;
    }

    redisClientInstance = createClient({
      url: process.env.REDIS_URL,
    });

    redisClientInstance.on("error", (err: Error) => {
      console.error("[Redis Client]: Redis Client Error", err);
    });

    isConnecting = true;
    await redisClientInstance.connect();
    isConnecting = false;

    clientCreationTime = now;
  } else if (isConnecting) {
    // Wait a bit if connection is in progress
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getRedisClient();
  }

  return redisClientInstance;
}

// Cache key generators
export function getUserPermissionsCacheKey(userId: string): string {
  return `user:${userId}:permissions`;
}

// Cache TTL - 7 days
export const PERMISSIONS_CACHE_TTL = 7 * 24 * 60 * 60;

// Permission cache interface
export interface UserPermissionsCache {
  bucket_ids: string[];
  course_ids: string[];
  file_ids: string[];
}
