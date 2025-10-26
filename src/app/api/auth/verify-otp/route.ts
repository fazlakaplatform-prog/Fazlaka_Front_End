import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, otpCode, purpose = "login", name, password } = await request.json()

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: "Email and OTP code are required" },
        { status: 400 }
      )
    }

    console.log(`Verifying OTP for ${purpose}:`, email)

    // جلب المستخدم بكود OTP
    const user = await client.fetch(
      `*[_type == "user" && email == $email && otpCode == $otpCode && otpPurpose == $purpose && otpExpiry > $now][0]`,
      { email, otpCode, purpose, now: new Date().toISOString() }
    )

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      )
    }

    console.log(`OTP verified successfully for ${purpose}`)

    let responseMessage = "Verification successful"

    // معالجة حسب الغرض من OTP
    if (purpose === "register") {
      // إكمال عملية التسجيل
      if (!name || !password) {
        return NextResponse.json(
          { error: "Name and password are required for registration" },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      await client
        .patch(user._id)
        .set({
          name,
          password: hashedPassword,
          isActive: true,
          otpCode: undefined,
          otpExpiry: undefined,
          otpPurpose: undefined,
          updatedAt: new Date().toISOString(),
        })
        .commit()

      responseMessage = "Account created successfully"
    } else if (purpose === "reset") {
      // السماح بإعادة تعيين كلمة المرور
      await client
        .patch(user._id)
        .set({
          otpVerified: true,
          otpCode: undefined,
          otpExpiry: undefined,
          otpPurpose: undefined,
        })
        .commit()

      responseMessage = "OTP verified. You can now reset your password"
    } else if (purpose === "login") {
      // تسجيل الدخول باستخدام OTP
      await client
        .patch(user._id)
        .set({
          otpCode: undefined,
          otpExpiry: undefined,
          otpPurpose: undefined,
        })
        .commit()

      responseMessage = "Login successful"
      
      // إرجاع بيانات المستخدم لإنشاء جلسة
      return NextResponse.json(
        { 
          message: responseMessage,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
          success: true
        },
        { status: 200 }
      )
    } else if (purpose === "verify") {
      // التحقق من الهوية فقط
      await client
        .patch(user._id)
        .set({
          otpCode: undefined,
          otpExpiry: undefined,
          otpPurpose: undefined,
        })
        .commit()

      responseMessage = "Identity verified successfully"
    } else if (purpose === "change-password") {
      // التحقق لتغيير كلمة المرور
      await client
        .patch(user._id)
        .set({
          otpVerified: true,
          otpCode: undefined,
          otpExpiry: undefined,
          otpPurpose: undefined,
        })
        .commit()

      responseMessage = "OTP verified. You can now change your password"
      
      return NextResponse.json(
        { 
          message: responseMessage,
          success: true
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { 
        message: responseMessage,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("OTP verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}