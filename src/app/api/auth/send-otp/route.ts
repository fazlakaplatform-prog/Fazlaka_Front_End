import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"
import nodemailer from "nodemailer"

// تعريف نوع للـ purpose
type PurposeType = "login" | "register" | "reset" | "verify" | "change-password"

export async function POST(request: NextRequest) {
  try {
    const { email, purpose = "login" } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    console.log(`Processing OTP request for ${purpose}:`, email)

    // جلب المستخدم من Sanity
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email }
    )

    if (!user && purpose === "login") {
      console.log("User not found for login:", email)
      // لا نكشف أن المستخدم غير موجود لأسباب أمنية
      return NextResponse.json(
        { message: "If an account exists with this email, a verification code has been sent." },
        { status: 200 }
      )
    }

    // إنشاء كود OTP مكون من 6 أرقام
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 600000) // 10 دقائق

    console.log(`Generated OTP for ${purpose}:`, otpCode.substring(0, 3) + "***")

    if (user) {
      // تحديث المستخدم بكود OTP
      await client
        .patch(user._id)
        .set({
          otpCode,
          otpExpiry: otpExpiry.toISOString(),
          otpPurpose: purpose,
        })
        .commit()
    } else if (purpose === "register") {
      // إنشاء مستخدم مؤقت للتسجيل
      await client.create({
        _type: "user",
        email,
        otpCode,
        otpExpiry: otpExpiry.toISOString(),
        otpPurpose: purpose,
        isActive: false,
        createdAt: new Date().toISOString(),
      })
    }

    // إعداد النقل البريدي
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // إعداد محتوى البريد الإلكتروني
    const purposeText: Record<PurposeType, string> = {
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      reset: "إعادة تعيين كلمة المرور",
      verify: "التحقق من الهوية",
      "change-password": "تغيير كلمة المرور"
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `كود التحقق - ${purposeText[purpose as PurposeType]} - فذلكه`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">كود التحقق</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              مرحباً ${user?.name || ""}،
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              استخدم كود التحقق التالي لـ ${purposeText[purpose as PurposeType]}:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <div style="display: inline-block; background: #f8f9fa; padding: 20px 40px; border-radius: 10px; border: 2px dashed #667eea;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">
                  ${otpCode}
                </span>
              </div>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>ملاحظات:</strong>
              </p>
              <ul style="color: #856404; margin: 10px 0 0 20px; font-size: 14px; padding-right: 20px;">
                <li>هذا الكود صالح لمدة 10 دقائق فقط</li>
                <li>لا تشارك هذا الكود مع أي شخص</li>
                <li>إذا لم تطلب هذا الكود، يرجى تجاهل هذه الرسالة</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              إذا واجهت أي مشكلة، يرجى التواصل مع فريق الدعم.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px; margin-top: 20px;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              © 2024 فذلكه. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      `,
    }

    // إرسال البريد الإلكتروني
    await transporter.sendMail(mailOptions)
    console.log(`OTP email sent to: ${email}`)

    return NextResponse.json(
      { 
        message: "Verification code sent successfully",
        // في بيئة التطوير فقط، أرجع الكود للاختبار
        ...(process.env.NODE_ENV === 'development' && { otpCode })
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("OTP error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}