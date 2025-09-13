"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema } from "hast-util-sanitize";
import { useParams } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
// Icons
import { FaPlay, FaArrowLeft, FaStar, FaFileAlt, FaGoogleDrive, FaComment } from "react-icons/fa";
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "https://growing-acoustics-35909e61eb.strapiapp.com";
function buildMediaUrl(path?: string) {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STRAPI_URL}${path}`;
}
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "u"],
  attributes: {
    ...defaultSchema.attributes,
    u: [],
  },
};
// تعريف واجهات البيانات بدلاً من استخدام any
interface Article {
  id: number;
  documentId: string;
  title: string;
  name?: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  slug?: string;
  featuredImage?: {
    formats?: {
      large?: { url: string };
      medium?: { url: string };
      thumbnail?: { url: string };
    };
    url?: string;
  };
}
interface EpisodeItem {
  id: number | string;
  title: string;
  slug: number | string;
  thumb: string;
}
// تعديل واجهة Comment لتشمل id في كلا المكانين
interface Comment {
  id?: string | number;
  attributes?: {
    id?: string | number;
    content: string;
    name: string;
    createdAt: string;
  };
  content?: string;
  name?: string;
  createdAt?: string | Date;
}
// واجهات للخصائص المستخدمة في ReactMarkdown
interface MarkdownNode {
  type: string;
  tagName?: string;
  children?: MarkdownNode[];
  properties?: Record<string, unknown>;
}
// تعديل واجهة ParagraphProps لجعل children اختيارية
interface ParagraphProps {
  children?: React.ReactNode;
  node?: MarkdownNode;
}
// تعديل واجهة ImageProps لتتضمن Blob كنوع محتمل لـ src
interface ImageProps {
  src?: string | Blob;
  alt?: string;
}
// واجهة للصورة المصغرة
interface Thumbnail {
  formats?: {
    thumbnail?: { url: string };
    small?: { url: string };
    large?: { url: string };
  };
  url?: string;
}
// مكون التعليقات المدمج
function CommentsClient({ 
  contentId, 
  type = "article" 
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
      let json: unknown = null;
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
          setErrorMsg("فشل الإرسال — تفاصيل: " + JSON.stringify((json as {details: unknown}).details));
        } else if (json && typeof json === 'object' && 'error' in json) {
          setErrorMsg("فشل الإرسال — " + JSON.stringify((json as {error: unknown}).error));
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
          const contentText = c.attributes?.content ?? c.content;
          const author = c.attributes?.name ?? c.name ?? "مستخدم";
          const createdAt = new Date(c.attributes?.createdAt ?? c.createdAt ?? Date.now());
          // استخدام id من أي مكان متاح
          const commentId = c.id ?? c.attributes?.id ?? `${createdAt.getTime()}`;
          
          return (
            <div key={commentId} className="py-3">
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
export default function ArticleDetailPageClient() {
  const params = useParams() as Record<string, string | string[]>;
  const rawSlug = params?.slug;
  const slugOrId = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug ?? "";
  const [article, setArticle] = useState<Article | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
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
      setArticle(null);
      setEpisodes([]);
      try {
        if (!slugOrId) {
          setError("لم يتم تحديد المقال");
          setLoading(false);
          return;
        }
        
        console.log("Fetching article with slug/ID:", slugOrId);
        
        // جلب المقال - تم تعديل الاستعلام لإزالة populate media
        const qSlug = `${STRAPI_URL}/api/articles?filters[slug][$eq]=${encodeURIComponent(
          slugOrId
        )}&populate=featuredImage`;
        console.log("Query URL:", qSlug);
        
        const res = await fetch(qSlug);
        let art: unknown = null;
        
        if (res.ok) {
          const j = await res.json();
          console.log("Response:", j);
          art = j.data?.[0] ?? null;
        }
        
        // إذا لم يتم العثور على المقال بالslug، جرب بالID
        if (!art) {
          const maybeId = Number(slugOrId);
          if (!Number.isNaN(maybeId)) {
            console.log("Trying with ID:", maybeId);
            const resId = await fetch(
              `${STRAPI_URL}/api/articles/${maybeId}?populate=featuredImage`
            );
            if (resId.ok) {
              const j = await resId.json();
              console.log("ID Response:", j);
              art = j.data ?? null;
            }
          }
        }
        
        if (!art) {
          console.error("Article not found for slug/ID:", slugOrId);
          throw new Error("المقال غير موجود");
        }
        
        const built = art as Article;
        console.log("Article found:", built);
        
        // جلب الحلقات المرتبطة
        const qEpisodes = `${STRAPI_URL}/api/episodes?filters[articles][slug][$eq]=${slugOrId}&populate=thumbnail`;
        console.log("Episodes Query URL:", qEpisodes);
        
        const resEpisodes = await fetch(qEpisodes);
        let eps: EpisodeItem[] = [];
        
        if (resEpisodes.ok) {
          const j = await resEpisodes.json();
          console.log("Episodes Response:", j);
          eps = (j.data ?? []).map((it: unknown) => {
            const episode = it as Record<string, unknown>;
            const epTitle = (episode.title ?? episode.name ?? `حلقة ${episode.id}`) as string;
            let epThumb = "/placeholder.png";
            if (episode.thumbnail) {
              const eThumb = episode.thumbnail as Thumbnail;
              const eThumbPath =
                eThumb?.formats?.thumbnail?.url ??
                eThumb?.formats?.small?.url ??
                eThumb?.url ??
                null;
              epThumb = buildMediaUrl(eThumbPath ?? undefined);
            }
            return {
              id: episode.id as number,
              title: epTitle,
              slug: (episode.slug ?? episode.id) as number | string,
              thumb: epThumb,
            };
          });
        }
        
        if (mounted) {
          setArticle(built);
          setEpisodes(eps);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (e: unknown) {
        console.error("Error loading article:", e);
        if (mounted) {
          setError((e as Error)?.message ?? "خطأ غير معروف");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">المقال غير موجود</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            عذراً، المقال الذي تبحث عنه غير موجود أو قد تم حذفه.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/articles"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              عرض جميع المقالات
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              العودة إلى الرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
      
  if (!article) return <div className="p-8 text-center">لم تُعثر على المقال.</div>;
  
  const title = article.title ?? article.name ?? "بدون عنوان";
  const excerpt = article.excerpt ?? "";
  const content = article.content ?? "";
  const publishedAt = article.publishedAt ?? "";
  
  let featuredImageUrl = "/placeholder.png";
  if (article.featuredImage) {
    const thumb = article.featuredImage;
    const thumbPath =
      thumb?.formats?.large?.url ??
      thumb?.formats?.medium?.url ??
      thumb?.formats?.thumbnail?.url ??
      thumb?.url ??
      null;
    featuredImageUrl = buildMediaUrl(thumbPath ?? undefined);
  }
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 min-h-screen">
      {/* HERO */}
      <header className="relative w-full overflow-hidden shadow-2xl">
        <motion.div
          style={{ y }}
          className="relative h-[50vh] md:h-[60vh]"
        >
          <div className="absolute inset-0">
            <Image
              src={featuredImageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
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
                  مقال جديد
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
                  {new Date(publishedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
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
            href="/articles"
            className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 bg-gradient-to-r from-black/40 to-black/60 backdrop-blur-lg rounded-full text-white hover:from-black/60 hover:to-black/80 transition-all duration-300 shadow-lg border border-white/10 hover:border-white/20"
          >
            <FaArrowLeft className="text-base md:text-lg" />
            <span className="font-medium text-sm md:text-base">العودة للمقالات</span>
          </Link>
        </motion.div>
      </header>
      
      {/* MAIN CONTENT */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
        
          {/* EXCERPT SECTION */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  نبذة عن المقال
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              </div>
              
              <div className="prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none text-right">
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-blue-100 dark:border-gray-700 backdrop-blur-md">
                  <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 leading-relaxed">
                    {excerpt}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* CONTENT SECTION */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-700 bg-clip-text text-transparent">
                  المحتوى
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-green-200 to-transparent"></div>
              </div>
              
              <div className="prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none text-right">
                <div className="bg-gradient-to-br from-green-50/50 to-teal-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-green-100 dark:border-gray-700 backdrop-blur-md">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
                    components={{
                      p: ({ children, node }: ParagraphProps) => {
                        // التحقق مما إذا كانت الفقرة تحتوي على صورة فقط
                        const isImageOnly = node?.children?.every(
                          (child: MarkdownNode) => child.type === 'element' && child.tagName === 'img'
                        );
                        
                        if (isImageOnly) {
                          // إذا كانت تحتوي على صورة فقط، عرضها بدون غلاف الفقرة
                          return <>{children}</>;
                        }
                        
                        // دالة للتحقق مما إذا كان الرابط هو فيديو يوتيوب
                        const isYouTubeVideo = (url: string) => {
                            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                            return youtubeRegex.test(url);
                        };
                        
                        // دالة للتحقق مما إذا كان الرابط هو فيديو فيميو
                        const isVimeoVideo = (url: string) => {
                            const vimeoRegex = /^(https?:\/\/)?(www\.)?(vimeo\.com\/)(\d+)/;
                            return vimeoRegex.test(url);
                        };
                        
                        // دالة للتحقق مما إذا كان الرابط هو صورة
                        const isImage = (url: string) => {
                            return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
                        };
                        
                        // دالة للتحقق مما إذا كان الرابط هو ملف PDF
                        const isPDF = (url: string) => {
                            return /\.pdf$/i.test(url);
                        };
                        
                        // دالة للتحقق مما إذا كان الرابط هو ملف جوجل درايف
                        const isGoogleDrive = (url: string) => {
                            return /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/.test(url);
                        };
                        
                        // التحقق مما إذا كانت الفقرة تحتوي على روابط خاصة (فيديو، صورة، PDF، جوجل درايف)
                        const hasSpecialLinks = node?.children?.some(
                            (child: MarkdownNode) => 
                                child.type === 'element' && 
                                child.tagName === 'a' && 
                                (
                                    isYouTubeVideo((child.properties?.href as string) || '') ||
                                    isVimeoVideo((child.properties?.href as string) || '') ||
                                    isImage((child.properties?.href as string) || '') ||
                                    isPDF((child.properties?.href as string) || '') ||
                                    isGoogleDrive((child.properties?.href as string) || '')
                                )
                        );
                        
                        if (hasSpecialLinks) {
                            // إذا كانت الفقرة تحتوي على روابط خاصة، قم بتحويلها إلى div
                            return <div className="mb-4">{children}</div>;
                        }
                        
                        // خلاف ذلك، عرض كفقرة عادية
                        return <p className="mb-4">{children}</p>;
                      },
                      img: ({ src, alt }: ImageProps) => {
                        // تحويل src إلى string إذا كان Blob
                        const srcString = typeof src === 'string' ? src : '';
                        
                        return (
                          <div className="my-4 md:my-6 overflow-hidden rounded-xl md:rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105 hover:shadow-2xl p-1" 
                              style={{ 
                                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8, #2563eb, #1e40af, #f59e0b, #d97706, #b45309, #92400e)',
                                  backgroundSize: '400% 400%',
                                  animation: 'blueGoldGradient 12s ease infinite',
                              }}>
                              <div className="rounded-lg md:rounded-xl overflow-hidden h-full w-full">
                                  <Image 
                                      src={srcString} 
                                      alt={alt || ''} 
                                      width={800}
                                      height={450}
                                      className="w-full h-full object-cover block"
                                  />
                              </div>
                          </div>
                        );
                      },
                      // إضافة معالج مخصص للروابط
                      a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => {
                        const { href, children, ...restProps } = props;
                        
                        // التحقق من أن الرابط ليس فارغًا
                        if (!href) return <a {...restProps}>{children}</a>;
                        
                        // دالة للتحقق مما إذا كان الرابط هو فيديو يوتيوب
                        const isYouTubeVideo = (url: string) => {
                            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                            return youtubeRegex.test(url);
                        };
                        
                        // دالة للتحقق مما إذا كان الرابط هو فيديو فيميو
                        const isVimeoVideo = (url: string) => {
                            const vimeoRegex = /^(https?:\/\/)?(www\.)?(vimeo\.com\/)(\d+)/;
                            return vimeoRegex.test(url);
                        };
                        
                        // دالة للتحقق مما إذا كان الرابط هو صورة
                        const isImage = (url: string) => {
                            return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
                        };
                        
                        // دالة للتحقق مما إذا كان الرابط هو ملف PDF
                        const isPDF = (url: string) => {
                            return /\.pdf$/i.test(url);
                        };
                        
                        // دالة للتحقق مما إذا كان الرابط هو ملف جوجل درايف
                        const isGoogleDrive = (url: string) => {
                            return /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/.test(url);
                        };
                        
                        // دالة لاستخراج معرف الفيديو من يوتيوب
                        const getYouTubeId = (url: string) => {
                            const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                            return match ? match[1] : null;
                        };
                        
                        // دالة لاستخراج معرف الفيديو من فيميو
                        const getVimeoId = (url: string) => {
                            const match = url.match(/vimeo\.com\/(\d+)/);
                            return match ? match[1] : null;
                        };
                        
                        // دالة لاستخراج معرف ملف جوجل درايف
                        const getGoogleDriveId = (url: string) => {
                            const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
                            return match ? match[1] : null;
                        };
                        
                        // إذا كان الرابط هو فيديو يوتيوب
                        if (isYouTubeVideo(href)) {
                            const videoId = getYouTubeId(href);
                            if (videoId) {
                                return (
                                    <>
                                        <div className="my-6 rounded-xl md:rounded-2xl overflow-hidden shadow-xl">
                                            <div className="relative pb-[56.25%] h-0">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}`}
                                                    title={typeof children === 'string' ? children : 'فيديو يوتيوب'}
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className="absolute top-0 left-0 w-full h-full rounded-xl md:rounded-2xl"
                                                />
                                            </div>
                                        </div>
                                        {typeof children === 'string' && (
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                                                {children}
                                            </div>
                                        )}
                                    </>
                                );
                            }
                        }
                        
                        // إذا كان الرابط هو فيديو فيميو
                        if (isVimeoVideo(href)) {
                            const videoId = getVimeoId(href);
                            if (videoId) {
                                return (
                                    <>
                                        <div className="my-6 rounded-xl md:rounded-2xl overflow-hidden shadow-xl">
                                            <div className="relative pb-[56.25%] h-0">
                                                <iframe
                                                    src={`https://player.vimeo.com/video/${videoId}`}
                                                    title={typeof children === 'string' ? children : 'فيديو فيميو'}
                                                    frameBorder="0"
                                                    allow="autoplay; fullscreen; picture-in-picture"
                                                    allowFullScreen
                                                    className="absolute top-0 left-0 w-full h-full rounded-xl md:rounded-2xl"
                                                />
                                            </div>
                                        </div>
                                        {typeof children === 'string' && (
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                                                {children}
                                            </div>
                                        )}
                                    </>
                                );
                            }
                        }
                        
                        // إذا كان الرابط هو صورة
                        if (isImage(href)) {
                            return (
                                <>
                                    <div className="my-4 md:my-6 overflow-hidden rounded-xl md:rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105 hover:shadow-2xl p-1" 
                                        style={{ 
                                            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8, #2563eb, #1e40af, #f59e0b, #d97706, #b45309, #92400e)',
                                            backgroundSize: '400% 400%',
                                            animation: 'blueGoldGradient 12s ease infinite',
                                        }}>
                                        <div className="rounded-lg md:rounded-xl overflow-hidden h-full w-full">
                                            <Image 
                                                src={href} 
                                                alt={typeof children === 'string' ? children : 'صورة'} 
                                                width={800}
                                                height={450}
                                                className="w-full h-full object-cover block"
                                            />
                                        </div>
                                    </div>
                                    {typeof children === 'string' && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                                            {children}
                                        </div>
                                    )}
                                </>
                            );
                        }
                        
                        // إذا كان الرابط هو ملف PDF
                        if (isPDF(href)) {
                            return (
                                <div className="my-6 rounded-xl md:rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700">
                                    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 p-3 md:p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                                            <FaFileAlt className="text-lg" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-gray-200">ملف PDF</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{typeof children === 'string' ? children : 'عرض ملف PDF'}</p>
                                        </div>
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            عرض الملف
                                        </a>
                                    </div>
                                    <div className="relative pb-[141.42%] h-0 bg-gray-100 dark:bg-gray-800">
                                        <iframe
                                            src={href}
                                            title={typeof children === 'string' ? children : 'ملف PDF'}
                                            className="absolute top-0 left-0 w-full h-full"
                                            frameBorder="0"
                                        />
                                    </div>
                                </div>
                            );
                        }
                        
                        // إذا كان الرابط هو ملف جوجل درايف
                        if (isGoogleDrive(href)) {
                            const fileId = getGoogleDriveId(href);
                            if (fileId) {
                                return (
                                    <div className="my-6 rounded-xl md:rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700">
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-3 md:p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                                                <FaGoogleDrive className="text-lg" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{typeof children === 'string' ? children : 'عرض الملف'}</p>
                                            </div>
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                                            >
                                                عرض الملف
                                            </a>
                                        </div>
                                        <div className="relative pb-[60%] h-0 bg-gray-100 dark:bg-gray-800">
                                            <iframe
                                                src={`https://drive.google.com/file/d/${fileId}/preview`}
                                                title={typeof children === 'string' ? children : 'ملف جوجل درايف'}
                                                className="absolute top-0 left-0 w-full h-full"
                                                frameBorder="0"
                                            />
                                        </div>
                                    </div>
                                );
                            }
                        }
                        
                        // إذا لم يكن الرابط من الأنواع السابقة، عرضه كرابط عادي
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                {...restProps}
                            >
                                {children}
                            </a>
                        );
                      }
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* RELATED EPISODES SECTION */}
          {episodes.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-700 bg-clip-text text-transparent">
                  حلقات مرتبطة
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-yellow-200 to-transparent"></div>
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
                    // @ts-expect-error - Swiper types are not compatible with React refs
                    swiper.params.navigation.prevEl = navPrevRef.current;
                    // @ts-expect-error - Swiper types are not compatible with React refs
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
                  {episodes.map((item) => (
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
            <CommentsClient contentId={article.documentId} type="article" />
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
        /* تنسيق الصور داخل قسم المحتوى */
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