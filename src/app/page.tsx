// src/app/page.tsx

"use client"; // هذا السطر ضروري جداً لجعل المكون يعمل على المتصفح (Client-Side)

import Image from 'next/image';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Parallax } from 'swiper/modules';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
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
  HeroSlider as SanityHeroSlider // تم تغيير الاسم لتجنب التعارض
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
    newContentTitle: "المحتوى الجديد",
    newContentDescription: "استكشف أحدث وأهم المحتويات التي نقدمها لك",
    // الوصفوف الديناميكية للأنيميشن
    dynamicDescriptions: [
      "اكتشف عالماً من المعرفة المبسطة والممتعة",
      "تعلم المفاهيم المعقدة بطريقة سهلة ومبسطة",
      "انضم إلى مجتمع المتعلمين والمثقفين",
      "استمتع بمحتوى تعليمي عالي الجودة",
      "طور مهاراتك مع أفضل الشرح والتفصيل",
      "احصل على ملخصات سريعة لأهم الأفكار العلمية",
      "استكشف قصصاً وسيناريوهات تطبيقية للعلم",
      "تعمق في المعرفة بمصادر وروابط موثوقة"
    ],
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
    newContentTitle: "New Content",
    newContentDescription: "Explore the latest and most important content we offer you",
    // Dynamic descriptions for animation
    dynamicDescriptions: [
      "Discover a world of simplified and enjoyable knowledge",
      "Learn complex concepts in an easy and simplified way",
      "Join a community of learners and intellectuals",
      "Enjoy high-quality educational content",
      "Develop your skills with best explanations",
      "Get quick summaries of important scientific ideas",
      "Explore applied stories and scenarios of science",
      "Dive deeper into knowledge with trusted sources"
    ],
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

// مكون أنيميشن الكتابة المحسن
const TypingAnimation = ({ text, className = "", speed = 50, delay = 0 }: { text: string, className?: string, speed?: number, delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const startTyping = () => {
      setIsTyping(true);
      setDisplayedText('');
      setCurrentIndex(0);
      setIsDeleting(false);
    };

    const timeoutId = setTimeout(startTyping, delay);
    return () => clearTimeout(timeoutId);
  }, [text, delay]);

  useEffect(() => {
    if (isTyping && !isDeleting && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, isTyping, isDeleting, text, speed]);

  return (
    <span className={className}>
      {displayedText}
      <span className="inline-block w-0.5 h-5 bg-cyan-400 animate-pulse"></span>
    </span>
  );
};

// مكون تأثير الزهور الخلفية
const FlowerBackground = () => {
  const flowers = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: Math.random() * 30 + 10,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 20 + 10}s`,
      animationDelay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.4 + 0.1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {flowers.map((flower) => (
        <motion.div
          key={flower.id}
          className="absolute rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-500/20 blur-xl"
          style={{
            width: `${flower.size}px`,
            height: `${flower.size}px`,
            left: flower.left,
            top: flower.top,
            opacity: flower.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: parseFloat(flower.animationDuration),
            repeat: Infinity,
            delay: parseFloat(flower.animationDelay),
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// مكون سلايدر المحتوى المميز - صغير جداً وبنسبة 16:9 مع تحسينات
const HeroSliderComponent = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  
  const [sliders, setSliders] = useState<SanityHeroSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSliders = async () => {
      try {
        console.log('Loading featured sliders for language:', language);
        const data = await fetchHeroSliders(language);
        console.log('Featured sliders loaded:', data);
        setSliders(data);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading featured hero sliders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSliders();
  }, [language]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <div className="absolute inset-0 rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  if (sliders.length === 0) {
    console.log('No featured sliders found for language:', language);
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
        <p className="text-white text-xs">{t.noFaqs || 'لا يوجد محتوى مميز حالياً'}</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="w-full h-full max-w-lg"
    >
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
        }}
        onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
        onAutoplayPause={() => setIsPaused(true)}
        onAutoplayResume={() => setIsPaused(false)}
        className="hero-slider w-full h-full"
      >
        {sliders.map((slider, index) => (
          <SwiperSlide key={slider._id} className="relative">
            {/* حاوية بنسبة 16:9 */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0 rounded-lg overflow-hidden shadow-lg">
                {/* الخلفية - تظهر دائماً */}
                {slider.mediaType === 'image' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoaded ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={language === 'ar' 
                        ? (slider.image || '/placeholder.png')
                        : (slider.imageEn || slider.image || '/placeholder.png')
                      }
                      alt={getLocalizedTextEnhanced(slider.title, slider.titleEn, language)}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      onLoad={() => setIsLoaded(true)}
                    />
                  </motion.div>
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
                        <p className="text-gray-500 dark:text-gray-400 text-xs">No video available</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* طبقة التعتيم المحسنة */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                
                {/* المحتوى - يظهر فقط للشريحة النشطة */}
                <AnimatePresence>
                  {activeSlide === index && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.7 }}
                      className="absolute inset-0 flex flex-col justify-end p-2 md:p-3"
                    >
                      <motion.h3 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xs md:text-sm font-bold text-white mb-1 drop-shadow-lg"
                      >
                        {getLocalizedTextEnhanced(slider.title, slider.titleEn, language)}
                      </motion.h3>
                      
                      <motion.p 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-xs text-white/90 mb-2 drop-shadow-md line-clamp-1"
                      >
                        {getLocalizedTextEnhanced(slider.description, slider.descriptionEn, language)}
                      </motion.p>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex gap-1"
                      >
                        {slider.link?.url && slider.link?.text && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Link
                              href={slider.link.url}
                              className="inline-flex items-center gap-1 bg-white text-indigo-600 px-1.5 py-0.5 rounded-full font-bold shadow-lg hover:bg-indigo-50 transition-all duration-300 text-xs"
                            >
                              {getLocalizedTextEnhanced(slider.link.text, slider.link.textEn, language)}
                            </Link>
                          </motion.div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* مؤشر الشرائح - يظهر فقط للشريحة النشطة */}
                {activeSlide === index && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="absolute top-1 right-1 bg-black/30 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded-full"
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
                    className="absolute bottom-1 right-1 bg-black/30 backdrop-blur-sm text-white p-1 rounded-full cursor-pointer"
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? <FaPlay className="text-xs" /> : <FaPause className="text-xs" />}
                  </motion.div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <style jsx global>{`
        .hero-slider .swiper-pagination-bullet {
          background-color: rgba(255, 255, 255, 0.5);
          width: 4px;
          height: 4px;
          opacity: 0.7;
          transition: all 0.3s ease;
        }
        .hero-slider .swiper-pagination-bullet-active {
          background: white;
          width: 12px;
          border-radius: 2px;
          opacity: 1;
        }
      `}</style>
    </motion.div>
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

// مكون الهيرو الجديد مع الفيديو والسلايدر الصغير جداً مع تحسينات
const HeroSection = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  
  const { scrollY } = useScroll();
  const [isMobile, setIsMobile] = useState(false);
  const [currentDescriptionIndex, setCurrentDescriptionIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // تحريك العناصر بناءً على التمرير
  const contentOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const contentY = useTransform(scrollY, [0, 300], [0, -50]);
  
  // الكشف عن حجم الشاشة
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // تغيير الوصف بشكل دوري
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDescriptionIndex((prev) => (prev + 1) % t.dynamicDescriptions.length);
    }, 8000); // تغيير الوصف كل 8 ثواني

    return () => clearInterval(interval);
  }, [t.dynamicDescriptions.length]);
  
  // تحميل العناصر
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="hero-container relative z-10">
      {/* تأثير الزهور الخلفية */}
      <FlowerBackground />
      
      <div className="video-wrapper relative w-full h-screen overflow-hidden">
        {/* الفيديو الخلفية للكمبيوتر أو الصورة للموبايل */}
        {isMobile ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <Image
              src="/heroMM.png"
              alt={t.platformName}
              fill
              className="object-cover"
              priority
              onLoad={() => setIsLoaded(true)}
            />
          </motion.div>
        ) : (
          <motion.video
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 1 }}
            autoPlay
            muted
            loop
            playsInline
            className={`hero-video absolute inset-0 w-full h-full object-cover ${!isRTL ? 'video-mirror' : ''}`}
            src="/hero.mp4"
            poster="/hero.png"
            onLoadedData={() => setIsLoaded(true)}
          />
        )}
        
        {/* طبقة التعتيم الخفيفة */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* المحتوى - مختلف للكمبيوتر والموبايل */}
        <motion.div 
          className="absolute inset-0 flex flex-col p-8 md:p-16"
          style={{
            opacity: contentOpacity,
            y: contentY,
          }}
        >
          {/* في الموبايل: العنوان في الأعلى والسلايدر في الأسفل */}
          {isMobile && (
            <>
              <div className="flex flex-col items-center justify-center text-center text-white mb-12 mt-16">
                <motion.h1
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`text-5xl font-bold mb-6 drop-shadow-lg bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent ${isRTL ? 'font-arabic' : ''}`}
                >
                  {t.platformName}
                </motion.h1>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="text-lg opacity-90 drop-shadow-md h-8"
                >
                  <TypingAnimation 
                    text={t.dynamicDescriptions[currentDescriptionIndex]} 
                    className="text-cyan-200"
                    speed={40}
                    delay={1200}
                  />
                </motion.div>
              </div>

              {/* مساحة مرنة لدفع السلايدر للأسفل */}
              <div className="flex-1"></div>
              
              {/* السلايدر في الموبايل - في الأسفل */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="w-full max-w-lg mx-auto mb-8"
              >
                <HeroSliderComponent />
              </motion.div>
            </>
          )}
          
          {/* في الكمبيوتر: العنوان والوصف والسلايدر متجمعين على الجانب */}
          {!isMobile && (
            <>
              {/* This empty div acts as a spacer to push the content down from the top */}
              <div className="flex-grow"></div>

              {/* This wrapper will contain both the title and the slider. Using justify-start and items-start to rely on browser's RTL/LTR behavior. Added mt-16 for top spacing. */}
              <div className="w-full flex justify-start mt-4 mb-16">
                {/* This group contains the title and slider, aligned vertically */}
                <div className="max-w-lg flex flex-col items-start">
                  {/* Wrapper for title and description to center them horizontally */}
                  <div className="w-full text-center mb-6">
                    <motion.h1
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent ${isRTL ? 'font-arabic' : ''}`}
                    >
                      {t.platformName}
                    </motion.h1>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="text-base md:text-lg opacity-90 drop-shadow-md h-6"
                    >
                      <TypingAnimation 
                        text={t.dynamicDescriptions[currentDescriptionIndex]} 
                        className="text-cyan-200"
                        speed={40}
                        delay={1200}
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="w-full"
                  >
                    <HeroSliderComponent />
                  </motion.div>
                </div>
              </div>
            </>
          )}
          
          {/* زر التمرير لأسفل */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="cursor-pointer"
              onClick={() => {
                window.scrollTo({
                  top: window.innerHeight,
                  behavior: 'smooth'
                });
              }}
            >
              <FaChevronDown className="text-2xl" />
            </motion.div>
          </motion.div>
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
      {/* ====== HERO مع الفيديو والسلايدر الصغير جداً ====== */}
      <HeroSection />
      
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
        
        /* أنماط الهيرو المحسنة مع الفيديو */
        .hero-container {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background-color: #000;
          z-index: 10;
        }

        .video-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .hero-video {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }
        
        /* إضافة كلاس لعكس الفيديو في اللغة الإنجليزية */
        .video-mirror {
          transform: scaleX(-1);
        }
        
        /* تحسين الخط العربي */
        .font-arabic {
          font-family: 'Noto Kufi Arabic', 'Cairo', sans-serif;
          letter-spacing: 0.02em;
        }
        
        /* تحسينات الأنيميشن */
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
}