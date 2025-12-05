// src/lib/auth.ts
import {
  type NextAuthOptions,
  type DefaultSession,
  getServerSession,
  type Session,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";

/**
 * Extend NextAuth's Session/User to include a role.
 */
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "admin" | "operator" | "regulator" | "analyst" | "consumer";
    };
  }

  interface User {
    role: "admin" | "operator" | "regulator" | "analyst" | "consumer";
  }
}

export const authOptions: NextAuthOptions = {
  // No database adapter for now – pure JWT sessions
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
          console.warn(
            "ADMIN_EMAIL / ADMIN_PASSWORD are not set – denying all credentials logins."
          );
          return null;
        }

        // Simple "bootstrap" admin auth – replace with real DB-backed auth later.
        if (
          credentials.email === adminEmail &&
          credentials.password === adminPassword
        ) {
          return {
            id: "admin",
            name: "Admin",
            email: credentials.email,
            role: "admin",
          } as any;
        }

        // You can expand here later:
        // - Look up operator / regulator / analyst accounts in the DB
        // - Check hashed passwords, etc.
        return null;
      },
    }),
    // If you had OAuth providers (Google, etc.) before, re-add them here.
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On first login, persist id/role from the user into the token
      if (user) {
        token.id = (user as any).id ?? token.id ?? "anonymous";
        token.role = (user as any).role ?? token.role ?? "admin";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id ?? "anonymous";
        (session.user as any).role = (token as any).role ?? "consumer";
      }
      return session;
    },
  },

  // Use the built‑in NextAuth sign‑in page at /api/auth/signin
  pages: {},
};

/**
 * Require that a user is signed in.
 * Redirects to the NextAuth sign-in with a callbackUrl back to home.
 */
export async function requireUser(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/");
  }
  return session;
}

/**
 * Require that the user has one of the allowed roles.
 * Redirects home if unauthorized.
 */
export async function requireRole(
  roles: Session["user"]["role"] | Session["user"]["role"][]
): Promise<Session> {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const session = await requireUser();

  const role = (session.user as any).role as Session["user"]["role"];
  if (!allowed.includes(role)) {
    // Could be /forbidden later; for now, bounce home.
    redirect("/");
  }

  return session;
}
