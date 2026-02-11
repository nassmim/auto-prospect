import { Queue } from "bullmq";
import { connection } from "../redis";

export const QUEUE_NAMES = {
  WHATSAPP: "whatsapp",
  SMS: "sms",
  VOICE: "voice",
  SCRAPING: "scraping",
  DAILY_HUNTS_ORCHESTRATOR: "daily-hunts-orchestrator",
} as const;

export const whatsappQueue = new Queue(QUEUE_NAMES.WHATSAPP, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const smsQueue = new Queue(QUEUE_NAMES.SMS, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const voiceQueue = new Queue(QUEUE_NAMES.VOICE, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const scrapingQueue = new Queue(QUEUE_NAMES.SCRAPING, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const dailyHuntsOrchestratorQueue = new Queue(
  QUEUE_NAMES.DAILY_HUNTS_ORCHESTRATOR,
  {
    connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  }
);

export const queues = {
  [QUEUE_NAMES.WHATSAPP]: whatsappQueue,
  [QUEUE_NAMES.SMS]: smsQueue,
  [QUEUE_NAMES.VOICE]: voiceQueue,
  [QUEUE_NAMES.SCRAPING]: scrapingQueue,
  [QUEUE_NAMES.DAILY_HUNTS_ORCHESTRATOR]: dailyHuntsOrchestratorQueue,
};

export async function getQueueStats(queueName: string) {
  const queue = queues[queueName as keyof typeof queues];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    name: queueName,
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

export async function getAllQueuesStats() {
  const stats = await Promise.all(
    Object.keys(queues).map((queueName) => getQueueStats(queueName)),
  );
  return stats;
}
