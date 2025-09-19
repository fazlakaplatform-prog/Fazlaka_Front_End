"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ImageWithFallback from "@/components/ImageWithFallback";
import { fetchFromSanity, urlFor } from "@/lib/sanity";
import FavoriteButton from "@/components/FavoriteButton";

// تعريف واجهات البيانات
interface Article {
  _id: string;
  title?: string;
  excerpt?: string;
  slug?: {
    current: string;
  };
  featuredImage?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  episode?: {
    _id: string;
    title: string;
    slug: {
      current: string;
    };
  };
}

// تعريف واجهة لصورة Sanity
interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
}

function buildMediaUrl(image?: SanityImage) {
  if (!image) return "/placeholder.png";
  return urlFor(image) || "/placeholder.png";
}

function escapeRegExp(str = "") {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlighted(text: string, q: string) {
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
function IconArticles({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
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

// تحسين أيقونة الشبكة
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

// تحسين أيقونة القائمة
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

export default function ArticlesPageClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const articlesPerPage = 12;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const start = (currentPage - 1) * articlesPerPage;
        
        // استعلام Sanity لجلب المقالات مع الحلقات المرتبطة
        const query = `*[_type == "article"] | order(publishedAt desc) [${start}...${start + articlesPerPage}] {
          _id,
          title,
          excerpt,
          slug,
          featuredImage {
            _type,
            asset
          },
          episode-> {
            _id,
            title,
            slug
          }
        }`;
        
        const data = await fetchFromSanity(query) as Article[]; // Cast to Article[]
        setArticles(Array.isArray(data) ? data : []); // Ensure it's an array
        
        // استعلام للحصول على العدد الإجمالي للصفحات
        const countQuery = `count(*[_type == "article"])`;
        const totalCount = await fetchFromSanity(countQuery) as number;
        setTotalPages(Math.ceil(totalCount / articlesPerPage));
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error(err);
        setError("حدث خطأ في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [currentPage]);

  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) return articles;
    const q = searchTerm.trim().toLowerCase();
    return articles.filter((article: Article) => {
      const title = (article.title || "").toString().toLowerCase();
      const excerpt = (article.excerpt || "").toString().toLowerCase();
      return title.includes(q) || excerpt.includes(q);
    });
  }, [articles, searchTerm]);

  if (loading) return <p className="text-center p-6 text-gray-700 dark:text-gray-200">جارٍ التحميل...</p>;
  if (error) return <p className="text-center p-6 text-red-500">{error}</p>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* رأس الصفحة */}
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">جميع المقالات</h1>
        
        {/* مربع البحث والأزرار - تحسين للموبايل */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-sm px-3 py-2 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-200 flex-grow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              aria-label="بحث في المقالات"
              className="bg-transparent outline-none flex-grow text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 py-1"
              placeholder="ابحث عن عنوان أو ملخص..."
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
          
          {/* أزرار التحكم - تحسين للموبايل */}
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
            
            {/* رابط المفضلة والحلقات */}
            <Link href="/favorites" className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs sm:text-sm">مفضلاتي</span>
            </Link>
            <Link href="/episodes" className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="text-xs sm:text-sm">الحلقات</span>
            </Link>
          </div>
        </div>
        
        {/* عدد النتائج - تحسين للموبايل */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredArticles.length} نتيجة
        </div>
      </div>
      
      {/* قائمة المقالات */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L15 12l-5.25-5" />
            </svg>
            <div className="mt-4 text-gray-600 dark:text-gray-300">لم نتمكن من العثور على مقالات تطابق بحثك.</div>
            <div className="mt-2 text-sm text-gray-400 dark:text-gray-500">جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية.</div>
          </div>
        ) : (
          viewMode === "grid" ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {filteredArticles.map((article: Article) => {
                const slug = article.slug?.current || article._id;
                const title = article.title || "مقال";
                const excerpt = article.excerpt || "";
                const episode = article.episode; // الحلقة المرتبطة
                let thumbnailUrl = "/placeholder.png";
                if (article.featuredImage) {
                  thumbnailUrl = buildMediaUrl(article.featuredImage);
                }
                return (
                  <motion.article
                    key={article._id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    layout
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col bg-white dark:bg-gray-800"
                  >
                    <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block group">
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                        <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{excerpt}</p>
                        
                        {/* عرض الحلقة المرتبطة */}
                        {episode && (
                          <div className="mt-2 flex items-center gap-1">
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                              حلقة: {episode.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="mt-auto p-3 pt-1 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <IconArticles className="h-4 w-4" />
                      </div>
                      <FavoriteButton contentId={article._id} contentType="article" />
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
              {filteredArticles.map((article: Article) => {
                const slug = article.slug?.current || article._id;
                const title = article.title || "مقال";
                const excerpt = article.excerpt || "";
                const episode = article.episode; // الحلقة المرتبطة
                let thumbnailUrl = "/placeholder.png";
                if (article.featuredImage) {
                  thumbnailUrl = buildMediaUrl(article.featuredImage);
                }
                return (
                  <motion.div
                    key={article._id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    layout
                    className="flex gap-3 items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-3 hover:shadow transition bg-white dark:bg-gray-800"
                  >
                    <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="flex items-center gap-3 flex-1 group">
                      <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" fill sizes="240px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2">{renderHighlighted(title, searchTerm)}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{excerpt}</p>
                        
                        {/* عرض الحلقة المرتبطة */}
                        {episode && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                              حلقة: {episode.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-shrink-0">
                      <FavoriteButton contentId={article._id} contentType="article" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )
        )}
      </div>
      
      {/* ترقيم الصفحات */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}