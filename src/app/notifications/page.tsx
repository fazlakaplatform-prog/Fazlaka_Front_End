// app/notifications/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link"; // تم استيراد Link
import { 
  FaBell, 
  FaCheck, 
  FaTimes, 
  FaTrash, 
  FaUser,
  FaVideo,
  FaNewspaper,
  FaHeart,
  FaCalendarAlt,
  FaClock,
  FaFilter,
  FaSearch,
  FaStar,
  FaUsers,
  FaQuestionCircle,
  FaImage,
  FaShareAlt,
  FaGavel,
  FaLock
} from "react-icons/fa";
import ImageWithFallback from "@/components/ImageWithFallback";
import { urlFor, getLocalizedText } from "@/lib/sanity";

// تعريف واجهات البيانات
interface Notification {
  _id: string;
  title?: string;
  titleEn?: string;
  message?: string;
  messageEn?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedId?: string;
  relatedType?: 'episode' | 'article' | 'playlist' | 'season' | 'teamMember' | 'faq' | 'heroSlider' | 'favorite' | 'welcome' | 'login' | 'socialLinks' | 'terms' | 'privacy';
  imageUrl?: string;
  imageUrlEn?: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  actionTextEn?: string;
  operation?: 'create' | 'update' | 'delete';
}

// كائن الترجمات
const translations = {
  ar: {
    loading: "جاري التحميل...",
    error: "حدث خطأ في تحميل الإشعارات",
    retry: "إعادة المحاولة",
    notifications: "الإشعارات",
    markAllAsRead: "تحديد الكل كمقروء",
    clearAll: "مسح الكل",
    noNotifications: "لا توجد إشعارات",
    noNotificationsDesc: "لم تتلق أي إشعارات بعد.",
    search: "ابحث في الإشعارات...",
    clearSearch: "مسح البحث",
    filter: "فلتر",
    all: "الكل",
    unread: "غير مقروء",
    read: "مقروء",
    markAsRead: "تحديد كمقروء",
    delete: "حذف",
    confirmDelete: "تأكيد الحذف",
    deleteMessage: "هل أنت متأكد من أنك تريد حذف هذا الإشعار؟",
    cancel: "إلغاء",
    confirm: "تأكيد",
    newEpisode: "حلقة جديدة",
    newArticle: "مقال جديد",
    newPlaylist: "قائمة تشغيل جديدة",
    newSeason: "موسم جديد",
    newTeamMember: "عضو فريق جديد",
    newFAQ: "سؤال شائع جديد",
    heroSliderUpdate: "تحديث الشريحة الرئيسية",
    socialLinksUpdate: "تحديث الروابط الاجتماعية",
    termsUpdate: "تحديث الشروط والأحكام",
    privacyUpdate: "تحديث سياسة الخصوصية",
    addedToFavorites: "تمت الإضافة للمفضلة",
    welcomeNotification: "رسالة ترحيب",
    loginNotification: "تسجيل دخول",
    viewDetails: "عرض التفاصيل",
    timeAgo: "منذ",
    justNow: "الآن",
    minutes: "دقائق",
    hours: "ساعات",
    days: "أيام",
    weeks: "أسابيع",
    months: "أشهر",
    years: "سنوات"
  },
  en: {
    loading: "Loading...",
    error: "Error loading notifications",
    retry: "Retry",
    notifications: "Notifications",
    markAllAsRead: "Mark All as Read",
    clearAll: "Clear All",
    noNotifications: "No Notifications",
    noNotificationsDesc: "You haven't received any notifications yet.",
    search: "Search notifications...",
    clearSearch: "Clear Search",
    filter: "Filter",
    all: "All",
    unread: "Unread",
    read: "Read",
    markAsRead: "Mark as Read",
    delete: "Delete",
    confirmDelete: "Confirm Delete",
    deleteMessage: "Are you sure you want to delete this notification?",
    cancel: "Cancel",
    confirm: "Confirm",
    newEpisode: "New Episode",
    newArticle: "New Article",
    newPlaylist: "New Playlist",
    newSeason: "New Season",
    newTeamMember: "New Team Member",
    newFAQ: "New FAQ",
    heroSliderUpdate: "Hero Slider Update",
    socialLinksUpdate: "Social Links Updated",
    termsUpdate: "Terms & Conditions Updated",
    privacyUpdate: "Privacy Policy Updated",
    addedToFavorites: "Added to Favorites",
    welcomeNotification: "Welcome Message",
    loginNotification: "Login Notification",
    viewDetails: "View Details",
    timeAgo: "ago",
    justNow: "Just now",
    minutes: "minutes",
    hours: "hours",
    days: "days",
    weeks: "weeks",
    months: "months",
    years: "years"
  }
};

// دالة للحصول على رابط الصورة مع دعم اللغة
function buildMediaUrl(imageUrl?: string, imageUrlEn?: string, language?: string) {
  const url = language === 'ar' ? imageUrl : imageUrlEn;
  
  if (!url) return null; // نرجع null بدلاً من placeholder.png
  
  // استخدام دالة urlFor للتعامل مع الصور من Sanity
  return urlFor(url);
}

// دالة لحساب الوقت المنقضي
function getTimeAgo(dateString: string, language: 'ar' | 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const t = translations[language];
  
  if (seconds < 60) return t.justNow;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${t.minutes} ${t.timeAgo}`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${t.hours} ${t.timeAgo}`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${t.days} ${t.timeAgo}`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} ${t.weeks} ${t.timeAgo}`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${t.months} ${t.timeAgo}`;
  
  const years = Math.floor(days / 365);
  return `${years} ${t.years} ${t.timeAgo}`;
}

// مكون بطاقة الإشعار
interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  language: 'ar' | 'en';
}

const NotificationCard = ({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  language 
}: NotificationCardProps) => {
  const t = translations[language];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const title = getLocalizedText(notification.title, notification.titleEn, language);
  const message = getLocalizedText(notification.message, notification.messageEn, language);
  const actionText = getLocalizedText(notification.actionText, notification.actionTextEn, language);
  const imageUrl = buildMediaUrl(notification.imageUrl, notification.imageUrlEn, language);
  const timeAgo = getTimeAgo(notification.createdAt, language);
  
  // تحديد الأيقونة بناءً على نوع الإشعار
  const getNotificationIcon = () => {
    switch (notification.relatedType) {
      case 'episode':
        return <FaVideo className="text-blue-500" />;
      case 'article':
        return <FaNewspaper className="text-purple-500" />;
      case 'playlist':
        return <FaHeart className="text-red-500" />;
      case 'season':
        return <FaCalendarAlt className="text-green-500" />;
      case 'teamMember':
        return <FaUsers className="text-indigo-500" />;
      case 'faq':
        return <FaQuestionCircle className="text-yellow-500" />;
      case 'heroSlider':
        return <FaImage className="text-pink-500" />;
      case 'socialLinks':
        return <FaShareAlt className="text-cyan-500" />;
      case 'terms':
        return <FaGavel className="text-orange-500" />;
      case 'privacy':
        return <FaLock className="text-teal-500" />;
      case 'favorite':
        return <FaStar className="text-yellow-500" />;
      case 'welcome':
      case 'login':
        return <FaUser className="text-green-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };
  
  // تحديد لون الخلفية بناءً على نوع الإشعار
  const getNotificationColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };
  
  // الحصول على نص العملية
  const getOperationText = () => {
    if (!notification.operation) return '';
    
    switch (notification.operation) {
      case 'create':
        return language === 'ar' ? 'تمت الإضافة' : 'Added';
      case 'update':
        return language === 'ar' ? 'تم التحديث' : 'Updated';
      case 'delete':
        return language === 'ar' ? 'تم الحذف' : 'Deleted';
      default:
        return '';
    }
  };
  
  return (
    <div className={`relative border rounded-xl p-4 mb-4 transition-all duration-300 ${
      notification.isRead 
        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
        : getNotificationColor()
    } ${!notification.isRead ? 'shadow-md' : ''}`}>
      {/* مؤشر الإشعار غير المقروء */}
      {!notification.isRead && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      )}
      
      <div className="flex gap-4">
        {/* الصورة أو الأيقونة */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <ImageWithFallback 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover"
                width={64}
                height={64}
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {getNotificationIcon()}
            </div>
          )}
        </div>
        
        {/* المحتوى */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-semibold text-gray-900 dark:text-white ${
                  !notification.isRead ? 'font-bold' : ''
                }`}>
                  {title}
                </h3>
                {notification.operation && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    notification.operation === 'create' 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : notification.operation === 'update'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {getOperationText()}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {message}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                <FaClock className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
            
            {/* أزرار الإجراءات */}
            <div className="flex items-center gap-2 ml-4">
              {!notification.isRead && (
                <button
                  onClick={() => onMarkAsRead(notification._id)}
                  className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  title={t.markAsRead}
                >
                  <FaCheck className="h-4 w-4" />
                </button>
              )}
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                title={t.delete}
              >
                <FaTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* زر الإجراء */}
          {notification.actionUrl && actionText && (
            <div className="mt-3">
              <a
                href={notification.actionUrl}
                className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {actionText}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
      
      {/* نافذة تأكيد الحذف */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center justify-center z-10">
          <div className="text-center">
            <p className="text-gray-900 dark:text-white mb-4">{t.deleteMessage}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onDelete(notification._id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function NotificationsPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const { status } = useSession();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'read' | 'unread'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // جلب الإشعارات
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    async function fetchNotifications() {
      try {
        setLoading(true);
        const response = await fetch('/api/notifications');
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchNotifications();
  }, [status]);
  
  // تصفية الإشعارات
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    // تطبيق فلتر الحالة
    if (filterType === 'read') {
      filtered = filtered.filter(n => n.isRead);
    } else if (filterType === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    }
    
    // تطبيق البحث
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(n => {
        const title = getLocalizedText(n.title, n.titleEn, language).toLowerCase();
        const message = getLocalizedText(n.message, n.messageEn, language).toLowerCase();
        return title.includes(q) || message.includes(q);
      });
    }
    
    return filtered;
  }, [notifications, searchTerm, filterType, language]);
  
  // تحديد الإشعار كمقروء
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // تحديد كل الإشعارات كمقروءة
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  // حذف إشعار
  const handleDeleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };
  
  // مسح كل الإشعارات
  const handleClearAll = async () => {
    try {
      const response = await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear all notifications');
      }
      
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  };
  
  // عرض حالة التحميل
  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="text-center">
          <div className="inline-block animate-bounce bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mb-4">
            <FaBell className="text-white text-3xl" />
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{t.loading}</p>
        </div>
      </div>
    );
  }
  
  // عرض حالة عدم المصادقة
  if (status !== 'authenticated') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <FaUser className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {language === 'ar' 
              ? 'يجب تسجيل الدخول لعرض الإشعارات.' 
              : 'You need to login to view notifications.'
            }
          </p>
          <Link // تم استبدال a بـ Link
            href="/api/auth/signin"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
        </div>
      </div>
    );
  }
  
  // عرض حالة الخطأ
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="inline-block p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <FaTimes className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t.error}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.retry}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* رأس الصفحة */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaBell className="text-blue-500" />
              {t.notifications}
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </h1>
            
            <div className="flex gap-2">
              {notifications.filter(n => !n.isRead).length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                >
                  {t.markAllAsRead}
                </button>
              )}
              
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                >
                  {t.clearAll}
                </button>
              )}
            </div>
          </div>
          
          {/* شريط البحث والفلاتر */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
              <FaSearch className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none flex-1 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <FaTimes className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <FaFilter className="h-4 w-4" />
                {t.filter}
              </button>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredNotifications.length} {language === 'ar' ? 'إشعار' : 'notification'}
                {filteredNotifications.length !== 1 ? (language === 'ar' ? '' : 's') : ''}
              </div>
            </div>
            
            {showFilters && (
              <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'all'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t.all}
                </button>
                <button
                  onClick={() => setFilterType('unread')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'unread'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t.unread}
                </button>
                <button
                  onClick={() => setFilterType('read')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'read'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t.read}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* قائمة الإشعارات */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <FaBell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t.noNotifications}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t.noNotificationsDesc}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                  language={language}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}