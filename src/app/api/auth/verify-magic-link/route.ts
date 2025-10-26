import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: "Magic link token is required" },
        { status: 400 }
      )
    }

    // جلب المستخدم برمز تسجيل الدخول السحري
    const now = new Date().toISOString()
    const user = await client.fetch(
      `*[_type == "user" && magicToken == "${token}" && magicTokenExpiry > "${now}"][0]`
    )

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired magic link" },
        { status: 400 }
      )
    }

    // إزالة رمز تسجيل الدخول السحري
    await client
      .patch(user._id)
      .unset(['magicToken', 'magicTokenExpiry'])
      .commit()

    // إنشاء جلسة للمستخدم
    // هنا يجب عليك استخدام NextAuth لإنشاء جلسة للمستخدم
    // هذا يعتمد على إعدادات NextAuth الخاصة بك

    return NextResponse.json(
      { 
        message: "Magic link verified successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Magic link verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}