import type { NextAuthConfig } from "next-auth"

/**
 * Edge-compatible auth config — no Node.js modules (no crypto, no bcryptjs).
 * Used by middleware.ts which runs in the Edge Runtime.
 * The full auth config (with CredentialsProvider + bcrypt) lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    authorized({ auth }) {
      // Middleware check: user must have a valid session to access /admin
      return !!auth?.user
    },
  },
  providers: [], // providers only needed at sign-in time, not in middleware
} satisfies NextAuthConfig
