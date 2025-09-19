"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { urlFor, fetchFromSanity } from "@/lib/sanity";
import FavoriteButton from "@/components/FavoriteButton";

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
function IconChevron({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
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

  if (loading) return <p className="text-center p-6 text-gray-700 dark:text-gray-200">جارٍ التحميل...</p>;
  if (error) return <p className="text-center p-6 text-red-500">{error}</p>;

  const seasons = Object.entries(filteredBySeason);
  const searchResults = Object.values(filteredBySeason).flat();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* رأس الصفحة */}
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">جميع الحلقات</h1>
        
        {/* مربع البحث والأزرار */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-sm px-3 py-2 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-200 flex-grow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                <IconGrid className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
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
                <IconList className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
              </button>
            </div>
            
            {/* روابط المفضلة والمواسم */}
            <Link href="/favorites" className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs sm:text-sm">مفضلاتي</span>
            </Link>
            <Link href="/seasons" className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="text-xs sm:text-sm">المواسم</span>
            </Link>
          </div>
        </div>
        
        {/* عدد النتائج */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {totalResults} نتيجة
        </div>
      </div>
      
      {/* نتائج البحث */}
      {searchTerm.trim() ? (
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">نتائج البحث عن</div>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                «{searchTerm}» <span className="text-sm text-gray-600 dark:text-gray-400">({totalResults})</span>
              </div>
            </div>
            <button onClick={() => setSearchTerm("")} className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-600 self-start sm:self-auto">
              مسح البحث
            </button>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
              لا توجد نتائج.
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
                        className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col bg-white dark:bg-gray-800"
                      >
                        <Link href={`/episodes/${slug}`} className="block group">
                          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                            <Image 
                              src={thumbnailUrl} 
                              alt={title} 
                              fill
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.06 }}
                              transition={{ type: "spring", stiffness: 260, damping: 20 }}
                              className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                              <div className="bg-black/40 dark:bg-white/10 rounded-full p-2">
                                <IconPlay className="h-6 w-6 text-white dark:text-gray-200" />
                              </div>
                            </motion.div>
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2">{renderHighlighted(title, searchTerm)}</h3>
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
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
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
                        className="flex gap-3 items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-3 hover:shadow transition bg-white dark:bg-gray-800"
                      >
                        <Link href={`/episodes/${slug}`} className="flex items-center gap-3 flex-1 group">
                          <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                            <Image 
                              src={thumbnailUrl} 
                              alt={title} 
                              fill
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                              sizes="240px" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2">{renderHighlighted(title, searchTerm)}</h3>
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
      <div className="space-y-4">
        {seasons.length === 0 ? (
          <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L15 12l-5.25-5" />
            </svg>
            <div className="mt-4 text-gray-600 dark:text-gray-300">لم نتمكن من العثور على حلقات تطابق بحثك.</div>
            <div className="mt-2 text-sm text-gray-400 dark:text-gray-500">جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية.</div>
          </div>
        ) : (
          seasons.map(([seasonTitle, episodes]) => {
            const isOpen = !!openSeasons[seasonTitle];
            return (
              <div key={seasonTitle} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{seasonTitle}</h2>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                      <IconEpisodes className="h-3 w-3" />
                      <span>{episodes.length} حلقة</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.button
                      aria-expanded={isOpen}
                      onClick={() => toggleSeason(seasonTitle)}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
                    >
                      <motion.span layout className="flex items-center gap-2">
                        <motion.span aria-hidden>
                          <motion.div
                            initial={{ rotate: isOpen ? 90 : 0 }}
                            animate={{ rotate: isOpen ? 90 : 0 }}
                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
                            className="flex items-center"
                          >
                            <IconChevron className="h-4 w-4 text-gray-600 dark:text-gray-300" />
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
                      <motion.div layout className={`py-4 ${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-3"}`}>
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
                              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col bg-white dark:bg-gray-800"
                            >
                              <Link href={`/episodes/${slug}`} className="block group">
                                <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
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
                                <div className="p-3">
                                  <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2">{renderHighlighted(title, searchTerm)}</h3>
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
                              className="flex gap-3 items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-3 hover:shadow transition bg-white dark:bg-gray-800"
                            >
                              <Link href={`/episodes/${slug}`} className="flex items-center gap-3 flex-1 group">
                                <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                                  <Image 
                                    src={thumbnailUrl} 
                                    alt={title} 
                                    fill
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                    sizes="240px" 
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2">{renderHighlighted(title, searchTerm)}</h3>
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
  );
}