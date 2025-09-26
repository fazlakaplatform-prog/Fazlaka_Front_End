"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  FaVideo, FaListUl, FaUsers, 
  FaYoutube, FaInstagram, FaFacebookF, FaTiktok,
  FaCalendarAlt, FaNewspaper, FaHeart,
  FaStar, FaAward, FaFire, 
  FaLightbulb, FaRocket, FaHandshake, FaGem,
  FaArrowRight, FaCheck, FaQuoteRight,
  FaPlay, FaBook, FaChartLine,
  FaGraduationCap, FaChalkboardTeacher, FaMedal, FaGlobe,
  FaEnvelope, FaPaperPlane, FaLinkedin, FaTwitter,
  FaUser, FaBriefcase, FaQuoteLeft, FaFlask, FaAtom, FaLandmark, 
  FaBalanceScale, FaFileAlt
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { urlFor, fetchFromSanity } from '@/lib/sanity';

// Interfaces
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
      _ref: string;
      _type: "reference";
    };
  };
  skills?: string[];
}

// Social links
const socialLinks = [
  { href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA", icon: <FaYoutube />, label: "يوتيوب" },
  { href: "https://www.instagram.com/fazlaka_platform/", icon: <FaInstagram />, label: "انستجرام" },
  { href: "https://www.facebook.com/profile.php?id=61579582675453", icon: <FaFacebookF />, label: "فيس بوك" },
  { href: "https://www.tiktok.com/@fazlaka_platform", icon: <FaTiktok />, label: "تيك توك" },
  { href: "https://x.com/FazlakaPlatform", icon: <FaXTwitter />, label: "اكس" },
];

// APIs - تعريف جميع الدوال هنا
async function getMembers(): Promise<Member[]> {
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
    skills
  }`;
  
  try {
    const members = await fetchFromSanity<Member[]>(query);
    return members || [];
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
    const query = `count(*[_type == "episode"])`;
    const count = await fetchFromSanity<number>(query);
    return count || 0;
  } catch { return 0; }
}

async function getPlaylistsCount(): Promise<number> {
  try {
    const query = `count(*[_type == "playlist"])`;
    const count = await fetchFromSanity<number>(query);
    return count || 0;
  } catch { return 0; }
}

async function getSeasonsCount(): Promise<number> {
  try {
    const query = `count(*[_type == "season"])`;
    const count = await fetchFromSanity<number>(query);
    return count || 0;
  } catch { return 0; }
}

async function getArticlesCount(): Promise<number> {
  try {
    const query = `count(*[_type == "article"])`;
    const count = await fetchFromSanity<number>(query);
    return count || 0;
  } catch { return 0; }
}

// Components
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
  darkBgColor: string;
  darkIconColor: string;
  darkShadowColor: string;
}

const StatCard = ({ icon, title, value, bgColor, iconColor, darkBgColor, darkIconColor, darkShadowColor }: StatCardProps) => (
  <div className={`${bgColor} ${darkBgColor} rounded-xl p-4 sm:p-6 shadow-lg transition-all duration-700 hover:shadow-2xl transform hover:-translate-y-3 w-full max-w-md mx-auto border border-gray-100 dark:border-gray-700 dark:shadow-${darkShadowColor}/30 hover:dark:shadow-${darkShadowColor}/50 relative overflow-hidden group origin-center`}>
    {/* Shimmer effect - تم تعديل سرعة الأنيميشن */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    
    <div className="relative z-10 flex flex-col items-center justify-center">
      <div className={`text-3xl sm:text-4xl mb-3 sm:mb-4 ${iconColor} ${darkIconColor} transition-transform duration-700 group-hover:scale-110`}>{icon}</div>
      <p className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-700 group-hover:text-gray-900 dark:group-hover:text-white">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-all duration-700 group-hover:text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{value}</p>
    </div>
  </div>
);

// مكون بطاقة عضو الفريق المحدث
interface MemberCardProps {
  member: Member;
  index: number;
}

const MemberCard = ({ member, index }: MemberCardProps) => {
  const imageUrl = member.image && member.image.asset && member.image.asset._ref
    ? urlFor(member.image)
    : "/placeholder.png";
  
  return (
    <div 
      className="group relative bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-900/30 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20 dark:shadow-blue-500/10 transition-all duration-1000 hover:shadow-3xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/20 transform hover:-translate-y-4 w-full mx-auto border border-gray-100 dark:border-gray-700 origin-center"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* خلفية متحركة متدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 opacity-70 transition-opacity duration-1000 group-hover:opacity-90"></div>
      
      {/* دوائر زخرفية متحركة */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full opacity-20 transform rotate-12 animate-pulse-slow transition-transform duration-1000 group-hover:scale-125"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 transform -rotate-12 animate-pulse-slow transition-transform duration-1000 group-hover:scale-125" style={{ animationDelay: '0.5s' }}></div>
      
      {/* تأثير لمعان */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full transition-transform duration-1500 group-hover:translate-x-full"></div>
      
      <div className="relative z-10 p-6 sm:p-8">
        {/* قسم الصورة */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="relative">
            {/* الإطار الخارجي المتحرك */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 p-2 animate-border-rotate transition-all duration-1000 group-hover:animate-pulse shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20"></div>
            
            {/* الصورة */}
            <div className="relative bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-600 transition-all duration-1000 group-hover:border-purple-400 shadow-lg group-hover:shadow-xl">
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
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-all duration-1000 group-hover:text-purple-600 dark:group-hover:text-purple-400 drop-shadow-md">
            {member.name}
          </h3>
          
          {member.role && (
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base px-4 sm:px-6 py-1 sm:py-2 bg-gradient-to-r from-gray-100 to-blue-100 dark:from-gray-700 dark:to-blue-900/50 rounded-full inline-block transition-all duration-1000 group-hover:bg-gradient-to-r group-hover:from-purple-100 group-hover:to-blue-100 dark:group-hover:from-purple-900/50 dark:group-hover:to-blue-900/50 shadow-md shadow-blue-500/20 dark:shadow-blue-500/10">
              {member.role}
            </p>
          )}
        </div>
        
        {/* المهارات */}
        {member.skills && member.skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            {member.skills.slice(0, 3).map((skill, idx) => (
              <span 
                key={idx} 
                className="text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-800 dark:text-blue-200 rounded-full transition-all duration-1000 group-hover:bg-gradient-to-r group-hover:from-blue-200 group-hover:to-indigo-200 dark:group-hover:from-blue-800 dark:group-hover:to-indigo-800 shadow-md shadow-blue-500/20 dark:shadow-blue-500/10"
              >
                {skill}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 rounded-full shadow-md shadow-gray-500/20 dark:shadow-gray-500/10">
                +{member.skills.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* زر الملف الشخصي */}
        <div className="flex justify-center">
          <Link 
            href={`/team/${member.slug.current}`}
            className="relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-1000 transform hover:scale-105 shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40 dark:hover:shadow-purple-500/30 text-sm sm:text-base"
          >
            <span className="relative z-10 flex items-center">
              عرض الملف الشخصي
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 transition-transform duration-1000 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
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

// مكون جديد لبطاقة المشتركين المميزة مع تحسينات كبيرة
interface YouTubeSubscribersCardProps {
  subscribers: number;
}

const YouTubeSubscribersCard = ({ subscribers }: YouTubeSubscribersCardProps) => {
  // تنسيق الرقم بالإنجليزية مع فواصل
  const formattedSubscribers = subscribers.toLocaleString('en-US');
  
  // حساب النسبة المئوية نحو 100 ألف مشترك - لا تظهر صفر أبداً
  const target = 100000;
  const percentage = subscribers === 0 ? 0 : Math.max(1, Math.min(100, Math.round((subscribers / target) * 100)));
  
  return (
    <div className="relative w-full max-w-4xl mx-auto mb-12 sm:mb-16">
      {/* الخلفية الرئيسية */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800 dark:from-red-900 dark:via-red-800 dark:to-red-900 rounded-3xl shadow-2xl transform rotate-1 animate-pulse-slow transition-transform duration-2000"></div>
      
      {/* الحاوية الرئيسية */}
      <div className="relative z-10 bg-gradient-to-br from-red-500 to-red-700 dark:from-red-800 dark:to-red-900 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border-4 border-red-400 dark:border-red-700 overflow-hidden transition-all duration-700">
        {/* أنماط الخلفية الزخرفية */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {/* دوائر زخرفية */}
          <div className="absolute -top-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 bg-red-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute -bottom-20 -left-20 w-56 sm:w-72 h-56 sm:h-72 bg-yellow-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
          
          {/* شبكة زخرفية */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
        </div>
        
        {/* المحتوى الرئيسي */}
        <div className="relative z-20 flex flex-col md:flex-row items-center justify-between">
          {/* القسم الأيسر - الأيقونة والعنوان */}
          <div className="flex-1 mb-6 sm:mb-8 md:mb-0 md:pr-4 sm:md:pr-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="relative">
                  <FaYoutube className="text-4xl sm:text-6xl text-white drop-shadow-lg transform -rotate-6 animate-bounce transition-all duration-2000" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 animate-ping">
                    <FaStar className="text-red-800 text-xs" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -left-2 bg-blue-500 rounded-full p-1 animate-ping" style={{ animationDelay: '1s' }}>
                  <FaPlay className="text-white text-xs" />
                </div>
              </div>
              <div className="mr-3 sm:mr-5">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-2">مشتركين يوتيوب</h2>
                <div className="flex items-center">
                  <FaFire className="text-yellow-300 mr-2 animate-bounce-slow" />
                  <span className="text-yellow-200 font-medium text-sm sm:text-base">قناة متنامية</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center mt-4 sm:mt-6">
              <FaAward className="text-yellow-300 text-base sm:text-lg mr-2 sm:mr-3 animate-pulse" />
              <span className="text-white text-opacity-90 text-sm sm:text-base">شكراً لكم على دعمكم المستمر!</span>
            </div>
          </div>
          
          {/* القسم الأيمن - الرقم والإحصائيات */}
          <div className="flex-1 flex flex-col items-center md:items-end">
            <div className="relative mb-3 sm:mb-5">
              {/* خلفية الرقم */}
              <div className="absolute inset-0 bg-black bg-opacity-20 rounded-2xl blur-lg animate-pulse-slow"></div>
              
              {/* الرقم الرئيسي */}
              <div className="relative bg-gradient-to-r from-black to-red-900 bg-opacity-40 backdrop-blur-sm rounded-2xl px-3 sm:px-6 py-3 sm:py-5 border-2 border-white border-opacity-20 shadow-2xl transition-all duration-2000">
                <div className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tighter leading-none">
                  {formattedSubscribers}
                </div>
                <div className="mt-1 sm:mt-2 text-center">
                  <div className="inline-flex items-center bg-yellow-500 text-red-900 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold animate-bounce">
                    <FaHeart className="mr-1" />
                    <span>مشترك</span>
                  </div>
                </div>
              </div>
              
              {/* تأثيرات حول الرقم */}
              <div className="absolute -top-3 -right-3 w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 rounded-full animate-pulse-slow opacity-70"></div>
              <div className="absolute -bottom-3 -left-3 w-6 h-6 sm:w-8 sm:h-8 bg-red-400 rounded-full animate-pulse-slow opacity-70"></div>
            </div>
            
            {/* شريط التقدم مع النسبة المئوية - مع تحسينات */}
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-white text-opacity-80 text-xs sm:text-sm mb-1">
                <span>التقدم</span>
                <span className="font-bold">{percentage}%</span>
              </div>
              <div className="bg-black bg-opacity-20 rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full animate-progress shadow-lg shadow-yellow-500/50 transition-all duration-3000 ease-out"
                  style={{ 
                    width: `${percentage}%`
                  }}
                ></div>
              </div>
              <div className="text-white text-opacity-80 text-xs sm:text-sm mt-1 sm:mt-2">نحو {target.toLocaleString('en-US')} مشترك</div>
            </div>
          </div>
        </div>
        
        {/* عناصر زخرفية إضافية */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white text-opacity-10 text-3xl sm:text-5xl animate-pulse">
          <FaYoutube />
        </div>
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 text-white text-opacity-10 text-3xl sm:text-5xl transform rotate-12 animate-pulse" style={{ animationDelay: '0.5s' }}>
          <FaYoutube />
        </div>
        
        {/* تأثيرات حركية */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
      </div>
    </div>
  );
};

// مكون الهيرو الجديد
const HeroSection = () => {
  return (
    <div className="relative mb-12 sm:mb-16 overflow-hidden rounded-3xl">
      {/* الخلفية المتدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950"></div>
      
      {/* العناصر الزخرفية */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        {/* دوائر زخرفية */}
        <div className="absolute -top-40 -right-40 w-64 h-64 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
        
        {/* شبكة زخرفية */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
        
        {/* أيقونات المواد الدراسية في الخلفية */}
        <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
          <FaFlask className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
          <FaAtom className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
          <FaLandmark className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute bottom-1/3 right-1/3 text-white/10 transform translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '3s' }}>
          <FaBalanceScale className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-1/2 left-1/2 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '4s' }}>
          <FaChartLine className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
        <div className="absolute top-2/3 left-1/5 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '5s' }}>
          <FaBook className="text-7xl sm:text-9xl drop-shadow-lg" />
        </div>
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-center">
        {/* القسم الأيسر - النص */}
        <div className="w-full text-center mb-8 md:mb-0">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
            <span className="text-white font-medium flex items-center text-sm sm:text-base">
              <FaStar className="text-yellow-300 mr-2 animate-pulse" />
              العلم في قصة
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            رحلة <span className="text-yellow-300">التعلم</span> تبدأ من هنا
          </h1>
          <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            نقدم محتوى تعليمي مبتكر وعالي الجودة يساعدك على تطوير مهاراتك وتحقيق أهدافك التعليمية والمهنية.
          </p>
          
          {/* أيقونات المواد الدراسية في الأسفل */}
          <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 flex-wrap">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
              <FaFlask className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
              <FaAtom className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
              <FaLandmark className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1.5s' }}>
              <FaBalanceScale className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2s' }}>
              <FaChartLine className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2.5s' }}>
              <FaBook className="text-yellow-300 text-lg sm:text-xl" />
            </div>
          </div>
        </div>
        
        {/* القسم الأيمن - الصورة أو الرسوم التوضيحية */}
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex justify-center">
          <div className="relative">
            {/* دائرة خلفية */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full filter blur-3xl w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 animate-pulse-slow"></div>
            
            {/* الأيقونات المتحركة */}
            <div className="relative grid grid-cols-3 gap-3 sm:gap-4 w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64">
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaVideo className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaChalkboardTeacher className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaMedal className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaUsers className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaGlobe className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
              <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.6s' }}>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                  <FaChartLine className="text-white text-xl sm:text-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* تأثيرات حركية */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
    </div>
  );
};

// مكون قسم "هل لديك استفسار" المحسن بشكل أكبر - بدون النقاط الثلاث
const ContactSection = () => {
  return (
    <div className="text-center mt-12 mb-12 sm:mt-16 sm:mb-16">
      <div className="max-w-4xl mx-auto relative">
        {/* خلفية متدرجة متحركة */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-900 rounded-3xl shadow-2xl transform rotate-1 animate-pulse-slow"></div>
        
        {/* الحاوية الرئيسية */}
        <div className="relative z-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-blue-100 dark:border-blue-800 overflow-hidden transition-all duration-700">
          {/* أنماط الخلفية الزخرفية */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            {/* دوائر زخرفية */}
            <div className="absolute -top-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-pulse-slow"></div>
            <div className="absolute -bottom-20 -left-20 w-56 sm:w-72 h-56 sm:h-72 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
            
            {/* شبكة زخرفية */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDMiPjwvcmVjdD4KPC9zdmc+')] opacity-5"></div>
          </div>
          
          <div className="relative z-20">
            {/* الأيقونة الرئيسية المحسنة */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-70 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 p-3 sm:p-4 rounded-full shadow-lg transition-all duration-700 transform hover:scale-101 animate-bounce">
                  <FaEnvelope className="text-white text-2xl sm:text-3xl" />
                </div>
                {/* عناصر زخرفية حول الأيقونة */}
                <div className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 -left-2 w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.8s' }}></div>
              </div>
            </div>
            
            {/* علامات الاقتباس المحسنة */}
            <div className="flex justify-center mb-3 sm:mb-5">
              <div className="relative">
                <FaQuoteRight className="text-3xl sm:text-4xl text-blue-200 dark:text-blue-900/50" />
                <div className="absolute inset-0 text-blue-300 dark:text-blue-800/70 transform scale-75 opacity-50">
                  <FaQuoteRight className="text-3xl sm:text-4xl" />
                </div>
              </div>
            </div>
            
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              هل لديك أي <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">استفسار</span>؟
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-5 sm:mb-7 max-w-2xl mx-auto">
              نحن هنا لمساعدتك والإجابة على جميع استفساراتك. لا تتردد في التواصل معنا، فريقنا الدعم متاح دائماً لمساعدتك في أي وقت.
            </p>
            
            {/* الأزرار المحسنة */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link 
                href="/contact" 
                className="group relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 sm:py-3 px-5 sm:px-8 rounded-full shadow-lg transition-all duration-700 transform hover:scale-105 animate-bounce text-sm sm:text-base"
              >
                <span className="relative z-10 flex items-center">
                  <FaPaperPlane className="ml-2 sm:ml-3 text-base sm:text-lg transition-transform duration-700 group-hover:translate-x-1" />
                  تواصل معنا
                </span>
                {/* تأثير الموجة على الزر */}
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600 to-blue-700 opacity-0 transition-opacity duration-700 rounded-full transform scale-0 group-hover:scale-100"></span>
              </Link>
              
              <Link 
                href="/faq" 
                className="group relative inline-flex items-center justify-center overflow-hidden bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 font-bold py-2 sm:py-3 px-5 sm:px-8 rounded-full shadow-lg transition-all duration-700 transform hover:scale-105 animate-bounce text-sm sm:text-base"
                style={{ animationDelay: '0.2s' }}
              >
                <span className="relative z-10 flex items-center">
                  الأسئلة الشائعة
                  <FaArrowRight className="mr-2 sm:mr-3 text-base sm:text-lg transition-transform duration-700 group-hover:translate-x-1" />
                </span>
                {/* تأثير الموجة على الزر */}
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-100 to-blue-200 dark:from-gray-700 dark:to-gray-600 opacity-0 transition-opacity duration-700 rounded-full transform scale-0 group-hover:scale-100"></span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// مكون أيقونات التواصل الاجتماعي المحسن
const SocialMediaSection = () => {
  return (
    <div className="flex justify-center flex-wrap gap-3 sm:gap-4 md:gap-6 mb-12 sm:mb-16">
      {socialLinks.map((social, index) => {
        // تحديد لون كل أيقونة حسب منصتها
        let colorClass = "";
        let hoverColorClass = "";
        
        switch(social.label) {
          case "يوتيوب":
            colorClass = "from-red-500 to-red-600";
            hoverColorClass = "hover:from-red-600 hover:to-red-700";
            break;
          case "انستجرام":
            colorClass = "from-pink-500 to-purple-500";
            hoverColorClass = "hover:from-pink-600 hover:to-purple-600";
            break;
          case "فيس بوك":
            colorClass = "from-blue-500 to-blue-600";
            hoverColorClass = "hover:from-blue-600 hover:to-blue-700";
            break;
          case "تيك توك":
            colorClass = "from-gray-800 to-black";
            hoverColorClass = "hover:from-gray-900 hover:to-black";
            break;
          case "اكس":
            colorClass = "from-gray-700 to-gray-900";
            hoverColorClass = "hover:from-gray-800 hover:to-black";
            break;
          default:
            colorClass = "from-blue-500 to-indigo-600";
            hoverColorClass = "hover:from-blue-600 hover:to-indigo-700";
        }
        
        return (
          <a 
            key={index}
            href={social.href} 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label={social.label} 
            title={social.label}
            className="group relative w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-700 transform hover:scale-105 animate-bounce overflow-hidden"
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            {/* الخلفية المتدرجة */}
            <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} ${hoverColorClass} transition-all duration-700`}></div>
            
            {/* تأثير التوهج */}
            <div className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-100 bg-white/20 blur-md"></div>
            
            {/* تأثير الحركة الدائرية */}
            <div className="absolute inset-0 rounded-full border-2 border-white/30 transition-all duration-700 group-hover:border-white/60 animate-spin-slow"></div>
            
            {/* الأيقونة */}
            <div className="relative z-10 text-white text-base sm:text-lg md:text-xl transition-transform duration-700 group-hover:scale-110">
              {social.icon}
            </div>
            
            {/* تسمية المنصة */}
            <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-700 group-hover:opacity-100 whitespace-nowrap">
              {social.label}
            </div>
            
            {/* تأثير اللمعان - تم تعديل سرعة الأنيميشن */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"></div>
          </a>
        );
      })}
    </div>
  );
};

// مكون المحتوى الرئيسي
function AboutContent() {
  const [members, setMembers] = useState<Member[]>([]);
  const [subscribers, setSubscribers] = useState<number | null>(null);
  const [episodesCount, setEpisodesCount] = useState<number>(0);
  const [playlistsCount, setPlaylistsCount] = useState<number>(0);
  const [seasonsCount, setSeasonsCount] = useState<number>(0);
  const [articlesCount, setArticlesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersData, subscribersData, episodesData, playlistsData, seasonsData, articlesData] = await Promise.all([
          getMembers(),
          getSubscribers(),
          getEpisodesCount(),
          getPlaylistsCount(),
          getSeasonsCount(),
          getArticlesCount(),
        ]);
        
        setMembers(membersData);
        setSubscribers(subscribersData);
        setEpisodesCount(episodesData);
        setPlaylistsCount(playlistsData);
        setSeasonsCount(seasonsData);
        setArticlesCount(articlesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen overflow-x-hidden">
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        {/* الهيرو الجديد */}
        <HeroSection />
        
        {/* Stats - مع تدرجات ملونة */}
        <div className="mb-12 sm:mb-16">
          {/* بطاقة المشتركين المميزة */}
          {subscribers !== null && (
            <YouTubeSubscribersCard subscribers={subscribers} />
          )}
          
          {/* باقي البطاقات - مع تدرجات ملونة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 dark:from-blue-700 dark:to-cyan-800 rounded-xl p-4 sm:p-6 shadow-lg transition-all duration-700 hover:shadow-2xl transform hover:-translate-y-3 w-full max-w-md mx-auto border border-blue-200 dark:border-blue-700 dark:shadow-blue-900/30 hover:dark:shadow-blue-900/50 relative overflow-hidden group origin-center">
              {/* تأثير اللمعان - تم تعديل سرعة الأنيميشن */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-white transition-transform duration-700 group-hover:scale-110">
                  <FaVideo />
                </div>
                <p className="text-base sm:text-lg font-medium text-white/90 mb-2 transition-colors duration-700 group-hover:text-white">عدد الحلقات</p>
                <p className="text-2xl sm:text-3xl font-bold text-white transition-all duration-700 group-hover:text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100">
                  {episodesCount}
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-700 dark:to-emerald-800 rounded-xl p-4 sm:p-6 shadow-lg transition-all duration-700 hover:shadow-2xl transform hover:-translate-y-3 w-full max-w-md mx-auto border border-green-200 dark:border-green-700 dark:shadow-green-900/30 hover:dark:shadow-green-900/50 relative overflow-hidden group origin-center">
              {/* تأثير اللمعان - تم تعديل سرعة الأنيميشن */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-white transition-transform duration-700 group-hover:scale-110">
                  <FaListUl />
                </div>
                <p className="text-base sm:text-lg font-medium text-white/90 mb-2 transition-colors duration-700 group-hover:text-white">عدد قوائم التشغيل</p>
                <p className="text-2xl sm:text-3xl font-bold text-white transition-all duration-700 group-hover:text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-100">
                  {playlistsCount}
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 dark:from-purple-700 dark:to-pink-800 rounded-xl p-4 sm:p-6 shadow-lg transition-all duration-700 hover:shadow-2xl transform hover:-translate-y-3 w-full max-w-md mx-auto border border-purple-200 dark:border-purple-700 dark:shadow-purple-900/30 hover:dark:shadow-purple-900/50 relative overflow-hidden group origin-center">
              {/* تأثير اللمعان - تم تعديل سرعة الأنيميشن */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-white transition-transform duration-700 group-hover:scale-110">
                  <FaCalendarAlt />
                </div>
                <p className="text-base sm:text-lg font-medium text-white/90 mb-2 transition-colors duration-700 group-hover:text-white">عدد المواسم</p>
                <p className="text-2xl sm:text-3xl font-bold text-white transition-all duration-700 group-hover:text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-100">
                  {seasonsCount}
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-400 to-orange-500 dark:from-red-700 dark:to-orange-800 rounded-xl p-4 sm:p-6 shadow-lg transition-all duration-700 hover:shadow-2xl transform hover:-translate-y-3 w-full max-w-md mx-auto border border-red-200 dark:border-red-700 dark:shadow-red-900/30 hover:dark:shadow-red-900/50 relative overflow-hidden group origin-center">
              {/* تأثير اللمعان - تم تعديل سرعة الأنيميشن */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-white transition-transform duration-700 group-hover:scale-110">
                  <FaNewspaper />
                </div>
                <p className="text-base sm:text-lg font-medium text-white/90 mb-2 transition-colors duration-700 group-hover:text-white">عدد المقالات</p>
                <p className="text-2xl sm:text-3xl font-bold text-white transition-all duration-700 group-hover:text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-100">
                  {articlesCount}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Philosophy - مع تدرجات ملونة */}
        <section className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              <span className="relative z-10">منهجنا وفلسفتنا</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-blue-200 dark:bg-blue-900/50 z-0 transform -skew-x-12"></span>
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
              نلتزم بأعلى معايير الجودة والابتكار في تقديم المحتوى التعليمي
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto space-y-6 sm:space-y-10">
            <div className="group">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 p-5 sm:p-7 rounded-2xl shadow-lg transition-all duration-700 hover:shadow-xl transform hover:-translate-y-3 border border-indigo-200 dark:border-indigo-700 relative overflow-hidden dark:shadow-indigo-900/30 hover:dark:shadow-indigo-900/50 origin-center">
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:w-32 bg-gradient-to-br from-indigo-300 to-purple-300 dark:from-indigo-700 dark:to-purple-800 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 animate-pulse-slow group-hover:opacity-70 transition-opacity duration-2000"></div>
                <div className="relative z-10 flex items-start">
                  <div className="group bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 shadow-md animate-bounce">
                    <FaLightbulb className="text-white text-lg sm:text-xl transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 transition-colors duration-700 group-hover:text-indigo-100">التفاني للتعليم</h3>
                    <p className="text-indigo-100 dark:text-indigo-200 text-sm sm:text-base transition-colors duration-700 group-hover:text-white">نحن ملتزمون بتقديم محتوى تعليمي عالي الجودة يساعد المتعلمين على تحقيق أهدافهم وتطوير مهاراتهم بفعالية. نؤمن بأن التعليم هو المفتاح للتطور والتميز.</p>
                  </div>
                </div>
                
                {/* تأثير اللمعان عند التمرير - تم تعديل سرعة الأنيميشن */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
            
            <div className="group">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 dark:from-green-800 dark:to-teal-900 p-5 sm:p-7 rounded-2xl shadow-lg transition-all duration-700 hover:shadow-xl transform hover:-translate-y-3 border border-green-200 dark:border-green-700 relative overflow-hidden dark:shadow-green-900/30 hover:dark:shadow-green-900/50 origin-center" style={{ animationDelay: '0.1s' }}>
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:w-32 bg-gradient-to-br from-green-300 to-teal-300 dark:from-green-700 dark:to-teal-800 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 animate-pulse-slow group-hover:opacity-70 transition-opacity duration-2000"></div>
                <div className="relative z-10 flex items-start">
                  <div className="group bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 shadow-md animate-bounce" style={{ animationDelay: '0.2s' }}>
                    <FaRocket className="text-white text-lg sm:text-xl transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 transition-colors duration-700 group-hover:text-green-100">الابتكار والتطوير</h3>
                    <p className="text-green-100 dark:text-green-200 text-sm sm:text-base transition-colors duration-700 group-hover:text-white">نحرص دائماً على البحث عن طرق جديدة لتحسين تجربة المستخدم وتقديم محتوى مبتكر يتماشى مع التطورات الحديثة في مجال التعليم.</p>
                  </div>
                </div>
                
                {/* تأثير اللمعان عند التمرير - تم تعديل سرعة الأنيميشن */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
            
            <div className="group">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 dark:from-orange-800 dark:to-red-900 p-5 sm:p-7 rounded-2xl shadow-lg transition-all duration-700 hover:shadow-xl transform hover:-translate-y-3 border border-orange-200 dark:border-orange-700 relative overflow-hidden dark:shadow-orange-900/30 hover:dark:shadow-orange-900/50 origin-center" style={{ animationDelay: '0.2s' }}>
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:w-32 bg-gradient-to-br from-orange-300 to-red-300 dark:from-orange-700 dark:to-red-800 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 animate-pulse-slow group-hover:opacity-70 transition-opacity duration-2000"></div>
                <div className="relative z-10 flex items-start">
                  <div className="group bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 shadow-md animate-bounce" style={{ animationDelay: '0.3s' }}>
                    <FaHandshake className="text-white text-lg sm:text-xl transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 transition-colors duration-700 group-hover:text-orange-100">الشفافية والموثوقية</h3>
                    <p className="text-orange-100 dark:text-orange-200 text-sm sm:text-base transition-colors duration-700 group-hover:text-white">نحن ملتزمون بالشفافية في جميع أعمالنا وتقديم معلومات موثوقة ودقيقة يمكن للمستخدمين الاعتماد عليها في رحلتهم التعليمية.</p>
                  </div>
                </div>
                
                {/* تأثير اللمعان عند التمرير - تم تعديل سرعة الأنيميشن */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Vision & Mission - مع تدرجات ملونة */}
        <section className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              <span className="relative z-10">الرؤية والرسالة</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-purple-200 dark:bg-purple-900/50 z-0 transform -skew-x-12"></span>
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">
            <div className="group">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-800 dark:to-indigo-900 p-5 sm:p-7 rounded-2xl shadow-lg transition-all duration-700 hover:shadow-xl transform hover:-translate-y-3 border border-blue-200 dark:border-blue-700 relative overflow-hidden h-full dark:shadow-blue-900/30 hover:dark:shadow-blue-900/50 origin-center">
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:w-32 bg-gradient-to-br from-blue-300 to-indigo-300 dark:from-blue-700 dark:to-indigo-800 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 animate-pulse-slow group-hover:opacity-70 transition-opacity duration-2000"></div>
                <div className="relative z-10">
                  <div className="group bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 sm:mb-4 shadow-md animate-bounce">
                    <FaGem className="text-white text-lg sm:text-xl transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 transition-colors duration-700 group-hover:text-blue-100">الرؤية</h3>
                  <p className="text-blue-100 dark:text-blue-200 text-sm sm:text-base transition-colors duration-700 group-hover:text-white">أن نكون المنصة التعليمية الرائدة في العالم العربي، التي تقدم محتوى مبتكر وعالي الجودة يساهم في تطوير المجتمع وتمكين الأفراد من تحقيق إمكانياتهم الكاملة.</p>
                </div>
                
                {/* تأثير اللمعان عند التمرير - تم تعديل سرعة الأنيميشن */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
            
            <div className="group">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 dark:from-green-800 dark:to-teal-900 p-5 sm:p-7 rounded-2xl shadow-lg transition-all duration-700 hover:shadow-xl transform hover:-translate-y-3 border border-green-200 dark:border-green-700 relative overflow-hidden h-full dark:shadow-green-900/30 hover:dark:shadow-green-900/50 origin-center" style={{ animationDelay: '0.1s' }}>
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:w-32 bg-gradient-to-br from-green-300 to-teal-300 dark:from-green-700 dark:to-teal-800 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 animate-pulse-slow group-hover:opacity-70 transition-opacity duration-2000"></div>
                <div className="relative z-10">
                  <div className="group bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 sm:mb-4 shadow-md animate-bounce" style={{ animationDelay: '0.2s' }}>
                    <FaRocket className="text-white text-lg sm:text-xl transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 transition-colors duration-700 group-hover:text-green-100">الرسالة</h3>
                  <p className="text-green-100 dark:text-green-200 text-sm sm:text-base transition-colors duration-700 group-hover:text-white">توفير محتوى معرفي حديث وعملي يساعد على تطوير مهارات الأفراد وتمكينهم من تحقيق أهدافهم التعليمية والمهنية من خلال تجربة تعليمية شاملة وممتعة.</p>
                </div>
                
                {/* تأثير اللمعان عند التمرير - تم تعديل سرعة الأنيميشن */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Core Values - مع تدرجات ملونة */}
        <section className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              <span className="relative z-10">قيمنا الأساسية</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-pink-200 dark:bg-pink-900/50 z-0 transform -skew-x-12"></span>
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-pink-500 to-red-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-7 max-w-5xl mx-auto">
            <div className="group">
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 dark:from-pink-800 dark:to-rose-900 p-5 sm:p-7 rounded-2xl shadow-lg transition-all duration-700 hover:shadow-xl transform hover:-translate-y-3 border border-pink-200 dark:border-pink-700 relative overflow-hidden h-full dark:shadow-pink-900/30 hover:dark:shadow-pink-900/50 origin-center">
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:w-32 bg-gradient-to-br from-pink-300 to-rose-300 dark:from-pink-700 dark:to-rose-800 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 animate-pulse-slow group-hover:opacity-70 transition-opacity duration-2000"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="group bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-full mb-3 sm:mb-4 shadow-md animate-bounce">
                    <FaHandshake className="text-white text-xl sm:text-2xl transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 transition-colors duration-700 group-hover:text-pink-100">التعاون</h3>
                  <p className="text-pink-100 dark:text-pink-200 text-sm sm:text-base transition-colors duration-700 group-hover:text-white">نعمل بروح الفريق الواحد لتحقيق نتائج أفضل وتقديم حلول مبتكرة تلبي احتياجات المستخدمين وتساهم في نجاحهم.</p>
                  <div className="mt-auto mt-4 sm:mt-6">
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold animate-pulse transition-colors duration-700 group-hover:bg-white/30">
                      <FaCheck className="mr-1" />
                      <span>قيمة أساسية</span>
                    </div>
                  </div>
                </div>
                
                {/* تأثير اللمعان عند التمرير - تم تعديل سرعة الأنيميشن */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
            
            <div className="group">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-800 dark:to-indigo-900 p-5 sm:p-7 rounded-2xl shadow-lg transition-all duration-700 hover:shadow-xl transform hover:-translate-y-3 border border-blue-200 dark:border-blue-700 relative overflow-hidden h-full dark:shadow-blue-900/30 hover:dark:shadow-blue-900/50 origin-center" style={{ animationDelay: '0.1s' }}>
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:w-32 bg-gradient-to-br from-blue-300 to-indigo-300 dark:from-blue-700 dark:to-indigo-800 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 animate-pulse-slow group-hover:opacity-70 transition-opacity duration-2000"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="group bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-full mb-3 sm:mb-4 shadow-md animate-bounce" style={{ animationDelay: '0.2s' }}>
                    <FaLightbulb className="text-white text-xl sm:text-2xl transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 transition-colors duration-700 group-hover:text-blue-100">الإبداع</h3>
                  <p className="text-blue-100 dark:text-blue-200 text-sm sm:text-base transition-colors duration-700 group-hover:text-white">نفكر دائماً خارج الصندوق لنبتكر حلول جديدة ومبتكرة تساهم في تطوير التعليم وتجعل عملية التعلم أكثر متعة وفائدة.</p>
                  <div className="mt-auto mt-4 sm:mt-6">
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold animate-pulse transition-colors duration-700 group-hover:bg-white/30">
                      <FaCheck className="mr-1" />
                      <span>قيمة أساسية</span>
                    </div>
                  </div>
                </div>
                
                {/* تأثير اللمعان عند التمرير - تم تعديل سرعة الأنيميشن */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
            
            <div className="group">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-800 dark:to-emerald-900 p-5 sm:p-7 rounded-2xl shadow-lg transition-all duration-700 hover:shadow-xl transform hover:-translate-y-3 border border-green-200 dark:border-green-700 relative overflow-hidden h-full dark:shadow-green-900/30 hover:dark:shadow-green-900/50 origin-center" style={{ animationDelay: '0.2s' }}>
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:w-32 bg-gradient-to-br from-green-300 to-emerald-300 dark:from-green-700 dark:to-emerald-800 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 animate-pulse-slow group-hover:opacity-70 transition-opacity duration-2000"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="group bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-full mb-3 sm:mb-4 shadow-md animate-bounce" style={{ animationDelay: '0.3s' }}>
                    <FaGem className="text-white text-xl sm:text-2xl transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 transition-colors duration-700 group-hover:text-green-100">التميز</h3>
                  <p className="text-green-100 dark:text-green-200 text-sm sm:text-base transition-colors duration-700 group-hover:text-white">نسعى لتحقيق الجودة في كل ما نقدمه ونلتزم بأعلى معايير الأداء والمهنية لتقديم أفضل تجربة تعليمية لمستخدمينا.</p>
                  <div className="mt-auto mt-4 sm:mt-6">
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold animate-pulse transition-colors duration-700 group-hover:bg-white/30">
                      <FaCheck className="mr-1" />
                      <span>قيمة أساسية</span>
                    </div>
                  </div>
                </div>
                
                {/* تأثير اللمعان عند التمرير - تم تعديل سرعة الأنيميشن */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Team - المحسن بشكل كبير */}
        <section className="mt-12 mb-12 sm:mt-16 sm:mb-16 relative overflow-hidden rounded-3xl">
          {/* خلفية مميزة لقسم الفريق */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-900"></div>
          
          {/* عناصر زخرفية */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 bg-indigo-500 rounded-full filter blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-56 h-56 sm:w-72 sm:h-72 bg-purple-500 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-1/3 right-1/3 w-40 h-40 sm:w-56 sm:h-56 bg-pink-500 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '0.2s' }}></div>
            
            {/* أيقونات الفريق في الخلفية */}
            <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
              <FaUsers className="text-7xl sm:text-9xl drop-shadow-lg" />
            </div>
            <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
              <FaMedal className="text-7xl sm:text-9xl drop-shadow-lg" />
            </div>
            <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
              <FaLightbulb className="text-7xl sm:text-9xl drop-shadow-lg" />
            </div>
            <div className="absolute bottom-1/3 right-1/3 text-white/10 transform translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '3s' }}>
              <FaHeart className="text-7xl sm:text-9xl drop-shadow-lg" />
            </div>
          </div>
          
          {/* شبكة زخرفية */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMzAgMzBtLTIwIDIwTDUwIDEwTTMwIDNwbTIwIDIwTDEwIDEwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgb3BhY2l0eT0iMC4xIi8+Cjwvc3ZnPg==')] opacity-10"></div>
          
          <div className="relative z-10 py-10 sm:py-14 md:py-18">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-block bg-white/10 backdrop-blur-sm px-4 sm:px-6 py-2 rounded-full mb-4 sm:mb-6 border border-white/20">
                <span className="text-white font-medium flex items-center text-sm sm:text-base">
                  <FaStar className="text-yellow-300 mr-2 animate-pulse" />
                  فريقنا المميز
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                تعرف على <span className="text-yellow-300">أبطال</span> فذلكة
              </h2>
              
              <p className="text-base sm:text-lg text-indigo-200 max-w-2xl mx-auto mb-6 sm:mb-10">
                يضم فريقنا مجموعة من المتخصصين الموهوبين الذين يعملون بجد لتحقيق رؤيتنا وتقديم أفضل تجربة تعليمية لكم.
              </p>
              
              <div className="w-20 sm:w-28 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto rounded-full animate-pulse"></div>
            </div>
            
            <div className="text-center mb-6 sm:mb-10">
              <Link 
                href="/team" 
                className="inline-flex items-center bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-2 sm:py-3 px-5 sm:px-7 rounded-full shadow-lg transition-all duration-700 transform hover:scale-105 animate-bounce text-sm sm:text-base"
              >
                <span>عرض جميع أعضاء الفريق</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
            
            {members.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 max-w-6xl mx-auto px-2 sm:px-4">
                {members.map((member, idx) => (
                  <div key={member._id} className="w-full sm:w-80 md:w-96" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <MemberCard member={member} index={idx} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-10 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-2xl mx-auto animate-pulse">
                <p className="text-white/80 italic text-sm sm:text-base">لا توجد بيانات عن أعضاء الفريق حالياً</p>
                <p className="text-white/60 mt-2 text-xs sm:text-sm">سيتم تحديث هذا القسم قريباً</p>
              </div>
            )}
          </div>
          
          {/* تأثيرات حركية */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
        </section>
        
        {/* Contact and Social - المحسن */}
        <ContactSection />
        <SocialMediaSection />
      </div>
      
      {/* إضافة الأنماط العامة للصفحة */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes progress {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 0%; }
        }
        .animate-progress {
          background-size: 200% 100%;
          animation: progress 2s linear infinite;
        }
        @keyframes float-animation {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .float-animation {
          animation: float-animation 6s ease-in-out infinite;
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

// مكون الصفحة الرئيسي مع Suspense
const AboutPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>}>
      <AboutContent />
    </Suspense>
  );
};

export default AboutPage;