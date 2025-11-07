// src/app/page.tsx

"use client"; // هذا السطر ضروري جداً لجعل المكون يعمل على المتصفح (Client-Side)

import Image from 'next/image';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Parallax } from 'swiper/modules';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/parallax";

// استيراد الأيقونات المستخدمة فقط
import {
  FaYoutube,
  FaInstagram,
  FaFacebookF,
  FaTiktok,
  FaPlay,
  FaPause,
  FaChevronDown,
} from 'react-icons/fa';

// استيراد دوال Sanity
import { 
  fetchHeroSliders
} from '@/lib/sanity';

// استيراد الأنواع
import { 
  HeroSlider
} from '@/lib/sanity';

import { useLanguage } from '@/components/LanguageProvider';

// تعريفات واجهات البيانات
interface FAQItem {
  _id: string;
  question?: string;
  questionEn?: string;
  answer?: string;
  answerEn?: string;
  category?: string;
  categoryEn?: string;
  language?: string;
}

// كائن الترجمات
const translations = {
  ar: {
    home: "الرئيسية",
    content: "محتوانا",
    episodes: "الحلقات",
    playlists: "قوائم التشغيل",
    seasons: "المواسم",
    articles: "المقالات",
    about: "تعرف علينا",
    whoWeAre: "من نحن",
    team: "الفريق",
    contact: "التواصل",
    contactUs: "تواصل معنا",
    faq: "الأسئلة الشائعة",
    search: "ابحث عن حلقات، مقالات، مواسم والمزيد...",
    searchResults: "نتائج البحث",
    noResults: "لا توجد نتائج مطابقة",
    searching: "جاري البحث...",
    viewAllResults: "عرض جميع نتائج البحث",
    signIn: "تسجيل دخول",
    signUp: "إنشاء حساب",
    manageAccount: "إدارة الحساب",
    favorites: "مفضلاتي",
    signOut: "تسجيل الخروج",
    notifications: "الإشعارات",
    viewAll: "مشاهدة الكل",
    noNotifications: "لا توجد إشعارات جديدة",
    loading: "جاري التحميل...",
    terms: "شروط وأحكام",
    privacy: "سياسة الخصوصية",
    episode: "حلقة",
    article: "مقال",
    playlist: "قائمة تشغيل",
    faqItem: "سؤال شائع",
    season: "موسم",
    teamMember: "عضو الفريق",
    termsItem: "شروط وأحكام",
    privacyItem: "سياسة الخصوصية",
    darkMode: "تبديل الوضع الليلي",
    language: "تبديل اللغة",
    copyright: "© {year} فذلكة",
    platformName: "فذلكة",
    platformSubtitle: "منصة العلم بدون تعقيد",
    discover: "استكشف أحدث محتوانا",
    welcome: "مرحباً بك،",
    noUser: "صديقنا",
    welcomeMessage: "شكراً لانضمامك إلينا! استمتع بتجربة تعليمية فريدة واستكشف محتوانا التعليمي المتنوع.",
    joinCommunity: "انضم إلى مجتمعنا",
    joinMessage: "سجل الآن للحصول على تجربة تعليمية مخصصة والوصول إلى محتوى حصري",
    latestEpisodes: "أحدث الحلقات",
    latestArticles: "أحدث المقالات",
    allEpisodes: "جميع الحلقات",
    allPlaylists: "جميع القوائم",
    allSeasons: "المواسم",
    allArticles: "جميع المقالات",
    noEpisodes: "لا توجد حلقات حالياً",
    noArticles: "لا توجد مقالات حالياً",
    startWatching: "ابدأ المشاهدة",
    learnMore: "اعرف المزيد",
    send: "ارسل رسالة",
    followUs: "تابعنا على:",
    youtube: "يوتيوب",
    instagram: "انستجرام",
    facebook: "فيسبوك",
    tiktok: "تيك توك",
    twitter: "اكس",
    contactUsTitle: "تواصل معنا",
    contactUsMessage: "هل لديك أسئلة أو استفسارات؟ نحن هنا لمساعدتك. تصفح الأسئلة الشائعة أو تواصل معنا مباشرة.",
    commonQuestions: "الأسئلة الشائعة",
    allQuestions: "جميع الأسئلة",
    whySubscribe: "لماذا تشترك في فذلَكة؟",
    whySubscribePoints: [
      'تلخيص الفرضيات والأفكار الأساسية بسرعة.',
      'قصص وسيناريوهات تساعدك تطبّق الفكرة عمليًا.',
      'مصادر وروابط لو حبيت تغوص أعمق.'
    ],
    // تم حذف مصفوفة features لأنها غير مستخدمة
    aboutUs: "من نحن",
    aboutUsMessage: "نحن منصة تعليمية تقدم محتوى ترفيهي وتعليمي مميز. نعمل باستمرار على تحسين التجربة وتوفير أحدث الحلقات والقوائم.",
    knowMore: "اعرف أكثر عن المنصة",
    viewProfile: "عرض الملف الشخصي",
    myFavorites: "المفضلة",
    publishedAt: "تاريخ النشر",
    subscribers: "مشتركين يوتيوب",
    episodesCount: "حلقات",
    playlistsCount: "قوائم تشغيل",
    seasonsCount: "مواسم",
    articlesCount: "مقالات",
    newContent: "ما الجديد",
    heroDescription: "اطلع على أحدث المحتوى والفعاليات التي نقدمها لك",
    noFaqs: "لا توجد أسئلة شائعة حالياً",
    noFaqsMessage: "سيتم إضافتها قريباً",
    noQuestion: "لا يوجد سؤال",
    noAnswer: "لا يوجد إجابة",
    featuredContent: "المحتوى المميز",
    featuredDescription: "استكشف أحدث وأهم المحتويات التي نقدمها لك",
    scrollDown: "مرر لأسفل",
  },
  en: {
    home: "Home",
    content: "Content",
    episodes: "Episodes",
    playlists: "Playlists",
    seasons: "Seasons",
    articles: "Articles",
    about: "About",
    whoWeAre: "Who We Are",
    team: "Team",
    contact: "Contact",
    contactUs: "Contact Us",
    faq: "FAQ",
    search: "Search for episodes, articles, seasons and more...",
    searchResults: "Search Results",
    noResults: "No matching results",
    searching: "Searching...",
    viewAllResults: "View All Results",
    signIn: "Sign In",
    signUp: "Sign Up",
    manageAccount: "Manage Account",
    favorites: "My Favorites",
    signOut: "Sign Out",
    notifications: "Notifications",
    viewAll: "View All",
    noNotifications: "No new notifications",
    loading: "Loading...",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    episode: "Episode",
    article: "Article",
    playlist: "Playlist",
    faqItem: "FAQ",
    season: "Season",
    teamMember: "Team Member",
    termsItem: "Terms & Conditions",
    privacyItem: "Privacy Policy",
    darkMode: "Toggle Dark Mode",
    language: "Toggle Language",
    copyright: "© {year} fazlaka",
    platformName: "fazlaka",
    platformSubtitle: "Science platform without complexity",
    discover: "Discover Our Latest Content",
    welcome: "Welcome,",
    noUser: "Friend",
    welcomeMessage: "Thank you for joining us! Enjoy a unique educational experience and explore our diverse educational content.",
    joinCommunity: "Join Our Community",
    joinMessage: "Sign up now for a personalized educational experience and access to exclusive content",
    latestEpisodes: "Latest Episodes",
    latestArticles: "Latest Articles",
    allEpisodes: "All Episodes",
    allPlaylists: "All Playlists",
    allSeasons: "Seasons",
    allArticles: "All Articles",
    noEpisodes: "No episodes available",
    noArticles: "No articles available",
    startWatching: "Start Watching",
    learnMore: "Learn More",
    send: "Send Message",
    followUs: "Follow Us:",
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "Tiktok",
    twitter: "X",
    contactUsTitle: "Contact Us",
    contactUsMessage: "Do you have questions or inquiries? We are here to help you. Browse frequently asked questions or contact us directly.",
    commonQuestions: "Frequently Asked Questions",
    allQuestions: "All Questions",
    whySubscribe: "Why Subscribe to fazlaka?",
    whySubscribePoints: [
      'Quick summaries of basic hypotheses and ideas.',
      'Stories and scenarios to help you apply idea practically.',
      'Sources and links if you want to dive deeper.'
    ],
    // تم حذف مصفوفة features لأنها غير مستخدمة
    aboutUs: "About Us",
    aboutUsMessage: "We are an educational platform that offers distinctive entertainment and educational content. We continuously work on improving experience and providing latest episodes and playlists.",
    knowMore: "Know More About The Platform",
    viewProfile: "View Profile",
    myFavorites: "My Favorites",
    publishedAt: "Published Date",
    subscribers: " Subscribers",
    episodesCount: "Episodes",
    playlistsCount: "Playlists",
    seasonsCount: "Seasons",
    articlesCount: "Articles",
    newContent: "What's New",
    heroDescription: "Check out latest content and events we offer you",
    noFaqs: "No FAQs available at the moment",
    noFaqsMessage: "They will be added soon",
    noQuestion: "No question available",
    noAnswer: "No answer available",
    featuredContent: "Featured Content",
    featuredDescription: "Explore the latest and most important content we offer you",
    scrollDown: "Scroll Down",
  }
};

// دالة مساعدة لاستخراج معرف الفيديو من رابط YouTube أو Vimeo
function extractVideoId(url: string): string | null {
  // YouTube
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return youtubeMatch[1];
  }
  
  // Vimeo
  const vimeoRegex = /vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return vimeoMatch[1];
  }
  
  return null;
}

// دالة للتحقق إذا كان النص يحتوي على HTML
const hasHtml = (text: string): boolean => {
  if (!text) return false;
  return /<[^>]*>/g.test(text);
};

// دالة محسنة للحصول على النص المترجم
function getLocalizedTextEnhanced(arText?: string, enText?: string, language?: string): string {
  if (language === 'en') {
    return enText || arText || '';
  }
  return arText || enText || '';
}

// مكون سلايدر المحتوى المميز - بدون عناوين مع تحسين الموضع
const FeaturedContentSlider = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const { scrollY } = useScroll();
  
  const [sliders, setSliders] = useState<HeroSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const loadSliders = async () => {
      try {
        console.log('Loading featured sliders for language:', language);
        const data = await fetchHeroSliders(language);
        console.log('Featured sliders loaded:', data);
        setSliders(data);
      } catch (error) {
        console.error('Error loading featured hero sliders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSliders();
  }, [language]);

  // تحريك السلايدر بناءً على التمرير
  const sliderY = useTransform(scrollY, [0, 400], [100, 0]);
  const sliderOpacity = useTransform(scrollY, [0, 200, 400], [0, 0.5, 1]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (sliders.length === 0) {
    console.log('No featured sliders found for language:', language);
    return null;
  }

  return (
    <motion.section 
      className="relative py-8 md:py-12 overflow-hidden z-30" 
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        y: sliderY,
        opacity: sliderOpacity,
      }}
    >
      <div className="max-w-full mx-auto relative z-10 px-0">
        {/* السلايدر المحسن مع الظل بدون أسهم */}
        <div className="relative">
          {/* الظل الأزرق والبنفسجي تحت السلايدر */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-6xl h-12 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 blur-2xl rounded-full"></div>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-5xl h-8 bg-gradient-to-r from-blue-400/15 via-purple-400/15 to-indigo-400/15 blur-xl rounded-full"></div>
          
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <Swiper
              modules={[Autoplay, Pagination, Parallax]}
              spaceBetween={0}
              slidesPerView={1}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
                el: '.featured-pagination',
              }}
              onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
              onAutoplayPause={() => setIsPaused(true)}
              onAutoplayResume={() => setIsPaused(false)}
              className="featured-slider overflow-hidden"
              style={{
                height: '0',
                paddingBottom: '40%', // تصغير نسبة الارتفاع
                maxHeight: '400px', // تقليل الارتفاع الأقصى
              }}
            >
              {sliders.map((slider, index) => (
                <SwiperSlide key={slider._id} className="relative pb-[40%]">
                  <div className="absolute inset-0 w-full h-full">
                    {/* الخلفية - تظهر دائماً */}
                    {slider.mediaType === 'image' && (
                      <Image
                        src={language === 'ar' 
                          ? (slider.image || '/placeholder.png')
                          : (slider.imageEn || slider.image || '/placeholder.png')
                        }
                        alt={getLocalizedTextEnhanced(slider.title, slider.titleEn, language)}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    )}
                    
                    {slider.mediaType === 'video' && (
                      <div className="absolute inset-0 w-full h-full overflow-hidden">
                        {slider.videoUrl ? (
                          <>
                            {slider.videoUrl.includes('youtube.com') || slider.videoUrl.includes('youtu.be') ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${extractVideoId(slider.videoUrl)}?autoplay=1&mute=1&loop=1&playlist=${extractVideoId(slider.videoUrl)}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&cc_load_policy=0&fs=0&playsinline=1`}
                                className="absolute inset-0 w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : slider.videoUrl.includes('vimeo.com') ? (
                              <iframe
                                src={`https://player.vimeo.com/video/${extractVideoId(slider.videoUrl)}?autoplay=1&muted=1&loop=1&controls=0&background=1`}
                                className="absolute inset-0 w-full h-full"
                                frameBorder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={slider.videoUrl}
                                className="absolute inset-0 w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                              />
                            )}
                          </>
                        ) : (
                          <div className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <p className="text-gray-500 dark:text-gray-400">No video available</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* طبقة التعتيم المحسنة */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    
                    {/* المحتوى - يظهر فقط للشريحة النشطة */}
                    <AnimatePresence>
                      {activeSlide === index && (
                        <motion.div 
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 30 }}
                          transition={{ duration: 0.7 }}
                          className="absolute inset-0 flex items-center justify-center p-4 md:p-6"
                        >
                          <div className="w-full max-w-4xl text-center">
                            <motion.h2 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg"
                            >
                              {getLocalizedTextEnhanced(slider.title, slider.titleEn, language)}
                            </motion.h2>
                            
                            <motion.p 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                              className="text-sm md:text-base lg:text-lg text-white/90 mb-4 md:mb-6 max-w-3xl mx-auto drop-shadow-md"
                            >
                              {getLocalizedTextEnhanced(slider.description, slider.descriptionEn, language)}
                            </motion.p>
                            
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.4 }}
                              className="flex flex-wrap gap-4 justify-center"
                            >
                              {slider.link?.url && slider.link?.text && (
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Link
                                    href={slider.link.url}
                                    className="inline-flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 md:px-6 md:py-3 rounded-full font-bold shadow-lg hover:bg-indigo-50 transition-all duration-300 text-sm md:text-base"
                                  >
                                    {getLocalizedTextEnhanced(slider.link.text, slider.link.textEn, language)}
                                  </Link>
                                </motion.div>
                              )}
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* مؤشر الشرائح - يظهر فقط للشريحة النشطة */}
                    {activeSlide === index && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full"
                      >
                        {index + 1} / {sliders.length}
                      </motion.div>
                    )}
                    
                    {/* أيقونة التشغيل/الإيقاف */}
                    {slider.mediaType === 'video' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-sm text-white p-3 rounded-full cursor-pointer"
                        onClick={() => setIsPaused(!isPaused)}
                      >
                        {isPaused ? <FaPlay className="text-lg" /> : <FaPause className="text-lg" />}
                      </motion.div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
        
      </div>
      
      <style jsx global>{`
        .featured-slider .swiper-pagination-bullet {
          background-color: rgba(99, 102, 241, 0.5);
          width: 12px;
          height: 12px;
          opacity: 0.7;
          transition: all 0.3s ease;
        }
        .featured-slider .swiper-pagination-bullet-active {
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          width: 30px;
          border-radius: 6px;
          opacity: 1;
        }
        
        /* في الوضع الليلي */
        .dark .featured-slider .swiper-pagination-bullet {
          background-color: rgba(139, 92, 246, 0.5);
        }
        .dark .featured-slider .swiper-pagination-bullet-active {
          background: linear-gradient(to right, #60a5fa, #a78bfa);
        }
        
        @media (max-width: 768px) {
          .featured-slider {
            height: 0 !important;
            padding-bottom: 40% !important; /* نسبة أصغر */
          }
          
          /* تحسين العناوين والأيقونات في الموبايل */
          .featured-slider .text-xl {
            font-size: 1.2rem;
          }
          
          .featured-slider .text-2xl {
            font-size: 1.5rem;
          }
          
          .featured-slider .text-3xl {
            font-size: 1.8rem;
          }
          
          .featured-slider .text-sm {
            font-size: 0.8rem;
          }
          
          .featured-slider .text-base {
            font-size: 0.9rem;
          }
          
          .featured-slider .text-lg {
            font-size: 1rem;
          }
          
          .featured-slider .px-4 {
            padding-left: 0.8rem;
            padding-right: 0.8rem;
          }
          
          .featured-slider .py-2 {
            padding-top: 0.6rem;
            padding-bottom: 0.6rem;
          }
          
          .featured-slider .px-6 {
            padding-left: 1.2rem;
            padding-right: 1.2rem;
          }
          
          .featured-slider .py-3 {
            padding-top: 0.8rem;
            padding-bottom: 0.8rem;
          }
        }
      `}</style>
    </motion.section>
  );
};

// مكون الانتقال السلس بين الأقسام
const SectionTransition = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

// مكون الهيرو المحسن مع انيميشن انتقالي
const HeroSection = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const { scrollY } = useScroll();
  
  // حالة لتخزين إحداثيات الماوس داخل الصورة
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // حالة لمعرفة ما إذا كان الماوس فوق الصورة أم لا
  const [isHovering, setIsHovering] = useState(false);
  
  // حالة لتأثير الكتابة
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const descriptions = language === 'ar' 
    ? [
        "منصة العلم بدون تعقيد",
        "حيث المعرفة تلتقي بالإبداع",
        "رحلة في عالم الفكر والثقافة",
        "تعلم بأسلوب جديد وممتع"
      ]
    : [
        "Science platform without complexity",
        "Where knowledge meets creativity",
        "A journey in the world of thought and culture",
        "Learn in a new and enjoyable way"
      ];
  
  const currentDescription = descriptions[currentTextIndex];
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isDeleting && currentCharIndex < currentDescription.length) {
        // كتابة الحرف التالي
        setCurrentCharIndex(currentCharIndex + 1);
      } else if (!isDeleting && currentCharIndex === currentDescription.length) {
        // الانتظار قليلاً قبل البدء في الحذف
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && currentCharIndex > 0) {
        // حذف الحرف الحالي
        setCurrentCharIndex(currentCharIndex - 1);
      } else if (isDeleting && currentCharIndex === 0) {
        // الانتقال إلى النص التالي
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % descriptions.length);
      }
    }, isDeleting ? 50 : 100);
    
    return () => clearTimeout(timeout);
  }, [currentCharIndex, isDeleting, currentDescription, descriptions.length]);
  
  // هذه الدالة تعمل كلما تحرك الماوس فوق الصورة
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };
  
  // روابط وسائل التواصل الاجتماعي - تم تعديل الترتيب
  const socialLinks = useMemo(() => [
    { href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA", icon: <FaYoutube />, label: t.youtube },
    { href: "https://x.com/FazlakaPlatform", icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>, label: t.twitter },
    { href: "https://www.instagram.com/fazlaka_platform/", icon: <FaInstagram />, label: t.instagram },
    { href: "https://www.facebook.com/profile.php?id=61579582675453", icon: <FaFacebookF />, label: t.facebook },
    { href: "https://www.tiktok.com/@fazlaka_platform", icon: <FaTiktok />, label: t.tiktok },
  ], [t.youtube, t.instagram, t.facebook, t.tiktok, t.twitter]);
  
  // تحريك العناصر بناءً على التمرير
  const logoOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const logoScale = useTransform(scrollY, [0, 300], [1, 0.8]);
  const logoY = useTransform(scrollY, [0, 300], [0, -100]);
  
  const textOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const textY = useTransform(scrollY, [0, 300], [0, -50]);
  
  const socialOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const socialY = useTransform(scrollY, [0, 300], [0, 50]);
  
  const scrollButtonOpacity = useTransform(scrollY, [0, 100], [1, 0]);
  const scrollButtonY = useTransform(scrollY, [0, 100], [0, 20]);
  
  return (
    <div className="hero-container relative z-10">
      {/* هذا الغلاف هو الذي نراقب حركة الماوس عليه */}
      <div
        className="image-wrapper relative w-full h-screen overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Image
          src="/hero.png"
          alt="صورة البطل"
          fill
          className="hero-image object-cover"
          style={{ objectFit: 'cover' }}
        />

        {/* الطبقة الغامقة التي ستحتوي على تأثير الإضاءة */}
        <div
          className="overlay absolute inset-0 pointer-events-none"
          style={{
            // تم زيادة قطر الدائرة هنا من 150px إلى 250px
            background: isHovering
              ? `radial-gradient(circle 250px at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.7) 100%)`
              : 'rgba(0, 0, 0, 0.7)',
          }}
        ></div>
        
        {/* تأثير الجزيئات المتحركة */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full opacity-30"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear",
              }}
            />
          ))}
        </div>
        
        {/* الشعار والوصف المدمجين مع تأثير الكتابة والحركة */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 mt-12">
          {/* الشعار المتحرك */}
          <motion.div 
            className="mb-0 relative"
            style={{
              opacity: logoOpacity,
              scale: logoScale,
              y: logoY,
            }}
          >
            <div className="relative inline-block">
              {/* إضافة تأثير glow للشعار */}
              <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150"></div>
              <Image
                src={language === 'ar' ? "/logo.png" : "/logoE.png"}
                alt={language === 'ar' ? "فذلكة" : "fazlaka"}
                width={300}
                height={120}
                className="relative z-10 w-auto h-16 md:h-20 lg:h-24 object-contain filter drop-shadow-2xl"
                priority
              />
            </div>
          </motion.div>
          
          {/* الوصف مع تأثير الكتابة والمؤشر والحركة */}
          <div className="relative h-12 md:h-16 flex items-center justify-center">
            <motion.p 
              className="text-xl md:text-2xl lg:text-3xl font-light tracking-wide bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
              style={{
                opacity: textOpacity,
                y: textY,
              }}
            >
              {currentDescription.substring(0, currentCharIndex)}
              <motion.span 
                className="inline-block w-0.5 h-6 md:h-8 bg-gradient-to-r from-cyan-400 to-purple-400 ml-2"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </motion.p>
          </div>
          
          {/* أزرار التواصل الاجتماعي المتحركة */}
          <motion.div 
            className="flex gap-6 justify-center mt-6"
            style={{
              opacity: socialOpacity,
              y: socialY,
            }}
          >
            {socialLinks.map((link, index) => (
              <motion.a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:scale-110 transform transition-all duration-300"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-2xl md:text-3xl">
                  {link.icon}
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
        
        {/* زر التمرير لأسفل المتحرك */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
          style={{
            opacity: scrollButtonOpacity,
            y: scrollButtonY,
          }}
          whileHover={{ y: 5 }}
          onClick={() => {
            const nextSection = document.getElementById('featured-content');
            if (nextSection) {
              nextSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <div className="flex flex-col items-center text-white">
            <span className="text-sm mb-2">{t.scrollDown}</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <FaChevronDown className="text-2xl" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function Home() {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const { data: session } = useSession();
  
  // حالات المكون
  const [isClient, setIsClient] = useState(false);
  
  // التأكد من أننا في بيئة العميل
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div className="antialiased bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* ====== HERO مع الشعار المخصص والتحسينات ====== */}
      <HeroSection />
      
      {/* ====== سلايدر المحتوى المميز (Featured Content) مع تحسين الموضع ====== */}
      <div id="featured-content" className="relative z-30 -mt-32">
        <FeaturedContentSlider />
      </div>
      
      {/* أنماط مخصصة للهيرو */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 6, 1) infinite;
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounceSlow {
          animation: bounceSlow 2s infinite;
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
        
        /* أنماط الهيرو المحسنة */
        .hero-container {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background-color: #000;
          z-index: 10;
        }

        .image-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          cursor: auto; /* إعادة المؤشر الافتراضي */
        }

        .hero-image {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }

        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        /* تحسينات للشاشات المختلفة */
        @media (max-width: 640px) {
          .hero-container img {
            height: 4rem;
          }
          .hero-container p {
            font-size: 1.25rem;
          }
        }
        
        @media (min-width: 641px) and (max-width: 768px) {
          .hero-container img {
            height: 5rem;
          }
          .hero-container p {
            font-size: 1.5rem;
          }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
          .hero-container img {
            height: 6rem;
          }
          .hero-container p {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
} 