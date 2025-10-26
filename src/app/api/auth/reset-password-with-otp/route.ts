import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email and new password are required" },
        { status: 400 }
      )
    }

    console.log("Resetting password with OTP for:", email)

    // جلب المستخدم الذي تم التحقق منه
    const user = await client.fetch(
      `*[_type == "user" && email == $email && otpVerified == true][0]`,
      { email }
    )

    if (!user) {
      return NextResponse.json(
        { error: "Please verify your OTP first" },
        { status: 400 }
      )
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // تحديث كلمة المرور وإزالة علامة التحقق
    await client
      .patch(user._id)
      .set({
        password: hashedPassword,
        otpVerified: undefined,
        updatedAt: new Date().toISOString(),
      })
      .commit()

    console.log("Password reset successfully for:", email)

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