import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { client } from "@/lib/sanity";
import nodemailer from 'nodemailer';

export async function GET(request: NextRequest) {
  try {
    // يمكنك إضافة منطق GET إذا لزم الأمر
    return NextResponse.json({ message: "Contact API is working" });
  } catch (error) {
    console.error("Error in GET /api/contact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // استقبال البيانات كـ FormData بدلاً من JSON
    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;
    const attachments = formData.getAll("attachment") as File[];
    
    if (!message || !name || !email) {
      return NextResponse.json(
        { error: "الحقول المطلوبة مفقودة" },
        { status: 400 }
      );
    }
    
    // التحقق من أن المستخدم يضيف بياناته الخاصة فقط
    if (session.user.email && email !== session.user.email) {
      return NextResponse.json(
        { error: "غير مصرح به" },
        { status: 403 }
      );
    }
    
    // حفظ البيانات في Sanity
    const contactData = {
      _type: "contact",
      name,
      email,
      message,
      userId: session.user.id,
      userFirstName: session.user.name?.split(' ')[0] || "",
      userLastName: session.user.name?.split(' ').slice(1).join(' ') || "",
      userImageUrl: session.user.image || "",
      createdAt: new Date().toISOString(),
      attachments: attachments.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))
    };
    
    const result = await client.create(contactData);
    
    // إعداد وإرسال البريد الإلكتروني
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });

      // معالجة المرفقات للبريد الإلكتروني
      const emailAttachments = [];
      for (const attachment of attachments) {
        const buffer = Buffer.from(await attachment.arrayBuffer());
        emailAttachments.push({
          filename: attachment.name,
          content: buffer,
          contentType: attachment.type,
        });
      }

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.RECEIVER_EMAIL,
        subject: `رسالة جديدة من ${name} - فذلكه`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5; margin-bottom: 20px;">رسالة جديدة من نموذج التواصل</h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 10px 0;"><strong>الاسم:</strong> ${name}</p>
              <p style="margin: 10px 0;"><strong>البريد الإلكتروني:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>تاريخ الإرسال:</strong> ${new Date().toLocaleString('ar-EG')}</p>
            </div>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #374151; margin-bottom: 10px;">الرسالة:</h3>
              <p style="white-space: pre-wrap; color: #4B5563;">${message}</p>
            </div>
            ${attachments.length > 0 ? `
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                <h4 style="color: #92400e; margin-bottom: 10px;">المرفقات:</h4>
                <ul style="margin: 0; padding-right: 20px;">
                  ${attachments.map(file => `<li style="color: #78350f;">${file.name} (${(file.size / 1024).toFixed(2)} KB)</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px;">تم الإرسال عبر منصة فذلكه</p>
            </div>
          </div>
        `,
        attachments: emailAttachments,
      });

      console.log("Email sent successfully");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // لا نوقف العملية إذا فشل إرسال البريد
    }
    
    return NextResponse.json({ 
      success: true, 
      id: result._id,
      message: "تم إرسال الرسالة بنجاح"
    });
  } catch (error) {
    console.error("Error in POST /api/contact:", error);
    return NextResponse.json(
      { error: "فشل في إرسال الرسالة", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}