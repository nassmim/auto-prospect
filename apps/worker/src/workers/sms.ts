import { Job } from "bullmq";

interface SmsJob {
  recipientPhone: string;
  message: string;
}

export async function smsWorker(job: Job<SmsJob>) {
  console.log(`Processing SMS job ${job.id}:`, job.data);

  const { recipientPhone, message } = job.data;

  try {
    // TODO: Implement SMS provider integration (e.g., Twilio, Vonage)
    console.log(`Sending SMS to ${recipientPhone}: ${message}`);

    // Placeholder
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { success: true, messageId: "placeholder-sms-id" };
  } catch (error) {
    console.error(`SMS job ${job.id} failed:`, error);
    throw error;
  }
}
