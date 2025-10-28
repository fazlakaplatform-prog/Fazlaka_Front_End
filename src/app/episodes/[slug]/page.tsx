"use client";
import React, { useEffect, useRef, useState, useCallback, JSX } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useParams, useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { client, fetchFromSanity, fetchArrayFromSanity } from "@/lib/sanity";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedText } from "@/lib/sanity";

import { FaPlay, FaClock, FaComment, FaStar, FaFileAlt, FaImage, FaGoogleDrive, FaReply, FaTrash } from "react-icons/fa";

// تعريف الأنواع مباشرة في الملف مع دعم اللغة
interface Season {
  _id: string;
  title?: string;
  titleEn?: string;
  slug?: { current: string };
  thumbnailUrl?: string;
  language?: 'ar' | 'en';
}

interface Episode {
  _id: string;
  title?: string;
  titleEn?: string;
  slug: { current: string };
  description?: string | SanityBlock[];
  descriptionEn?: string | SanityBlock[];
  content?: string | SanityBlock[];
  contentEn?: string | SanityBlock[];
  videoUrl?: string;
  thumbnailUrl?: string;
  season?: Season;
  articles?: Article[];
  publishedAt?: string;
  language?: 'ar' | 'en';
}

interface Article {
  _id: string;
  title?: string;
  titleEn?: string;
  slug: { current: string };
  excerpt?: string;
  excerptEn?: string;
  featuredImageUrl?: string;
  language?: 'ar' | 'en';
}

interface Comment {
  _id?: string;
  _type?: string;
  content?: string;
  name?: string;
  email?: string;
  createdAt?: string | Date;
  episode?: {
    _ref: string;
  };
  article?: {
    _ref: string;
  };
  parentComment?: {
    _ref: string;
  };
  replies?: Comment[];
  userId?: string;
  userFirstName?: string;
  userLastName?: string;
  userImageUrl?: string;
}

interface SanityBlock {
  _type: "block";
  style?: string;
  listItem?: string;
  level?: number;
  children?: SanitySpan[];
}

interface SanitySpan {
  text?: string;
  marks?: string[];
  _type?: "span" | "link";
  href?: string;
}

// تعريف أنواع Props للمكونات - تم تحسينها لتكون متوافقة مع HTMLAttributes
type MarkdownComponentProps = React.HTMLAttributes<HTMLElement>;
type CodeComponentProps = React.HTMLAttributes<HTMLElement> & {
  inline?: boolean;
};

// كائن الترجمات
const translations = {
  ar: {
    loading: "جارٍ التحميل...",
    error: "حدث خطأ",
    notFound: "لم تُعثر على الحلقة",
    backToHome: "العودة إلى الرئيسية",
    newEpisode: "حلقة جديدة",
    featured: "مميز",
    share: "مشاركة",
    aboutEpisode: "نبذة عن الحلقة",
    content: "المحتوى",
    season: "الموسم",
    suggestedEpisodes: "حلقات مقترحة",
    relatedArticles: "مقالات مرتبطة",
    comments: "التعليقات",
    noComments: "لا توجد تعليقات بعد.",
    signInToComment: "يجب تسجيل الدخول لكي تتمكن من إرسال تعليق.",
    signIn: "تسجيل الدخول",
    writeComment: "اكتب تعليقك هنا...",
    sendComment: "أرسل التعليق",
    sending: "جاري الإرسال...",
    commentSent: "تم إرسال تعليقك بنجاح!",
    writeCommentBeforeSend: "اكتب تعليقاً قبل الإرسال.",
    noPermission: "ليس لديك صلاحية لإرسال التعليقات. يرجى التواصل مع الإدارة.",
    unexpectedError: "حدث خطأ غير متوقع أثناء الإرسال",
    viewAllEpisodes: "عرض جميع الحلقات",
    clickToViewSeason: "اضغط لعرض حلقات الموسم",
    readArticle: "قراءة المقال",
    viewAllArticles: "عرض جميع المقالات",
    episode: "حلقة",
    article: "مقال",
    document: "مستند",
    image: "صورة",
    openInDrive: "فتح في Google Drive",
    openImage: "فتح الصورة",
    noTitle: "بدون عنوان",
    noSeason: "بدون موسم",
    readMore: "اقرأ المزيد...",
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
    shareEpisode: "مشاركة الحلقة",
    commentEpisode: "تعليق على الحلقة",
    saveEpisode: "حفظ الحلقة",
    savedEpisode: "تم الحفظ",
    interactWithEpisode: "تفاعل مع الحلقة"
  },
  en: {
    loading: "Loading...",
    error: "An error occurred",
    notFound: "Episode not found",
    backToHome: "Back to Home",
    newEpisode: "New Episode",
    featured: "Featured",
    share: "Share",
    aboutEpisode: "About the Episode",
    content: "Content",
    season: "Season",
    suggestedEpisodes: "Suggested Episodes",
    relatedArticles: "Related Articles",
    comments: "Comments",
    noComments: "No comments yet.",
    signInToComment: "You must be signed in to post a comment.",
    signIn: "Sign In",
    writeComment: "Write your comment here...",
    sendComment: "Send Comment",
    sending: "Sending...",
    commentSent: "Your comment has been sent successfully!",
    writeCommentBeforeSend: "Write a comment before sending.",
    noPermission: "You don't have permission to post comments. Please contact the administrator.",
    unexpectedError: "An unexpected error occurred while sending",
    viewAllEpisodes: "View All Episodes",
    clickToViewSeason: "Click to view season episodes",
    readArticle: "Read Article",
    viewAllArticles: "View All Articles",
    episode: "Episode",
    article: "Article",
    document: "Document",
    image: "Image",
    openInDrive: "Open in Google Drive",
    openImage: "Open Image",
    noTitle: "No Title",
    noSeason: "No Season",
    readMore: "Read more...",
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
    shareEpisode: "Share Episode",
    commentEpisode: "Comment on Episode",
    saveEpisode: "Save Episode",
    savedEpisode: "Saved",
    interactWithEpisode: "Interact with Episode"
  }
};

// دالة محسّنة لتحويل محتوى الكتل من Sanity إلى نص مع الحفاظ على جميع التنسيقات
function blocksToText(blocks: SanityBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) {
    return '';
  }
  
  return blocks
    .map(block => {
      if (block._type !== 'block' || !block.children) {
        return '';
      }
      
      let markdown = '';
      
      // معالجة العناوين
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
        let prefix = '';
        // التحقق من نوع القائمة
        if (block.listItem === 'bullet') {
          prefix = '- ';
        } else if (block.listItem === 'number') {
          prefix = '1. '; // استخدام تنسيق القائمة المرتبة
        }
        
        // إضافة المسافات البادئة حسب مستوى التداخل
        if (block.level && block.level > 1) {
          prefix = '  '.repeat(block.level - 1) + prefix;
        }
        markdown += prefix;
      }
      
      // معالجة الاقتباسات
      if (block.style === 'blockquote') {
        // تقسيم النص إلى أسطر وإضافة > لكل سطر
        const lines = block.children
          .map((child) => child.text || '')
          .join(' ')
          .split('\n');
        
        return lines.map(line => `> ${line}`).join('\n');
      }
      
      // معالجة الكود البرمجي
      if (block.style === 'code') {
        markdown += '```\n';
      }
      
      // إضافة النص مع التنسيقات
      markdown += block.children
        .map((child) => {
          let text = child.text || '';
          
          // إضافة تنسيقات النص
          if (child.marks) {
            child.marks.forEach((mark) => {
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
          
          // إضافة الروابط
          if (child._type === 'link' && child.href) {
            text = `[${text}](${child.href})`;
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

// دالة لتحويل روابط الفيديو إلى روابط مضمنة
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

// مكون التعليق الفردي
function CommentItem({ 
  comment, 
  onReply, 
  onDelete, 
  isRTL,
  language,
  t,
  user,
  contentId,
  type
}: { 
  comment: Comment; 
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isRTL: boolean;
  language: 'ar' | 'en';
  t: typeof translations.ar | typeof translations.en;
  user: Session["user"] | null;
  contentId: string;
  type: "article" | "episode";
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const createdAt = comment.createdAt ? new Date(comment.createdAt) : new Date();
  const isOwner = user && (comment.userId === user.id || comment.email === user.email);
  
  // دالة للحصول على اسم العرض الكامل
  const getDisplayName = () => {
    if (comment.userFirstName && comment.userLastName) {
      return `${comment.userFirstName} ${comment.userLastName}`;
    }
    return comment.name || "مستخدم";
  };
  
  // دالة للحصول على صورة المستخدم مع التحقق من null
  const getUserImage = (): string => {
    if (comment.userImageUrl) {
      return comment.userImageUrl;
    }
    // صورة افتراضية إذا لم توجد صورة
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=8b5cf6&color=fff`;
  };
  
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    setReplying(true);
    try {
      await onReply(comment._id!, replyContent);
      setReplyContent("");
      setShowReplyForm(false);
      // تحديث قائمة الردود
      if (!showReplies) {
        setShowReplies(true);
      }
    } catch (error) {
      console.error("Error replying to comment:", error);
    } finally {
      setReplying(false);
    }
  };
  
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(comment._id!);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 mb-4 border border-gray-100 dark:border-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}
    >
      <div className="flex items-start gap-3">
        {/* صورة المستخدم */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-700">
            <Image
              src={getUserImage()}
              alt={getDisplayName()}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* محتوى التعليق */}
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{getDisplayName()}</h4>
            <div className="flex items-center gap-2">
              <time dateTime={createdAt.toISOString()} className="text-xs text-gray-500 dark:text-gray-400">
                {createdAt.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
              {isOwner && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title={t.delete}
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-2">{comment.content}</p>
          
          {/* أزرار الرد */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <FaReply className="text-xs" />
              {t.reply}
            </button>
            
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showReplies ? t.hideReplies : t.showReplies} ({comment.replies.length})
              </button>
            )}
          </div>
          
          {/* نموذج الرد */}
          {showReplyForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <form onSubmit={handleReply}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="w-full border p-2 rounded mb-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  placeholder={`${t.writeReply} ${getDisplayName()}...`}
                  required
                  disabled={replying}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyForm(false)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={replying || !replyContent.trim()}
                    className={`px-3 py-1 text-sm rounded text-white ${
                      replying || !replyContent.trim()
                        ? "bg-gray-400 dark:bg-gray-600"
                        : "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
                    } transition-colors`}
                  >
                    {replying ? t.replying : t.sendReply}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          
          {/* عرض الردود */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  onReply={onReply}
                  onDelete={onDelete}
                  isRTL={isRTL}
                  language={language}
                  t={t}
                  user={user}
                  contentId={contentId}
                  type={type}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* نافذة تأكيد الحذف */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              {t.confirmDelete}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              {t.confirmDelete}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`px-3 py-1 text-sm rounded text-white ${
                  deleting
                    ? "bg-gray-400 dark:bg-gray-600"
                    : "bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600"
                } transition-colors`}
              >
                {deleting ? "جاري الحذف..." : t.delete}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// مكون التعليقات
function CommentsClient({ 
  contentId, 
  type = "episode" 
}: { 
  contentId: string; 
  type?: "article" | "episode" 
}) {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { data: session, status } = useSession();
  
  const fetchComments = useCallback(async () => {
    try {
      const query = `*[_type == "comment" && ${type}._ref == $contentId && !defined(parentComment)]{
        _id,
        name,
        email,
        content,
        createdAt,
        userId,
        userFirstName,
        userLastName,
        userImageUrl,
        "replies": *[_type == "comment" && parentComment._ref == ^._id] | order(createdAt asc) {
          _id,
          name,
          email,
          content,
          createdAt,
          userId,
          userFirstName,
          userLastName,
          userImageUrl
        }
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
      setErrorMsg(t.writeCommentBeforeSend);
      return;
    }
    if (status !== "authenticated" || !session?.user) {
      setErrorMsg(t.signInToComment);
      return;
    }
    setLoading(true);
    
    try {
      const apiResponse = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          name: session.user.name || "مستخدم",
          email: session.user.email || "",
          userId: session.user.id,
          userFirstName: session.user.name?.split(' ')[0] || "",
          userLastName: session.user.name?.split(' ').slice(1).join(' ') || "",
          userImageUrl: session.user.image || "",
          [type]: contentId,
        }),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log("Comment created via API:", data);
        setSuccessMsg(t.commentSent);
        setContent("");
        fetchComments();
      } else {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || "Failed to create comment");
      }
    } catch (err: unknown) {
      console.error("Error sending comment:", err);
      if (err instanceof Error) {
        if (err.message.includes("Insufficient permissions")) {
          setErrorMsg(t.noPermission);
        } else {
          setErrorMsg(`${t.unexpectedError}: ${err.message}`);
        }
      } else {
        setErrorMsg(t.unexpectedError);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleReply = async (parentId: string, replyContent: string) => {
    if (status !== "authenticated" || !session?.user) {
      setErrorMsg(t.signInToComment);
      return;
    }
    
    try {
      const apiResponse = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          name: session.user.name || "مستخدم",
          email: session.user.email || "",
          userId: session.user.id,
          userFirstName: session.user.name?.split(' ')[0] || "",
          userLastName: session.user.name?.split(' ').slice(1).join(' ') || "",
          userImageUrl: session.user.image || "",
          parentComment: parentId,
          [type]: contentId,
        }),
      });

      if (apiResponse.ok) {
        setSuccessMsg(t.replySuccess);
        fetchComments();
      } else {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || "Failed to create reply");
      }
    } catch (err: unknown) {
      console.error("Error replying to comment:", err);
      if (err instanceof Error) {
        setErrorMsg(`${t.unexpectedError}: ${err.message}`);
      } else {
        setErrorMsg(t.unexpectedError);
      }
    }
  };
  
  const handleDelete = async (commentId: string) => {
    if (status !== "authenticated" || !session?.user) {
      setErrorMsg(t.signInToComment);
      return;
    }
    
    try {
      const apiResponse = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      if (apiResponse.ok) {
        setSuccessMsg(t.deleteSuccess);
        fetchComments();
      } else {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }
    } catch (err: unknown) {
      console.error("Error deleting comment:", err);
      if (err instanceof Error) {
        setErrorMsg(`${t.unexpectedError}: ${err.message}`);
      } else {
        setErrorMsg(t.unexpectedError);
      }
    }
  };
  
  // دالة للحصول على صورة المستخدم الحالي مع التحقق من null
  const getCurrentUserImage = (): string => {
    if (session?.user?.image) {
      return session.user.image;
    }
    // صورة افتراضية إذا لم توجد صورة
    const displayName = session?.user?.name || "مستخدم";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff`;
  };
  
  // دالة للحصول على اسم العرض الكامل للمستخدم الحالي
  const getCurrentUserDisplayName = () => {
    return session?.user?.name || "مستخدم";
  };
  
  return (
    <div className="mt-6 rounded-xl overflow-hidden">
      {status !== "authenticated" && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="mb-2 text-blue-800 dark:text-blue-200">{t.signInToComment}</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {t.signIn}
          </Link>
        </div>
      )}
      {status === "authenticated" && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-start gap-3">
            {/* صورة المستخدم */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-700">
                <Image
                  src={getCurrentUserImage()}
                  alt={getCurrentUserDisplayName()}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* حقل إدخال التعليق */}
            <div className="flex-grow">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full border p-3 rounded-lg mb-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t.writeComment}
                required
                disabled={loading}
                aria-label="تعليق"
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {errorMsg && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
                  )}
                  {successMsg && (
                    <p className="text-sm text-green-600 dark:text-green-400">{successMsg}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
                    loading || !content.trim()
                      ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                      : "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md hover:shadow-lg"
                  }`}
                  aria-busy={loading}
                >
                  {loading ? t.sending : t.sendComment}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
      
      {/* قائمة التعليقات */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaComment className="text-4xl mx-auto mb-2 opacity-50" />
            <p>{t.noComments}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDelete}
              isRTL={isRTL}
              language={language}
              t={t}
              user={session?.user || null}
              contentId={contentId}
              type={type}
            />
          ))
        )}
      </div>
    </div>
  );
}

// مكون FavoriteButton المحسّن
function FavoriteButton({ contentId, contentType, isFavorite, onToggle }: { 
  contentId: string; 
  contentType: "episode" | "article"; 
  isFavorite: boolean;
  onToggle: () => void;
}) {
  const { data: session } = useSession();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // نصوص التطبيق حسب اللغة
  const texts = {
    ar: {
      addToFavorites: "إضافة للمفضلة",
      removeFromFavorites: "إزالة من المفضلة",
      errorMessage: "حدث خطأ أثناء تحديث المفضلة. يرجى المحاولة مرة أخرى."
    },
    en: {
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
      errorMessage: "An error occurred while updating favorites. Please try again."
    }
  };

  const t = texts[language];

  useEffect(() => {
    if (session) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [session]);

  async function handleToggle() {
    if (!session?.user || actionLoading) return;
    
    setActionLoading(true);
    
    try {
      const method = isFavorite ? "DELETE" : "POST";
      const response = await fetch(`/api/favorites`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          contentId,
          contentType,
        }),
      });

      if (response.ok) {
        onToggle();
      } else {
        const errorData = await response.json();
        console.error("Error toggling favorite:", errorData);
        alert(t.errorMessage);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert(t.errorMessage);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={actionLoading || !session?.user}
      aria-label={isFavorite ? t.removeFromFavorites : t.addToFavorites}
      className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 overflow-hidden"
    >
      {/* خلفية متدرجة */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isFavorite ? 'from-red-500 to-pink-600' : 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'} transition-all duration-500`}></div>
      
      {/* تأثير اللمعان */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* تأثير الحركة عند التفعيل */}
      {isFavorite && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-red-500/30 animate-ping"></div>
        </div>
      )}
      
      {/* الأيقونة */}
      <div className="relative z-10 flex items-center justify-center">
        {actionLoading ? (
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg 
            className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${isFavorite ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} 
            fill={isFavorite ? "currentColor" : "none"} 
            stroke={isFavorite ? "white" : "currentColor"}
            strokeWidth={isFavorite ? 0 : 2}
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        )}
      </div>
      
      {/* تأثير النبض عند التفعيل */}
      {isFavorite && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
    </button>
  );
}

// مكون الأزرار المحسّن
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
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

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

  const handleBookmark = () => {
    if (!session?.user || bookmarkLoading) return;
    
    setBookmarkLoading(true);
    
    // محاكاة عملية الحفظ
    setTimeout(() => {
      setIsBookmarked(!isBookmarked);
      setBookmarkLoading(false);
    }, 1000);
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
          {translations[language].interactWithEpisode}
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
            {translations[language].shareEpisode}
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
            {translations[language].commentEpisode}
          </span>
        </div>
        
        {/* زر الحفظ */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleBookmark}
            disabled={bookmarkLoading || !session?.user}
            className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden disabled:opacity-50"
          >
            {/* خلفية متدرجة */}
            <div className={`absolute inset-0 bg-gradient-to-br ${isBookmarked ? 'from-emerald-500 to-emerald-600' : 'from-slate-400 to-slate-500'} transition-all duration-500`}></div>
            
            {/* تأثير اللمعان */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* تأثير الحركة عند التفعيل */}
            {isBookmarked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-emerald-500/30 animate-ping"></div>
              </div>
            )}
            
            {/* الأيقونة */}
            <div className="relative z-10 flex items-center justify-center">
              {bookmarkLoading ? (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg 
                  className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 text-white`} 
                  fill={isBookmarked ? "currentColor" : "none"} 
                  stroke="white"
                  strokeWidth={isBookmarked ? 0 : 2}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                </svg>
              )}
            </div>
            
            {/* تأثير النبض عند التفعيل */}
            {isBookmarked && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            )}
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isBookmarked ? translations[language].savedEpisode : translations[language].saveEpisode}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EpisodeDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { data: session } = useSession();
  const t = translations[language];
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug ?? "";
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [suggested, setSuggested] = useState<Episode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Swiper navigation refs
  const navPrevRef = useRef<HTMLButtonElement | null>(null);
  const navNextRef = useRef<HTMLButtonElement | null>(null);
  
  // Parallax for Hero
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 100]);
  
  // دالة محسّنة للتعامل مع صور URL مباشرة
  const getThumbnailUrl = useCallback((thumbnailUrl?: string): string => {
    if (!thumbnailUrl) return "/placeholder.png";
    
    // إذا كان الرابط نصياً، أرجعه كما هو
    if (typeof thumbnailUrl === 'string') {
      return thumbnailUrl;
    }
    
    // إذا لم يكن نصياً، ارجع صورة افتراضية
    return "/placeholder.png";
  }, []);
  
  // دالة لتحديد ما إذا كان النص يحتوي على رابط فيديو
  const isVideoUrl = useCallback((text: string) => {
    const videoUrlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|.*\.(?:mp4|webm|ogg))[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    return videoUrlRegex.test(text);
  }, []);

  // دالة لتحديد ما إذا كان النص يحتوي على رابط PDF
  const isPdfUrl = useCallback((text: string) => {
    const pdfUrlRegex = /(https?:\/\/(?:www\.)?(?:drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+|.*\.pdf)[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    return pdfUrlRegex.test(text);
  }, []);

  // دالة لتحديد ما إذا كان النص يحتوي على رابط صورة
  const isImageUrl = useCallback((text: string) => {
    const imageUrlRegex = /(https?:\/\/(?:www\.)?(?:.*\.(?:jpg|jpeg|png|gif|webp|svg))[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    return imageUrlRegex.test(text);
  }, []);

  // دالة لتحويل رابط Google Drive إلى رابط عرض مباشر
  const getDirectGoogleDriveLink = useCallback((url: string) => {
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
  }, []);

  // دالة لعرض الفيديو بناءً على الرابط
  const renderVideo = useCallback((url: string) => {
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
            متصفحك لا يدعم تشغيل الفيديو.
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
  }, []);

  // دالة لعرض PDF بناءً على الرابط
  const renderPdf = useCallback((url: string) => {
    const directUrl = getDirectGoogleDriveLink(url);
    
    return (
      <div className="my-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
              <FaFileAlt className="text-sm" />
            </div>
            <h3 className="text-lg font-bold">{t.document}</h3>
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg"
          >
            <FaGoogleDrive />
            <span>{t.openInDrive}</span>
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
  }, [getDirectGoogleDriveLink, t.document, t.openInDrive]);

  // دالة لعرض الصورة بناءً على الرابط
  const renderImage = useCallback((url: string) => {
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
            alt="صورة من المحتوى"
            width={800}
            height={450}
            className="w-full h-auto object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </div>
    );
  }, [t.image, t.openImage]);

  // دالة محسّنة لمعالجة المحتوى مع الحفاظ على جميع التنسيقات
  const processContent = useCallback((content: string): JSX.Element[] => {
    if (!content) return [];
    
    // معالجة الروابط المضمنة في النص دون تقسيم المحتوى
    const processedContent = content.replace(
      /(https?:\/\/[^\s]+)/g,
      (match) => {
        if (isVideoUrl(match)) return match;
        if (isPdfUrl(match)) return match;
        if (isImageUrl(match)) return match;
        return `[${match}](${match})`;
      }
    );
    
    // تقسيم المحتوى إلى أجزاء منفصلة بناءً على العناصر التي لا يمكن أن تكون داخل فقرات
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = processedContent.split(codeBlockRegex);
    const codeBlocks: string[] = [];
    let processedText = parts[0];
    
    // استخراج كتل الكود
    for (let i = 1; i < parts.length; i += 2) {
      codeBlocks.push(parts[i]);
      processedText += `__CODE_BLOCK_${codeBlocks.length - 1}__`;
      if (i + 1 < parts.length) {
        processedText += parts[i + 1];
      }
    }
    
    // تقسيم النص إلى فقرات
    const paragraphs = processedText.split(/\n\n+/);
    
    const result: JSX.Element[] = [];
    
    paragraphs.forEach((paragraph, index) => {
      if (!paragraph.trim()) return;
      
      // استبدال كتل الكود المستخرجة
      let processedParagraph = paragraph;
      codeBlocks.forEach((codeBlock, codeIndex) => {
        const match = new RegExp(`__CODE_BLOCK_${codeIndex}__`).exec(paragraph);
        if (match) {
          // إذا كانت الفقرة تحتوي فقط على كتلة كود
          if (paragraph.trim() === `__CODE_BLOCK_${codeIndex}__`) {
            result.push(
              <div key={`code-${index}-${codeIndex}`} className="my-4">
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  <code>
                    {codeBlock}
                  </code>
                </pre>
              </div>
            );
            return;
          }
          
          // إذا كانت الفقرة تحتوي على كتلة كود مع نص آخر
          const parts = paragraph.split(`__CODE_BLOCK_${codeIndex}__`);
          processedParagraph = parts.join(`__CODE_BLOCK_PLACEHOLDER_${codeIndex}__`);
        }
      });
      
      // إذا كانت الفقرة تحتوي على كتل كود، نعرضها بشكل منفصل
      if (processedParagraph.includes('__CODE_BLOCK_PLACEHOLDER_')) {
        const parts = processedParagraph.split(/__CODE_BLOCK_PLACEHOLDER_(\d+)__/g);
        
        parts.forEach((part, partIndex) => {
          if (partIndex % 2 === 0) {
            // هذا جزء نص عادي
            if (part.trim()) {
              // تقسيم الجزء النصي إلى أسطر
              const lines = part.split('\n');
              
              lines.forEach((line, lineIndex) => {
                if (line.trim()) {
                  result.push(
                    <div key={`text-${index}-${partIndex}-${lineIndex}`} className="mb-4">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                        components={{
                          a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
                            const { href, children, ...rest } = props;
                            if (!href) return <span {...rest}>{children}</span>;
                            
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
                                {...rest}
                              >
                                {children}
                              </a>
                            );
                          },
                          strong: (props: MarkdownComponentProps) => <strong className="font-bold" {...props} />,
                          em: (props: MarkdownComponentProps) => <em className="italic" {...props} />,
                          u: (props: MarkdownComponentProps) => <u className="underline" {...props} />,
                          code: (props: CodeComponentProps) => {
                            if (props.inline) {
                              return (
                                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                                  {props.children}
                                </code>
                              );
                            }
                            return <code {...props}>{props.children}</code>;
                          },
                          // منع إنشاء فقرات متداخلة
                          p: (props: MarkdownComponentProps) => <span {...props}>{props.children}</span>,
                        }}
                      >
                        {line}
                      </ReactMarkdown>
                    </div>
                  );
                }
              });
            }
          } else {
            // هذا جزء كتلة كود
            const codeIndex = parseInt(part);
            result.push(
              <div key={`code-${index}-${codeIndex}`} className="my-4">
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  <code>
                    {codeBlocks[codeIndex]}
                  </code>
                </pre>
              </div>
            );
          }
        });
        
        return;
      }
      
      // إذا كانت الفقرة لا تحتوي على كتل كود، نعرضها بشكل طبيعي
      // تقسيم الفقرة إلى أسطر
      const lines = processedParagraph.split('\n');
      
      lines.forEach((line, lineIndex) => {
        if (line.trim()) {
          result.push(
            <div key={`text-${index}-${lineIndex}`} className="mb-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
                    const { href, children, ...rest } = props;
                    if (!href) return <span {...rest}>{children}</span>;
                    
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
                        {...rest}
                      >
                        {children}
                      </a>
                    );
                  },
                  strong: (props: MarkdownComponentProps) => <strong className="font-bold" {...props} />,
                  em: (props: MarkdownComponentProps) => <em className="italic" {...props} />,
                  u: (props: MarkdownComponentProps) => <u className="underline" {...props} />,
                  code: (props: CodeComponentProps) => {
                    if (props.inline) {
                      return (
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                          {props.children}
                        </code>
                      );
                    }
                    return <code {...props}>{props.children}</code>;
                  },
                  // منع إنشاء فقرات متداخلة
                  p: (props: MarkdownComponentProps) => <span {...props}>{props.children}</span>,
                }}
              >
                {line}
              </ReactMarkdown>
            </div>
          );
        }
      });
    });
    
    return result;
  }, [isVideoUrl, isPdfUrl, isImageUrl, renderVideo, renderPdf, renderImage]);
  
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setEpisode(null);
      setSuggested([]);
      setArticles([]);
      setIsFavorite(false);
      try {
        if (!slug) {
          setError(t.error);
          setLoading(false);
          return;
        }
        
        // Fetch episode with related articles
        const episodeQuery = `*[_type == "episode" && slug.current == $slug && language == $language][0]{
          _id,
          title,
          titleEn,
          slug,
          description,
          descriptionEn,
          content,
          contentEn,
          videoUrl,
          thumbnailUrl,
          season->{
            _id,
            title,
            titleEn,
            slug,
            thumbnailUrl
          },
          articles[]-> {
            _id,
            title,
            titleEn,
            slug,
            excerpt,
            excerptEn,
            featuredImageUrl
          }
        }`;
        const ep = await fetchFromSanity<Episode>(episodeQuery, { slug, language });
        
        if (!ep) throw new Error(t.notFound);
        
        // Fetch suggested episodes
        const suggestedQuery = `*[_type == "episode" && _id != $id && language == $language && !(_id in path("drafts.**"))][0...20]{
          _id,
          title,
          titleEn,
          slug,
          thumbnailUrl
        } | order(_createdAt desc)`;
        const suggestedEpisodes = await fetchArrayFromSanity<Episode>(suggestedQuery, { id: ep._id, language });
        
        if (mounted) {
          setEpisode(ep);
          setSuggested(suggestedEpisodes);
          // Set articles from the episode query (only related articles)
          setArticles(ep.articles || []);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (e: unknown) {
        if (mounted) {
          setError(e instanceof Error ? e.message : t.error);
          setLoading(false);
        }
      }
    }
    
    load();
    return () => {
      mounted = false;
    };
  }, [slug, language, t.error, t.notFound]);
  
  // التحقق من حالة المفضلة
  useEffect(() => {
    if (session?.user && episode) {
      const checkFavorite = async () => {
        try {
          const response = await fetch(`/api/favorites?userId=${session.user.id}&contentId=${episode._id}&contentType=episode`);
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
  }, [session, episode]);
  
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
          {t.backToHome}
        </button>
      </div>
    );
  if (!episode) return <div className="p-8 text-center">{t.notFound}</div>;
  
  const title = getLocalizedText(episode.title, episode.titleEn, language) || t.noTitle;
  
  // تعديل طريقة تحويل المحتوى بناءً على اللغة
  const description = language === 'ar' 
    ? (typeof episode.description === 'string' 
        ? episode.description || ""
        : blocksToText(episode.description || []))
    : (typeof episode.descriptionEn === 'string' 
        ? episode.descriptionEn || ""
        : blocksToText(episode.descriptionEn || []));
  
  const content = language === 'ar' 
    ? (typeof episode.content === 'string' 
        ? episode.content || ""
        : blocksToText(episode.content || []))
    : (typeof episode.contentEn === 'string' 
        ? episode.contentEn || ""
        : blocksToText(episode.contentEn || []));
  
  const videoUrl = episode.videoUrl || "";
  const embedUrl = toEmbed(videoUrl);
  const season = episode.season;
  const seasonTitle = getLocalizedText(season?.title, season?.titleEn, language) || t.noSeason;
  const seasonSlug = season?.slug?.current || season?._id;
  
  const thumbnailUrl = getThumbnailUrl(episode.thumbnailUrl);
  const seasonThumbnailUrl = getThumbnailUrl(season?.thumbnailUrl);
  
  // معالجة المحتوى
  const processedDescription = processContent(description);
  const processedContent = content ? processContent(content) : [];
  
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
  
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* HERO */}
      <header className="relative w-full overflow-hidden shadow-2xl">
        <motion.div
          style={{ y }}
          className="relative h-[50vh] md:h-[70vh]"
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
          <div className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} p-4 md:p-6 lg:p-10 text-${isRTL ? 'right' : 'left'} w-full`}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-block backdrop-blur-lg bg-black/40 rounded-2xl md:rounded-3xl px-4 md:px-8 py-4 md:py-6 shadow-2xl border border-white/10 max-w-full"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full text-xs font-bold text-white shadow-lg">
                  {t.newEpisode}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold text-white shadow-lg">
                  <FaStar className="text-yellow-300" />
                  {t.featured}
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
              {episode.publishedAt && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                  <FaClock />
                  <span>{formatDate(episode.publishedAt)}</span>
                </div>
              )}
            </motion.div>
          </div>
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
              
              {/* ACTION BUTTONS - قسم محسّن بالأزرار الجديدة */}
              <div className="mt-6 md:mt-8">
                <ActionButtons 
                  contentId={episode._id} 
                  contentType="episode" 
                  title={title}
                  onCommentClick={() => {
                    const commentsSection = document.getElementById('comments-section');
                    if (commentsSection) {
                      commentsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  isFavorite={isFavorite}
                  onToggleFavorite={handleToggleFavorite}
                />
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
                  {t.aboutEpisode}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              </div>
              
              <div className={`prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-blue-100 dark:border-gray-700 backdrop-blur-md">
                  {processedDescription}
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* CONTENT SECTION */}
          {processedContent.length > 0 && (
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
                    {t.content}
                  </h2>
                  <div className="flex-grow h-px bg-gradient-to-r from-green-200 to-transparent"></div>
                </div>
                
                <div className={`prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="bg-gradient-to-br from-green-50/50 to-teal-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-green-100 dark:border-gray-700 backdrop-blur-md">
                    {processedContent}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
          
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
                {t.season}
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
                    <span className="text-white font-bold text-sm md:text-base md:text-lg">{t.viewAllEpisodes}</span>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-lg md:text-xl font-bold mb-2">{seasonTitle}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {t.clickToViewSeason}
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
                  {t.suggestedEpisodes}
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
                    // Fix: Properly type check and assign navigation parameters
                    if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                      swiper.params.navigation.prevEl = navPrevRef.current;
                      swiper.params.navigation.nextEl = navNextRef.current;
                    }
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
                  {suggested.map((item) => {
                    const itemTitle = getLocalizedText(item.title, item.titleEn, language) || t.noTitle;
                    const itemThumbnailUrl = getThumbnailUrl(item.thumbnailUrl);
                    
                    return (
                      <SwiperSlide key={item._id} className="overflow-visible px-1 md:px-2">
                        <motion.div
                          whileHover={{ 
                            y: -10, 
                            scale: 1.03,
                          }}
                          transition={{ duration: 0.3 }}
                          className="h-full"
                        >
                          <Link
                            href={`/episodes/${item.slug.current}`}
                            className="block bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col group border border-gray-200 dark:border-gray-700"
                          >
                            <div className="relative h-40 md:h-48 overflow-hidden flex-shrink-0">
                              <Image
                                src={itemThumbnailUrl}
                                alt={itemTitle}
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
                              <h3 className="text-base md:text-lg font-bold mb-2 line-clamp-2">{itemTitle}</h3>
                              <div className="flex items-center justify-between mt-3 md:mt-4">
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                                  {t.episode}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      </SwiperSlide>
                    );
                  })}
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
                  {t.relatedArticles}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-teal-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((article) => {
                  const articleTitle = getLocalizedText(article.title, article.titleEn, language) || t.noTitle;
                  const articleExcerpt = getLocalizedText(article.excerpt, article.excerptEn, language) || t.readMore;
                  const articleThumbnailUrl = getThumbnailUrl(article.featuredImageUrl);
                  const articleUrl = `/articles/${encodeURIComponent(String(article.slug.current))}`;
                  
                  return (
                    <motion.div
                      key={article._id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      <Link href={articleUrl} className="block">
                        <div className="relative h-40 md:h-48 overflow-hidden">
                          <Image
                            src={articleThumbnailUrl}
                            alt={articleTitle}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                          <h3 className="text-lg font-bold mb-2">{articleTitle}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {articleExcerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full">
                              {t.article}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                router.push(articleUrl);
                              }}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {t.readArticle}
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="mt-6 text-center">
                <Link 
                  href="/articles" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <span>{t.viewAllArticles}</span>
                </Link>
              </div>
            </motion.section>
          )}
          
          {/* COMMENTS SECTION */}
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
            
            <CommentsClient contentId={episode._id} type="episode" />
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
        /* تعديل اتجاه النصوص بناءً على اللغة */
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
        /* تأثيرات الحركة للأزرار */
        .delay-75 {
          animation-delay: 75ms;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}