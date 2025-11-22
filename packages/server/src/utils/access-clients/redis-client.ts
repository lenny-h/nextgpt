import { createClient, type RedisClientType } from "redis";

const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("[Redis Error]: ", err));

// Connect once on module load
let clientPromise: Promise<typeof redisClient> | null = null;

export async function getRedisClient(): Promise<typeof redisClient> {
  if (!clientPromise) {
    clientPromise = redisClient.connect().then(() => redisClient);
  }
  return clientPromise;
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
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
