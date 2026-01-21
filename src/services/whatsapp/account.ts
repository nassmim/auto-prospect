import { eq } from "drizzle-orm";
import { defaultDBClient } from "@/lib/drizzle/dbClient";
import { whatsappAccounts } from "@/schema";

export async function findWhatsappAccountByUserId(userId: string) {
  const accounts = await defaultDBClient
    .select()
    .from(whatsappAccounts)
    .where(eq(whatsappAccounts.accountId, userId))
    .limit(1);

  return accounts[0] || null;
}

export async function createWhatsappAccount(userId: string, phoneNumber: string) {
  const result = await defaultDBClient
    .insert(whatsappAccounts)
    .values({
      accountId: userId,
      phoneNumber,
      status: "pending",
    })
    .returning();

  return result[0];
}

export async function updateWhatsappAccount(userId: string, phoneNumber: string) {
  const result = await defaultDBClient
    .update(whatsappAccounts)
    .set({
      phoneNumber,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(whatsappAccounts.accountId, userId))
    .returning();

  return result[0];
}

export async function upsertWhatsappAccount(userId: string, phoneNumber: string) {
  const existing = await findWhatsappAccountByUserId(userId);

  if (existing) {
    return updateWhatsappAccount(userId, phoneNumber);
  }

  return createWhatsappAccount(userId, phoneNumber);
}

export async function updateWhatsappAccountStatus(
  userId: string,
  status: "pending" | "connecting" | "connected" | "disconnected"
) {
  const result = await defaultDBClient
    .update(whatsappAccounts)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(whatsappAccounts.accountId, userId))
    .returning();

  return result[0];
}
