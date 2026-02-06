import { pages } from "@/config/routes";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? pages.dashboard;
  console.log(code);
  console.log(next);
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log(error);
    if (!error) {
      // Redirect to the dashboard or next URL
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return error if code exchange failed
  return NextResponse.redirect(`${origin}${pages.login}?error=auth_failed`);
}
