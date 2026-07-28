/**
 * Edge-safe Auth.js config — imported by middleware.ts, so it must stay free
 * of Node-only imports (mongodb, bcryptjs). The Credentials provider lives in
 * auth.ts, which only runs in the Node runtime.
 */
import type { NextAuthConfig } from "next-auth";
import { isAdmin, normalizeRole } from "./lib/rbac";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [], // added in auth.ts (Node runtime only)
  callbacks: {
    /**
     * jwt/session live HERE, not in auth.ts, because middleware instantiates
     * NextAuth from this config alone. Anything defined only in auth.ts is
     * invisible to the edge: `auth.user` in `authorized` below would fall back
     * to the default session shape (name/email/image) and `role` would always
     * be undefined — silently redirecting every admin away from /admin.
     *
     * Both are pure functions over the token, so they're edge-safe.
     */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = normalizeRole(user.role);
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      if (typeof token.username === "string")
        session.user.username = token.username;
      session.user.role = normalizeRole(token.role);
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = PUBLIC_PATHS.includes(nextUrl.pathname);

      // Layer 1 of 3 for /admin (see rules/Tracker.md D25). This is the cheap
      // edge rejection based on the JWT's role snapshot — it is NOT sufficient
      // on its own, because that snapshot can be up to 30 days stale.
      // app/admin/layout.tsx re-reads the DB, and every admin Server Action
      // calls requireAdmin() before it writes.
      if (nextUrl.pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false; // → /login?callbackUrl=/admin/...
        if (!isAdmin(auth.user.role)) {
          return Response.redirect(new URL("/home", nextUrl));
        }
        return true;
      }

      // Logged-in users never see the marketing/auth pages — /home is their /.
      if (isLoggedIn && isPublic) {
        return Response.redirect(new URL("/home", nextUrl));
      }

      // false → NextAuth redirects to pages.signIn with ?callbackUrl=<here>.
      return isLoggedIn || isPublic;
    },
  },
} satisfies NextAuthConfig;
