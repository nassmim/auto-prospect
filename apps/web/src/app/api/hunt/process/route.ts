/**
 * Hunt Process API Endpoint
 *
 * Processes a single hunt: fetches matching ads, allocates to channels,
 * personalizes messages, dispatches to worker queues, consumes credits,
 * and creates leads.
 *
 * This endpoint is called by the worker's daily orchestrator to process
 * each hunt independently.
 */

import { processSingleHunt } from "@/services/hunt.service";
import { NextRequest, NextResponse } from "next/server";

const WEB_APP_SECRET = process.env.WEB_APP_SECRET;

if (!WEB_APP_SECRET) {
  throw new Error("WEB_APP_SECRET environment variable is required");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (token !== WEB_APP_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { huntId, accountId } = body;

    if (!huntId || !accountId) {
      return NextResponse.json(
        { error: "Missing required fields: huntId, accountId" },
        { status: 400 }
      );
    }

    // Process the hunt
    const result = await processSingleHunt(huntId, accountId);

    return NextResponse.json({
      success: true,
      messagesDispatched: result.messagesDispatched,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
