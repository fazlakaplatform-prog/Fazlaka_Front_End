"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchPlaylists, Playlist } from "@/lib/sanity";

// تعريف نوع موسع للتعامل مع الصور المختلفة
type PlaylistWithImage = Playlist & {
  imageUrl?: string;
  image?: { url?: string };
  coverImage?: { url?: string };
  thumbnail?: { url?: string };
  cover?: { asset?: { url?: string } };
};

const PlaylistsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  
  useEffect(() => {
    async function fetchPlaylistsData() {
      try {
        const data = await fetchPlaylists();
        setPlaylists(data);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlaylistsData();
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      (playlist.title || "")
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center mt-10 text-gray-700 dark:text-gray-200">جاري التحميل...</div>;
  }

  if (playlists.length === 0) {
    return <p className="text-center mt-10 text-gray-600 dark:text-gray-400">لا توجد قوائم حاليًا</p>;
  }

  // دالة للحصول على رابط الصورة من كائن Playlist
  const getImageUrl = (playlist: Playlist): string | null => {
    const playlistWithImage = playlist as PlaylistWithImage;
    
    if (playlistWithImage.imageUrl) return playlistWithImage.imageUrl;
    if (playlistWithImage.image?.url) return playlistWithImage.image.url;
    if (playlistWithImage.coverImage?.url) return playlistWithImage.coverImage.url;
    if (playlistWithImage.thumbnail?.url) return playlistWithImage.thumbnail.url;
    if (playlistWithImage.cover?.asset?.url) return playlistWithImage.cover.asset.url;
    
    return null;
  };

  return (
    <div className="container mx-auto py-8 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-6">قوائم التشغيل</h1>
      
      {/* البحث بجانب أزرار العرض */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        {/* شريط البحث المحسن مع الظل وزر المسح */}
        <div className="relative flex-grow max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث عن قائمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 rounded-xl outline-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-md hover:shadow-lg transition-all duration-300"
              aria-label="بحث عن قائمة"
            />
            {/* أيقونة البحث */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* زر المسح بشكل X */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-100 dark:bg-gray-700 rounded-full p-1 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
                aria-label="مسح البحث"
                title="مسح البحث"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {/* عنوان البحث */}
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            ابحث في قوائم التشغيل حسب العنوان
          </div>
        </div>
        
        {/* أزرار العرض بجانب البحث مع الأيقونات */}
        <div className="inline-flex items-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-4 py-3 text-sm transition ${
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
            className={`flex items-center gap-2 px-4 py-3 text-sm transition ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
      
      {/* محتوى القوائم مع الرسوم المتحركة */}
      <div className={`${fadeIn ? "opacity-100" : "opacity-0"} transition-opacity duration-500`} style={{ minHeight: "200px" }}>
        {filteredPlaylists.length === 0 ? (
          <p className="text-center mt-10 text-gray-600 dark:text-gray-400">لا توجد نتائج مطابقة للبحث</p>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlaylists.map((playlist) => {
              const imageUrl = getImageUrl(playlist);
              return (
                <Link
                  key={playlist._id || playlist.slug?.current}
                  href={`/playlists/${playlist.slug?.current}`}
                  className="block border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  {imageUrl && (
                    <div className="w-full h-48 relative">
                      <Image
                        src={imageUrl}
                        alt={playlist.title}
                        fill
                        className="object-cover bg-gray-100 dark:bg-gray-700 transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{playlist.title}</h2>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlaylists.map((playlist) => {
              const imageUrl = getImageUrl(playlist);
              return (
                <Link
                  key={playlist._id || playlist.slug?.current}
                  href={`/playlists/${playlist.slug?.current}`}
                  className="flex gap-4 items-center border rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  {imageUrl && (
                    <div className="w-32 h-20 relative">
                      <Image
                        src={imageUrl}
                        alt={playlist.title}
                        fill
                        className="object-cover rounded-lg bg-gray-100 dark:bg-gray-700 transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{playlist.title}</h2>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistsPage;