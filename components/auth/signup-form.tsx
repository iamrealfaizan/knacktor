"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction, type SignupState } from "@/app/(auth)/signup/actions";

const INITIAL_STATE: SignupState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-11 rounded-xl font-semibold bg-kn-current text-white hover:bg-kn-current hover:opacity-90 shadow-[0_4px_14px_var(--kn-accent-soft)]"
    >
      {pending ? "Creating account…" : "Create account"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[13px] text-kn-error">{message}</p>;
}

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, INITIAL_STATE);
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.formError && (
        <div className="rounded-lg border border-kn-error-border bg-kn-error-subtle px-3.5 py-2.5 text-sm text-kn-error">
          {state.formError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-kn-ink-1">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          className="h-10 rounded-lg border-kn-border-1 bg-kn-surface-0"
          aria-invalid={!!errors?.name}
        />
        <FieldError message={errors?.name} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="username" className="text-kn-ink-1">
          Username
        </Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          placeholder="ada_lovelace"
          className="h-10 rounded-lg border-kn-border-1 bg-kn-surface-0"
          aria-invalid={!!errors?.username}
        />
        <FieldError message={errors?.username} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-kn-ink-1">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ada@example.com"
          className="h-10 rounded-lg border-kn-border-1 bg-kn-surface-0"
          aria-invalid={!!errors?.email}
        />
        <FieldError message={errors?.email} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-kn-ink-1">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="h-10 rounded-lg border-kn-border-1 bg-kn-surface-0"
          aria-invalid={!!errors?.password}
        />
        <FieldError message={errors?.password} />
      </div>

      <SubmitButton />
    </form>
  );
}
