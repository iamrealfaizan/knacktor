import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account · Knacktor",
};

export default function SignupPage() {
  return (
    <div className="rounded-2xl bg-kn-surface-0 border border-kn-border-0 shadow-[0_6px_20px_var(--kn-accent-soft)] p-7 sm:p-8">
      <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-kn-current">
        CREATE ACCOUNT
      </span>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-kn-ink-0">
        Start seeing algorithms
      </h1>
      <p className="mt-1.5 text-sm text-kn-ink-1">
        Free account — email and password, nothing else.
      </p>

      <div className="mt-7">
        <SignupForm />
      </div>

      <p className="mt-6 text-sm text-kn-ink-1">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-kn-current hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
