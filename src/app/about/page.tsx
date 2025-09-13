import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  FaVideo, FaListUl, FaUsers, 
  FaYoutube, FaInstagram, FaFacebookF, FaTiktok 
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

// Interfaces
interface PhotoFormat { 
  url: string; 
}

interface Photo {
  url?: string;
  formats?: {
    small?: PhotoFormat;
    medium?: PhotoFormat;
    large?: PhotoFormat;
    thumbnail?: PhotoFormat;
  };
}

interface Member {
  id: number;
  name: string;
  role?: string;
  bio?: string;
  slug?: string;
  photo?: Photo | null;
}

// Social links
const socialLinks = [
  { href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA", icon: <FaYoutube />, label: "يوتيوب" },
  { href: "https://www.instagram.com/fazlaka_platform/", icon: <FaInstagram />, label: "انستجرام" },
  { href: "https://www.facebook.com/profile.php?id=61579582675453", icon: <FaFacebookF />, label: "فيس بوك" },
  { href: "https://www.tiktok.com/@fazlaka_platform", icon: <FaTiktok />, label: "تيك توك" },
  { href: "https://x.com/FazlakaPlatform", icon: <FaXTwitter />, label: "اكس" },
];

// APIs
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

async function getMembers(): Promise<Member[]> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/team-members?populate=photo`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

async function getSubscribers(): Promise<number | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCWftbKWXqj0wt-UHMLAcsJA&key=AIzaSyBcPhsKTsQ7YGqKiP-eG6TZh2P9DKN1QnA`, 
      { cache: "no-store" }
    );
    if (!response.ok) throw new Error(`YouTube API error! ${response.status}`);
    const data = await response.json();
    const count = data.items?.[0]?.statistics?.subscriberCount;
    return count ? parseInt(count, 10) : null;
  } catch { return null; }
}

async function getEpisodesCount(): Promise<number> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/episodes`, { cache: "no-store" });
    if (!response.ok) throw new Error();
    const data = await response.json();
    return data.meta.pagination.total || 0;
  } catch { return 0; }
}

async function getPlaylistsCount(): Promise<number> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/playlists`, { cache: "no-store" });
    if (!response.ok) throw new Error();
    const data = await response.json();
    return data.meta.pagination.total || 0;
  } catch { return 0; }
}

// Components
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
}

const StatCard = ({ icon, title, value, bgColor, iconColor }: StatCardProps) => (
  <div className={`${bgColor} dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fadeIn`}>
    <div className="flex flex-col items-center justify-center">
      <div className={`text-4xl mb-4 ${iconColor}`}>{icon}</div>
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

interface MemberCardProps {
  member: Member;
  photoUrl: string;
}

const MemberCard = ({ member, photoUrl }: MemberCardProps) => (
  <Link
    href={`/team/${member.slug || "#"}`}
    className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-xl transition-transform duration-500 hover:-translate-y-2 animate-zoomIn bg-white dark:bg-gray-800"
  >
    <Image 
      src={photoUrl} 
      alt={member.name} 
      width={128} 
      height={128}
      className="w-32 h-32 rounded-full object-cover mb-4 shadow-lg" 
      unoptimized // إضافة هذا الخاصية لتجاوز مشاكل التهيئة
    />
    <h3 className="text-xl font-semibold">{member.name}</h3>
    {member.role && <p className="text-gray-600 dark:text-gray-400 mt-1">{member.role}</p>}
  </Link>
);

const AboutPage = async () => {
  const [members, subscribers, episodesCount, playlistsCount] = await Promise.all([
    getMembers(),
    getSubscribers(),
    getEpisodesCount(),
    getPlaylistsCount(),
  ]);

  const getPhotoUrl = (photo?: Photo | null): string => {
    if (!photo) return "/placeholder.png";
    const order = ["medium", "large", "thumbnail"] as const;
    for (const f of order) {
      const format = photo.formats?.[f];
      if (format?.url) {
        // إذا كان الرابط يبدأ بـ http، نستخدمه كما هو
        if (format.url.startsWith('http')) {
          return format.url;
        }
        return `${STRAPI_URL}${format.url}`;
      }
    }
    if (photo.url) {
      if (photo.url.startsWith('http')) {
        return photo.url;
      }
      return `${STRAPI_URL}${photo.url}`;
    }
    return "/placeholder.png";
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-bold text-center mb-12 animate-fadeInUp">عن المنصة</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <StatCard icon={<FaVideo />} title="عدد الحلقات" value={episodesCount} bgColor="bg-gradient-to-br from-blue-50 to-blue-100" iconColor="text-blue-600" />
        <StatCard icon={<FaListUl />} title="عدد قوائم التشغيل" value={playlistsCount} bgColor="bg-gradient-to-br from-green-50 to-green-100" iconColor="text-green-600" />
        {subscribers !== null && (
          <StatCard icon={<FaUsers />} title="عدد المشتركين" value={subscribers.toLocaleString()} bgColor="bg-gradient-to-br from-yellow-50 to-yellow-100" iconColor="text-yellow-600" />
        )}
      </div>
      
      {/* YouTube Subscribers Display */}
      <div className="text-center my-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg animate-fadeIn">
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">عدد المشتركين في قناتنا على يوتيوب</h2>
        <p className="text-xl font-semibold text-red-600 dark:text-red-400">
          {subscribers !== null ? subscribers.toLocaleString() : "جارٍ التحميل..."}
        </p>
      </div>
      
      {/* Philosophy */}
      <section className="mb-16 animate-fadeInUp">
        <h2 className="text-3xl font-bold mb-6 text-center">منهجنا وفلسفتنا</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-indigo-800 dark:text-indigo-300 mb-2">التفاني للتعليم</h3>
            <p className="text-gray-700 dark:text-gray-300">نحن ملتزمون بتقديم محتوى تعليمي عالي الجودة...</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">الابتكار والتطوير</h3>
            <p className="text-gray-700 dark:text-gray-300">نحرص دائماً على البحث عن طرق جديدة لتحسين تجربة المستخدم...</p>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-300 mb-2">الشفافية والموثوقية</h3>
            <p className="text-gray-700 dark:text-gray-300">نحن ملتزمون بالشفافية في جميع أعمالنا...</p>
          </div>
        </div>
      </section>
      
      {/* Vision & Mission */}
      <section className="mb-16 animate-fadeInUp">
        <h2 className="text-3xl font-bold mb-8 text-center">الرؤية والرسالة</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-indigo-800 dark:text-indigo-300 mb-2">الرؤية</h3>
            <p className="text-gray-700 dark:text-gray-300">أن نكون المنصة التعليمية الرائدة في العالم العربي...</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">الرسالة</h3>
            <p className="text-gray-700 dark:text-gray-300">توفير محتوى معرفي حديث وعملي يساعد على تطوير مهارات الأفراد...</p>
          </div>
        </div>
      </section>
      
      {/* Core Values */}
      <section className="mb-16 animate-fadeInUp">
        <h2 className="text-3xl font-bold mb-8 text-center">قيمنا الأساسية</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold text-pink-700 dark:text-pink-300 mb-2">التعاون</h3>
            <p className="text-gray-700 dark:text-gray-300">نعمل بروح الفريق الواحد لتحقيق نتائج أفضل.</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-2">الإبداع</h3>
            <p className="text-gray-700 dark:text-gray-300">نفكر دائماً خارج الصندوق لنبتكر حلول جديدة.</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-teal-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-300 mb-2">التميز</h3>
            <p className="text-gray-700 dark:text-gray-300">نسعى لتحقيق الجودة في كل ما نقدمه.</p>
          </div>
        </div>
      </section>
      
      {/* Team */}
      <section className="mt-20 animate-fadeInUp">
        <h2 className="text-3xl font-bold mb-8 text-center">الفريق</h2>
        
        {/* زر الانتقال إلى صفحة الفريق */}
        <div className="text-center mb-10">
          <Link 
            href="/team" 
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            <span>عرض جميع أعضاء الفريق</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        {members.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
            {members.map((member, idx) => (
              <div key={member.id} className="animate-fadeInUp" style={{ animationDelay: `${idx * 150}ms` }}>
                <MemberCard member={member} photoUrl={getPhotoUrl(member.photo)} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400 italic">لا توجد بيانات عن أعضاء الفريق حالياً</p>
        )}
      </section>
      
      {/* Contact and Social */}
      <div className="text-center mt-20 animate-fadeIn">
        <Link 
          href="/contact" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-110 hover:rotate-1 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          تواصل معنا
        </Link>
      </div>
      <div className="flex justify-center gap-5 mt-8 animate-bounceSlow">
        {socialLinks.map((s, i) => (
          <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-blue-500 shadow-lg transition-transform transform hover:scale-125 hover:rotate-6">
            {s.icon}
          </a>
        ))}
      </div>
    </div>
  );
};

export default AboutPage;