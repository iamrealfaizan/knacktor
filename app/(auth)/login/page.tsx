import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in · Knacktor",
};

export default function LoginPage() {
  return (
    <div className="rounded-2xl bg-kn-surface-0 border border-kn-border-0 shadow-[0_6px_20px_var(--kn-accent-soft)] p-7 sm:p-8">
      <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-kn-current">
        WELCOME BACK
      </span>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-kn-ink-0">
        Sign in to Knacktor
      </h1>
      <p className="mt-1.5 text-sm text-kn-ink-1">
        Pick up right where you left off.
      </p>

      <div className="mt-7">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-6 text-sm text-kn-ink-1">
        No account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-kn-current hover:underline underline-offset-4"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
