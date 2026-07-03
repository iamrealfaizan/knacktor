/**
 * Full Auth.js setup (Node runtime). Middleware uses auth.config.ts instead —
 * this file pulls in mongodb/bcryptjs via user-service and must never be
 * imported from edge code.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { findUserByIdentifier, verifyPassword } from "@/lib/user-service";

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

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      if (typeof token.username === "string")
        session.user.username = token.username;
      return session;
    },
  },
});
