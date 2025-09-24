"use client";

import React, { useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema } from "hast-util-sanitize";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from '@/lib/sanity';
import { FaFileAlt, FaImage, FaGoogleDrive, FaTwitter, FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaTiktok, FaArrowLeft, FaQuoteLeft, FaQuoteRight, FaStar, FaCheckCircle, FaAward, FaExternalLinkAlt, FaPlay, FaExpand } from "react-icons/fa";

interface Member {
  _id: string;
  name: string;
  role?: string;
  bio?: string;
  slug: {
    current: string;
  };
  image?: {
    _type: "image";
    asset: {
      _type: "reference";
      _ref: string;
    };
  };
  socialMedia?: Array<{
    platform: string;
    url: string;
  }>;
}

// تعريف واجهة ImageUrlBuilder
interface ImageUrlBuilder {
  width: (width: number) => ImageUrlBuilder;
  height: (height: number) => ImageUrlBuilder;
  url: () => string;
}

// دالة للتحقق من أن الكائن هو من نوع Member
function isMember(obj: unknown): obj is Member {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const memberObj = obj as Record<string, unknown>;
  
  return '_id' in memberObj && 
         typeof memberObj._id === 'string' &&
         'name' in memberObj && 
         typeof memberObj.name === 'string' &&
         'slug' in memberObj && 
         typeof memberObj.slug === 'object' &&
         memberObj.slug !== null &&
         'current' in (memberObj.slug as Record<string, unknown>) &&
         typeof (memberObj.slug as Record<string, unknown>).current === 'string';
}

// دالة لعرض الفيديو بناءً على الرابط
const renderVideo = (url: string, key?: string) => {
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    
    return (
      <div key={key} className="my-6 md:my-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
              <FaPlay className="text-sm md:text-base" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">فيديو</h3>
          </div>
          <div className="flex gap-2">
            <a 
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg text-sm md:text-base"
            >
              <FaExternalLinkAlt />
              <span>فتح في يوتيوب</span>
            </a>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg md:shadow-xl bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
          
          {/* زر التكبير للجوال */}
          <a 
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
            aria-label="فتح في وضع ملء الشاشة"
          >
            <FaExpand className="text-lg" />
          </a>
        </div>
        
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          لا يعمل الفيديو؟ <a 
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            اضغط هنا لفتحه في يوتيوب
          </a>
        </div>
      </div>
    );
  }
  
  // Vimeo
  if (url.includes('vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1].split('?')[0];
    const vimeoUrl = `https://vimeo.com/${videoId}`;
    const embedUrl = `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479`;
    
    return (
      <div key={key} className="my-6 md:my-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <FaPlay className="text-sm md:text-base" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">فيديو</h3>
          </div>
          <div className="flex gap-2">
            <a 
              href={vimeoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg text-sm md:text-base"
            >
              <FaExternalLinkAlt />
              <span>فتح في فيميو</span>
            </a>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg md:shadow-xl bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title="Vimeo video player"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          ></iframe>
          
          {/* زر التكبير للجوال */}
          <a 
            href={vimeoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
            aria-label="فتح في وضع ملء الشاشة"
          >
            <FaExpand className="text-lg" />
          </a>
        </div>
        
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          لا يعمل الفيديو؟ <a 
            href={vimeoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            اضغط هنا لفتحه في فيميو
          </a>
        </div>
      </div>
    );
  }
  
  // فيديو مباشر (mp4, webm, ogg)
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <div key={key} className="my-6 md:my-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg">
              <FaPlay className="text-sm md:text-base" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">فيديو</h3>
          </div>
          <div className="flex gap-2">
            <a 
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg text-sm md:text-base"
            >
              <FaExternalLinkAlt />
              <span>فتح الفيديو</span>
            </a>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg md:shadow-xl bg-black">
          <video
            className="w-full"
            controls
            controlsList="nodownload"
            preload="metadata"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect fill='%23000' width='800' height='450'/%3E%3Ctext fill='%23fff' font-size='20' x='400' y='225' text-anchor='middle'%3Eجاري تحميل الفيديو...%3C/text%3E%3C/svg%3E"
          >
            <source src={url} type={`video/${url.split('.').pop()}`} />
            <track kind="captions" />
            متصفحك لا يدعم تشغيل الفيديو.
          </video>
        </div>
        
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          لا يعمل الفيديو؟ <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            اضغط هنا لفتح الفيديو مباشرة
          </a>
        </div>
      </div>
    );
  }
  
  // إذا لم يكن أي من الأنواع المعروفة، عرض رابط
  return (
    <div key={key} className="my-6 md:my-8">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-white shadow-lg">
          <FaExternalLinkAlt className="text-sm md:text-base" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">رابط خارجي</h3>
      </div>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg text-sm md:text-base"
      >
        <FaExternalLinkAlt />
        <span className="truncate">{url}</span>
      </a>
    </div>
  );
};

// دالة لعرض PDF بناءً على الرابط
const renderPdf = (url: string, key?: string) => {
  const previewUrl = url.includes('drive.google.com') ? url.replace('/view', '/preview') : url;
  
  return (
    <div key={key} className="my-6 md:my-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
            <FaFileAlt className="text-sm md:text-base" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">مستند PDF</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg text-sm md:text-base"
          >
            <FaExternalLinkAlt />
            <span>فتح المستند</span>
          </a>
          {url.includes('drive.google.com') && (
            <a 
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg text-sm md:text-base"
            >
              <FaGoogleDrive />
              <span>معاينة</span>
            </a>
          )}
        </div>
      </div>
      
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900" style={{ paddingBottom: '75%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={previewUrl}
          title="PDF viewer"
          frameBorder="0"
          allow="autoplay"
        ></iframe>
      </div>
      
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
        لا يعرض المستند؟ <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          اضغط هنا لفتحه مباشرة
        </a>
      </div>
    </div>
  );
};

// دالة لعرض الصورة بناءً على الرابط
const renderImage = (url: string, key?: string) => {
  return (
    <div key={key} className="my-6 md:my-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <FaImage className="text-sm md:text-base" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">صورة</h3>
        </div>
        <div className="flex gap-2">
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg text-sm md:text-base"
          >
            <FaExternalLinkAlt />
            <span>فتح الصورة</span>
          </a>
        </div>
      </div>
      
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
        <Image
          src={url}
          alt="صورة من المحتوى"
          width={800}
          height={450}
          className="w-full h-auto object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            // في حالة فشل تحميل الصورة، إظهار رابط مباشر
            const container = e.currentTarget.parentElement;
            if (container) {
              container.innerHTML = `
                <div class="p-8 text-center">
                  <p class="mb-4 text-gray-600 dark:text-gray-400">لا يمكن عرض الصورة</p>
                  <a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:opacity-95 transition-opacity shadow-lg">
                    <FaExternalLinkAlt />
                    <span>فتح الصورة مباشرة</span>
                  </a>
                </div>
              `;
            }
          }}
        />
      </div>
    </div>
  );
};

// دالة لمعالجة النصوص واستخراج روابط الوسائط
const processMediaLinks = (text: string): { processedText: string; mediaElements: React.ReactNode[] } => {
  const mediaElements: React.ReactNode[] = []; 
  let processedText = text;
  
  // helper to generate unique ids
  const genId = () => `media-${mediaElements.length}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  
  // معالجة روابط الفيديو
  processedText = processedText.replace(
    /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|.*\.(?:mp4|webm|ogg))[\w\-._~:\/?#[\]@!$&'()*+,;=]*)/gi,
    (match) => {
      const id = genId();
      mediaElements.push(renderVideo(match, id));
      return `{{${id}}}`;
    }
  );
  
  // معالجة روابط PDF
  processedText = processedText.replace(
    /(https?:\/\/(?:www\.)?(?:drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+|.*\.pdf)[\w\-._~:\/?#[\]@!$&'()*+,;=]*)/gi,
    (match) => {
      const id = genId();
      mediaElements.push(renderPdf(match, id));
      return `{{${id}}}`;
    }
  );
  
  // معالجة روابط الصور
  processedText = processedText.replace(
    /(https?:\/\/(?:www\.)?(?:.*\.(?:jpg|jpeg|png|gif|webp|svg))[\w\-._~:\/?#[\]@!$&'()*+,;=]*)/gi,
    (match) => {
      const id = genId();
      mediaElements.push(renderImage(match, id));
      return `{{${id}}}`;
    }
  );
  
  return { processedText, mediaElements };
};

// مكون مخصص لعرض الروابط في ReactMarkdown
const LinkRenderer = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const { href, children, ...rest } = props;
  
  // إذا لم يكن أي من الأنواع، عرض الرابط كالمعتاد
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
      {...rest}
    >
      {children}
      <FaExternalLinkAlt className="text-xs opacity-70" />
    </a>
  );
};

// مكون مخصص لعرض الأكواد
const CodeRenderer = (props: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
  const { inline, children, ...rest } = props;
  
  if (inline) {
    return (
      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...rest}>
        {children}
      </code>
    );
  }
  
  return <code {...rest}>{children}</code>;
};

// مكون مخصص لمعالجة النصوص مع استبدال العناصر النائبة
const CustomTextRenderer = (props: React.HTMLAttributes<HTMLParagraphElement>) => {
  const { children, ...rest } = props;
  
  if (typeof children === 'string') {
    // استخراج العناصر النائبة واستبدالها
    const parts = children.split(/({{media-\d+-\d+-[a-z0-9]+}})/);
    
    return (
      <p {...rest}>
        {parts.map((part, index) => {
          if (part.startsWith('{{media-') && part.endsWith('}}')) {
            // هذا عنصر نائب، سيتم استبداله لاحقًا
            return React.createElement('span', { 
              key: index, 
              'data-placeholder': part 
            });
          }
          return part;
        })}
      </p>
    );
  }
  
  return <p {...rest}>{children}</p>;
};

// دالة لعرض أيقونة وسائل التواصل الاجتماعي
const renderSocialIcon = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return <FaFacebook className="text-lg md:text-xl" />;
    case 'twitter':
      return <FaTwitter className="text-lg md:text-xl" />;
    case 'instagram':
      return <FaInstagram className="text-lg md:text-xl" />;
    case 'linkedin':
      return <FaLinkedin className="text-lg md:text-xl" />;
    case 'youtube':
      return <FaYoutube className="text-lg md:text-xl" />;
    case 'tiktok':
      return <FaTiktok className="text-lg md:text-xl" />;
    default:
      return <div className="w-4 h-4 rounded-full bg-white"></div>; // أيقونة افتراضية
  }
};

// دالة للحصول على لون خلفية أيقونة وسائل التواصل الاجتماعي
const getSocialIconColor = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return 'bg-blue-600 hover:bg-blue-700';
    case 'twitter':
      return 'bg-sky-500 hover:bg-sky-600';
    case 'instagram':
      return 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90';
    case 'linkedin':
      return 'bg-blue-700 hover:bg-blue-800';
    case 'youtube':
      return 'bg-red-600 hover:bg-red-700';
    case 'tiktok':
      return 'bg-gray-900 hover:bg-black';
    default:
      return 'bg-gray-600 hover:bg-gray-700';
  }
};

// مكون لعرض الوسائط
const MediaRenderer = ({ mediaElements }: { mediaElements: React.ReactNode[] }) => {
  return (
    <>
      {mediaElements.map((element, index) => (
        <React.Fragment key={index}>
          {element}
        </React.Fragment>
      ))}
    </>
  );
};

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  
  React.useEffect(() => {
    const fetchMember = async () => {
      try {
        const { slug } = await params;
        const query = `*[_type == "teamMember" && slug.current == $slug][0]{
          _id,
          name,
          role,
          bio,
          slug,
          image {
            _type,
            asset {
              _type,
              _ref
            }
          },
          socialMedia[] {
            platform,
            url
          }
        }`;
        
        // استيراد fetchFromSanity هنا لتجنب مشاكل الـ SSR
        const { fetchFromSanity } = await import('@/lib/sanity');
        const memberData = await fetchFromSanity(query, { slug });
        
        // التحقق من أن العضو يحتوي على الخصائص الأساسية باستخدام type guard
        if (!memberData || !isMember(memberData)) {
          setMember(null);
        } else {
          setMember(memberData);
        }
      } catch (error) {
        console.error("Error fetching team member:", error);
        setMember(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMember();
  }, [params]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }
  
  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12 flex items-center">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl p-6 md:p-8 max-w-md mx-auto">
            <div className="mb-6">
              <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 0118 0 9 9 0 01-18 0z" />
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">العضو غير موجود</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">لم نتمكن من العثور على العضو الذي تبحث عنه.</p>
            <Link href="/team" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-2 px-4 md:py-2.5 md:px-6 rounded-lg transition-all shadow-lg hover:shadow-xl">
              <FaArrowLeft />
              <span>العودة إلى صفحة الفريق</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // استخدام نهج دفاعي للحصول على رابط الصورة
  let photoUrl = "/placeholder.png";
  if (member.image) {
    try {
      const imageBuilder = urlFor(member.image);
      
      // التحقق إذا كان imageBuilder هو سلسلة نصية مباشرة
      if (typeof imageBuilder === 'string') {
        photoUrl = imageBuilder;
      } 
      // التحقق إذا كان imageBuilder يحتوي على الدوال المطلوبة
      else if (imageBuilder && 
               typeof imageBuilder === 'object' && 
               'width' in imageBuilder && 
               typeof (imageBuilder as ImageUrlBuilder).width === 'function') {
        photoUrl = (imageBuilder as ImageUrlBuilder)
          .width(300)
          .height(300)
          .url();
      }
    } catch (error) {
      console.error("Error generating image URL:", error);
      // الاحتفاظ بالرابط الافتراضي في حالة الخطأ
    }
  }
  
  // معالجة النصوص لاستخراج روابط الوسائط
  const bio = member.bio || "لا توجد معلومات متاحة عن هذا العضو.";
  const { processedText, mediaElements } = processMediaLinks(bio);
  
  // تعريف المكونات المخصصة لـ ReactMarkdown
  const markdownComponents: Components = {
    a: LinkRenderer,
    p: CustomTextRenderer,
    strong: ({ ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
    em: ({ ...props }) => <em className="italic text-gray-800 dark:text-gray-200" {...props} />,
    u: ({ ...props }) => <u className="underline text-gray-800 dark:text-gray-200" {...props} />,
    code: CodeRenderer,
    h1: ({ ...props }) => <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-6 md:mt-8 mb-3 md:mb-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
    h2: ({ ...props }) => <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mt-5 md:mt-7 mb-2 md:mb-3 pb-1 border-b border-gray-200 dark:border-gray-700" {...props} />,
    h3: ({ ...props }) => <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mt-4 md:mt-6 mb-2 md:mb-3" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc pr-4 md:pr-6 mb-4 space-y-1 md:space-y-2 text-gray-700 dark:text-gray-300 text-sm md:text-base" {...props} />,
    ol: ({ ...props }) => <ol className="list-decimal pr-4 md:pr-6 mb-4 space-y-1 md:space-y-2 text-gray-700 dark:text-gray-300 text-sm md:text-base" {...props} />,
    li: ({ ...props }) => <li className="mb-1" {...props} />,
    blockquote: ({ ...props }) => (
      <blockquote className="relative my-4 md:my-6 p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl md:rounded-2xl border-r-4 border-blue-500 shadow-sm" {...props}>
        <FaQuoteLeft className="absolute top-2 md:top-4 right-2 md:right-4 text-blue-300 dark:text-blue-700 text-base md:text-xl" />
        <FaQuoteRight className="absolute bottom-2 md:bottom-4 left-2 md:left-4 text-blue-300 dark:text-blue-700 text-base md:text-xl" />
        <div className="relative z-10 pr-6 md:pr-8 pl-6 md:pl-8 italic text-gray-700 dark:text-gray-300 text-sm md:text-base">
          {props.children}
        </div>
      </blockquote>
    ),
  };
  
  // التحقق من وجود وسائل التواصل الاجتماعي
  const hasSocialMedia = member.socialMedia && member.socialMedia.length > 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
          {/* تخطيط أفقي للهيرو والوصف */}
          <div className="flex flex-col md:flex-row">
            {/* الهيرو على اليسار */}
            <div className="w-full md:w-2/5 lg:w-1/3 relative">
              {/* خلفية متدرجة مع عناصر زخرفية */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-0 left-0 w-full h-full">
                  <div className="absolute top-10 md:top-20 left-5 md:left-10 w-48 md:w-72 h-48 md:h-72 rounded-full bg-purple-500/20 blur-3xl"></div>
                  <div className="absolute bottom-10 md:bottom-20 right-5 md:right-10 w-40 md:w-64 h-40 md:h-64 rounded-full bg-pink-500/20 blur-3xl"></div>
                  <div className="absolute top-1/4 md:top-1/3 left-1/6 md:left-1/4 w-32 md:w-48 h-32 md:h-48 rounded-full bg-blue-500/20 blur-3xl"></div>
                  <div className="absolute bottom-1/4 md:bottom-1/3 right-1/6 md:right-1/4 w-36 md:w-56 h-36 md:h-56 rounded-full bg-indigo-500/20 blur-3xl"></div>
                </div>
              </div>
              
              {/* خطوط زخرفية */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              
              <div className="relative z-10 p-6 md:p-8 lg:p-12 h-full flex flex-col items-center justify-center">
                {/* قسم الصورة */}
                <div className="flex-shrink-0 relative mb-6 md:mb-8">
                  {/* دائرة خلفية متوهجة */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-full blur-xl opacity-70 animate-pulse"></div>
                  
                  {/* الصورة الرئيسية */}
                  <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                    <Image 
                      src={photoUrl} 
                      alt={member.name} 
                      width={300} 
                      height={300}
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* مؤشر الحالة */}
                    <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 bg-white rounded-full p-1 md:p-1.5 shadow-lg">
                      <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    
                    {/* شارة التميز */}
                    <div className="absolute -top-1 md:-top-2 -right-1 md:-right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1.5 md:p-2 shadow-lg">
                      <FaStar className="text-white text-sm md:text-lg" />
                    </div>
                  </div>
                  
                  {/* عناصر زخرفية */}
                  <div className="absolute -top-3 md:-top-4 -left-3 md:-left-4 w-8 h-8 md:w-12 md:h-12 rounded-full bg-yellow-400/30 animate-pulse"></div>
                  <div className="absolute -bottom-3 md:-bottom-4 -right-3 md:-right-4 w-6 h-6 md:w-10 md:h-10 rounded-full bg-pink-400/30 animate-pulse"></div>
                </div>
                
                {/* قسم المعلومات */}
                <div className="text-center w-full">
                  {/* اسم العضو */}
                  <div className="mb-3 md:mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-3 tracking-tight leading-tight">
                      {member.name}
                    </h1>
                    <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto"></div>
                  </div>
                  
                  {/* رتبة العضو */}
                  {member.role && (
                    <div className="mb-5 md:mb-8">
                      <div className="inline-flex items-center gap-1.5 md:gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 md:px-5 md:py-2.5 rounded-full border border-white/30 shadow-lg">
                        <FaAward className="text-yellow-300 text-base md:text-lg" />
                        <span className="text-base md:text-lg font-medium text-white">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* وسائل التواصل الاجتماعي */}
                  <div className="mt-4 md:mt-6">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
                        <FaCheckCircle className="text-green-400 text-base md:text-lg" />
                        <span className="text-white font-medium text-sm md:text-base">تواصل معي</span>
                      </div>
                      
                      {hasSocialMedia ? (
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                          {member.socialMedia!.map((social, index) => (
                            <a 
                              key={index}
                              href={social.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-xl ${getSocialIconColor(social.platform)}`}
                              aria-label={`تابعنا على ${social.platform}`}
                            >
                              {renderSocialIcon(social.platform)}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-white/70 text-xs md:text-sm bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full">
                          لا توجد وسائل تواصل اجتماعي متاحة
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* الوصف على اليمين */}
            <div className="w-full md:w-3/5 lg:w-2/3 p-4 md:p-6 lg:p-10">
              <div className="prose prose-sm md:prose-base lg:prose-lg prose-indigo dark:prose-invert max-w-none">
                {/* عرض النص المعالج باستخدام ReactMarkdown */}
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[[rehypeRaw], [rehypeSanitize, { ...defaultSchema }]]}
                  components={markdownComponents}
                >
                  {processedText}
                </ReactMarkdown>
                
                {/* عرض عناصر الوسائط المستخرجة */}
                <MediaRenderer mediaElements={mediaElements} />
              </div>
              
              {/* زر العودة */}
              <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
                <Link href="/team" className="inline-flex items-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 border border-transparent text-base md:text-lg font-semibold rounded-full shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105">
                  <FaArrowLeft className="text-lg md:text-xl" />
                  <span>العودة إلى صفحة الفريق</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}