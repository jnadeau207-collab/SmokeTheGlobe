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
 * Extend NextAuth's Session and User objects to include a strong role field.
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

/**
 * Central NextAuth configuration used by both:
 * - /api/auth/[...nextauth] (Pages Router)
 * - App Router helpers (requireUser / requireRole)
 *
 * NOTE: We intentionally use a "bootstrap" credentials admin for now,
 * backed by environment variables only. No secrets are hardcoded here.
 */
export const authOptions: NextAuthOptions = {
  // Pure JWT sessions; no DB adapter yet.
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Admin credentials",
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

        // Simple single-admin bootstrap flow.
        // For production, replace this with a proper user store
        // and hashed passwords.
        if (
          credentials.email.toLowerCase() === adminEmail.toLowerCase() &&
          credentials.password === adminPassword
        ) {
          return {
            id: "admin",
            name: "Admin",
            email: credentials.email,
            role: "admin",
          } as any;
        }

        // Future: support operator / regulator / analyst accounts here.
        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On first login, persist id/role from the user into the token.
      if (user) {
        (token as any).id = (user as any).id ?? (token as any).id ?? "anonymous";
        (token as any).role =
          (user as any).role ?? (token as any).role ?? "consumer";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id ?? "anonymous";
        (session.user as any).role =
          (token as any).role ?? ("consumer" as Session["user"]["role"]);
      }
      return session;
    },
  },

  // Use our custom sign-in page, not the default /api/auth/signin UI.
  pages: {
    signIn: "/auth/signin",
  },
};

/**
 * Require a logged-in user in an App Router server context.
 *
 * @param callbackUrl Where to send the user back to after successful login.
 *                    Must be a path on this same site (e.g. "/admin").
 */
export async function requireUser(
  callbackUrl: string = "/"
): Promise<Session> {
  const session = await getServerSession(authOptions);

  if (!session) {
    const encoded = encodeURIComponent(callbackUrl || "/");
    // NextAuth will use callbackUrl to redirect back after login.
    redirect(`/auth/signin?callbackUrl=${encoded}`);
  }

  return session;
}

/**
 * Require that the currently logged-in user has one of the allowed roles.
 *
 * @param roles       Single role or array of roles that are allowed.
 * @param callbackUrl Where the user *intended* to go (used for post-login redirect).
 */
export async function requireRole(
  roles: Session["user"]["role"] | Session["user"]["role"][],
  callbackUrl: string = "/"
): Promise<Session> {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const session = await requireUser(callbackUrl);

  const role = (session.user as any).role as Session["user"]["role"];
  if (!allowed.includes(role)) {
    // Later we can route this to a dedicated /forbidden page.
    redirect("/");
  }

  return session;
}
