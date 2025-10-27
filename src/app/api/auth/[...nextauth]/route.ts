// File: src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { client } from "@/lib/sanity"
import bcrypt from "bcryptjs"

// تعريف authOptions كـ const محلي فقط داخل هذا الملف
const authOptions: NextAuthOptions = {
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

          if (!user.isActive) {
            throw new Error("AccountNotVerified")
          }

          if (!credentials.password) {
            return {
              id: user._id,
              email: user.email,
              name: user.name,
              image: user.image,
            }
          }

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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // هذا هو التعديل الأهم لمزامنة الجلسة
    async jwt({ token, user, account, trigger, session }) {
      // عند تسجيل الدخول لأول مرة
      if (account && user) {
        if (account.provider === "google") {
          const existingUser = await client.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email: user.email }
          )

          if (!existingUser) {
            const newUser = await client.create({
              _type: "user",
              name: user.name,
              email: user.email,
              image: user.image,
              isActive: true,
              createdAt: new Date().toISOString(),
            })
            token.id = newUser._id
            token.name = newUser.name
            token.image = newUser.image
          } else {
            token.id = existingUser._id
            token.name = existingUser.name
            token.image = existingUser.image
          }
        } else { // Credentials
          token.id = user.id
          token.name = user.name
          token.image = user.image
        }
        return token
      }

      // عند تحديث الجلسة يدوياً من العميل (trigger === "update")
      if (trigger === "update" && session) {
        token.name = session.user.name
        token.image = session.user.image
        token.email = session.user.email
        return token
      }

      // (اختياري) تحديث البيانات من قاعدة البيانات في كل طلب للتحقق من أحدث البيانات
      // ملاحظة: هذا قد يزيد من الحمل على قاعدة البيانات
      if (token.id) {
        try {
          const currentUser = await client.fetch(
            `*[_type == "user" && _id == $id][0]{ _id, name, email, image }`,
            { id: token.id }
          )
          
          if (currentUser) {
            token.name = currentUser.name
            token.email = currentUser.email
            token.image = currentUser.image
          }
        } catch (error) {
          console.error("Error updating token from database:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.image = token.image as string
        session.user.email = token.email as string
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

// تصدير معالجات الطلبات فقط
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }