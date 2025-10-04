"use client";

import { getAllNotifications, NotificationItem } from '@/lib/sanity';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useState, useMemo, useEffect } from 'react';
import { 
  FaBell, FaEnvelope, FaInfoCircle, FaNewspaper, FaVideo, FaListUl, 
  FaStar, FaCalendarAlt, FaUsers, FaGlobe, FaChartLine,
  FaSearch, FaTimes
} from 'react-icons/fa';

// مكون الهيرو الجديد للإشعارات
const NotificationsHeroSection = () => {
  return (
    <div className="relative mb-12 sm:mb-16 overflow-hidden rounded-3xl">
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
          <FaBell className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
          <FaEnvelope className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
          <FaInfoCircle className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/3 right-1/3 text-white/10 transform translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '3s' }}>
          <FaNewspaper className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/2 left-1/2 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '4s' }}>
          <FaVideo className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-2/3 left-1/5 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '5s' }}>
          <FaListUl className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 py-6 sm:py-8 px-4 sm:px-6 flex flex-col items-center justify-center">
        {/* القسم الأيسر - النص */}
        <div className="w-full text-center mb-8 md:mb-0">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
            <span className="text-white font-medium flex items-center text-sm sm:text-base">
              <FaStar className="text-yellow-300 mr-2 animate-pulse" />
              آخر التحديثات
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            كل المحتويات <span className="text-yellow-300">الجديدة</span> في مكان واحد
          </h1>
          <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            تابع آخر المستجدات والمحتوى المحدث من فريق فذلكة، مرتبة حسب التاريخ لتسهيل الوصول إلى ما يهمك
          </p>
          
          {/* أيقونات الإشعارات في الأسفل */}
          <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 flex-wrap">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
              <FaBell className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
              <FaEnvelope className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
              <FaInfoCircle className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1.5s' }}>
              <FaNewspaper className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2s' }}>
              <FaVideo className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2.5s' }}>
              <FaListUl className="text-yellow-300 text-lg sm:text-xl" />
            </div>
          </div>
        </div>
        
        {/* القسم الأيمن - الأيقونات المتحركة */}
        <div className="w-full max-w-xs flex justify-center">
          <div className="relative">
            {/* دائرة خلفية */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full filter blur-3xl w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 animate-pulse-slow"></div>
            
            {/* الأيقونات المتحركة */}
            <div className="relative grid grid-cols-3 gap-3 sm:gap-4 w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64">
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaBell className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaEnvelope className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaCalendarAlt className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaUsers className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaGlobe className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.6s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaChartLine className="text-white text-xl sm:text-2xl" />
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

// مكون عنصر الإشعار المعدل
function NotificationItemComponent({ notification, language }: { notification: NotificationItem; language: 'ar' | 'en' }) {
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'episode': return '🎬';
      case 'article': return '📝';
      case 'playlist': return '📋';
      case 'faq': return '❓';
      case 'terms': return '📜';
      case 'privacy': return '🔒';
      case 'team': return '👥';
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
      case 'team': return 'عضو جديد في الفريق';
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
      default: return `إشعار جديد: ${notification.title}`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return language === 'ar' ? 'تاريخ غير متوفر' : 'Date not available';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return language === 'ar' ? 'تاريخ غير صالح' : 'Invalid date';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (language === 'ar') {
        if (diffInSeconds < 60) return 'منذ لحظات';
        else if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
        else if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
        else if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
        else if (diffInSeconds < 31536000) return `منذ ${Math.floor(diffInSeconds / 2592000)} شهر`;
        else return `منذ ${Math.floor(diffInSeconds / 31536000)} سنة`;
      } else {
        if (diffInSeconds < 60) return 'Just now';
        else if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        else if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        else if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        else if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
        else return `${Math.floor(diffInSeconds / 31536000)} years ago`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return language === 'ar' ? 'خطأ في التاريخ' : 'Date error';
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
        <div className={`h-1 w-full bg-gradient-to-r ${getTypeColor()}`}></div>
        
        <div className="flex flex-col sm:flex-row items-start p-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center text-2xl mb-3 sm:mb-0 sm:mr-4 shadow-inner group-hover:shadow-lg transition-shadow duration-300">
            {getTypeIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getTypeColor()} text-white shadow-sm`}>
                {getTypeLabel()}
              </span>
              
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-[10px] text-gray-600 dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(notification.date)}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
              {getCustomMessage()}
            </h3>
            
            {notification.description && (
              <p className="text-gray-600 dark:text-gray-300 text-xs mb-3 line-clamp-2 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300">
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
            <div className="flex-shrink-0 mt-3 sm:mt-0 sm:ml-4 overflow-hidden rounded-xl shadow-md">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                <Image 
                  className="h-24 w-24 object-cover transform group-hover:scale-110 transition-transform duration-500" 
                  src={notification.imageUrl} 
                  alt={notification.title}
                  width={96}
                  height={96}
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
function NotificationListComponent({ notifications, language }: { notifications: NotificationItem[]; language: 'ar' | 'en' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const texts = {
    ar: {
      searchPlaceholder: "ابحث في الإشعارات...",
      clearSearch: "مسح",
      all: "الكل",
      episodes: "حلقات",
      articles: "مقالات",
      playlists: "قوائم تشغيل",
      faqs: "أسئلة",
      terms: "شروط",
      privacy: "خصوصية",
      team: "الفريق",
      allNotifications: "جميع الإشعارات",
      noResults: "لا توجد نتائج للبحث",
      noResultsMessage: "لم يتم العثور على إشعارات تطابق معايير البحث والتصفية الحالية",
      resetFilters: "إعادة تعيين الفلاتر",
      noNotifications: "لا توجد إشعارات جديدة",
      noNotificationsMessage: "سيظهر هنا كل المحتوى الجديد عند إضافته",
      checkLater: "تحقق لاحقاً"
    },
    en: {
      searchPlaceholder: "Search notifications...",
      clearSearch: "Clear",
      all: "All",
      episodes: "Episodes",
      articles: "Articles",
      playlists: "Playlists",
      faqs: "FAQs",
      terms: "Terms",
      privacy: "Privacy",
      team: "Team",
      allNotifications: "All Notifications",
      noResults: "No search results",
      noResultsMessage: "No notifications were found matching your current search and filtering criteria",
      resetFilters: "Reset Filters",
      noNotifications: "No new notifications",
      noNotificationsMessage: "All new content will appear here when added",
      checkLater: "Check later"
    }
  };
  
  const notificationTypes = [
    { id: 'all', label: texts[language].all, icon: '📢' },
    { id: 'episode', label: texts[language].episodes, icon: '🎬' },
    { id: 'article', label: texts[language].articles, icon: '📝' },
    { id: 'playlist', label: texts[language].playlists, icon: '📋' },
    { id: 'faq', label: texts[language].faqs, icon: '❓' },
    { id: 'terms', label: texts[language].terms, icon: '📜' },
    { id: 'privacy', label: texts[language].privacy, icon: '🔒' },
    { id: 'team', label: texts[language].team, icon: '👥' },
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
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{texts[language].noNotifications}</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-lg">{texts[language].noNotificationsMessage}</p>
        <div className="mt-8 inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {texts[language].checkLater}
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
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full py-3 pr-10 pl-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder={texts[language].searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 left-0 flex items-center pl-3"
              >
                <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {notificationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveFilter(type.id)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                activeFilter === type.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <span className="mr-2">{type.icon}</span>
              {type.label}
              {type.id !== 'all' && (
                <span className="mr-2 bg-white/20 dark:bg-black/20 rounded-full px-1.5 py-0.5 text-xs">
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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{texts[language].noResults}</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {texts[language].noResultsMessage}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveFilter('all');
            }}
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors active:scale-95"
          >
            {texts[language].resetFilters}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeFilter === 'all' ? texts[language].allNotifications : notificationTypes.find(t => t.id === activeFilter)?.label}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredNotifications.length} من {notifications.length} إشعار
            </span>
          </div>
          {filteredNotifications.map((notification) => (
            <NotificationItemComponent 
              key={`${notification.type}-${notification.id}`} 
              notification={notification} 
              language={language}
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
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="space-y-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 animate-pulse">
              <div className="flex flex-col sm:flex-row items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3 sm:mb-0 sm:mr-4"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
                  </div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
                <div className="flex-shrink-0 mt-3 sm:mt-0 sm:ml-4">
                  <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
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
function NotificationsContent() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* استخدام الهيرو الجديد */}
      <NotificationsHeroSection />

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <Suspense fallback={<LoadingComponent />}>
          <NotificationListComponent notifications={notifications} language="ar" />
        </Suspense>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const isRTL = true; // Static RTL for Arabic
  
  return (
    <main className={`min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
      <NotificationsContent />
    </main>
  );
}

export const dynamic = 'force-dynamic';