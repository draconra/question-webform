import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

// Export auth as the default middleware function (edge-safe — no Node.js modules).
// The full auth config with CredentialsProvider lives in auth.ts (Node.js runtime only).
export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/admin/:path*"],
}
