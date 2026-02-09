"use client";

import { useState } from "react";
import { signInWithMagicLink, signInWithPassword } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthMode = "magic-link" | "password";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("magic-link");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await signInWithMagicLink(email);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({
        type: "success",
        text: "Check your email for the magic link! (In development, check Inbucket at http://localhost:54324)",
      });
    }

    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await signInWithPassword(email, password);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
      setLoading(false);
    }
    // If successful, user will be redirected by the action
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setMode("magic-link")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "magic-link"
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "password"
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            Password
          </button>
        </div>

        {/* Magic Link Form */}
        {mode === "magic-link" && (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-magic">Email</Label>
              <Input
                id="email-magic"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              We&apos;ll send you a magic link to sign in without a password.
              <br />
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                In development: Check Inbucket at{" "}
                <a
                  href="http://localhost:54324"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  localhost:54324
                </a>
              </span>
            </p>
          </form>
        )}

        {/* Password Form */}
        {mode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-password">Email</Label>
              <Input
                id="email-password"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        )}

        {/* Messages */}
        {message && (
          <div
            className={`rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
