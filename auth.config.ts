/**
 * Edge-safe Auth.js config — imported by middleware.ts, so it must stay free
 * of Node-only imports (mongodb, bcryptjs). The Credentials provider lives in
 * auth.ts, which only runs in the Node runtime.
 */
import type { NextAuthConfig } from "next-auth";

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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = PUBLIC_PATHS.includes(nextUrl.pathname);

      // Logged-in users never see the marketing/auth pages — /home is their /.
      if (isLoggedIn && isPublic) {
        return Response.redirect(new URL("/home", nextUrl));
      }

      // false → NextAuth redirects to pages.signIn with ?callbackUrl=<here>.
      return isLoggedIn || isPublic;
    },
  },
} satisfies NextAuthConfig;
