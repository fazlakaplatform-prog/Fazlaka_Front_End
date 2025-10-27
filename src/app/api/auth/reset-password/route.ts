import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      )
    }

    console.log("Resetting password with token:", token.substring(0, 10) + "...")

    // جلب المستخدم الذي يمتلك التوكن الصحيح
    const user = await client.fetch(
      `*[_type == "user" && resetToken == $token && resetTokenExpiry > $now][0]`,
      { 
        token,
        now: new Date().toISOString()
      }
    )

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(password, 10)

    // تحديث كلمة المرور وإزالة التوكن
    await client
      .patch(user._id)
      .set({
        password: hashedPassword,
        resetToken: undefined,
        resetTokenExpiry: undefined,
        updatedAt: new Date().toISOString(),
      })
      .commit()

    console.log("Password reset successfully for:", user.email)

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}