import { getAllNotifications, NotificationItem } from '@/lib/sanity';
import Link from 'next/link';
import { Suspense } from 'react';

// مكون عنصر الإشعار المدمج
function NotificationItemComponent({ notification }: { notification: NotificationItem }) {
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'episode':
        return '🎬';
      case 'article':
        return '📝';
      case 'playlist':
        return '📋';
      case 'faq':
        return '❓';
      case 'terms':
        return '📜';
      case 'privacy':
        return '🔒';
      default:
        return '📢';
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'episode':
        return 'حلقة جديدة';
      case 'article':
        return 'مقال جديد';
      case 'playlist':
        return 'قائمة تشغيل جديدة';
      case 'faq':
        return 'سؤال شائع جديد';
      case 'terms':
        return 'تحديث في الشروط والأحكام';
      case 'privacy':
        return 'تحديث في سياسة الخصوصية';
      default:
        return 'إشعار جديد';
    }
  };

  // دالة آمنة لتنسيق التاريخ بدون استخدام date-fns
  const formatDate = (dateString: string) => {
    try {
      // التحقق من وجود قيمة التاريخ
      if (!dateString) return 'تاريخ غير متوفر';
      
      // إنشاء كائن التاريخ
      const date = new Date(dateString);
      
      // التحقق من صحة التاريخ
      if (isNaN(date.getTime())) return 'تاريخ غير صالح';
      
      // حساب الفارق الزمني
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      // تحويل الفارق إلى وحدات زمنية
      if (diffInSeconds < 60) {
        return 'منذ لحظات';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `منذ ${minutes} دقيقة`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `منذ ${hours} ساعة`;
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `منذ ${days} يوم`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `منذ ${months} شهر`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `منذ ${years} سنة`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'خطأ في التاريخ';
    }
  };

  return (
    <Link href={notification.linkUrl} className="block">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow duration-200 border border-gray-100">
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-xl mr-3">
            {getTypeIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-600 truncate">
                {getTypeLabel()}
              </p>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDate(notification.date)}
              </span>
            </div>
            <p className="text-lg font-semibold text-gray-900 mt-1 truncate">
              {notification.title}
            </p>
            {notification.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.description}
              </p>
            )}
          </div>
          {notification.imageUrl && (
            <div className="flex-shrink-0 ml-3">
              <img 
                className="h-16 w-16 rounded-lg object-cover" 
                src={notification.imageUrl} 
                alt={notification.title} 
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// مكون قائمة الإشعارات المدمج
function NotificationListComponent({ notifications }: { notifications: NotificationItem[] }) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">لا توجد إشعارات جديدة</h3>
        <p className="text-gray-500">سيظهر هنا كل المحتوى الجديد عند إضافته</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <NotificationItemComponent 
          key={`${notification.type}-${notification.id}`} 
          notification={notification} 
        />
      ))}
    </div>
  );
}

// مكون حالة التحميل
function LoadingComponent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// المكون الرئيسي للصفحة
async function NotificationsContent() {
  const notifications = await getAllNotifications();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">آخر التحديثات</h1>
        <p className="text-gray-600">كل المحتويات الجديدة والمحدثة مرتبة حسب التاريخ</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <Suspense fallback={<LoadingComponent />}>
          <NotificationListComponent notifications={notifications} />
        </Suspense>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <NotificationsContent />
    </main>
  );
}

export const dynamic = 'force-dynamic';