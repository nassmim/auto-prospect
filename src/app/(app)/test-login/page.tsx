import { redirect } from "next/navigation";
import { getUser } from "@/actions/auth.actions";
import { pages } from "@/config/routes";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getUser();

  // If already logged in, redirect to dashboard
  if (user) {
    redirect(pages.dashboard);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md px-4">
        <LoginForm />
      </div>
    </div>
  );
}
