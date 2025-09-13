"use client";
import React, { useEffect, useMemo, useState } from "react";
import { use } from "react";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import ImageWithFallback from "@/components/ImageWithFallback";
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? process.env.STRAPI_URL ?? "http://localhost:1337";
function buildMediaUrl(path?: string) {
  if (!path) return "/placeholder.png";
  if (typeof path === "string" && (path.startsWith("http://") || path.startsWith("https://"))) return path;
  return `${STRAPI_URL}${path}`;
}
/**
 * Normalize arbitrary text for search:
 * - handle objects/arrays (join their values)
 * - normalize Arabic letters (أإآ -> ا, ى -> ي, ة -> ه, remove tatweel)
 * - convert Arabic-Indic digits to latin digits
 * - remove diacritics (NFD) and non-letter/number characters
 * - collapse whitespace and lowercase
 */
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
// helper to flatten nested objects/arrays (one level deep)
function flattenObj(obj: unknown): Record<string, unknown> {
  if (obj === null || obj === undefined) return { "": "" };
  if (Array.isArray(obj)) return obj.reduce((acc, v, i) => ({ ...acc, [i]: v }), {});
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj as object)) {
      const v = (obj as Record<string, unknown>)[k];
      if (typeof v === "string" || typeof v === "number") out[k] = v;
      else if (typeof v === "object" && v !== null) {
        // تعريف واجهة للبيانات المتداخلة
        interface DataWithAttributes {
          data?: {
            attributes?: Record<string, unknown>;
          };
        }
        // استخدام الواجهة الجديدة بدلاً من any
        const dataObj = v as DataWithAttributes;
        if (dataObj?.data?.attributes) {
          out[k] = JSON.stringify(dataObj.data.attributes);
        } else {
          out[k] = JSON.stringify(v);
        }
      } else out[k] = String(v);
    }
    return out;
  }
  return { "": String(obj) };
}
interface SeasonProps {
  params: Promise<{ slug: string }>;
}
// Define interfaces for our data structures
interface ThumbnailAttributes {
  formats?: {
    medium?: { url: string };
    thumbnail?: { url: string };
  };
  url: string;
}
interface ThumbnailData {
  attributes: ThumbnailAttributes;
}
interface SeasonAttributes {
  title?: string;
  description?: string;
  thumbnail?: ThumbnailData | { data: { attributes: ThumbnailAttributes } } | ThumbnailAttributes;
}
// Updated SeasonData to include attributes at top level
interface SeasonData {
  id: string;
  attributes?: SeasonAttributes;
  title?: string;
  description?: string;
  thumbnail?: ThumbnailData | { data: { attributes: ThumbnailAttributes } } | ThumbnailAttributes;
}
interface EpisodeAttributes {
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  slug?: string;
  thumbnail?: ThumbnailData | { data: { attributes: ThumbnailAttributes } } | ThumbnailAttributes;
}
// Updated EpisodeData to include attributes at top level
interface EpisodeData {
  id: string;
  attributes?: EpisodeAttributes;
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  slug?: string;
  thumbnail?: ThumbnailData | { data: { attributes: ThumbnailAttributes } } | ThumbnailAttributes;
}

// Helper function to extract thumbnail attributes safely
function extractThumbnailAttributes(thumb: SeasonAttributes['thumbnail'] | EpisodeAttributes['thumbnail']): ThumbnailAttributes | undefined {
  if (!thumb) return undefined;
  
  // Case 1: Nested structure with data.attributes
  if ('data' in thumb && thumb.data && 'attributes' in thumb.data) {
    return thumb.data.attributes;
  }
  
  // Case 2: Direct attributes property
  if ('attributes' in thumb) {
    return thumb.attributes;
  }
  
  // Case 3: Direct ThumbnailAttributes
  return thumb as ThumbnailAttributes;
}

export default function SeasonPageClient({ params }: SeasonProps) {
  const { slug } = use(params);
  const [season, setSeason] = useState<SeasonData | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // UI state
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
        const seasonRes = await fetch(
          `${STRAPI_URL}/api/seasons?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=thumbnail`,
          { cache: "no-store" }
        );
        if (!seasonRes.ok) throw new Error(`Failed to fetch season: ${seasonRes.status}`);
        const seasonJson = await seasonRes.json();
        const seasonData = seasonJson.data?.[0];
        if (!seasonData) throw new Error("Season not found");
        setSeason(seasonData);
        const seasonId = seasonData.id;
        const episodesRes = await fetch(
          `${STRAPI_URL}/api/episodes?filters[season][id][$eq]=${seasonId}&populate=thumbnail&sort[0]=publishedAt:desc`,
          { cache: "no-store" }
        );
        if (!episodesRes.ok) throw new Error(`Failed to fetch episodes: ${episodesRes.status}`);
        const episodesJson = await episodesRes.json();
        setEpisodes(episodesJson.data || []);
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
  // build a searchable string for an episode (title, name, description, slug, any nested text)
  function getSearchableText(ep: EpisodeData) {
    const attrs = ep.attributes ? ep.attributes : ep;
    const candidates = [
      attrs.title ?? attrs.name ?? "",
      attrs.description ?? "",
      attrs.summary ?? "",
      attrs.slug ?? "",
      // sometimes Strapi translations or nested objects:
      JSON.stringify(attrs)
    ];
    return candidates.join(" ");
  }
  const filteredEpisodes = useMemo(() => {
    const q = normalizeForSearch(debouncedSearch);
    if (!q) return episodes;
    const tokens = q.split(" ").filter(Boolean);
    return episodes.filter((ep) => {
      const hay = normalizeForSearch(getSearchableText(ep));
      // require every token to appear (AND) so "foo bar" matches both
      return tokens.every((t) => hay.includes(t));
    });
  }, [episodes, debouncedSearch]);
  if (loading) return <div className="text-center p-6 text-gray-700 dark:text-gray-200">جاري التحميل...</div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;
  if (!season) return <div className="text-center p-6 text-gray-600 dark:text-gray-400">الموسم غير موجود</div>;
  // Extract season attributes with proper type handling
  const seasonAttrs = season.attributes ? season.attributes : season;
  const seasonTitle = seasonAttrs.title ?? "موسم";
  const seasonDescription = seasonAttrs.description ?? "";
  
  // Extract thumbnail with proper type handling
  const thumbRel = extractThumbnailAttributes(seasonAttrs.thumbnail);
  const thumbPath = thumbRel?.formats?.medium?.url ?? thumbRel?.formats?.thumbnail?.url ?? thumbRel?.url ?? undefined;
  const seasonThumbnailUrl = buildMediaUrl(thumbPath);
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Season info - Improved Hero Section */}
      <div className="relative rounded-2xl overflow-hidden mb-10 shadow-xl">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 z-10"></div>
        
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
          {/* Thumbnail with enhanced styling */}
          <div className="md:w-2/5 lg:w-1/3 flex-shrink-0">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-300 group-hover:scale-[1.02]">
                <ImageWithFallback 
                  src={seasonThumbnailUrl} 
                  alt={seasonTitle} 
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Text content with enhanced styling */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full mb-4 self-start">
              موسم
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">{seasonTitle}</h1>
            <p className="text-lg text-gray-100 mb-6 max-w-2xl leading-relaxed">{seasonDescription}</p>
            
            {/* Stats and meta info */}
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-white font-medium">{episodes.length} حلقة</span>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/episodes"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-medium rounded-lg text-sm hover:bg-blue-50 transition shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                جميع الحلقات
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative max-w-md flex-1">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن حلقة..."
              dir="rtl"
              className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 outline-none transition"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          <div className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              title="عرض شبكي"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              title="عرض قائمة"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Episodes */}
      {filteredEpisodes.length === 0 ? (
        <p className="text-center p-6 text-gray-600 dark:text-gray-400">لا توجد حلقات مطابقة للبحث</p>
      ) : viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEpisodes.map((ep: EpisodeData) => {
            const attrs = ep.attributes ? ep.attributes : ep;
            const title = attrs.title ?? attrs.name ?? "حلقة";
            // Extract thumbnail with proper type handling
            const thumbRel = extractThumbnailAttributes(attrs.thumbnail);
            const thumbPath = thumbRel?.formats?.medium?.url ?? thumbRel?.formats?.thumbnail?.url ?? thumbRel?.url ?? undefined;
            const thumbnailUrl = buildMediaUrl(thumbPath ?? undefined);
            const slug = attrs.slug ?? ep.id;
            return (
              <div key={ep.id} className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition flex flex-col">
                <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                  <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-48 object-cover bg-gray-100 dark:bg-gray-700" />
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                  </div>
                </Link>
                <div className="p-4 border-t mt-auto">
                  <FavoriteButton episodeId={Number(ep.id)} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEpisodes.map((ep: EpisodeData) => {
            const attrs = ep.attributes ? ep.attributes : ep;
            const title = attrs.title ?? attrs.name ?? "حلقة";
            // Extract thumbnail with proper type handling
            const thumbRel = extractThumbnailAttributes(attrs.thumbnail);
            const thumbPath = thumbRel?.formats?.medium?.url ?? thumbRel?.formats?.thumbnail?.url ?? thumbRel?.url ?? undefined;
            const thumbnailUrl = buildMediaUrl(thumbPath ?? undefined);
            const slug = attrs.slug ?? ep.id;
            return (
              <Link key={ep.id} href={`/episodes/${encodeURIComponent(String(slug))}`} className="flex gap-4 items-center border rounded-lg p-3 hover:shadow transition bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="w-36 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{title}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}