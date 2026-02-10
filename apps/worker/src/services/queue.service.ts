/**
 * Queue Service - Worker Context
 *
 * BullMQ queue management utilities
 */

import { Queue, Job } from "bullmq";
import { TContactChannel, EContactChannel } from "@auto-prospect/shared/src/config/message.config";

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

// Queue name mapping
const QUEUE_NAMES = {
  [EContactChannel.WHATSAPP_TEXT]: "whatsapp",
  [EContactChannel.SMS]: "sms",
  [EContactChannel.RINGLESS_VOICE]: "voice",
  scraping: "scraping",
  "daily-orchestrator": "daily-orchestrator",
} as const;

/**
 * Dispatches a job to the appropriate channel queue
 */
export async function dispatchToChannel<T = any>(
  channel: TContactChannel,
  jobData: T,
  options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
  }
): Promise<Job<T>> {
  const queueName = QUEUE_NAMES[channel];

  if (!queueName) {
    throw new Error(`Unknown channel: ${channel}`);
  }

  const queue = new Queue(queueName, {
    connection: REDIS_CONNECTION,
  });

  const job = await queue.add(queueName, jobData, {
    delay: options?.delay,
    priority: options?.priority,
    attempts: options?.attempts || 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  });

  await queue.close();

  return job;
}

/**
 * Gets job status from a queue
 */
export async function getJobStatus(
  queueName: string,
  jobId: string
): Promise<{
  status: "completed" | "failed" | "delayed" | "active" | "waiting" | "unknown";
  data?: any;
  error?: string;
}> {
  const queue = new Queue(queueName, {
    connection: REDIS_CONNECTION,
  });

  try {
    const job = await queue.getJob(jobId);

    if (!job) {
      return { status: "unknown" };
    }

    const state = await job.getState();
    const data = job.data;
    const error = job.failedReason;

    await queue.close();

    return {
      status: state as any,
      data,
      error,
    };
  } catch (error) {
    await queue.close();
    throw error;
  }
}

/**
 * Retries a failed job
 */
export async function retryFailedJob(
  queueName: string,
  jobId: string
): Promise<void> {
  const queue = new Queue(queueName, {
    connection: REDIS_CONNECTION,
  });

  try {
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    await job.retry();
    await queue.close();
  } catch (error) {
    await queue.close();
    throw error;
  }
}

/**
 * Gets queue statistics
 */
export async function getQueueStats(queueName: string): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = new Queue(queueName, {
    connection: REDIS_CONNECTION,
  });

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    await queue.close();

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  } catch (error) {
    await queue.close();
    throw error;
  }
}
