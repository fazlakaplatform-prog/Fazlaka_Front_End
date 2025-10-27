// File: src/app/api/user/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"
import { getServerSession } from "next-auth/next"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// إعادة تعريف authOptions هنا بسبب قيود Next.js 15
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
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
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
        } else {
          token.id = user.id
          token.name = user.name
          token.image = user.image
        }
        return token
      }

      if (trigger === "update" && session) {
        token.name = session.user.name
        token.image = session.user.image
        token.email = session.user.email
        return token
      }

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await client.fetch(
      `*[_type == "user" && _id == $id][0]{
        _id,
        name,
        email,
        image,
        bio,
        location,
        website,
        createdAt
      }`,
      { id }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // استخدام authOptions المعرف محلياً
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await context.params;
    const body = await request.json()
    const { name, bio, image, location, website } = body

    if (session.user.id !== id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const updatedUser = await client
      .patch(id)
      .set({
        ...(name && { name }),
        ...(bio && { bio }),
        ...(image && { image }),
        ...(location && { location }),
        ...(website && { website }),
        updatedAt: new Date().toISOString(),
      })
      .commit()

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}