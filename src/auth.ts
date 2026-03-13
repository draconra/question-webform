import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export const { handlers, signIn, signOut, auth } = NextAuth({
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
        if (
          credentials?.username === ADMIN_USERNAME &&
          credentials?.password === ADMIN_PASSWORD
        ) {
          return { id: "1", name: "Admin", email: "admin@example.com" }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
})
