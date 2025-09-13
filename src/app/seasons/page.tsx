"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/ImageWithFallback";
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? process.env.STRAPI_URL ?? "http://localhost:1337";
// تعريف الواجهات
interface Thumbnail {
  formats?: {
    medium?: { url: string };
    thumbnail?: { url: string };
  };
  url?: string;
  data?: {
    attributes: Thumbnail;
  };
}
interface Season {
  id: number;
  title?: string;
  name?: string;
  slug?: string | number;
  thumbnail?: Thumbnail;
  attributes?: {
    title?: string;
    name?: string;
    slug?: string | number;
    thumbnail?: Thumbnail;
  };
}
interface Episode {
  id: number;
  season?: {
    id?: number;
    data?: {
      id?: number;
    };
    attributes?: {
      id?: number;
    };
  };
  attributes?: {
    season?: {
      id?: number;
      data?: {
        id?: number;
      };
    };
  };
}
function buildMediaUrl(path?: string) {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STRAPI_URL}${path}`;
}
/** Normalize string for searching (remove diacritics, non letters/numbers, lowercase) */
function normalizeForSearch(s?: string) {
  if (!s) return "";
  try {
    return s
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  } catch {
    return s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  }
}
// دالة مساعدة لاستخراج مسار الصورة المصغرة
function getThumbnailPath(season: Season): string | undefined {
  // الحالة الأولى: الصورة في data.attributes
  if (season.thumbnail?.data?.attributes) {
    const ta = season.thumbnail.data.attributes;
    return ta.formats?.medium?.url ?? ta.formats?.thumbnail?.url ?? ta.url;
  }
  
  // الحالة الثانية: الصورة مباشرة في thumbnail
  if (season.thumbnail) {
    const t = season.thumbnail;
    return t.formats?.medium?.url ?? t.formats?.thumbnail?.url ?? t.url;
  }
  
  // الحالة الثالثة: الصورة في attributes.thumbnail
  if (season.attributes?.thumbnail) {
    const ta = season.attributes.thumbnail;
    return ta.formats?.medium?.url ?? ta.formats?.thumbnail?.url ?? ta.url;
  }
  
  return undefined;
}
export default function SeasonsPageClient() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodeCounts, setEpisodeCounts] = useState<Record<string | number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [fadeIn, setFadeIn] = useState(false);
  
  // debounce search input (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);
  
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const seasonsRes = await fetch(`${STRAPI_URL}/api/seasons?populate=thumbnail&sort[0]=publishedAt:desc`, { cache: "no-store" });
        if (!seasonsRes.ok) {
          const t = await seasonsRes.text();
          throw new Error(`Failed to fetch seasons: ${seasonsRes.status} - ${t}`);
        }
        const seasonsJson = await seasonsRes.json();
        const seasonsData: Season[] = seasonsJson?.data ?? [];
        
        const episodesRes = await fetch(`${STRAPI_URL}/api/episodes?populate=season&pagination[limit]=1000`, { cache: "no-store" });
        if (!episodesRes.ok) {
          const t = await episodesRes.text();
          throw new Error(`Failed to fetch episodes: ${episodesRes.status} - ${t}`);
        }
        const episodesJson = await episodesRes.json();
        const episodesData: Episode[] = episodesJson?.data ?? [];
        
        // Count episodes per season
        const counts: Record<string | number, number> = {};
        episodesData.forEach((ep: Episode) => {
          // استخراج معرف الموسم بطريقة آمنة
          const seasonId = 
            ep.attributes?.season?.data?.id ?? 
            ep.attributes?.season?.id ?? 
            ep.season?.data?.id ?? 
            ep.season?.id;
            
          if (seasonId) {
            counts[seasonId] = (counts[seasonId] || 0) + 1;
          }
        });
        
        // Normalize seasons
        const normalizedSeasons: Season[] = seasonsData.map((s: Season) => 
          s.attributes ? { id: s.id, ...s.attributes } : s
        );
        
        setSeasons(normalizedSeasons);
        setEpisodeCounts(counts);
        setError(null);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
        setSeasons([]);
        setEpisodeCounts({});
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
  
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFadeIn(true), 40);
      return () => clearTimeout(t);
    }
  }, [loading]);
  
  // Filtered array (uses normalized strings)
  const filtered = useMemo(() => {
    const q = normalizeForSearch(debouncedSearch);
    if (!q) return seasons;
    return seasons.filter((s: Season) => {
      const title = normalizeForSearch(s.title ?? s.name ?? "");
      const slug = normalizeForSearch(String(s.slug ?? ""));
      const idStr = normalizeForSearch(String(s.id ?? ""));
      return title.includes(q) || slug.includes(q) || idStr.includes(q);
    });
  }, [seasons, debouncedSearch]);
  
  const isSearching = debouncedSearch.trim() !== "";
  
  if (loading) return <div className="text-center p-6 text-gray-700 dark:text-gray-200">جاري التحميل...</div>;
  if (error)
    return (
      <div className="container mx-auto py-8">
        <p className="text-center p-6 text-red-500">حدث خطأ في تحميل المواسم</p>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">المواسم</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">قائمة المواسم وعدد الحلقات لكل موسم</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* زر جديد: جميع الحلقات */}
          <Link href="/episodes" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            جميع الحلقات
          </Link>
          <div className="relative max-w-md flex-1">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن موسم (العنوان، الوصف، slug أو رقم)..."
              className="w-full pl-10 pr-10 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 outline-none transition"
              aria-label="ابحث عن موسم"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {searchTerm && (
              <button onClick={() => { setSearchTerm(""); setDebouncedSearch(""); }} className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition" aria-label="مسح البحث">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              aria-pressed={viewMode === "grid"}
              title="عرض شبكي"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" />
              </svg>
              <span className="hidden sm:inline">شبكي</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              aria-pressed={viewMode === "list"}
              title="عرض قائمة"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">قائمة</span>
            </button>
          </div>
        </div>
      </div>
      {/* Dedicated search results area: appears only when user searched */}
      {isSearching ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">نتائج البحث عن</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                «{debouncedSearch}» <span className="text-sm text-gray-600 dark:text-gray-400">({filtered.length})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSearchTerm(""); setDebouncedSearch(""); }}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                مسح البحث
              </button>
              <button
                onClick={() => { setSearchTerm(""); setDebouncedSearch(""); }}
                className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition"
                title="عرض الكل"
              >
                عرض الكل
              </button>
            </div>
          </div>
          <div className="transition-opacity duration-300">
            {filtered.length === 0 ? (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
                لا توجد مواسم مطابقة للبحث
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((season: Season) => {
                  const slug = season.slug ?? season.id;
                  const title = season.title ?? season.name ?? "موسم";
                  const thumbnailUrl = buildMediaUrl(getThumbnailPath(season));
                  const count = episodeCounts[season.id] || episodeCounts[season?.id?.toString?.()] || 0;
                  return (
                    <Link key={season.id} href={`/seasons/${encodeURIComponent(String(slug))}`} className="block border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-48 object-cover bg-gray-100 dark:bg-gray-700" />
                      <div className="p-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">عدد الحلقات: {count}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((season: Season) => {
                  const slug = season.slug ?? season.id;
                  const title = season.title ?? season.name ?? "موسم";
                  const thumbnailUrl = buildMediaUrl(getThumbnailPath(season));
                  const count = episodeCounts[season.id] || episodeCounts[season?.id?.toString?.()] || 0;
                  return (
                    <Link key={season.id} href={`/seasons/${encodeURIComponent(String(slug))}`} className="flex gap-4 items-center border rounded-lg p-3 hover:shadow transition bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <div className="w-36 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{title}</h3>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">عدد الحلقات: {count}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
      {/* Main seasons list (shown only when not searching) */}
      {!isSearching && (
        <div className={`${fadeIn ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
          {seasons.length === 0 ? (
            <p className="text-center p-6 text-gray-600 dark:text-gray-400">لا توجد مواسم حالياً</p>
          ) : viewMode === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seasons.map((season: Season) => {
                const slug = season.slug ?? season.id;
                const title = season.title ?? season.name ?? "موسم";
                const thumbnailUrl = buildMediaUrl(getThumbnailPath(season));
                const count = episodeCounts[season.id] || episodeCounts[season?.id?.toString?.()] || 0;
                return (
                  <Link key={season.id} href={`/seasons/${encodeURIComponent(String(slug))}`} className="block border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-48 object-cover bg-gray-100 dark:bg-gray-700" />
                    <div className="p-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">عدد الحلقات: {count}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {seasons.map((season: Season) => {
                const slug = season.slug ?? season.id;
                const title = season.title ?? season.name ?? "موسم";
                const thumbnailUrl = buildMediaUrl(getThumbnailPath(season));
                const count = episodeCounts[season.id] || episodeCounts[season?.id?.toString?.()] || 0;
                return (
                  <Link key={season.id} href={`/seasons/${encodeURIComponent(String(slug))}`} className="flex gap-4 items-center border rounded-lg p-3 hover:shadow transition bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="w-36 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{title}</h3>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">عدد الحلقات: {count}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}