// SeasonsPageClient.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/ImageWithFallback";
import { fetchFromSanity, urlFor, getLocalizedText } from "@/lib/sanity";
import { useLanguage } from "@/components/LanguageProvider";
import { 
  FaCalendarAlt, 
  FaVideo, 
  FaNewspaper, 
  FaSearch, 
  FaTimes, 
  FaTh, 
  FaList,
  FaStar
} from "react-icons/fa";

// تعريف الواجهات مع دعم اللغة
interface Thumbnail {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
}

interface Season {
  _id: string;
  _type: "season";
  title?: string;
  titleEn?: string;
  name?: string;
  nameEn?: string;
  slug?: {
    current: string;
    _type: "slug";
  };
  thumbnail?: Thumbnail;
  description?: string;
  descriptionEn?: string;
  publishedAt?: string;
  language?: 'ar' | 'en';
}

interface Episode {
  _id: string;
  _type: "episode";
  season?: {
    _ref: string;
    _type: "reference";
  };
  title?: string;
  titleEn?: string;
  language?: 'ar' | 'en';
}

interface Article {
  _id: string;
  _type: "article";
  season?: {
    _ref: string;
    _type: "reference";
  };
  title?: string;
  titleEn?: string;
  language?: 'ar' | 'en';
}

// Define the type for the URL builder object
interface ImageUrlBuilder {
  width(width: number): ImageUrlBuilder;
  url(): string;
}

// كائن الترجمات
const translations = {
  ar: {
    loading: "جاري التحميل...",
    error: "حدث خطأ في تحميل المواسم",
    retry: "إعادة المحاولة",
    seasons: "المواسم التعليمية",
    journey: "رحلة",
    learning: "التعلم",
    description: "استعرض جميع مواسم البرامج التعليمية وتعرف على عدد الحلقات والمقالات في كل موسم",
    search: "ابحث عن موسم...",
    clearSearch: "مسح",
    grid: "شبكي",
    list: "قائمة",
    episodes: "جميع الحلقات",
    articles: "جميع المقالات",
    searchResults: "نتائج البحث",
    results: "نتيجة",
    noResults: "لا توجد نتائج",
    tryDifferent: "لم يتم العثور على أي مواسم تطابق بحثك. حاول استخدام كلمات مفتاحية مختلفة.",
    noSeasons: "لا توجد مواسم حالياً",
    noSeasonsDesc: "لم يتم إضافة أي مواسم بعد. يرجى التحقق لاحقاً.",
    episodesCount: "حلقة",
    articlesCount: "مقال",
    viewDetails: "عرض التفاصيل",
    publishedAt: "تاريخ النشر",
    view: "عرض"
  },
  en: {
    loading: "Loading...",
    error: "Error loading seasons",
    retry: "Retry",
    seasons: "Educational Seasons",
    journey: "Journey",
    learning: "Learning",
    description: "Browse all educational program seasons and discover the number of episodes and articles in each season",
    search: "Search for a season...",
    clearSearch: "Clear",
    grid: "Grid",
    list: "List",
    episodes: "All Episodes",
    articles: "All Articles",
    searchResults: "Search Results",
    results: "result",
    noResults: "No results",
    tryDifferent: "No seasons found matching your search. Try using different keywords.",
    noSeasons: "No seasons available",
    noSeasonsDesc: "No seasons have been added yet. Please check back later.",
    episodesCount: "episode",
    articlesCount: "article",
    viewDetails: "View Details",
    publishedAt: "Published Date",
    view: "View"
  }
};

function buildMediaUrl(thumbnail?: Thumbnail) {
  if (!thumbnail) return "/placeholder.png";
  
  const imageUrl = urlFor(thumbnail);
  
  // Handle if urlFor returns a string directly
  if (typeof imageUrl === 'string') {
    return imageUrl;
  }
  
  // Handle if urlFor returns a builder object
  if (typeof imageUrl === 'object' && imageUrl !== null) {
    try {
      // Cast to our builder type and use width method
      const builder = imageUrl as ImageUrlBuilder;
      return builder.width(500).url() || "/placeholder.png";
    } catch {
      // Fallback to direct url method if width fails
      try {
        return (imageUrl as ImageUrlBuilder).url() || "/placeholder.png";
      } catch {
        return "/placeholder.png";
      }
    }
  }
  
  return "/placeholder.png";
}

/** Normalize string for searching */
function normalizeForSearch(s?: string) {
  if (!s) return "";
  try {
    return s
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  } catch {
    return s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  }
}

export default function SeasonsPageClient() {
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodeCounts, setEpisodeCounts] = useState<Record<string, number>>({});
  const [articleCounts, setArticleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [fadeIn, setFadeIn] = useState(false);
  
  // debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        
        // Fetch seasons from Sanity with language filter
        const seasonsQuery = `*[_type == "season" && language == $language] | order(publishedAt desc) {
          _id,
          title,
          titleEn,
          name,
          nameEn,
          slug,
          thumbnail,
          description,
          descriptionEn,
          publishedAt,
          language
        }`;
        
        const seasonsData: Season[] = await fetchFromSanity(seasonsQuery, { language });
        
        // Fetch episodes from Sanity with language filter
        const episodesQuery = `*[_type == "episode" && language == $language] {
          _id,
          title,
          titleEn,
          season->{_id}
        }`;
        
        const episodesData: Episode[] = await fetchFromSanity(episodesQuery, { language });
        
        // Fetch articles from Sanity with language filter
        const articlesQuery = `*[_type == "article" && language == $language] {
          _id,
          title,
          titleEn,
          season->{_id}
        }`;
        
        const articlesData: Article[] = await fetchFromSanity(articlesQuery, { language });
        
        // Count episodes per season
        const counts: Record<string, number> = {};
        episodesData.forEach((ep: Episode) => {
          // Use _ref instead of _id for the season reference
          const seasonId = ep.season?._ref;
          if (seasonId) {
            counts[seasonId] = (counts[seasonId] || 0) + 1;
          }
        });
        
        // Count articles per season
        const articleCounts: Record<string, number> = {};
        articlesData.forEach((art: Article) => {
          // Use _ref instead of _id for the season reference
          const seasonId = art.season?._ref;
          if (seasonId) {
            articleCounts[seasonId] = (articleCounts[seasonId] || 0) + 1;
          }
        });
        
        setSeasons(seasonsData);
        setEpisodeCounts(counts);
        setArticleCounts(articleCounts);
        setError(null);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
        setSeasons([]);
        setEpisodeCounts({});
        setArticleCounts({});
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [language]);
  
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setFadeIn(true), 40);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  // Filtered array (uses normalized strings)
  const filtered = useMemo(() => {
    const q = normalizeForSearch(debouncedSearch);
    if (!q) return seasons;
    return seasons.filter((s: Season) => {
      const title = normalizeForSearch(getLocalizedText(s.title, s.titleEn, language) ?? getLocalizedText(s.name, s.nameEn, language) ?? "");
      const slug = normalizeForSearch(s.slug?.current ?? "");
      const idStr = normalizeForSearch(s._id ?? "");
      const description = normalizeForSearch(getLocalizedText(s.description, s.descriptionEn, language) ?? "");
      return title.includes(q) || slug.includes(q) || idStr.includes(q) || description.includes(q);
    });
  }, [seasons, debouncedSearch, language]);
  
  const isSearching = debouncedSearch.trim() !== "";
  
  // Format date for display based on language
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">{t.loading}</p>
      </div>
    </div>
  );
  
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t.error}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {t.retry}
          </button>
        </div>
      </div>
    );
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="relative mt-14 mb-12 sm:mb-16 overflow-hidden rounded-3xl">
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 sm:h-24 sm:w-24 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 sm:h-24 sm:w-24 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 sm:h-24 sm:w-24 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="absolute bottom-1/3 right-1/3 text-white/10 transform translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '3s' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 sm:h-24 sm:w-24 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="absolute top-1/2 left-1/2 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '4s' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 sm:h-24 sm:w-24 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="absolute top-2/3 left-1/5 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '5s' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 sm:h-24 sm:w-24 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          </div>
          
          {/* المحتوى الرئيسي */}
          <div className="relative z-10 py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-center">
            {/* القسم الأيسر - النص */}
            <div className="w-full text-center mb-8 md:mb-0">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
                <span className="text-white font-medium flex items-center text-sm sm:text-base">
                  <FaStar className="text-yellow-300 mr-2 animate-pulse" />
                  {t.seasons}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                {t.journey} <span className="text-yellow-300">{t.learning}</span> {language === 'ar' ? 'تبدأ من هنا' : 'starts here'}
              </h1>
              <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
                {t.description}
              </p>
              
              {/* أيقونات المواد الدراسية في الأسفل */}
              <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 flex-wrap">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1.5s' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2s' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2.5s' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* القسم الأيمن - الصورة أو الرسوم التوضيحية */}
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex justify-center">
              <div className="relative">
                {/* دائرة خلفية */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full filter blur-3xl w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 animate-pulse-slow"></div>
                
                {/* الأيقونات المتحركة */}
                <div className="relative grid grid-cols-3 gap-3 sm:gap-4 w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64">
                  <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
                    <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                    <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                    <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
                    <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                    <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.6s' }}>
                    <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
        
        {/* Controls Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.search}
                  className="w-full py-3 sm:py-4 pr-12 sm:pr-14 pl-4 sm:pl-6 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-300"
                  aria-label={t.search}
                />
                <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 flex items-center">
                  {searchTerm ? (
                    <button 
                      onClick={() => { setSearchTerm(""); setDebouncedSearch(""); }} 
                      className="p-1.5 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200"
                      aria-label={t.clearSearch}
                    >
                      <FaTimes className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  ) : (
                    <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <FaSearch className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Link href="/episodes" className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-sm">
                <FaVideo className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{t.episodes}</span>
                <span className="sm:hidden">{language === 'ar' ? 'حلقات' : 'Episodes'}</span>
              </Link>
              <Link href="/articles" className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-sm">
                <FaNewspaper className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{t.articles}</span>
                <span className="sm:hidden">{language === 'ar' ? 'مقالات' : 'Articles'}</span>
              </Link>
              
              <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1 shadow-inner">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 ${viewMode === "grid" ? "bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                  aria-pressed={viewMode === "grid"}
                  title={t.grid}
                >
                  <FaTh className={`h-4 w-4 sm:h-5 sm:w-5 ${viewMode === "grid" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`} />
                  <span className="hidden sm:inline">{t.grid}</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 ${viewMode === "list" ? "bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                  aria-pressed={viewMode === "list"}
                  title={t.list}
                >
                  <FaList className={`h-4 w-4 sm:h-5 sm:w-5 ${viewMode === "list" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`} />
                  <span className="hidden sm:inline">{t.list}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Results Section */}
        {isSearching ? (
          <div className="mb-10 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t.searchResults}</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span>«{debouncedSearch}»</span>
                  <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full">
                    {filtered.length} {t.results}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => { setSearchTerm(""); setDebouncedSearch(""); }}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-medium text-sm"
                >
                  {t.clearSearch}
                </button>
                <button
                  onClick={() => { setSearchTerm(""); setDebouncedSearch(""); }}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all duration-300 font-medium shadow-md hover:shadow-lg text-sm"
                >
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                </button>
              </div>
            </div>
            
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-4 sm:mb-6">
                  <FaSearch className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.noResults}</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{t.tryDifferent}</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filtered.map((season: Season) => {
                  const slug = season.slug?.current ?? season._id;
                  const title = getLocalizedText(season.title, season.titleEn, language) ?? getLocalizedText(season.name, season.nameEn, language) ?? (language === 'ar' ? "موسم" : "Season");
                  const thumbnailUrl = buildMediaUrl(season.thumbnail);
                  const episodeCount = episodeCounts[season._id] || 0;
                  const articleCount = articleCounts[season._id] || 0;
                  const publishDate = formatDate(season.publishedAt);
                  
                  return (
                    <Link 
                      key={season._id} 
                      href={`/seasons/${encodeURIComponent(String(slug))}`}
                      className="group block"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl dark:hover:shadow-blue-500/20 transition-all duration-500 border border-gray-200 dark:border-gray-700 h-full flex flex-col transform hover:-translate-y-1">
                        <div className="relative overflow-hidden h-44 sm:h-56">
                          <ImageWithFallback 
                            src={thumbnailUrl} 
                            alt={title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="flex gap-1.5">
                              <div className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {episodeCount} {t.episodesCount}
                              </div>
                              <div className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {articleCount} {t.articlesCount}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 sm:p-6 flex-1 flex flex-col">
                          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {title}
                          </h2>
                          {season.description && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 sm:mb-4 line-clamp-2">
                              {getLocalizedText(season.description, season.descriptionEn, language)}
                            </p>
                          )}
                          <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FaCalendarAlt className="h-3 w-3 sm:h-4 sm:w-4" />
                              {publishDate}
                            </div>
                            <div className="text-blue-600 dark:text-blue-400 font-medium text-xs sm:text-sm flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                              {t.viewDetails}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((season: Season) => {
                  const slug = season.slug?.current ?? season._id;
                  const title = getLocalizedText(season.title, season.titleEn, language) ?? getLocalizedText(season.name, season.nameEn, language) ?? (language === 'ar' ? "موسم" : "Season");
                  const thumbnailUrl = buildMediaUrl(season.thumbnail);
                  const episodeCount = episodeCounts[season._id] || 0;
                  const articleCount = articleCounts[season._id] || 0;
                  const publishDate = formatDate(season.publishedAt);
                  
                  return (
                    <Link 
                      key={season._id} 
                      href={`/seasons/${encodeURIComponent(String(slug))}`}
                      className="group block"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-blue-500/20 transition-all duration-500 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center p-3 sm:p-4">
                          {/* Thumbnail - smaller on mobile */}
                          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden">
                            <ImageWithFallback 
                              src={thumbnailUrl} 
                              alt={title} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 mr-3 sm:mr-4 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 truncate">
                                {title}
                              </h3>
                              <div className="flex gap-1.5 flex-shrink-0 ml-2">
                                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">
                                  {episodeCount}
                                </div>
                                <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full">
                                  {articleCount}
                                </div>
                              </div>
                            </div>
                            
                            {season.description && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 line-clamp-1">
                                {getLocalizedText(season.description, season.descriptionEn, language)}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <FaCalendarAlt className="h-3 w-3" />
                                {publishDate}
                              </div>
                              <div className="text-blue-600 dark:text-blue-400 font-medium text-xs flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                                {t.view}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
        
        {/* Main Seasons List */}
        {!isSearching && (
          <div className={`${fadeIn ? "opacity-100" : "opacity-0"} transition-opacity duration-700`}>
            {seasons.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-4 sm:mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.noSeasons}</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{t.noSeasonsDesc}</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {seasons.map((season: Season) => {
                  const slug = season.slug?.current ?? season._id;
                  const title = getLocalizedText(season.title, season.titleEn, language) ?? getLocalizedText(season.name, season.nameEn, language) ?? (language === 'ar' ? "موسم" : "Season");
                  const thumbnailUrl = buildMediaUrl(season.thumbnail);
                  const episodeCount = episodeCounts[season._id] || 0;
                  const articleCount = articleCounts[season._id] || 0;
                  const publishDate = formatDate(season.publishedAt);
                  
                  return (
                    <Link 
                      key={season._id} 
                      href={`/seasons/${encodeURIComponent(String(slug))}`}
                      className="group block"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl dark:hover:shadow-blue-500/20 transition-all duration-500 border border-gray-200 dark:border-gray-700 h-full flex flex-col transform hover:-translate-y-1">
                        <div className="relative overflow-hidden h-44 sm:h-56">
                          <ImageWithFallback 
                            src={thumbnailUrl} 
                            alt={title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="flex gap-1.5">
                              <div className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {episodeCount} {t.episodesCount}
                              </div>
                              <div className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {articleCount} {t.articlesCount}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 sm:p-6 flex-1 flex flex-col">
                          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {title}
                          </h2>
                          {season.description && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 sm:mb-4 line-clamp-2">
                              {getLocalizedText(season.description, season.descriptionEn, language)}
                            </p>
                          )}
                          <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FaCalendarAlt className="h-3 w-3 sm:h-4 sm:w-4" />
                              {publishDate}
                            </div>
                            <div className="text-blue-600 dark:text-blue-400 font-medium text-xs sm:text-sm flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                              {t.viewDetails}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {seasons.map((season: Season) => {
                  const slug = season.slug?.current ?? season._id;
                  const title = getLocalizedText(season.title, season.titleEn, language) ?? getLocalizedText(season.name, season.nameEn, language) ?? (language === 'ar' ? "موسم" : "Season");
                  const thumbnailUrl = buildMediaUrl(season.thumbnail);
                  const episodeCount = episodeCounts[season._id] || 0;
                  const articleCount = articleCounts[season._id] || 0;
                  const publishDate = formatDate(season.publishedAt);
                  
                  return (
                    <Link 
                      key={season._id} 
                      href={`/seasons/${encodeURIComponent(String(slug))}`}
                      className="group block"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-blue-500/20 transition-all duration-500 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center p-3 sm:p-4">
                          {/* Thumbnail - smaller on mobile */}
                          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden">
                            <ImageWithFallback 
                              src={thumbnailUrl} 
                              alt={title} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 mr-3 sm:mr-4 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 truncate">
                                {title}
                              </h3>
                              <div className="flex gap-1.5 flex-shrink-0 ml-2">
                                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">
                                  {episodeCount}
                                </div>
                                <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full">
                                  {articleCount}
                                </div>
                              </div>
                            </div>
                            
                            {season.description && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 line-clamp-1">
                                {getLocalizedText(season.description, season.descriptionEn, language)}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <FaCalendarAlt className="h-3 w-3" />
                                {publishDate}
                              </div>
                              <div className="text-blue-600 dark:text-blue-400 font-medium text-xs flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                                {t.view}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        .hero-pattern {
          background-color: rgba(255, 255, 255, 0.8);
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .dark .hero-pattern {
          background-color: rgba(17, 24, 39, 0.8);
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .float-animation {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer {
          animation: shimmer 2s infinite;
        }
        /* Ensure proper responsive behavior */
        * {
          box-sizing: border-box;
        }
        html, body {
          overflow-x: hidden;
          width: 100%;
          max-width: 100vw;
        }
      `}</style>
    </div>
  );
}