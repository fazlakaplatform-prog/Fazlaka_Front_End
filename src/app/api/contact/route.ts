// app/api/contact/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs"; // مهم عشان nodemailer يشتغل

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = (formData.get("name") as string) || "مستخدم";
    const email = (formData.get("email") as string) || "";
    const message = (formData.get("message") as string) || "";
    const files = formData.getAll("attachment").filter(Boolean) as File[];
    
    const USER = process.env.EMAIL_USER!;
    const PASS = process.env.EMAIL_PASS!;
    const TO = process.env.RECEIVER_EMAIL || USER;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: USER, pass: PASS },
    });

    const attachments = await Promise.all(
      files.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
        contentType: file.type || undefined,
      }))
    );

    await transporter.sendMail({
      from: `"${name}" <${USER}>`, // لازم يبقى إيميلك
      to: TO,
      replyTo: email || undefined, // المستخدم
      subject: `رسالة من ${name}`,
      text: message,
      html: `<p>${message}</p><p>من: <strong>${name}</strong> (${email || "بلا بريد"})</p>`,
      ...(attachments.length ? { attachments } : {}),
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) { // التغيير الرئيسي هنا
    console.error("Mail error:", error);
    
    // التحقق من نوع الخطأ بأمان
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}