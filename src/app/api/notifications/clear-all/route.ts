// app/api/notifications/clear-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.email;
    
    // جلب جميع إشعارات المستخدم
    const notificationsQuery = `
      *[_type == "notification" && userId == $userId]._id
    `;
    
    const notificationIds = await client.fetch(notificationsQuery, { userId });
    
    // حذف جميع الإشعارات
    const transaction = client.transaction();
    
    notificationIds.forEach((id: string) => {
      transaction.delete(id);
    });
    
    await transaction.commit();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear all notifications' },
      { status: 500 }
    );
  }
}