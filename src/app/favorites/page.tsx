"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { removeFromFavorites } from "@/lib/favorites";
import ImageWithFallback from "@/components/ImageWithFallback";
import { motion, AnimatePresence } from "framer-motion";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
const API_TOKEN = process.env.STRAPI_API_TOKEN ?? "";

// تعريف الواجهات للأنواع بدلاً من استخدام any
interface ThumbnailFormat {
  url: string;
  name?: string;
  width?: number;
  height?: number;
}

interface ThumbnailFormats {
  thumbnail?: ThumbnailFormat;
  small?: ThumbnailFormat;
  medium?: ThumbnailFormat;
  large?: ThumbnailFormat;
}

interface Thumbnail {
  data?: {
    id: number;
    attributes: {
      url: string;
      formats?: ThumbnailFormats;
      name?: string;
      width?: number;
      height?: number;
    };
  };
  url?: string;
  formats?: ThumbnailFormats;
}

interface Episode {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  thumbnail?: Thumbnail;
}

// واجهة للبيانات الخام من API
interface RawEpisode {
  id: number;
  attributes?: {
    title?: string;
    slug?: string;
    description?: string;
    publishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    thumbnail?: Thumbnail;
  };
  // خصائص مباشرة بدون attributes
  title?: string;
  slug?: string;
  description?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  thumbnail?: Thumbnail;
}

function buildMediaUrl(path?: string) {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STRAPI_URL}${path}`;
}

export default function FavoritesPage() {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [fadeIn, setFadeIn] = useState(false);
  // Respect user motion preferences
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    async function fetchFavorites() {
      try {
        console.log("Fetching favorites for user:", user!.id); // الإصلاح هنا
        
        const res = await fetch(
          `${STRAPI_URL}/api/favorites?filters[userId][$eq]=${user!.id}&populate=episodes.thumbnail`, // والإصلاح هنا
          {
            headers: { Authorization: `Bearer ${API_TOKEN}` },
            cache: "no-store",
          }
        );
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("API Error:", errorData);
          throw new Error(`Failed to fetch favorites: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log("API Response:", data);
        
        // التحقق من وجود البيانات
        if (!data.data || !data.data.length || !data.data[0].episodes) {
          console.log("No episodes found in favorites");
          setFavorites([]);
          return;
        }
        
        const episodes = data.data[0].episodes as RawEpisode[];
        console.log("Episodes data:", episodes);
        
        // تحويل البيانات بشكل آمن
        const normalized = episodes.map((ep: RawEpisode): Episode => {
          // محاولة استخراج البيانات من أماكن مختلفة محتملة
          const title = 
            ep.attributes?.title || 
            ep.title || 
            "Unknown Episode";
            
          const slug = 
            ep.attributes?.slug || 
            ep.slug;
            
          const description = 
            ep.attributes?.description || 
            ep.description;
            
          const publishedAt = 
            ep.attributes?.publishedAt || 
            ep.publishedAt;
            
          const createdAt = 
            ep.attributes?.createdAt || 
            ep.createdAt;
            
          const updatedAt = 
            ep.attributes?.updatedAt || 
            ep.updatedAt;
            
          const thumbnail = 
            ep.attributes?.thumbnail || 
            ep.thumbnail;
          
          // تسجيل الحلقات التي لا تحتوي على عنوان
          if (!ep.attributes?.title && !ep.title) {
            console.warn("Episode without title found:", ep);
          }
          
          return {
            id: ep.id,
            title,
            slug,
            description,
            publishedAt,
            createdAt,
            updatedAt,
            thumbnail
          };
        });
        
        console.log("Normalized episodes:", normalized);
        setFavorites(normalized);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFavorites();
  }, [user]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  async function handleRemove(episodeId: number) {
    if (!user) return;
    try {
      await removeFromFavorites(user!.id, episodeId); // والإصلاح هنا أيضاً
      setFavorites((prev) => prev.filter((ep) => ep.id !== episodeId));
    } catch (err) {
      console.error("❌ Failed to remove favorite:", err);
    }
  }

  const filteredFavorites = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((ep) => {
      const title = (ep.title || "").toString().toLowerCase();
      return title.includes(q);
    });
  }, [favorites, searchTerm]);

  // motion variants
  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.995 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32 } },
    hover: { scale: 1.02, y: -4, transition: { duration: 0.16 } },
    exit: { opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.22 } },
  } as const;

  if (loading) return <p className="p-6 text-gray-700 dark:text-gray-200">جاري تحميل المفضلات...</p>;
  if (!user) return <p className="p-6 text-gray-700 dark:text-gray-200">يجب تسجيل الدخول لعرض المفضلات.</p>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">مفضلاتي</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/episodes"
            className="hidden sm:inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition mr-2"
            title="عرض جميع الحلقات"
          >
            عرض جميع الحلقات
          </Link>
          <div className="relative max-w-md flex-1">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث في المفضلات..."
              className="w-full pl-10 pr-10 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 outline-none transition"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition"
                aria-label="مسح البحث"
                title="مسح"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition ${
                viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
              className={`flex items-center gap-2 px-3 py-2 text-sm transition ${
                viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
      
      <div className={`${fadeIn ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
        {filteredFavorites.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 mt-6">لا توجد مفضلات تطابق البحث</p>
        ) : viewMode === "grid" ? (
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" layout variants={listVariants} initial="hidden" animate="visible">
            <AnimatePresence initial={false}>
              {filteredFavorites.map((episode) => {
                const slug = episode.slug || episode.id;
                const thumbPath =
                  episode.thumbnail?.formats?.medium?.url ??
                  episode.thumbnail?.formats?.thumbnail?.url ??
                  episode.thumbnail?.url ??
                  episode.thumbnail?.formats?.small?.url ??
                  null;
                const thumb = buildMediaUrl(thumbPath ?? undefined);
                return (
                  <motion.article
                    key={episode.id}
                    layout
                    initial={reduceMotion ? undefined : "hidden"}
                    animate={reduceMotion ? undefined : "visible"}
                    whileHover={reduceMotion ? undefined : "hover"}
                    exit={reduceMotion ? undefined : "exit"}
                    variants={cardVariants}
                    className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow duration-250 flex flex-col"
                  >
                    <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="group block flex-1">
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                        {thumb && (
                          <ImageWithFallback src={thumb} alt={episode.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="rounded-full bg-black/30 dark:bg-white/10 p-2">
                            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white dark:text-gray-200 fill-current">
                              <path d="M5 3v18l15-9L5 3z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{episode.title}</h3>
                      </div>
                    </Link>
                    <div className="mt-auto px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"></div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemove(episode.id)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 border border-transparent hover:bg-red-100 dark:hover:bg-red-900/30 transition focus:outline-none focus:ring-2 focus:ring-red-300"
                          aria-label="حذف من المفضلات"
                          title="إزالة"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                          <span className="hidden sm:inline text-sm font-medium">إزالة</span>
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div className="space-y-4" layout variants={listVariants} initial="hidden" animate="visible">
            <AnimatePresence initial={false}>
              {filteredFavorites.map((episode) => {
                const slug = episode.slug || episode.id;
                const thumbPath =
                  episode.thumbnail?.formats?.medium?.url ??
                  episode.thumbnail?.formats?.thumbnail?.url ??
                  episode.thumbnail?.url ??
                  episode.thumbnail?.formats?.small?.url ??
                  null;
                const thumb = buildMediaUrl(thumbPath ?? undefined);
                return (
                  <motion.div
                    key={episode.id}
                    layout
                    initial={reduceMotion ? undefined : "hidden"}
                    animate={reduceMotion ? undefined : "visible"}
                    whileHover={reduceMotion ? undefined : "hover"}
                    exit={reduceMotion ? undefined : "exit"}
                    variants={cardVariants}
                    className="flex gap-4 items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-3 hover:shadow-md transition bg-white dark:bg-gray-800"
                  >
                    <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="flex items-center gap-4 flex-1 group">
                      <div className="relative w-44 h-28 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        {thumb && <ImageWithFallback src={thumb} alt={episode.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{episode.title}</h3>
                      </div>
                    </Link>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => handleRemove(episode.id)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 border border-transparent hover:bg-red-100 dark:hover:bg-red-900/30 transition focus:outline-none focus:ring-2 focus:ring-red-300"
                        aria-label="حذف من المفضلات"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                        <span className="hidden sm:inline text-sm font-medium">إزالة</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}