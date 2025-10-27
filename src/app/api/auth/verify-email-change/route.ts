// File: src/app/api/auth/verify-email-change/route.ts

import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"

export async function POST(request: NextRequest) {
  try {
    const { currentEmail, newEmail, verificationCode } = await request.json()

    if (!currentEmail || !newEmail || !verificationCode) {
      return NextResponse.json(
        { error: "Current email, new email, and verification code are required" },
        { status: 400 }
      )
    }

    console.log("Verifying email change from:", currentEmail, "to:", newEmail)

    // جلب المستخدم بكود OTP
    const user = await client.fetch(
      `*[_type == "user" && email == $currentEmail && emailChangeCode == $verificationCode && newEmail == $newEmail && emailChangeCodeExpiry > $now][0]`,
      { 
        currentEmail, 
        verificationCode, 
        newEmail,
        now: new Date().toISOString() 
      }
    )

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      )
    }

    console.log("Email change verification successful")

    // تحديث بريد المستخدم وإزالة حقول التحقق
    await client
      .patch(user._id)
      .set({
        email: newEmail,
        emailChangeCode: undefined,
        emailChangeCodeExpiry: undefined,
        newEmail: undefined,
        updatedAt: new Date().toISOString(),
      })
      .commit()

    return NextResponse.json(
      { message: "Email changed successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Email change verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}