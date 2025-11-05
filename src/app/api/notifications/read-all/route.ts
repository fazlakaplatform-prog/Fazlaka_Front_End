// app/api/notifications/read-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.email;
    
    // جلب جميع الإشعارات غير المقروءة للمستخدم
    const unreadNotificationsQuery = `
      *[_type == "notification" && userId == $userId && isRead == false]._id
    `;
    
    const unreadNotificationIds = await client.fetch(unreadNotificationsQuery, { userId });
    
    // تحديث جميع الإشعارات غير المقروءة كمقروءة
    const transaction = client.transaction();
    
    unreadNotificationIds.forEach((id: string) => {
      transaction.patch(id, {
        set: { isRead: true, readAt: new Date().toISOString() }
      });
    });
    
    await transaction.commit();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}