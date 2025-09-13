"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaYoutube,
  FaInstagram,
  FaFacebookF,
  FaTiktok,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { 
  FaQuestionCircle, 
  FaArrowUp, 
  FaPlay, 
  FaLightbulb, 
  FaBook, 
  FaVideo, 
  FaUsers, 
  FaChartLine, 
  FaGlobe,
  FaUser,
  FaPaperPlane,
  FaComments,
  FaArrowLeft
} from "react-icons/fa";
// إعدادات API الأساسية
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
// دالة لبناء رابط الوسائط
function buildMediaUrl(path?: string | null) {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STRAPI_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
// تعريف واجهات البيانات
interface EpisodeData {
  id: string;
  attributes?: {
    title?: string;
    slug?: string;
    name?: string;
    description?: string;
    publishedAt?: string;
    thumbnail?: {
      data?: {
        attributes?: {
          url?: string;
          formats?: {
            medium?: { url?: string };
            thumbnail?: { url?: string };
            small?: { url?: string };
          };
        };
      };
      url?: string;
    };
  };
  title?: string;
  slug?: string;
  name?: string;
  description?: string;
  publishedAt?: string;
  thumbnail?: {
    url?: string;
    formats?: {
      medium?: { url?: string };
      thumbnail?: { url?: string };
      small?: { url?: string };
    };
  };
}
interface FAQData {
  id: string;
  attributes?: {
    question?: string;
    answer?: string;
  };
  question?: string;
  answer?: string;
}
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
// متغيرات الحركة للعناصر
const containerVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, when: "beforeChildren" },
  },
};
const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
// متغيرات الحركة للأسئلة الشائعة
const faqItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};
const answerVariants = {
  closed: { opacity: 0, height: 0, overflow: "hidden" },
  open: { opacity: 1, height: "auto", overflow: "visible", transition: { duration: 0.3 } }
};
// مكون السؤال المتحرك
const AnimatedQuestion = ({ question, answer, index }: { question: string; answer: string; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div 
      variants={faqItemVariants}
      className={`border-2 rounded-2xl p-8 bg-white dark:bg-gray-800 backdrop-blur-sm transition-all duration-300 ${
        index % 2 === 0 
          ? 'border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700' 
          : 'border-purple-200 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-700'
      }`}
    >
      <motion.div 
        className="cursor-pointer font-bold text-lg flex items-center gap-4 list-none"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          index % 2 === 0 
            ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50' 
            : 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/50'
        } transition-all duration-300`}>
          <FaQuestionCircle className={`text-lg ${
            index % 2 === 0 ? 'text-blue-500' : 'text-purple-500'
          }`} />
        </div>
        <span className="text-right flex-grow text-lg">{question}</span>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg className="w-6 h-6 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
      
      <motion.div 
        variants={answerVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className="overflow-hidden"
      >
        <div 
          className="mt-6 text-gray-700 dark:text-gray-300 overflow-hidden pr-14 text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      </motion.div>
    </motion.div>
  );
};
export default function Home() {
  // حالات المكون
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user } = useUser();
  
  // مواقع الجزيئات المحسوبة مسبقًا
  const particlePositions = [
    { top: "90%", left: "50%" },   // 0°
    { top: "75%", left: "93.3%" }, // 60°
    { top: "50%", left: "90%" },   // 120°
    { top: "25%", left: "93.3%" }, // 180°
    { top: "10%", left: "50%" },   // 240°
    { top: "25%", left: "6.7%" },  // 300°
  ];
  
  // روابط وسائل التواصل الاجتماعي
  const socialLinks = useMemo(() => [
    { href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA", icon: <FaYoutube />, label: "يوتيوب" },
    { href: "https://www.instagram.com/fazlaka_platform/", icon: <FaInstagram />, label: "انسجرام" },
    { href: "https://www.facebook.com/profile.php?id=61579582675453", icon: <FaFacebookF />, label: "فيس بوك" },
    { href: "https://www.tiktok.com/@fazlaka_platform", icon: <FaTiktok />, label: "تيك توك" },
    { href: "https://x.com/FazlakaPlatform", icon: <FaXTwitter />, label: "اكس" },
  ], []);
  
  // بيانات الاقتراحات
  const suggestions = useMemo(() => [
    {
      icon: <FaVideo className="text-xl" />,
      title: "فيديوهات تعليمية",
      description: "شروحات مبسطة ومصورة تجعل المفاهيم العلمية سهلة الفهم",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <FaBook className="text-xl" />,
      title: "مقالات علمية",
      description: "محتوى مكتوب ومنظم يغطي مختلف المواضيع العلمية",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: <FaLightbulb className="text-xl" />,
      title: "حقائق ومعلومات",
      description: "معلومات مذهلة ومثيرة للاهتمام من عالم العلوم",
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: <FaUsers className="text-xl" />,
      title: "مجتمع تفاعلي",
      description: "انضم إلى مجتمع من المهتمين بالعلم والمعرفة",
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: <FaChartLine className="text-xl" />,
      title: "تقدم تعليمي",
      description: "تتبع تقدمك التعليمي وحقق أهدافك العلمية",
      color: "from-emerald-500 to-teal-600"
    }
  ], []);
  
  // بيانات قسم "لماذا تشترك في فذلَكة؟"
  const points = useMemo(() => [
    'تلخيص الفرضيات والأفكار الأساسية بسرعة.',
    'قصص وسيناريوهات تساعدك تطبّق الفكرة عمليًا.',
    'مصادر وروابط لو حبيت تغوص أعمق.'
  ], []);
  
  const features = useMemo(() => [
    { icon: <FaVideo className="text-xl" />, title: 'حلقات عميقة', desc: 'شرح مبسط ومعمق' },
    { icon: <FaUsers className="text-xl" />, title: 'أسلوب قصصي', desc: 'سرد يشد الانتباه' },
    { icon: <FaGlobe className="text-xl" />, title: 'تنوع الموضوعات', desc: 'تاريخ، سياسة، علم نفس' }
  ], []);
  
  // التأكد من أننا في بيئة العميل
  useEffect(() => {
    setIsClient(true);
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
      
      setShowScrollTop(scrollTop > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // تحميل الحلقات
  useEffect(() => {
    let mounted = true;
    async function loadEpisodes() {
      try {
        const res = await fetch(
          `${STRAPI_URL}/api/episodes?populate=thumbnail&sort[0]=publishedAt:desc&pagination[limit]=9`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (mounted) setEpisodes(json.data || []);
      } catch (err) {
        console.error("Error loading episodes:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadEpisodes();
    return () => {
      mounted = false;
    };
  }, []);
  
  // تحميل الأسئلة الشائعة
  useEffect(() => {
    let mounted = true;
    async function loadFaqs() {
      try {
        const res = await fetch(`${STRAPI_URL}/api/faqs?populate=*`);
        const json = await res.json();
        if (mounted) {
          const items = (json.data ?? []).map((item: FAQData) => {
            const attrs = item.attributes ?? item;
            return {
              id: item.id ?? Math.random().toString(36).slice(2, 9),
              question: attrs.question ?? "",
              answer: attrs.answer ?? "",
            };
          });
          setFaqs(items.slice(0, 4));
        }
      } catch (err) {
        console.error("Error loading FAQs:", err);
      } finally {
        if (mounted) setFaqLoading(false);
      }
    }
    loadFaqs();
    return () => {
      mounted = false;
    };
  }, []);
  
  // دالة للتمرير إلى قسم الحلقات
  const scrollToEpisodes = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById("episodes-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.location.href = "/episodes";
  };
  
  // دالة للعودة إلى أعلى الصفحة
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  
  return (
    <div className="antialiased bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      {/* شريط التقدم */}
      <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 z-50 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      
      {/* زر العودة للأعلى */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="العودة للأعلى"
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaArrowUp className="text-lg" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* ====== HERO مع خلفية علمية عصرية ====== */}
      <motion.header
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={containerVariants}
        className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden"
      >
        {/* خلفية متدرجة علمية */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-pink-800/70 z-0" />
        <div className="absolute inset-0 bg-black/40 z-0" />
        
        {/* شبكة علمية */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMC41IiBmaWxsPSIjZDBkNWZmIiBvcGFjaXR5PSIwLjEiIC8+Cjwvc3ZnPg==')] opacity-20 dark:opacity-10" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPHBhdGggZD0iTTAgMEw0MCA0ME00MCAwTDAgNDAiIHN0cm9rZT0iIzYwYTVmYSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIgLz4KPC9zdmc+')] opacity-10 dark:opacity-5" />
          
          {/* دوائر متحركة */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-400/10 dark:bg-blue-500/5 blur-3xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-purple-400/10 dark:bg-purple-500/5 blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{ 
              duration: 12, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div 
            className="absolute top-1/3 right-1/3 w-32 h-32 rounded-full bg-indigo-400/10 dark:bg-indigo-500/5 blur-3xl"
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ 
              duration: 18, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>
        
        {/* أيقونات السوشيال مع حركة */}
        <div className="hidden md:flex flex-col gap-3 absolute left-6 md:left-10 bottom-36 md:bottom-44 z-30">
          {socialLinks.map((s, i) => (
            <motion.a
              key={i}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
              className={`
                w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow
                transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-300
                bg-white/80 text-gray-900 dark:bg-gray-800/80 dark:text-white backdrop-blur-sm
                hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white
              `}
              whileHover={{ y: -3, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-[16px] md:text-lg">{s.icon}</span>
            </motion.a>
          ))}
        </div>
        
        {/* محتوى الهيرو */}
        <div className="relative z-10 text-center px-4 py-20 md:py-32 max-w-4xl mx-auto">
          <motion.div
            variants={itemVariant}
            className="mb-6 flex flex-col items-center"
          >
            <motion.div 
              className="flex items-center justify-center gap-4 md:gap-6 mb-2"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {/* الشعار مع تأثيرات */}
              <motion.div
                className="relative"
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, 5, -5, 0],
                  transition: { duration: 0.6 }
                }}
              >
                {/* تأثير الإضاءة المحيطة */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-purple-500/30 to-indigo-400/30 rounded-full blur-xl transform scale-125"></div>
                
                {/* تأثير الجزيئات العلمية حول الشعار */}
                {isClient && particlePositions.map((pos, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-blue-400/60 dark:bg-blue-300/40"
                    style={{
                      top: pos.top,
                      left: pos.left,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                      duration: 2 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
                
                {/* الشعار الرئيسي */}
                <motion.div
                  className="relative w-16 md:w-20 h-auto drop-shadow-xl z-10"
                  style={{ 
                    filter: "drop-shadow(0 10px 8px rgba(59, 130, 246, 0.3))",
                  }}
                  animate={{ 
                    y: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <Image
                    src="/logo.png"
                    alt="فذلكه - شعار المنصة"
                    width={80}
                    height={80}
                    className="w-full h-auto"
                  />
                </motion.div>
                
                {/* تأثير النبض */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-400/30"
                  animate={{ 
                    scale: [1, 1.2, 1], 
                    opacity: [0.7, 0.2, 0.7] 
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity 
                  }}
                />
              </motion.div>
              
              {/* نص "فذلكه" */}
              <motion.h1
                className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-none bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent"
                style={{ WebkitFontSmoothing: "antialiased" }}
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              >
                فذلكه
              </motion.h1>
            </motion.div>
            
            {/* باقي العنوان */}
            <motion.p
              className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-200 max-w-3xl"
              variants={itemVariant}
            >
              مرحبًا بك في عالم <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">فذلكه</span>
            </motion.p>
          </motion.div>
          
          {/* قسم الأزرار */}
          <motion.div variants={itemVariant} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToEpisodes}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
            >
              ابدأ المشاهدة
            </motion.button>
            <Link href="/about">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-all"
              >
                اعرف المزيد
              </motion.button>
            </Link>
          </motion.div>
          
          {/* قسم الاقتراحات */}
          <motion.div 
            variants={containerVariants}
            className="mt-16 w-full max-w-5xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  variants={itemVariant}
                  whileHover={{ y: -8, scale: 1.03 }}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group"
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${suggestion.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white">{suggestion.icon}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1">{suggestion.title}</h3>
                  <p className="text-sm text-gray-200">{suggestion.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* عناصر علمية زخرفية */}
        <motion.div 
          className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-blue-200/20 dark:bg-blue-500/10 blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute top-20 left-10 w-12 h-12 rounded-full bg-purple-200/20 dark:bg-purple-500/10 blur-xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute top-1/2 right-1/4 w-14 h-14 rounded-full bg-indigo-200/20 dark:bg-indigo-500/10 blur-xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
          <div className="w-8 h-12 rounded-full border-4 border-white/30 flex justify-center">
            <div className="w-2 h-2 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </motion.header>
      
      {/* ====== الحلقات مع تحسينات ====== */}
      <section id="episodes-section" className="container mx-auto py-6 relative overflow-x-hidden">
        <div className="flex items-center justify-between mb-5">
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            أحدث الحلقات
          </motion.h2>
          <motion.div initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} className="flex gap-2">
            <Link
              href="/episodes"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-95 transition-all duration-300"
            >
              جميع الحلقات
            </Link>
            <Link
              href="/playlists"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              جميع القوائم
            </Link>
          </motion.div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent"
            />
          </div>
        ) : episodes.length === 0 ? (
          <p className="text-center py-12 text-gray-600 dark:text-gray-400">لا توجد حلقات حالياً</p>
        ) : (
          <>
            <Swiper
              modules={[Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              autoHeight={true}
              pagination={{ 
                el: ".custom-pagination", 
                clickable: true,
                bulletClass: "swiper-pagination-bullet-custom",
                bulletActiveClass: "swiper-pagination-bullet-active-custom",
              }}
              autoplay={{ delay: 4500, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="py-1 relative"
            >
              {episodes.map((ep: EpisodeData) => {
                const attrs = ep.attributes ?? ep;
                const slug = attrs.slug ?? ep.id;
                const title = (attrs.title ?? attrs.name ?? "حلقة")
                  .toString()
                  .trim();
                
                // تعريف نوع الصورة المباشرة
                type DirectThumbnail = {
                  url?: string;
                  formats?: {
                    medium?: { url?: string };
                    thumbnail?: { url?: string };
                    small?: { url?: string };
                  };
                };

                // استخراج بيانات الصورة
                const thumbRel = 
                  attrs.thumbnail && 'data' in attrs.thumbnail
                    ? (attrs.thumbnail as { data?: { attributes?: DirectThumbnail } }).data?.attributes
                    : (attrs.thumbnail as DirectThumbnail | null) ?? null;

                const thumbPath = 
                  thumbRel?.formats?.medium?.url ??
                  thumbRel?.formats?.thumbnail?.url ??
                  thumbRel?.formats?.small?.url ??
                  thumbRel?.url ??
                  null;
                
                const thumbnailUrl = buildMediaUrl(thumbPath ?? undefined);
                
                return (
                  <SwiperSlide key={ep.id} className="flex justify-center items-start">
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.995 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10 -5px rgba(0, 0, 0, 0.04)" }}
                      className="card relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col"
                    >
                      <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block flex-grow flex flex-col">
                        <div className="relative h-48 md:h-56 overflow-hidden flex-shrink-0">
                          <Image
                            src={thumbnailUrl}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <FaPlay className="text-white text-xl ml-1" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-5 flex-grow flex flex-col">
                          <h3
                            className="text-lg font-bold leading-tight text-gray-900 dark:text-white mb-2"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {title}
                          </h3>
                          
                          <div className="mt-auto pt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                حلقة
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            
            <div className="custom-pagination flex justify-center mt-6 gap-2" />
          </>
        )}
      </section>
      
      {/* ====== تواصل + FAQ مع تحسينات ====== */}
      <section
        className="container mx-auto py-16 px-4 relative z-10"
      >
        <div className="text-center mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            تواصل معنا
          </h2>
          <p 
            className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto"
          >
            هل لديك أسئلة أو استفسارات؟ نحن هنا لمساعدتك. تصفح الأسئلة الشائعة أو تواصل معنا مباشرة.
          </p>
        </div>
        
        {/* خلفية متحركة - تعرض فقط على العميل */}
        {isClient && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* جسيمات متحركة */}
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-blue-400/30 dark:bg-blue-500/20"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 5,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}
        
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl overflow-hidden relative">
          <div className="flex flex-col lg:flex-row">
            {/* قسم التواصل والشبكات الاجتماعية */}
            <div 
              className="lg:w-1/3 p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden"
            >
              {/* خلفية متحركة */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIgLz4KPC9zdmc+')]"></div>
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div 
                  className="mb-4"
                >
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <FaComments className="text-yellow-300" />
                    تواصل معنا
                  </h3>
                  
                  <div className="text-center">
                    <p className="mb-4 text-blue-100 text-lg">نحن متواجدون دائماً للرد على استفساراتكم</p>
                    <div 
                    >
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-semibold shadow-lg hover:bg-blue-50 transition-all duration-300"
                      >
                        <FaPaperPlane />
                        ارسل رسالة
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="mt-4"
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaUsers className="text-yellow-300" />
                    تابعنا على:
                  </h3>
                  <div className="flex flex-col gap-3">
                    {socialLinks.map((s, i) => (
                      <a 
                        key={i}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        title={s.label}
                        className={`
                          flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg
                          transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-white/30
                          bg-white/20 backdrop-blur-sm text-white
                          hover:bg-white hover:text-blue-600 hover:shadow-xl
                        `}
                      >
                        <span className="text-xl">{s.icon}</span>
                        <span className="font-medium">{s.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* قسم الأسئلة الشائعة */}
            <div 
              className="lg:w-2/3 p-8 relative"
            >
              {/* خلفية زخرفية */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <FaQuestionCircle className="text-blue-500 text-2xl" />
                    الأسئلة الشائعة
                  </h3>
                  
                  <div 
                  >
                    <Link
                      href="/faq"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium whitespace-nowrap"
                    >
                      جميع الأسئلة
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
                      </svg>
                    </Link>
                  </div>
                </div>
                
                {faqLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div 
                      className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
                    />
                  </div>
                ) : faqs.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">لا توجد أسئلة حالياً.</p>
                ) : (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="space-y-8"
                  >
                    {faqs.map((f, index) => (
                      <AnimatedQuestion 
                        key={f.id} 
                        question={f.question} 
                        answer={f.answer} 
                        index={index} 
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ====== قسم متكامل في النهاية ====== */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-blue-900/20 mt-auto relative overflow-visible"
      >
        {/* عناصر خلفية متحركة */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-10 right-10 w-64 h-64 rounded-full bg-purple-300/10 dark:bg-purple-500/5 blur-3xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-blue-300/10 dark:bg-blue-500/5 blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{ 
              duration: 12, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 overflow-visible">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* قسم "من نحن" */}
              <motion.div 
                variants={itemVariant}
                className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 shadow-xl text-white overflow-hidden"
              >
                {/* خلفية متحركة */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIgLz4KPC9zdmc+')]"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold">من نحن</h3>
                  </div>
                  
                  <p className="mb-8 text-indigo-100 leading-relaxed">
                    نحن منصة فذلكه نقدم محتوى ترفيهي وتعليمي مميز. نعمل باستمرار على تحسين التجربة وتوفير أحدث الحلقات والقوائم.
                  </p>
                  
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="inline-block"
                  >
                    <Link
                      href="/about"
                      className="group inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-indigo-50 transition-all duration-300"
                    >
                      <span>اعرف أكثر عن فذلكه</span>
                      <FaArrowLeft className="transform rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* قسم "لماذا تشترك في فذلَكة؟" */}
              <motion.div 
                variants={itemVariant}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/30"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    <FaLightbulb className="text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">لماذا تشترك؟</h3>
                </div>
                
                <ul className="space-y-4 mb-6">
                  {points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <div key={index} className="px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm flex items-center gap-1">
                      <span className="text-purple-500">{feature.icon}</span>
                      <span>{feature.title}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* قسم التسجيل والترحيب */}
              <motion.div 
                variants={itemVariant}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-700/20"></div>
                <div className="relative z-10">
                  <SignedOut>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold mb-4">انضم إلى مجتمع فذلكه</h3>
                      <p className="mb-8 text-indigo-100">
                        سجل الآن للحصول على تجربة تعليمية مخصصة والوصول إلى محتوى حصري
                      </p>
                      <div className="space-y-4">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Link
                            href="/sign-in"
                            className="block w-full py-3 px-6 rounded-full bg-white text-indigo-600 font-semibold shadow-lg hover:bg-indigo-50 transition"
                          >
                            تسجيل الدخول
                          </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Link
                            href="/sign-up"
                            className="block w-full py-3 px-6 rounded-full bg-transparent border-2 border-white text-white font-semibold hover:bg-white/10 transition"
                          >
                            إنشاء حساب جديد
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </SignedOut>
                  
                  <SignedIn>
                    <div className="text-center">
                      <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                          {user?.imageUrl ? (
                            <Image 
                              src={user.imageUrl} 
                              alt={user.firstName || "المستخدم"} 
                              width={80}
                              height={80}
                              className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <FaUser className="text-3xl" />
                            </div>
                          )}
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-2">
                        مرحباً بك في فذلكه، {user?.firstName || user?.username || "صديقنا"}!
                      </h3>
                      <p className="mb-6 text-indigo-100">
                        شكراً لانضمامك إلينا! استمتع بتجربة تعليمية فريدة واستكشف محتوانا التعليمي المتنوع.
                      </p>
                      
                      <div className="space-y-3">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Link
                            href="/profile"
                            className="block w-full py-3 px-6 rounded-full bg-white text-indigo-600 font-semibold shadow-lg hover:bg-indigo-50 transition"
                          >
                            عرض الملف الشخصي
                          </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Link
                            href="/episodes"
                            className="block w-full py-3 px-6 rounded-full bg-white/10 backdrop-blur-sm text-white font-semibold shadow-lg hover:bg-white/20 transition"
                          >
                            استكشف الحلقات
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </SignedIn>
                </div>
              </motion.div>
            </div>
            
            {/* ختام القسم */}
            <motion.div 
              variants={itemVariant}
              className="mt-16 text-center"
            >
              <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                فذلكه - حيث يصبح العلم ممتعًا وملموسًا للجميع
              </p>
              <div className="mt-6 flex justify-center gap-4">
                {socialLinks.map((s, i) => (
                  <motion.a
                    key={i}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center shadow
                      transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-300
                      bg-white text-gray-900 dark:bg-gray-800 dark:text-white
                      hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white
                    `}
                    whileHover={{ y: -3, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-[14px]">{s.icon}</span>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
      
      {/* أنماط مخصصة للسلايدر */}
      <style jsx global>{`
        .swiper-pagination-bullet-custom {
          width: 10px;
          height: 10px;
          background: #cbd5e1;
          border-radius: 50%;
          opacity: 0.7;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active-custom {
          width: 24px;
          border-radius: 5px;
          background: linear-gradient(to right, #3b82f6, #6366f1);
          opacity: 1;
        }
        
        @media (prefers-color-scheme: dark) {
          .swiper-pagination-bullet-custom {
            background: #4b5563;
          }
          .swiper-pagination-bullet-active-custom {
            background: linear-gradient(to right, #60a5fa, #818cf8);
          }
        }
        .swiper-slide { align-items: flex-start; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        #episodes-section { overflow-x: hidden; position: relative; }
        .swiper, .swiper-wrapper, .swiper-slide {
          overflow-x: visible !important;
          overflow-y: visible !important;
        }
        .swiper-slide .card { 
          position: relative;
          z-index: 1;
          will-change: transform;
        }
        .swiper-slide:hover .card {
          z-index: 50;
        }
      `}</style>
    </div>
  );
}