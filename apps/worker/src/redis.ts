import IORedis from "ioredis";

/**
 * Shared Redis connection for BullMQ queues and workers
 */
export const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);
