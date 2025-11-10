// src/app/page.tsx

"use client";

import Image from 'next/image';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useSession } from 'next-auth/react';
import "swiper/css";
import "swiper/css/pagination";

// استيراد الأيقونات المستخدمة فقط
import {
  FaYoutube,
  FaInstagram,
  FaFacebookF,
  FaTiktok,
} from 'react-icons/fa';

// استيراد دوال Sanity
import { 
  fetchHeroSliders
} from '@/lib/sanity';

// استيراد الأنواع
import { 
  HeroSlider as SanityHeroSlider 
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
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return youtubeMatch[1];
  }
  
  const vimeoRegex = /vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return vimeoMatch[1];
  }
  
  return null;
}

// دالة محسنة للحصول على النص المترجم
function getLocalizedTextEnhanced(arText?: string, enText?: string, language?: string): string {
  if (language === 'en') {
    return enText || arText || '';
  }
  return arText || enText || '';
}

// === مكون أنيميشن الكتابة مع أنيميشن حذف محسّن ===
const TypingAnimation = ({ text, className = "", speed = 50, deleteSpeed = 25, initialDelay = 0 }: { text: string, className?: string, speed?: number, deleteSpeed?: number, initialDelay?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [targetText, setTargetText] = useState(text);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // التأثير الأولي لبدء الأنيميشن
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setTargetText(text);
      setHasStarted(true);
    }, initialDelay);
    return () => clearTimeout(startTimeout);
  }, [initialDelay]);

  // التأثير الذي يستمع لتغيير الـ `text` prop
  useEffect(() => {
    if (!hasStarted) return;
    if (text === targetText) return;

    // إذا كان النص الجديد هو استمرار للنص الحالي، فقط استمر في الكتابة
    if (!isDeleting && text.startsWith(displayedText)) {
      setTargetText(text);
    } else {
      // وإلا، ابدأ عملية الحذف
      setIsDeleting(true);
    }
  }, [text, targetText, isDeleting, displayedText, hasStarted]);

  // التأثير الرئيسي للكتابة والحذف
  useEffect(() => {
    if (!hasStarted) return;

    const handleTick = () => {
      setDisplayedText(current => {
        if (isDeleting) {
          // عملية الحذف
          if (current.length > 0) {
            return current.substring(0, current.length - 1);
          }
        } else {
          // عملية الكتابة
          if (current.length < targetText.length) {
            return targetText.substring(0, current.length + 1);
          }
        }
        return current;
      });
    };

    const currentSpeed = isDeleting ? deleteSpeed : speed;
    const timeout = setTimeout(handleTick, currentSpeed);
    return () => clearTimeout(timeout);
  }, [displayedText, targetText, isDeleting, speed, deleteSpeed, hasStarted]);

  // التأثير الذي يتحقق من نهاية الحذف لبدء الكتابة الجديدة
  useEffect(() => {
    if (isDeleting && displayedText === '') {
      setIsDeleting(false);
      setTargetText(text); // حدد النص الهدف الجديد بعد انتهاء الحذف
    }
  }, [isDeleting, displayedText, text]);

  return (
    <span className={className}>
      {displayedText}
      {(isDeleting || displayedText.length < targetText.length) && (
        <span className="inline-block w-0.5 h-5 bg-cyan-400 animate-pulse"></span>
      )}
    </span>
  );
};


// مكون سلايدر المحتوى المميز - بدون أنيميشن وبدون واجهة يوتيوب
const HeroSliderComponent = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  
  const [sliders, setSliders] = useState<SanityHeroSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <div className="w-full h-full max-w-lg">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: isMobile ? 7000 : 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
        className="hero-slider w-full h-full"
      >
        {sliders.map((slider, index) => (
          <SwiperSlide key={slider._id} className="relative">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0 rounded-lg overflow-hidden shadow-lg">
                {slider.mediaType === 'image' && (
                  <div className="absolute inset-0">
                    <Image
                      src={language === 'ar' 
                        ? (slider.image || '/placeholder.png')
                        : (slider.imageEn || slider.image || '/placeholder.png')
                      }
                      alt={getLocalizedTextEnhanced(slider.title, slider.titleEn, language)}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                
                {slider.mediaType === 'video' && (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    {slider.videoUrl ? (
                      <>
                        {slider.videoUrl.includes('youtube.com') || slider.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${extractVideoId(slider.videoUrl)}?autoplay=1&mute=1&loop=1&playlist=${extractVideoId(slider.videoUrl)}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&cc_load_policy=0&fs=0&playsinline=1&disablekb=1`}
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
                            preload="metadata"
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
                
                {/* طبقة التعتيم */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                
                {/* المحتوى فوق السلايدر */}
                <div className="absolute inset-0 flex flex-col justify-end p-2 md:p-3">
                  <h3 className="text-xs md:text-sm font-bold text-white mb-1 drop-shadow-lg">
                    {getLocalizedTextEnhanced(slider.title, slider.titleEn, language)}
                  </h3>
                  
                  <p className="text-xs text-white/90 mb-2 drop-shadow-md line-clamp-1">
                    {getLocalizedTextEnhanced(slider.description, slider.descriptionEn, language)}
                  </p>
                  
                  <div className="flex gap-1">
                    {slider.link?.url && slider.link?.text && (
                      <Link
                        href={slider.link.url}
                        className="inline-flex items-center gap-1 bg-white text-indigo-600 px-1.5 py-0.5 rounded-full font-bold shadow-lg hover:bg-indigo-50 transition-all duration-300 text-xs"
                      >
                        {getLocalizedTextEnhanced(slider.link.text, slider.link.textEn, language)}
                      </Link>
                    )}
                  </div>
                </div>
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
    </div>
  );
};

// مكون الهيرو - تم تعديله لإخفاء السلايدر على الموبايل
const HeroSection = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const [isMobile, setIsMobile] = useState(false);
  const [currentDescriptionIndex, setCurrentDescriptionIndex] = useState(0);
  
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
    }, isMobile ? 6000 : 4000);

    return () => clearInterval(interval);
  }, [t.dynamicDescriptions.length, isMobile]);
  
  return (
    <div className="hero-container relative z-10">
      <div className="video-wrapper relative w-full h-screen overflow-hidden">
        {isMobile ? (
          <div className="absolute inset-0">
            <Image
              src="/heroMM.png"
              alt={t.platformName}
              fill
              className="object-cover"
              priority
              sizes="100vw"
              quality={85}
            />
          </div>
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            className={`hero-video absolute inset-0 w-full h-full object-cover ${!isRTL ? 'video-mirror' : ''}`}
            src="/hero.mp4"
            poster="/hero.png"
            preload="metadata"
          />
        )}
        
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="absolute inset-0 flex flex-col p-8 md:p-16">
          {isMobile && (
            <>
              <div className="flex flex-col items-center justify-center text-center text-white mb-12 mt-16">
                <h1 className={`hero-title text-5xl font-bold mb-6 ${isRTL ? 'font-arabic' : ''}`}>
                  {t.platformName}
                </h1>
                
                <div className="text-lg opacity-90 drop-shadow-md h-8">
                  <TypingAnimation 
                    text={t.dynamicDescriptions[currentDescriptionIndex]} 
                    className="hero-description"
                    speed={40}
                    deleteSpeed={20}
                    initialDelay={500}
                  />
                </div>
              </div>

              {/* تم حذف السلايدر من هنا على الموبايل */}
            </>
          )}
          
          {!isMobile && (
            <>
              <div className="flex-grow"></div>

              <div className="w-full flex justify-start mt-4 mb-16">
                <div className="max-w-lg flex flex-col items-start">
                  <div className="w-full text-center mb-6">
                    <h1 className={`hero-title text-3xl md:text-4xl font-bold mb-4 ${isRTL ? 'font-arabic' : ''}`}>
                      {t.platformName}
                    </h1>
                    
                    <div className="text-base md:text-lg opacity-90 drop-shadow-md h-6">
                      <TypingAnimation 
                        text={t.dynamicDescriptions[currentDescriptionIndex]} 
                        className="hero-description"
                        speed={40}
                        deleteSpeed={20}
                        initialDelay={500}
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <HeroSliderComponent />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// === القسم الجديد "ما الجديد" مع خلفية الصورة ===
const NewContentSection = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];

  return (
    <section className="relative w-full py-16 md:py-24">
      {/* خلفية الصورة */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/A.png"
          alt={t.newContentTitle}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {/* طبقة تعتيم لجعل النص مقروء */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* المحتوى */}
      <div className="relative z-10 container mx-auto px-4 md:px-8">
        <div className="text-center">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isRTL ? 'font-arabic' : ''} hero-title`}>
            {t.newContentTitle}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto mb-8 md:mb-12"></div>
          <div className="w-full max-w-4xl mx-auto">
            <HeroSliderComponent />
          </div>
        </div>
      </div>
    </section>
  );
};

// مكون قسم "من نحن" - بدون أنيميشن
const AboutSection = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        {isMobile ? (
          <div className="absolute inset-0">
            <Image
              src="/RM.png"
              alt={t.aboutUs}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src="/R.mp4"
            poster="/RM.png"
          />
        )}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 md:px-8 h-full flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-3xl md:text-5xl font-bold text-white mb-6 ${isRTL ? 'font-arabic' : ''}`}>
            {t.aboutUs}
          </h2>
          
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto mb-8"></div>
          
          <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-8">
            {t.aboutUsMessage}
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
              {t.knowMore}
            </button>
            
            <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-white/30 transition-all duration-300">
              {t.contactUs}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { language, isRTL } = useLanguage();
  const { data: session } = useSession();
  
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className="antialiased bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <HeroSection />
      {isMobile && <NewContentSection />} {/* يظهر فقط على الموبايل */}
      <AboutSection />
      
      <style jsx global>{`
        /* أنماط الهيرو */
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
        
        .video-mirror {
          transform: scaleX(-1);
        }
        
        .font-arabic {
          font-family: 'Noto Kufi Arabic', 'Cairo', sans-serif;
          letter-spacing: 0.02em;
        }
        
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        /* === أنماط العنوان والوصف الجديدة === */
        .hero-title {
          background: linear-gradient(90deg, #22d3ee, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 2px 2px 0px rgba(59, 130, 246, 0.5), 4px 4px 0px rgba(0, 0, 0, 0.3);
        }

        .hero-description {
          background: linear-gradient(90deg, #a5f3fc, #93c5fd);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}