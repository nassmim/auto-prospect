import { handleLobstrWebhook } from "@/services/lobstr.service";

/* 
  Once a run has finished, Lobstr sends us a webhook from which we can get 
  the results from the run
*/
export async function POST(req: Request): Promise<Response> {
  const { id: runId } = await req.json();

  // We don't await here because we immediately return (200 ok) to webhook provider
  const processingPromise = handleLobstrWebhook(runId);
  // Use waitUntil to keep function alive until processing completes
  // This prevents Vercel from killing the function after returning the response
  if ("waitUntil" in req && typeof req.waitUntil === "function") {
    req.waitUntil(processingPromise);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
