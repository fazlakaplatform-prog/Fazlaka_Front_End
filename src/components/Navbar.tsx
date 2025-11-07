"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// تعريفات واجهات البيانات
interface NotificationItem {
  _id: string;
  title?: string;
  titleEn?: string;
  message?: string;
  messageEn?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedId?: string;
  relatedType?: 'episode' | 'article' | 'playlist' | 'season';
  imageUrl?: string;
  imageUrlEn?: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  actionTextEn?: string;
}

// كائن الترجمات
const translations = {
  ar: {
    home: "الرئيسية",
    content: "محتوانا",
    episodes: "الحلقات",
    playlists: "قوائم التشغيل",
    seasons: "المواسم",
    articles: "المقالات",
    about: "تعرف علينا",
    whoWeAre: "من نحن",
    platforms: "تجدنا على",
    team: "الفريق",
    contact: "التواصل",
    contactUs: "تواصل معنا",
    faq: "الأسئلة الشائعة",
    signIn: "تسجيل دخول",
    signUp: "إنشاء حساب",
    manageAccount: "إدارة الحساب",
    favorites: "مفضلاتي",
    signOut: "تسجيل الخروج",
    notifications: "الإشعارات",
    viewAll: "مشاهدة الكل",
    noNotifications: "لا توجد إشعارات جديدة",
    loading: "جاري التحميل...",
    terms: "شروط وأحكام",
    privacy: "سياسة الخصوصية",
    darkMode: "تبديل الوضع الليلي",
    language: "تبديل اللغة",
    copyright: "© {year} فذلكة",
    PlatformMame: "فذلكة",
    settings: "الإعدادات",
    fontSize: "حجم الخط",
    small: "صغير",
    medium: "متوسط",
    large: "كبير",
    changePassword: "تغيير كلمة المرور",
    brandName: "فذلكه",
    markAsRead: "تحديد كمقروء",
    delete: "حذف",
    timeAgo: "منذ",
    justNow: "الآن",
    minutes: "دقائق",
    hours: "ساعات",
    days: "أيام",
    weeks: "أسابيع",
    months: "أشهر",
    years: "سنوات",
    search: "بحث"
  },
  en: {
    home: "Home",
    content: "Content",
    episodes: "Episodes",
    playlists: "Playlists",
    seasons: "Seasons",
    articles: "Articles",
    about: "About",
    whoWeAre: "Who We Are",
    platforms: "Find us on",
    team: "Team",
    contact: "Contact",
    contactUs: "Contact Us",
    faq: "FAQ",
    signIn: "Sign In",
    signUp: "Sign Up",
    manageAccount: "Manage Account",
    favorites: "My Favorites",
    signOut: "Sign Out",
    notifications: "Notifications",
    viewAll: "View All",
    noNotifications: "No new notifications",
    loading: "Loading...",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    darkMode: "Toggle Dark Mode",
    language: "Toggle Language",
    copyright: "© {year} Fazlaka",
    PlatformMame: "Fazlaka",
    settings: "Settings",
    fontSize: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    changePassword: "Change Password",
    brandName: "fazlaka",
    markAsRead: "Mark as Read",
    delete: "Delete",
    timeAgo: "ago",
    justNow: "Just now",
    minutes: "minutes",
    hours: "hours",
    days: "days",
    weeks: "weeks",
    months: "months",
    years: "years",
    search: "Search"
  }
};

// دالة للحصول على النص المناسب حسب اللغة
function getLocalizedText(arText?: string, enText?: string, isRTL: boolean = true): string {
  if (isRTL) {
    return arText || enText || '';
  } else {
    return enText || arText || '';
  }
}

// دالة لحساب الوقت المنقضي
function getTimeAgo(dateString: string, isRTL: boolean): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
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

// مكون تبديل حجم الخط
const FontSizeSwitch = ({ fontSize, setFontSize, isRTL }: { 
  fontSize: string; 
  setFontSize: (size: string) => void;
  isRTL: boolean;
}) => {
  const t = translations[isRTL ? 'ar' : 'en'];
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm0-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z" />
            <path d="M7 7h6v2H7V7zm0 4h6v2H7v-2zm0 4h6v2H7v-2z" />
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.fontSize}
        </span>
      </div>
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {['small', 'medium', 'large'].map((size) => (
          <button
            key={size}
            onClick={() => setFontSize(size)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              fontSize === size
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {size === 'small' ? 'A' : size === 'medium' ? 'A' : 'A'}
          </button>
        ))}
      </div>
    </div>
  );
};

// مكون تبديل الوضع الداكن
const DarkModeSwitch = ({ isDark, toggleDarkMode }: { isDark: boolean; toggleDarkMode: () => void }) => {
  return (
    <motion.button
      onClick={toggleDarkMode}
      className={`relative inline-flex items-center h-7 rounded-full w-14 transition-all duration-500 ease-in-out focus:outline-none overflow-hidden ${
        isDark ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-yellow-400 to-orange-500'
      }`}
      aria-label="تبديل الوضع الليلي"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* خلفية متحركة */}
      <motion.div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)'
        }}
      />
      
      {/* مؤشر التبديل */}
      <motion.div
        className={`absolute w-5 h-5 rounded-full bg-white shadow-lg z-10 ${
          isDark ? 'left-8' : 'left-1'
        }`}
        layout
        transition={{ 
          type: "spring", 
          stiffness: 700, 
          damping: 30,
          duration: 0.5
        }}
      />
      
      {/* أيقونة الشمس */}
      <motion.div
        className={`absolute right-1.5 top-1.5 text-yellow-300 z-0 ${
          isDark ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
        }`}
        animate={{ 
          opacity: isDark ? 0 : 1,
          scale: isDark ? 0.5 : 1,
          rotate: isDark ? -30 : 0
        }}
        transition={{ duration: 0.5 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      </motion.div>
      
      {/* أيقونة القمر */}
      <motion.div
        className={`absolute left-1.5 top-1.5 text-blue-200 z-0 ${
          isDark ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
        animate={{ 
          opacity: isDark ? 1 : 0,
          scale: isDark ? 1 : 0.5,
          rotate: isDark ? 0 : 30
        }}
        transition={{ duration: 0.5 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </motion.div>
      
      {/* النجوم في الوضع الليلي */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${20 + i * 15}%`,
              left: `${30 + (i * 10) % 40}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </motion.button>
  );
};

// مكون تبديل اللغة
const LanguageSwitch = ({ isRTL, toggleLanguage }: { isRTL: boolean; toggleLanguage: () => void }) => {
  return (
    <motion.button
      onClick={toggleLanguage}
      className={`relative inline-flex items-center h-7 rounded-full w-14 transition-all duration-500 ease-in-out focus:outline-none overflow-hidden shadow-lg ${
        isRTL ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
      }`}
      aria-label="تبديل اللغة"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* خلفية متحركة مع تأثير التوهج */}
      <motion.div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          isRTL ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)'
        }}
      />
      
      {/* مؤشر التبديل */}
      <motion.div
        className={`absolute w-5 h-5 rounded-full bg-white shadow-lg z-10 flex items-center justify-center ${
          isRTL ? 'left-8' : 'left-1'
        }`}
        layout
        transition={{ 
          type: "spring", 
          stiffness: 700, 
          damping: 30,
          duration: 0.5
        }}
      >
        <motion.div
          animate={{ 
            rotate: isRTL ? 0 : 180,
            transition: { duration: 0.5 }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </motion.div>
      </motion.div>
      
      {/* أيقونة الإنجليزية */}
      <motion.div
        className={`absolute right-1.5 top-1.5 text-white z-0 flex items-center justify-center ${
          isRTL ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
        }`}
        animate={{ 
          opacity: isRTL ? 0 : 1,
          scale: isRTL ? 0.5 : 1,
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold">EN</span>
          <div className="w-2 h-0.5 bg-white rounded-full mt-0.5"></div>
        </div>
      </motion.div>
      
      {/* أيقونة العربية */}
      <motion.div
        className={`absolute left-1.5 top-1.5 text-white z-0 flex items-center justify-center ${
          isRTL ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
        animate={{ 
          opacity: isRTL ? 1 : 0,
          scale: isRTL ? 1 : 0.5,
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold">AR</span>
          <div className="w-2 h-0.5 bg-white rounded-full mt-0.5"></div>
        </div>
      </motion.div>
      
      {/* تأثير النجوم المتحركة */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isRTL ? 'opacity-100' : 'opacity-0'}`}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${25 + i * 25}%`,
              left: `${20 + (i * 15) % 60}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
      
      {/* تأثير التوهج حول الزر */}
      <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
        isRTL ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 blur-md"></div>
      </div>
    </motion.button>
  );
};

// مكون الإعدادات الرئيسي
const SettingsDropdown = ({ 
  isDark, 
  toggleDarkMode, 
  isRTL, 
  toggleLanguage,
  fontSize,
  setFontSize
}: { 
  isDark: boolean; 
  toggleDarkMode: () => void;
  isRTL: boolean;
  toggleLanguage: () => void;
  fontSize: string;
  setFontSize: (size: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const t = translations[isRTL ? 'ar' : 'en'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={settingsRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t.settings}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden z-50`}
          >
            {/* رأس الإعدادات */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700/50 dark:to-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t.settings}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isRTL ? 'تخصيص تجربتك' : 'Customize your experience'}
                  </p>
                </div>
              </div>
            </div>

            {/* خيارات الإعدادات */}
            <div className="p-2 space-y-1">
              {/* تبديل الوضع الداكن */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d={isDark ? "M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" : "M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"} />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.darkMode}
                  </span>
                </div>
                <DarkModeSwitch isDark={isDark} toggleDarkMode={toggleDarkMode} />
              </div>

              {/* تبديل اللغة */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 11-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.language}
                  </span>
                </div>
                <LanguageSwitch isRTL={isRTL} toggleLanguage={toggleLanguage} />
              </div>

              {/* حجم الخط */}
              <FontSizeSwitch fontSize={fontSize} setFontSize={setFontSize} isRTL={isRTL} />
            </div>

            {/* تذييل الإعدادات */}
            <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-700/30">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {isRTL ? 'سيتم حفظ تفضيلاتك تلقائياً' : 'Your preferences will be saved automatically'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// مكون الإعدادات للقائمة الجانبية في الموبايل
const MobileSettingsDropdown = ({ 
  isDark, 
  toggleDarkMode, 
  isRTL, 
  toggleLanguage,
  fontSize,
  setFontSize
}: { 
  isDark: boolean; 
  toggleDarkMode: () => void;
  isRTL: boolean;
  toggleLanguage: () => void;
  fontSize: string;
  setFontSize: (size: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = translations[isRTL ? 'ar' : 'en'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25 }}
      className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <span className="text-lg font-medium text-gray-900 dark:text-white">
            {t.settings}
          </span>
          <div className="h-0.5 w-0 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="py-4 space-y-4">
              {/* الوضع الداكن */}
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d={isDark ? "M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" : "M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"} />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {t.darkMode}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRTL ? 'تغيير مظهر التطبيق' : 'Change app appearance'}
                    </p>
                  </div>
                </div>
                <DarkModeSwitch isDark={isDark} toggleDarkMode={toggleDarkMode} />
              </div>

              {/* اللغة */}
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 11-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {t.language}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRTL ? 'تغيير لغة الواجهة' : 'Change interface language'}
                    </p>
                  </div>
                </div>
                <LanguageSwitch isRTL={isRTL} toggleLanguage={toggleLanguage} />
              </div>

              {/* حجم الخط */}
              <div className="px-4">
                <FontSizeSwitch fontSize={fontSize} setFontSize={setFontSize} isRTL={isRTL} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// مكون زر الإشعارات
const NotificationButton = ({ 
  showNotifications, 
  setShowNotifications,
  isRTL,
  isMobile = false
}: { 
  showNotifications: boolean; 
  setShowNotifications: (show: boolean) => void;
  isRTL: boolean;
  isMobile?: boolean;
}) => {
  const router = useRouter();
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const t = translations[isRTL ? 'ar' : 'en'];
  
  // جلب الإشعارات من API
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch('/api/notifications');
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        const notificationsData = data.notifications || [];
        
        setNotifications(notificationsData.slice(0, 3));
        setHasNewNotifications(notificationsData.some((n: NotificationItem) => !n.isRead));
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session?.user?.email]);
  
  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      fetch(`/api/notifications/${notification._id}/read`, {
        method: 'PATCH',
      }).catch(error => console.error('Error marking notification as read:', error));
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    
    setShowNotifications(false);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return isRTL ? 'تاريخ غير متوفر' : 'Date not available';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return isRTL ? 'تاريخ غير صالح' : 'Invalid date';
      
      return getTimeAgo(dateString, isRTL);
    } catch (error) {
      console.error('Error formatting date:', error);
      return isRTL ? 'خطأ في التاريخ' : 'Date error';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return '📢';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  // للموبايل
  if (isMobile) {
    return (
      <>
        <motion.button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          
          {hasNewNotifications && (
            <motion.span 
              className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                delay: 0.2
              }}
            />
          )}
          
          {hasNewNotifications && (
            <motion.span 
              className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full opacity-70"
              animate={{ 
                scale: [1, 1.5, 2],
                opacity: [0.7, 0.4, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
            />
          )}
        </motion.button>
        
        <AnimatePresence>
          {showNotifications && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setShowNotifications(false)}
              />
              
              <motion.div
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ 
                  y: "-100%", 
                  opacity: 0,
                  transition: {
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1]
                  }
                }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 300,
                  mass: 0.8,
                  duration: 0.5
                }}
                className="fixed top-20 left-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-3xl shadow-2xl z-50 max-h-[70vh] overflow-hidden"
              >
                <div className="flex justify-center py-3 bg-gradient-to-b from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80">
                  <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                
                <div className="px-5 pb-4 pt-2 bg-gradient-to-b from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {hasNewNotifications && (
                          <motion.span 
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [1, 0.7, 1]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity
                            }}
                          />
                        )}
                      </span>
                      {t.notifications}
                    </h3>
                    <button
                      onClick={() => router.push("/notifications")}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 px-3 py-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                    >
                      {t.viewAll}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="overflow-y-auto max-h-[50vh] px-5 pb-5">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t.loading}</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="space-y-3 py-4">
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification._id}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all duration-200 cursor-pointer ${
                            !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                              {getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                                {getLocalizedText(notification.title, notification.titleEn, isRTL)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0 1 1 0 012 0zm0 4a1 1 0 100 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                {formatDate(notification.createdAt)}
                              </p>
                              {notification.message && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                  {getLocalizedText(notification.message, notification.messageEn, isRTL)}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-base text-gray-500 dark:text-gray-400">{t.noNotifications}</p>
                    </div>
                  )}
                </div>
                
                <div className="px-5 pb-5 pt-2 bg-gradient-to-t from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-900/80">
                  <motion.button
                    onClick={() => setShowNotifications(false)}
                    className="w-full py-3 px-4 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {isRTL ? 'إغلاق' : 'Close'}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // للكمبيوتر
  return (
    <div className="relative notification-dropdown" ref={notificationRef}>
      <motion.button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {hasNewNotifications && (
          <motion.span 
            className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              delay: 0.2
            }}
          />
        )}
        
        {hasNewNotifications && (
          <motion.span 
            className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full opacity-70"
            animate={{ 
              scale: [1, 1.5, 2],
              opacity: [0.7, 0.4, 0]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 0.5
            }}
          />
        )}
      </motion.button>
      
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden max-h-96 overflow-y-auto ${
              isRTL ? 'left-0' : 'right-0'
            } mt-2 w-80`}
          >
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-700/50 dark:to-gray-800/50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.notifications}</h3>
                <button
                  onClick={() => router.push("/notifications")}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  {t.viewAll}
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t.loading}</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-150 ${
                      !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100/80 dark:bg-gray-700/80 rounded-lg flex items-center justify-center text-xl">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className={`${isRTL ? 'mr-3' : 'ml-3'} flex-1 min-w-0`}>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {getLocalizedText(notification.title, notification.titleEn, isRTL)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {getLocalizedText(notification.message, notification.messageEn, isRTL)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center">
                  <div className="text-2xl">📭</div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.noNotifications}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// المكون الرئيسي للشريط العلوي
export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isRTL, setIsRTL] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname(); // إضافة usePathname للتعرف على الصفحة الحالية
  const { data: session, status } = useSession();
  const t = translations[isRTL ? 'ar' : 'en'];
  
  useEffect(() => {
    setMounted(true);
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDark(savedDarkMode === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    }
    
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
      setIsRTL(savedLanguage === 'ar');
    } else {
      const browserLang = navigator.language || '';
      setIsRTL(browserLang.includes('ar'));
    }

    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }
  }, []);
  
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('darkMode', isDark.toString());
      
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [isDark, mounted]);
  
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('language', isRTL ? 'ar' : 'en');
      
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = isRTL ? 'ar' : 'en';
    }
  }, [isRTL, mounted]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
      document.documentElement.classList.add(`font-${fontSize}`);
      
      localStorage.setItem('fontSize', fontSize);
    }
  }, [fontSize, mounted]);
  
  const displayName = session?.user?.name || (isRTL ? "المستخدم" : "User");
  const userEmail = session?.user?.email;
  
  const initials = (displayName || (isRTL ? "مستخدم" : "User"))
    .split(" ")
    .filter(Boolean)
    .map(s => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  
  const handleManage = () => {
    setProfileOpen(false);
    setTimeout(() => router.push("/profile"), 100);
  };
  
  const handleFavorites = () => {
    setProfileOpen(false);
    setTimeout(() => router.push("/favorites"), 100);
  };
  
  const handleChangePassword = () => {
    setProfileOpen(false);
    setTimeout(() => router.push("/change-password"), 100);
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut({ callbackUrl: "/" });
  };
  
  const toggleMobileMenu = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };
  
  const toggleLanguage = () => {
    localStorage.setItem('language', isRTL ? 'en' : 'ar');
    window.location.reload();
  };
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (contentOpen && !(e.target as Element).closest('.content-dropdown')) {
        setContentOpen(false);
      }
      if (aboutOpen && !(e.target as Element).closest('.about-dropdown')) {
        setAboutOpen(false);
      }
      if (contactOpen && !(e.target as Element).closest('.contact-dropdown')) {
        setContactOpen(false);
      }
      if (showNotifications && !(e.target as Element).closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
      if (mobileMenuOpen && !(e.target as Element).closest('.mobile-menu-container')) {
        setMobileMenuOpen(false);
      }
    }
    
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setContentOpen(false);
        setAboutOpen(false);
        setContactOpen(false);
        setShowNotifications(false);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [contentOpen, mobileMenuOpen, aboutOpen, contactOpen, showNotifications]);
  
  if (!mounted) return null;
  
  const logoSrc = isRTL ? "/logo.png" : "/logoE.png";
  
  // دالة للتحقق إذا كان الرابط هو الصفحة الحالية
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };
  
  return (
    <>
      {/* النافبار الرئيسي للكمبيوتر */}
      <nav className="hidden md:flex fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-6xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl rounded-2xl border border-white/20 dark:border-gray-700/30 py-1.5 px-4 transition-all duration-300">
        <div className="flex justify-between items-center w-full">
          {/* القسم الأيسر - الشعار والروابط */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 rounded-full shadow-xl border-2 border-white/30 transition-all duration-500 transform group-hover:scale-110 group-hover:shadow-lg">
                  <Image 
                    src={logoSrc} 
                    alt="فذلكه" 
                    width={32} 
                    height={32}
                    className="object-contain transition-transform duration-500 group-hover:rotate-12"
                  />
                </div>
              </div>
            </Link>
            
            <div className={`flex items-center space-x-0 ${isRTL ? 'mr-1' : 'ml-1'}`}>
              <Link 
                href="/" 
                className={`px-2 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-1 ${
                  isActive("/") 
                    ? "bg-blue-900 text-white shadow-lg" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1h2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                {t.home}
              </Link>
              
              <div className="relative content-dropdown">
                <button
                  onClick={() => setContentOpen(!contentOpen)}
                  className={`px-2 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-1 ${
                    isActive("/episodes") || isActive("/playlists") || isActive("/seasons") || isActive("/articles")
                      ? "bg-blue-900 text-white shadow-lg" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                  {t.content}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${contentOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                <AnimatePresence>
                  {contentOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg text-gray-900 dark:text-white rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden z-50`}
                    >
                      <div className="p-1">
                        <Link 
                          href="/episodes" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 group ${
                            isActive("/episodes")
                              ? "bg-blue-900 text-white" 
                              : "hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isActive("/episodes") ? "text-white" : "text-blue-500 group-hover:text-blue-600"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                          <span className="text-sm font-medium">{t.episodes}</span>
                        </Link>
                        <Link 
                          href="/playlists" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 group ${
                            isActive("/playlists")
                              ? "bg-blue-900 text-white" 
                              : "hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isActive("/playlists") ? "text-white" : "text-purple-500 group-hover:text-purple-600"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                          <span className="text-sm font-medium">{t.playlists}</span>
                        </Link>
                        <Link 
                          href="/seasons" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 group ${
                            isActive("/seasons")
                              ? "bg-blue-900 text-white" 
                              : "hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isActive("/seasons") ? "text-white" : "text-green-500 group-hover:text-green-600"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H8V3a1 1 0 00-1-1H6zM4 8h12v8H4V8z" />
                          </svg>
                          <span className="text-sm font-medium">{t.seasons}</span>
                        </Link>
                        <Link 
                          href="/articles" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 group ${
                            isActive("/articles")
                              ? "bg-blue-900 text-white" 
                              : "hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isActive("/articles") ? "text-white" : "text-yellow-500 group-hover:text-yellow-600"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                          </svg>
                          <span className="text-sm font-medium">{t.articles}</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="relative about-dropdown">
                <button
                  onClick={() => setAboutOpen(!aboutOpen)}
                  className={`px-2 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-1 ${
                    isActive("/about") || isActive("/follow-us") || isActive("/team")
                      ? "bg-blue-900 text-white shadow-lg" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                  </svg>
                  {t.about}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${aboutOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                <AnimatePresence>
                  {aboutOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg text-gray-900 dark:text-white rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden z-50`}
                    >
                      <div className="p-1">
                        <Link 
                          href="/about" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 group ${
                            isActive("/about")
                              ? "bg-blue-900 text-white" 
                              : "hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isActive("/about") ? "text-white" : "text-blue-500 group-hover:text-blue-600"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                          </svg>
                          <span className="text-sm font-medium">{t.whoWeAre}</span>
                        </Link>
                        
                        <Link 
                          href="/follow-us" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 group ${
                            isActive("/follow-us")
                              ? "bg-blue-900 text-white" 
                              : "hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isActive("/follow-us") ? "text-white" : "text-red-500 group-hover:text-red-600"}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.75 5.25A.75.75 0 014.5 4.5h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75V5.25zm0 9A.75.75 0 014.5 13.5h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75v-5.25zm9-9A.75.75 0 0113.5 4.5h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H13.5a.75.75 0 01-.75-.75V5.25zm0 9a.75.75 0 01.75-.75h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H13.5a.75.75 0 01-.75-.75v-5.25z" />
                          </svg>
                          <span className="text-sm font-medium">{t.platforms}</span>
                        </Link>
                        
                        <Link 
                          href="/team" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 group ${
                            isActive("/team")
                              ? "bg-blue-900 text-white" 
                              : "hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isActive("/team") ? "text-white" : "text-purple-500 group-hover:text-purple-600"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                          <span className="text-sm font-medium">{t.team}</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="relative contact-dropdown">
                <button
                  onClick={() => setContactOpen(!contactOpen)}
                  className={`px-2 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-1 ${
                    isActive("/contact") || isActive("/faq")
                      ? "bg-blue-900 text-white shadow-lg" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {t.contact}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${contactOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                <AnimatePresence>
                  {contactOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg text-gray-900 dark:text-white rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden z-50`}
                    >
                      <div className="p-1">
                        <Link 
                          href="/contact" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 group ${
                            isActive("/contact")
                              ? "bg-blue-900 text-white" 
                              : "hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isActive("/contact") ? "text-white" : "text-blue-500 group-hover:text-blue-600"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <span className="text-sm font-medium">{t.contactUs}</span>
                        </Link>
                        <Link 
                          href="/faq" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 group ${
                            isActive("/faq")
                              ? "bg-blue-900 text-white" 
                              : "hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isActive("/faq") ? "text-white" : "text-green-500 group-hover:text-green-600"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                          </svg>
                          <span className="text-sm font-medium">{t.faq}</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* القسم الأيمن - البحث والوضع الداكن واللغة والحساب */}
          <div className="flex items-center space-x-1">
            <motion.button
              onClick={() => router.push("/search")}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t.search}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.button>
            
            <SettingsDropdown 
              isDark={isDark}
              toggleDarkMode={toggleDarkMode}
              isRTL={isRTL}
              toggleLanguage={toggleLanguage}
              fontSize={fontSize}
              setFontSize={setFontSize}
            />
            
            {status === "unauthenticated" && (
              <div className="flex items-center space-x-1">
                <Link href="/sign-in" className="px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white">
                  {t.signIn}
                </Link>
                <Link href="/sign-up" className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm font-medium text-white shadow-md">
                  {t.signUp}
                </Link>
              </div>
            )}
            
            {status === "authenticated" && (
              <>
                <div className="notification-dropdown">
                  <NotificationButton 
                    showNotifications={showNotifications} 
                    setShowNotifications={setShowNotifications}
                    isRTL={isRTL}
                  />
                </div>
                
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(prev => !prev)}
                    aria-expanded={profileOpen}
                    className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-all duration-300"
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={displayName}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover border-2 border-white/30"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-800 text-white flex items-center justify-center font-semibold border-2 border-white/30 text-xs">
                        {initials}
                      </div>
                    )}
                    <span className="hidden sm:inline text-sm font-medium text-gray-900 dark:text-white">{displayName}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-gray-500 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                  
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg text-gray-900 dark:text-white rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden z-50`}
                      >
                        <div className="p-1">
                          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                          </div>
                          <button
                            onClick={handleManage}
                            className="w-full text-right px-4 py-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200 flex items-center justify-between group"
                          >
                            <span className="text-sm font-medium">{t.manageAccount}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                            </svg>
                          </button>
                          <button
                            onClick={handleFavorites}
                            className="w-full text-right px-4 py-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200 flex items-center justify-between group"
                          >
                            <span className="text-sm font-medium">{t.favorites}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                            </svg>
                          </button>
                          <button
                            onClick={handleChangePassword}
                            className="w-full text-right px-4 py-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200 flex items-center justify-between group"
                          >
                            <span className="text-sm font-medium">{t.changePassword}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7a5 5 0 0110 0zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-1"></div>
                          <button
                            onClick={handleSignOut}
                            className="w-full text-right px-4 py-3 rounded-lg hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center justify-between group"
                          >
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">{t.signOut}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 group-hover:text-red-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 001.414-1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
      
      {/* النافبار للموبايل */}
      <nav className="md:hidden fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl rounded-2xl border border-white/20 dark:border-gray-700/30 py-3 px-4 transition-all duration-300">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {status === "authenticated" && (
              <>
                <button
                  onClick={() => router.push("/profile")}
                  className="flex items-center"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={displayName}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-800 text-white flex items-center justify-center font-semibold border-2 border-white/30 text-xs">
                      {initials}
                    </div>
                  )}
                </button>
                
                <NotificationButton 
                  showNotifications={showNotifications} 
                  setShowNotifications={setShowNotifications}
                  isRTL={isRTL}
                  isMobile={true}
                />
              </>
            )}
            
            {status === "unauthenticated" && (
              <Link href="/sign-in">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" />
                  </svg>
                </div>
              </Link>
            )}
          </div>
          
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="flex items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 rounded-full shadow-xl border-2 border-white/30 transition-all duration-500 transform group-hover:scale-110 group-hover:shadow-lg">
                  <Image 
                    src={logoSrc} 
                    alt="فذلكه" 
                    width={36} 
                    height={36}
                    className="object-contain transition-transform duration-500 group-hover:rotate-12"
                  />
                </div>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => router.push("/search")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t.search}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.button>
            
            <button
              id="mobile-menu-button"
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
      
      {/* القائمة الجانبية للموبايل */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={(e) => {
                if ((e.target as Element).closest('#mobile-menu-button')) return;
                setMobileMenuOpen(false);
              }}
            />
            
            <motion.div
              initial={{ x: isRTL ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? "-100%" : "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`mobile-menu-container fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-80 max-w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-2xl z-50 overflow-y-auto md:hidden`}
            >
              <div className="flex flex-col h-full">
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-1/2 translate-y-2"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-white/80 font-medium">
                        {t.PlatformMame.replace('{year}', new Date().getFullYear().toString())}
                      </div>
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {status === "authenticated" && (
                      <div className="flex items-center">
                        {session.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt={displayName}
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white/30"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center font-semibold border-2 border-white/30 text-lg">
                            {initials}
                          </div>
                        )}
                        <div className="mr-3">
                          <p className="font-semibold text-lg">{displayName}</p>
                          <p className="text-sm opacity-80">{userEmail}</p>
                        </div>
                      </div>
                    )}
                    
                    {status === "unauthenticated" && (
                      <div className="flex items-center">
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                        </div>
                        <div className="mr-3">
                          <p className="font-semibold text-lg">{t.PlatformMame}</p>
                          <p className="text-sm opacity-80">{isRTL ? 'مرحباً بك' : 'Welcome'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    {[
                      { href: "/", icon: "home", label: t.home, color: "from-blue-500 to-cyan-500" },
                      { href: "/search", icon: "search", label: t.search, color: "from-indigo-500 to-purple-500" },
                      { href: "/episodes", icon: "video", label: t.episodes, color: "from-purple-500 to-pink-500" },
                      { href: "/playlists", icon: "playlist", label: t.playlists, color: "from-green-500 to-teal-500" },
                      { href: "/seasons", icon: "calendar", label: t.seasons, color: "from-yellow-500 to-orange-500" },
                      { href: "/articles", icon: "article", label: t.articles, color: "from-red-500 to-rose-500" },
                      { href: "/about", icon: "info", label: t.whoWeAre, color: "from-indigo-500 to-blue-500" },
                      { href: "/follow-us", icon: "grid", label: t.platforms, color: "from-red-500 to-pink-500" },
                      { href: "/team", icon: "team", label: t.team, color: "from-pink-500 to-rose-500" },
                      { href: "/contact", icon: "mail", label: t.contactUs, color: "from-cyan-500 to-blue-500" },
                      { href: "/faq", icon: "question", label: t.faq, color: "from-teal-500 to-green-500" }
                    ].map((item, index) => (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            isActive(item.href)
                              ? "bg-blue-900 text-white shadow-lg" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg ${
                            isActive(item.href) ? "opacity-100" : ""
                          }`}>
                            {item.icon === "home" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1h2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                              </svg>
                            )}
                            {item.icon === "search" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            )}
                            {item.icon === "video" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                            )}
                            {item.icon === "playlist" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                              </svg>
                            )}
                            {item.icon === "calendar" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H8V3a1 1 0 00-1-1H6zM4 8h12v8H4V8z" />
                              </svg>
                            )}
                            {item.icon === "article" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                              </svg>
                            )}
                            {item.icon === "question" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                              </svg>
                            )}
                            {item.icon === "info" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                              </svg>
                            )}
                            {item.icon === "team" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                              </svg>
                            )}
                            {item.icon === "mail" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                            )}
                            {item.icon === "grid" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3.75 5.25A.75.75 0 014.5 4.5h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75V5.25zm0 9A.75.75 0 014.5 13.5h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75v-5.25zm9-9A.75.75 0 0113.5 4.5h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H13.5a.75.75 0 01-.75-.75V5.25zm0 9a.75.75 0 01.75-.75h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H13.5a.75.75 0 01-.75-.75v-5.25z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className={`text-lg font-medium ${isActive(item.href) ? "text-white" : "text-gray-900 dark:text-white"}`}>{item.label}</span>
                            <div className={`h-0.5 w-0 bg-gradient-to-r ${isActive(item.href) ? "from-white to-gray-200" : "from-blue-500 to-purple-500"} group-hover:w-full transition-all duration-300`}></div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    
                    <MobileSettingsDropdown 
                      isDark={isDark}
                      toggleDarkMode={toggleDarkMode}
                      isRTL={isRTL}
                      toggleLanguage={toggleLanguage}
                      fontSize={fontSize}
                      setFontSize={setFontSize}
                    />
                    
                    {status === "authenticated" && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/notifications"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            isActive("/notifications")
                              ? "bg-blue-900 text-white shadow-lg" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className={`text-lg font-medium ${isActive("/notifications") ? "text-white" : "text-gray-900 dark:text-white"}`}>{t.notifications}</span>
                            <div className={`h-0.5 w-0 bg-gradient-to-r ${isActive("/notifications") ? "from-white to-gray-200" : "from-amber-500 to-orange-500"} group-hover:w-full transition-all duration-300`}></div>
                          </div>
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                  
                  {status === "unauthenticated" && (
                    <div className="pt-4 mt-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/sign-in"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-200 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="text-lg font-medium text-gray-900 dark:text-white">{t.signIn}</span>
                            <div className="h-0.5 w-0 bg-gradient-to-r from-gray-500 to-gray-700 group-hover:w-full transition-all duration-300"></div>
                          </div>
                        </Link>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/sign-up"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                          </div>
                          <span className="text-lg font-medium text-white">{t.signUp}</span>
                        </Link>
                      </motion.div>
                    </div>
                  )}
                  
                  {status === "authenticated" && (
                    <div className="pt-4 mt-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            isActive("/profile")
                              ? "bg-blue-900 text-white shadow-lg" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className={`text-lg font-medium ${isActive("/profile") ? "text-white" : "text-gray-900 dark:text-white"}`}>{t.manageAccount}</span>
                            <div className={`h-0.5 w-0 bg-gradient-to-r ${isActive("/profile") ? "from-white to-gray-200" : "from-indigo-500 to-blue-500"} group-hover:w-full transition-all duration-300`}></div>
                          </div>
                        </Link>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/favorites"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            isActive("/favorites")
                              ? "bg-blue-900 text-white shadow-lg" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className={`text-lg font-medium ${isActive("/favorites") ? "text-white" : "text-gray-900 dark:text-white"}`}>{t.favorites}</span>
                            <div className={`h-0.5 w-0 bg-gradient-to-r ${isActive("/favorites") ? "from-white to-gray-200" : "from-red-500 to-pink-500"} group-hover:w-full transition-all duration-300`}></div>
                          </div>
                        </Link>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/change-password"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            isActive("/change-password")
                              ? "bg-blue-900 text-white shadow-lg" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7a5 5 0 0110 0zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className={`text-lg font-medium ${isActive("/change-password") ? "text-white" : "text-gray-900 dark:text-white"}`}>{t.changePassword}</span>
                            <div className={`h-0.5 w-0 bg-gradient-to-r ${isActive("/change-password") ? "from-white to-gray-200" : "from-amber-500 to-yellow-500"} group-hover:w-full transition-all duration-300`}></div>
                          </div>
                        </Link>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all duration-200 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 001.414-1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="text-lg font-medium text-red-600 dark:text-red-400">{t.signOut}</span>
                            <div className="h-0.5 w-0 bg-gradient-to-r from-red-600 to-red-800 group-hover:w-full transition-all duration-300"></div>
                          </div>
                        </button>
                      </motion.div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t.copyright.replace('{year}', new Date().getFullYear().toString())}
                      </div>
                      <div className="flex space-x-2">
                        <Link href="/terms-conditions" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
                          {t.terms}
                        </Link>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <Link href="/privacy-policy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
                          {t.privacy}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        @keyframes tilt {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        .animate-tilt {
          animation: tilt 3s ease-in-out infinite;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .font-small {
          font-size: 14px;
        }
        .font-medium {
          font-size: 16px;
        }
        .font-large {
          font-size: 18px;
        }
      `}</style>
    </>
  );
}