import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"

// Build providers list — Google is only added if credentials are configured
const getProviders = () => {
  const providersList = [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Введите email и пароль")
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { subscription: true },
        })

        if (!user || !user.passwordHash) {
          throw new Error("Неверный email или пароль")
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error("Неверный email или пароль")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.subscription?.plan ?? "free",
        }
      },
    }),
  ] as const

  // Conditionally add Google OAuth if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return [...providersList, GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })]
  }

  return [...providersList]
}

export const authOptions: NextAuthOptions = {
  providers: getProviders(),

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/auth/signin",
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign in, add user id and plan to token
      if (user) {
        token.id = user.id
        token.plan = (user as { plan?: string }).plan ?? "free"
      }

      // On session update, refresh plan from DB
      if (trigger === "update") {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          include: { subscription: true },
        })
        if (dbUser) {
          token.plan = dbUser.subscription?.plan ?? "free"
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { plan?: string }).plan = token.plan as string
      }
      return session
    },

    async signIn({ user, account }) {
      // For OAuth providers (Google), create user + subscription if they don't exist
      if (account?.provider === "google" && user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
          include: { subscription: true },
        })

        if (!existingUser) {
          const newUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name ?? "",
              image: user.image,
              emailVerified: new Date(),
              subscription: {
                create: {
                  plan: "free",
                  status: "free",
                },
              },
            },
            include: { subscription: true },
          })
          user.id = newUser.id
          ;(user as { plan?: string }).plan = newUser.subscription?.plan ?? "free"
        } else {
          user.id = existingUser.id
          ;(user as { plan?: string }).plan = existingUser.subscription?.plan ?? "free"

          // Create subscription if missing
          if (!existingUser.subscription) {
            await db.subscription.create({
              data: {
                userId: existingUser.id,
                plan: "free",
                status: "free",
              },
            })
          }

          // Update image if changed
          if (user.image && user.image !== existingUser.image) {
            await db.user.update({
              where: { id: existingUser.id },
              data: { image: user.image },
            })
          }
        }
      }

      return true
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}
