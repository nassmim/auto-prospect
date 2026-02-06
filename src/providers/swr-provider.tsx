"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

/**
 * SWR Global Configuration Provider
 *
 * Wraps the application with SWRConfig to provide sensible defaults:
 * - Deduping interval prevents rapid duplicate requests
 * - Revalidation on focus/reconnect keeps data fresh
 * - Automatic error retry with exponential backoff
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 5000,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        errorRetryCount: 3,
        shouldRetryOnError: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
