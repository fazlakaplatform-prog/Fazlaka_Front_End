"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/ImageWithFallback";
import FavoriteButton from "@/components/FavoriteButton";
import { motion, Variants } from "framer-motion";
import { fetchPlaylistBySlug } from "@/lib/sanity";

// تعريف الواجهات
interface Playlist {
  _id: string;
  slug: { current: string };
  title: string;
  description?: string;
  imageUrl?: string;
  episodes?: Episode[];
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

interface Props {
  params: Promise<{ id: string }>;
}

export default function PlaylistDetails({ params }: Props) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
  
  // دالة لمسح البحث
  const clearSearch = () => {
    setSearchTerm("");
  };
  
  if (loading) return <div className="text-center mt-10 text-gray-700 dark:text-gray-200">جاري التحميل...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;
  if (!playlist) return <p className="text-center mt-10 text-gray-600 dark:text-gray-400">القائمة غير موجودة</p>;
  
  // framer-motion variants
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        delay: i * 0.05, 
        duration: 0.5, 
        ease: "easeOut" as const
      } 
    }),
    hover: { 
      scale: 1.03, 
      y: -8,
      transition: { 
        duration: 0.3, 
        ease: "easeInOut" as const
      }
    },
  };
  
  const listVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0,
      transition: { 
        delay: i * 0.03, 
        duration: 0.4,
        ease: "easeOut" as const
      } 
    }),
    hover: { 
      x: 8,
      transition: { 
        duration: 0.2,
        ease: "easeInOut" as const
      }
    },
  };
  
  const playIconVariants: Variants = {
    rest: { scale: 0.9, opacity: 0.7 },
    hover: { 
      scale: 1.1, 
      opacity: 1,
      transition: { 
        duration: 0.2,
        ease: "easeInOut" as const
      }
    },
  };
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section - Improved */}
      <motion.div 
        className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 rounded-3xl p-10 mb-12 shadow-2xl overflow-hidden text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* إضافة عناصر زخرفية خلفية */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative max-w-4xl mx-auto text-center z-10">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <span className="text-sm font-medium">قائمة التشغيل</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
            {playlist.title}
          </h1>
          
          <div className="w-24 h-1 bg-white/50 mx-auto mb-6 rounded-full"></div>
          
          <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            {playlist.description}
          </p>
          
          <div className="mt-8 flex justify-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{playlist.episodes?.length || 0} حلقة</span>
            </div>
          </div>
        </div>
        
        {/* إضافة عنصر زخرفي سفلي */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/10 to-transparent"></div>
      </motion.div>
      
      {/* search + view toggle - Improved */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="ابحث عن حلقة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-10 py-3 rounded-xl outline-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 transition shadow-sm hover:shadow-md focus:shadow-lg"
          />
          {searchTerm && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 left-0 flex items-center pl-3"
              aria-label="مسح البحث"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="inline-flex items-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-4 py-3 text-sm transition ${
              viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            aria-pressed={viewMode === "grid"}
            title="عرض شبكي"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" />
            </svg>
            <span className="hidden sm:inline">شبكي</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-3 text-sm transition ${
              viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            aria-pressed={viewMode === "list"}
            title="عرض قائمة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">قائمة</span>
          </motion.button>
        </div>
      </motion.div>
      
      {/* content */}
      {filteredEpisodes.length === 0 ? (
        <motion.p 
          className="text-center text-gray-600 dark:text-gray-400 py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          لا توجد حلقات تطابق البحث
        </motion.p>
      ) : viewMode === "grid" ? (
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredEpisodes.map((ep, idx) => {
            const slug = encodeURIComponent(ep.slug.current);
            const thumbnailUrl = ep.imageUrl || "/placeholder.png";
            return (
              <motion.article
                key={ep._id}
                custom={idx}
                variants={cardVariants}
                whileHover="hover"
                className="relative border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 group"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <motion.div 
                        variants={playIconVariants}
                        initial="rest"
                        whileHover="hover"
                        className="w-16 h-16 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{ep.title}</h2>
                  </div>
                </Link>
                <div className="p-3 pt-0 flex items-center justify-end border-t border-gray-100 dark:border-gray-700">
                  <FavoriteButton contentId={ep._id} contentType="episode" />
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      ) : (
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredEpisodes.map((ep, idx) => {
            const slug = encodeURIComponent(ep.slug.current);
            const thumbnailUrl = ep.imageUrl || "/placeholder.png";
            return (
              <motion.div
                key={ep._id}
                custom={idx}
                variants={listVariants}
                whileHover="hover"
                className="flex gap-4 items-center border rounded-xl overflow-hidden p-4 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
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
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{ep.title}</h3>
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
  );
}