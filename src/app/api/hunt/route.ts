import { sendAlertToAdmin } from "@/actions/general.actions";
import { runDailyHunts } from "@/actions/hunt-background.actions";

export async function POST(): Promise<Response> {
  try {
    await runDailyHunts();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const today = new Date();
    await sendAlertToAdmin(
      `Error while running daily hunts: ${today.toDateString()}, error: ${error}`,
    ).catch(() => {});
    return new Response(
      JSON.stringify({
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
}
