import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema } from "hast-util-sanitize";
import Link from "next/link";
import Image from "next/image";
import { urlFor, fetchFromSanity } from '@/lib/sanity';
import { FaFileAlt, FaImage, FaGoogleDrive } from "react-icons/fa";

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

async function getMemberBySlug(slug: string): Promise<Member | null> {
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
    }
  }`;
  
  try {
    const member = await fetchFromSanity(query, { slug });
    
    // التحقق من أن العضو يحتوي على الخصائص الأساسية باستخدام type guard
    if (!member || !isMember(member)) {
      return null;
    }
    
    return member;
  } catch (error) {
    console.error("Error fetching team member:", error);
    return null;
  }
}

// دالة لعرض الفيديو بناءً على الرابط
// الآن تقبل مفتاح اختياري لضمان أن كل عنصر في المصفوفة لديه "key" فريد
const renderVideo = (url: string, key?: string) => {
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    
    return (
      <div key={key} className="my-6">
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
      <div key={key} className="my-6">
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
      <div key={key} className="my-6">
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
      key={key}
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
const renderPdf = (url: string, key?: string) => {
  return (
    <div key={key} className="my-6">
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
          src={url.includes('drive.google.com') ? url.replace('/view', '/preview') : url}
          title="PDF viewer"
          frameBorder="0"
          allow="autoplay"
        ></iframe>
      </div>
    </div>
  );
};

// دالة لعرض الصورة بناءً على الرابط
const renderImage = (url: string, key?: string) => {
  return (
    <div key={key} className="my-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <FaImage className="text-sm" />
          </div>
          <h3 className="text-lg font-bold">صورة</h3>
        </div>
        <a 
          href={url} 
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
      className="text-blue-600 dark:text-blue-400 hover:underline"
      {...rest}
    >
      {children}
    </a>
  );
};

// مكون مخصص لعرض الأكواد
const CodeRenderer = (props: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
  const { inline, children, ...rest } = props;
  
  if (inline) {
    return (
      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...rest}>
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

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);
  
  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 flex items-center">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md mx-auto">
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 0118 0 9 9 0 01-18 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">العضو غير موجود</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">لم نتمكن من العثور على العضو الذي تبحث عنه.</p>
            <Link href="/team" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
              العودة إلى صفحة الفريق
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
          .width(128)
          .height(128)
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
    strong: ({ ...props }) => <strong className="font-bold" {...props} />,
    em: ({ ...props }) => <em className="italic" {...props} />,
    u: ({ ...props }) => <u className="underline" {...props} />,
    code: CodeRenderer,
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* رأس الصفحة */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex flex-col md:flex-row items-center">
              <div className="mb-4 md:mb-0 md:mr-6">
                <Image 
                  src={photoUrl} 
                  alt={member.name} 
                  width={128} 
                  height={128}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" 
                />
              </div>
              <div className="text-center md:text-right">
                <h1 className="text-3xl font-bold mb-2">{member.name}</h1>
                {member.role && <p className="text-blue-100 text-lg">{member.role}</p>}
              </div>
            </div>
          </div>
          {/* محتوى الصفحة */}
          <div className="p-6 md:p-8">
            <div className="prose prose-lg prose-indigo dark:prose-invert max-w-none">
              {/* عرض النص المعالج باستخدام ReactMarkdown */}
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                rehypePlugins={[[rehypeRaw], [rehypeSanitize, { ...defaultSchema }]]}
                components={markdownComponents}
              >
                {processedText}
              </ReactMarkdown>
              
              {/* عرض عناصر الوسائط المستخرجة */}
              {/* كل عنصر تم إنشاؤه أعلاه يحتوي الآن على مفتاح فريد */}
              {mediaElements}
            </div>
            {/* زر العودة */}
            <div className="mt-8 text-center">
              <Link href="/team" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                العودة إلى صفحة الفريق
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}