import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      /**
       * Snapshot taken at sign-in. Good enough to hide admin UI and to let
       * edge middleware reject non-admins cheaply, but it can be STALE for up
       * to the 30-day session lifetime — never the last word on authorization.
       * Anything that mutates data re-reads the DB via lib/admin-guard.ts.
       */
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: UserRole;
  }
}
