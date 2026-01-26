import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts data using AES-256-GCM
 * @param data - The string data to encrypt
 * @param key - 32-byte encryption key (from env WHATSAPP_ENCRYPTION_KEY)
 * @returns Base64 encoded string containing: iv + authTag + encryptedData
 */
export const encryptCredentials = (data: string, key: string): string => {
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (64 hex characters)");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Combine: iv (16 bytes) + authTag (16 bytes) + encrypted data
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "base64"),
  ]);

  return combined.toString("base64");
};

/**
 * Decrypts data encrypted with encryptCredentials
 * @param encryptedData - Base64 encoded string from encryptCredentials
 * @param key - 32-byte encryption key (same as used for encryption)
 * @returns Decrypted string
 */
export const decryptCredentials = (encryptedData: string, key: string): string => {
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (64 hex characters)");
  }

  const combined = Buffer.from(encryptedData, "base64");

  // Extract: iv (16 bytes) + authTag (16 bytes) + encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
};

/**
 * Generates a random 32-byte encryption key
 * Use this once to generate WHATSAPP_ENCRYPTION_KEY for .env
 * @returns 64-character hex string
 */
export const generateEncryptionKey = (): string => {
  return randomBytes(32).toString("hex");
};
