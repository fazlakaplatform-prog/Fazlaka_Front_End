// File: src/app/api/auth/verify-email/route.ts

import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      )
    }

    console.log("Verifying email with token:", token.substring(0, 10) + "...")

    // جلب المستخدم برمز التحقق
    const user = await client.fetch(
      `*[_type == "user" && verificationToken == $token && verificationTokenExpiry > $now][0]`,
      { 
        token, 
        now: new Date().toISOString() 
      }
    )

    if (!user) {
      console.log("User not found with token:", token.substring(0, 10) + "...")
      
      // محاولة البحث عن المستخدم بالرمز بغض النظر عن انتهاء الصلاحية
      const userWithExpiredToken = await client.fetch(
        `*[_type == "user" && verificationToken == $token][0]`,
        { token }
      )
      
      if (userWithExpiredToken) {
        return NextResponse.json(
          { error: "Verification token has expired. Please request a new one." },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      )
    }

    console.log("Email verification successful for user:", user._id)

    // تحديث المستخدم لتفعيل الحساب وإزالة رمز التحقق
    await client
      .patch(user._id)
      .set({
        isActive: true,
        verificationToken: undefined,
        verificationTokenExpiry: undefined,
        updatedAt: new Date().toISOString(),
      })
      .commit()

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}