// SeasonPageClient.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { use } from "react";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
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
  FaList
} from "react-icons/fa";

// Define proper types for Sanity image assets
type SanityImageAsset = {
  _ref: string;
  _type: "reference";
};

type SanityImage = {
  _type: "image";
  asset: SanityImageAsset;
};

// كائن الترجمات
const translations = {
  ar: {
    loading: "جاري التحميل...",
    error: "حدث خطأ في تحميل الموسم",
    retry: "إعادة المحاولة",
    seasonNotFound: "الموسم غير موجود",
    season: "موسم",
    episodes: "حلقات",
    articles: "مقالات",
    allEpisodes: "جميع الحلقات",
    allArticles: "جميع المقالات",
    searchEpisode: "ابحث عن حلقة...",
    searchArticle: "ابحث عن مقال...",
    noEpisodes: "لا توجد حلقات مطابقة للبحث",
    noArticles: "لا توجد مقالات مطابقة للبحث",
    tryDifferent: "جرب تغيير كلمات البحث أو استخدم عبارات مختلفة للعثور على ما تبحث عنه.",
    episode: "حلقة",
    article: "مقال",
    publishedAt: "تاريخ النشر",
    gridView: "عرض شبكي",
    listView: "عرض قائمة"
  },
  en: {
    loading: "Loading...",
    error: "Error loading season",
    retry: "Retry",
    seasonNotFound: "Season not found",
    season: "Season",
    episodes: "Episodes",
    articles: "Articles",
    allEpisodes: "All Episodes",
    allArticles: "All Articles",
    searchEpisode: "Search for an episode...",
    searchArticle: "Search for an article...",
    noEpisodes: "No episodes matching the search",
    noArticles: "No articles matching the search",
    tryDifferent: "Try changing the search terms or use different phrases to find what you're looking for.",
    episode: "Episode",
    article: "Article",
    publishedAt: "Published Date",
    gridView: "Grid View",
    listView: "List View"
  }
};

function buildMediaUrl(thumbnail?: SanityImage | null) {
  if (!thumbnail) return "/placeholder.png";
  
  try {
    // Check if urlFor returns a string directly
    const result = urlFor(thumbnail);
    
    // If it's a string, return it directly
    if (typeof result === 'string') {
      return result;
    }
    
    // Otherwise, try to use it as an object with methods
    // Convert to unknown first to satisfy TypeScript
    const builder = result as unknown;
    
    // Check if it has the methods we need
    if (builder && 
        typeof builder === 'object' && 
        'width' in builder && 
        'url' in builder &&
        typeof (builder as { width: (w: number) => unknown }).width === 'function' &&
        typeof (builder as { url: () => string }).url === 'function') {
      // Now we can safely use the methods
      return (builder as { width: (w: number) => { url: () => string } }).width(500).url() || "/placeholder.png";
    }
    
    // If it doesn't match our expected shape, return fallback
    return "/placeholder.png";
  } catch {
    // Fallback if anything fails
    return "/placeholder.png";
  }
}

function normalizeForSearch(value?: unknown) {
  if (value === undefined || value === null) return "";
  let s = typeof value === "object" ? Object.values(flattenObj(value)).join(" ") : String(value);
  // Arabic-specific normalizations
  s = s.replace(/ـ/g, ""); // remove kashida
  s = s.replace(/[أإآ]/g, "ا");
  s = s.replace(/ى/g, "ي");
  s = s.replace(/ؤ/g, "و");
  s = s.replace(/ئ/g, "ي");
  s = s.replace(/ة/g, "ه");
  // Arabic-Indic digits -> Latin digits
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  s = s.replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d)));
  // remove combining marks, non letters/numbers, collapse spaces, lowercase
  s = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return s;
}

function flattenObj(obj: unknown): Record<string, unknown> {
  if (obj === null || obj === undefined) return { "": "" };
  if (Array.isArray(obj)) return obj.reduce((acc, v, i) => ({ ...acc, [i]: v }), {});
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj as object)) {
      const v = (obj as Record<string, unknown>)[k];
      if (typeof v === "string" || typeof v === "number") out[k] = v;
      else if (typeof v === "object" && v !== null) {
        out[k] = JSON.stringify(v);
      } else out[k] = String(v);
    }
    return out;
  }
  return { "": String(obj) };
}

interface SeasonProps {
  params: Promise<{ slug: string }>;
}

interface SeasonData {
  _id: string;
  _type: "season";
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  slug?: {
    current: string;
    _type: "slug";
  };
  thumbnail?: SanityImage;
  language?: 'ar' | 'en';
}

interface EpisodeData {
  _id: string;
  _type: "episode";
  title?: string;
  titleEn?: string;
  name?: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  summary?: string;
  summaryEn?: string;
  slug?: {
    current: string;
    _type: "slug";
  };
  thumbnail?: SanityImage;
  publishedAt?: string;
  language?: 'ar' | 'en';
}

interface ArticleData {
  _id: string;
  _type: "article";
  title?: string;
  titleEn?: string;
  excerpt?: string;
  excerptEn?: string;
  slug?: {
    current: string;
    _type: "slug";
  };
  featuredImage?: SanityImage;
  publishedAt?: string;
  language?: 'ar' | 'en';
}

export default function SeasonPageClient({ params }: SeasonProps) {
  const { slug } = use(params);
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  
  const [season, setSeason] = useState<SeasonData | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // UI state
  const [contentType, setContentType] = useState<"episodes" | "articles">("episodes");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  useEffect(() => {
    async function loadSeason() {
      try {
        setLoading(true);
        
        // Fetch season from Sanity with language filter
        const seasonQuery = `*[_type == "season" && slug.current == $slug && language == $language][0] {
          _id,
          title,
          titleEn,
          description,
          descriptionEn,
          slug,
          thumbnail,
          language
        }`;
        
        const seasonData = await fetchFromSanity(seasonQuery, { slug, language });
        
        if (!seasonData) throw new Error("Season not found");
        
        // Type assertion to ensure the data matches our interface
        const typedSeasonData = seasonData as SeasonData;
        setSeason(typedSeasonData);
        
        // Fetch episodes for this season with language filter
        const episodesQuery = `*[_type == "episode" && season._ref == $seasonId && language == $language] | order(publishedAt desc) {
          _id,
          title,
          titleEn,
          name,
          nameEn,
          description,
          descriptionEn,
          summary,
          summaryEn,
          slug,
          thumbnail,
          publishedAt,
          language
        }`;
        
        const episodesData = await fetchFromSanity(episodesQuery, { seasonId: typedSeasonData._id, language });
        
        // Fetch articles for this season with language filter
        const articlesQuery = `*[_type == "article" && season._ref == $seasonId && language == $language] | order(publishedAt desc) {
          _id,
          title,
          titleEn,
          excerpt,
          excerptEn,
          slug,
          featuredImage,
          publishedAt,
          language
        }`;
        
        const articlesData = await fetchFromSanity(articlesQuery, { seasonId: typedSeasonData._id, language });
        
        // Type assertion to ensure the data matches our interface
        setEpisodes((episodesData || []) as EpisodeData[]);
        setArticles((articlesData || []) as ArticleData[]);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    loadSeason();
  }, [slug, language]);
  
  // Create memoized helper functions that accept language as parameter
  const getSearchableTextForEpisode = useMemo(() => {
    return (ep: EpisodeData, lang: 'ar' | 'en') => {
      const candidates = [
        getLocalizedText(ep.title, ep.titleEn, lang) ?? getLocalizedText(ep.name, ep.nameEn, lang) ?? "",
        getLocalizedText(ep.description, ep.descriptionEn, lang) ?? "",
        getLocalizedText(ep.summary, ep.summaryEn, lang) ?? "",
        ep.slug?.current ?? "",
        JSON.stringify(ep)
      ];
      return candidates.join(" ");
    };
  }, []);
  
  const getSearchableTextForArticle = useMemo(() => {
    return (art: ArticleData, lang: 'ar' | 'en') => {
      const candidates = [
        getLocalizedText(art.title, art.titleEn, lang) ?? "",
        getLocalizedText(art.excerpt, art.excerptEn, lang) ?? "",
        art.slug?.current ?? "",
        JSON.stringify(art)
      ];
      return candidates.join(" ");
    };
  }, []);
  
  const filteredEpisodes = useMemo(() => {
    const q = normalizeForSearch(debouncedSearch);
    if (!q) return episodes;
    const tokens = q.split(" ").filter(Boolean);
    return episodes.filter((ep) => {
      const hay = normalizeForSearch(getSearchableTextForEpisode(ep, language));
      return tokens.every((t) => hay.includes(t));
    });
  }, [episodes, debouncedSearch, getSearchableTextForEpisode, language]);
  
  const filteredArticles = useMemo(() => {
    const q = normalizeForSearch(debouncedSearch);
    if (!q) return articles;
    const tokens = q.split(" ").filter(Boolean);
    return articles.filter((art) => {
      const hay = normalizeForSearch(getSearchableTextForArticle(art, language));
      return tokens.every((t) => hay.includes(t));
    });
  }, [articles, debouncedSearch, getSearchableTextForArticle, language]);
  
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
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">{t.loading}</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center min-h-[60vh]">
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
  
  if (!season) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-center p-6 text-gray-600 dark:text-gray-400">{t.seasonNotFound}</div>
    </div>
  );
  
  const seasonTitle = getLocalizedText(season.title, season.titleEn, language) ?? (language === 'ar' ? "موسم" : "Season");
  const seasonDescription = getLocalizedText(season.description, season.descriptionEn, language) ?? "";
  const seasonThumbnailUrl = buildMediaUrl(season.thumbnail);
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Season info - Hero Section */}
      <div className="relative mt-14 rounded-2xl overflow-hidden mb-10 shadow-xl animate-fade-in">
        {/* Background gradient overlay with blue shadows for dark mode */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 z-10 dark:from-blue-800/90 dark:to-indigo-800/90 dark:shadow-[0_0_30px_5px_rgba(59,130,246,0.3)]"></div>
        
        {/* Background image with blur effect */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback 
            src={seasonThumbnailUrl} 
            alt={seasonTitle} 
            className="w-full h-full object-cover filter blur-sm scale-110"
          />
        </div>
        
        {/* Content container */}
        <div className="relative z-20 p-8 md:p-12 flex flex-col md:flex-row gap-8">
          {/* Thumbnail */}
          <div className="md:w-2/5 lg:w-1/3 flex-shrink-0">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300 dark:shadow-[0_0_15px_5px_rgba(59,130,246,0.5)]"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-300 group-hover:scale-[1.02] dark:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)]">
                <ImageWithFallback 
                  src={seasonThumbnailUrl} 
                  alt={seasonTitle} 
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Text content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full mb-4 self-start dark:bg-blue-700 dark:shadow-[0_0_10px_2px_rgba(59,130,246,0.5)]">
              {t.season}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg dark:text-blue-100">{seasonTitle}</h1>
            <p className="text-lg text-gray-100 mb-6 max-w-2xl leading-relaxed dark:text-blue-50">{seasonDescription}</p>
            
            {/* Stats and meta info */}
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg dark:bg-blue-900/30 dark:border dark:border-blue-700/50 dark:shadow-[0_0_10px_2px_rgba(59,130,246,0.3)]">
                <FaVideo className="h-5 w-5 text-blue-300 dark:text-blue-400" />
                <span className="text-white font-medium dark:text-blue-100">{episodes.length} {t.episodes}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg dark:bg-purple-900/30 dark:border dark:border-purple-700/50 dark:shadow-[0_0_10px_2px_rgba(139,92,246,0.3)]">
                <FaNewspaper className="h-5 w-5 text-purple-300 dark:text-purple-400" />
                <span className="text-white font-medium dark:text-purple-100">{articles.length} {t.articles}</span>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/episodes"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-medium rounded-lg text-sm hover:bg-blue-50 transition-all duration-300 shadow-md dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600 dark:shadow-[0_4px_6px_-1px_rgba(59,130,246,0.5)] hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                {t.allEpisodes}
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 font-medium rounded-lg text-sm hover:bg-purple-50 transition-all duration-300 shadow-md dark:bg-purple-700 dark:text-white dark:hover:bg-purple-600 dark:shadow-[0_4px_6px_-1px_rgba(139,92,246,0.5)] hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                {t.allArticles}
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Controls Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 mb-8 dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Content Type Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setContentType("episodes")}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                contentType === "episodes"
                  ? "bg-blue-600 text-white shadow-md dark:bg-blue-700 dark:shadow-[0_4px_6px_-1px_rgba(59,130,246,0.5)]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <FaVideo className="h-5 w-5" />
              {t.episodes} ({filteredEpisodes.length})
            </button>
            <button
              onClick={() => setContentType("articles")}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                contentType === "articles"
                  ? "bg-purple-600 text-white shadow-md dark:bg-purple-700 dark:shadow-[0_4px_6px_-1px_rgba(139,92,246,0.5)]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <FaNewspaper className="h-5 w-5" />
              {t.articles} ({filteredArticles.length})
            </button>
          </div>
          
          {/* Search and View Mode Controls */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-md">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={contentType === "articles" ? t.searchArticle : t.searchEpisode}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-300 shadow-md dark:shadow-[0_0_10px_2px_rgba(59,130,246,0.3)] focus:shadow-lg"
              />
              {/* Search icon on the right */}
              <span className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-gray-400 dark:text-gray-500`}>
                <FaSearch className="h-5 w-5" />
              </span>
              {/* Clear button on the left */}
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200`}
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {/* View Mode Toggle */}
            <div className="inline-flex items-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden dark:shadow-[0_0_10px_2px_rgba(59,130,246,0.3)]">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 px-4 py-3 text-sm transition-all duration-300 ${
                  viewMode === "grid" 
                    ? contentType === "episodes" 
                      ? "bg-blue-600 text-white" 
                      : "bg-purple-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                title={t.gridView}
              >
                <FaTh className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-3 text-sm transition-all duration-300 ${
                  viewMode === "list" 
                    ? contentType === "episodes" 
                      ? "bg-blue-600 text-white" 
                      : "bg-purple-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                title={t.listView}
              >
                <FaList className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Episodes */}
      {contentType === "episodes" && (
        <>
          {filteredEpisodes.length === 0 ? (
            <div className="text-center py-12 px-4 animate-fade-in">
              <div className="inline-block p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4 dark:shadow-[0_0_15px_5px_rgba(59,130,246,0.3)]">
                <FaVideo className="h-12 w-12 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.noEpisodes}</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {t.tryDifferent}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEpisodes.map((ep: EpisodeData, index) => {
                const title = getLocalizedText(ep.title, ep.titleEn, language) ?? getLocalizedText(ep.name, ep.nameEn, language) ?? (language === 'ar' ? "حلقة" : "Episode");
                const thumbnailUrl = buildMediaUrl(ep.thumbnail);
                const slug = ep.slug?.current ?? ep._id;
                const episodeDate = formatDate(ep.publishedAt);
                
                return (
                  <div 
                    key={ep._id} 
                    className="border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:shadow-[0_10px_15px_-3px_rgba(59,130,246,0.3)] animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative">
                      <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700">
                          <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                        </div>
                      </Link>
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                          {t.episode}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{title}</h2>
                        
                        {/* Episode Date - Now prominently displayed */}
                        {episodeDate && (
                          <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                            <FaCalendarAlt className="h-4 w-4 ml-2" />
                            <span>{episodeDate}</span>
                          </div>
                        )}
                        
                        {ep.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                            {getLocalizedText(ep.description, ep.descriptionEn, language)}
                          </p>
                        )}
                      </Link>
                      
                      {/* Favorite Button moved here */}
                      <div className="mt-auto pt-3">
                        <FavoriteButton contentId={ep._id} contentType="episode" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEpisodes.map((ep: EpisodeData, index) => {
                const title = getLocalizedText(ep.title, ep.titleEn, language) ?? getLocalizedText(ep.name, ep.nameEn, language) ?? (language === 'ar' ? "حلقة" : "Episode");
                const thumbnailUrl = buildMediaUrl(ep.thumbnail);
                const slug = ep.slug?.current ?? ep._id;
                const episodeDate = formatDate(ep.publishedAt);
                
                return (
                  <div 
                    key={ep._id} 
                    className="flex gap-4 items-center border rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-[0_4px_6px_-1px_rgba(59,130,246,0.2)] animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative w-36 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-md dark:shadow-[0_4px_6px_-1px_rgba(59,130,246,0.3)]">
                      <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                        <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                      </Link>
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                          {t.episode}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{title}</h3>
                        
                        {/* Episode Date - Now prominently displayed */}
                        {episodeDate && (
                          <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 mt-2 mb-3 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg inline-block">
                            <FaCalendarAlt className="h-4 w-4 ml-2" />
                            <span>{episodeDate}</span>
                          </div>
                        )}
                        
                        {ep.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                            {getLocalizedText(ep.description, ep.descriptionEn, language)}
                          </p>
                        )}
                      </Link>
                      
                      {/* Favorite Button moved here */}
                      <div className="mt-3">
                        <FavoriteButton contentId={ep._id} contentType="episode" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      
      {/* Articles */}
      {contentType === "articles" && (
        <>
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 px-4 animate-fade-in">
              <div className="inline-block p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4 dark:shadow-[0_0_15px_5px_rgba(139,92,246,0.3)]">
                <FaNewspaper className="h-12 w-12 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.noArticles}</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {t.tryDifferent}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredArticles.map((art: ArticleData, index) => {
                const title = getLocalizedText(art.title, art.titleEn, language) ?? (language === 'ar' ? "مقال" : "Article");
                const thumbnailUrl = buildMediaUrl(art.featuredImage);
                const slug = art.slug?.current ?? art._id;
                const articleDate = formatDate(art.publishedAt);
                
                return (
                  <div 
                    key={art._id} 
                    className="border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:shadow-[0_10px_15px_-3px_rgba(139,92,246,0.3)] animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative">
                      <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700">
                          <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                        </div>
                      </Link>
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
                          {t.article}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{title}</h2>
                        
                        {/* Article Date - Now prominently displayed */}
                        {articleDate && (
                          <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 mb-3 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                            <FaCalendarAlt className="h-4 w-4 ml-2" />
                            <span>{articleDate}</span>
                          </div>
                        )}
                        
                        {art.excerpt && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                            {getLocalizedText(art.excerpt, art.excerptEn, language)}
                          </p>
                        )}
                      </Link>
                      
                      {/* Favorite Button moved here */}
                      <div className="mt-auto pt-3">
                        <FavoriteButton contentId={art._id} contentType="article" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((art: ArticleData, index) => {
                const title = getLocalizedText(art.title, art.titleEn, language) ?? (language === 'ar' ? "مقال" : "Article");
                const thumbnailUrl = buildMediaUrl(art.featuredImage);
                const slug = art.slug?.current ?? art._id;
                const articleDate = formatDate(art.publishedAt);
                
                return (
                  <div 
                    key={art._id} 
                    className="flex gap-4 items-center border rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-[0_4px_6px_-1px_rgba(139,92,246,0.2)] animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative w-36 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-md dark:shadow-[0_4px_6px_-1px_rgba(139,92,246,0.3)]">
                      <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block">
                        <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                      </Link>
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
                          {t.article}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{title}</h3>
                        
                        {/* Article Date - Now prominently displayed */}
                        {articleDate && (
                          <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 mt-2 mb-3 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg inline-block">
                            <FaCalendarAlt className="h-4 w-4 ml-2" />
                            <span>{articleDate}</span>
                          </div>
                        )}
                        
                        {art.excerpt && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                            {getLocalizedText(art.excerpt, art.excerptEn, language)}
                          </p>
                        )}
                      </Link>
                      
                      {/* Favorite Button moved here */}
                      <div className="mt-3">
                        <FavoriteButton contentId={art._id} contentType="article" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}