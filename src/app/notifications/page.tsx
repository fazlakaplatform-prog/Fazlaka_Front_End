"use client";

import { getAllNotifications, NotificationItem } from '@/lib/sanity';
import Link from 'next/link';
import { Suspense, useState, useMemo, useEffect } from 'react';
import { 
  FaBell, FaEnvelope, FaInfoCircle, FaNewspaper, FaVideo, FaListUl, 
  FaStar, FaCalendarAlt, FaUsers, FaGlobe, FaChartLine, FaBook, FaUserCircle,
  FaSignInAlt, FaUserPlus, FaLock
} from 'react-icons/fa';
import { useUser, SignInButton } from '@clerk/nextjs';

// مكون الهيرو العام للإشعارات
const NotificationsHeroSection = () => {
  return (
    <div className="relative mb-8 sm:mb-12 mt-8 overflow-hidden rounded-3xl max-w-4xl mx-auto">
      {/* الخلفية المتدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950"></div>
      
      {/* العناصر الزخرفية */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        {/* دوائر زخرفية */}
        <div className="absolute -top-40 -right-40 w-64 h-64 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
        
        {/* شبكة زخرفية */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
        
        {/* أيقونات الإشعارات في الخلفية */}
        <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
          <FaBell className="text-5xl sm:text-7xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
          <FaEnvelope className="text-5xl sm:text-7xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
          <FaInfoCircle className="text-5xl sm:text-7xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/3 right-1/3 text-white/10 transform translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '3s' }}>
          <FaNewspaper className="text-5xl sm:text-7xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/2 left-1/2 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '4s' }}>
          <FaVideo className="text-5xl sm:text-7xl drop-shadow-lg" />
        </div>
        <div className="absolute top-2/3 left-1/5 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '5s' }}>
          <FaListUl className="text-5xl sm:text-7xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/5 right-1/5 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '6s' }}>
          <span className="text-5xl sm:text-7xl drop-shadow-lg">🎭</span>
        </div>
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 py-6 sm:py-8 px-4 sm:px-6 flex flex-col items-center justify-center">
        {/* القسم الأيسر - النص */}
        <div className="w-full text-center mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
            كل المحتويات <span className="text-yellow-300">الجديدة</span> في مكان واحد
          </h1>
          <p className="text-sm sm:text-base text-blue-100 mb-4 max-w-xl mx-auto">
            تابع آخر المستجدات والمحتوى المحدث من فريق فذلكة، مرتبة حسب التاريخ لتسهيل الوصول إلى ما يهمك
          </p>
          
          {/* أيقونات الإشعارات في الأسفل */}
          <div className="flex justify-center gap-2 sm:gap-3 mt-4 flex-wrap">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
              <FaBell className="text-yellow-300 text-sm sm:text-base" />
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
              <FaEnvelope className="text-yellow-300 text-sm sm:text-base" />
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
              <FaInfoCircle className="text-yellow-300 text-sm sm:text-base" />
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1.5s' }}>
              <FaNewspaper className="text-yellow-300 text-sm sm:text-base" />
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2s' }}>
              <FaVideo className="text-yellow-300 text-sm sm:text-base" />
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2.5s' }}>
              <FaListUl className="text-yellow-300 text-sm sm:text-base" />
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '3s' }}>
              <span className="text-yellow-300 text-sm sm:text-base">🎭</span>
            </div>
          </div>
        </div>
        
        {/* القسم الأيمن - الأيقونات المتحركة */}
        <div className="w-full max-w-xs flex justify-center">
          <div className="relative">
            {/* دائرة خلفية */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full filter blur-3xl w-32 h-32 animate-pulse-slow"></div>
            
            {/* الأيقونات المتحركة */}
            <div className="relative grid grid-cols-3 gap-2 sm:gap-3 w-32 h-32">
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaBell className="text-white text-base sm:text-lg" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaEnvelope className="text-white text-base sm:text-lg" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaCalendarAlt className="text-white text-base sm:text-lg" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaUsers className="text-white text-base sm:text-lg" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaGlobe className="text-white text-base sm:text-lg" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.6s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <span className="text-white text-base sm:text-lg">🎭</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* تأثيرات حركية */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
    </div>
  );
};

// مكون قسم الترحيب الخاص بالمستخدم
const UserWelcomeSection = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  
  if (!isLoaded || !isSignedIn || !user) return null;
  
  return (
    <div className="max-w-4xl mx-auto px-4 mb-4">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            {user.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.firstName || user.username || 'User'} 
                className="w-12 h-12 rounded-full border-3 border-white shadow-lg"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <FaUserCircle className="text-white text-2xl" />
              </div>
            )}
            <div className="mr-3 text-center sm:text-right">
              <h2 className="text-lg font-bold text-white">
                مرحباً بك، {user.firstName || user.username || 'صديقنا'}! 👋
              </h2>
              <p className="text-blue-100 text-xs">
                آخر زيارة لك: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// مكون عنصر الإشعار المعدل
function NotificationItemComponent({ notification }: { notification: NotificationItem }) {
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'episode': return '🎬';
      case 'article': return '📝';
      case 'playlist': return '📋';
      case 'faq': return '❓';
      case 'terms': return '📜';
      case 'privacy': return '🔒';
      case 'team': return '👥';
      case 'season': return '🎭';
      default: return '📢';
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'episode': return 'حلقة جديدة';
      case 'article': return 'مقال جديد';
      case 'playlist': return 'قائمة تشغيل جديدة';
      case 'faq': return 'سؤال شائع جديد';
      case 'terms': return 'تحديث في الشروط والأحكام';
      case 'privacy': return 'تحديث في سياسة الخصوصية';
      case 'team': 
        const teamTitle = notification.title.replace(/^عضو جديد في الفريق:\s*/, '');
        return `عضو جديد في الفريق: ${teamTitle}`;
      case 'season': return 'موسم جديد';
      default: return 'إشعار جديد';
    }
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case 'episode': return 'from-purple-500 to-indigo-600';
      case 'article': return 'from-blue-500 to-cyan-600';
      case 'playlist': return 'from-green-500 to-emerald-600';
      case 'faq': return 'from-yellow-500 to-amber-600';
      case 'terms': return 'from-gray-500 to-slate-600';
      case 'privacy': return 'from-red-500 to-rose-600';
      case 'team': return 'from-pink-500 to-fuchsia-600';
      case 'season': return 'from-orange-500 to-amber-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  const getCustomMessage = () => {
    switch (notification.type) {
      case 'episode': return `تمت إضافة حلقة جديدة: ${notification.title}`;
      case 'article': return `نشرنا مقالًا جديدًا: ${notification.title}`;
      case 'playlist': return `قائمة تشغيل جديدة متاحة الآن: ${notification.title}`;
      case 'faq': return `أضفنا سؤالًا شائعًا جديدًا: ${notification.title}`;
      case 'terms': return `تم تحديث الشروط والأحكام: ${notification.title}`;
      case 'privacy': return `تم تحديث سياسة الخصوصية: ${notification.title}`;
      case 'team': 
        const teamTitle = notification.title.replace(/^عضو جديد في الفريق:\s*/, '');
        return `انضم إلينا عضو جديد في الفريق: ${teamTitle}`;
      case 'season': return `بدأ موسم جديد: ${notification.title}`;
      default: return `إشعار جديد: ${notification.title}`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'تاريخ غير متوفر';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'تاريخ غير صالح';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'منذ لحظات';
      else if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
      else if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
      else if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
      else if (diffInSeconds < 31536000) return `منذ ${Math.floor(diffInSeconds / 2592000)} شهر`;
      else return `منذ ${Math.floor(diffInSeconds / 31536000)} سنة`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'خطأ في التاريخ';
    }
  };

  // تعديل الرابط للإشعارات من نوع الأسئلة والشروط والخصوصية
  let finalLink = notification.linkUrl;
  if (notification.type === 'faq' && notification.id) {
    finalLink = `/faq?faq=${notification.id}`;
  } else if (notification.type === 'terms') {
    finalLink = notification.id ? `/terms-conditions#${notification.id}` : '/terms-conditions';
  } else if (notification.type === 'privacy') {
    finalLink = notification.id ? `/privacy-policy#${notification.id}` : '/privacy-policy';
  }

  return (
    <Link href={finalLink} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden relative">
        <div className={`h-1.5 w-full bg-gradient-to-r ${getTypeColor()}`}></div>
        
        <div className="flex flex-col sm:flex-row items-start p-6">
          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center text-3xl mb-4 sm:mb-0 sm:mr-5 shadow-inner group-hover:shadow-lg transition-shadow duration-300">
            {getTypeIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getTypeColor()} text-white shadow-sm`}>
                {getTypeLabel()}
              </span>
              
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(notification.date)}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
              {getCustomMessage()}
            </h3>
            
            {notification.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300">
                {notification.description}
              </p>
            )}
            
            <div className="flex items-center text-sm text-blue-500 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2">
              <span>اقرأ المزيد</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7m0 0H7" />
              </svg>
            </div>
          </div>
          
          {notification.imageUrl && (
            <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-5 overflow-hidden rounded-xl shadow-md">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                <img 
                  className="h-24 w-24 object-cover transform group-hover:scale-110 transition-transform duration-500" 
                  src={notification.imageUrl} 
                  alt={notification.title} 
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
      </div>
    </Link>
  );
}

// مكون قائمة الإشعارات
function NotificationListComponent({ notifications }: { notifications: NotificationItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const notificationTypes = [
    { id: 'all', label: 'الكل', icon: '📢' },
    { id: 'episode', label: 'حلقات', icon: '🎬' },
    { id: 'article', label: 'مقالات', icon: '📝' },
    { id: 'playlist', label: 'قوائم تشغيل', icon: '📋' },
    { id: 'faq', label: 'أسئلة', icon: '❓' },
    { id: 'terms', label: 'شروط', icon: '📜' },
    { id: 'privacy', label: 'خصوصية', icon: '🔒' },
    { id: 'team', label: 'الفريق', icon: '👥' },
    { id: 'season', label: 'مواسم', icon: '🎭' },
  ];
  
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (activeFilter !== 'all' && notification.type !== activeFilter) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = notification.title.toLowerCase().includes(searchLower);
        const descriptionMatch = notification.description?.toLowerCase().includes(searchLower);
        return titleMatch || descriptionMatch;
      }
      
      return true;
    });
  }, [notifications, searchTerm, activeFilter]);
  
  if (notifications.length === 0) {
    return (
      <div className="text-center py-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-7xl mb-6 animate-pulse">📭</div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">لا توجد إشعارات جديدة</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-lg">سيظهر هنا كل المحتوى الجديد عند إضافته</p>
        <div className="mt-8 inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          تحقق لاحقاً
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-5 shadow-sm">
        <div className="mb-5">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full py-3 pr-10 pl-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="ابحث في الإشعارات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {notificationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveFilter(type.id)}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === type.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <span className="mr-2">{type.icon}</span>
              {type.label}
              {type.id !== 'all' && (
                <span className="mr-2 bg-white/20 dark:bg-black/20 rounded-full px-2 py-0.5 text-xs">
                  {notifications.filter(n => n.type === type.id).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-5">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">لا توجد نتائج للبحث</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            لم يتم العثور على إشعارات تطابق معايير البحث والتصفية الحالية
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveFilter('all');
            }}
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeFilter === 'all' ? 'جميع الإشعارات' : notificationTypes.find(t => t.id === activeFilter)?.label}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredNotifications.length} من {notifications.length} إشعار
            </span>
          </div>
          {filteredNotifications.map((notification) => (
            <NotificationItemComponent 
              key={`${notification.type}-${notification.id}`} 
              notification={notification} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

// مكون حالة التحميل
function LoadingComponent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="space-y-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 animate-pulse">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl mr-5"></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
                <div className="flex-shrink-0 ml-5">
                  <div className="h-24 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// مكون رسالة تسجيل الدخول
function SignInPrompt() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 md:p-12 shadow-lg border border-blue-100 dark:border-gray-700 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaLock className="text-blue-600 dark:text-blue-400 text-4xl" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            المحتوى محمي للمستخدمين المسجلين
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
            يرجى تسجيل الدخول لعرض إشعاراتك ومتابعة آخر المستجدات من فريق فذلكة
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/sign-in">
              <button className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <FaSignInAlt className="ml-2" />
                تسجيل الدخول
              </button>
            </Link>
            
            <Link href="/sign-up">
              <button className="flex items-center justify-center bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-200 dark:border-gray-700">
                <FaUserPlus className="ml-2" />
                إنشاء حساب جديد
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// المكون الرئيسي للصفحة
function NotificationsContent() {
  const { isLoaded, isSignedIn } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // فقط قم بجلب الإشعارات إذا كان المستخدم مسجلاً للدخول
    if (isSignedIn) {
      const fetchNotifications = async () => {
        try {
          const data = await getAllNotifications();
          setNotifications(data);
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  if (!isLoaded) {
    return <LoadingComponent />;
  }

  return (
    <>
      {/* الهيرو العام للإشعارات - يظهر للجميع */}
      <NotificationsHeroSection />
      
      {/* قسم الترحيب الخاص بالمستخدم - يظهر فقط للمستخدمين المسجلين */}
      <UserWelcomeSection />
      
      {/* المحتوى الرئيسي */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {isSignedIn ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
            <Suspense fallback={<LoadingComponent />}>
              {loading ? <LoadingComponent /> : <NotificationListComponent notifications={notifications} />}
            </Suspense>
          </div>
        ) : (
          <SignInPrompt />
        )}
      </div>
    </>
  );
}

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <NotificationsContent />
    </main>
  );
}

export const dynamic = 'force-dynamic';