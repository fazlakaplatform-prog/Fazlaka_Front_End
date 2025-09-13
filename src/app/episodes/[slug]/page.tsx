// src/app/episodes/[slug]/page.tsx
"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema } from "hast-util-sanitize";
import { useParams, useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
// Components
import FavoriteButton from "@/components/FavoriteButton";
// Icons
import { FaPlay, FaShare, FaArrowLeft, FaClock, FaComment, FaStar, FaFileAlt } from "react-icons/fa";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "https://growing-acoustics-35909e61eb.strapiapp.com";

// تعريف الأنواع
interface Thumbnail {
  url?: string;
  formats?: {
    small?: { url?: string };
    thumbnail?: { url?: string };
    medium?: { url?: string };
    large?: { url?: string };
  };
}

interface Season {
  id: number | string;
  title: string;
  slug?: string;
  thumbnail?: Thumbnail | null;
}

interface Episode {
  id: number;
  documentId: string;
  title?: string;
  name?: string;
  slug?: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  url?: string;
  thumbnail?: Thumbnail | null;
  season?: Season | null;
  articles?: Article[];
}

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: Thumbnail | null;
}

interface SuggestedItem {
  id: number | string;
  title: string;
  slug: number | string;
  thumb: string;
}

interface ArticleItem {
  id: number | string;
  title: string;
  slug: number | string;
  excerpt: string;
  featuredImage: string;
}

interface Comment {
  id: number | string;
  attributes?: {
    content?: string;
    name?: string;
    createdAt?: string;
  };
  content?: string;
  name?: string;
  createdAt?: string | Date;
}

// أنواع لعناصر Markdown
interface MarkdownNode {
  type: string;
  tagName?: string;
  children?: MarkdownNode[];
}

interface MarkdownParagraphProps {
  children?: React.ReactNode;
  node?: MarkdownNode;
}

// تعريف نوع props لمكون الصورة في Markdown - متوافق مع ReactMarkdown
interface MarkdownImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | Blob;
  alt?: string;
  width?: number | string;
  height?: number | string;
}

// Schema for markdown
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "u"],
  attributes: {
    ...defaultSchema.attributes,
    u: [],
  },
};

function buildMediaUrl(path?: string): string {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STRAPI_URL}${path}`;
}

function toEmbed(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  } catch {
    return url;
  }
}

// مكون التعليقات المدمج
function CommentsClient({ 
  contentId, 
  type = "episode" 
}: { 
  contentId: string; 
  type?: "article" | "episode" 
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { user } = useUser();
  
  const fetchComments = useCallback(async () => {
    try {
      // تعديل الرابط بناءً على نوع المحتوى (مقال أو حلقة)
      const res = await fetch(`/api/comments?${type}Id=${contentId}`);
      const json = await res.json();
      setComments(json.data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }, [contentId, type]);
  
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!content.trim()) {
      setErrorMsg("اكتب تعليقاً قبل الإرسال.");
      return;
    }
    if (!user) {
      setErrorMsg("يجب تسجيل الدخول لإرسال تعليق.");
      return;
    }
    setLoading(true);
    
    // استخدام documentId مباشرة بدون تحويل لرقم
    const payload = {
      content,
      // تعديل الحقل بناءً على نوع المحتوى
      ...(type === "article" ? { articleId: contentId } : { episodeId: contentId }),
      name: user.firstName || (user.fullName as string) || "مستخدم",
      email: user.emailAddresses?.[0]?.emailAddress || "",
    };
    
    console.log("Sending payload:", payload); // للت debugging
    
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let json: Record<string, unknown> | null = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { raw: text };
      }
      if (res.ok) {
        setContent("");
        fetchComments();
      } else {
        console.error("خطأ في الإرسال:", res.status, json);
        if (json && typeof json === 'object' && 'details' in json) {
          setErrorMsg("فشل الإرسال — تفاصيل: " + JSON.stringify(json.details));
        } else if (json && typeof json === 'object' && 'error' in json) {
          setErrorMsg("فشل الإرسال — " + JSON.stringify(json.error));
        } else {
          setErrorMsg(`فشل الإرسال (${res.status})`);
        }
      }
    } catch (err: unknown) {
      console.error("خطأ غير متوقع في الإرسال:", err);
      setErrorMsg("حدث خطأ غير متوقع أثناء الإرسال.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mt-6 border rounded p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
      <SignedOut>
        <div className="mb-4">
          <p className="mb-2">يجب تسجيل الدخول لكي تتمكن من إرسال تعليق.</p>
          <Link
            href="/sign-in"
            className="px-3 py-2 bg-blue-600 dark:bg-blue-500 hover:opacity-95 text-white rounded inline-block"
          >
            تسجيل الدخول
          </Link>
        </div>
      </SignedOut>
      <SignedIn>
        <form onSubmit={handleSubmit} className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full border p-2 rounded mb-2 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="اكتب تعليقك هنا..."
            required
            disabled={loading}
            aria-label="تعليق"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded text-white ${
                loading
                  ? "bg-gray-400 dark:bg-gray-600"
                  : "bg-blue-600 dark:bg-blue-500 hover:opacity-95"
              }`}
              aria-busy={loading}
            >
              {loading ? "جاري الإرسال..." : "أرسل التعليق"}
            </button>
            {errorMsg && (
              <p className="text-sm text-red-600 dark:text-red-400 break-words max-w-xl">{errorMsg}</p>
            )}
          </div>
        </form>
      </SignedIn>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {comments.length === 0 && <p className="text-gray-600 dark:text-gray-300">لا توجد تعليقات بعد.</p>}
        {comments.map((c: Comment) => {
          const contentText = c.attributes?.content ?? c.content ?? "";
          const author = c.attributes?.name ?? c.name ?? "مستخدم";
          const createdAt = new Date(c.attributes?.createdAt ?? c.createdAt ?? Date.now());
          return (
            <div key={c.id?.toString() ?? `${createdAt.getTime()}`} className="py-3">
              <p className="text-sm text-gray-700 dark:text-gray-200">{contentText}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{author}</span>
                <span> · </span>
                <time dateTime={createdAt.toISOString()}>{createdAt.toLocaleString()}</time>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EpisodeDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = params?.slug;
  const slugOrId = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug ?? "";
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [suggested, setSuggested] = useState<SuggestedItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Swiper navigation refs
  const navPrevRef = useRef<HTMLButtonElement | null>(null);
  const navNextRef = useRef<HTMLButtonElement | null>(null);
  
  // Parallax for Hero
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 100]);
  
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setEpisode(null);
      setSuggested([]);
      setArticles([]);
      try {
        if (!slugOrId) {
          setError("لم يتم تحديد الحلقة");
          setLoading(false);
          return;
        }
        // تحديث الاستعلام ليشمل المقالات المرتبطة
        const qSlug = `${STRAPI_URL}/api/episodes?filters[slug][$eq]=${encodeURIComponent(
          slugOrId
        )}&populate[0]=thumbnail&populate[1]=season.thumbnail&populate[2]=articles.featuredImage`;
        const res = await fetch(qSlug);
        let ep: Episode | null = null;
        if (res.ok) {
          const j = await res.json();
          ep = j.data?.[0] ?? null;
        }
        if (!ep) {
          const maybeId = Number(slugOrId);
          if (!Number.isNaN(maybeId)) {
            const resId = await fetch(
              `${STRAPI_URL}/api/episodes/${maybeId}?populate[0]=thumbnail&populate[1]=season.thumbnail&populate[2]=articles.featuredImage`
            );
            if (resId.ok) {
              const j = await resId.json();
              ep = j.data ?? null;
            }
          }
        }
        if (!ep) throw new Error("الحلقة غير موجودة");
        const built = ep;
        
        // suggested
        const qAll = `${STRAPI_URL}/api/episodes?filters[id][$ne]=${
          built.id
        }&populate=thumbnail&pagination[limit]=20&sort=createdAt:desc`;
        const resAll = await fetch(qAll);
        let arr: SuggestedItem[] = [];
        if (resAll.ok) {
          const j = await resAll.json();
          arr = (j.data ?? []).map((it: Episode) => {
            const epTitle = it.title ?? it.name ?? `حلقة ${it.id}`;
            let epThumb = "/placeholder.png";
            if (it.thumbnail) {
              const eThumb = it.thumbnail;
              const eThumbPath =
                eThumb?.formats?.thumbnail?.url ??
                eThumb?.formats?.small?.url ??
                eThumb?.url ??
                null;
              epThumb = buildMediaUrl(eThumbPath ?? undefined);
            }
            return {
              id: it.id,
              title: epTitle,
              slug: it.slug ?? it.id,
              thumb: epThumb,
            };
          });
        }
        
        // جلب المقالات المرتبطة
        let articlesArr: ArticleItem[] = [];
        if (built.articles && built.articles.length > 0) {
          articlesArr = built.articles.map((article: Article) => {
            const articleTitle = article.title || "مقال";
            const articleSlug = article.slug || article.id;
            const articleExcerpt = article.excerpt || "";
            let articleThumbnailUrl = "/placeholder.png";
            if (article.featuredImage) {
              const articleThumb = article.featuredImage;
              const articleThumbPath =
                articleThumb?.formats?.medium?.url ??
                articleThumb?.formats?.thumbnail?.url ??
                articleThumb?.url ??
                articleThumb?.formats?.small?.url ??
                null;
              articleThumbnailUrl = buildMediaUrl(articleThumbPath ?? undefined);
            }
            return {
              id: article.id,
              title: articleTitle,
              slug: articleSlug,
              excerpt: articleExcerpt,
              featuredImage: articleThumbnailUrl,
            };
          });
        }
        
        if (mounted) {
          setEpisode(built);
          setSuggested(arr);
          setArticles(articlesArr);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (e: unknown) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "خطأ غير معروف");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [slugOrId]);
  
  if (loading)
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-72 w-full rounded-xl mb-4" />
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-6 w-1/2 mx-auto rounded mb-2" />
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-4 w-1/3 mx-auto rounded" />
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="text-blue-600 hover:underline"
        >
          العودة إلى الرئيسية
        </button>
      </div>
    );
  if (!episode) return <div className="p-8 text-center">لم تُعثر على الحلقة.</div>;
  
  const title = episode.title ?? episode.name ?? "بدون عنوان";
  const description = episode.description ?? "";
  const videoUrl = episode.videoUrl ?? episode.url ?? "";
  const embedUrl = toEmbed(videoUrl);
  const season = episode.season;
  const seasonTitle = season?.title ?? "بدون موسم";
  const seasonSlug = season?.slug ?? season?.id;
  
  let thumbnailUrl = "/placeholder.png";
  if (episode.thumbnail) {
    const thumb = episode.thumbnail;
    const thumbPath =
      thumb?.formats?.large?.url ??
      thumb?.formats?.medium?.url ??
      thumb?.formats?.thumbnail?.url ??
      thumb?.url ??
      null;
    thumbnailUrl = buildMediaUrl(thumbPath ?? undefined);
  }
  
  let seasonThumbnailUrl = "/placeholder.png";
  if (season && season.thumbnail) {
    const sThumb = season.thumbnail;
    const sThumbPath =
      sThumb?.formats?.large?.url ??
      sThumb?.formats?.medium?.url ??
      sThumb?.formats?.thumbnail?.url ??
      sThumb?.url ??
      null;
    seasonThumbnailUrl = buildMediaUrl(sThumbPath ?? undefined);
  }
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 min-h-screen">
      {/* HERO */}
      <header className="relative w-full overflow-hidden shadow-2xl">
        <motion.div
          style={{ y }}
          className="relative h-[50vh] md:h-[60vh]"
        >
          <motion.div
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
          <div className="absolute bottom-0 right-0 p-4 md:p-6 lg:p-10 text-right w-full">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-block backdrop-blur-lg bg-black/40 rounded-2xl md:rounded-3xl px-4 md:px-8 py-4 md:py-6 shadow-2xl border border-white/10 max-w-full"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full text-xs font-bold text-white shadow-lg">
                  حلقة جديدة
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold text-white shadow-lg">
                  <FaStar className="text-yellow-300" />
                  مميز
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold leading-tight tracking-wide bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
                {title}
              </h1>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-base md:text-lg lg:text-2xl text-gray-200 font-medium drop-shadow-md">
                  {seasonTitle}
                </p>
                <div className="h-1 w-6 md:w-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute top-4 md:top-6 left-4 md:left-6 z-10"
        >
          <Link
            href="/episodes"
            className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 bg-gradient-to-r from-black/40 to-black/60 backdrop-blur-lg rounded-full text-white hover:from-black/60 hover:to-black/80 transition-all duration-300 shadow-lg border border-white/10 hover:border-white/20"
          >
            <FaArrowLeft className="text-base md:text-lg" />
            <span className="font-medium text-sm md:text-base">العودة للحلقات</span>
          </Link>
        </motion.div>
      </header>
      
      {/* MAIN CONTENT */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* VIDEO SECTION */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              {embedUrl ? (
                <div className="aspect-video w-full bg-black rounded-xl md:rounded-2xl overflow-hidden shadow-2xl transform transition duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,0,0,0.6)] animate-fade-in">
                  <iframe
                    src={embedUrl}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full bg-black rounded-xl md:rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
                  <Image
                    src={thumbnailUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                    >
                      <FaPlay className="text-white text-xl md:text-2xl ml-1" />
                    </motion.div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-3 md:gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <FavoriteButton episodeId={episode.id} />
                </motion.div>
                
                {typeof navigator !== "undefined" && navigator.share && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      navigator.share({
                        title,
                        url: window.location.href,
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <FaShare className="text-base md:text-lg" />
                    <span className="font-medium text-sm md:text-base">مشاركة</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.section>
          
          {/* DESCRIPTION SECTION */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  نبذة عن الحلقة
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              </div>
              
              <div className="prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none text-right">
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-blue-100 dark:border-gray-700 backdrop-blur-md">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
                    components={{
                      p: ({ children, node }: MarkdownParagraphProps) => {
                        // التحقق مما إذا كانت الفقرة تحتوي على صورة فقط
                        const isImageOnly = node?.children?.every(
                          (child: MarkdownNode) => child.type === 'element' && child.tagName === 'img'
                        );
                        
                        if (isImageOnly) {
                          // إذا كانت تحتوي على صورة فقط، عرضها بدون غلاف الفقرة
                          return <>{children}</>;
                        }
                        
                        // خلاف ذلك، عرض كفقرة عادية
                        return <p className="mb-4">{children}</p>;
                      },
                      img: ({ src, alt, width, height, ...props }: MarkdownImageProps) => {
                        // تحويل src إلى string إذا كان Blob
                        const imageSrc = typeof src === 'string' ? src : 
                                        (src instanceof Blob ? URL.createObjectURL(src) : "/placeholder.png");
                        
                        // تحويل width و height إلى النوع المطلوب
                        const imageWidth = typeof width === 'number' ? width : 
                                          (typeof width === 'string' && /^\d+$/.test(width) ? parseInt(width) : 800);
                        
                        const imageHeight = typeof height === 'number' ? height : 
                                          (typeof height === 'string' && /^\d+$/.test(height) ? parseInt(height) : 450);
                        
                        return (
                          <div className="my-4 md:my-6 overflow-hidden rounded-xl md:rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105 hover:shadow-2xl p-1" 
                               style={{ 
                                 background: 'linear-gradient(135deg, #3b82f6, #1d4ed8, #2563eb, #1e40af, #f59e0b, #d97706, #b45309, #92400e)',
                                 backgroundSize: '400% 400%',
                                 animation: 'blueGoldGradient 12s ease infinite',
                               }}>
                            <div className="rounded-lg md:rounded-xl overflow-hidden h-full w-full">
                              <Image 
                                src={imageSrc} 
                                alt={alt || ""} 
                                width={imageWidth}
                                height={imageHeight}
                                className="w-full h-full object-cover"
                                {...props}
                              />
                            </div>
                          </div>
                        );
                      }
                    }}
                  >
                    {description}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* SEASON SECTION */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
                <FaClock className="text-xs md:text-sm" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent">
                الموسم
              </h2>
              <div className="flex-grow h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
            </div>
            
            <Link
              href={`/seasons/${encodeURIComponent(String(seasonSlug))}`}
              className="block group"
            >
              <motion.div 
                whileHover={{ y: -5 }}
                className="rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="relative h-32 md:h-40 overflow-hidden">
                  <Image
                    src={seasonThumbnailUrl}
                    alt={seasonTitle}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-3 md:p-4">
                    <span className="text-white font-bold text-sm md:text-base md:text-lg">عرض جميع الحلقات</span>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-lg md:text-xl font-bold mb-2">{seasonTitle}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      اضغط لعرض حلقات الموسم
                    </p>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                      <FaPlay className="text-xs md:text-sm ml-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.section>
          
          {/* SUGGESTED SECTION */}
          {suggested.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-700 bg-clip-text text-transparent">
                  حلقات مقترحة
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-green-200 to-transparent"></div>
              </div>
              
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  ref={navPrevRef}
                  className="hidden md:inline-flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  ref={navNextRef}
                  className="hidden md:inline-flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
                
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  spaceBetween={16}
                  slidesPerView={1}
                  breakpoints={{ 
                    640: { slidesPerView: 2 }, 
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 } 
                  }}
                  navigation={{
                    prevEl: navPrevRef.current,
                    nextEl: navNextRef.current,
                  }}
                  onBeforeInit={(swiper) => {
                    // @ts-expect-error - Swiper navigation types are not compatible with useRef
                    swiper.params.navigation.prevEl = navPrevRef.current;
                    // @ts-expect-error - Swiper navigation types are not compatible with useRef
                    swiper.params.navigation.nextEl = navNextRef.current;
                  }}
                  pagination={{
                    clickable: true,
                    el: ".custom-pagination",
                    bulletClass: "swiper-pagination-bullet-custom",
                    bulletActiveClass: "swiper-pagination-bullet-active-custom",
                  }}
                  autoplay={{ delay: 4500, disableOnInteraction: false }}
                  grabCursor
                  speed={600}
                  className="py-6 md:py-8 overflow-visible"
                >
                  {suggested.map((item) => (
                    <SwiperSlide key={String(item.id)} className="overflow-visible px-1 md:px-2">
                      <motion.div
                        whileHover={{ 
                          y: -10, 
                          scale: 1.03,
                        }}
                        transition={{ duration: 0.3 }}
                        className="h-full"
                      >
                        <Link
                          href={`/episodes/${encodeURIComponent(String(item.slug))}`}
                          className="block bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col group border border-gray-200 dark:border-gray-700"
                        >
                          <div className="relative h-40 md:h-48 overflow-hidden flex-shrink-0">
                            <Image
                              src={item.thumb}
                              alt={item.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <motion.div 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                              >
                                <FaPlay className="text-white text-base md:text-lg ml-1" />
                              </motion.div>
                            </div>
                          </div>
                          <div className="p-4 flex-grow">
                            <h3 className="text-base md:text-lg font-bold mb-2 line-clamp-2">{item.title}</h3>
                            <div className="flex items-center justify-between mt-3 md:mt-4">
                              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                                حلقة
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    </SwiperSlide>
                  ))}
                </Swiper>
                
                <div className="custom-pagination flex justify-center mt-4 md:mt-6 gap-2" />
              </div>
            </motion.section>
          )}
          
          {/* RELATED ARTICLES SECTION */}
          {articles.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg">
                  <FaFileAlt className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-700 bg-clip-text text-transparent">
                  مقالات مرتبطة
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-teal-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((article) => (
                  <motion.div
                    key={String(article.id)}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    <Link href={`/articles/${encodeURIComponent(String(article.slug))}`} className="block">
                      <div className="flex gap-3 p-3">
                        <div className="relative w-24 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                          <Image
                            src={article.featuredImage}
                            alt={article.title}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2">{article.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                            {article.excerpt || "اقرأ المزيد..."}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <Link 
                  href="/articles" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <span>عرض جميع المقالات</span>
                </Link>
              </div>
            </motion.section>
          )}
          
          {/* COMMENTS SECTION */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                <FaComment className="text-xs md:text-sm" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-700 bg-clip-text text-transparent">
                التعليقات
              </h2>
              <div className="flex-grow h-px bg-gradient-to-r from-yellow-200 to-transparent"></div>
            </div>
            
            {/* استخدام documentId بدل id */}
            <CommentsClient contentId={episode.documentId} type="episode" />
          </motion.section>
        </div>
      </div>
      
      {/* Swiper custom styles */}
      <style jsx global>{`
        .swiper-pagination-bullet-custom {
          width: 10px;
          height: 10px;
          background: #cbd5e1;
          border-radius: 999px;
          opacity: 0.9;
          transition: all 0.25s ease;
        }
        .swiper-pagination-bullet-active-custom {
          width: 24px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          opacity: 1;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes blueGoldGradient {
          0% {
            background-position: 0% 50%;
          }
          25% {
            background-position: 100% 50%;
          }
          50% {
            background-position: 100% 100%;
          }
          75% {
            background-position: 0% 100%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @media (prefers-color-scheme: dark) {
          .swiper-pagination-bullet-custom {
            background: #4b5563;
          }
        }
        .swiper-wrapper {
          padding: 10px 0;
        }
        .swiper-slide {
          overflow: visible !important;
          padding: 0 4px !important;
        }
        @media (min-width: 768px) {
          .swiper-slide {
            padding: 0 8px !important;
          }
        }
        .swiper-slide > div {
          overflow: visible;
          will-change: transform;
        }
        /* تأثيرات الظل المتقدمة */
        .group:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 10;
        }
        .dark .group:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
        }
        /* تنسيق الصور داخل قسم نبذة عن الحلقة */
        .prose img {
          border-radius: 0;
          box-shadow: none;
          transition: none;
          display: block;
          border: none;
          padding: 0;
          margin: 0;
          line-height: 0;
          verticalAlign: top;
        }
        .dark .prose img {
          box-shadow: none;
        }
      `}</style>
    </div>
  );
}