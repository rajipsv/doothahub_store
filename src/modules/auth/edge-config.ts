import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js config.
 *
 * Used by `src/middleware.ts` which runs on the Edge runtime. It must NOT
 * import Prisma, the cart module, or anything that uses `node:*` APIs.
 *
 * Provider list is intentionally empty: middleware only needs to read the
 * JWT session cookie, not perform sign-in flows. The full config in
 * `./config.ts` adds the adapter, providers, and events for Node contexts.
 */
export const edgeAuthConfig = {
  providers: [],
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  trustHost: true,
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
} satisfies NextAuthConfig;

export const { auth } = NextAuth(edgeAuthConfig);
