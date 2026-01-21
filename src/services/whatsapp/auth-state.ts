import {
  useMultiFileAuthState,
  type AuthenticationState,
} from "@whiskeysockets/baileys";
import path from "path";
import fs from "fs/promises";

const SESSIONS_DIR = ".whatsapp-sessions";

function getSessionPath(accountId: string): string {
  return path.join(process.cwd(), SESSIONS_DIR, accountId);
}

export async function getAuthState(
  accountId: string
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const sessionPath = getSessionPath(accountId);

  // Ensure directory exists
  await fs.mkdir(sessionPath, { recursive: true });

  return useMultiFileAuthState(sessionPath);
}

export async function deleteAuthState(accountId: string): Promise<void> {
  const sessionPath = getSessionPath(accountId);

  try {
    await fs.rm(sessionPath, { recursive: true, force: true });
  } catch {
    // Ignore if directory doesn't exist
  }
}

export async function hasAuthState(accountId: string): Promise<boolean> {
  const sessionPath = getSessionPath(accountId);
  const credsPath = path.join(sessionPath, "creds.json");

  try {
    await fs.access(credsPath);
    return true;
  } catch {
    return false;
  }
}
