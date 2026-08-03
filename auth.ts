/**
 * Full Auth.js setup (Node runtime). Middleware uses auth.config.ts instead —
 * this file pulls in mongodb/bcryptjs via user-service and must never be
 * imported from edge code.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { findUserByIdentifier, verifyPassword } from "@/lib/user-service";
import { effectiveRole, normalizeStatus } from "@/lib/rbac";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: {},
        password: {},
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier ?? "");
        const password = String(credentials?.password ?? "");
        if (!identifier || !password) return null;

        const user = await findUserByIdentifier(identifier);
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        // Deactivated accounts cannot sign in. Returning null gives the same
        // "invalid credentials" surface as a wrong password — deliberate, so
        // the form can't be used to probe which accounts are deactivated.
        // Already-signed-in sessions are cut off separately by
        // lib/session-guard.ts on the next navigation.
        if (normalizeStatus(user.status) === "inactive") return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username,
          role: effectiveRole(user.role, user.email),
        };
      },
    }),
  ],
  // jwt/session/authorized all come from authConfig — they must live there so
  // middleware (which builds NextAuth from authConfig alone) sees them too.
  // Do NOT re-declare them here; an override would apply on the server only and
  // silently diverge from what the edge sees.
  callbacks: authConfig.callbacks,
});
