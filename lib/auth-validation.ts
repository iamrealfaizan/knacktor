/**
 * Shared zod schemas for auth input validation.
 * Used by the signup server action; the login form validates minimally
 * client-side (credentials are verified server-side in auth.ts anyway).
 */
import { z } from "zod";

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(60, "Name must be 60 characters or fewer."),
  username: z
    .string()
    .trim()
    .regex(
      USERNAME_REGEX,
      "Username must be 3–20 characters: letters, numbers, or underscores."
    ),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type SignupInput = z.infer<typeof signupSchema>;
