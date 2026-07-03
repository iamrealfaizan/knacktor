"use server";

import { redirect } from "next/navigation";
import { signupSchema } from "@/lib/auth-validation";
import { createUser } from "@/lib/user-service";

export interface SignupState {
  fieldErrors?: Partial<
    Record<"name" | "username" | "email" | "password", string>
  >;
  formError?: string;
}

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: SignupState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NonNullable<
        SignupState["fieldErrors"]
      >;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { fieldErrors };
  }

  let result;
  try {
    result = await createUser(parsed.data);
  } catch {
    return { formError: "Something went wrong. Please try again." };
  }

  if (!result.ok) {
    return { fieldErrors: result.fieldErrors };
  }

  redirect("/login?registered=1");
}
