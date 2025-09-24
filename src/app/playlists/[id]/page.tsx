"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/ImageWithFallback";
import FavoriteButton from "@/components/FavoriteButton";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { fetchPlaylistBySlug, urlForImage } from "@/lib/sanity";

// تعريف الواجهات
interface Playlist {
  _id: string;
  slug: { current: string };
  title: string;
  description?: string;
  imageUrl?: string;
  image?: SanityImage;
  episodes?: Episode[];
  articles?: Article[];
}

interface Episode {
  _id: string;
  slug: { current: string };
  title: string;
  imageUrl?: string;
  content?: Record<string, unknown>;
  videoUrl?: string;
  publishedAt?: string;
}

interface Article {
  _id: string;
  slug: { current: string };
  title: string;
  imageUrl?: string;
  excerpt?: string;
  content?: Record<string, unknown>;
  publishedAt?: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

// تعريف واجهة SanityImage
interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

// دالة مساعدة لإنشاء رابط الصورة
function buildMediaUrl(image?: SanityImage | string): string {
  if (!image) return "/placeholder.png";
  
  try {
    // التحقق مما إذا كان هناك رابط مباشر
    if (typeof image === 'string') {
      return image;
    }
    
    // إذا كان كائن صورة من Sanity
    if (image.asset) {
      const result = urlForImage(image);
      return result.url();
    }
    
    return "/placeholder.png";
  } catch {
    // بديل في حالة حدوث أي خطأ
    return "/placeholder.png";
  }
}

// دالة لتنسيق التاريخ
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

export default function PlaylistDetails({ params }: Props) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [contentType, setContentType] = useState<"all" | "episodes" | "articles">("all");
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        const data = await fetchPlaylistBySlug(id);
        
        // Validate data before setting state
        if (!data) {
          setError("القائمة غير موجودة");
          setLoading(false);
          return;
        }
        
        // Ensure required fields exist
        if (!data._id || !data.title || !data.slug?.current) {
          setError("بيانات القائمة غير صالحة");
          setLoading(false);
          return;
        }
        
        setPlaylist(data as Playlist);
        setLoading(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Error fetching playlist:", err);
        setError("حدث خطأ أثناء تحميل القائمة");
        setLoading(false);
      }
    };
    fetchPlaylist();
    return () => controller.abort();
  }, [id]);
  
  // تعديل منطق البحث ليبحث في العناوين فقط
  const filteredEpisodes = playlist?.episodes?.filter((episode) => {
    const title = (episode.title || "").toString().toLowerCase();
    const q = searchTerm.toLowerCase();
    return title.includes(q);
  }) || [];
  
  const filteredArticles = playlist?.articles?.filter((article) => {
    const title = (article.title || "").toString().toLowerCase();
    const q = searchTerm.toLowerCase();
    return title.includes(q);
  }) || [];
  
  // دالة لمسح البحث
  const clearSearch = () => {
    setSearchTerm("");
  };
  
  if (loading) return (
    <motion.div 
      className="text-center mt-10 text-gray-700 dark:text-gray-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      جاري التحميل...
    </motion.div>
  );
  
  if (error) return (
    <motion.div 
      className="text-center mt-10 text-red-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {error}
    </motion.div>
  );
  
  if (!playlist) return (
    <motion.p 
      className="text-center mt-10 text-gray-600 dark:text-gray-400"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      القائمة غير موجودة
    </motion.p>
  );
  
  // الحصول على رابط الصورة
  const playlistImageUrl = buildMediaUrl(playlist.image || playlist.imageUrl);
  
  // framer-motion variants
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        delay: i * 0.08, 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1] as const
      } 
    }),
    hover: { 
      scale: 1.03, 
      y: -10,
      transition: { 
        duration: 0.3, 
        ease: "easeInOut" as const
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: { 
        duration: 0.3,
        ease: "easeInOut" as const
      }
    }
  };
  
  const listVariants: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0,
      transition: { 
        delay: i * 0.05, 
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const
      } 
    }),
    hover: { 
      x: 10,
      transition: { 
        duration: 0.2,
        ease: "easeInOut" as const
      }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: { 
        duration: 0.2,
        ease: "easeInOut" as const
      }
    }
  };
  
  const playIconVariants: Variants = {
    rest: { scale: 0.8, opacity: 0.7, rotate: -5 },
    hover: { 
      scale: 1.1, 
      opacity: 1,
      rotate: 0,
      transition: { 
        duration: 0.3,
        ease: "easeInOut" as const
      }
    },
  };
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1
      }
    }
  };
  
  const buttonVariants: Variants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { 
        duration: 0.2,
        ease: "easeInOut" as const
      }
    },
    tap: { 
      scale: 0.95,
      transition: { 
        duration: 0.1,
        ease: "easeInOut" as const
      }
    }
  };
  
  const contentSwitchVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeInOut" as const
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.3,
        ease: "easeInOut" as const
      }
    }
  };
  
  // تحديد المحتوى الذي سيتم عرضه بناءً على الفلتر
  const displayEpisodes = contentType === "all" || contentType === "episodes";
  const displayArticles = contentType === "all" || contentType === "articles";
  
  return (
    <div className="container mx-auto py-8 px-4 pt-12">
      {/* Hero Section - Modified to match SeasonPageClient style */}
      <motion.div 
        className="relative rounded-2xl overflow-hidden mb-10 mt-10 shadow-xl"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Background gradient overlay with blue shadows for dark mode */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 z-10 dark:from-blue-800/90 dark:to-indigo-800/90 dark:shadow-[0_0_30px_5px_rgba(59,130,246,0.3)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        
        {/* Background image with blur effect */}
        <div className="absolute inset-0 z-0">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <ImageWithFallback 
              src={playlistImageUrl} 
              alt={playlist.title} 
              className="w-full h-full object-cover filter blur-sm scale-110"
            />
          </motion.div>
        </div>
        
        {/* Content container */}
        <div className="relative z-20 p-8 md:p-12 flex flex-col md:flex-row gap-8">
          {/* Thumbnail */}
          <motion.div 
            className="md:w-2/5 lg:w-1/3 flex-shrink-0"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative group">
              <motion.div 
                className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300 dark:shadow-[0_0_15px_5px_rgba(59,130,246,0.5)]"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
              <div className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-300 group-hover:scale-[1.02] dark:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)]">
                <ImageWithFallback 
                  src={playlistImageUrl} 
                  alt={playlist.title} 
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>
          </motion.div>
          
          {/* Text content */}
          <motion.div 
            className="flex-1 flex flex-col justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div 
              className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full mb-4 self-start dark:bg-blue-700 dark:shadow-[0_0_10px_2px_rgba(59,130,246,0.5)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              قائمة تشغيل
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg dark:text-blue-100"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {playlist.title}
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-100 mb-6 max-w-2xl leading-relaxed dark:text-blue-50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              {playlist.description}
            </motion.p>
            
            {/* Stats and meta info */}
            <motion.div 
              className="flex flex-wrap gap-4 mt-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <motion.div 
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg dark:bg-blue-900/30 dark:border dark:border-blue-700/50 dark:shadow-[0_0_10px_2px_rgba(59,130,246,0.3)]"
                whileHover={{ scale: 1.05, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-white font-medium dark:text-blue-100">{playlist.episodes?.length || 0} حلقة</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg dark:bg-purple-900/30 dark:border dark:border-purple-700/50 dark:shadow-[0_0_10px_2px_rgba(139,92,246,0.3)]"
                whileHover={{ scale: 1.05, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-300 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <span className="text-white font-medium dark:text-purple-100">{playlist.articles?.length || 0} مقال</span>
              </motion.div>
            </motion.div>
            
            {/* Action buttons */}
            <motion.div 
              className="flex flex-wrap gap-3 mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Link
                  href="/episodes"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-medium rounded-lg text-sm hover:bg-blue-50 transition-all duration-300 shadow-md dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600 dark:shadow-[0_4px_6px_-1px_rgba(59,130,246,0.5)] hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  جميع الحلقات
                </Link>
              </motion.div>
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Link
                  href="/articles"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 font-medium rounded-lg text-sm hover:bg-purple-50 transition-all duration-300 shadow-md dark:bg-purple-700 dark:text-white dark:hover:bg-purple-600 dark:shadow-[0_4px_6px_-1px_rgba(139,92,246,0.5)] hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  جميع المقالات
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* search + view toggle + content type filter - Improved */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <motion.div 
          className="relative max-w-md w-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <motion.input
            type="text"
            placeholder="ابحث عن حلقة أو مقال..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-10 py-3 rounded-xl outline-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 transition shadow-sm hover:shadow-md focus:shadow-lg"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
          {searchTerm && (
            <motion.button 
              onClick={clearSearch}
              className="absolute inset-y-0 left-0 flex items-center pl-3 z-10"
              aria-label="مسح البحث"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </motion.div>
        
        <motion.div 
          className="flex gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* Content type filter */}
          <div className="inline-flex items-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setContentType("all")}
              className={`flex items-center gap-2 px-4 py-3 text-sm transition ${
                contentType === "all" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              aria-pressed={contentType === "all"}
              title="عرض الكل"
            >
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ${contentType === "all" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                animate={contentType === "all" ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </motion.svg>
              <span className="hidden sm:inline">الكل</span>
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setContentType("episodes")}
              className={`flex items-center gap-2 px-4 py-3 text-sm transition ${
                contentType === "episodes" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              aria-pressed={contentType === "episodes"}
              title="عرض الحلقات فقط"
            >
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ${contentType === "episodes" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                animate={contentType === "episodes" ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </motion.svg>
              <span className="hidden sm:inline">الحلقات</span>
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setContentType("articles")}
              className={`flex items-center gap-2 px-4 py-3 text-sm transition ${
                contentType === "articles" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              aria-pressed={contentType === "articles"}
              title="عرض المقالات فقط"
            >
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ${contentType === "articles" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                animate={contentType === "articles" ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </motion.svg>
              <span className="hidden sm:inline">المقالات</span>
            </motion.button>
          </div>
          
          {/* View mode toggle */}
          <div className="inline-flex items-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-4 py-3 text-sm transition ${
                viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              aria-pressed={viewMode === "grid"}
              title="عرض شبكي"
            >
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                animate={viewMode === "grid" ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" />
              </motion.svg>
              <span className="hidden sm:inline">شبكي</span>
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-3 text-sm transition ${
                viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              aria-pressed={viewMode === "list"}
              title="عرض قائمة"
            >
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                animate={viewMode === "list" ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </motion.svg>
              <span className="hidden sm:inline">قائمة</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
      
      {/* content */}
      <AnimatePresence mode="wait">
        {(filteredEpisodes.length === 0 && filteredArticles.length === 0) ? (
          <motion.p 
            className="text-center text-gray-600 dark:text-gray-400 py-10"
            key="no-results"
            variants={contentSwitchVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            لا توجد حلقات أو مقالات تطابق البحث
          </motion.p>
        ) : viewMode === "grid" ? (
          <motion.div 
            key="grid-view"
            className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* عرض الحلقات */}
            {displayEpisodes && filteredEpisodes.map((ep, idx) => {
              const slug = encodeURIComponent(ep.slug.current);
              const thumbnailUrl = ep.imageUrl || "/placeholder.png";
              return (
                <motion.article
                  key={`episode-${ep._id}`}
                  custom={idx}
                  variants={cardVariants}
                  whileHover="hover"
                  exit="exit"
                  layout
                  className="relative border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 group dark:shadow-[0_4px_15px_-5px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)]"
                >
                  <Link href={`/episodes/${slug}`} className="block">
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
                      <motion.div 
                        className="w-full h-full"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                      >
                        <ImageWithFallback src={thumbnailUrl} alt={ep.title || "حلقة"} className="w-full h-full object-cover" />
                      </motion.div>
                      
                      {/* gradient overlay + play icon */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div 
                          variants={playIconVariants}
                          initial="rest"
                          whileHover="hover"
                          className="w-16 h-16 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center shadow-lg dark:shadow-[0_0_15px_5px_rgba(59,130,246,0.5)]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </motion.div>
                      </div>
                      
                      {/* Episode badge */}
                      <motion.div 
                        className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full dark:bg-blue-700 dark:shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + idx * 0.05, type: "spring" }}
                      >
                        حلقة
                      </motion.div>
                    </div>
                    <div className="p-4">
                      <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{ep.title}</h2>
                      {ep.publishedAt && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(ep.publishedAt)}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="p-3 pt-2 flex items-center justify-end border-t border-gray-100 dark:border-gray-700">
                    <FavoriteButton contentId={ep._id} contentType="episode" />
                  </div>
                </motion.article>
              );
            })}
            
            {/* عرض المقالات */}
            {displayArticles && filteredArticles.map((article, idx) => {
              const slug = encodeURIComponent(article.slug.current);
              const thumbnailUrl = article.imageUrl || "/placeholder.png";
              return (
                <motion.article
                  key={`article-${article._id}`}
                  custom={idx + (displayEpisodes ? filteredEpisodes.length : 0)}
                  variants={cardVariants}
                  whileHover="hover"
                  exit="exit"
                  layout
                  className="relative border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 group dark:shadow-[0_4px_15px_-5px_rgba(16,185,129,0.2)] dark:hover:shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)]"
                >
                  <Link href={`/articles/${slug}`} className="block">
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
                      <motion.div 
                        className="w-full h-full"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                      >
                        <ImageWithFallback src={thumbnailUrl} alt={article.title || "مقال"} className="w-full h-full object-cover" />
                      </motion.div>
                      
                      {/* Article badge */}
                      <motion.div 
                        className="absolute top-3 right-3 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full dark:bg-green-700 dark:shadow-[0_0_8px_2px_rgba(16,185,129,0.5)]"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + idx * 0.05, type: "spring" }}
                      >
                        مقال
                      </motion.div>
                    </div>
                    <div className="p-4">
                      <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{article.title}</h2>
                      {article.publishedAt && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(article.publishedAt)}
                        </p>
                      )}
                      {article.excerpt && (
                        <motion.p 
                          className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {article.excerpt}
                        </motion.p>
                      )}
                    </div>
                  </Link>
                  <div className="p-3 pt-2 flex items-center justify-end border-t border-gray-100 dark:border-gray-700">
                    <FavoriteButton contentId={article._id} contentType="article" />
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="list-view"
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* عرض الحلقات */}
            {displayEpisodes && filteredEpisodes.map((ep, idx) => {
              const slug = encodeURIComponent(ep.slug.current);
              const thumbnailUrl = ep.imageUrl || "/placeholder.png";
              return (
                <motion.div
                  key={`episode-${ep._id}`}
                  custom={idx}
                  variants={listVariants}
                  whileHover="hover"
                  exit="exit"
                  layout
                  className="flex gap-4 items-center border rounded-xl overflow-hidden p-4 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:shadow-[0_4px_15px_-5px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)]"
                >
                  <Link href={`/episodes/${slug}`} className="flex items-center gap-4 flex-1">
                    <motion.div 
                      className="w-44 h-28 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ImageWithFallback src={thumbnailUrl} alt={ep.title || "حلقة"} className="w-full h-full object-cover" />
                    </motion.div>
                    <div className="flex-1">
                      <motion.div 
                        className="flex items-center gap-2 mb-1"
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full dark:shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]">
                          حلقة
                        </span>
                      </motion.div>
                      <motion.h3 
                        className="font-semibold text-lg text-gray-900 dark:text-gray-100"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {ep.title}
                      </motion.h3>
                      {ep.publishedAt && (
                        <motion.p 
                          className="text-sm text-gray-500 dark:text-gray-400 mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {formatDate(ep.publishedAt)}
                        </motion.p>
                      )}
                    </div>
                  </Link>
                  <motion.div 
                    className="flex-shrink-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <FavoriteButton contentId={ep._id} contentType="episode" />
                  </motion.div>
                </motion.div>
              );
            })}
            
            {/* عرض المقالات */}
            {displayArticles && filteredArticles.map((article, idx) => {
              const slug = encodeURIComponent(article.slug.current);
              const thumbnailUrl = article.imageUrl || "/placeholder.png";
              return (
                <motion.div
                  key={`article-${article._id}`}
                  custom={idx + (displayEpisodes ? filteredEpisodes.length : 0)}
                  variants={listVariants}
                  whileHover="hover"
                  exit="exit"
                  layout
                  className="flex gap-4 items-center border rounded-xl overflow-hidden p-4 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:shadow-[0_4px_15px_-5px_rgba(16,185,129,0.2)] dark:hover:shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)]"
                >
                  <Link href={`/articles/${slug}`} className="flex items-center gap-4 flex-1">
                    <motion.div 
                      className="w-44 h-28 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ImageWithFallback src={thumbnailUrl} alt={article.title || "مقال"} className="w-full h-full object-cover" />
                    </motion.div>
                    <div className="flex-1">
                      <motion.div 
                        className="flex items-center gap-2 mb-1"
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-1 rounded-full dark:shadow-[0_0_8px_2px_rgba(16,185,129,0.5)]">
                          مقال
                        </span>
                      </motion.div>
                      <motion.h3 
                        className="font-semibold text-lg text-gray-900 dark:text-gray-100"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {article.title}
                      </motion.h3>
                      {article.publishedAt && (
                        <motion.p 
                          className="text-sm text-gray-500 dark:text-gray-400 mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {formatDate(article.publishedAt)}
                        </motion.p>
                      )}
                      {article.excerpt && (
                        <motion.p 
                          className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {article.excerpt}
                        </motion.p>
                      )}
                    </div>
                  </Link>
                  <motion.div 
                    className="flex-shrink-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <FavoriteButton contentId={article._id} contentType="article" />
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}