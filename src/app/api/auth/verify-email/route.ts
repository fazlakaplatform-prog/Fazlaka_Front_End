import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      )
    }

    // جلب المستخدم برمز التحقق
    const now = new Date().toISOString()
    const user = await client.fetch(
      `*[_type == "user" && verificationToken == "${token}" && verificationTokenExpiry > "${now}"][0]`
    )

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      )
    }

    // تفعيل حساب المستخدم وإزالة رمز التحقق
    await client
      .patch(user._id)
      .unset(['verificationToken', 'verificationTokenExpiry'])
      .set({
        isActive: true,
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