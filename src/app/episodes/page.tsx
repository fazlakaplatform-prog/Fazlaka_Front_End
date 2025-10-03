// app/episodes/page.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ImageWithFallback from "@/components/ImageWithFallback";
import { fetchEpisodes, fetchSeasons, urlFor, getLocalizedText } from "@/lib/sanity";
import FavoriteButton from "@/components/FavoriteButton";
import { useLanguage } from "@/components/LanguageProvider";
import { 
  FaVideo, 
  FaCalendarAlt, FaHeart,
  FaStar, 
  FaPlay, 
  FaGraduationCap, 
  FaSearch, FaTimes, FaTh, FaList,
  FaChevronDown, FaChevronUp, FaRegBookmark
} from "react-icons/fa";

// تعريف واجهات البيانات مع دعم اللغة
interface Episode {
  _id: string;
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  slug?: {
    current: string;
  };
  thumbnail?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  season?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: {
      current: string;
    };
  };
  publishedAt?: string;
  language?: 'ar' | 'en';
}

interface Season {
  _id: string;
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  slug?: {
    current: string;
  };
  thumbnail?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  language?: 'ar' | 'en';
}

// تعريف واجهة لصورة Sanity
interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
}

// كائن الترجمات
const translations = {
  ar: {
    loading: "جارٍ التحميل...",
    error: "حدث خطأ في تحميل البيانات",
    retry: "إعادة المحاولة",
    episodes: "مكتبة الحلقات التعليمية",
    discover: "اكتشف",
    knowledge: "المعرفة",
    description: "مجموعة شاملة من الحلقات التعليمية عالية الجودة في مختلف المجالات، مصممة لتطوير معرفتك ومهاراتك.",
    search: "ابحث عن عنوان أو وصف...",
    clearSearch: "مسح",
    grid: "عرض شبكي",
    list: "عرض قائمة",
    favorites: "مفضلاتي",
    articles: "المقالات",
    seasons: "المواسم",
    results: "حلقة",
    searchResults: "نتائج البحث",
    noResults: "لا توجد نتائج مطابقة",
    tryDifferent: "جرب كلمات مفتاحية أخرى",
    open: "فتح",
    close: "طي",
    season: "موسم",
    publishedAt: "تاريخ النشر",
    noEpisodes: "لم نتمكن من العثور على حلقات تطابق بحثك.",
    clearFilters: "جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية.",
    allEpisodes: "جميع الحلقات",
    episodesWithoutSeason: "حلقات بدون موسم"
  },
  en: {
    loading: "Loading...",
    error: "An error occurred while loading data",
    retry: "Retry",
    episodes: "Educational Episodes Library",
    discover: "Discover",
    knowledge: "Knowledge",
    description: "A comprehensive collection of high-quality educational episodes in various fields, designed to develop your knowledge and skills.",
    search: "Search for title or description...",
    clearSearch: "Clear",
    grid: "Grid View",
    list: "List View",
    favorites: "My Favorites",
    articles: "Articles",
    seasons: "Seasons",
    results: "episode",
    searchResults: "Search Results",
    noResults: "No matching results",
    tryDifferent: "Try different keywords",
    open: "Open",
    close: "Close",
    season: "Season",
    publishedAt: "Published Date",
    noEpisodes: "We couldn't find any episodes matching your search.",
    clearFilters: "Try different keywords or clear filters.",
    allEpisodes: "All Episodes",
    episodesWithoutSeason: "Episodes without season"
  }
};

function buildMediaUrl(image?: SanityImage) {
  if (!image) return "/placeholder.png";
  return urlFor(image) || "/placeholder.png";
}

function escapeRegExp(str = "") {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlighted(text: string, q: string) {
  if (!q) return <>{text}</>;
  try {
    const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
    const parts = text.split(re);
    return (
      <>
        {parts.map((part, i) =>
          re.test(part) ? (
            <mark key={i} className="bg-yellow-100 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-200 rounded px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}

// Animation variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// Small inline icons
function IconEpisodes({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M16 3v4" />
    </svg>
  );
}

function IconPlay({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 3v18l15-9L5 3z" />
    </svg>
  );
}

function IconChevron({ className = "h-5 w-5", open = false }: { className?: string; open?: boolean }) {
  return open ? (
    <FaChevronUp className={className} />
  ) : (
    <FaChevronDown className={className} />
  );
}

export default function EpisodesPageClient() {
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<string, Episode[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSeasons, setOpenSeasons] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        // جلب الحلقات والمواسم حسب اللغة
        const [episodesData, seasonsData] = await Promise.all([
          fetchEpisodes(language),
          fetchSeasons(language)
        ]);
        
        // تنظيم الحلقات حسب الموسم
        const grouped: Record<string, Episode[]> = {};
        
        // إضافة قسم "جميع الحلقات"
        grouped[t.allEpisodes] = episodesData;
        
        // تنظيم الحلقات حسب الموسم
        seasonsData.forEach((season: Season) => {
          const seasonTitle = getLocalizedText(season.title, season.titleEn, language);
          if (!grouped[seasonTitle]) grouped[seasonTitle] = [];
          const seasonEpisodes = episodesData.filter(episode => 
            episode.season?._id === season._id
          );
          grouped[seasonTitle] = seasonEpisodes;
        });
        
        // إضافة قسم "حلقات بدون موسم"
        const episodesWithoutSeason = episodesData.filter(episode => !episode.season);
        if (episodesWithoutSeason.length > 0) {
          grouped[t.episodesWithoutSeason] = episodesWithoutSeason;
        }
        
        setEpisodesBySeason(grouped);
        // فتح أول موسم بشكل افتراضي
        const first = Object.keys(grouped)[0];
        if (first) setOpenSeasons({ [first]: true });
      } catch (err: unknown) {
        console.error(err);
        setError(t.error);
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, [language, t.error, t.allEpisodes, t.episodesWithoutSeason]);

  function toggleSeason(title: string) {
    setOpenSeasons((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  const filteredBySeason = useMemo(() => {
    if (!searchTerm.trim()) return episodesBySeason;
    const q = searchTerm.trim().toLowerCase();
    const out: Record<string, Episode[]> = {};
    Object.entries(episodesBySeason).forEach(([season, episodes]) => {
      const matches = episodes.filter((episode: Episode) => {
        const title = getLocalizedText(episode.title, episode.titleEn, language).toLowerCase();
        const description = getLocalizedText(episode.description, episode.descriptionEn, language).toLowerCase();
        return title.includes(q) || description.includes(q);
      });
      if (matches.length > 0) out[season] = matches;
    });
    return out;
  }, [episodesBySeason, searchTerm, language]);

  const totalResults = useMemo(
    () => Object.values(filteredBySeason).reduce((s, arr) => s + arr.length, 0),
    [filteredBySeason]
  );

  const seasonEntries = Object.entries(filteredBySeason);
  const searchResults = Object.values(filteredBySeason).flat();

  // Function to format date based on language
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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="text-center">
        <div className="inline-block animate-bounce bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mb-4">
          <FaRegBookmark className="text-white text-3xl" />
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{t.loading}</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md">
        <div className="inline-block bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4">
          <FaTimes className="text-red-500 dark:text-red-400 text-2xl" />
        </div>
        <p className="text-lg font-medium text-red-500 dark:text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          {t.retry}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Hero Section */}
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
            
            {/* أيقونات المواد الدراسية في الخلفية */}
            <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
              <FaVideo className="text-7xl sm:text-9xl drop-shadow-lg" />
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
                  {t.episodes}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                {t.discover} <span className="text-yellow-300">{t.knowledge}</span> {language === 'ar' ? 'في حلقاتنا' : 'in our episodes'}
              </h1>
              <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
                {t.description}
              </p>
              
              {/* أيقونات المواد الدراسية في الأسفل */}
              <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 flex-wrap">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
                  <FaVideo className="text-yellow-300 text-lg sm:text-xl" />
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
                  <FaPlay className="text-yellow-300 text-lg sm:text-xl" />
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
                  <FaGraduationCap className="text-yellow-300 text-lg sm:text-xl" />
                </div>
              </div>
            </div>
          </div>
          
          {/* تأثيرات حركية */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
        </div>
        
        {/* رأس الصفحة */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-sm px-3 py-2 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-200 flex-grow">
              <FaSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                aria-label={t.search}
                className="bg-transparent outline-none flex-grow text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 py-1"
                placeholder={t.search}
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
                  title={t.grid}
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
                  title={t.list}
                >
                  <FaList className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                </button>
              </div>
              
              {/* رابط المفضلة والمقالات والمواسم */}
              <Link href="/favorites" className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-md text-sm hover:opacity-90 transition-opacity flex items-center justify-center shadow-md">
                <FaHeart className="h-4 w-4 ml-1" />
                <span className="text-xs sm:text-sm">{t.favorites}</span>
              </Link>
              <Link href="/articles" className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md text-sm hover:opacity-90 transition-opacity flex items-center justify-center shadow-md">
                <FaCalendarAlt className="h-4 w-4 ml-1" />
                <span className="text-xs sm:text-sm">{t.articles}</span>
              </Link>
              <Link href="/seasons" className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md text-sm hover:opacity-90 transition-opacity flex items-center justify-center shadow-md">
                <FaCalendarAlt className="h-4 w-4 ml-1" />
                <span className="text-xs sm:text-sm">{t.seasons}</span>
              </Link>
            </div>
          </div>
          
          {/* عدد النتائج */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <FaVideo className="ml-2" />
              {totalResults} {t.results}
            </div>
            {searchTerm && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t.searchResults}: &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>
        
        {/* نتائج البحث */}
        {searchTerm.trim() ? (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-800 dark:to-purple-900 rounded-xl p-4 mb-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-sm text-blue-100 dark:text-blue-200">{t.searchResults}</div>
                  <div className="text-lg font-semibold text-white">
                    «{searchTerm}» <span className="text-sm text-blue-200 dark:text-blue-300">({totalResults})</span>
                  </div>
                </div>
                <button onClick={() => setSearchTerm("")} className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-md text-sm hover:bg-white/30 text-white transition-colors self-start sm:self-auto">
                  {t.clearSearch}
                </button>
              </div>
            </div>
            
            {searchResults.length === 0 ? (
              <div className="p-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center shadow-lg">
                <div className="inline-block bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                  <FaSearch className="text-gray-400 dark:text-gray-500 text-2xl" />
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">{t.noResults}.</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">{t.tryDifferent}</div>
              </div>
            ) : (
              <div>
                {viewMode === "grid" ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  >
                    {searchResults.map((episode: Episode) => {
                      const slug = episode.slug?.current || episode._id;
                      const title = getLocalizedText(episode.title, episode.titleEn, language);
                      const description = getLocalizedText(episode.description, episode.descriptionEn, language);
                      let thumbnailUrl = "/placeholder.png";
                      if (episode.thumbnail) {
                        thumbnailUrl = buildMediaUrl(episode.thumbnail);
                      }
                      
                      return (
                        <motion.article
                          key={episode._id}
                          variants={cardVariants}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          layout
                          className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 shadow-md"
                        >
                          <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block group">
                            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                              <motion.div
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1, scale: 1.02 }}
                                transition={{ duration: 0.18 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                              >
                                <div className="bg-black/30 dark:bg-white/10 rounded-full p-2">
                                  <IconPlay className="h-6 w-6 text-white dark:text-gray-200" />
                                </div>
                              </motion.div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2 mb-2">{renderHighlighted(title, searchTerm)}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{description}</p>
                              
                              {/* عرض الموسم المرتبط */}
                              {episode.season && (
                                <div className="mb-2">
                                  <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-200 rounded-full">
                                    {t.season}: {getLocalizedText(episode.season.title, episode.season.titleEn, language)}
                                  </span>
                                </div>
                              )}
                              
                              {/* عرض تاريخ النشر */}
                              {episode.publishedAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <FaCalendarAlt className="h-3 w-3" />
                                  {formatDate(episode.publishedAt)}
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="mt-auto p-3 pt-1 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <IconEpisodes className="h-4 w-4" />
                            </div>
                            <FavoriteButton contentId={episode._id} contentType="episode" />
                          </div>
                        </motion.article>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                    {searchResults.map((episode: Episode) => {
                      const slug = episode.slug?.current || episode._id;
                      const title = getLocalizedText(episode.title, episode.titleEn, language);
                      const description = getLocalizedText(episode.description, episode.descriptionEn, language);
                      let thumbnailUrl = "/placeholder.png";
                      if (episode.thumbnail) {
                        thumbnailUrl = buildMediaUrl(episode.thumbnail);
                      }
                      
                      return (
                        <motion.div
                          key={episode._id}
                          variants={cardVariants}
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          layout
                          className="flex gap-4 items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-4 hover:shadow-lg transition bg-white dark:bg-gray-800 shadow-md"
                        >
                          <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="flex items-center gap-4 flex-1 group">
                            <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
                              <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" fill sizes="240px" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">{renderHighlighted(title, searchTerm)}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{description}</p>
                              
                              {/* عرض الموسم المرتبط */}
                              {episode.season && (
                                <div className="flex flex-wrap gap-2 mb-1">
                                  <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-200 rounded-full">
                                    {t.season}: {getLocalizedText(episode.season.title, episode.season.titleEn, language)}
                                  </span>
                                </div>
                              )}
                              
                              {/* عرض تاريخ النشر */}
                              {episode.publishedAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <FaCalendarAlt className="h-3 w-3" />
                                  {formatDate(episode.publishedAt)}
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex-shrink-0">
                            <FavoriteButton contentId={episode._id} contentType="episode" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        ) : null}
        
        {/* قائمة المواسم */}
        <div className="space-y-6">
          {seasonEntries.length === 0 ? (
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg">
              <div className="inline-block bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                <FaVideo className="text-gray-400 dark:text-gray-500 text-2xl" />
              </div>
              <div className="text-gray-600 dark:text-gray-300 mb-2">{t.noEpisodes}</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">{t.clearFilters}</div>
            </div>
          ) : (
            seasonEntries.map(([seasonTitle, episodes]) => {
              const isOpen = !!openSeasons[seasonTitle];
              return (
                <div key={seasonTitle} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700/50">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{seasonTitle}</h2>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <IconEpisodes className="h-3 w-3" />
                        <span>{episodes.length} {t.results}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        aria-expanded={isOpen}
                        onClick={() => toggleSeason(seasonTitle)}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 text-white transition-all duration-300 hover:opacity-90 text-sm shadow-md"
                      >
                        <motion.span layout className="flex items-center gap-2">
                          <motion.span aria-hidden>
                            <motion.div
                              initial={{ rotate: isOpen ? 180 : 0 }}
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ type: "spring", stiffness: 420, damping: 32 }}
                              className="flex items-center"
                            >
                              <IconChevron className="h-4 w-4" open={isOpen} />
                            </motion.div>
                          </motion.span>
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
                            {isOpen ? t.close : t.open}
                          </motion.span>
                        </motion.span>
                      </motion.button>
                    </div>
                  </div>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={seasonTitle}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                        className="px-4"
                      >
                        <motion.div layout className={`py-4 ${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-4"}`}>
                          {episodes.map((episode: Episode) => {
                            const slug = episode.slug?.current || episode._id;
                            const title = getLocalizedText(episode.title, episode.titleEn, language);
                            const description = getLocalizedText(episode.description, episode.descriptionEn, language);
                            let thumbnailUrl = "/placeholder.png";
                            if (episode.thumbnail) {
                              thumbnailUrl = buildMediaUrl(episode.thumbnail);
                            }
                            
                            return viewMode === "grid" ? (
                              <motion.article
                                key={episode._id}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                layout
                                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 shadow-md"
                              >
                                <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block group">
                                  <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                    <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      whileHover={{ opacity: 1, scale: 1.02 }}
                                      transition={{ duration: 0.18 }}
                                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                      <div className="bg-black/30 dark:bg-white/10 rounded-full p-2">
                                        <IconPlay className="h-6 w-6 text-white dark:text-gray-200" />
                                      </div>
                                    </motion.div>
                                  </div>
                                  <div className="p-4">
                                    <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2 mb-2">{renderHighlighted(title, searchTerm)}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{description}</p>
                                    
                                    {/* عرض تاريخ النشر */}
                                    {episode.publishedAt && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <FaCalendarAlt className="h-3 w-3" />
                                        {formatDate(episode.publishedAt)}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                                <div className="mt-auto p-3 pt-1 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                    <IconEpisodes className="h-4 w-4" />
                                  </div>
                                  <FavoriteButton contentId={episode._id} contentType="episode" />
                                </div>
                              </motion.article>
                            ) : (
                              <motion.div
                                key={episode._id}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ scale: 1.01 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                layout
                                className="flex gap-4 items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-4 hover:shadow-lg transition bg-white dark:bg-gray-800 shadow-md"
                              >
                                <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="flex items-center gap-4 flex-1 group">
                                  <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
                                    <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" fill sizes="240px" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">{renderHighlighted(title, searchTerm)}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{description}</p>
                                    
                                    {/* عرض تاريخ النشر */}
                                    {episode.publishedAt && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <FaCalendarAlt className="h-3 w-3" />
                                        {formatDate(episode.publishedAt)}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                                <div className="flex-shrink-0">
                                  <FavoriteButton contentId={episode._id} contentType="episode" />
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}