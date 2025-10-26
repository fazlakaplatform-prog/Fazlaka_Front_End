import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword, email } = await request.json()

    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      )
    }

    // جلب المستخدم
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email: email || session.user.email }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // التحقق من كلمة المرور الحالية إذا تم توفيرها
    if (currentPassword) {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      )

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        )
      }
    } else {
      // إذا لم يتم توفير كلمة المرور، تحقق من أن المستخدم قد تحقق عبر OTP
      if (!user.otpVerified) {
        return NextResponse.json(
          { error: "Verification required. Please verify your identity via OTP." },
          { status: 403 }
        )
      }
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // تحديث كلمة المرور وإزالة علامة التحقق إذا كانت موجودة
    await client
      .patch(user._id)
      .set({
        password: hashedPassword,
        otpVerified: undefined, // إزالة علامة التحقق بعد استخدامها
        updatedAt: new Date().toISOString(),
      })
      .commit()

    console.log("Password changed successfully for:", email || session.user.email)

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}