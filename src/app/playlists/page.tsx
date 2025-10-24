"use client";
import React, { useState, useEffect, useMemo } from "react";
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
  FaHeart,
  FaFilter
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
    totalPlaylists: "إجمالي قوائم التشغيل",
    filterByType: "تصفية حسب النوع",
    allTypes: "جميع الأنواع",
    withEpisodes: "تحتوي على حلقات",
    withArticles: "تحتوي على مقالات",
    withBoth: "تحتوي على الاثنين"
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
    totalPlaylists: "Total Playlists",
    filterByType: "Filter by type",
    allTypes: "All Types",
    withEpisodes: "With Episodes",
    withArticles: "With Articles",
    withBoth: "With Both"
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
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
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

  const filteredPlaylists = useMemo(() => {
    let result = playlists.filter(
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
    
    // تطبيق فلتر النوع إذا تم تحديده
    if (filterType) {
      result = result.filter((playlist) => {
        const playlistWithImage = playlist as PlaylistWithImage;
        const episodesCount = playlistWithImage.episodes?.length || 0;
        const articlesCount = playlistWithImage.articles?.length || 0;
        
        if (filterType === 'episodes') return episodesCount > 0 && articlesCount === 0;
        if (filterType === 'articles') return articlesCount > 0 && episodesCount === 0;
        if (filterType === 'both') return episodesCount > 0 && articlesCount > 0;
        
        return true; // 'all'
      });
    }
    
    return result;
  }, [playlists, searchTerm, language, filterType]);

  // حساب العدد الإجمالي لقوائم التشغيل (بما في ذلك المفضلة)
  const totalPlaylistsCount = shouldShowFavoritesInSearch() ? filteredPlaylists.length + 1 : filteredPlaylists.length;
  const originalTotalCount = playlists.length + 1; // +1 للمفضلة

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="text-center">
          <div className="inline-block animate-bounce bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mb-4">
            <FaList className="text-white text-3xl" />
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
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
      <div className={`relative mb-8 sm:mb-12 overflow-hidden rounded-3xl transition-all duration-1000 ${heroAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* الخلفية المتدرجة */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950"></div>
        
        {/* العناصر الزخرفية */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {/* دوائر زخرفية */}
          <div className="absolute -top-40 -right-40 w-64 h-64 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
          
          {/* شبكة زخرفية */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
          
          {/* أيقونات المواد الدراسية في الخلفية */}
          <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
            <FaList className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
          <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
            <FaPlay className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
            <FaGraduationCap className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
        </div>
        
        {/* المحتوى الرئيسي */}
        <div className="relative z-10 pt-12 sm:pt-16 pb-10 sm:pb-12 md:pb-16 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-center">
          <div className="w-full text-center mb-8 md:mb-0">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
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
          
          {/* أيقونات المواد الدراسية في الأسفل */}
          <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 flex-wrap">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
              <FaList className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
              <FaPlay className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
              <FaGraduationCap className="text-yellow-300 text-lg sm:text-xl" />
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
                  {language === 'ar' ? 'أحدث العناصر' : 'Recent Items'}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Hero Section */}
        <HeroSection />
        
        {/* رأس الصفحة */}
        <div className="flex flex-col gap-4 mb-6">
          {/* شريط البحث والفلاتر */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-sm px-3 py-2 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-200">
              <FaSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                aria-label={t.searchPlaceholder}
                className="bg-transparent outline-none flex-grow text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 py-1"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="flex items-center justify-center rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  aria-label={t.clearSearch}
                  title={t.clearSearch}
                >
                  <FaTimes className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                </button>
              ) : null}
            </div>
            
            {/* أزرار التحكم */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                {/* أزرار تغيير العرض */}
                <div className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center justify-center p-2 transition ${
                      viewMode === "grid"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    aria-pressed={viewMode === "grid"}
                    title={t.gridView}
                  >
                    <FaTh className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center justify-center p-2 transition ${
                      viewMode === "list"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    aria-pressed={viewMode === "list"}
                    title={t.listView}
                  >
                    <FaList className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                  </button>
                </div>
                
                {/* زر الفلاتر */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-md text-sm transition flex items-center justify-center shadow-md ${
                    showFilters 
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white" 
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <FaFilter className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{t.filterByType}</span>
                </button>
              </div>
            </div>
            
            {/* فلتر الأنواع */}
            {showFilters && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterType(null)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filterType === null
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {t.allTypes}
                  </button>
                  <button
                    onClick={() => setFilterType('episodes')}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filterType === 'episodes'
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {t.withEpisodes}
                  </button>
                  <button
                    onClick={() => setFilterType('articles')}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filterType === 'articles'
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {t.withArticles}
                  </button>
                  <button
                    onClick={() => setFilterType('both')}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filterType === 'both'
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {t.withBoth}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* عدد النتائج */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <FaList className="ml-2" />
              {totalPlaylistsCount} {language === 'ar' ? 'قائمة تشغيل' : 'playlists'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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