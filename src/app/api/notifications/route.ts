// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// دالة لجلب إشعارات المستخدم الحالي
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ Unauthorized: No session or user email found.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.email;
    console.log(`🔍 [GET /api/notifications] Fetching notifications for user: ${userId}`);
    
    // استعلام لجلب إشعارات المستخدم مرتبة من الأحدث إلى الأقدم
    const notificationsQuery = `
      *[_type == "notification" && userId == $userId] | order(createdAt desc) {
        _id,
        title,
        titleEn,
        message,
        messageEn,
        type,
        relatedId,
        relatedType,
        imageUrl,
        imageUrlEn,
        createdAt,
        isRead,
        actionUrl,
        actionText,
        actionTextEn,
        operation
      }
    `;
    
    const notifications = await client.fetch(notificationsQuery, { userId });
    
    console.log(`📬 [GET /api/notifications] Found ${notifications.length} notifications for user: ${userId}`);
    
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('💥 [GET /api/notifications] Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// دالة لإنشاء إشعار جديد يدوياً (للاختبار)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.email;
    const body = await request.json();
    
    console.log(`📝 [POST /api/notifications] Creating notification for user: ${userId}`, body);
    
    // إنشاء إشعار جديد
    const newNotification = {
      _type: 'notification',
      userId,
      title: body.title,
      titleEn: body.titleEn,
      message: body.message,
      messageEn: body.messageEn,
      type: body.type || 'info',
      relatedId: body.relatedId,
      relatedType: body.relatedType,
      imageUrl: body.imageUrl,
      imageUrlEn: body.imageUrlEn,
      isRead: false,
      actionUrl: body.actionUrl,
      actionText: body.actionText,
      actionTextEn: body.actionTextEn,
      operation: body.operation,
      createdAt: new Date().toISOString(),
    };
    
    const createdNotification = await client.create(newNotification);
    console.log(`✅ [POST /api/notifications] Notification created: ${createdNotification._id}`);
    
    return NextResponse.json({ notification: createdNotification });
  } catch (error) {
    console.error('💥 [POST /api/notifications] Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// دالة لتحديث الإشعارات (تحديد كمقروءة)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.email;
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const action = pathSegments[pathSegments.length - 1];
    
    if (action === 'read-all') {
      // تحديد جميع الإشعارات كمقروءة
      const notificationsQuery = `
        *[_type == "notification" && userId == $userId && isRead == false]._id
      `;
      
      const unreadNotificationIds = await client.fetch(notificationsQuery, { userId });
      
      if (unreadNotificationIds.length === 0) {
        return NextResponse.json({ message: 'No unread notifications found' });
      }
      
      const transaction = client.transaction();
      unreadNotificationIds.forEach((id: string) => {
        transaction.patch(id, { set: { isRead: true } });
      });
      
      await transaction.commit();
      
      console.log(`✅ [PATCH /api/notifications/read-all] Marked ${unreadNotificationIds.length} notifications as read for user: ${userId}`);
      
      return NextResponse.json({ 
        message: 'All notifications marked as read',
        count: unreadNotificationIds.length
      });
    } else {
      // تحديد إشعار معين كمقروء
      const notificationId = pathSegments[pathSegments.length - 2];
      
      await client.patch(notificationId).set({ isRead: true }).commit();
      
      console.log(`✅ [PATCH /api/notifications/${notificationId}/read] Marked notification as read for user: ${userId}`);
      
      return NextResponse.json({ message: 'Notification marked as read' });
    }
  } catch (error) {
    console.error('💥 [PATCH /api/notifications] Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// دالة لحذف الإشعارات
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.email;
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const action = pathSegments[pathSegments.length - 1];
    
    if (action === 'clear-all') {
      // حذف جميع الإشعارات
      const notificationsQuery = `
        *[_type == "notification" && userId == $userId]._id
      `;
      
      const notificationIds = await client.fetch(notificationsQuery, { userId });
      
      if (notificationIds.length === 0) {
        return NextResponse.json({ message: 'No notifications found' });
      }
      
      const transaction = client.transaction();
      notificationIds.forEach((id: string) => {
        transaction.delete(id);
      });
      
      await transaction.commit();
      
      console.log(`✅ [DELETE /api/notifications/clear-all] Deleted ${notificationIds.length} notifications for user: ${userId}`);
      
      return NextResponse.json({ 
        message: 'All notifications deleted',
        count: notificationIds.length
      });
    } else {
      // حذف إشعار معين
      const notificationId = pathSegments[pathSegments.length - 2];
      
      await client.delete(notificationId);
      
      console.log(`✅ [DELETE /api/notifications/${notificationId}] Deleted notification for user: ${userId}`);
      
      return NextResponse.json({ message: 'Notification deleted' });
    }
  } catch (error) {
    console.error('💥 [DELETE /api/notifications] Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}