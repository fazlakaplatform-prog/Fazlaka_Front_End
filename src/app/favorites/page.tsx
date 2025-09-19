"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { client, urlFor } from "@/lib/sanity";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import FavoriteButton from "@/components/FavoriteButton";

// Updated Episode interface with proper Sanity image structure
interface Episode {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  thumbnail?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
}

// Updated Article interface with proper Sanity image structure
interface Article {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  featuredImage?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
}

// Union type for favorite items
type FavoriteItem = Episode | Article;

// Helper function to determine if an item is an episode
function isEpisode(item: FavoriteItem): item is Episode {
  return (item as Episode).thumbnail !== undefined;
}

// Helper function to get the URL for a favorite item
function getItemUrl(item: FavoriteItem): string {
  if (isEpisode(item)) {
    return `/episodes/${item.slug.current}`;
  } else {
    return `/articles/${item.slug.current}`;
  }
}

// Helper function to get the image URL for a favorite item
function getItemImageUrl(item: FavoriteItem): string {
  if (isEpisode(item)) {
    return item.thumbnail ? urlFor(item.thumbnail) : "/placeholder.png";
  } else {
    return item.featuredImage ? urlFor(item.featuredImage) : "/placeholder.png";
  }
}

export default function FavoritesPage() {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
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
        // Fetch episode favorites
        const episodeQuery = `*[_type == "favorite" && userId == $userId && episode._ref != null]{
          episode->{
            _id,
            title,
            slug,
            thumbnail{ _type, asset }
          }
        }`;
        
        // Fetch article favorites
        const articleQuery = `*[_type == "favorite" && userId == $userId && article._ref != null]{
          article->{
            _id,
            title,
            slug,
            featuredImage{ _type, asset }
          }
        }`;
        
        const episodeFavs = await client.fetch(episodeQuery, { userId: user!.id });
        const articleFavs = await client.fetch(articleQuery, { userId: user!.id });
        
        // Extract episodes and articles
        const episodes = episodeFavs.map((fav: { episode: Episode }) => fav.episode).filter(Boolean);
        const articles = articleFavs.map((fav: { article: Article }) => fav.article).filter(Boolean);
        
        // Combine and sort by title
        const combinedFavorites = [...episodes, ...articles].sort((a, b) => 
          a.title.localeCompare(b.title, 'ar')
        );
        
        setFavorites(combinedFavorites);
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

  async function handleRemove(itemId: string, contentType: "episode" | "article") {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/favorites`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user!.id, // Non-null assertion
          contentId: itemId,
          contentType,
        }),
      });

      if (response.ok) {
        setFavorites((prev) => prev.filter((item) => item._id !== itemId));
      } else {
        const errorData = await response.json();
        console.error("Error removing favorite:", errorData);
        alert("حدث خطأ أثناء إزالة العنصر من المفضلة. يرجى المحاولة مرة أخرى.");
      }
    } catch (err) {
      console.error("❌ Failed to remove favorite:", err);
      alert("حدث خطأ أثناء إزالة العنصر من المفضلة. يرجى المحاولة مرة أخرى.");
    }
  }

  const filteredFavorites = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((item) => {
      const title = (item.title || "").toString().toLowerCase();
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
          <Link
            href="/articles"
            className="hidden sm:inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition mr-2"
            title="عرض جميع المقالات"
          >
            عرض جميع المقالات
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
          <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <div className="mt-4 text-gray-600 dark:text-gray-300">
              {searchTerm ? "لا توجد مفضلات تطابق البحث" : "لا توجد عناصر في المفضلة"}
            </div>
            <div className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              {searchTerm ? "جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية." : "أضف حلقات أو مقالات إلى المفضلة للعرض هنا."}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" layout variants={listVariants} initial="hidden" animate="visible">
            <AnimatePresence initial={false}>
              {filteredFavorites.map((item) => {
                const itemUrl = getItemUrl(item);
                const thumbnailUrl = getItemImageUrl(item);
                const isEpisodeItem = isEpisode(item);
                
                return (
                  <motion.article
                    key={item._id}
                    layout
                    initial={reduceMotion ? undefined : "hidden"}
                    animate={reduceMotion ? undefined : "visible"}
                    whileHover={reduceMotion ? undefined : "hover"}
                    exit={reduceMotion ? undefined : "exit"}
                    variants={cardVariants}
                    className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow duration-250 flex flex-col"
                  >
                    <Link href={itemUrl} className="group block flex-1">
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                        <Image 
                          src={thumbnailUrl} 
                          alt={item.title} 
                          fill
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="rounded-full bg-black/30 dark:bg-white/10 p-2">
                            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white dark:text-gray-200 fill-current">
                              <path d="M5 3v18l15-9L5 3z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isEpisodeItem 
                              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200" 
                              : "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                          }`}>
                            {isEpisodeItem ? "حلقة" : "مقال"}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                      </div>
                    </Link>
                    <div className="mt-auto px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"></div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemove(item._id, isEpisodeItem ? "episode" : "article")}
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
              {filteredFavorites.map((item) => {
                const itemUrl = getItemUrl(item);
                const thumbnailUrl = getItemImageUrl(item);
                const isEpisodeItem = isEpisode(item);
                
                return (
                  <motion.div
                    key={item._id}
                    layout
                    initial={reduceMotion ? undefined : "hidden"}
                    animate={reduceMotion ? undefined : "visible"}
                    whileHover={reduceMotion ? undefined : "hover"}
                    exit={reduceMotion ? undefined : "exit"}
                    variants={cardVariants}
                    className="flex gap-4 items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-3 hover:shadow-md transition bg-white dark:bg-gray-800"
                  >
                    <Link href={itemUrl} className="flex items-center gap-4 flex-1 group">
                      <div className="relative w-44 h-28 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <Image 
                          src={thumbnailUrl} 
                          alt={item.title} 
                          fill
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isEpisodeItem 
                              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200" 
                              : "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                          }`}>
                            {isEpisodeItem ? "حلقة" : "مقال"}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{item.title}</h3>
                      </div>
                    </Link>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => handleRemove(item._id, isEpisodeItem ? "episode" : "article")}
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