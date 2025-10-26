import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { client } from "./sanity"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("EmailIsRequired")
        }

        try {
          const user = await client.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email: credentials.email }
          )

          if (!user) {
            throw new Error("UserNotFound")
          }

          // التحقق من أن الحساب مفعل
          if (!user.isActive) {
            throw new Error("AccountNotVerified")
          }

          // إذا كانت كلمة المرور فارغة، فهذا يعني أن المستخدم يستخدم الرابط السحري
          if (!credentials.password) {
            return {
              id: user._id,
              email: user.email,
              name: user.name,
              image: user.image,
            }
          }

          // التحقق من كلمة المرور
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error("IncorrectPassword")
          }

          return {
            id: user._id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw error
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // عند تسجيل الدخول لأول مرة باستخدام Google
      if (account && account.provider === "google" && user) {
        // تحقق مما إذا كان المستخدم موجودًا بالفعل
        const existingUser = await client.fetch(
          `*[_type == "user" && email == $email][0]`,
          { email: user.email }
        )

        if (!existingUser) {
          // إنشاء مستخدم جديد في Sanity
          const newUser = await client.create({
            _type: "user",
            name: user.name,
            email: user.email,
            image: user.image, // تخزين رابط الصورة كنص
            isActive: true,
            createdAt: new Date().toISOString(),
          })

          token.id = newUser._id
          token.image = user.image
        } else {
          token.id = existingUser._id
          token.image = existingUser.image
        }
      } else if (user) {
        token.id = user.id
        token.image = user.image
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.image = token.image as string
      }
      return session
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}