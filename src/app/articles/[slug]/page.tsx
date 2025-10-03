"use client";
import React, { useEffect, useState, useCallback, JSX } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedText } from "@/lib/sanity";
// Icons
import { FaPlay, FaStar, FaFileAlt, FaGoogleDrive, FaComment, FaImage, FaFolder, FaVideo } from "react-icons/fa";
// Sanity
import { client, urlForImage } from "@/lib/sanity";
// Components
import FavoriteButton from "@/components/FavoriteButton";

// تعريف واجهات البيانات مع دعم اللغة
interface Article {
  _id: string;
  _type: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  content: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  publishedAt: string;
  slug: {
    current: string;
  };
  featuredImage?: {
    asset: {
      _ref: string;
      _id?: string;
      url?: string;
    };
  };
  episode?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: {
      current: string;
    };
    thumbnail?: {
      asset: {
        _ref: string;
        _id?: string;
        url?: string;
      };
    };
  };
  season?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: {
      current: string;
    };
    thumbnail?: {
      asset: {
        _ref: string;
        _id?: string;
        url?: string;
      };
    };
  };
  language?: 'ar' | 'en';
}

interface EpisodeItem {
  _id: string;
  title: string;
  titleEn?: string;
  slug: {
    current: string;
  };
  thumbnail?: {
    asset: {
      _ref: string;
      _id?: string;
      url?: string;
    };
  };
  language?: 'ar' | 'en';
}

interface SeasonItem {
  _id: string;
  title: string;
  titleEn?: string;
  slug: {
    current: string;
  };
  thumbnail?: {
    asset: {
      _ref: string;
      _id?: string;
      url?: string;
    };
  };
  language?: 'ar' | 'en';
}

interface Comment {
  _id?: string;
  _type?: string;
  content?: string;
  name?: string;
  createdAt?: string | Date;
  article?: {
    _ref: string;
  };
  episode?: {
    _ref: string;
  };
}

// تعريف أنواع Portable Text من Sanity
interface PortableTextBlock {
  _type: 'block';
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote' | 'code';
  children: PortableTextSpan[];
  listItem?: string;
  level?: number;
  markDefs?: MarkDef[];
}

interface PortableTextSpan {
  _type: 'span';
  text: string;
  marks?: string[];
  _key?: string;
}

interface MarkDef {
  _key: string;
  _type: string;
  href?: string;
}

// تعريف واجهة SanityImage
interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// كائن الترجمات
const translations = {
  ar: {
    loading: "جارٍ التحميل...",
    error: "حدث خطأ في تحميل المقال",
    notFound: "المقال غير موجود",
    notFoundMessage: "عذراً، المقال الذي تبحث عنه غير موجود أو قد تم حذفه.",
    viewAllArticles: "عرض جميع المقالات",
    backToHome: "العودة إلى الرئيسية",
    noArticleFound: "لم تُعثر على المقال.",
    articleExcerpt: "نبذة عن المقال",
    content: "المحتوى",
    relatedSeason: "الموسم المرتبط",
    relatedEpisode: "الحلقة المرتبطة",
    comments: "التعليقات",
    newArticle: "مقال جديد",
    featured: "مميز",
    favorites: "المفضلة",
    season: "موسم",
    episode: "حلقة",
    viewSeason: "عرض الموسم",
    watchEpisode: "مشاهدة الحلقة",
    commentPlaceholder: "اكتب تعليقك هنا...",
    sendComment: "أرسل التعليق",
    sending: "جاري الإرسال...",
    signInToComment: "يجب تسجيل الدخول لكي تتمكن من إرسال تعليق.",
    signIn: "تسجيل الدخول",
    writeCommentFirst: "اكتب تعليقاً قبل الإرسال.",
    signInRequired: "يجب تسجيل الدخول لإرسال تعليق.",
    noCommentsYet: "لا توجد تعليقات بعد.",
    viewDocument: "عرض المستند",
    openInGoogleDrive: "فتح في Google Drive",
    image: "صورة",
    openImage: "فتح الصورة",
    document: "مستند",
    video: "فيديو",
    publishedAt: "تاريخ النشر"
  },
  en: {
    loading: "Loading...",
    error: "Error loading article",
    notFound: "Article not found",
    notFoundMessage: "Sorry, the article you're looking for doesn't exist or may have been deleted.",
    viewAllArticles: "View all articles",
    backToHome: "Back to home",
    noArticleFound: "Article not found.",
    articleExcerpt: "Article excerpt",
    content: "Content",
    relatedSeason: "Related season",
    relatedEpisode: "Related episode",
    comments: "Comments",
    newArticle: "New article",
    featured: "Featured",
    favorites: "Favorites",
    season: "Season",
    episode: "Episode",
    viewSeason: "View season",
    watchEpisode: "Watch episode",
    commentPlaceholder: "Write your comment here...",
    sendComment: "Send comment",
    sending: "Sending...",
    signInToComment: "You must be signed in to post a comment.",
    signIn: "Sign in",
    writeCommentFirst: "Write a comment before sending.",
    signInRequired: "You must be signed in to send a comment.",
    noCommentsYet: "No comments yet.",
    viewDocument: "View document",
    openInGoogleDrive: "Open in Google Drive",
    image: "Image",
    openImage: "Open image",
    document: "Document",
    video: "Video",
    publishedAt: "Published at"
  }
};

// دالة محسّنة لتحويل محتوى الكتل من Sanity إلى نص مع الحفاظ على جميع التنسيقات
function blocksToText(blocks: PortableTextBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) {
    return '';
  }
  
  return blocks
    .map(block => {
      if (block._type !== 'block' || !block.children) {
        return '';
      }
      
      // معالجة العناوين
      let markdown = '';
      if (block.style === 'h1') {
        markdown += '# ';
      } else if (block.style === 'h2') {
        markdown += '## ';
      } else if (block.style === 'h3') {
        markdown += '### ';
      } else if (block.style === 'h4') {
        markdown += '#### ';
      } else if (block.style === 'h5') {
        markdown += '##### ';
      } else if (block.style === 'h6') {
        markdown += '###### ';
      }
      
      // معالجة القوائم
      if (block.listItem) {
        const level = block.level || 1;
        const prefix = level === 1 ? '- ' : '  '.repeat(level - 1) + '- ';
        markdown += prefix;
      }
      
      // معالجة الاقتباسات
      if (block.style === 'blockquote') {
        markdown += '> ';
      }
      
      // معالجة الكود البرمجي
      if (block.style === 'code') {
        markdown += '```\n';
      }
      
      // إضافة النص مع التنسيقات
      markdown += block.children
        .map((child: PortableTextSpan) => {
          let text = child.text || '';
          
          // إضافة تنسيقات النص
          if (child.marks) {
            child.marks.forEach((mark: string) => {
              if (mark === 'strong') {
                text = `**${text}**`;
              } else if (mark === 'em') {
                text = `*${text}*`;
              } else if (mark === 'underline') {
                text = `<u>${text}</u>`;
              } else if (mark === 'code') {
                text = `\`${text}\``;
              } else if (mark === 'strike') {
                text = `~~${text}~~`;
              }
            });
          }
          
          return text;
        })
        .join('');
      
      // إغلاق الكود البرمجي
      if (block.style === 'code') {
        markdown += '\n```';
      }
      
      // إضافة سطر جديد بعد الكتل
      if (block.style !== 'code') {
        markdown += '\n';
      }
      
      return markdown;
    })
    .join('\n');
}

// مكون التعليقات
function CommentsClient({ 
  contentId, 
  type = "article" 
}: { 
  contentId: string; 
  type?: "article" | "episode" 
}) {
  const { language } = useLanguage();
  const t = translations[language];
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { user } = useUser();
  
  const fetchComments = useCallback(async () => {
    try {
      const query = `*[_type == "comment" && ${type}._ref == $contentId]{
        _id,
        name,
        content,
        createdAt
      } | order(createdAt desc)`;
      const comments = await client.fetch(query, { contentId });
      setComments(comments);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }, [type, contentId]);
  
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!content.trim()) {
      setErrorMsg(t.writeCommentFirst);
      return;
    }
    if (!user) {
      setErrorMsg(t.signInRequired);
      return;
    }
    setLoading(true);
    
    try {
      // محاولة استخدام API route أولاً
      const apiResponse = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          name: user.firstName || (user.fullName as string) || "مستخدم",
          email: user.emailAddresses?.[0]?.emailAddress || "",
          [type]: contentId,
        }),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log("Comment created via API:", data);
        setSuccessMsg(language === 'ar' ? "تم إرسال تعليقك بنجاح!" : "Your comment has been sent successfully!");
        setContent("");
        fetchComments();
        setLoading(false);
        return;
      }

      // إذا فشلت API route، نحاول مباشرة مع Sanity
      const newComment = {
        _type: "comment",
        name: user.firstName || (user.fullName as string) || "مستخدم",
        email: user.emailAddresses?.[0]?.emailAddress || "",
        content,
        createdAt: new Date().toISOString(),
        [type]: {
          _type: "reference",
          _ref: contentId
        }
      };
      
      console.log("Sending comment directly to Sanity:", newComment);
      
      // استخدام client.create مع التوكن الصحيح
      const result = await client.create(newComment);
      console.log("Comment created directly:", result);
      
      setSuccessMsg(language === 'ar' ? "تم إرسال تعليقك بنجاح!" : "Your comment has been sent successfully!");
      setContent("");
      fetchComments();
    } catch (err: unknown) {
      console.error("خطأ غير متوقع في الإرسال:", err);
      if (err instanceof Error) {
        if (err.message.includes("Insufficient permissions")) {
          setErrorMsg(language === 'ar' ? "ليس لديك صلاحية لإرسال التعليقات. يرجى التواصل مع الإدارة." : "You don't have permission to send comments. Please contact the administration.");
        } else {
          setErrorMsg(language === 'ar' ? `حدث خطأ غير متوقع أثناء الإرسال: ${err.message}` : `An unexpected error occurred while sending: ${err.message}`);
        }
      } else {
        setErrorMsg(language === 'ar' ? "حدث خطأ غير متوقع أثناء الإرسال." : "An unexpected error occurred while sending.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mt-6 border rounded p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
      <SignedOut>
        <div className="mb-4">
          <p className="mb-2">{t.signInToComment}</p>
          <Link
            href="/sign-in"
            className="px-3 py-2 bg-blue-600 dark:bg-blue-500 hover:opacity-95 text-white rounded inline-block"
          >
            {t.signIn}
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
            placeholder={t.commentPlaceholder}
            required
            disabled={loading}
            aria-label="تعليق"
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
              {loading ? t.sending : t.sendComment}
            </button>
            {errorMsg && (
              <p className="text-sm text-red-600 dark:text-red-400 break-words max-w-xl">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="text-sm text-green-600 dark:text-green-400 break-words max-w-xl">{successMsg}</p>
            )}
          </div>
        </form>
      </SignedIn>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {comments.length === 0 && <p className="text-gray-600 dark:text-gray-300">{t.noCommentsYet}</p>}
        {comments.map((c: Comment) => {
          const createdAt = c.createdAt ? new Date(c.createdAt) : new Date();
          return (
            <div key={c._id} className="py-3">
              <p className="text-sm text-gray-700 dark:text-gray-200">{c.content}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{c.name}</span>
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
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const params = useParams() as Record<string, string | string[]>;
  const rawSlug = params?.slug;
  const slugOrId = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug ?? "";
  const [article, setArticle] = useState<Article | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      setSeasons([]);
      try {
        if (!slugOrId) {
          setError(t.error);
          setLoading(false);
          return;
        }
        
        // جلب المقال من Sanity مع الحلقة والموسم المرتبطين مع دعم اللغة
        const query = `*[_type == "article" && slug.current == $slug && language == $language][0] {
          _id,
          _type,
          title,
          titleEn,
          excerpt,
          excerptEn,
          content,
          contentEn,
          publishedAt,
          slug,
          featuredImage {
            asset-> {
              _id,
              _ref,
              url
            }
          },
          episode-> {
            _id,
            title,
            titleEn,
            slug,
            thumbnail {
              asset-> {
                _id,
                _ref,
                url
              }
            }
          },
          season-> {
            _id,
            title,
            titleEn,
            slug,
            thumbnail {
              asset-> {
                _id,
                _ref,
                url
              }
            }
          },
          language
        }`;
        
        const art = await client.fetch(query, { slug: slugOrId, language });
        
        if (!art) {
          console.error("Article not found for slug/ID:", slugOrId);
          throw new Error(t.notFound);
        }
        
        // جلب الحلقات المرتبطة (إذا كانت هناك حلقة مرتبطة)
        let relatedEpisodes: EpisodeItem[] = [];
        if (art.episode) {
          relatedEpisodes = [art.episode];
        }
        
        // جلب المواسم المرتبطة (إذا كان هناك موسم مرتبط)
        let relatedSeasons: SeasonItem[] = [];
        if (art.season) {
          relatedSeasons = [art.season];
        }
        
        if (mounted) {
          setArticle(art);
          setEpisodes(relatedEpisodes);
          setSeasons(relatedSeasons);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (e: unknown) {
        console.error("Error loading article:", e);
        if (mounted) {
          setError((e as Error)?.message ?? t.error);
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [slugOrId, language, t.error, t.notFound]);
  
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t.notFound}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t.notFoundMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/articles"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t.viewAllArticles}
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              {t.backToHome}
            </Link>
          </div>
        </div>
      </div>
    );
      
  if (!article) return <div className="p-8 text-center">{t.noArticleFound}</div>;
  
  const title = getLocalizedText(article.title, article.titleEn, language);
  const excerpt = getLocalizedText(article.excerpt, article.excerptEn, language);
  const content = language === 'ar' ? article.content : article.contentEn || article.content;
  const publishedAt = article.publishedAt;
  
  // دالة للحصول على رابط الصورة بشكل آمن
  const getImageUrl = (image: { asset?: { _ref?: string; _id?: string; url?: string }; _ref?: string; url?: string } | undefined): string => {
    if (!image) {
      console.log("No image provided, using placeholder");
      return '/placeholder.png';
    }
    
    // إذا كان هناك رابط مباشر، استخدمه
    if (image.url) {
      console.log("Using direct URL:", image.url);
      return image.url;
    }
    
    // إذا كان هناك أصل (asset)، استخدم urlForImage
    if (image.asset) {
      // إذا كان الأصل يحتوي على رابط مباشر، استخدمه
      if (image.asset.url) {
        console.log("Using asset URL:", image.asset.url);
        return image.asset.url;
      }
      
      // إذا كان الأصل يحتوي على _ref، استخدم urlForImage
      if (image.asset._ref) {
        try {
          // إنشاء كائن SanityImage صالح
          const sanityImage: SanityImage = {
            _type: 'image',
            asset: {
              _ref: image.asset._ref,
              _type: 'reference'
            }
          };
          const url = urlForImage(sanityImage).url();
          console.log("Generated URL from asset _ref:", url);
          return url;
        } catch (e) {
          console.error("Error generating URL from asset _ref:", e);
        }
      }
      
      // إذا كان الأصل يحتوي على _id، استخدم urlForImage
      if (image.asset._id) {
        try {
          // إنشاء كائن SanityImage صالح
          const sanityImage: SanityImage = {
            _type: 'image',
            asset: {
              _ref: image.asset._id,
              _type: 'reference'
            }
          };
          const url = urlForImage(sanityImage).url();
          console.log("Generated URL from asset _id:", url);
          return url;
        } catch (e) {
          console.error("Error generating URL from asset _id:", e);
        }
      }
    }
    
    // إذا كان هناك _ref مباشر، استخدم urlForImage
    if (image._ref) {
      try {
        // إنشاء كائن SanityImage صالح
        const sanityImage: SanityImage = {
          _type: 'image',
          asset: {
            _ref: image._ref,
            _type: 'reference'
          }
        };
        const url = urlForImage(sanityImage).url();
        console.log("Generated URL from direct _ref:", url);
        return url;
      } catch (e) {
        console.error("Error generating URL from direct _ref:", e);
      }
    }
    
    console.log("No valid image source found, using placeholder");
    return '/placeholder.png';
  };
  
  const featuredImageUrl = getImageUrl(article.featuredImage);
  console.log("Final featuredImageUrl:", featuredImageUrl);
  
  // دالة لتحديد ما إذا كان النص يحتوي على رابط فيديو
  const isVideoUrl = (text: string) => {
    const videoUrlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|.*\.(?:mp4|webm|ogg))[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    return videoUrlRegex.test(text);
  };

  // دالة لاستخراج رابط الفيديو من النص
  const extractVideoUrl = (text: string) => {
    const videoUrlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|.*\.(?:mp4|webm|ogg))[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    const match = text.match(videoUrlRegex);
    return match ? match[0] : null;
  };

  // دالة لتحديد ما إذا كان النص يحتوي على رابط PDF
  const isPdfUrl = (text: string) => {
    const pdfUrlRegex = /(https?:\/\/(?:www\.)?(?:drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+|.*\.pdf)[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    return pdfUrlRegex.test(text);
  };

  // دالة لاستخراج رابط PDF من النص
  const extractPdfUrl = (text: string) => {
    const pdfUrlRegex = /(https?:\/\/(?:www\.)?(?:drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+|.*\.pdf)[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    const match = text.match(pdfUrlRegex);
    return match ? match[0] : null;
  };

  // دالة لتحديد ما إذا كان النص يحتوي على رابط صورة
  const isImageUrl = (text: string) => {
    const imageUrlRegex = /(https?:\/\/(?:www\.)?(?:.*\.(?:jpg|jpeg|png|gif|webp|svg))[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    return imageUrlRegex.test(text);
  };

  // دالة لاستخراج رابط الصورة من النص
  const extractImageUrl = (text: string) => {
    const imageUrlRegex = /(https?:\/\/(?:www\.)?(?:.*\.(?:jpg|jpeg|png|gif|webp|svg))[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    const match = text.match(imageUrlRegex);
    return match ? match[0] : null;
  };

  // دالة لتحويل رابط Google Drive إلى رابط عرض مباشر
  const getDirectGoogleDriveLink = (url: string) => {
    // تحويل روابط Google Drive إلى روابط عرض مباشر
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      const fileId = driveMatch[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    // إذا كان الرابط ينتهي بـ .pdf، نرجعه كما هو
    if (url.toLowerCase().endsWith('.pdf')) {
      return url;
    }
    
    // إذا لم يكن أي من الأنواع المعروفة، نرجع الرابط الأصلي
    return url;
  };

  // دالة لعرض الفيديو بناءً على الرابط
  const renderVideo = (url: string) => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      
      return (
        <div className="my-6">
          <div className="relative overflow-hidden rounded-xl shadow-lg" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      );
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1].split('?')[0];
      
      return (
        <div className="my-6">
          <div className="relative overflow-hidden rounded-xl shadow-lg" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://player.vimeo.com/video/${videoId}`}
              title="Vimeo video player"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      );
    }
    
    // فيديو مباشر (mp4, webm, ogg)
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <div className="my-6">
          <video
            className="w-full rounded-xl shadow-lg"
            controls
            preload="metadata"
          >
            <source src={url} type={`video/${url.split('.').pop()}`} />
            {language === 'ar' ? 'متصفحك لا يدعم تشغيل الفيديو.' : 'Your browser does not support video playback.'}
          </video>
        </div>
      );
    }
    
    // إذا لم يكن أي من الأنواع المعروفة، عرض رابط
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {url}
      </a>
    );
  };

  // دالة لعرض PDF بناءً على الرابط
  const renderPdf = (url: string) => {
    const directUrl = getDirectGoogleDriveLink(url);
    
    return (
      <div className="my-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
              <FaFileAlt className="text-sm" />
            </div>
            <h3 className="text-lg font-bold">{t.viewDocument}</h3>
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg"
          >
            <FaGoogleDrive />
            <span>{t.openInGoogleDrive}</span>
          </a>
        </div>
        <div className="relative overflow-hidden rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700" style={{ paddingBottom: '75%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={directUrl}
            title="PDF viewer"
            frameBorder="0"
            allow="autoplay"
          ></iframe>
        </div>
      </div>
    );
  };

  // دالة لعرض الصورة بناءً على الرابط
  const renderImage = (url: string) => {
    return (
      <div className="my-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <FaImage className="text-sm" />
            </div>
            <h3 className="text-lg font-bold">{t.image}</h3>
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg"
          >
            <FaImage />
            <span>{t.openImage}</span>
          </a>
        </div>
        <div className="relative overflow-hidden rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
          <Image
            src={url}
            alt={language === 'ar' ? "صورة من المحتوى" : "Image from content"}
            width={800}
            height={450}
            className="w-full h-auto object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </div>
    );
  };

  // مكون مخصص لعرض الروابط في ReactMarkdown
  const LinkRenderer = ({ href, children, ...props }: { href?: string; children?: React.ReactNode }) => {
    if (!href) return <>{children}</>;
    
    // التحقق إذا كان الرابط هو فيديو
    if (isVideoUrl(href)) {
      return renderVideo(href);
    }
    
    // التحقق إذا كان الرابط هو PDF
    if (isPdfUrl(href)) {
      return renderPdf(href);
    }
    
    // التحقق إذا كان الرابط هو صورة
    if (isImageUrl(href)) {
      return renderImage(href);
    }
    
    // إذا لم يكن أي من الأنواع، عرض الرابط كالمعتاد
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
        {...props}
      >
        {children}
      </a>
    );
  };

  // دالة لاستخراج كتل الكود البرمجي من النص
  const extractCodeBlocks = (text: string) => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    let match;
    let processedText = text;
    
    // استخراج كتل الكود البرمجي
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push(match[1]);
      processedText = processedText.replace(match[0], `__CODE_BLOCK_${codeBlocks.length - 1}__`);
    }
    
    return { processedText, codeBlocks };
  };

  // دالة لاستخراج كتل الاقتباسات من النص
  const extractBlockQuotes = (text: string) => {
    const blockQuoteRegex = /^> (.+)$/gm;
    const blockQuotes: string[] = [];
    let match;
    let processedText = text;
    
    // استخراج كتل الاقتباسات
    while ((match = blockQuoteRegex.exec(text)) !== null) {
      blockQuotes.push(match[1]);
      processedText = processedText.replace(match[0], `__BLOCK_QUOTE_${blockQuotes.length - 1}__`);
    }
    
    return { processedText, blockQuotes };
  };

  // دالة محسّنة لمعالجة المحتوى مع الحفاظ على جميع التنسيقات
  const processContent = (content: PortableTextBlock[]) => {
    if (!content || !Array.isArray(content)) {
      return [];
    }
    
    // تحويل الكتل إلى نص Markdown
    const markdownText = blocksToText(content);
    
    // أولاً، استخراج كتل الكود البرمجي
    const { processedText: textWithoutCode, codeBlocks } = extractCodeBlocks(markdownText);
    
    // ثانياً، استخراج كتل الاقتباسات
    const { processedText: textWithoutQuotes, blockQuotes } = extractBlockQuotes(textWithoutCode);
    
    // ثالثاً، تقسيم المحتوى إلى أجزاء بناءً على الروابط الخاصة
    const parts = textWithoutQuotes.split(/(\nhttps?:\/\/[^\s]+\n|\nhttps?:\/\/[^\s]+$|https?:\/\/[^\s]+\n|https?:\/\/[^\s]+$)/);
    
    const result: JSX.Element[] = [];
    
    parts.forEach((part, index) => {
      if (!part.trim()) return;
      
      // التحقق مما إذا كان الجزء يحتوي على رابط فيديو
      if (isVideoUrl(part)) {
        const videoUrl = extractVideoUrl(part);
        if (videoUrl) {
          result.push(<React.Fragment key={`video-${index}`}>{renderVideo(videoUrl)}</React.Fragment>);
          return;
        }
      }
      
      // التحقق مما إذا كان الجزء يحتوي على رابط PDF
      if (isPdfUrl(part)) {
        const pdfUrl = extractPdfUrl(part);
        if (pdfUrl) {
          result.push(<React.Fragment key={`pdf-${index}`}>{renderPdf(pdfUrl)}</React.Fragment>);
          return;
        }
      }
      
      // التحقق مما إذا كان الجزء يحتوي على رابط صورة
      if (isImageUrl(part)) {
        const imageUrl = extractImageUrl(part);
        if (imageUrl) {
          result.push(<React.Fragment key={`image-${index}`}>{renderImage(imageUrl)}</React.Fragment>);
          return;
        }
      }
      
      // معالجة النص العادي مع استبدال العناصر المستخرجة
      let processedPart = part;
      
      // استبدال كتل الاقتباسات
      processedPart = processedPart.replace(/__BLOCK_QUOTE_(\d+)__/g, (match, indexStr) => {
        const index = parseInt(indexStr);
        if (blockQuotes[index]) {
          return `> ${blockQuotes[index]}`;
        }
        return match;
      });
      
      // عرض النص باستخدام ReactMarkdown
      result.push(
        <div key={`markdown-${index}`} className={`prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none ${isRTL ? 'text-right' : 'text-left'}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            components={{
              // تخصيص عرض الروابط
              a: LinkRenderer,
              // تخصيص عرض الصور
              img: ({ src, alt }) => {
                if (typeof src !== 'string') {
                  return null;
                }
                return (
                  <div className="my-4">
                    <Image
                      src={src}
                      alt={alt || ''}
                      width={800}
                      height={450}
                      className="w-full h-auto rounded-xl shadow-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                );
              },
              // تخصيص عرض الجداول
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 font-bold text-right">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">
                  {children}
                </td>
              ),
              // تخصيص عرض الكود البرمجي المضمن
              code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => {
                if (inline) {
                  return (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  );
                }
                return null;
              },
              // تخصيص عرض الاقتباسات
              blockquote: ({ children }) => (
                <div className="bg-blue-900 text-white p-4 rounded-lg my-4 italic border-l-4 border-blue-500">
                  <blockquote>
                    {children}
                  </blockquote>
                </div>
              ),
            }}
          >
            {processedPart}
          </ReactMarkdown>
        </div>
      );
      
      // إضافة كتل الكود البرمجي المستخرجة
      codeBlocks.forEach((codeBlock, codeIndex) => {
        const match = /__CODE_BLOCK_(\d+)__/.exec(part);
        if (match && parseInt(match[1]) === codeIndex) {
          result.push(
            <div key={`code-${index}-${codeIndex}`} className="my-4">
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                <code>
                  {codeBlock}
                </code>
              </pre>
            </div>
          );
        }
      });
    });
    
    return result;
  };
  
  // Function to format date based on language
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* HERO */}
      <header className="relative w-full overflow-hidden shadow-2xl">
        <motion.div
          style={{ y }}
          className="relative h-[60vh] md:h-[70vh]"
        >
          <div className="absolute inset-0">
            <Image
              src={featuredImageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              onError={(e) => {
                console.error("Error loading featured image:", e);
                e.currentTarget.src = '/placeholder.png';
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
          <div className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} p-4 md:p-6 lg:p-10 text-${isRTL ? 'right' : 'left'} w-full`}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-block backdrop-blur-lg bg-black/40 rounded-2xl md:rounded-3xl px-4 md:px-8 py-4 md:py-6 shadow-2xl border border-white/10 max-w-full"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold text-white shadow-lg">
                  {language === 'ar' ? 'مقال جديد' : 'New article'}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold text-white shadow-lg">
                  <FaStar className="text-yellow-300" />
                  {t.featured}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold leading-tight tracking-wide bg-gradient-to-r from-purple-400 via-pink-500 to-red-600 bg-clip-text text-transparent animate-gradient">
                {title}
              </h1>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-base md:text-lg lg:text-2xl text-gray-200 font-medium drop-shadow-md">
                  {formatDate(publishedAt)}
                </p>
                <div className="h-1 w-6 md:w-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
              </div>
            </motion.div>
          </div>
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
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent">
                  {t.articleExcerpt}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
                
                {/* Favorite Button in Excerpt Section */}
                <div className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 bg-gradient-to-r from-pink-500/40 to-red-500/40 backdrop-blur-lg rounded-full text-white hover:from-pink-500/60 hover:to-red-500/60 transition-all duration-300 shadow-lg border border-white/10 hover:border-white/20">
                  <FavoriteButton contentId={article._id} contentType="article" />
                  <span className="font-medium text-sm md:text-base">{t.favorites}</span>
                </div>
              </div>
              
              <div className="prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none text-right">
                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-purple-100 dark:border-gray-700 backdrop-blur-md">
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
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent">
                  {t.content}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
              </div>
              
              <div className="prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none text-right">
                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-purple-100 dark:border-gray-700 backdrop-blur-md">
                  {/* استخدام دالة processContent لعرض المحتوى مع الحفاظ على التنسيقات */}
                  {processContent(content)}
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* SEASON SECTION */}
          {seasons.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <FaFolder className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  {t.relatedSeason}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seasons.map((season) => {
                  const seasonTitle = getLocalizedText(season.title, season.titleEn, language);
                  const seasonImageUrl = getImageUrl(season.thumbnail);
                  console.log("Season image URL:", seasonImageUrl);
                  
                  return (
                    <motion.div
                      key={season._id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      <Link
                        href={`/seasons/${encodeURIComponent(String(season.slug.current))}`}
                        className="block"
                      >
                        <div className="relative h-40 md:h-48 overflow-hidden">
                          <Image
                            src={seasonImageUrl}
                            alt={seasonTitle}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={(e) => {
                              console.error("Error loading season image:", e);
                              e.currentTarget.src = '/placeholder.png';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <motion.div 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                            >
                              <FaPlay className="text-white text-base md:text-lg ml-1" />
                            </motion.div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold mb-2">{seasonTitle}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                              {t.season}
                            </span>
                            <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                              {t.viewSeason}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}
          
          {/* EPISODE SECTION */}
          {episodes.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                  <FaVideo className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-700 bg-clip-text text-transparent">
                  {t.relatedEpisode}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-green-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {episodes.map((episode) => {
                  const episodeTitle = getLocalizedText(episode.title, episode.titleEn, language);
                  const episodeImageUrl = getImageUrl(episode.thumbnail);
                  console.log("Episode image URL:", episodeImageUrl);
                  
                  return (
                    <motion.div
                      key={episode._id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      <Link
                        href={`/episodes/${encodeURIComponent(String(episode.slug.current))}`}
                        className="block"
                      >
                        <div className="relative h-40 md:h-48 overflow-hidden">
                          <Image
                            src={episodeImageUrl}
                            alt={episodeTitle}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={(e) => {
                              console.error("Error loading episode image:", e);
                              e.currentTarget.src = '/placeholder.png';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <motion.div 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center shadow-lg"
                            >
                              <FaPlay className="text-white text-base md:text-lg ml-1" />
                            </motion.div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold mb-2">{episodeTitle}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full">
                              {t.episode}
                            </span>
                            <span className="text-sm text-green-600 dark:text-green-400 hover:underline">
                              {t.watchEpisode}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
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
                {t.comments}
              </h2>
              <div className="flex-grow h-px bg-gradient-to-r from-yellow-200 to-transparent"></div>
            </div>
            
            {/* استخدام _id بدل id */}
            <CommentsClient contentId={article._id} type="article" />
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