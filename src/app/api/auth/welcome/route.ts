// app/api/auth/welcome/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { createWelcomeNotification, createLoginNotification } from '@/lib/notifications';

// إنشاء إشعار ترحيب للمستخدم الجديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, isNewUser } = body;
    
    if (!userId || !userName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    try {
      if (isNewUser) {
        // إنشاء إشعار ترحيب للمستخدم الجديد
        await createWelcomeNotification(userId, userName);
        return NextResponse.json({ success: true, message: 'Welcome notification created' });
      } else {
        // إنشاء إشعار تسجيل دخول للمستخدم الحالي
        await createLoginNotification(userId, userName);
        return NextResponse.json({ success: true, message: 'Login notification created' });
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in welcome notification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}