import React from "react";
import Link from "next/link";
import Image from "next/image"; // استيراد مكون Image من Next.js

interface Member {
  id: number;
  name: string;
  role?: string;
  slug?: string;
  photo?: { 
    url?: string;
    formats?: {
      small?: { url: string };
      medium?: { url: string };
      large?: { url: string };
      thumbnail?: { url: string };
    };
  };
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

async function getMembers(): Promise<Member[]> {
  const res = await fetch(`${STRAPI_URL}/api/team-members?populate=photo`, { cache: "no-store" });
  const data = await res.json();
  return data.data || [];
}

// دالة مساعدة للحصول على رابط الصورة
function getPhotoUrl(photo?: { 
  url?: string;
  formats?: {
    small?: { url: string };
    medium?: { url: string };
    large?: { url: string };
    thumbnail?: { url: string };
  };
}): string {
  if (!photo) return "/placeholder.png";
  
  // التحقق من وجود تنسيقات مختلفة للصورة
  const formats = photo.formats;
  if (formats) {
    // استخدام التنسيق المتوسط إذا كان متاحًا
    if (formats.medium?.url) {
      return formats.medium.url.startsWith('http') 
        ? formats.medium.url 
        : `${STRAPI_URL}${formats.medium.url}`;
    }
    // استخدام التنسيق الكبير إذا كان متاحًا
    if (formats.large?.url) {
      return formats.large.url.startsWith('http') 
        ? formats.large.url 
        : `${STRAPI_URL}${formats.large.url}`;
    }
    // استخدام التنسيق الصغير إذا كان متاحًا
    if (formats.small?.url) {
      return formats.small.url.startsWith('http') 
        ? formats.small.url 
        : `${STRAPI_URL}${formats.small.url}`;
    }
    // استخدام التنسيق المصغر إذا كان متاحًا
    if (formats.thumbnail?.url) {
      return formats.thumbnail.url.startsWith('http') 
        ? formats.thumbnail.url 
        : `${STRAPI_URL}${formats.thumbnail.url}`;
    }
  }
  
  // استخدام الرابط الأصلي إذا لم تكن هناك تنسيقات
  if (photo.url) {
    return photo.url.startsWith('http') 
      ? photo.url 
      : `${STRAPI_URL}${photo.url}`;
  }
  
  return "/placeholder.png";
}

const TeamPage = async () => {
  const members = await getMembers();
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12 relative inline-block w-full">
        فريق العمل
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></span>
      </h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {members.map((member, index) => (
          <Link 
            key={member.id} 
            href={`/team/${member.slug}`}
            className="group"
          >
            <div 
              className="p-6 border rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800 
                         transform hover:-translate-y-2 overflow-hidden relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* تأثير التوهج عند التمرير */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              
              {/* صورة العضو */}
              <div className="relative mb-4 overflow-hidden rounded-full mx-auto w-32 h-32 border-4 border-white dark:border-gray-700 shadow-md">
                <Image
                  src={getPhotoUrl(member.photo)}
                  alt={member.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  unoptimized
                />
              </div>
              
              {/* معلومات العضو */}
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-center mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {member.name}
                </h3>
                {member.role && (
                  <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                    {member.role}
                  </p>
                )}
                
                {/* أيقونة السهم عند التمرير */}
                <div className="mt-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* زر للعودة للصفحة الرئيسية */}
      <div className="mt-16 text-center">
        <Link 
          href="/" 
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          العودة للصفحة الرئيسية
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default TeamPage;