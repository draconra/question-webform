import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { timingSafeEqual, createHash } from "crypto"
import bcrypt from "bcryptjs"
import { authConfig } from "@/auth.config"

const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

/**
 * Timing-safe string comparison — prevents timing attacks on credential check.
 * Both sides are hashed to a fixed length before comparison so the
 * comparison time is constant regardless of where strings differ.
 */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/**
 * Verify password against the stored credential.
 * Supports two formats for ADMIN_PASSWORD:
 *   1. bcrypt hash (starts with "$2b$" or "$2a$") — use bcrypt.compare().
 *      To generate: `node -e "require('bcryptjs').hash('yourpassword',12).then(console.log)"`
 *   2. Plain text (legacy, not recommended for production) — timing-safe compare.
 */
async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    return bcrypt.compare(plain, stored)
  }
  // Plain-text fallback — timing-safe to prevent enumeration
  return safeEqual(plain, stored)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
          console.error("ADMIN_USERNAME or ADMIN_PASSWORD env vars not set")
          return null
        }
        if (typeof credentials?.username !== 'string' || typeof credentials?.password !== 'string') {
          return null
        }
        const usernameOk = safeEqual(credentials.username, ADMIN_USERNAME)
        const passwordOk = await verifyPassword(credentials.password, ADMIN_PASSWORD)
        if (usernameOk && passwordOk) {
          return { id: "1", name: "Admin", email: "admin@example.com" }
        }
        return null
      }
    })
  ],
})
