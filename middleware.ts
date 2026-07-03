/**
 * Route gating (see auth.config.ts `authorized`): everything requires login
 * except /, /login, /signup. The matcher excludes /api/* (read-only content
 * APIs stay open and /api/auth must be reachable), Next internals, and any
 * path with a file extension (static assets, app/fonts).
 */
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|fonts|.*\\..*).*)"],
};
