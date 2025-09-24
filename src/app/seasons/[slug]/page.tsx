// SeasonPageClient.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { use } from "react";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import ImageWithFallback from "@/components/ImageWithFallback";
import { fetchFromSanity, urlFor } from "@/lib/sanity";

// Define proper types for Sanity image assets
type SanityImageAsset = {
  _ref: string;
  _type: "reference";
};

type SanityImage = {
  _type: "image";
  asset: SanityImageAsset;
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
  description?: string;
  slug?: {
    current: string;
    _type: "slug";
  };
  thumbnail?: SanityImage;
}

interface EpisodeData {
  _id: string;
  _type: "episode";
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  slug?: {
    current: string;
    _type: "slug";
  };
  thumbnail?: SanityImage;
  publishedAt?: string;
}

interface ArticleData {
  _id: string;
  _type: "article";
  title?: string;
  excerpt?: string;
  slug?: {
    current: string;
    _type: "slug";
  };
  featuredImage?: SanityImage;
  publishedAt?: string;
}

export default function SeasonPageClient({ params }: SeasonProps) {
  const { slug } = use(params);
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
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);
  
  useEffect(() => {
    async function loadSeason() {
      try {
        setLoading(true);
        
        // Fetch season from Sanity
        const seasonQuery = `*[_type == "season" && slug.current == $slug][0] {
          _id,
          title,
          description,
          slug,
          thumbnail
        }`;
        
        const seasonData = await fetchFromSanity(seasonQuery, { slug });
        
        if (!seasonData) throw new Error("Season not found");
        
        // Type assertion to ensure the data matches our interface
        const typedSeasonData = seasonData as SeasonData;
        setSeason(typedSeasonData);
        
        // Fetch episodes for this season
        const episodesQuery = `*[_type == "episode" && season._ref == $seasonId] | order(publishedAt desc) {
          _id,
          title,
          name,
          description,
          summary,
          slug,
          thumbnail,
          publishedAt
        }`;
        
        const episodesData = await fetchFromSanity(episodesQuery, { seasonId: typedSeasonData._id });
        
        // Fetch articles for this season
        const articlesQuery = `*[_type == "article" && season._ref == $seasonId] | order(publishedAt desc) {
          _id,
          title,
          excerpt,
          slug,
          featuredImage,
          publishedAt
        }`;
        
        const articlesData = await fetchFromSanity(articlesQuery, { seasonId: typedSeasonData._id });
        
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
  }, [slug]);
  
  function getSearchableTextForEpisode(ep: EpisodeData) {
    const candidates = [
      ep.title ?? ep.name ?? "",
      ep.description ?? "",
      ep.summary ?? "",
      ep.slug?.current ?? "",
      JSON.stringify(ep)
    ];
    return candidates.join(" ");
  }
  
  function getSearchableTextForArticle(art: ArticleData) {
    const candidates = [
      art.title ?? "",
      art.excerpt ?? "",
      art.slug?.current ?? "",
      JSON.stringify(art)
    ];
    return candidates.join(" ");
  }
  
  const filteredEpisodes = useMemo(() => {
    const q = normalizeForSearch(debouncedSearch);
    if (!q) return episodes;
    const tokens = q.split(" ").filter(Boolean);
    return episodes.filter((ep) => {
      const hay = normalizeForSearch(getSearchableTextForEpisode(ep));
      return tokens.every((t) => hay.includes(t));
    });
  }, [episodes, debouncedSearch]);
  
  const filteredArticles = useMemo(() => {
    const q = normalizeForSearch(debouncedSearch);
    if (!q) return articles;
    const tokens = q.split(" ").filter(Boolean);
    return articles.filter((art) => {
      const hay = normalizeForSearch(getSearchableTextForArticle(art));
      return tokens.every((t) => hay.includes(t));
    });
  }, [articles, debouncedSearch]);
  
  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;
  if (!season) return <div className="text-center p-6 text-gray-600 dark:text-gray-400">الموسم غير موجود</div>;
  
  const seasonTitle = season.title ?? "موسم";
  const seasonDescription = season.description ?? "";
  const seasonThumbnailUrl = buildMediaUrl(season.thumbnail);
  
  // Function to format date in Arabic
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
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
              موسم
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg dark:text-blue-100">{seasonTitle}</h1>
            <p className="text-lg text-gray-100 mb-6 max-w-2xl leading-relaxed dark:text-blue-50">{seasonDescription}</p>
            
            {/* Stats and meta info */}
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg dark:bg-blue-900/30 dark:border dark:border-blue-700/50 dark:shadow-[0_0_10px_2px_rgba(59,130,246,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-white font-medium dark:text-blue-100">{episodes.length} حلقة</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg dark:bg-purple-900/30 dark:border dark:border-purple-700/50 dark:shadow-[0_0_10px_2px_rgba(139,92,246,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-300 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <span className="text-white font-medium dark:text-purple-100">{articles.length} مقال</span>
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
                جميع الحلقات
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 font-medium rounded-lg text-sm hover:bg-purple-50 transition-all duration-300 shadow-md dark:bg-purple-700 dark:text-white dark:hover:bg-purple-600 dark:shadow-[0_4px_6px_-1px_rgba(139,92,246,0.5)] hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                جميع المقالات
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              الحلقات ({filteredEpisodes.length})
            </button>
            <button
              onClick={() => setContentType("articles")}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                contentType === "articles"
                  ? "bg-purple-600 text-white shadow-md dark:bg-purple-700 dark:shadow-[0_4px_6px_-1px_rgba(139,92,246,0.5)]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              المقالات ({filteredArticles.length})
            </button>
          </div>
          
          {/* Search and View Mode Controls */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-md">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={contentType === "articles" ? "ابحث عن مقال..." : "ابحث عن حلقة..."}
                dir="rtl"
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-300 shadow-md dark:shadow-[0_0_10px_2px_rgba(59,130,246,0.3)] focus:shadow-lg"
              />
              {/* Search icon on the right */}
              <span className="absolute right-4 top-3.5 text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              {/* Clear button on the left */}
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                title="عرض شبكي"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" />
                </svg>
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
                title="عرض قائمة"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد حلقات مطابقة للبحث</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                جرب تغيير كلمات البحث أو استخدم عبارات مختلفة للعثور على ما تبحث عنه.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEpisodes.map((ep: EpisodeData, index) => {
                const title = ep.title ?? ep.name ?? "حلقة";
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
                          حلقة
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{title}</h2>
                        
                        {/* Episode Date - Now prominently displayed */}
                        {episodeDate && (
                          <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{episodeDate}</span>
                          </div>
                        )}
                        
                        {ep.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{ep.description}</p>
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
                const title = ep.title ?? ep.name ?? "حلقة";
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
                          حلقة
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{title}</h3>
                        
                        {/* Episode Date - Now prominently displayed */}
                        {episodeDate && (
                          <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 mt-2 mb-3 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg inline-block">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{episodeDate}</span>
                          </div>
                        )}
                        
                        {ep.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">{ep.description}</p>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد مقالات مطابقة للبحث</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                جرب تغيير كلمات البحث أو استخدم عبارات مختلفة للعثور على ما تبحث عنه.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredArticles.map((art: ArticleData, index) => {
                const title = art.title ?? "مقال";
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
                          مقال
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{title}</h2>
                        
                        {/* Article Date - Now prominently displayed */}
                        {articleDate && (
                          <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 mb-3 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{articleDate}</span>
                          </div>
                        )}
                        
                        {art.excerpt && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{art.excerpt}</p>
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
                const title = art.title ?? "مقال";
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
                          مقال
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{title}</h3>
                        
                        {/* Article Date - Now prominently displayed */}
                        {articleDate && (
                          <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 mt-2 mb-3 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg inline-block">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{articleDate}</span>
                          </div>
                        )}
                        
                        {art.excerpt && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">{art.excerpt}</p>
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