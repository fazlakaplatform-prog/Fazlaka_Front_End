"use client";
import React, { useEffect, useState, JSX } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useLanguage } from '@/components/LanguageProvider';
import { getLocalizedText } from '@/lib/sanity';
import { client } from '@/lib/sanity';
import FavoriteButton from '@/components/FavoriteButton';
import CommentsClient from '@/components/comments/CommentsClient';
import { 
  FaPlay, 
  FaStar, 
  FaFileAlt, 
  FaImage, 
  FaGoogleDrive, 
  FaFolder, 
  FaVideo,
  FaComment
} from 'react-icons/fa';

// تعريفات الأنواع التي تم استيرادها سابقاً من '@/types/sanity'
interface Comment {
  _id: string;
  name: string;
  email: string;
  comment: string;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
}

interface PortableTextBlock {
  _type: string;
  style?: string;
  listItem?: string;
  level?: number;
  children: {
    _type: string;
    text: string;
    marks?: string[];
  }[];
}

// تعريف واجهات البيانات المستخدمة في التطبيق
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
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  episode?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: {
      current: string;
    };
    thumbnailUrl?: string;
    thumbnailUrlEn?: string;
  };
  season?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: {
      current: string;
    };
    thumbnailUrl?: string;
    thumbnailUrlEn?: string;
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
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  language?: 'ar' | 'en';
}

interface SeasonItem {
  _id: string;
  title: string;
  titleEn?: string;
  slug: {
    current: string;
  };
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  language?: 'ar' | 'en';
}

// كائن الترجمات للغتين العربية والإنجليزية
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
    publishedAt: "تاريخ النشر",
    reply: "رد",
    delete: "حذف",
    replyTo: "رد على",
    cancel: "إلغاء",
    confirmDelete: "هل أنت متأكد من حذف هذا التعليق؟",
    deleteSuccess: "تم حذف التعليق بنجاح",
    replySuccess: "تم إرسال الرد بنجاح",
    writeReply: "اكتب ردك هنا...",
    sendReply: "إرسال الرد",
    replying: "جاري الرد...",
    noReplies: "لا توجد ردود بعد",
    showReplies: "عرض الردود",
    hideReplies: "إخفاء الردود",
    // ترجمات جديدة للأزرار
    like: "إعجاب",
    liked: "تم الإعجاب",
    shareArticle: "مشاركة المقال",
    commentArticle: "تعليق على المقال",
    interactWithArticle: "تفاعل مع المقال"
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
    publishedAt: "Published at",
    reply: "Reply",
    delete: "Delete",
    replyTo: "Reply to",
    cancel: "Cancel",
    confirmDelete: "Are you sure you want to delete this comment?",
    deleteSuccess: "Comment deleted successfully",
    replySuccess: "Reply sent successfully",
    writeReply: "Write your reply here...",
    sendReply: "Send reply",
    replying: "Replying...",
    noReplies: "No replies yet",
    showReplies: "Show replies",
    hideReplies: "Hide replies",
    // ترجمات جديدة للأزرار
    like: "Like",
    liked: "Liked",
    shareArticle: "Share Article",
    commentArticle: "Comment on Article",
    interactWithArticle: "Interact with Article"
  }
};

// دالة لتحويل كتل المحتوى من Sanity إلى نص
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
      
      // معالجة كتل الكود
      if (block.style === 'code') {
        markdown += '```\n';
      }
      
      // إضافة النص مع التنسيق
      markdown += block.children
        .map((child) => {
          let text = child.text || '';
          
          // إضافة تنسيق النص
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
      
      // إغلاق كتل الكود
      if (block.style === 'code') {
        markdown += '\n```';
      }
      
      // إضافة سطر جديد بعد كل كتلة
      if (block.style !== 'code') {
        markdown += '\n';
      }
      
      return markdown;
    })
    .join('\n');
}

// مكون الأزرار المحسّن بدون زر الحفظ
function ActionButtons({ 
  contentId, 
  contentType, 
  title, 
  onCommentClick,
  isFavorite,
  onToggleFavorite
}: { 
  contentId: string; 
  contentType: "episode" | "article"; 
  title: string;
  onCommentClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const { data: session } = useSession();
  const { language } = useLanguage();

  // نصوص التطبيق حسب اللغة
  const texts = {
    ar: {
      share: "مشاركة",
      comment: "تعليق",
      errorMessage: "حدث خطأ. يرجى المحاولة مرة أخرى."
    },
    en: {
      share: "Share",
      comment: "Comment",
      errorMessage: "An error occurred. Please try again."
    }
  };

  const t = texts[language];

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      });
    } else {
      // نسخ الرابط إلى الحافظة كبديل
      navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ الرابط إلى الحافظة");
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-750 dark:to-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
      {/* تأثيرات الإضاءة الخلفية */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full filter blur-3xl"></div>
      
      {/* عنوان القسم */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent flex-grow"></div>
        <h3 className="px-6 text-xl font-bold bg-gradient-to-r from-slate-700 dark:from-slate-300 to-slate-900 dark:to-slate-100 bg-clip-text text-transparent">
          {translations[language].interactWithArticle}
        </h3>
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent flex-grow"></div>
      </div>
      
      {/* الأزرار مع العناوين */}
      <div className="relative flex flex-wrap items-center justify-center gap-6 md:gap-8">
        {/* زر الإعجاب */}
        <div className="flex flex-col items-center gap-3">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-lg opacity-0 group-hover:opacity-40 transition-all duration-500"></div>
            <FavoriteButton 
              contentId={contentId} 
              contentType={contentType} 
              isFavorite={isFavorite}
              onToggle={onToggleFavorite}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isFavorite ? translations[language].liked : translations[language].like}
          </span>
        </div>
        
        {/* زر المشاركة */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleShare}
            className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
          >
            {/* خلفية متدرجة */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 transition-all duration-500"></div>
            
            {/* تأثير اللمعان */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* الأيقونة */}
            <div className="relative z-10 flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
              </svg>
            </div>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {translations[language].shareArticle}
          </span>
        </div>
        
        {/* زر التعليق */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onCommentClick}
            className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
          >
            {/* خلفية متدرجة */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 transition-all duration-500"></div>
            
            {/* تأثير اللمعان */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* الأيقونة */}
            <div className="relative z-10 flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {translations[language].commentArticle}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ArticleDetailPageClient() {
  const { language, isRTL } = useLanguage();
  const { data: session } = useSession();
  const t = translations[language];
  const params = useParams() as Record<string, string | string[]>;
  const rawSlug = params?.slug;
  const slugOrId = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug ?? "";
  const [article, setArticle] = useState<Article | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // تأثير Parallax للقسم الرئيسي
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
        
        console.log("Fetching article with slug:", slugOrId, "and language:", language);
        
        // جلب المقال من Sanity مع الحلقات والمواسم المرتبطة، مع دعم اللغة
        // تعديل الاستعلام للبحث عن المقال في كل اللغات أولاً، ثم التحقق من اللغة
        const query = `*[_type == "article" && slug.current == $slug][0]{
          _id,
          _type,
          title,
          titleEn,
          slug,
          excerpt,
          excerptEn,
          content,
          contentEn,
          publishedAt,
          featuredImageUrl,
          featuredImageUrlEn,
          episode-> {
            _id,
            title,
            titleEn,
            slug,
            thumbnailUrl,
            thumbnailUrlEn
          },
          season-> {
            _id,
            title,
            titleEn,
            slug,
            thumbnailUrl,
            thumbnailUrlEn
          },
          language
        }`;
        
        const art = await client.fetch(query, { slug: slugOrId });
        
        console.log("Article found:", art);
        
        if (!art) {
          console.error("Article not found for slug/ID:", slugOrId);
          throw new Error(t.notFound);
        }
        
        // التحقق من أن المقال ينتمي للغة الحالية
        if (art.language && art.language !== language) {
          console.error("Article language mismatch. Expected:", language, "Got:", art.language);
          
          // محاولة البحث عن مقال بنفس الـ slug في اللغة الأخرى
          const alternativeQuery = `*[_type == "article" && slug.current == $slug && language == $language][0]{
            _id,
            _type,
            title,
            titleEn,
            slug,
            excerpt,
            excerptEn,
            content,
            contentEn,
            publishedAt,
            featuredImageUrl,
            featuredImageUrlEn,
            episode-> {
              _id,
              title,
              titleEn,
              slug,
              thumbnailUrl,
              thumbnailUrlEn
            },
            season-> {
              _id,
              title,
              titleEn,
              slug,
              thumbnailUrl,
              thumbnailUrlEn
            },
            language
          }`;
          
          const alternativeArt = await client.fetch(alternativeQuery, { 
            slug: slugOrId, 
            language: language === 'ar' ? 'en' : 'ar' 
          });
          
          if (alternativeArt) {
            console.log("Found alternative article in different language:", alternativeArt);
            // توجيه المستخدم إلى المقال باللغة الصحيحة
            if (mounted) {
              window.location.href = `/${language === 'ar' ? 'en' : 'ar'}/articles/${slugOrId}`;
              return;
            }
          } else {
            throw new Error(t.notFound);
          }
        }
        
        // جلب الحلقات المرتبطة (إن وجدت)
        let relatedEpisodes: EpisodeItem[] = [];
        if (art.episode) {
          relatedEpisodes = [art.episode];
        }
        
        // جلب المواسم المرتبطة (إن وجدت)
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
  
  // التحقق من حالة المفضلة
  useEffect(() => {
    if (session?.user && article) {
      const checkFavorite = async () => {
        try {
          const response = await fetch(`/api/favorites?userId=${session.user.id}&contentId=${article._id}&contentType=article`);
          if (response.ok) {
            const data = await response.json();
            setIsFavorite(data.isFavorite);
          }
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      };

      checkFavorite();
    }
  }, [session, article]);
  
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
  
  // دالة آمنة للحصول على رابط الصورة
  const getImageUrl = (imageUrl?: string, imageUrlEn?: string): string => {
    // تحديد الرابط بناءً على اللغة
    const url = language === 'ar' ? imageUrl : imageUrlEn;
    
    if (!url) {
      console.log("No image URL provided, using placeholder");
      return '/placeholder.png';
    }
    
    console.log("Using image URL:", url);
    return url;
  };
  
  const featuredImageUrl = getImageUrl(article.featuredImageUrl, article.featuredImageUrlEn);
  console.log("Final featuredImageUrl:", featuredImageUrl);
  
  // دالة للتحقق مما إذا كان النص يحتوي على رابط فيديو
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

  // دالة للتحقق مما إذا كان النص يحتوي على رابط PDF
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

  // دالة للتحقق مما إذا كان النص يحتوي على رابط صورة
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
    // تحويل رابط Google Drive إلى رابط عرض مباشر
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      const fileId = driveMatch[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    // إذا كان الرابط ينتهي بـ .pdf، أعده كما هو
    if (url.toLowerCase().endsWith('.pdf')) {
      return url;
    }
    
    // إذا لم يكن من أي نوع معروف، أعد الرابط الأصلي
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
    
    // إذا لم يكن من أي نوع معروف، اعرض الرابط
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

  // مكون عرض الروابط المخصصة في ReactMarkdown
  const LinkRenderer = ({ href, children, ...props }: { href?: string; children?: React.ReactNode }) => {
    if (!href) return <>{children}</>;
    
    // تحقق مما إذا كان الرابط هو فيديو
    if (isVideoUrl(href)) {
      return renderVideo(href);
    }
    
    // تحقق مما إذا كان الرابط هو PDF
    if (isPdfUrl(href)) {
      return renderPdf(href);
    }
    
    // تحقق مما إذا كان الرابط هو صورة
    if (isImageUrl(href)) {
      return renderImage(href);
    }
    
    // إذا لم يكن من أي نوع، اعرض الرابط بشكل طبيعي
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

  // دالة لاستخراج كتل الكود من النص
  const extractCodeBlocks = (text: string) => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    let match;
    let processedText = text;
    
    // استخراج كتل الكود
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push(match[1]);
      processedText = processedText.replace(match[0], `__CODE_BLOCK_${codeBlocks.length - 1}__`);
    }
    
    return { processedText, codeBlocks };
  };

  // دالة لاستخراج كتل الاقتباس من النص
  const extractBlockQuotes = (text: string) => {
    const blockQuoteRegex = /^> (.+)$/gm;
    const blockQuotes: string[] = [];
    let match;
    let processedText = text;
    
    // استخراج كتل الاقتباس
    while ((match = blockQuoteRegex.exec(text)) !== null) {
      blockQuotes.push(match[1]);
      processedText = processedText.replace(match[0], `__BLOCK_QUOTE_${blockQuotes.length - 1}__`);
    }
    
    return { processedText, blockQuotes };
  };

  // دالة لمعالجة المحتوى مع الحفاظ على جميع التنسيقات
  const processContent = (content: PortableTextBlock[]) => {
    if (!content || !Array.isArray(content)) {
      return [];
    }
    
    // تحويل الكتل إلى نص Markdown
    const markdownText = blocksToText(content);
    
    // أولاً، استخراج كتل الكود
    const { processedText: textWithoutCode, codeBlocks } = extractCodeBlocks(markdownText);
    
    // ثانياً، استخراج كتل الاقتباس
    const { processedText: textWithoutQuotes, blockQuotes } = extractBlockQuotes(textWithoutCode);
    
    // ثالثاً، تقسيم المحتوى بناءً على الروابط الخاصة
    const parts = textWithoutQuotes.split(/(\nhttps?:\/\/[^\s]+\n|\nhttps?:\/\/[^\s]+$|https?:\/\/[^\s]+\n|https?:\/\/[^\s]+$)/);
    
    const result: JSX.Element[] = [];
    
    parts.forEach((part, index) => {
      if (!part.trim()) return;
      
      // تحقق مما إذا كان الجزء يحتوي على رابط فيديو
      if (isVideoUrl(part)) {
        const videoUrl = extractVideoUrl(part);
        if (videoUrl) {
          result.push(<React.Fragment key={`video-${index}`}>{renderVideo(videoUrl)}</React.Fragment>);
          return;
        }
      }
      
      // تحقق مما إذا كان الجزء يحتوي على رابط PDF
      if (isPdfUrl(part)) {
        const pdfUrl = extractPdfUrl(part);
        if (pdfUrl) {
          result.push(<React.Fragment key={`pdf-${index}`}>{renderPdf(pdfUrl)}</React.Fragment>);
          return;
        }
      }
      
      // تحقق مما إذا كان الجزء يحتوي على رابط صورة
      if (isImageUrl(part)) {
        const imageUrl = extractImageUrl(part);
        if (imageUrl) {
          result.push(<React.Fragment key={`image-${index}`}>{renderImage(imageUrl)}</React.Fragment>);
          return;
        }
      }
      
      // معالجة النص العادي، مع استبدال العناصر المستخرجة
      let processedPart = part;
      
      // استبدال كتل الاقتباس
      processedPart = processedPart.replace(/__BLOCK_QUOTE_(\d+)__/g, (match, indexStr) => {
        const index = parseInt(indexStr);
        if (blockQuotes[index]) {
          return `> ${blockQuotes[index]}`;
        }
        return match;
      });
      
      // استخدام ReactMarkdown لعرض النص
      result.push(
        <div key={`markdown-${index}`} className={`prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            components={{
              // عرض الروابط المخصصة
              a: LinkRenderer,
              // عرض الصور المخصصة
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
                      className="w-full h-full rounded-xl shadow-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                );
              },
              // عرض الجداول المخصصة
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className={`border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className={`border border-gray-300 dark:border-gray-600 px-4 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {children}
                </td>
              ),
              // عرض الكود المضمن المخصص
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
              // عرض الاقتباس المخصص
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
      
      // إضافة كتل الكود المستخرجة
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
  
  // دالة لتنسيق التاريخ بناءً على اللغة
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  
  const scrollToComments = () => {
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* القسم الرئيسي */}
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
      
      {/* المحتوى الرئيسي */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
        
          {/* قسم المقدمة */}
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
              </div>
              
              <div className={`prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-purple-100 dark:border-gray-700 backdrop-blur-md">
                  <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 leading-relaxed">
                    {excerpt}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* قسم المحتوى */}
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
              
              <div className={`prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-purple-100 dark:border-gray-700 backdrop-blur-md">
                  {/* استخدام دالة processContent لعرض المحتوى مع الحفاظ على التنسيق */}
                  {processContent(content)}
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* قسم التفاعل مع المقال */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  {t.interactWithArticle}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              </div>
              
              {/* ACTION BUTTONS - قسم محسّن بالأزرار الجديدة */}
              <div className="mt-6 md:mt-8">
                <ActionButtons 
                  contentId={article._id} 
                  contentType="article" 
                  title={title}
                  onCommentClick={scrollToComments}
                  isFavorite={isFavorite}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            </div>
          </motion.section>
          
          {/* قسم الموسم */}
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
                  const seasonImageUrl = getImageUrl(season.thumbnailUrl, season.thumbnailUrlEn);
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
          
          {/* قسم الحلقة */}
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
                  const episodeImageUrl = getImageUrl(episode.thumbnailUrl, episode.thumbnailUrlEn);
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
          
          {/* قسم التعليقات */}
          <motion.section 
            id="comments-section"
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
            
            {/* استخدام المكون الجديد للتعليقات */}
            <CommentsClient contentId={article._id} type="article" />
          </motion.section>
        </div>
      </div>
      
      {/* أنماط Swiper المخصصة */}
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
        /* تنسيق الصور في قسم المحتوى */
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
        /* تعديل اتجاه النص حسب اللغة */
        .prose p, .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6, .prose ul, .prose ol, .prose li {
          text-align: inherit;
        }
        .prose ul, .prose ol {
          padding-left: 1.5rem;
        }
        .prose[dir="rtl"] ul, .prose[dir="rtl"] ol {
          padding-left: 0;
          padding-right: 1.5rem;
        }
        .prose[dir="ltr"] ul, .prose[dir="ltr"] ol {
          padding-left: 1.5rem;
          padding-right: 0;
        }
        /* تعديل اتجاه القوائم */
        .prose[dir="rtl"] li {
          text-align: right;
        }
        .prose[dir="ltr"] li {
          text-align: left;
        }
        /* تعديل اتجاه الفقرات */
        .prose[dir="rtl"] p {
          text-align: right;
        }
        .prose[dir="ltr"] p {
          text-align: left;
        }
        /* تعديل اتجاه العناوين */
        .prose[dir="rtl"] h1, .prose[dir="rtl"] h2, .prose[dir="rtl"] h3, .prose[dir="rtl"] h4, .prose[dir="rtl"] h5, .prose[dir="rtl"] h6 {
          text-align: right;
        }
        .prose[dir="ltr"] h1, .prose[dir="ltr"] h2, .prose[dir="ltr"] h3, .prose[dir="ltr"] h4, .prose[dir="ltr"] h5, .prose[dir="ltr"] h6 {
          text-align: left;
        }
      `}</style>
    </div>
  );
}