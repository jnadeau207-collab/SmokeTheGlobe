import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // DEBUG: Log incoming request shape (do NOT log raw password in prod)
        console.log("[AUTH] authorize called", {
          email: credentials?.email,
          passwordLength: credentials?.password?.length ?? 0,
          now: new Date().toISOString(),
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] missing email or password");
          throw new Error("Missing email or password");
        }

        // Use AdminUser model
        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        });

        // DEBUG: Show whether we found a user and the length of stored password (hash)
        console.log("[AUTH] prisma returned user:", user ? { id: user.id, email: user.email, storedPassLen: user.password?.length } : null);

        if (!user || !user.password) {
          console.log("[AUTH] user not found or no password field");
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        // DEBUG: Log bcrypt result
        console.log("[AUTH] bcrypt.compare result:", { isValid });

        if (!isValid) {
          console.log("[AUTH] invalid credentials for", credentials.email);
          throw new Error("Invalid email or password");
        }

        // Success
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          role: user.role ?? "admin",
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).role = (user as any).role ?? "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role ?? "admin";
      }
      return session;
    },
  },
};
