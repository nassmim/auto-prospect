import { pages } from "@/config/routes";
import { createClient } from "@/lib/supabase/server";
import { getUserAccount } from "@/services/account.service";
import { NextResponse } from "next/server";

const SIGNUP_NOT_ALLOWED = "signup_not_allowed";

function isSignupBlockedError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("signups not allowed") ||
    lower.includes("flow state not found")
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/dashboard";

  // Handle errors from OAuth provider
  if (error || errorDescription) {
    const rawMessage = errorDescription || error || "";
    const errorCode = isSignupBlockedError(rawMessage)
      ? SIGNUP_NOT_ALLOWED
      : rawMessage;
    return NextResponse.redirect(
      `${origin}/${pages.login}?error=${encodeURIComponent(errorCode)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Verify the user has a pre-approved account record
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          // Check if user is pre-approved by admin
          // The trigger handle_new_user() auto-creates an accounts record on signup,
          // so we check confirmed_by_admin instead of just existence
          const account = await getUserAccount(undefined, {
            columnsToKeep: { confirmedByAdmin: true },
          });

          if (!account?.confirmedByAdmin) {
            await supabase.rpc("delete_user");
            await supabase.auth.signOut();
            return NextResponse.redirect(
              `${origin}/${pages.login}?error=${encodeURIComponent(SIGNUP_NOT_ALLOWED)}`,
            );
          }
        } catch {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${origin}/${pages.login}?error=${encodeURIComponent("auth_error")}`,
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    const errorCode = isSignupBlockedError(exchangeError.message)
      ? SIGNUP_NOT_ALLOWED
      : exchangeError.message;
    return NextResponse.redirect(
      `${origin}/${pages.login}?error=${encodeURIComponent(errorCode)}`,
    );
  }

  // No code and no error - something unexpected happened
  return NextResponse.redirect(`${origin}/${pages.login}?error=auth_error`);
}
