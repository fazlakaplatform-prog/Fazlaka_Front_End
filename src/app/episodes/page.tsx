"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { urlFor, fetchFromSanity } from "@/lib/sanity";
import FavoriteButton from "@/components/FavoriteButton";
import { 
  FaVideo, 
  FaCalendarAlt, FaHeart,
  FaStar, 
  FaPlay, 
  FaGraduationCap, 
  FaSearch, FaTimes, FaTh, FaList,
  FaChevronDown, FaChevronUp, FaRegBookmark
} from "react-icons/fa";

// تعريف أنواع البيانات محلياً بدلاً من استيرادها من ملف @/types غير الموجود
interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
}

interface Season {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  thumbnail?: SanityImage;
}

interface Episode {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  description?: string;
  thumbnail?: SanityImage;
  season?: Season;
  publishedAt?: string;
}

function escapeRegExp(str = ""): string {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlighted(text: string, q: string): React.ReactNode {
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
function IconChevron({ className = "h-5 w-5", open = false }: { className?: string; open?: boolean }) {
  return open ? (
    <FaChevronUp className={className} />
  ) : (
    <FaChevronDown className={className} />
  );
}

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

function IconGrid({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconList({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

// Helper function to get image URL with proper dimensions
function getImageUrl(image?: SanityImage, width?: number, height?: number): string {
  if (!image) return "/placeholder.png";
  
  try {
    // Get the URL from urlFor
    const imageUrl = urlFor(image);
    
    // If it's a string, return it directly
    if (typeof imageUrl === 'string') {
      return imageUrl;
    }
    
    // If it's an object with a url method, try to use it
    if (imageUrl && typeof imageUrl === 'object') {
      // Check if it has the required methods
      const obj = imageUrl as Record<string, unknown>;
      
      if (typeof obj.url === 'function') {
        // Create a simple builder interface
        const builder = {
          url: () => {
            try {
              return (obj.url as () => string)();
            } catch {
              return "/placeholder.png";
            }
          },
          width: (w: number) => {
            if (typeof obj.width === 'function') {
              try {
                (obj.width as (w: number) => unknown)(w);
              } catch {
                // Ignore errors
              }
            }
            return builder;
          },
          height: (h: number) => {
            if (typeof obj.height === 'function') {
              try {
                (obj.height as (h: number) => unknown)(h);
              } catch {
                // Ignore errors
              }
            }
            return builder;
          }
        };
        
        // Apply dimensions if provided
        if (width !== undefined) {
          builder.width(width);
        }
        if (height !== undefined) {
          builder.height(height);
        }
        
        return builder.url();
      }
    }
    
    // Fallback: try to convert to string
    try {
      return String(imageUrl);
    } catch {
      return "/placeholder.png";
    }
  } catch (error) {
    console.error("Error generating image URL:", error);
    return "/placeholder.png";
  }
}

export default function EpisodesPageClient() {
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
        
        console.log("Environment variables check:");
        console.log("Project ID:", process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
        console.log("Dataset:", process.env.NEXT_PUBLIC_SANITY_DATASET);
        console.log("API Token:", process.env.SANITY_API_TOKEN ? "Set" : "Not set");
        
        // التحقق من وجود متغيرات البيئة
        if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
          throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not defined");
        }
        
        if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
          throw new Error("NEXT_PUBLIC_SANITY_DATASET is not defined");
        }
        
        // Fetch seasons
        const seasonsQuery = `*[_type == "season"]{
          _id,
          title,
          slug,
          thumbnail
        }`;
        console.log("Fetching seasons with query:", seasonsQuery);
        
        const seasons = await fetchFromSanity<Season[]>(seasonsQuery);
        console.log("Seasons loaded:", seasons);
        
        // Fetch episodes with season references
        const episodesQuery = `*[_type == "episode"]{
          _id,
          title,
          slug,
          description,
          thumbnail,
          season->{
            _id,
            title,
            slug,
            thumbnail
          },
          publishedAt
        } | order(publishedAt desc)`;
        console.log("Fetching episodes with query:", episodesQuery);
        
        const episodes = await fetchFromSanity<Episode[]>(episodesQuery);
        console.log("Episodes loaded:", episodes);
        
        const grouped: Record<string, Episode[]> = {};
        episodes.forEach((ep: Episode) => {
          const seasonTitle = ep.season?.title || "بدون موسم";
          if (!grouped[seasonTitle]) grouped[seasonTitle] = [];
          grouped[seasonTitle].push(ep);
        });
        
        setEpisodesBySeason(grouped);
        const first = Object.keys(grouped)[0];
        if (first) setOpenSeasons({ [first]: true });
      } catch (err: unknown) {
        console.error("Error loading data:", err);
        const errorMessage = err instanceof Error ? err.message : "خطأ غير معروف";
        setError("حدث خطأ في تحميل البيانات: " + errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, []);

  function toggleSeason(title: string) {
    setOpenSeasons((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  const filteredBySeason = useMemo(() => {
    if (!searchTerm.trim()) return episodesBySeason;
    const q = searchTerm.trim().toLowerCase();
    const out: Record<string, Episode[]> = {};
    Object.entries(episodesBySeason).forEach(([season, episodes]) => {
      const matches = episodes.filter((ep: Episode) => {
        const title = (ep.title || "").toString().toLowerCase();
        return title.includes(q);
      });
      if (matches.length > 0) out[season] = matches;
    });
    return out;
  }, [episodesBySeason, searchTerm]);

  const totalResults = useMemo(
    () => Object.values(filteredBySeason).reduce((s, arr) => s + arr.length, 0),
    [filteredBySeason]
  );

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

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="text-center">
        <div className="inline-block animate-bounce bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mb-4">
          <FaRegBookmark className="text-white text-3xl" />
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">جارٍ التحميل...</p>
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
          إعادة المحاولة
        </button>
      </div>
    </div>
  );

  const seasons = Object.entries(filteredBySeason);
  const searchResults = Object.values(filteredBySeason).flat();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
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
                  مكتبة الحلقات التعليمية
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                اكتشف <span className="text-yellow-300">المعرفة</span> في حلقاتنا
              </h1>
              <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
                مجموعة شاملة من الحلقات التعليمية عالية الجودة في مختلف المجالات، مصممة لتطوير معرفتك ومهاراتك.
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
                aria-label="بحث في الحلقات"
                className="bg-transparent outline-none flex-grow text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 py-1"
                placeholder="ابحث عن عنوان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="flex items-center justify-center rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  aria-label="مسح البحث"
                  title="مسح"
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
                  title="عرض شبكي"
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
                  title="عرض قائمة"
                >
                  <FaList className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                </button>
              </div>
              
              {/* روابط المفضلة والمواسم */}
              <Link href="/favorites" className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-md text-sm hover:opacity-90 transition-opacity flex items-center justify-center shadow-md">
                <FaHeart className="h-4 w-4 ml-1" />
                <span className="text-xs sm:text-sm">مفضلاتي</span>
              </Link>
              <Link href="/seasons" className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md text-sm hover:opacity-90 transition-opacity flex items-center justify-center shadow-md">
                <FaCalendarAlt className="h-4 w-4 ml-1" />
                <span className="text-xs sm:text-sm">المواسم</span>
              </Link>
            </div>
          </div>
          
          {/* عدد النتائج */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <FaVideo className="ml-2" />
              {totalResults} حلقة
            </div>
            {searchTerm && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                نتائج البحث: &quot;{searchTerm}&quot;
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
                  <div className="text-sm text-blue-100 dark:text-blue-200">نتائج البحث عن</div>
                  <div className="text-lg font-semibold text-white">
                    «{searchTerm}» <span className="text-sm text-blue-200 dark:text-blue-300">({totalResults})</span>
                  </div>
                </div>
                <button onClick={() => setSearchTerm("")} className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-md text-sm hover:bg-white/30 text-white transition-colors self-start sm:self-auto">
                  مسح البحث
                </button>
              </div>
            </div>
            
            {searchResults.length === 0 ? (
              <div className="p-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center shadow-lg">
                <div className="inline-block bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                  <FaSearch className="text-gray-400 dark:text-gray-500 text-2xl" />
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">لا توجد نتائج.</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">جرب كلمات مفتاحية أخرى</div>
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
                    {searchResults.map((ep: Episode) => {
                      const slug = ep.slug.current;
                      const title = ep.title || "حلقة";
                      const thumbnailUrl = getImageUrl(ep.thumbnail, 500, 300);
                      
                      return (
                        <motion.article
                          key={ep._id}
                          variants={cardVariants}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          layout
                          className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 shadow-md"
                        >
                          <Link href={`/episodes/${slug}`} className="block group">
                            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <Image 
                                src={thumbnailUrl} 
                                alt={title} 
                                fill
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                              />
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
                              
                              {/* عرض تاريخ النشر */}
                              {ep.publishedAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <FaCalendarAlt className="h-3 w-3" />
                                  {formatDate(ep.publishedAt)}
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="mt-auto p-3 pt-1 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <IconEpisodes className="h-4 w-4" />
                            </div>
                            <FavoriteButton contentId={ep._id} contentType="episode" />
                          </div>
                        </motion.article>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                    {searchResults.map((ep: Episode) => {
                      const slug = ep.slug.current;
                      const title = ep.title || "حلقة";
                      const thumbnailUrl = getImageUrl(ep.thumbnail, 240, 160);
                      
                      return (
                        <motion.div
                          key={ep._id}
                          variants={cardVariants}
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          layout
                          className="flex gap-4 items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-4 hover:shadow-lg transition bg-white dark:bg-gray-800 shadow-md"
                        >
                          <Link href={`/episodes/${slug}`} className="flex items-center gap-4 flex-1 group">
                            <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
                              <Image 
                                src={thumbnailUrl} 
                                alt={title} 
                                fill
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                sizes="240px" 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">{renderHighlighted(title, searchTerm)}</h3>
                              
                              {/* عرض تاريخ النشر */}
                              {ep.publishedAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <FaCalendarAlt className="h-3 w-3" />
                                  {formatDate(ep.publishedAt)}
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex-shrink-0">
                            <FavoriteButton contentId={ep._id} contentType="episode" />
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
          {seasons.length === 0 ? (
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg">
              <div className="inline-block bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                <FaVideo className="text-gray-400 dark:text-gray-500 text-2xl" />
              </div>
              <div className="text-gray-600 dark:text-gray-300 mb-2">لم نتمكن من العثور على حلقات تطابق بحثك.</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية.</div>
            </div>
          ) : (
            seasons.map(([seasonTitle, episodes]) => {
              const isOpen = !!openSeasons[seasonTitle];
              return (
                <div key={seasonTitle} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700/50">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{seasonTitle}</h2>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <IconEpisodes className="h-3 w-3" />
                        <span>{episodes.length} حلقة</span>
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
                            {isOpen ? "طي" : "فتح"}
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
                          {episodes.map((ep: Episode) => {
                            const slug = ep.slug.current;
                            const title = ep.title || "حلقة";
                            const thumbnailUrl = getImageUrl(ep.thumbnail, 500, 300);
                            
                            return viewMode === "grid" ? (
                              <motion.article
                                key={ep._id}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                layout
                                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 shadow-md"
                              >
                                <Link href={`/episodes/${slug}`} className="block group">
                                  <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                    <Image 
                                      src={thumbnailUrl} 
                                      alt={title} 
                                      fill
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                                    />
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
                                    
                                    {/* عرض تاريخ النشر */}
                                    {ep.publishedAt && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <FaCalendarAlt className="h-3 w-3" />
                                        {formatDate(ep.publishedAt)}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                                <div className="mt-auto p-3 pt-1 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                    <IconEpisodes className="h-4 w-4" />
                                  </div>
                                  <FavoriteButton contentId={ep._id} contentType="episode" />
                                </div>
                              </motion.article>
                            ) : (
                              <motion.div
                                key={ep._id}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ scale: 1.01 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                layout
                                className="flex gap-4 items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-4 hover:shadow-lg transition bg-white dark:bg-gray-800 shadow-md"
                              >
                                <Link href={`/episodes/${slug}`} className="flex items-center gap-4 flex-1 group">
                                  <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
                                    <Image 
                                      src={thumbnailUrl} 
                                      alt={title} 
                                      fill
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                      sizes="240px" 
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">{renderHighlighted(title, searchTerm)}</h3>
                                    
                                    {/* عرض تاريخ النشر */}
                                    {ep.publishedAt && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <FaCalendarAlt className="h-3 w-3" />
                                        {formatDate(ep.publishedAt)}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                                <div className="flex-shrink-0">
                                  <FavoriteButton contentId={ep._id} contentType="episode" />
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