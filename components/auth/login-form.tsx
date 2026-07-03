"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const rawCallbackUrl = searchParams.get("callbackUrl");
  // Only honor relative paths — never redirect off-site.
  const callbackUrl =
    rawCallbackUrl?.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/home";

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      identifier: form.get("identifier"),
      password: form.get("password"),
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email/username or password.");
      setPending(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {justRegistered && !error && (
        <div className="flex items-center gap-2 rounded-lg border border-kn-result-border bg-kn-result-subtle px-3.5 py-2.5 text-sm text-kn-result">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Account created — sign in to continue.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-kn-error-border bg-kn-error-subtle px-3.5 py-2.5 text-sm text-kn-error">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="identifier" className="text-kn-ink-1">
          Email or username
        </Label>
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          placeholder="ada@example.com"
          required
          className="h-10 rounded-lg border-kn-border-1 bg-kn-surface-0"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-kn-ink-1">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
          className="h-10 rounded-lg border-kn-border-1 bg-kn-surface-0"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full h-11 rounded-xl font-semibold bg-kn-current text-white hover:bg-kn-current hover:opacity-90 shadow-[0_4px_14px_var(--kn-accent-soft)]"
      >
        {pending ? "Signing in…" : "Sign in"}
        {!pending && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}
