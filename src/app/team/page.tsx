// app/team/page.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  FaLinkedin, FaTwitter, FaInstagram, FaFacebookF, 
  FaEnvelope, FaGlobe, FaBriefcase, FaGraduationCap,
  FaQuoteLeft, FaQuoteRight, FaArrowLeft, FaStar,
  FaUsers, FaMedal, FaLightbulb, FaHeart,
  FaCalendarAlt, FaMapMarkerAlt, FaPhone, FaVideo, FaFileAlt,
  FaFlask, FaLandmark, FaChartLine, FaCalculator, FaBalanceScale, FaBook, FaAtom
} from "react-icons/fa";
import { urlFor, fetchFromSanity } from '@/lib/sanity';

// واجهة بيانات عضو الفريق
interface TeamMember {
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
      _ref: string;
      _type: "reference";
    };
  };
  experience?: string;
  education?: string;
  achievements?: string[];
  skills?: string[];
  socialLinks?: {
    platform?: string;
    url?: string;
  }[];
  contactEmail?: string;
  joinDate?: string;
  location?: string;
  quote?: string;
}

// جلب بيانات أعضاء الفريق
async function getTeamMembers(): Promise<TeamMember[]> {
  const query = `*[_type == "teamMember"]{
    _id,
    name,
    role,
    bio,
    slug,
    image{
      _type,
      asset{
        _ref,
        _type
      }
    },
    experience,
    education,
    achievements,
    skills,
    socialLinks[]{
      platform,
      url
    },
    contactEmail,
    joinDate,
    location,
    quote
  }`;
  
  try {
    const members = await fetchFromSanity<TeamMember[]>(query);
    return members || [];
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

// جلب عدد الحلقات والمقالات
async function getContentCounts() {
  try {
    const episodesQuery = `count(*[_type == "episode"])`;
    const articlesQuery = `count(*[_type == "article"])`;
    
    const [episodesCount, articlesCount] = await Promise.all([
      fetchFromSanity<number>(episodesQuery),
      fetchFromSanity<number>(articlesQuery)
    ]);
    
    return {
      episodes: episodesCount || 0,
      articles: articlesCount || 0
    };
  } catch (error) {
    console.error("Error fetching content counts:", error);
    return {
      episodes: 0,
      articles: 0
    };
  }
}

// مكون بطاقة عضو الفريق
interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
}

const TeamMemberCard = ({ member, index }: TeamMemberCardProps) => {
  const imageUrl = member.image ? urlFor(member.image) : "/placeholder.png";
  
  return (
    <div 
      className="group relative bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-900/30 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20 dark:shadow-blue-500/10 transition-all duration-1000 hover:shadow-3xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/20 transform hover:-translate-y-4 w-full max-w-md mx-auto border border-gray-100 dark:border-gray-700 origin-center"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* خلفية متحركة متدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 opacity-70 transition-opacity duration-1000 group-hover:opacity-90"></div>
      
      {/* دوائر زخرفية متحركة */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full opacity-20 transform rotate-12 animate-pulse-slow transition-transform duration-1000 group-hover:scale-125"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 transform -rotate-12 animate-pulse-slow transition-transform duration-1000 group-hover:scale-125" style={{ animationDelay: '0.5s' }}></div>
      
      {/* تأثير لمعان */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full transition-transform duration-1500 group-hover:translate-x-full"></div>
      
      <div className="relative z-10 p-8">
        {/* قسم الصورة */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* الإطار الخارجي المتحرك */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 p-2 animate-border-rotate transition-all duration-1000 group-hover:animate-pulse shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20"></div>
            
            {/* الصورة */}
            <div className="relative bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-600 transition-all duration-1000 group-hover:border-purple-400 shadow-lg group-hover:shadow-xl">
                <Image 
                  src={imageUrl}
                  alt={member.name}
                  width={160}
                  height={160}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
              
              {/* تأثير لمعان على الصورة */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100"></div>
            </div>
          </div>
        </div>
        
        {/* معلومات العضو */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-all duration-1000 group-hover:text-purple-600 dark:group-hover:text-purple-400 drop-shadow-md">
            {member.name}
          </h3>
          
          {member.role && (
            <p className="text-gray-700 dark:text-gray-300 text-base px-6 py-2 bg-gradient-to-r from-gray-100 to-blue-100 dark:from-gray-700 dark:to-blue-900/50 rounded-full inline-block transition-all duration-1000 group-hover:bg-gradient-to-r group-hover:from-purple-100 group-hover:to-blue-100 dark:group-hover:from-purple-900/50 dark:group-hover:to-blue-900/50 shadow-md shadow-blue-500/20 dark:shadow-blue-500/10">
              {member.role}
            </p>
          )}
        </div>
        
        {/* المهارات */}
        {member.skills && member.skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {member.skills.slice(0, 3).map((skill, idx) => (
              <span 
                key={idx} 
                className="text-sm px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-800 dark:text-blue-200 rounded-full transition-all duration-1000 group-hover:bg-gradient-to-r group-hover:from-blue-200 group-hover:to-indigo-200 dark:group-hover:from-blue-800 dark:group-hover:to-indigo-800 shadow-md shadow-blue-500/20 dark:shadow-blue-500/10"
              >
                {skill}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="text-sm px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 rounded-full shadow-md shadow-gray-500/20 dark:shadow-gray-500/10">
                +{member.skills.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* زر الملف الشخصي */}
        <div className="flex justify-center">
          <Link 
            href={`/team/${member.slug.current}`}
            className="relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-1000 transform hover:scale-105 shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40 dark:hover:shadow-purple-500/30"
          >
            <span className="relative z-10 flex items-center">
              عرض الملف الشخصي
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform duration-1000 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
            
            {/* تأثير الموجة على الزر */}
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 transition-opacity duration-1000 rounded-full transform scale-0 group-hover:scale-100"></span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// مكون قسم الإحصائيات - المميز
const ContentStats = ({ episodes, articles }: { episodes: number; articles: number }) => {
  return (
    <div className="mb-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">إنجازاتنا</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          نفتخر بما قدمناه من محتوى تعليمي متميز يساهم في تطوير المهارات
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* كرت الحلقات */}
        <div className="group relative bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 rounded-3xl p-10 text-center text-white shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/20 overflow-hidden transform transition-all duration-700 hover:scale-105 hover:shadow-3xl hover:shadow-blue-500/40 dark:hover:shadow-blue-500/30">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* دوائر زخرفية متحركة */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400 rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2 transition-all duration-1000 group-hover:scale-150"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 rounded-full opacity-20 transform -translate-x-1/2 translate-y-1/2 transition-all duration-1000 group-hover:scale-150"></div>
          
          {/* تأثير لمعان */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"></div>
          
          <div className="relative z-10">
            {/* أيقونة متحركة */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-700 group-hover:bg-white/30 group-hover:rotate-12 shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
                <FaVideo className="text-3xl transition-transform duration-700 group-hover:scale-110" />
              </div>
            </div>
            
            {/* الرقم مع تأثير عداد */}
            <div className="text-5xl md:text-6xl font-bold mb-3 transition-all duration-700 group-hover:text-6xl group-hover:text-yellow-300 drop-shadow-lg">
              {episodes}
            </div>
            
            <div className="text-xl opacity-90 mb-4">حلقة فيديو</div>
            
            {/* وصف إضافي */}
            <p className="text-blue-100 opacity-80 max-w-xs mx-auto text-sm">
              محتوى تعليمي شامل في مختلف المجالات
            </p>
            
            {/* تأثير خطي سفلي */}
            <div className="mt-6 h-1 w-16 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full transition-all duration-700 group-hover:w-24 shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20"></div>
          </div>
        </div>
        
        {/* كرت المقالات */}
        <div className="group relative bg-gradient-to-br from-purple-600 to-pink-700 dark:from-purple-800 dark:to-pink-900 rounded-3xl p-10 text-center text-white shadow-2xl shadow-purple-500/30 dark:shadow-purple-500/20 overflow-hidden transform transition-all duration-700 hover:scale-105 hover:shadow-3xl hover:shadow-purple-500/40 dark:hover:shadow-purple-500/30">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* دوائر زخرفية متحركة */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400 rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2 transition-all duration-1000 group-hover:scale-150"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400 rounded-full opacity-20 transform -translate-x-1/2 translate-y-1/2 transition-all duration-1000 group-hover:scale-150"></div>
          
          {/* تأثير لمعان */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"></div>
          
          <div className="relative z-10">
            {/* أيقونة متحركة */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-700 group-hover:bg-white/30 group-hover:-rotate-12 shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20 float-animation">
                <FaFileAlt className="text-3xl transition-transform duration-700 group-hover:scale-110" />
              </div>
            </div>
            
            {/* الرقم مع تأثير عداد */}
            <div className="text-5xl md:text-6xl font-bold mb-3 transition-all duration-700 group-hover:text-6xl group-hover:text-yellow-300 drop-shadow-lg">
              {articles}
            </div>
            
            <div className="text-xl opacity-90 mb-4">مقالة</div>
            
            {/* وصف إضافي */}
            <p className="text-purple-100 opacity-80 max-w-xs mx-auto text-sm">
              مقالات شاملة تغطي كافة الجوانب التعليمية
            </p>
            
            {/* تأثير خطي سفلي */}
            <div className="mt-6 h-1 w-16 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full transition-all duration-700 group-hover:w-24 shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20"></div>
          </div>
        </div>
      </div>
      
      {/* جملة توضيحية مميزة */}
      <div className="text-center mt-12">
        <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20">
          أكثر من {episodes + articles} محتوى تعليمي متميز
        </div>
      </div>
    </div>
  );
};

// مكون قسم القيم
const ValuesSection = () => {
  return (
    <div className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">قيمنا الأساسية</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-8 rounded-2xl shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 border border-blue-100 dark:border-blue-800 transition-all duration-700 hover:shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/20 hover:scale-105 overflow-hidden origin-center">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* دوائر زخرفية */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400 rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2 transition-all duration-700 group-hover:scale-150"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-indigo-400 rounded-full opacity-20 transform -translate-x-1/2 translate-y-1/2 transition-all duration-700 group-hover:scale-150"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 mx-auto transition-all duration-700 group-hover:rotate-12 group-hover:shadow-lg shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
              <FaUsers className="text-white text-2xl transition-transform duration-700 group-hover:scale-110" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center transition-colors duration-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 drop-shadow-md">التعاون</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center transition-all duration-700 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              نؤمن بقوة العمل الجماعي ونسعى لتحقيق أهدافنا من خلال التعاون المستمر ودعم بعضنا البعض.
            </p>
          </div>
          
          {/* تأثير اللمعان */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"></div>
        </div>
        
        <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-8 rounded-2xl shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10 border border-purple-100 dark:border-purple-800 transition-all duration-700 hover:shadow-xl hover:shadow-purple-500/30 dark:hover:shadow-purple-500/20 hover:scale-105 overflow-hidden origin-center">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* دوائر زخرفية */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400 rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2 transition-all duration-700 group-hover:scale-150"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-pink-400 rounded-full opacity-20 transform -translate-x-1/2 translate-y-1/2 transition-all duration-700 group-hover:scale-150"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6 mx-auto transition-all duration-700 group-hover:-rotate-12 group-hover:shadow-lg shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20 float-animation">
              <FaLightbulb className="text-white text-2xl transition-transform duration-700 group-hover:scale-110" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center transition-colors duration-700 group-hover:text-purple-600 dark:group-hover:text-purple-400 drop-shadow-md">الابتكار</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center transition-all duration-700 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              نسعى دائماً لتقديم حلول مبتكرة وإبداعية تلبي احتياجات عملائنا وتساهم في نجاحهم.
            </p>
          </div>
          
          {/* تأثير اللمعان */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"></div>
        </div>
        
        <div className="group relative bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 p-8 rounded-2xl shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 border border-indigo-100 dark:border-indigo-800 transition-all duration-700 hover:shadow-xl hover:shadow-indigo-500/30 dark:hover:shadow-indigo-500/20 hover:scale-105 overflow-hidden origin-center">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* دوائر زخرفية */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400 rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2 transition-all duration-700 group-hover:scale-150"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-400 rounded-full opacity-20 transform -translate-x-1/2 translate-y-1/2 transition-all duration-700 group-hover:scale-150"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto transition-all duration-700 group-hover:rotate-12 group-hover:shadow-lg shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20 float-animation">
              <FaMedal className="text-white text-2xl transition-transform duration-700 group-hover:scale-110" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center transition-colors duration-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 drop-shadow-md">التميز</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center transition-all duration-700 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              نلتزم بأعلى معايير الجودة في كل ما نقومه ونسعى لتحقيق التميز في جميع جوانب عملنا.
            </p>
          </div>
          
          {/* تأثير اللمعان */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"></div>
        </div>
      </div>
    </div>
  );
};

// مكون قسم الهيرو - مع أيقونات المواد الدراسية
const HeroSection = () => {
  return (
    <div className="relative mb-16 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/20">
      {/* الخلفية المتدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950"></div>
      
      {/* العناصر الزخرفية */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow shadow-2xl shadow-purple-500/30 dark:shadow-purple-500/20"></div>
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
        
        {/* أيقونات المواد الدراسية في الخلفية */}
        <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
          <FaFlask className="text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
          <FaAtom className="text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
          <FaLandmark className="text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/3 right-1/3 text-white/10 transform translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '3s' }}>
          <FaBalanceScale className="text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/2 left-1/2 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '4s' }}>
          <FaChartLine className="text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-2/3 left-1/5 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '5s' }}>
          <FaBook className="text-9xl drop-shadow-lg" />
        </div>
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 py-20 px-8 md:px-16 text-center">
        <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full mb-6 shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
          <span className="text-white font-medium flex items-center justify-center">
            <FaUsers className="text-yellow-300 mr-2 animate-pulse" />
            فريق العمل
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
          تعرف على <span className="text-yellow-300">ابطال</span> فذلكة
        </h1>
        
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto drop-shadow-md">
          نفتخر بفريقنا من المحترفين الموهوبين الذين يعملون بجد لتحقيق رؤيتنا وتقديم أفضل تجربة لعملائنا.
        </p>
        
        <div className="flex justify-center gap-4 flex-wrap">
          <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
            <FaMedal className="text-yellow-300 mr-2" />
            <span className="text-white">خبرة عالية</span>
          </div>
          <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
            <FaLightbulb className="text-yellow-300 mr-2" />
            <span className="text-white">إبداع وابتكار</span>
          </div>
          <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
            <FaHeart className="text-yellow-300 mr-2" />
            <span className="text-white">شغف بالعمل</span>
          </div>
        </div>
        
        {/* أيقونات المواد الدراسية في الأسفل */}
        <div className="flex justify-center gap-8 mt-12 flex-wrap">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
            <FaFlask className="text-yellow-300 text-2xl" />
          </div>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
            <FaAtom className="text-yellow-300 text-2xl" />
          </div>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
            <FaLandmark className="text-yellow-300 text-2xl" />
          </div>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1.5s' }}>
            <FaBalanceScale className="text-yellow-300 text-2xl" />
          </div>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2s' }}>
            <FaChartLine className="text-yellow-300 text-2xl" />
          </div>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2.5s' }}>
            <FaBook className="text-yellow-300 text-2xl" />
          </div>
        </div>
      </div>
      
      {/* تأثيرات حركية */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20"></div>
    </div>
  );
};

// مكون قسم التواصل المميز - بدون تفاصيل
const ContactSection = () => {
  return (
    <div className="relative mb-16 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/30 dark:shadow-indigo-500/20">
      {/* الخلفية المتدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900"></div>
      
      {/* العناصر الزخرفية */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow shadow-2xl shadow-indigo-500/30 dark:shadow-indigo-500/20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow shadow-2xl shadow-purple-500/30 dark:shadow-purple-500/20"></div>
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 py-20 px-8 md:px-16 text-center">
        <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full mb-6 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20">
          <span className="text-white font-medium flex items-center justify-center">
            <FaEnvelope className="text-yellow-300 mr-2 animate-pulse" />
            تواصل معنا
          </span>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
          نحن هنا <span className="text-yellow-300">للمساعدة</span>
        </h2>
        
        <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto drop-shadow-md">
          إذا كان لديك أي استفسار أو ترغب في التواصل مع أحد أعضاء فريقنا، فلا تتردد في الاتصال بنا.
        </p>
        
        <div className="flex justify-center gap-6 flex-wrap">
          <Link 
            href="/contact" 
            className="group relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 px-8 rounded-full transition-all duration-1000 transform hover:scale-105 shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/40 dark:hover:shadow-yellow-500/30"
          >
            <span className="relative z-10 flex items-center">
              <FaEnvelope className="ml-3 text-xl" />
              تواصل معنا
            </span>
            
            {/* تأثير الموجة على الزر */}
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-500 to-orange-600 opacity-0 transition-opacity duration-1000 rounded-full transform scale-0 group-hover:scale-100"></span>
          </Link>
          
          <Link 
            href="/faq" 
            className="group relative inline-flex items-center justify-center overflow-hidden bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold py-4 px-8 rounded-full transition-all duration-1000 transform hover:scale-105 hover:bg-white/30 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 dark:hover:shadow-indigo-500/30"
          >
            <span className="relative z-10 flex items-center">
              الأسئلة الشائعة
            </span>
            
            {/* تأثير الموجة على الزر */}
            <span className="absolute top-0 left-0 w-full h-full bg-white/20 opacity-0 transition-opacity duration-1000 rounded-full transform scale-0 group-hover:scale-100"></span>
          </Link>
        </div>
      </div>
      
      {/* تأثيرات حركية */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20"></div>
    </div>
  );
};

// مكون قسم أعضاء الفريق المميز مع الكروت
const TeamSection = ({ members }: { members: TeamMember[] }) => {
  return (
    <div className="relative mb-16 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/20">
      {/* الخلفية المتدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-900"></div>
      
      {/* العناصر الزخرفية */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow shadow-2xl shadow-purple-500/30 dark:shadow-purple-500/20"></div>
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
        
        {/* أيقونات الفريق في الخلفية */}
        <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
          <FaUsers className="text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
          <FaMedal className="text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
          <FaLightbulb className="text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/3 right-1/3 text-white/10 transform translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '3s' }}>
          <FaHeart className="text-9xl drop-shadow-lg" />
        </div>
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 py-16 px-8 md:px-16">
        <div className="text-center mb-12">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full mb-6 shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
            <span className="text-white font-medium flex items-center justify-center">
              <FaUsers className="text-yellow-300 mr-2 animate-pulse" />
              فريق العمل
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            أعضاء فريقنا
          </h2>
          
          <p className="text-xl text-blue-100 max-w-2xl mx-auto drop-shadow-md">
            تعرف على الأعضاء الموهوبين الذين يشكلون قوة دفع لنجاحنا
          </p>
        </div>
        
        {/* أعضاء الفريق */}
        {members.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-8">
            {members.map((member, index) => (
              <div key={member._id} className="w-full md:w-auto max-w-md">
                <TeamMemberCard member={member} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
            <p className="text-white/80 italic">لا توجد بيانات عن أعضاء الفريق حالياً</p>
            <p className="text-white/60 mt-2 text-sm">سيتم تحديث هذا القسم قريباً</p>
          </div>
        )}
      </div>
      
      {/* تأثيرات حركية */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20"></div>
    </div>
  );
};

// الصفحة الرئيسية
const TeamPage = async () => {
  const members = await getTeamMembers();
  const { episodes, articles } = await getContentCounts();
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* الهيرو */}
        <HeroSection />
        
        {/* إحصائيات المحتوى */}
        <ContentStats episodes={episodes} articles={articles} />
        
        {/* قيم الفريق */}
        <ValuesSection />
        
        {/* قسم الفريق مع الكروت */}
        <TeamSection members={members} />
        
        {/* قسم التواصل */}
        <ContactSection />
      </div>
    </div>
  );
};

export default TeamPage;