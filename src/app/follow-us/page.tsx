// app/follow-us/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { 
  FaYoutube, FaInstagram, FaFacebookF, FaTiktok,
  FaEnvelope, FaPaperPlane, FaShare, FaGlobe, FaMobileAlt,
  FaDesktop, FaDownload, FaGithub, FaBehance, FaDribbble,
  FaSnapchat, FaPinterest, FaReddit, FaWhatsapp, FaTelegram,
  FaLinkedin, FaArrowRight, FaQuoteRight,
  FaApple, FaGooglePlay, FaWindows, FaLinux, FaStar,
  FaRocket, FaShieldAlt, FaCheckCircle
} from 'react-icons/fa';
import { fetchSocialLinks, SocialLink } from '@/lib/sanity';

// Define a type for platform names
type PlatformType = 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'x' | 'twitter' | 
                   'linkedin' | 'threads' | 'snapchat' | 'pinterest' | 'reddit' | 
                   'whatsapp' | 'telegram' | 'github' | 'behance' | 'dribbble';

// أيقونة X مخصصة
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// أيقونة Threads مخصصة
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12.186 24h-.007c-3.581-.024-6.346-2.609-6.38-6.019v-.73C2.078 16.242 0 13.75 0 10.792 0 7.642 2.437 5.016 5.531 4.72c.3-2.694 2.825-4.718 5.698-4.718.746 0 1.463.14 2.124.398l.093.037c.727.292 1.361.732 1.858 1.277l.068.075c.511-.25 1.088-.383 1.68-.383 1.043 0 2.024.485 2.663 1.331l.048.064c.387.514.591 1.13.591 1.774v11.534c0 3.438-2.765 6.023-6.346 6.047h-.072zM5.698 6.231c-2.051 0-3.72 1.67-3.72 3.72 0 2.051 1.669 3.72 3.72 3.72h.366v4.31c.024 2.404 1.983 4.363 4.387 4.387h.07c2.404-.024 4.363-1.983 4.387-4.387V4.514c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366h-1.488v-.366c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366h-1.488v-.366c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366h-1.488v-.366c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366h-1.488v-.366c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366h-1.488v-.366c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366H5.698z"/>
  </svg>
);

// دالة للحصول على الأيقونة المناسبة لكل منصة
function getSocialIcon(platform: string) {
  switch (platform) {
    case 'youtube':
      return FaYoutube;
    case 'instagram':
      return FaInstagram;
    case 'facebook':
      return FaFacebookF;
    case 'tiktok':
      return FaTiktok;
    case 'x':
    case 'twitter':
      return XIcon;
    case 'linkedin':
      return FaLinkedin;
    case 'threads':
      return ThreadsIcon;
    case 'snapchat':
      return FaSnapchat;
    case 'pinterest':
      return FaPinterest;
    case 'reddit':
      return FaReddit;
    case 'whatsapp':
      return FaWhatsapp;
    case 'telegram':
      return FaTelegram;
    case 'github':
      return FaGithub;
    case 'behance':
      return FaBehance;
    case 'dribbble':
      return FaDribbble;
    default:
      return FaShare;
  }
}

// دالة للحصول على اللون المناسب لكل منصة
function getPlatformColor(platform: string) {
  switch (platform) {
    case 'youtube':
      return 'from-red-500 to-red-600';
    case 'instagram':
      return 'from-pink-500 to-purple-500';
    case 'facebook':
      return 'from-blue-500 to-blue-600';
    case 'tiktok':
      return 'from-gray-800 to-black';
    case 'x':
    case 'twitter':
      return 'from-gray-700 to-gray-900';
    case 'linkedin':
      return 'from-blue-600 to-blue-700';
    case 'threads':
      return 'from-gray-800 to-black';
    case 'snapchat':
      return 'from-yellow-400 to-yellow-500';
    case 'pinterest':
      return 'from-red-600 to-red-700';
    case 'reddit':
      return 'from-orange-500 to-orange-600';
    case 'whatsapp':
      return 'from-green-500 to-green-600';
    case 'telegram':
      return 'from-blue-400 to-blue-500';
    case 'github':
      return 'from-gray-700 to-gray-800';
    case 'behance':
      return 'from-blue-500 to-blue-600';
    case 'dribbble':
      return 'from-pink-400 to-pink-500';
    default:
      return 'from-blue-500 to-indigo-600';
  }
}

// دالة للحصول على اسم المنصة حسب اللغة
function getPlatformName(platform: string, language: string) {
  const names: Record<PlatformType, { ar: string; en: string }> = {
    youtube: { ar: 'يوتيوب', en: 'YouTube' },
    instagram: { ar: 'انستجرام', en: 'Instagram' },
    facebook: { ar: 'فيس بوك', en: 'Facebook' },
    tiktok: { ar: 'تيك توك', en: 'TikTok' },
    x: { ar: 'إكس', en: 'X' },
    twitter: { ar: 'إكس', en: 'X' },
    linkedin: { ar: 'لينكد إن', en: 'LinkedIn' },
    threads: { ar: 'ثريدز', en: 'Threads' },
    snapchat: { ar: 'سناب شات', en: 'Snapchat' },
    pinterest: { ar: 'بينترست', en: 'Pinterest' },
    reddit: { ar: 'ريديت', en: 'Reddit' },
    whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
    telegram: { ar: 'تيليجرام', en: 'Telegram' },
    github: { ar: 'جيت هب', en: 'GitHub' },
    behance: { ar: 'بهانس', en: 'Behance' },
    dribbble: { ar: 'دريببل', en: 'Dribbble' }
  };
  
  // Use type assertion to tell TypeScript that platform is a valid key
  const platformKey = platform as PlatformType;
  return names[platformKey]?.[language as 'ar' | 'en'] || platform;
}

// مكون الهيرو
const HeroSection = ({ language }: { language: string }) => {
  const translations = {
    ar: {
      title: "تابعنا على <span class='text-yellow-300'>منصات التواصل</span>",
      subtitle: "انضم إلينا على مختلف منصات التواصل الاجتماعي لتبقى على اطلاع بكل جديد ومتابعة أحدث المحتويات التي نقدمها.",
      tagline: "تواصل معنا"
    },
    en: {
      title: "Follow Us on <span class='text-yellow-300'>Social Media</span>",
      subtitle: "Join us on various social media platforms to stay updated with all the new content and follow the latest content we provide.",
      tagline: "Connect With Us"
    }
  };
  
  const t = translations[language === 'ar' ? 'ar' : 'en'];
  
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
        
        {/* أيقونات التواصل الاجتماعي في الخلفية */}
        <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
          <FaShare className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
          <FaGlobe className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
          <FaMobileAlt className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/3 right-1/3 text-white/10 transform translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '3s' }}>
          <FaEnvelope className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-center">
        <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
          <span className="text-white font-medium flex items-center text-sm sm:text-base">
            <FaShare className="text-yellow-300 mr-2 animate-pulse" />
            {t.tagline}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t.title }}></h1>
        <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
          {t.subtitle}
        </p>
        
        {/* أيقونات التواصل الاجتماعي في الأسفل */}
        <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 flex-wrap">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
            <FaShare className="text-yellow-300 text-lg sm:text-xl" />
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
            <FaGlobe className="text-yellow-300 text-lg sm:text-xl" />
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
            <FaMobileAlt className="text-yellow-300 text-lg sm:text-xl" />
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1.5s' }}>
            <FaEnvelope className="text-yellow-300 text-lg sm:text-xl" />
          </div>
        </div>
      </div>
      
      {/* تأثيرات حركية */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
    </div>
  );
};

// مكون قسم الروابط الاجتماعية
const SocialLinksSection = ({ socialLinks, isRTL, language }: { socialLinks: SocialLink[], isRTL: boolean, language: string }) => {
  const translations = {
    ar: {
      title: "منصات التواصل الاجتماعي",
      subtitle: "تابعنا على منصات التواصل الاجتماعي المختلفة",
      visit: "زيارة"
    },
    en: {
      title: "Social Media Platforms",
      subtitle: "Follow us on various social media platforms",
      visit: "Visit"
    }
  };
  
  const t = translations[language === 'ar' ? 'ar' : 'en'];
  
  // فلترة الروابط لاستبعاد التطبيقات
  const filteredLinks = socialLinks.filter(link => 
    !['mobile_app', 'desktop_app', 'app_store', 'google_play', 'download_link', 'website'].includes(link.platform)
  );
  
  if (filteredLinks.length === 0) return null;
  
  return (
    <section className="mb-12 sm:mb-16">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{t.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
          {t.subtitle}
        </p>
        <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mt-4"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
        {filteredLinks.map((link, index) => {
          const Icon = getSocialIcon(link.platform);
          const colorClass = getPlatformColor(link.platform);
          const platformName = getPlatformName(link.platform, language);
          
          return (
            <a 
              key={link._id}
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-lg transform rotate-1 group-hover:rotate-2 transition-all duration-300"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full flex flex-col items-center justify-center">
                <div className={`bg-gradient-to-r ${colorClass} p-3 rounded-full mb-3 flex items-center justify-center`}>
                  <Icon className="text-white text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 text-center">
                  {platformName}
                </h3>
                <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                  <span>{t.visit}</span>
                  <FaArrowRight className={`mr-1 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
};

// مكون قسم التطبيقات المميز
const AppsSection = ({ socialLinks, isRTL, language }: { socialLinks: SocialLink[], isRTL: boolean, language: string }) => {
  const translations = {
    ar: {
      title: "تطبيقاتنا",
      subtitle: "حمل تطبيقاتنا الآن واستمتع بتجربة أفضل على جميع الأجهزة",
      mobileApps: "تطبيقات الموبايل",
      desktopApps: "تطبيقات الكمبيوتر",
      download: "تحميل",
      size: "الحجم",
      downloads: "التحميلات",
      rating: "التقييم",
      features: "المميزات",
      available: "متاح الآن",
      secure: "آمن 100%",
      fast: "سريع",
      free: "مجاني"
    },
    en: {
      title: "Our Apps",
      subtitle: "Download our apps now and enjoy a better experience on all devices",
      mobileApps: "Mobile Apps",
      desktopApps: "Desktop Apps",
      download: "Download",
      size: "Size",
      downloads: "Downloads",
      rating: "Rating",
      features: "Features",
      available: "Available Now",
      secure: "100% Secure",
      fast: "Fast",
      free: "Free"
    }
  };
  
  const t = translations[language === 'ar' ? 'ar' : 'en'];
  
  // فلترة التطبيقات
  const mobileApps = socialLinks.filter(link => 
    ['mobile_app', 'app_store', 'google_play'].includes(link.platform)
  );
  
  const desktopApps = socialLinks.filter(link => 
    ['desktop_app', 'download_link', 'website'].includes(link.platform)
  );
  
  // بيانات وهمية للتطبيقات (يمكن استبدالها ببيانات حقيقية من Sanity)
  const appData = {
    mobile: {
      icon: FaMobileAlt,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
      features: [t.secure, t.fast, t.free],
      size: '45 MB',
      downloads: '50K+',
      rating: 4.8
    },
    desktop: {
      icon: FaDesktop,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20',
      features: [t.secure, t.fast, t.free],
      size: '120 MB',
      downloads: '25K+',
      rating: 4.9
    }
  };
  
  if (mobileApps.length === 0 && desktopApps.length === 0) return null;
  
  return (
    <section className="mb-12 sm:mb-16 relative">
      {/* خلفية مميزة للقسم */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-3xl"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full mb-4">
            <FaRocket className="mr-2" />
            <span className="font-bold">{t.available}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            {t.subtitle}
          </p>
          <div className="w-20 sm:w-32 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mt-4"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto">
          {/* قسم تطبيقات الموبايل */}
          {mobileApps.length > 0 && (
            <div className="group">
              <div className="relative">
                {/* الخلفية المتحركة */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-3xl shadow-2xl transform rotate-2 group-hover:rotate-3 transition-all duration-500 opacity-20"></div>
                
                {/* المحتوى الرئيسي */}
                <div className={`relative bg-gradient-to-br ${appData.mobile.bgColor} rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-200 dark:border-blue-800 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
                  {/* رأس القسم */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className={`bg-gradient-to-r ${appData.mobile.color} p-3 rounded-2xl mr-4 shadow-lg`}>
                        <appData.mobile.icon className="text-white text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {t.mobileApps}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          iOS & Android
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <FaApple className="text-gray-600 dark:text-gray-400 text-xl" />
                      <FaGooglePlay className="text-gray-600 dark:text-gray-400 text-xl" />
                    </div>
                  </div>
                  
                  {/* المميزات */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {appData.mobile.features.map((feature, index) => (
                      <span key={index} className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <FaCheckCircle className="mr-1 text-green-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  {/* الإحصائيات */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{appData.mobile.size}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t.size}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{appData.mobile.downloads}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t.downloads}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center">
                        {appData.mobile.rating}
                        <FaStar className="ml-1 text-yellow-500 text-sm" />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t.rating}</div>
                    </div>
                  </div>
                  
                  {/* أزرار التحميل */}
                  <div className="space-y-3">
                    {mobileApps.map((app, index) => (
                      <a
                        key={app._id}
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center">
                          {app.platform === 'app_store' ? (
                            <FaApple className="mr-3 text-xl" />
                          ) : (
                            <FaGooglePlay className="mr-3 text-xl" />
                          )}
                          <span>{t.download}</span>
                        </div>
                        <FaArrowRight className={`transition-transform duration-300 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'}`} />
                        
                        {/* تأثير التوهج */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* قسم تطبيقات الكمبيوتر */}
          {desktopApps.length > 0 && (
            <div className="group">
              <div className="relative">
                {/* الخلفية المتحركة */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl shadow-2xl transform -rotate-2 group-hover:-rotate-3 transition-all duration-500 opacity-20"></div>
                
                {/* المحتوى الرئيسي */}
                <div className={`relative bg-gradient-to-br ${appData.desktop.bgColor} rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-200 dark:border-purple-800 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
                  {/* رأس القسم */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className={`bg-gradient-to-r ${appData.desktop.color} p-3 rounded-2xl mr-4 shadow-lg`}>
                        <appData.desktop.icon className="text-white text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {t.desktopApps}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Windows, Mac, Linux
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <FaWindows className="text-gray-600 dark:text-gray-400 text-xl" />
                      <FaApple className="text-gray-600 dark:text-gray-400 text-xl" />
                      <FaLinux className="text-gray-600 dark:text-gray-400 text-xl" />
                    </div>
                  </div>
                  
                  {/* المميزات */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {appData.desktop.features.map((feature, index) => (
                      <span key={index} className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <FaCheckCircle className="mr-1 text-green-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  {/* الإحصائيات */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{appData.desktop.size}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t.size}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{appData.desktop.downloads}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t.downloads}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center">
                        {appData.desktop.rating}
                        <FaStar className="ml-1 text-yellow-500 text-sm" />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t.rating}</div>
                    </div>
                  </div>
                  
                  {/* أزرار التحميل */}
                  <div className="space-y-3">
                    {desktopApps.map((app, index) => (
                      <a
                        key={app._id}
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center">
                          <FaDownload className="mr-3 text-xl" />
                          <span>{t.download}</span>
                        </div>
                        <FaArrowRight className={`transition-transform duration-300 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'}`} />
                        
                        {/* تأثير التوهج */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* شعار الأمان */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
            <FaShieldAlt className="text-green-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.secure} • {t.fast} • {t.free}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

// مكون قسم "هل لديك استفسار"
const ContactSection = ({ isRTL, language }: { isRTL: boolean, language: string }) => {
  const translations = {
    ar: {
      title: "هل لديك أي <span class='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600'>استفسار</span>؟",
      subtitle: "نحن هنا لمساعدتك والإجابة على جميع استفساراتك. لا تتردد في التواصل معنا، فريقنا الدعم متاح دائماً لمساعدتك في أي وقت.",
      contactUs: "تواصل معنا",
      faq: "الأسئلة الشائعة"
    },
    en: {
      title: "Do you have any <span class='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600'>questions</span>?",
      subtitle: "We are here to help you and answer all your inquiries. Do not hesitate to contact us, our support team is always available to help you at any time.",
      contactUs: "Contact Us",
      faq: "FAQ"
    }
  };
  
  const t = translations[language === 'ar' ? 'ar' : 'en'];
  
  return (
    <div className="text-center mt-12 mb-12 sm:mt-16 sm:mb-16">
      <div className="max-w-4xl mx-auto relative">
        {/* خلفية متدرجة متحركة */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-900 rounded-3xl shadow-2xl transform rotate-1 animate-pulse-slow"></div>
        
        {/* الحاوية الرئيسية */}
        <div className="relative z-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-blue-100 dark:border-blue-800 overflow-hidden transition-all duration-700">
          {/* أنماط الخلفية الزخرفية */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            {/* دوائر زخرفية */}
            <div className="absolute -top-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-pulse-slow"></div>
            <div className="absolute -bottom-20 -left-20 w-56 sm:w-72 h-56 sm:h-72 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
            
            {/* شبكة زخرفية */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDMiPjwvcmVjdD4KPC9zdmc+')] opacity-5"></div>
          </div>
          
          <div className="relative z-20">
            {/* الأيقونة الرئيسية المحسنة */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-70 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 p-3 sm:p-4 rounded-full shadow-lg transition-all duration-700 transform hover:scale-101 animate-bounce">
                  <FaEnvelope className="text-white text-2xl sm:text-3xl" />
                </div>
                {/* عناصر زخرفية حول الأيقونة */}
                <div className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 -left-2 w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.8s' }}></div>
              </div>
            </div>
            
            {/* علامات الاقتباس المحسنة */}
            <div className="flex justify-center mb-3 sm:mb-5">
              <div className="relative">
                <FaQuoteRight className="text-3xl sm:text-4xl text-blue-200 dark:text-blue-900/50" />
                <div className="absolute inset-0 text-blue-300 dark:text-blue-800/70 transform scale-75 opacity-50">
                  <FaQuoteRight className="text-3xl sm:text-4xl" />
                </div>
              </div>
            </div>
            
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4" dangerouslySetInnerHTML={{ __html: t.title }}></h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-5 sm:mb-7 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
            
            {/* الأزرار المحسنة */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link 
                href="/contact" 
                className="group relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 sm:py-3 px-5 sm:px-8 rounded-full shadow-lg transition-all duration-700 transform hover:scale-105 animate-bounce text-sm sm:text-base"
              >
                <span className="relative z-10 flex items-center">
                  <FaPaperPlane className={`mr-2 sm:mr-3 text-base sm:text-lg transition-transform duration-700 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'}`} />
                  {t.contactUs}
                </span>
                {/* تأثير الموجة على الزر */}
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600 to-blue-700 opacity-0 transition-opacity duration-700 rounded-full transform scale-0 group-hover:scale-100"></span>
              </Link>
              
              <Link 
                href="/faq" 
                className="group relative inline-flex items-center justify-center overflow-hidden bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 font-bold py-2 sm:py-3 px-5 sm:px-8 rounded-full shadow-lg transition-all duration-700 transform hover:scale-105 animate-bounce text-sm sm:text-base"
                style={{ animationDelay: '0.2s' }}
              >
                <span className="relative z-10 flex items-center">
                  {t.faq}
                  <FaArrowRight className={`mr-2 sm:mr-3 text-base sm:text-lg transition-transform duration-700 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'}`} />
                </span>
                {/* تأثير الموجة على الزر */}
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-100 to-blue-200 dark:from-gray-700 dark:to-gray-600 opacity-0 transition-opacity duration-700 rounded-full transform scale-0 group-hover:scale-100"></span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// مكون المحتوى الرئيسي
function FollowUsContent() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(true);
  const [language, setLanguage] = useState('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // التحقق من تفضيل اللغة المحفوظ في localStorage
    const savedLanguage = localStorage.getItem('language');
    let detectedLanguage = 'ar'; // default to Arabic
    
    if (savedLanguage !== null) {
      detectedLanguage = savedLanguage;
    } else {
      // إذا لم يكن هناك تفضيل محفوظ، استخدم لغة المتصفح
      const browserLang = navigator.language || (navigator as unknown as { userLanguage: string }).userLanguage || '';
      detectedLanguage = browserLang.includes('ar') ? 'ar' : 'en';
    }
    
    setLanguage(detectedLanguage);
    setIsRTL(detectedLanguage === 'ar');
    
    // تطبيق اتجاه الصفحة بناءً على اللغة
    document.documentElement.dir = detectedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = detectedLanguage;
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching social links for language:", language);
        
        // جلب الروابط الاجتماعية
        const linksData = await fetchSocialLinks();
        console.log("Social links data:", linksData);
        setSocialLinks(linksData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language, mounted]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen overflow-x-hidden">
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        {/* الهيرو */}
        <HeroSection language={language} />
        
        {/* قسم الروابط الاجتماعية */}
        <SocialLinksSection socialLinks={socialLinks} isRTL={isRTL} language={language} />
        
        {/* قسم التطبيقات المميز */}
        <AppsSection socialLinks={socialLinks} isRTL={isRTL} language={language} />
        
        {/* قسم التواصل */}
        <ContactSection isRTL={isRTL} language={language} />
      </div>
      
      {/* إضافة الأنماط العامة للصفحة */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes float-animation {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .float-animation {
          animation: float-animation 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// مكون الصفحة الرئيسي مع Suspense
const FollowUsPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>}>
      <FollowUsContent />
    </Suspense>
  );
};

export default FollowUsPage;