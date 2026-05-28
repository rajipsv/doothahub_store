import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { signInSchema } from "@/modules/auth/schemas/credentials";
import { verifyCredentials } from "@/modules/auth/services/users";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
    };
  }

  interface User {
    role?: Role;
  }
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      try {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await verifyCredentials(
          parsed.data.email,
          parsed.data.password,
        );
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          role: user.role,
        };
      } catch (err) {
        // Any throw inside authorize() turns into a 500 on
        // /api/auth/callback/credentials. Always degrade to "no user found"
        // and log the cause for debugging in Vercel function logs.
        console.warn(
          "[auth] credentials authorize() failed",
          err instanceof Error ? err.message : err,
        );
        return null;
      }
    },
  }),
];

if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  );
}
if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    }),
  );
}

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers,
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: Role }).role ?? "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? "CUSTOMER";
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        const { mergeAnonymousCartIntoUser } = await import("@/modules/cart");
        await mergeAnonymousCartIntoUser(user.id);
      } catch {
        // non-fatal: cart merge failure shouldn't block sign-in
      }
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
