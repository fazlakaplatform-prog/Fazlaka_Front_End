"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchPlaylists, Playlist } from "@/lib/sanity";

// تعريف نوع موسع للتعامل مع الصور المختلفة
type PlaylistWithImage = Playlist & {
  imageUrl?: string;
  image?: { url?: string };
  coverImage?: { url?: string };
  thumbnail?: { url?: string };
  cover?: { asset?: { url?: string } };
};

const PlaylistsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [heroAnimation, setHeroAnimation] = useState(false);
  
  useEffect(() => {
    async function fetchPlaylistsData() {
      try {
        const data = await fetchPlaylists();
        console.log("Fetched playlists:", data);
        setPlaylists(data);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlaylistsData();
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    // بدء أنيميشن الهيرو بعد تحميل الصفحة
    const t = setTimeout(() => setHeroAnimation(true), 100);
    return () => clearTimeout(t);
  }, []);

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      (playlist.title || "")
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center mt-10 text-gray-700 dark:text-gray-200 animate-pulse">
        جاري التحميل...
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="text-center mt-10 py-12 rounded-3xl shadow-lg">
        <p className="text-gray-600 dark:text-gray-400 text-lg animate-bounce">
          لا توجد قوائم حاليًا
        </p>
      </div>
    );
  }

  // دالة للحصول على رابط الصورة من كائن Playlist
  const getImageUrl = (playlist: Playlist): string | null => {
    const playlistWithImage = playlist as PlaylistWithImage;
    
    if (playlistWithImage.imageUrl) return playlistWithImage.imageUrl;
    if (playlistWithImage.image?.url) return playlistWithImage.image.url;
    if (playlistWithImage.coverImage?.url) return playlistWithImage.coverImage.url;
    if (playlistWithImage.thumbnail?.url) return playlistWithImage.thumbnail.url;
    if (playlistWithImage.cover?.asset?.url) return playlistWithImage.cover.asset.url;
    
    return null;
  };

  // Hero Section Component
  const HeroSection = () => {
    return (
      <div className={`relative mb-12 sm:mb-16 overflow-hidden rounded-3xl transition-all duration-1000 ${heroAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* الخلفية المتدرجة - تم تعديلها لتكون أغمق في الوضع الفاتح */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-purple-800 to-indigo-900 dark:bg-[#0b1220]"></div>
        
        {/* طبقة إضافية لزيادة التباين في الوضع الفاتح */}
        <div className="absolute inset-0 bg-black/20 dark:bg-black/0"></div>
        
        {/* العناصر الزخرفية - بعيدة عن النص */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {/* دوائر زخرفية في الأطراف */}
          <div className="absolute -top-60 -right-60 w-80 h-80 bg-yellow-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-pulse-slow dark:opacity-6"></div>
          <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-yellow-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-pulse-slow dark:opacity-6"></div>
          
          {/* شبكة زخرفية */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-6 dark:opacity-4"></div>
          
          {/* أيقونات في الزوايا البعيدة */}
          <div className="absolute top-10 left-10 text-yellow-300/6 transform float-animation">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="absolute top-10 right-10 text-yellow-300/6 transform float-animation" style={{ animationDelay: '1s' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="absolute bottom-10 left-10 text-yellow-300/6 transform float-animation" style={{ animationDelay: '2s' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="absolute bottom-10 right-10 text-yellow-300/6 transform float-animation" style={{ animationDelay: '3s' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          
          {/* عناصر إضافية في الأطراف العلوية والسفلية */}
          <div className="absolute top-0 left-1/4 text-yellow-300/5 transform -translate-x-1/2 float-animation" style={{ animationDelay: '0.5s' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="absolute top-0 right-1/4 text-yellow-300/5 transform translate-x-1/2 float-animation" style={{ animationDelay: '1.5s' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-1/4 text-yellow-300/5 transform -translate-x-1/2 float-animation" style={{ animationDelay: '2.5s' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="absolute bottom-0 right-1/4 text-yellow-300/5 transform translate-x-1/2 float-animation" style={{ animationDelay: '3.5s' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        
        {/* المحتوى الرئيسي */}
        <div className="relative z-10 py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-center">
          <div className="w-full text-center mb-6 md:mb-0 mt-8 md:mt-0">
            <div className="inline-block bg-white/12 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
              <span className="text-white font-medium flex items-center text-sm sm:text-base">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                قوائم التشغيل
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              اكتشف <span className="text-yellow-300">مجموعاتنا</span> التعليمية
            </h1>
            <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
              استكشف مجموعتنا المتنوعة من قوائم التشغيل المنظمة التي تجمع بين الحلقات والمقالات لتجربة تعليمية شاملة ومتكاملة.
            </p>
          </div>
          
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex justify-center mt-8 md:mt-4">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-300/8 backdrop-blur-sm rounded-full filter blur-3xl w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 animate-pulse-slow"></div>
              
              <div className="relative grid grid-cols-3 gap-3 sm:gap-4 w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64">
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.6s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
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

  return (
    // غلاف كامل الشاشة بلون داكن واحد في الداكن مود (قابل للتعديل من الكود أدناه)
    <div className="min-h-screen bg-white dark:bg-[#0b1220] text-gray-900 dark:text-gray-100 py-8 pt-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <HeroSection />
        
        {/* البحث بجانب أزرار العرض */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          {/* شريط البحث المحسن مع الظل وزر المسح */}
          <div className="relative flex-grow max-w-md">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur-lg opacity-25 dark:opacity-30 transition-opacity duration-300"></div>
              <input
                type="text"
                placeholder="بحث عن قائمة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="relative w-full pr-12 pl-12 py-4 rounded-xl outline-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-300"
                aria-label="بحث عن قائمة"
              />
              {/* أيقونة البحث في اليمين */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* زر المسح بشكل X في اليسار */}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-100 dark:bg-gray-700 rounded-full p-1 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm animate-pulse"
                  aria-label="مسح البحث"
                  title="مسح البحث"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* عنوان البحث */}
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              ابحث في قوائم التشغيل حسب العنوان
            </div>
          </div>
          
          {/* أزرار العرض بجانب البحث مع الأيقونات - تم تحسينها */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur-lg opacity-25 dark:opacity-30"></div>
              <div className="relative inline-flex items-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  aria-pressed={viewMode === "grid"}
                  title="عرض شبكي"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" />
                  </svg>
                  <span className="hidden sm:inline">شبكي</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-300 ${
                    viewMode === "list"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  aria-pressed={viewMode === "list"}
                  title="عرض قائمة"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="hidden sm:inline">قائمة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* محتوى القوائم مع الرسوم المتحركة */}
        <div className={`${fadeIn ? "opacity-100" : "opacity-0"} transition-opacity duration-500`} style={{ minHeight: "200px" }}>
          {filteredPlaylists.length === 0 ? (
            <div className="text-center mt-10 py-12 rounded-3xl shadow-lg">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                لا توجد نتائج مطابقة للبحث
              </p>
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full hover:opacity-90 transition-all duration-300 transform hover:scale-105"
              >
                مسح البحث
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlaylists.map((playlist, index) => {
                const imageUrl = getImageUrl(playlist);
                // حساب عدد الحلقات والمقالات
                const episodesCount = playlist.episodes?.length || 0;
                const articlesCount = playlist.articles?.length || 0;
                const totalItems = episodesCount + articlesCount;
                
                return (
                  <Link
                    key={playlist._id || playlist.slug?.current}
                    href={`/playlists/${playlist.slug?.current}`}
                    className="group block border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-700 transform hover:scale-[1.02] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:shadow-blue-900/20 dark:hover:shadow-blue-900/30"
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
                  >
                    {imageUrl && (
                      <div className="w-full h-48 relative overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={playlist.title}
                          fill
                          className="object-cover bg-gray-100 dark:bg-gray-700 transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {/* تأثير التدرج على الصورة */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      </div>
                    )}
                    <div className="p-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{playlist.title}</h2>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>{totalItems} عنصر</span>
                        {episodesCount > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full animate-pulse">
                            {episodesCount} حلقة
                          </span>
                        )}
                        {articlesCount > 0 && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full animate-pulse">
                            {articlesCount} مقال
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlaylists.map((playlist, index) => {
                const imageUrl = getImageUrl(playlist);
                // حساب عدد الحلقات والمقالات
                const episodesCount = playlist.episodes?.length || 0;
                const articlesCount = playlist.articles?.length || 0;
                const totalItems = episodesCount + articlesCount;
                
                return (
                  <Link
                    key={playlist._id || playlist.slug?.current}
                    href={`/playlists/${playlist.slug?.current}`}
                    className="group flex gap-4 items-center border rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-700 transform hover:scale-[1.01] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:shadow-blue-900/20 dark:hover:shadow-blue-900/30"
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
                  >
                    {imageUrl && (
                      <div className="w-32 h-20 relative overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={playlist.title}
                          fill
                          className="object-cover rounded-lg bg-gray-100 dark:bg-gray-700 transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        {/* تأثير التدرج على الصورة */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{playlist.title}</h2>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>{totalItems} عنصر</span>
                        {episodesCount > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full animate-pulse">
                            {episodesCount} حلقة
                          </span>
                        )}
                        {articlesCount > 0 && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full animate-pulse">
                            {articlesCount} مقال
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-blue-500 transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistsPage;