"use client";
import { motion } from "framer-motion";
import { 
  Facebook, Instagram, Youtube, Mail, ChevronRight, Play, List, Calendar, Users, MessageSquare, 
  FileText, Shield, BookOpen, Star, Zap, Share2
} from "lucide-react";
import { FaTiktok, FaXTwitter } from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

// كائن الترجمات - نفس المستخدم في الناف بار
const translations = {
  ar: {
    followUs: "تابعنا على منصات التواصل",
    content: "المحتوى",
    episodes: "الحلقات",
    playlists: "قوائم التشغيل",
    seasons: "المواسم",
    articles: "المقالات",
    aboutUs: "تعرف علينا",
    whoWeAre: "من نحن",
    team: "الفريق",
    contact: "التواصل",
    contactUs: "تواصل معنا",
    faq: "الأسئلة الشائعة",
    policies: "السياسات",
    privacyPolicy: "سياسة الخصوصية",
    termsConditions: "الشروط والأحكام",
    backToHome: "العودة إلى الصفحة الرئيسية",
    copyright: "جميع الحقوق محفوظة.",
    scienceMeaning: "العلم معنى",
    fun: "ممتع",
    organized: "منظم",
    easy: "سهل",
    platformDescription: "منصة تعليمية حديثة لعرض العلوم بشكل",
    toDevelopSkills: "لتطوير مهاراتك.",
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    twitter: "Twitter"
  },
  en: {
    followUs: "Follow us on social media",
    content: "Content",
    episodes: "Episodes",
    playlists: "Playlists",
    seasons: "Seasons",
    articles: "Articles",
    aboutUs: "About Us",
    whoWeAre: "Who We Are",
    team: "Team",
    contact: "Contact",
    contactUs: "Contact Us",
    faq: "FAQ",
    policies: "Policies",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    backToHome: "Back to Home",
    copyright: "All rights reserved.",
    scienceMeaning: "Science with meaning",
    fun: "fun",
    organized: "organized",
    easy: "easy",
    platformDescription: "A modern educational platform for presenting science in a",
    toDevelopSkills: "way to develop your skills.",
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    twitter: "Twitter"
  }
};

export default function Footer() {
  const year = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);
  const [isRTL, setIsRTL] = useState(true); // القيمة الافتراضية هي العربية (RTL)
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // التحقق من حجم الشاشة
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // التحقق من تفضيل اللغة المحفوظ في localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
      setIsRTL(savedLanguage === 'ar');
    } else {
      // إذا لم يكن هناك تفضيل محفوظ، استخدم لغة المتصفح
      const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
      setIsRTL(browserLang.includes('ar'));
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
  // تحديد الشعار بناءً على اللغة
  const logoSrc = isRTL ? "/logo.png" : "/logoE.png";
  const logoAlt = isRTL ? "فذلكة" : "fazlaka";
  
  // روابط السوشيال ميديا
  const socialLinks = [
    {
      href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA",
      icon: <Youtube className="w-5 h-5" />,
      label: t.youtube,
      color: "hover:bg-red-500/20 hover:text-red-400",
    },
    {
      href: "https://www.instagram.com/fazlaka_platform/",
      icon: <Instagram className="w-5 h-5" />,
      label: t.instagram,
      color: "hover:bg-pink-500/20 hover:text-pink-400",
    },
    {
      href: "https://www.facebook.com/profile.php?id=61579582675453",
      icon: <Facebook className="w-5 h-5" />,
      label: t.facebook,
      color: "hover:bg-blue-500/20 hover:text-blue-400",
    },
    {
      href: "https://www.tiktok.com/@fazlaka_platform",
      icon: <FaTiktok className="w-5 h-5" />,
      label: t.tiktok,
      color: "hover:bg-gray-500/20 hover:text-gray-300",
    },
    {
      href: "https://x.com/FazlakaPlatform",
      icon: <FaXTwitter className="w-5 h-5" />,
      label: t.twitter,
      color: "hover:bg-blue-400/20 hover:text-blue-300",
    },
  ];
  
  // روابط المحتوى
  const contentLinks = [
    { href: "/episodes", text: t.episodes, icon: <Play className="w-4 h-4" /> },
    { href: "/playlists", text: t.playlists, icon: <List className="w-4 h-4" /> },
    { href: "/seasons", text: t.seasons, icon: <Calendar className="w-4 h-4" /> },
    { href: "/articles", text: t.articles, icon: <FileText className="w-4 h-4" /> },
  ];
  
  // روابط من نحن
  const aboutLinks = [
    { href: "/about", text: t.whoWeAre, icon: <BookOpen className="w-4 h-4" /> },
    { href: "/team", text: t.team, icon: <Users className="w-4 h-4" /> },
  ];
  
  // روابط التواصل
  const contactLinks = [
    { href: "/contact", text: t.contactUs, icon: <Mail className="w-4 h-4" /> },
    { href: "/faq", text: t.faq, icon: <MessageSquare className="w-4 h-4" /> },
  ];
  
  // روابط السياسات
  const policyLinks = [
    { href: "/privacy-policy", text: t.privacyPolicy, icon: <Shield className="w-4 h-4" /> },
    { href: "/terms-conditions", text: t.termsConditions, icon: <FileText className="w-4 h-4" /> },
  ];
  
  const handleLogoClick = () => {
    // إضافة انيميشن جميل عند النقر
    const logo = document.getElementById('footer-logo');
    if (logo) {
      logo.classList.add('scale-95');
      setTimeout(() => {
        logo.classList.remove('scale-95');
        
        // التمرير السلس إلى بداية الصفحة
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        
        // إضافة تأثير بصري جميل أثناء التمرير (فقط على سطح المكتب)
        if (!isMobile) {
          document.body.style.transition = 'all 0.5s ease';
          document.body.style.transform = 'scale(1.01)';
          
          setTimeout(() => {
            document.body.style.transform = 'scale(1)';
          }, 300);
        }
      }, 200);
    } else {
      // إذا لم يتم العثور على الشعار، قم بالتمرير مباشرة
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  
  // دالة مساعدة لتقريب القيم لتجنب مشاكل الـ hydration
  const roundPosition = (value: number) => {
    return Math.round(value * 1000) / 1000;
  };
  
  if (!mounted) return null;
  
  // تقليل عدد النجوم المتلألئة على الموبايل
  const starCount = isMobile ? 6 : 12;
  
  return (
    <>
      {/* فاصل علوي متحرك */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </div>
      
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0f172a] text-gray-200 pt-16 pb-12 relative overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* خلفية متحركة - مبسطة على الموبايل */}
        <div className="absolute inset-0 overflow-hidden">
          {!isMobile && <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>}
          
          {/* تقليل عدد الدوائر المتحركة على الموبايل */}
          {!isMobile && (
            <>
              <motion.div 
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
                animate={{ 
                  x: [0, 30, 0],
                  y: [0, -30, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 15, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              <motion.div 
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
                animate={{ 
                  x: [0, -30, 0],
                  y: [0, 30, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 18, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }
              }
            />
            <motion.div 
              className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ 
                duration: 12, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </>
        )}
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* قسم الشعار والوصف الجديد - تم تحسينه */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-col items-center mb-16"
          >
            {/* خلفية متوهجة للشعار - مبسطة على الموبايل */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="relative mb-20"
            >
              {/* دوائر متوهجة متعددة - فقط على سطح المكتب */}
              {!isMobile && (
                <>
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-30 blur-3xl"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                  
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-2xl"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                  
                  {/* دائرة خارجية متحركة */}
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-dashed border-white/20"
                    animate={{ 
                      rotate: 360,
                    }}
                    transition={{ 
                      duration: 20, 
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </>
              )}
              
              {/* حاوية الشعار المحسنة مع رابط */}
              <motion.div
                id="footer-logo"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
                className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-md p-10 rounded-full border-2 border-white/20 shadow-2xl z-10 cursor-pointer block transition-all duration-300"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogoClick}
              >
                <Image
                  src={logoSrc}
                  alt={logoAlt}
                  width={isMobile ? 120 : 160}
                  height={isMobile ? 120 : 160}
                  className="object-contain drop-shadow-2xl transition-all duration-300"
                  priority
                  style={{ 
                    backgroundColor: 'transparent',
                    filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.6))'
                  }}
                />
                
                {/* نجوم صغيرة متلألئة - تقليل العدد على الموبايل */}
                {[...Array(starCount)].map((_, i) => {
                  // حساب المواقع وتقريبها لتجنب مشاكل الـ hydration
                  const top = roundPosition(50 + 40 * Math.cos(i * Math.PI / (starCount/2)));
                  const left = roundPosition(50 + 40 * Math.sin(i * Math.PI / (starCount/2)));
                  
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-yellow-300"
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                      }}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  );
                })}
              </motion.div>
            </motion.div>
            
            {/* شعار النص مع تأثيرات محسنة */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mb-10 relative"
            >
              {/* خلفية متوهجة للنص - فقط على سطح المكتب */}
              {!isMobile && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl -z-10"
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [0.95, 1.05, 0.95]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
              )}
              
              <motion.h2 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.8, type: "spring", stiffness: 100 }}
                className={`${isMobile ? 'text-4xl md:text-5xl' : 'text-6xl md:text-7xl'} font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 tracking-tight cursor-pointer transition-all duration-300`}
                whileHover={{ 
                  scale: 1.01,
                }}
                onClick={handleLogoClick}
              >
                {isRTL ? 'فذلكه' : 'fazlaka'}
              </motion.h2>
              
              {/* خط فاصل متحرك */}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-4"
              />
              
              {/* تأثيرات لامعة حول النص - فقط على سطح المكتب */}
              {!isMobile && (
                <>
                  <motion.div 
                    className="absolute -top-6 -left-6 w-10 h-10 rounded-full bg-yellow-400/20 blur-lg"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.7, 0.3]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                  <motion.div 
                    className="absolute -bottom-6 -right-6 w-10 h-10 rounded-full bg-blue-400/20 blur-lg"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.7, 0.3]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 1.5
                    }}
                  />
                  
                  {/* زخارف جانبية */}
                  <motion.div 
                    className={`absolute top-1/2 ${isRTL ? '-right-12' : '-left-12'} w-8 h-1 bg-gradient-to-r ${isRTL ? 'from-transparent to-blue-400' : 'from-blue-400 to-transparent'}`}
                    animate={{ 
                      opacity: [0.3, 0.8, 0.3],
                      scaleX: [0.8, 1.2, 0.8]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                  <motion.div 
                    className={`absolute top-1/2 ${isRTL ? '-left-12' : '-right-12'} w-8 h-1 bg-gradient-to-l ${isRTL ? 'from-transparent to-purple-400' : 'from-purple-400 to-transparent'}`}
                    animate={{ 
                      opacity: [0.3, 0.8, 0.3],
                      scaleX: [0.8, 1.2, 0.8]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 1.5
                    }}
                  />
                </>
              )}
            </motion.div>
            
            {/* العبارة التوضيحية المحسنة */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="mb-12 relative"
            >
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.8 }}
                className={`${isMobile ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'} text-center font-light text-gray-300 mb-6 max-w-3xl leading-relaxed cursor-pointer transition-all duration-300`}
                whileHover={{ 
                  color: "#e2e8f0",
                }}
                onClick={handleLogoClick}
              >
                {t.scienceMeaning} 
                <motion.span 
                  className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 mx-3 font-medium cursor-pointer transition-all duration-300"
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  whileHover={{ 
                    scale: 1.05,
                  }}
                >
                  {t.fun}
                </motion.span>
              </motion.p>
              
              {/* تأثيرات لامعة حول العبارة - فقط على سطح المكتب */}
              {!isMobile && (
                <>
                  <motion.div 
                    className="absolute top-0 left-1/4 w-6 h-6 rounded-full bg-yellow-400/30 blur-md"
                    animate={{ 
                      x: [0, 30, 0],
                      y: [0, -15, 0],
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                  <motion.div 
                    className="absolute bottom-0 right-1/4 w-6 h-6 rounded-full bg-purple-400/30 blur-md"
                    animate={{ 
                      x: [0, -30, 0],
                      y: [0, 15, 0],
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 2
                    }}
                  />
                </>
              )}
              
              {/* خط زخرفي تحت العبارة */}
              <motion.div 
                className="flex justify-center items-center mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.8 }}
              >
                <motion.div 
                  className="w-16 h-px bg-gradient-to-r from-transparent to-gray-500"
                  initial={{ width: 0 }}
                  animate={{ width: "4rem" }}
                  transition={{ delay: 2, duration: 0.8 }}
                />
                <motion.div 
                  className="w-2 h-2 rounded-full bg-gray-500 mx-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 2.2, duration: 0.5 }}
                />
                <motion.div 
                  className="w-16 h-px bg-gradient-to-l from-transparent to-gray-500"
                  initial={{ width: 0 }}
                  animate={{ width: "4rem" }}
                  transition={{ delay: 2, duration: 0.8 }}
                />
              </motion.div>
            </motion.div>
            
            {/* وصف المنصة المحسن */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.8 }}
              className="max-w-3xl"
            >
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2, duration: 0.8 }}
                className={`${isMobile ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'} text-center text-gray-400 leading-relaxed font-light cursor-pointer transition-all duration-300`}
                whileHover={{ 
                  color: "#cbd5e1",
                }}
                onClick={handleLogoClick}
              >
                {t.platformDescription} 
                <motion.span 
                  className="text-blue-400 font-medium mx-2 cursor-pointer transition-all duration-300"
                  animate={{ 
                    color: ["#93c5fd", "#c084fc", "#f472b6", "#93c5fd"],
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  whileHover={{ 
                    scale: 1.02,
                  }}
                >
                  {t.fun}
                </motion.span>
                , 
                <motion.span 
                  className="text-purple-400 font-medium mx-2 cursor-pointer transition-all duration-300"
                  animate={{ 
                    color: ["#d8b4fe", "#93c5fd", "#f9a8d4", "#d8b4fe"],
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 2
                  }}
                  whileHover={{ 
                    scale: 1.02,
                  }}
                >
                  {t.organized}
                </motion.span>
                , {isRTL ? 'و' : 'and'} 
                <motion.span 
                  className="text-pink-400 font-medium mx-2 cursor-pointer transition-all duration-300"
                  animate={{ 
                    color: ["#f9a8d4", "#d8b4fe", "#93c5fd", "#f9a8d4"],
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 4
                  }}
                  whileHover={{ 
                    scale: 1.02,
                  }}
                >
                  {t.easy}
                </motion.span>
                {t.toDevelopSkills}
              </motion.p>
            </motion.div>
          </motion.div>
          
          {/* قسم وسائل التواصل الاجتماعي الجديد - مع تحسين الهوفر */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.8 }}
            className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/30 shadow-xl mb-16"
          >
            <motion.div 
              className="flex items-center justify-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 0.5 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-4">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">{t.followUs}</h3>
            </motion.div>
            
            <motion.div 
              className="flex flex-wrap justify-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.8 }}
            >
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 3 + index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ 
                    y: -5, 
                    scale: 1.05,
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center justify-center ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} rounded-2xl bg-gray-800/60 backdrop-blur-sm transition-all duration-300 ${social.color} border border-gray-700/50 group overflow-hidden shadow-lg relative`}
                  aria-label={social.label}
                >
                  {/* تأثير التوهج عند الهوفر - مبسط على الموبايل */}
                  {!isMobile && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/30 transition-all duration-300"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl"></div>
                    </>
                  )}
                  
                  {/* الأيقونة مع تأثير اللمعان */}
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} mb-2 transition-all duration-300 group-hover:scale-110 z-10`}>
                    {social.icon}
                  </div>
                  
                  {/* النص مع تأثير اللمعان - إخفاء على الموبايل */}
                  {!isMobile && (
                    <span className="text-sm font-medium transition-all duration-300 group-hover:text-white z-10">{social.label}</span>
                  )}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
          
          {/* الأقسام الرئيسية - تصميم شبكي جديد مع تحسين الهوفر */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.2, duration: 0.8 }}
            className={`${isMobile ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'} mb-16`}
          >
            {/* قسم المحتوى */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.4, duration: 0.6 }}
              className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl"
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.6, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mr-3">
                  <Play className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{t.content}</h3>
              </motion.div>
              <ul className="space-y-3">
                {contentLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 3.8 + index * 0.1, duration: 0.5 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group p-3 rounded-xl hover:bg-gray-700/30 relative overflow-hidden"
                    >
                      {/* تأثير التوهج الخلفي - فقط على سطح المكتب */}
                      {!isMobile && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-blue-400/50 transition-all duration-300"></div>
                        </>
                      )}
                      
                      {/* الأيقونة مع تأثير اللمعان */}
                      <span className={`${isRTL ? 'ml-3' : 'mr-3'} text-blue-400 transition-all duration-300 group-hover:scale-110 z-10`}>{link.icon}</span>
                      
                      {/* النص مع تأثير اللمعان */}
                      <span className="flex-1 transition-all duration-300 group-hover:text-white z-10">{link.text}</span>
                      
                      {/* السهم مع تأثير الحركة واللمعان - فقط على سطح المكتب */}
                      {!isMobile && (
                        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-300 z-10`} />
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* قسم من نحن */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.5, duration: 0.6 }}
              className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl"
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.7, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{t.aboutUs}</h3>
              </motion.div>
              <ul className="space-y-3">
                {aboutLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 3.9 + index * 0.1, duration: 0.5 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group p-3 rounded-xl hover:bg-gray-700/30 relative overflow-hidden"
                    >
                      {/* تأثير التوهج الخلفي - فقط على سطح المكتب */}
                      {!isMobile && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-purple-400/50 transition-all duration-300"></div>
                        </>
                      )}
                      
                      {/* الأيقونة مع تأثير اللمعان */}
                      <span className={`${isRTL ? 'ml-3' : 'mr-3'} text-purple-400 transition-all duration-300 group-hover:scale-110 z-10`}>{link.icon}</span>
                      
                      {/* النص مع تأثير اللمعان */}
                      <span className="flex-1 transition-all duration-300 group-hover:text-white z-10">{link.text}</span>
                      
                      {/* السهم مع تأثير الحركة واللمعان - فقط على سطح المكتب */}
                      {!isMobile && (
                        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-300 z-10`} />
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* قسم التواصل */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.6, duration: 0.6 }}
              className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl"
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.8, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mr-3">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{t.contact}</h3>
              </motion.div>
              <ul className="space-y-3">
                {contactLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 4 + index * 0.1, duration: 0.5 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group p-3 rounded-xl hover:bg-gray-700/30 relative overflow-hidden"
                    >
                      {/* تأثير التوهج الخلفي - فقط على سطح المكتب */}
                      {!isMobile && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-green-400/50 transition-all duration-300"></div>
                        </>
                      )}
                      
                      {/* الأيقونة مع تأثير اللمعان */}
                      <span className={`${isRTL ? 'ml-3' : 'mr-3'} text-green-400 transition-all duration-300 group-hover:scale-110 z-10`}>{link.icon}</span>
                      
                      {/* النص مع تأثير اللمعان */}
                      <span className="flex-1 transition-all duration-300 group-hover:text-white z-10">{link.text}</span>
                      
                      {/* السهم مع تأثير الحركة واللمعان - فقط على سطح المكتب */}
                      {!isMobile && (
                        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-300 z-10`} />
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* قسم السياسات */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.7, duration: 0.6 }}
              className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl"
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.9, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center mr-3">
                  <Shield className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{t.policies}</h3>
              </motion.div>
              <ul className="space-y-3">
                {policyLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 4.1 + index * 0.1, duration: 0.5 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group p-3 rounded-xl hover:bg-gray-700/30 relative overflow-hidden"
                    >
                      {/* تأثير التوهج الخلفي - فقط على سطح المكتب */}
                      {!isMobile && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-pink-400/50 transition-all duration-300"></div>
                        </>
                      )}
                      
                      {/* الأيقونة مع تأثير اللمعان */}
                      <span className={`${isRTL ? 'ml-3' : 'mr-3'} text-pink-400 transition-all duration-300 group-hover:scale-110 z-10`}>{link.icon}</span>
                      
                      {/* النص مع تأثير اللمعان */}
                      <span className="flex-1 transition-all duration-300 group-hover:text-white z-10">{link.text}</span>
                      
                      {/* السهم مع تأثير الحركة واللمعان - فقط على سطح المكتب */}
                      {!isMobile && (
                        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-300 z-10`} />
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
          
          {/* زر العودة للرئيسية */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.2, duration: 0.8 }}
            className="flex justify-center mb-12"
          >
            <Link
              href="/"
              className="group relative overflow-hidden inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700"
            >
              <span className="relative z-10 flex items-center">
                <Zap className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'} transition-transform duration-300 group-hover:scale-110`} />
                {t.backToHome}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-white/30 transition-all duration-300"></div>
            </Link>
          </motion.div>
          
          {/* حقوق النشر */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.4, duration: 0.8 }}
            className="pt-8 border-t border-gray-700/30 text-center"
          >
            <motion.p 
              className="text-gray-500 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.6, duration: 0.8 }}
            >
              <Star className="w-4 h-4 mx-2 text-yellow-400" />
              {year} {isRTL ? 'فذلكة' : 'fazlaka'}. {t.copyright}
              <Star className="w-4 h-4 mx-2 text-yellow-400" />
            </motion.p>
          </motion.div>
        </div>
        
        {/* زخرفة سفلية */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut", delay: 4.8 }}
          />
        </div>
      </motion.footer>
      
      <style jsx global>{`
        .bg-grid-pattern {
          background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </>
  );
}