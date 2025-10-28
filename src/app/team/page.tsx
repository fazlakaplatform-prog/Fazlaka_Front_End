// team/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaEnvelope, FaUsers, FaMedal, FaLightbulb, FaHeart,
  FaFlask, FaLandmark, FaChartLine, FaBalanceScale, FaBook, FaAtom
} from 'react-icons/fa';
import { urlFor, fetchTeamMembers, getLocalizedText } from '@/lib/sanity';

// Import the base TeamMember type from sanity
import { TeamMember as SanityTeamMember } from '@/lib/sanity';

// Extend the TeamMember type to include additional properties
interface TeamMember extends SanityTeamMember {
  skills?: string[];
  skillsEn?: string[];
}

// جلب بيانات أعضاء الفريق حسب اللغة
async function getTeamMembersData(language: string = 'ar'): Promise<TeamMember[]> {
  try {
    console.log("Fetching team members with language:", language);
    const members = await fetchTeamMembers(language);
    console.log("Fetched team members:", members);
    return members || [];
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

// مكون بطاقة عضو الفريق
interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
  isRTL: boolean;
}

const TeamMemberCard = ({ member, index, isRTL }: TeamMemberCardProps) => {
  const imageUrl = member.imageUrl || "/placeholder.png";
  
  const name = getLocalizedText(member.name, member.nameEn, isRTL ? 'ar' : 'en');
  const role = getLocalizedText(member.role, member.roleEn, isRTL ? 'ar' : 'en');
  
  // تحديد المهارات حسب اللغة
  const skills = isRTL && member.skills ? member.skills : 
                !isRTL && member.skillsEn ? member.skillsEn : 
                member.skills || [];
  
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
                  alt={name}
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
            {name}
          </h3>
          
          {role && (
            <p className="text-gray-700 dark:text-gray-300 text-base px-6 py-2 bg-gradient-to-r from-gray-100 to-blue-100 dark:from-gray-700 dark:to-blue-900/50 rounded-full inline-block transition-all duration-1000 group-hover:bg-gradient-to-r group-hover:from-purple-100 group-hover:to-blue-100 dark:group-hover:from-purple-900/50 dark:group-hover:to-blue-900/50 shadow-md shadow-blue-500/20 dark:shadow-blue-500/10">
              {role}
            </p>
          )}
        </div>
        
        {/* المهارات */}
        {skills && skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {skills.slice(0, 3).map((skill, idx) => (
              <span 
                key={idx} 
                className="text-sm px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-800 dark:text-blue-200 rounded-full transition-all duration-1000 group-hover:bg-gradient-to-r group-hover:from-blue-200 group-hover:to-indigo-200 dark:group-hover:from-blue-800 dark:group-hover:to-indigo-800 shadow-md shadow-blue-500/20 dark:shadow-blue-500/10"
              >
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-sm px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 rounded-full shadow-md shadow-gray-500/20 dark:shadow-gray-500/10">
                +{skills.length - 3}
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
              {isRTL ? 'عرض الملف الشخصي' : 'View Profile'}
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

// مكون قسم القيم
interface ValuesSectionProps {
  isRTL: boolean;
}

const ValuesSection = ({ isRTL }: ValuesSectionProps) => {
  const translations = {
    ar: {
      title: "قيمنا الأساسية",
      cooperation: "التعاون",
      cooperationDesc: "نؤمن بقوة العمل الجماعي ونسعى لتحقيق أهدافنا من خلال التعاون المستمر ودعم بعضنا البعض.",
      innovation: "الابتكار",
      innovationDesc: "نسعى دائماً لتقديم حلول مبتكرة وإبداعية تلبي احتياجات عملائنا وتساهم في نجاحهم.",
      excellence: "التميز",
      excellenceDesc: "نلتزم بأعلى معايير الجودة في كل ما نقومه ونسعى لتحقيق التميز في جميع جوانب عملنا."
    },
    en: {
      title: "Our Core Values",
      cooperation: "Cooperation",
      cooperationDesc: "We believe in the power of teamwork and strive to achieve our goals through continuous cooperation and mutual support.",
      innovation: "Innovation",
      innovationDesc: "We always strive to provide innovative and creative solutions that meet our clients' needs and contribute to their success.",
      excellence: "Excellence",
      excellenceDesc: "We are committed to the highest standards of quality in everything we do and strive for excellence in all aspects of our work."
    }
  };
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
  return (
    <div className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">{t.title}</h2>
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center transition-colors duration-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 drop-shadow-md">{t.cooperation}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center transition-all duration-700 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              {t.cooperationDesc}
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center transition-colors duration-700 group-hover:text-purple-600 dark:group-hover:text-purple-400 drop-shadow-md">{t.innovation}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center transition-all duration-700 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              {t.innovationDesc}
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center transition-colors duration-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 drop-shadow-md">{t.excellence}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center transition-all duration-700 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              {t.excellenceDesc}
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
interface HeroSectionProps {
  isRTL: boolean;
}

const HeroSection = ({ isRTL }: HeroSectionProps) => {
  const translations = {
    ar: {
      badge: "فريق العمل",
      title: "تعرف على <span class='text-yellow-300'>ابطال</span> فذلكة",
      subtitle: "نفتخر بفريقنا من المحترفين الموهوبين الذين يعملون بجد لتحقيق رؤيتنا وتقديم أفضل تجربة لعملائنا.",
      experience: "خبرة عالية",
      innovation: "إبداع وابتكار",
      passion: "شغف بالعمل"
    },
    en: {
      badge: "Team",
      title: "Meet Our <span class='text-yellow-300'>Heroes</span>",
      subtitle: "We are proud of our team of talented professionals who work hard to achieve our vision and provide the best experience for our clients.",
      experience: "High Expertise",
      innovation: "Creativity & Innovation",
      passion: "Passion for Work"
    }
  };
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
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
            {t.badge}
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg" dangerouslySetInnerHTML={{ __html: t.title }}></h1>
        
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto drop-shadow-md">
          {t.subtitle}
        </p>
        
        <div className="flex justify-center gap-4 flex-wrap">
          <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
            <FaMedal className="text-yellow-300 mr-2" />
            <span className="text-white">{t.experience}</span>
          </div>
          <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
            <FaLightbulb className="text-yellow-300 mr-2" />
            <span className="text-white">{t.innovation}</span>
          </div>
          <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
            <FaHeart className="text-yellow-300 mr-2" />
            <span className="text-white">{t.passion}</span>
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
interface ContactSectionProps {
  isRTL: boolean;
}

const ContactSection = ({ isRTL }: ContactSectionProps) => {
  const translations = {
    ar: {
      badge: "تواصل معنا",
      title: "نحن هنا <span class='text-yellow-300'>للمساعدة</span>",
      subtitle: "إذا كان لديك أي استفسار أو ترغب في التواصل مع أحد أعضاء فريقنا، فلا تتردد في الاتصال بنا.",
      contactUs: "تواصل معنا",
      faq: "الأسئلة الشائعة"
    },
    en: {
      badge: "Contact Us",
      title: "We Are Here <span class='text-yellow-300'>To Help</span>",
      subtitle: "If you have any inquiries or would like to contact one of our team members, do not hesitate to contact us.",
      contactUs: "Contact Us",
      faq: "FAQ"
    }
  };
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
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
            {t.badge}
          </span>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight drop-shadow-lg" dangerouslySetInnerHTML={{ __html: t.title }}></h2>
        
        <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto drop-shadow-md">
          {t.subtitle}
        </p>
        
        <div className="flex justify-center gap-6 flex-wrap">
          <Link 
            href="/contact" 
            className="group relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 px-8 rounded-full transition-all duration-1000 transform hover:scale-105 shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/40 dark:hover:shadow-yellow-500/30"
          >
            <span className="relative z-10 flex items-center">
              <FaEnvelope className="ml-3 text-xl" />
              {t.contactUs}
            </span>
            
            {/* تأثير الموجة على الزر */}
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-500 to-orange-600 opacity-0 transition-opacity duration-1000 rounded-full transform scale-0 group-hover:scale-100"></span>
          </Link>
          
          <Link 
            href="/faq" 
            className="group relative inline-flex items-center justify-center overflow-hidden bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold py-4 px-8 rounded-full transition-all duration-1000 transform hover:scale-105 hover:bg-white/30 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 dark:hover:shadow-indigo-500/30"
          >
            <span className="relative z-10 flex items-center">
              {t.faq}
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
interface TeamSectionProps {
  members: TeamMember[];
  isRTL: boolean;
}

const TeamSection = ({ members, isRTL }: TeamSectionProps) => {
  const translations = {
    ar: {
      badge: "فريق العمل",
      title: "أعضاء فريقنا",
      subtitle: "تعرف على الأعضاء الموهوبين الذين يشكلون قوة دفع لنجاحنا",
      noTeamData: "لا توجد بيانات عن أعضاء الفريق حالياً",
      noTeamDataDesc: "سيتم تحديث هذا القسم قريباً"
    },
    en: {
      badge: "Team",
      title: "Our Team Members",
      subtitle: "Meet the talented members who form the driving force for our success",
      noTeamData: "No team member data available at the moment",
      noTeamDataDesc: "This section will be updated soon"
    }
  };
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
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
              {t.badge}
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            {t.title}
          </h2>
          
          <p className="text-xl text-blue-100 max-w-2xl mx-auto drop-shadow-md">
            {t.subtitle}
          </p>
        </div>
        
        {/* أعضاء الفريق */}
        {members.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-8">
            {members.map((member, index) => (
              <div key={member._id || index} className="w-full md:w-auto max-w-md">
                <TeamMemberCard member={member} index={index} isRTL={isRTL} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
            <p className="text-white/80 italic">{t.noTeamData}</p>
            <p className="text-white/60 mt-2 text-sm">{t.noTeamDataDesc}</p>
          </div>
        )}
      </div>
      
      {/* تأثيرات حركية */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20"></div>
    </div>
  );
};

// مكون المحتوى الرئيسي
function TeamContent() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(true);
  const [language, setLanguage] = useState('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // التحقق من تفضيل اللغة المحفوظ في localStorage
    const savedLanguage = localStorage.getItem('language');
    let detectedLanguage = 'ar'; // default to Arabic
    
    if (savedLanguage !== null) {
      detectedLanguage = savedLanguage;
    } else {
      // إذا لم يكن هناك تفضيل محفوظ، استخدم لغة المتصفح
      const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || '';
      detectedLanguage = browserLang.includes('ar') ? 'ar' : 'en';
    }
    
    setLanguage(detectedLanguage);
    setIsRTL(detectedLanguage === 'ar');
    
    // تطبيق اتجاه الصفحة بناءً على اللغة
    document.documentElement.dir = detectedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = detectedLanguage;
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching team members for language:", language);
        
        // جرب أولاً باللغة المحددة
        let membersData = await getTeamMembersData(language);
        
        // إذا لم يتم العثور على بيانات باللغة المحددة وكانت اللغة الإنجليزية، جرب بالعربية
        if (membersData.length === 0 && language === 'en') {
          console.log("No English team members found, trying Arabic");
          membersData = await getTeamMembersData('ar');
        }
        // إذا لم يتم العثور على بيانات باللغة المحددة وكانت اللغة العربية، جرب بالإنجليزية
        else if (membersData.length === 0 && language === 'ar') {
          console.log("No Arabic team members found, trying English");
          membersData = await getTeamMembersData('en');
        }
        
        console.log("Team members data:", membersData);
        setMembers(membersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language, mounted]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        {/* الهيرو */}
        <HeroSection isRTL={isRTL} />
        
        {/* قيم الفريق */}
        <ValuesSection isRTL={isRTL} />
        
        {/* قسم الفريق مع الكروت */}
        <TeamSection members={members} isRTL={isRTL} />
        
        {/* قسم التواصل */}
        <ContactSection isRTL={isRTL} />
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
        @keyframes float-animation {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .float-animation {
          animation: float-animation 6s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes border-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-border-rotate {
          animation: border-rotate 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

// مكون الصفحة الرئيسي مع Suspense
const TeamPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>}>
      <TeamContent />
    </Suspense>
  );
};

export default TeamPage;