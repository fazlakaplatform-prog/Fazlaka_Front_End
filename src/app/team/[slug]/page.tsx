import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema } from "hast-util-sanitize";
import Link from "next/link";
import Image from "next/image";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

interface Member {
  id: number;
  documentId?: string;
  name: string;
  role?: string;
  bio?: string;
  slug?: string;
  photo?: {
    data?: {
      attributes?: {
        formats?: {
          large?: { url: string };
          medium?: { url: string };
          small?: { url: string };
          thumbnail?: { url: string };
        };
        url?: string;
      };
    };
    attributes?: {
      formats?: {
        large?: { url: string };
        medium?: { url: string };
        small?: { url: string };
        thumbnail?: { url: string };
      };
      url?: string;
    };
    url?: string;
  };
}

// محاولة جلب العضو أولًا عن طريق slug، ثم محاولة بديلة عن طريق id (endpoint المباشر)
async function fetchMemberBySlugOrId(slugOrId: string): Promise<Member | null> {
  // 1) جلب عن طريق slug filter
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/team-members?filters[slug][$eq]=${encodeURIComponent(slugOrId)}&populate=photo&pagination[pageSize]=1`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data[0].attributes ? { id: json.data[0].id, ...json.data[0].attributes } : json.data[0];
      }
    }
  } catch (err) {
    console.error("Error fetching by slug:", err);
  }
  // 2) محاولة جلب عن طريق id مباشر (Strapi single resource)
  try {
    const resId = await fetch(`${STRAPI_URL}/api/team-members/${encodeURIComponent(slugOrId)}?populate=photo`, { cache: "no-store" });
    if (resId.ok) {
      const json2 = await resId.json();
      if (json2.data) return json2.data.attributes ? { id: json2.data.id, ...json2.data.attributes } : json2.data;
    }
  } catch (err) {
    console.error("Error fetching by id:", err);
  }
  // 3) محاولة نهائية: فلترة بالـ id (كـ filter) — مفيد إن كان Strapi لديك لا يدعم endpoint المطلوب
  try {
    const resFilterId = await fetch(
      `${STRAPI_URL}/api/team-members?filters[id][$eq]=${encodeURIComponent(slugOrId)}&populate=photo&pagination[pageSize]=1`,
      { cache: "no-store" }
    );
    if (resFilterId.ok) {
      const json3 = await resFilterId.json();
      if (json3.data && Array.isArray(json3.data) && json3.data.length > 0) {
        return json3.data[0].attributes ? { id: json3.data[0].id, ...json3.data[0].attributes } : json3.data[0];
      }
    }
  } catch (err) {
    console.error("Error fetching by id filter:", err);
  }
  return null;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = await fetchMemberBySlugOrId(slug);
  if (!raw) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 flex items-center">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md mx-auto">
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  
  // Strapi عادة يُرجع الكائن كـ { id, attributes: { ... } }
  const member: Member = raw;
  
  const getPhotoUrl = (photo: Member["photo"]): string => {
    if (!photo) return "/placeholder.png";
    
    // Strapi v4 nested format: photo.data.attributes.formats
    const data = photo.data ?? photo;
    const attrs = data.attributes ?? data;
    
    // التحقق من وجود formats والوصول إليه بشكل آمن
    if ('formats' in attrs && attrs.formats) {
      const formats = attrs.formats;
      if (formats.large?.url) {
        // إذا كان الرابط يبدأ بـ http، نستخدمه كما هو
        if (formats.large.url.startsWith('http')) {
          return formats.large.url;
        }
        return `${STRAPI_URL}${formats.large.url}`;
      }
      if (formats.medium?.url) {
        if (formats.medium.url.startsWith('http')) {
          return formats.medium.url;
        }
        return `${STRAPI_URL}${formats.medium.url}`;
      }
      if (formats.small?.url) {
        if (formats.small.url.startsWith('http')) {
          return formats.small.url;
        }
        return `${STRAPI_URL}${formats.small.url}`;
      }
      if (formats.thumbnail?.url) {
        if (formats.thumbnail.url.startsWith('http')) {
          return formats.thumbnail.url;
        }
        return `${STRAPI_URL}${formats.thumbnail.url}`;
      }
    }
    
    // التحقق من وجود url والوصول إليه بشكل آمن
    if ('url' in attrs && attrs.url) {
      if (attrs.url.startsWith('http')) {
        return attrs.url;
      }
      return `${STRAPI_URL}${attrs.url}`;
    }
    
    return "/placeholder.png";
  };
  
  const photoUrl = getPhotoUrl(member.photo);
  
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
                  unoptimized // إضافة هذا الخاصية لتجاوز مشاكل التهيئة
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
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeRaw], [rehypeSanitize, { ...defaultSchema }]]}>
                {member.bio || "لا توجد معلومات متاحة عن هذا العضو."}
              </ReactMarkdown>
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