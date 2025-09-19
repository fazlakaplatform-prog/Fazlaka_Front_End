"use client";
import React, { useEffect, useRef, useState, useCallback, JSX } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useParams, useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { client } from "@/lib/sanity";
import imageUrlBuilder from '@sanity/image-url';
import FavoriteButton from "@/components/FavoriteButton";

import { FaPlay, FaShare, FaArrowLeft, FaClock, FaComment, FaStar, FaFileAlt, FaImage, FaGoogleDrive } from "react-icons/fa";

const builder = imageUrlBuilder(client);

// تعريف الأنواع مباشرة في الملف
interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
}

interface Season {
  _id: string;
  title: string;
  slug?: { current: string };
  thumbnail?: SanityImage | string;
}

interface Episode {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string | SanityBlock[];
  content?: string | SanityBlock[];
  videoUrl?: string;
  thumbnail?: SanityImage | string;
  season?: Season;
  articles?: Article[];
}

interface Article {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  featuredImage?: SanityImage | string;
}

interface Comment {
  _id: string;
  name: string;
  content: string;
  createdAt: string;
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
  }, [contentId, type]);
  
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!content.trim()) {
      setErrorMsg("اكتب تعليقاً قبل الإرسال.");
      return;
    }
    if (!user) {
      setErrorMsg("يجب تسجيل الدخول لإرسال تعليق.");
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
        setSuccessMsg("تم إرسال تعليقك بنجاح!");
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
      
      setSuccessMsg("تم إرسال تعليقك بنجاح!");
      setContent("");
      fetchComments();
    } catch (err: unknown) {
      console.error("خطأ غير متوقع في الإرسال:", err);
      if (err instanceof Error) {
        if (err.message.includes("Insufficient permissions")) {
          setErrorMsg("ليس لديك صلاحية لإرسال التعليقات. يرجى التواصل مع الإدارة.");
        } else {
          setErrorMsg(`حدث خطأ غير متوقع أثناء الإرسال: ${err.message}`);
        }
      } else {
        setErrorMsg("حدث خطأ غير متوقع أثناء الإرسال.");
      }
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
              {loading ? "جاري الإرسال..." : "أرسل التعليق"}
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
        {comments.length === 0 && <p className="text-gray-600 dark:text-gray-300">لا توجد تعليقات بعد.</p>}
        {comments.map((c: Comment) => {
          const createdAt = new Date(c.createdAt);
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

export default function EpisodeDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug ?? "";
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [suggested, setSuggested] = useState<Episode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Swiper navigation refs
  const navPrevRef = useRef<HTMLButtonElement | null>(null);
  const navNextRef = useRef<HTMLButtonElement | null>(null);
  
  // Parallax for Hero
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 100]);
  
  // دالة للتعامل مع صور Sanity بشكل صحيح
  const getThumbnailUrl = (thumbnail?: SanityImage | string, width?: number, height?: number) => {
    if (!thumbnail) return "/placeholder.png";
    
    if (typeof thumbnail === 'string') {
      return thumbnail;
    }
    
    try {
      let imageUrl = builder.image(thumbnail);
      
      if (width && height) {
        imageUrl = imageUrl.width(width).height(height);
      }
      
      return imageUrl.url();
    } catch (error) {
      console.error("Error generating Sanity image URL:", error);
      return "/placeholder.png";
    }
  };
  
  // دالة لتحديد ما إذا كان النص يحتوي على رابط فيديو
  const isVideoUrl = (text: string) => {
    const videoUrlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|.*\.(?:mp4|webm|ogg))[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    return videoUrlRegex.test(text);
  };

  // دالة لتحديد ما إذا كان النص يحتوي على رابط PDF
  const isPdfUrl = (text: string) => {
    const pdfUrlRegex = /(https?:\/\/(?:www\.)?(?:drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+|.*\.pdf)[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    return pdfUrlRegex.test(text);
  };

  // دالة لتحديد ما إذا كان النص يحتوي على رابط صورة
  const isImageUrl = (text: string) => {
    const imageUrlRegex = /(https?:\/\/(?:www\.)?(?:.*\.(?:jpg|jpeg|png|gif|webp|svg))[\w\-._~:/?#[\]@!$&'()*+,;=]*)/i;
    return imageUrlRegex.test(text);
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
            <h3 className="text-lg font-bold">عرض المستند</h3>
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg"
          >
            <FaGoogleDrive />
            <span>فتح في Google Drive</span>
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
  const renderImage = (url: string | SanityImage) => {
    // إذا كان الرابط هو كائن صورة من Sanity
    if (typeof url === 'object' && url !== null) {
      try {
        const imageUrl = builder.image(url).width(800).height(450).url();
        url = imageUrl;
      } catch (error) {
        console.error("Error processing Sanity image:", error);
        return "/placeholder.png";
      }
    }
    
    return (
      <div className="my-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <FaImage className="text-sm" />
            </div>
            <h3 className="text-lg font-bold">صورة</h3>
          </div>
          <a 
            href={url as string} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg"
          >
            <FaImage />
            <span>فتح الصورة</span>
          </a>
        </div>
        <div className="relative overflow-hidden rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
          <Image
            src={url as string}
            alt="صورة من المحتوى"
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
  const LinkRenderer = ({ href, children, ...props }: {href?: string; children?: React.ReactNode}) => {
    if (!href) return <span {...props}>{children}</span>;
    
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

  // دالة محسّنة لمعالجة المحتوى مع الحفاظ على جميع التنسيقات
  const processContent = (content: string) => {
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
                          a: LinkRenderer,
                          strong: ({ ...props }) => <strong className="font-bold" {...props} />,
                          em: ({ ...props }) => <em className="italic" {...props} />,
                          u: ({ ...props }) => <u className="underline" {...props} />,
                          code: ({ inline, children, ...props }: {inline?: boolean; children?: React.ReactNode}) => {
                            if (inline) {
                              return (
                                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              );
                            }
                            return <code {...props}>{children}</code>;
                          },
                          // منع إنشاء فقرات متداخلة
                          p: ({ children, ...props }) => <span {...props}>{children}</span>,
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
                  a: LinkRenderer,
                  strong: ({ ...props }) => <strong className="font-bold" {...props} />,
                  em: ({ ...props }) => <em className="italic" {...props} />,
                  u: ({ ...props }) => <u className="underline" {...props} />,
                  code: ({ inline, children, ...props }: {inline?: boolean; children?: React.ReactNode}) => {
                    if (inline) {
                      return (
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return <code {...props}>{children}</code>;
                  },
                  // منع إنشاء فقرات متداخلة
                  p: ({ children, ...props }) => <span {...props}>{children}</span>,
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
  };
  
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setEpisode(null);
      setSuggested([]);
      setArticles([]);
      try {
        if (!slug) {
          setError("لم يتم تحديد الحلقة");
          setLoading(false);
          return;
        }
        
        // Fetch episode with related articles
        const episodeQuery = `*[_type == "episode" && slug.current == $slug][0]{
          _id,
          title,
          slug,
          description,
          content,
          videoUrl,
          thumbnail,
          season->{
            _id,
            title,
            slug,
            thumbnail
          },
          articles[]-> {
            _id,
            title,
            slug,
            excerpt,
            featuredImage
          }
        }`;
        const ep = await client.fetch(episodeQuery, { slug });
        
        if (!ep) throw new Error("الحلقة غير موجودة");
        
        // Fetch suggested episodes
        const suggestedQuery = `*[_type == "episode" && _id != $id && !(_id in path("drafts.**"))][0...20]{
          _id,
          title,
          slug,
          thumbnail
        } | order(_createdAt desc)`;
        const suggestedEpisodes = await client.fetch(suggestedQuery, { id: ep._id });
        
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
          setError(e instanceof Error ? e.message : "خطأ غير معروف");
          setLoading(false);
        }
      }
    }
    
    load();
    return () => {
      mounted = false;
    };
  }, [slug]);
  
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
  
  const title = episode.title || "بدون عنوان";
  const description = episode.description || "";
  const content = episode.content || "";
  const videoUrl = episode.videoUrl || "";
  const embedUrl = toEmbed(videoUrl);
  const season = episode.season;
  const seasonTitle = season?.title || "بدون موسم";
  const seasonSlug = season?.slug?.current || season?._id;
  
  const thumbnailUrl = getThumbnailUrl(episode.thumbnail, 1200, 630);
  const seasonThumbnailUrl = getThumbnailUrl(season?.thumbnail, 400, 300);
  
  // معالجة المحتوى
  const processedDescription = processContent(typeof description === 'string' ? description : blocksToText(description));
  const processedContent = content ? processContent(typeof content === 'string' ? content : blocksToText(content)) : [];
  
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
                  <FavoriteButton contentId={episode._id} contentType="episode" />
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
                    المحتوى
                  </h2>
                  <div className="flex-grow h-px bg-gradient-to-r from-green-200 to-transparent"></div>
                </div>
                
                <div className="prose prose-sm md:prose-lg prose-slate dark:prose-invert max-w-none text-right">
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
                    const thumbnailUrl = getThumbnailUrl(item.thumbnail, 400, 300);
                    
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
                                src={thumbnailUrl}
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
                  مقالات مرتبطة
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-teal-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((article) => {
                  const thumbnailUrl = getThumbnailUrl(article.featuredImage, 400, 300);
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
                            src={thumbnailUrl}
                            alt={article.title}
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
                          <h3 className="text-lg font-bold mb-2">{article.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {article.excerpt || "اقرأ المزيد..."}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full">
                              مقال
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                router.push(articleUrl);
                              }}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              قراءة المقال
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
      `}</style>
    </div>
  );
}