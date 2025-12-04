// src/lib/auth.ts
import { NextAuthOptions, DefaultSession, getServerSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";  // if you use Prisma adapter
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// Extend NextAuth session types to include our role
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "admin" | "operator" | "producer" | "retailer" | "regulator" | "analyst" | "consumer";
    };
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    // 🚨 Use your existing Credentials provider (or other providers) from authOptions.ts:
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const isValid = await import("bcrypt").then(({ default: bcrypt }) =>
          bcrypt.compare(credentials.password, user.passwordHash)
        );
        if (!isValid) return null;
        return { id: user.id, name: user.name ?? user.email, email: user.email, role: (user as any).role ?? "admin" };
      },
    }),
    // ... (Add Google, etc., if previously used)
  ],
  adapter: PrismaAdapter(prisma),  // if you were using PrismaAdapter
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = (token as any).role ?? "admin";
      }
      return session;
    },
  },
};

/** Ensure there is a logged-in user (any role). Redirects to sign-in if not. */
export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/");
  }
  return session;
}

/** Ensure the user has one of the required roles. Redirects away if not authorized. */
export async function requireRole(roles: Session["user"]["role"] | Session["user"]["role"][]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const session = await requireUser();
  const userRole = (session.user as any).role;
  if (!allowed.includes(userRole)) {
    redirect("/");  // not authorized
  }
  return session;
}
