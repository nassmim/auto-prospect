import { sendAlertToAdmin } from "@/actions/general.actions";

export async function POST(): Promise<Response> {
  try {
    await runAutoSender();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const today = new Date();
    await sendAlertToAdmin(
      `Error while sending the messages: ${today.toDateString()}, error: ${error}`,
    ).catch(() => {});
    return new Response(
      JSON.stringify({
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
}
