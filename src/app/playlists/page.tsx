"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchPlaylists, Playlist } from "@/lib/sanity";
import { useLanguage } from "@/components/LanguageProvider";
import { 
  FaPlay, 
  FaList, 
  FaTh, 
  FaSearch, 
  FaTimes, 
  FaVideo,
  FaNewspaper,
  FaGraduationCap,
  FaBook,
  FaFileAlt,
  FaStar,
  FaHeart
} from "react-icons/fa";
import { client } from "@/lib/sanity";

// تعريف نوع موسع للتعامل مع الصور المختلفة
type PlaylistWithImage = Playlist & {
  imageUrl?: string;
  image?: { url?: string };
  coverImage?: { url?: string };
  thumbnail?: { url?: string };
  cover?: { asset?: { url?: string } };
  titleEn?: string;
  descriptionEn?: string;
  language?: 'ar' | 'en';
};

// تعريف أنواع المفضلة
interface FavoriteEpisode {
  _id: string;
  title: string;
  titleEn?: string;
  slug: { current: string };
  thumbnail?: { asset?: { _ref: string } };
  duration?: number;
  publishedAt?: string;
  language?: 'ar' | 'en';
}

interface FavoriteArticle {
  _id: string;
  title: string;
  titleEn?: string;
  slug: { current: string };
  featuredImage?: { asset?: { _ref: string } };
  publishedAt?: string;
  readTime?: number;
  language?: 'ar' | 'en';
}

// نوع موحد للعناصر المفضلة
type FavoriteItem = FavoriteEpisode | FavoriteArticle;

// كائن الترجمات
const translations = {
  ar: {
    loading: "جاري التحميل...",
    noPlaylists: "لا توجد قوائم حاليًا",
    noResults: "لا توجد نتائج مطابقة للبحث",
    clearSearch: "مسح البحث",
    playlists: "قوائم التشغيل",
    discover: "اكتشف",
    collections: "مجموعاتنا",
    description: "استكشف مجموعتنا المتنوعة من قوائم التشغيل المنظمة التي تجمع بين الحلقات والمقالات لتجربة تعليمية شاملة ومتكاملة.",
    searchPlaceholder: "بحث عن قائمة...",
    searchInPlaylists: "ابحث في قوائم التشغيل حسب العنوان",
    gridView: "شبكي",
    listView: "قائمة",
    items: "عنصر",
    episode: "حلقة",
    episodes: "حلقات",
    article: "مقال",
    articles: "مقالات",
    myFavorites: "مفضلاتي",
    favoriteDescription: "جميع المحتوى الذي تفضله في مكان واحد",
    totalEpisodes: " الحلقات",
    totalArticles: " المقالات",
    viewAll: "عرض الكل",
    totalPlaylists: "إجمالي قوائم التشغيل"
  },
  en: {
    loading: "Loading...",
    noPlaylists: "No playlists available",
    noResults: "No matching results",
    clearSearch: "Clear Search",
    playlists: "Playlists",
    discover: "Discover",
    collections: "Our Collections",
    description: "Explore our diverse collection of organized playlists that combine episodes and articles for a comprehensive and integrated educational experience.",
    searchPlaceholder: "Search for a playlist...",
    searchInPlaylists: "Search playlists by title",
    gridView: "Grid",
    listView: "List",
    items: "item",
    episode: "episode",
    episodes: "episodes",
    article: "article",
    articles: "articles",
    myFavorites: "My Favorites",
    favoriteDescription: "All your favorite content in one place",
    totalEpisodes: "Episodes",
    totalArticles: "Articles",
    viewAll: "View All",
    totalPlaylists: "Total Playlists"
  }
};

const PlaylistsPage = () => {
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [heroAnimation, setHeroAnimation] = useState(false);
  const [favoritesData, setFavoritesData] = useState({
    episodes: 0,
    articles: 0,
    recentItems: [] as FavoriteItem[]
  });
  
  useEffect(() => {
    async function fetchPlaylistsData() {
      try {
        const data = await fetchPlaylists(language);
        console.log("Fetched playlists:", data);
        setPlaylists(data);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlaylistsData();
  }, [language]);

  // جلب بيانات المفضلة
  useEffect(() => {
    async function fetchFavoritesData() {
      try {
        // جلب الحلقات المفضلة
        const episodesQuery = `*[_type == "favorite" && episode._ref != null]{
          episode->{
            _id,
            title,
            titleEn,
            duration,
            publishedAt,
            language
          }
        }`;
        
        // جلب المقالات المفضلة
        const articlesQuery = `*[_type == "favorite" && article._ref != null]{
          article->{
            _id,
            title,
            titleEn,
            readTime,
            publishedAt,
            language
          }
        }`;
        
        const episodesData = await client.fetch(episodesQuery);
        const articlesData = await client.fetch(articlesQuery);
        
        const episodes = episodesData.map((item: { episode?: FavoriteEpisode }) => item.episode).filter(Boolean) as FavoriteEpisode[];
        const articles = articlesData.map((item: { article?: FavoriteArticle }) => item.article).filter(Boolean) as FavoriteArticle[];
        
        // فلترة حسب اللغة الحالية
        const filteredEpisodes = episodes.filter((ep: FavoriteEpisode) => ep.language === language);
        const filteredArticles = articles.filter((art: FavoriteArticle) => art.language === language);
        
        // جلب أحدث العناصر
        const allItems = [...filteredEpisodes, ...filteredArticles]
          .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
          .slice(0, 3);
        
        setFavoritesData({
          episodes: filteredEpisodes.length,
          articles: filteredArticles.length,
          recentItems: allItems
        });
      } catch (error) {
        console.error("Error fetching favorites data:", error);
      }
    }
    
    if (!loading) {
      fetchFavoritesData();
    }
  }, [loading, language]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    // بدء أنيميشن الهيرو بعد تحميل الصفحة
    const timer = setTimeout(() => setHeroAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // التحقق مما إذا كانت المفضلة يجب أن تظهر في نتائج البحث
  const shouldShowFavoritesInSearch = () => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const favoritesTitle = language === 'ar' ? 'مفضلاتي' : 'my favorites';
    
    // التحقق من عنوان المفضلة
    if (favoritesTitle.includes(searchLower)) return true;
    
    // التحقق من العناصر في المفضلة
    return favoritesData.recentItems.some(item => {
      const title = language === 'ar' ? item.title : (item.titleEn || item.title);
      return title && title.toLowerCase().includes(searchLower);
    });
  };

  const filteredPlaylists = playlists.filter(
    (playlist) => {
      const playlistWithImage = playlist as PlaylistWithImage;
      const title = language === 'ar' 
        ? (playlistWithImage.title || "")
        : (playlistWithImage.titleEn || playlistWithImage.title || "");
      
      return title
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    }
  );

  // حساب العدد الإجمالي لقوائم التشغيل (بما في ذلك المفضلة)
  const totalPlaylistsCount = shouldShowFavoritesInSearch() ? filteredPlaylists.length + 1 : filteredPlaylists.length;
  const originalTotalCount = playlists.length + 1; // +1 للمفضلة

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <FaList className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{t.noPlaylists}</p>
        </div>
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
                <FaStar className="text-yellow-300 mr-2 animate-pulse" />
                {t.playlists}
                <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs sm:text-sm">
                  {originalTotalCount}
                </span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              {t.discover} <span className="text-yellow-300">{t.collections}</span> {language === 'ar' ? 'التعليمية' : 'Educational'}
            </h1>
            <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
              {t.description}
            </p>
          </div>
          
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex justify-center mt-8 md:mt-4">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-300/8 backdrop-blur-sm rounded-full filter blur-3xl w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 animate-pulse-slow"></div>
              
              <div className="relative grid grid-cols-3 gap-3 sm:gap-4 w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64">
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaVideo className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaNewspaper className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaPlay className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaGraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaBook className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.6s' }}>
                  <div className="bg-white/12 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaFileAlt className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" />
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

  // قائمة المفضلات الثابتة مع إحصائيات مبسطة
  const FavoritesPlaylist = () => {
    return (
      <Link
        href="/favorites"
        className="group block border-2 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-[1.03] bg-gradient-to-br from-pink-50 via-red-50 to-rose-50 dark:from-pink-900/30 dark:via-red-900/30 dark:to-rose-900/30 border-pink-300 dark:border-pink-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/50 relative"
      >
        {/* خلفية متحركة متعددة الطبقات */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-red-500/10 to-rose-500/10 dark:from-pink-500/20 dark:via-red-500/20 dark:to-rose-500/20 rounded-2xl"></div>
        
        {/* تأثيرات الضوء المتحركة */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-0 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-rose-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* محتوى البطاقة */}
        <div className="relative p-6">
          {/* الرأس */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/30 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg border-2 border-pink-200 dark:border-pink-700">
                <FaHeart className="h-6 w-6 text-pink-500 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">
                {t.myFavorites}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.favoriteDescription}
              </p>
            </div>
          </div>
          
          {/* الإحصائيات المبسطة */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-pink-200 dark:border-pink-700/50">
              <div className="flex items-center gap-2 mb-2">
                <FaVideo className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t.totalEpisodes}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {favoritesData.episodes}
              </div>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-pink-200 dark:border-pink-700/50">
              <div className="flex items-center gap-2 mb-2">
                <FaNewspaper className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t.totalArticles}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {favoritesData.articles}
              </div>
            </div>
          </div>
          
          {/* العناصر الحديثة */}
          {favoritesData.recentItems.length > 0 && (
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-3 border border-pink-200 dark:border-pink-700/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  أحدث العناصر
                </span>
                <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">
                  {t.viewAll} →
                </span>
              </div>
              <div className="space-y-1">
                {favoritesData.recentItems.slice(0, 2).map((item, index) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    • {language === 'ar' ? item.title : (item.titleEn || item.title)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* تأثير التوهج عند التمرير */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-red-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl"></div>
        
        {/* تأثيرات الحواف المتوهجة */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/30 via-transparent to-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      </Link>
    );
  };

  return (
    // غلاف كامل الشاشة بلون داكن واحد في الداكن مود (قابل للتعديل من الكود أدناه)
    <div className="min-h-screen bg-white dark:bg-[#0b1220] text-gray-900 dark:text-gray-100 py-8 pt-24" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <HeroSection />
        
        {/* شريط البحث والأزرار المدمج */}
        <div className="mb-6">
          {/* الحاوية الرئيسية المدمجة */}
          <div className="relative group">
            {/* الخلفية المتدرجة للشريط بأكمله */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            
            {/* الشريط المدمج */}
            <div className="relative flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              
              {/* قسم البحث - يأخذ معظم المساحة */}
              <div className="flex-1 relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-12 pl-12 py-4 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-lg"
                    aria-label={t.searchPlaceholder}
                  />
                  
                  {/* أيقونة البحث في اليسار */}
                  <div className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500`}>
                    <FaSearch className="h-6 w-6" />
                  </div>
                  
                  {/* زر المسح بشكل X في اليمين */}
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 transform -translate-y-1/2 bg-gray-100 dark:bg-gray-700 rounded-full p-1 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm animate-pulse`}
                      aria-label={t.clearSearch}
                      title={t.clearSearch}
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* الفاصل العمودي */}
              <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 mx-2"></div>
              
              {/* قسم أزرار العرض */}
              <div className="flex items-center px-2">
                <div className="inline-flex items-center rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      viewMode === "grid"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    aria-pressed={viewMode === "grid"}
                    title={t.gridView}
                  >
                    <FaTh className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                    <span className="hidden sm:inline">{t.gridView}</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      viewMode === "list"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    aria-pressed={viewMode === "list"}
                    title={t.listView}
                  >
                    <FaList className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                    <span className="hidden sm:inline">{t.listView}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* عنوان البحث */}
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t.searchInPlaylists}
          </div>
        </div>
        
        {/* عرض عدد قوائم التشغيل */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaList className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {t.totalPlaylists}: <span className="font-bold text-blue-600 dark:text-blue-400">{totalPlaylistsCount}</span>
            </span>
          </div>
          {searchTerm && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'ar' 
                ? `عرض ${totalPlaylistsCount} من أصل ${originalTotalCount} قائمة`
                : `Showing ${totalPlaylistsCount} of ${originalTotalCount} playlists`
              }
            </div>
          )}
        </div>
        
        {/* محتوى القوائم مع الرسوم المتحركة */}
        <div className={`${fadeIn ? "opacity-100" : "opacity-0"} transition-opacity duration-500`} style={{ minHeight: "200px" }}>
          {totalPlaylistsCount === 0 ? (
            <div className="text-center mt-10 py-12 rounded-3xl shadow-lg">
              <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <FaSearch className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t.noResults}
              </p>
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full hover:opacity-90 transition-all duration-300 transform hover:scale-105"
              >
                {t.clearSearch}
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* قائمة المفضلة الثابتة - تظهر فقط إذا تطابقت مع البحث */}
              {shouldShowFavoritesInSearch() && <FavoritesPlaylist />}
              
              {filteredPlaylists.map((playlist, index) => {
                const playlistWithImage = playlist as PlaylistWithImage;
                const imageUrl = getImageUrl(playlist);
                // حساب عدد الحلقات والمقالات
                const episodesCount = playlistWithImage.episodes?.length || 0;
                const articlesCount = playlistWithImage.articles?.length || 0;
                const totalItems = episodesCount + articlesCount;
                // الحصول على العنوان المناسب حسب اللغة
                const title = language === 'ar' 
                  ? (playlistWithImage.title || "")
                  : (playlistWithImage.titleEn || playlistWithImage.title || "");
                
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
                          alt={title}
                          fill
                          className="object-cover bg-gray-100 dark:bg-gray-700 transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {/* تأثير التدرج على الصورة */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      </div>
                    )}
                    <div className="p-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{title}</h2>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <FaList className="h-4 w-4" />
                        <span>{totalItems} {t.items}</span>
                        {episodesCount > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full animate-pulse">
                            {episodesCount} {episodesCount === 1 ? t.episode : t.episodes}
                          </span>
                        )}
                        {articlesCount > 0 && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full animate-pulse">
                            {articlesCount} {articlesCount === 1 ? t.article : t.articles}
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
              {/* قائمة المفضلة الثابتة في وضع القائمة - تظهر فقط إذا تطابقت مع البحث */}
              {shouldShowFavoritesInSearch() && (
                <Link
                  href="/favorites"
                  className="group flex gap-4 items-center border-2 rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all duration-700 transform hover:scale-[1.01] bg-gradient-to-r from-pink-50 via-red-50 to-rose-50 dark:from-pink-900/30 dark:via-red-900/30 dark:to-rose-900/30 border-pink-300 dark:border-pink-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/50 relative"
                >
                  {/* خلفية متحركة */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-red-500/10 to-rose-500/10 dark:from-pink-500/20 dark:via-red-500/20 dark:to-rose-500/20 rounded-xl"></div>
                  
                  {/* أيقونة القلب */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-pink-500/30 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg border-2 border-pink-200 dark:border-pink-700">
                      <FaHeart className="h-6 w-6 text-pink-500 animate-pulse" />
                    </div>
                  </div>
                  
                  {/* المحتوى */}
                  <div className="flex-1 relative">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">
                        {t.myFavorites}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {t.favoriteDescription}
                    </p>
                    
                    {/* الإحصائيات في سطر واحد */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <FaVideo className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{favoritesData.episodes}</span>
                        <span className="text-gray-600 dark:text-gray-400">{t.episodes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaNewspaper className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{favoritesData.articles}</span>
                        <span className="text-gray-600 dark:text-gray-400">{t.articles}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* سهم التوجيه */}
                  <div className="text-gray-400 group-hover:text-pink-500 transition-colors duration-300 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  
                  {/* تأثير التوهج عند التمرير */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl"></div>
                </Link>
              )}
              
              {filteredPlaylists.map((playlist, index) => {
                const playlistWithImage = playlist as PlaylistWithImage;
                const imageUrl = getImageUrl(playlist);
                // حساب عدد الحلقات والمقالات
                const episodesCount = playlistWithImage.episodes?.length || 0;
                const articlesCount = playlistWithImage.articles?.length || 0;
                const totalItems = episodesCount + articlesCount;
                // الحصول على العنوان المناسب حسب اللغة
                const title = language === 'ar' 
                  ? (playlistWithImage.title || "")
                  : (playlistWithImage.titleEn || playlistWithImage.title || "");
                
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
                          alt={title}
                          fill
                          className="object-cover rounded-lg bg-gray-100 dark:bg-gray-700 transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        {/* تأثير التدرج على الصورة */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{title}</h2>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <FaList className="h-4 w-4" />
                        <span>{totalItems} {t.items}</span>
                        {episodesCount > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full animate-pulse">
                            {episodesCount} {episodesCount === 1 ? t.episode : t.episodes}
                          </span>
                        )}
                        {articlesCount > 0 && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full animate-pulse">
                            {articlesCount} {articlesCount === 1 ? t.article : t.articles}
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
      
      {/* أنماط CSS مخصصة للأنيميشن */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default PlaylistsPage;