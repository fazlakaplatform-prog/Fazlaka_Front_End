// src/app/page.tsx
"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { useSession } from 'next-auth/react';
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// استيراد الأيقونات المستخدمة فقط
import {
  FaYoutube,
  FaInstagram,
  FaFacebookF,
  FaTiktok,
  FaQuestionCircle,
  FaPlay,
  FaVideo,
  FaUsers,
  FaGlobe,
  FaUser,
  FaPaperPlane,
  FaComments,
  FaArrowLeft,
  FaBookmark,
  FaFire,
  FaRocket,
  FaCrown,
  FaPause,
} from 'react-icons/fa';

// استيراد دوال Sanity
// ملاحظة: نستورد دوال جلب البيانات فقط. دالة getLocalizedText لا يتم استيرادها من هنا
// لأن المكون يستخدم دالة داخلية خاصة به (getLocalizedTextEnhanced) لتجنب الاعتماديات الخارجية.
import { 
  fetchEpisodes,
  fetchArticles,
  fetchFaqs,
  fetchHeroSliders
} from '@/lib/sanity';

// استيراد الأنواع
import { 
  Episode, 
  Article, 
  HeroSlider
} from '@/lib/sanity';

// استيراد FAQ من ملفه المباشر
import { FAQ } from '@/lib/sanity/faqs';

import { useLanguage } from '@/components/LanguageProvider';

// تعريفات واجهات البيانات
interface EpisodeData {
  _id: string;
  title?: string;
  titleEn?: string;
  slug: { current: string };
  description?: string;
  descriptionEn?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  season?: {
    _id: string;
    title?: string;
    titleEn?: string;
    slug: { current: string };
  };
  language?: string;
}

interface ArticleData {
  _id: string;
  title?: string;
  titleEn?: string;
  slug: { current: string };
  excerpt?: string;
  excerptEn?: string;
  publishedAt?: string;
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  category?: string;
  categoryEn?: string;
  language?: string;
}

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
    features: [
      { icon: <FaVideo className="text-xl" />, title: 'حلقات عميقة', desc: 'شرح مبسط ومعمق' },
      { icon: <FaUsers className="text-xl" />, title: 'أسلوب قصصي', desc: 'سرد يشد الانتباه' },
      { icon: <FaGlobe className="text-xl" />, title: 'تنوع الموضوعات', desc: 'تاريخ، سياسة، علم نفس' }
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
    // إضافة ترجمات جديدة للأقسام المحسنة
    ourStory: "قصتنا",
    ourStorySubtitle: "رحلة من المعرفة إلى الإلهام",
    ourMission: "مهمتنا",
    ourMissionDesc: "نحول المفاهيم المعقدة إلى قصص بسيطة ومفهومة",
    ourVision: "رؤيتنا",
    ourVisionDesc: "بناء مجتمع متعلم ومثقف حول العالم",
    ourValues: "قيمنا",
    quality: "الجودة",
    qualityDesc: "نقدم محتوى عالي الجودة وموثوق",
    innovation: "الابتكار",
    innovationDesc: "نستخدم أساليب مبتكرة في الشرح",
    community: "المجتمع",
    communityDesc: "نبني مجتمعاً متعلماً ومتفاعلاً",
    subscribeTitle: "انضم إلى عالم المعرفة",
    subscribeSubtitle: "احصل على وصول غير محدود إلى جميع المحتويات",
    subscribeBenefits: "مميزات الاشتراك",
    benefit1: "وصول كامل لجميع الحلقات",
    benefit2: "محتوى حصري للمشتركين",
    benefit3: "تحميل الفيديوهات للمشاهدة بدون إنترنت",
    benefit4: "وصول مبكر للمحتوى الجديد",
    benefit5: "دعم فني على مدار الساعة",
    benefit6: "رسائل وتعليقات وتفاعل مباشر",
    communityTitle: "كن جزءاً من مجتمعنا",
    communitySubtitle: "انضم الي عالم العلم الممتع",
    communityFeatures: "مميزات المجتمع",
    communityFeature1: "منتديات نقاش تفاعلية",
    communityFeature2: "نقدر ارائك وتفاعلك",
    communityFeature3: "مشاركة المعرفة مع الآخرين",
    testimonial1: "فذلَكة غيرت طريقة تعلمي تماماً، المحتوى مميز والشرح بسيط ومفهوم",
    testimonial2: "أفضل منصة تعليمية استخدمتها، أنصح بها بشدة لكل من يبحث عن المعرفة",
    testimonial3: "المجتمع هنا رائع، تعلمت الكثير وشاركت معرفة مع الآخرين",
    getStarted: "ابدأ الآن",
    joinNow: "انضم الآن",
    learnMoreAboutUs: "اعرف المزيد عنا",
    downloadApp: "حمل التطبيق",
    availableOn: "متاح على",
    comingSoon: "قريباً",
    stayConnected: "ابق على تواصل",
    subscribeNewsletter: "اشترك في نشرتنا البريدية",
    enterEmail: "أدخل بريدك الإلكتروني",
    subscribe: "اشترك",
    followUsSocial: "تابعنا على وسائل التواصل الاجتماعي",
    quickLinks: "روابط سريعة",
    support: "الدعم",
    resources: "المصادر",
    legal: "قانوني",
    privacyPolicy: "سياسة الخصوصية",
    termsOfService: "شروط الخدمة",
    cookiePolicy: "سياسة ملفات تعريف الارتباط",
    accessibility: "إمكانية الوصول",
    sitemap: "خريطة الموقع",
    contactSupport: "تواصل مع الدعم",
    helpCenter: "مركز المساعدة",
    systemStatus: "حالة النظام",
    documentation: "التوثيق",
    apiReference: "مرجع API",
    blog: "المدونة",
    podcast: "البودكاست",
    events: "الفاعليات",
    careers: "الوظائف",
    press: "الصحافة",
    partners: "الشركاء",
    affiliates: "الفرعيين",
    investors: "المستثمرون",
    awards: "الجوائز",
    recognition: "التقدير",
    mediaKit: "حقيبة الإعلام",
    brandGuidelines: "إرشادات العلامة التجارية",
    // إضافة ترجمات للقسم الموحد الجديد
    joinKnowledgeWorld: "انضم إلى عالم المعرفة والمجتمع",
    joinKnowledgeSubtitle: "اكتشف محتوى تعليمي مميز وتفاعل مع مجتمع متعلم",
    exclusiveBenefits: "مميزات حصرية",
    communityEngagement: "تفاعل مجتمعي",
    whatOurMembersSay: "ماذا يقول أعضاؤنا",
    startYourJourney: "ابدأ رحلتك الآن",
    becomeMember: "كن عضواً",
    alreadyMember: "عضو بالفعل؟",
    signInAccount: "سجل دخولك",
    unlockPremium: "فتح المحتوى المميز",
    accessAllContent: "الوصول لكل المحتوى",
    connectWithLearners: "تواصل مع المتعلمين",
    shareYourKnowledge: "شارك معرفتك",
    growTogether: "نمواً معاً",
    exclusiveContent: "محتوى حصري",
    earlyAccess: "وصول مبكر",
    directSupport: "دعم مباشر",
    interactiveForums: "منتديات تفاعلية",
    expertSessions: "  محتوي تعليمي راقي ومسلي",
    networking: "تواصل وبناء علاقات",
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
    contactUsMessage: "Do you have questions or inquiries? We are here to help you. Browse the frequently asked questions or contact us directly.",
    commonQuestions: "Frequently Asked Questions",
    allQuestions: "All Questions",
    whySubscribe: "Why Subscribe to fazlaka?",
    whySubscribePoints: [
      'Quick summaries of basic hypotheses and ideas.',
      'Stories and scenarios to help you apply the idea practically.',
      'Sources and links if you want to dive deeper.'
    ],
    features: [
      { icon: <FaVideo className="text-xl" />, title: 'In-depth Episodes', desc: 'Simplified and detailed explanation' },
      { icon: <FaUsers className="text-xl" />, title: 'Storytelling Style', desc: 'Engaging narrative' },
      { icon: <FaGlobe className="text-xl" />, title: 'Diverse Topics', desc: 'History, politics, psychology' }
    ],
    aboutUs: "About Us",
    aboutUsMessage: "We are an educational platform that offers distinctive entertainment and educational content. We continuously work on improving the experience and providing the latest episodes and playlists.",
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
    heroDescription: "Check out the latest content and events we offer you",
    noFaqs: "No FAQs available at the moment",
    noFaqsMessage: "They will be added soon",
    noQuestion: "No question available",
    noAnswer: "No answer available",
    featuredContent: "Featured Content",
    featuredDescription: "Explore the latest and most important content we offer you",
    // إضافة ترجمات جديدة للأقسام المحسنة
    ourStory: "Our Story",
    ourStorySubtitle: "A journey from knowledge to inspiration",
    ourMission: "Our Mission",
    ourMissionDesc: "We transform complex concepts into simple and understandable stories",
    ourVision: "Our Vision",
    ourVisionDesc: "Building an educated and interactive community worldwide",
    ourValues: "Our Values",
    quality: "Quality",
    qualityDesc: "We provide high-quality and reliable content",
    innovation: "Innovation",
    innovationDesc: "We use innovative methods in explanation",
    community: "Community",
    communityDesc: "We build an educated and interactive community",
    subscribeTitle: "Join the World of Knowledge",
    subscribeSubtitle: "Get unlimited access to all content",
    subscribeBenefits: "Subscription Benefits",
    benefit1: "Full access to all episodes",
    benefit2: "Exclusive content for subscribers",
    benefit3: "Download videos for offline viewing",
    benefit4: "Early access to new content",
    benefit5: "24/7 technical support",
    benefit6: "Direct messages, comments and interaction",
    communityTitle: "Be Part of Our Community",
    communitySubtitle: "Join the exciting world of science",
    communityFeatures: "Community Features",
    communityFeature1: "Interactive discussion forums",
    communityFeature2: "We appreciate your opinions and interaction.",
    communityFeature3: "Share knowledge with others",
    testimonial1: "Fazlaka completely changed the way I learn, the content is excellent and the explanation is simple and understandable",
    testimonial2: "The best educational platform I've used, I highly recommend it to anyone looking for knowledge",
    testimonial3: "The community here is amazing, I learned a lot and shared knowledge with others",
    getStarted: "Get Started",
    joinNow: "Join Now",
    learnMoreAboutUs: "Learn More About Us",
    downloadApp: "Download App",
    availableOn: "Available on",
    comingSoon: "Coming Soon",
    stayConnected: "Stay Connected",
    subscribeNewsletter: "Subscribe to our newsletter",
    enterEmail: "Enter your email",
    subscribe: "Subscribe",
    followUsSocial: "Follow us on social media",
    quickLinks: "Quick Links",
    support: "Support",
    resources: "Resources",
    legal: "Legal",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    cookiePolicy: "Cookie Policy",
    accessibility: "Accessibility",
    sitemap: "Sitemap",
    contactSupport: "Contact Support",
    helpCenter: "Help Center",
    systemStatus: "System Status",
    documentation: "Documentation",
    apiReference: "API Reference",
    blog: "Blog",
    podcast: "Podcast",
    events: "Events",
    careers: "Careers",
    press: "Press",
    partners: "Partners",
    affiliates: "Affiliates",
    investors: "Investors",
    awards: "Awards",
    recognition: "Recognition",
    mediaKit: "Media Kit",
    brandGuidelines: "Brand Guidelines",
    // إضافة ترجمات للقسم الموحد الجديد
    joinKnowledgeWorld: "Join the World of Knowledge and Community",
    joinKnowledgeSubtitle: "Discover premium educational content and interact with a learning community",
    exclusiveBenefits: "Exclusive Benefits",
    communityEngagement: "Community Engagement",
    whatOurMembersSay: "What Our Members Say",
    startYourJourney: "Start Your Journey Now",
    becomeMember: "Become a Member",
    alreadyMember: "Already a member?",
    signInAccount: "Sign in to your account",
    unlockPremium: "Unlock Premium Content",
    accessAllContent: "Access All Content",
    connectWithLearners: "Connect with Learners",
    shareYourKnowledge: "Share Your Knowledge",
    growTogether: "Grow Together",
    exclusiveContent: "Exclusive Content",
    earlyAccess: "Early Access",
    directSupport: "Direct Support",
    interactiveForums: "Interactive Forums",
    expertSessions: "High-quality and entertaining educational content",
    networking: "Networking",
  }
};

// متغيرات الحركة المحسنة للعناصر
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, when: "beforeChildren" },
  },
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

// مكون السؤال المتحرك - محسن بالكامل
const AnimatedQuestion = ({ question, questionEn, answer, answerEn, index }: { 
  question?: string; 
  questionEn?: string; 
  answer?: string; 
  answerEn?: string; 
  index: number 
}) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[language];
  
  // استخدام الدالة المحسنة للحصول على النصوص
  const localizedQuestion = getLocalizedTextEnhanced(question, questionEn, language);
  const localizedAnswer = getLocalizedTextEnhanced(answer, answerEn, language);
  
  // التحقق من وجود محتوى
  const hasValidContent = localizedQuestion && localizedQuestion.trim() !== '';
  const hasValidAnswer = localizedAnswer && localizedAnswer.trim() !== '';
  
  // إذا لم يوجد محتوى، لا تعرض الكرت
  if (!hasValidContent) {
    return null;
  }
  
  // تحديد الألوان بناءً على الفهرس
  const colorSchemes = [
    { bg: 'bg-gradient-to-r from-blue-500 to-cyan-600', border: 'border-blue-200 dark:border-blue-800/50', hover: 'hover:border-blue-300 dark:hover:border-blue-700', icon: 'text-blue-500', iconBg: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50', shadow: 'shadow-blue-500/20 dark:shadow-blue-600/30' },
    { bg: 'bg-gradient-to-r from-purple-500 to-pink-600', border: 'border-purple-200 dark:border-purple-800/50', hover: 'hover:border-purple-300 dark:hover:border-purple-700', icon: 'text-purple-500', iconBg: 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/50', shadow: 'shadow-purple-500/20 dark:shadow-purple-600/30' },
    { bg: 'bg-gradient-to-r from-green-500 to-teal-600', border: 'border-green-200 dark:border-green-800/50', hover: 'hover:border-green-300 dark:hover:border-green-700', icon: 'text-green-500', iconBg: 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/50', shadow: 'shadow-green-500/20 dark:shadow-green-600/30' },
    { bg: 'bg-gradient-to-r from-yellow-500 to-orange-600', border: 'border-yellow-200 dark:border-yellow-800/50', hover: 'hover:border-yellow-300 dark:hover:border-yellow-700', icon: 'text-yellow-500', iconBg: 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/50', shadow: 'shadow-yellow-500/20 dark:shadow-yellow-600/30' },
    { bg: 'bg-gradient-to-r from-red-500 to-rose-600', border: 'border-red-200 dark:border-red-800/50', hover: 'hover:border-red-300 dark:hover:border-red-700', icon: 'text-red-500', iconBg: 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50', shadow: 'shadow-red-500/20 dark:shadow-red-600/30' },
    { bg: 'bg-gradient-to-r from-indigo-500 to-blue-600', border: 'border-indigo-200 dark:border-indigo-800/50', hover: 'hover:border-indigo-300 dark:hover:border-indigo-700', icon: 'text-indigo-500', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/50', shadow: 'shadow-indigo-500/20 dark:shadow-indigo-600/30' },
  ];
  
  const colorScheme = colorSchemes[index % colorSchemes.length];
  
  return (
    <motion.div 
      variants={faqItemVariants}
      className={`border-2 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 backdrop-blur-sm transition-all duration-300 ${colorScheme.border} ${colorScheme.hover} shadow-lg hover:shadow-xl dark:${colorScheme.shadow} hover:dark:shadow-2xl`}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      {/* قسم السؤال */}
      <motion.div 
        className={`p-6 cursor-pointer font-bold text-lg flex items-center gap-4 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${colorScheme.iconBg} transition-all duration-300`}>
          <FaQuestionCircle className={`text-xl ${colorScheme.icon}`} />
        </div>
        <span className={`text-lg ${language === 'ar' ? 'text-right' : 'text-left'} flex-grow`}>
          {localizedQuestion || t.noQuestion}
        </span>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={`flex-shrink-0 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
      
      {/* فاصل بين السؤال والإجابة */}
      <div className={`h-px ${colorScheme.bg} opacity-20`}></div>
      
      {/* قسم الإجابة */}
      <motion.div 
        variants={answerVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className="overflow-hidden"
      >
        <div className={`p-6 text-gray-700 dark:text-gray-300 overflow-hidden ${language === 'ar' ? 'pr-16 pl-6' : 'pl-16 pr-6'} text-base leading-relaxed`}>
          {hasValidAnswer ? (
            hasHtml(localizedAnswer) ? (
              <div dangerouslySetInnerHTML={{ __html: localizedAnswer }} />
            ) : (
              <p>{localizedAnswer}</p>
            )
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">{t.noAnswer}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// مكون بطاقة الحلقة - محسن للتعامل مع الصور URL
const EpisodeCard = ({ episode }: { episode: EpisodeData }) => {
  const { language } = useLanguage();
  const t = translations[language];
  
  // استخدام الدالة الجديدة للحصول على رابط الصورة
  const imageUrl = language === 'ar' 
    ? (episode.thumbnailUrl || "/placeholder.png")
    : (episode.thumbnailUrlEn || episode.thumbnailUrl || "/placeholder.png");
    
  const title = getLocalizedTextEnhanced(episode.title, episode.titleEn, language);
  const description = getLocalizedTextEnhanced(episode.description, episode.descriptionEn, language);
    
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10 -5px rgba(59, 130, 246, 0.2)" }}
      className="card relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col dark:shadow-blue-900/20 hover:dark:shadow-blue-900/40"
    >
      <Link href={`/episodes/${encodeURIComponent(String(episode.slug.current))}`} className="block flex-grow flex flex-col">
        <div className="relative h-48 md:h-56 overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.png";
            }}
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
          
          {description && (
            <p 
              className="text-gray-600 dark:text-gray-400 mb-4 text-sm"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {description}
            </p>
          )}
          
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {t.episode}
              </span>
              {episode.publishedAt && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(episode.publishedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// مكون بطاقة المقال - محسن للتعامل مع الصور URL
const ArticleCard = ({ article }: { article: ArticleData }) => {
  const { language } = useLanguage();
  const t = translations[language];
  
  // استخدام الدالة الجديدة للحصول على رابط الصورة
  const imageUrl = language === 'ar' 
    ? (article.featuredImageUrl || "/placeholder.png")
    : (article.featuredImageUrlEn || article.featuredImageUrl || "/placeholder.png");
    
  const title = getLocalizedTextEnhanced(article.title, article.titleEn, language);
  const excerpt = getLocalizedTextEnhanced(article.excerpt, article.excerptEn, language);
  const category = getLocalizedTextEnhanced(article.category, article.categoryEn, language);
    
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(147, 51, 234, 0.3), 0 10px 10 -5px rgba(147, 51, 234, 0.2)" }}
      className="card relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col dark:shadow-purple-900/20 hover:dark:shadow-purple-900/40"
    >
      <Link href={`/articles/${encodeURIComponent(String(article.slug.current))}`} className="block flex-grow flex flex-col">
        <div className="relative h-48 md:h-56 overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.png";
            }}
          />
          {category && (
            <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              {category}
            </div>
          )}
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
          
          {excerpt && (
            <p 
              className="text-gray-600 dark:text-gray-400 mb-4 text-sm"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {excerpt}
            </p>
          )}
          
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                {t.article}
              </span>
              {article.publishedAt && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(article.publishedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// مكون سلايدر المحتوى المميز - محسن بالكامل
const FeaturedContentSlider = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  
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

  if (loading) {
    return (
      <div className="w-full h-64 md:h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (sliders.length === 0) {
    console.log('No featured sliders found for language:', language);
    return null;
  }

  return (
    <section className="relative py-12 md:py-20 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* خلفية متدرجة جذابة مع عناصر زخرفية */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 z-0"></div>
      
      {/* عناصر زخرفية متحركة */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-200/10 dark:bg-indigo-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      
      <div className="max-w-7xl mx-auto relative z-10 px-4 md:px-8">
        {/* عنوان القسم */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full mb-4 shadow-lg"
          >
            <FaFire className="text-yellow-300" />
            <span className="font-bold">{t.featuredContent}</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t.discover}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg"
          >
            {t.featuredDescription}
          </motion.p>
        </motion.div>
        
        {/* السلايدر المحسن مع الظل */}
        <div className="relative">
          {/* الظل الأزرق والبنفسجي تحت السلايدر */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-6xl h-12 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 blur-2xl rounded-full"></div>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-5xl h-8 bg-gradient-to-r from-blue-400/15 via-purple-400/15 to-indigo-400/15 blur-xl rounded-full"></div>
          
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
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
              navigation={{
                nextEl: '.featured-button-next',
                prevEl: '.featured-button-prev',
              }}
              onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
              onAutoplayPause={() => setIsPaused(true)}
              onAutoplayResume={() => setIsPaused(false)}
              className="featured-slider overflow-hidden"
              style={{
                height: '0',
                paddingBottom: '56.25%', // نسبة 16:9
                maxHeight: '600px',
              }}
            >
              {sliders.map((slider, index) => (
                <SwiperSlide key={slider._id} className="relative pb-[56.25%]">
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
                          className="absolute inset-0 flex items-center justify-center p-6 md:p-10"
                        >
                          <div className="w-full max-w-4xl text-center">
                            <motion.h2 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg"
                            >
                              {getLocalizedTextEnhanced(slider.title, slider.titleEn, language)}
                            </motion.h2>
                            
                            <motion.p 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                              className="text-base md:text-lg lg:text-xl text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto drop-shadow-md"
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
                                    className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 md:px-8 md:py-4 rounded-full font-bold shadow-lg hover:bg-indigo-50 transition-all duration-300 text-base md:text-lg"
                                  >
                                    {getLocalizedTextEnhanced(slider.link.text, slider.link.textEn, language)}
                                    <FaArrowLeft className="transform rotate-180" />
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
            
            {/* أزرار التنقل المخصصة */}
            <div className="featured-button-next absolute top-1/2 right-4 z-20 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-all duration-300 transform -translate-y-1/2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="featured-button-prev absolute top-1/2 left-4 z-20 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-all duration-300 transform -translate-y-1/2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
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
            padding-bottom: 56.25% !important; /* نسبة 16:9 */
          }
          
          .featured-button-next,
          .featured-button-prev {
            width: 40px;
            height: 40px;
          }
          
          .featured-button-next {
            right: 10px;
          }
          
          .featured-button-prev {
            left: 10px;
          }
          
          /* تحسين العناوين والأيقونات في الموبايل */
          .featured-slider .text-2xl {
            font-size: 1.5rem;
          }
          
          .featured-slider .text-4xl {
            font-size: 2rem;
          }
          
          .featured-slider .text-5xl {
            font-size: 2.5rem;
          }
          
          .featured-slider .text-base {
            font-size: 0.9rem;
          }
          
          .featured-slider .text-lg {
            font-size: 1rem;
          }
          
          .featured-slider .text-xl {
            font-size: 1.1rem;
          }
          
          .featured-slider .px-6 {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .featured-slider .py-3 {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
          }
          
          .featured-slider .px-8 {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
          
          .featured-slider .py-4 {
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
          
          .featured-slider .text-lg {
            font-size: 1rem;
          }
          
          .featured-slider .text-xl {
            font-size: 1.1rem;
          }
          
          .featured-slider .text-2xl {
            font-size: 1.5rem;
          }
          
          .featured-slider .text-4xl {
            font-size: 2rem;
          }
          
          .featured-slider .text-5xl {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </section>
  );
};

// مكون القسم الموحد الجديد - يجمع بين الاشتراك والمجتمع مع تحسينات شاملة
const UnifiedMembershipSection = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const { data: session } = useSession();
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.5, 1], ["2rem", "1.5rem", "2rem"]);
  
  return (
    <section className="relative py-20 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* خلفية متدرجة متحركة مع تأثيرات متقدمة */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 z-0"></div>
      
      {/* عناصر زخرفية متحركة مع أنيميشن متقدم */}
      <motion.div 
        className="absolute top-20 right-10 w-72 h-72 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
          x: [0, -20, 0],
          y: [0, 20, 0]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      <motion.div 
        className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, 30, 0],
          y: [0, -30, 0]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      {/* شبكة علمية متحركة */}
      <motion.div 
        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMC41IiBmaWxsPSIjODA4MGZmIiBvcGFjaXR5PSIwLjE1IiAvPgo8L3N2Zz4=')] opacity-20 dark:opacity-10"
        style={{ scale }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* عنوان القسم الرئيسي مع أنيميشن متقدم */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full mb-6 shadow-lg"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 10px 25px -5px rgba(147, 51, 234, 0.5)",
                transition: { duration: 0.2 }
              }}
            >
              <FaCrown className="text-xl" />
              <span className="text-lg font-bold">{t.joinKnowledgeWorld}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t.joinKnowledgeSubtitle}
            </motion.h2>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-600 mx-auto rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: "6rem" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </motion.div>
          
          {/* قسم المستخدم المسجل/غير المسجل مع أنيميشن متقدم */}
          {session ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-1 shadow-2xl mb-16"
              style={{ borderRadius }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.5)",
                transition: { duration: 0.3 }
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12">
                <div className="flex flex-col items-center gap-8">
                  {/* نص الترحيب */}
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {t.welcome} {session.user?.name || t.noUser}!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                      {t.welcomeMessage}
                    </p>
                  </motion.div>
                  
                  {/* الصورة تحت نص الترحيب */}
                  <motion.div 
                    className="flex-shrink-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: [0, 5, -5, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    {session.user?.image ? (
                      <Image 
                        src={session.user.image} 
                        alt={session.user.name || "المستخدم"} 
                        width={120}
                        height={120}
                        className="w-32 h-32 rounded-full border-4 border-indigo-200 dark:border-indigo-800 shadow-xl object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                        {session.user?.name?.[0] || "U"}
                      </div>
                    )}
                  </motion.div>
                  
                  {/* الأزرار */}
                  <motion.div 
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Link href="/profile">
                      <motion.button
                        whileHover={{ 
                          scale: 1.05, 
                          boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.5)",
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {t.viewProfile}
                        <FaUser />
                      </motion.button>
                    </Link>
                    <Link href="/favorites">
                      <motion.button
                        whileHover={{ 
                          scale: 1.05, 
                          boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.3)",
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-full font-bold shadow-lg border-2 border-indigo-500 hover:shadow-xl transition-all duration-300"
                      >
                        {t.myFavorites}
                        <FaBookmark />
                      </motion.button>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-1 shadow-2xl mb-16"
              style={{ borderRadius }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.5)",
                transition: { duration: 0.3 }
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12">
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {t.joinCommunity}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                    {t.joinMessage}
                  </p>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link href="/sign-up">
                    <motion.button
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.5)",
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {t.signUp}
                      <FaRocket />
                    </motion.button>
                  </Link>
                  <Link href="/sign-in">
                    <motion.button
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.3)",
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-8 py-4 rounded-full font-bold text-lg shadow-lg border-2 border-indigo-500 hover:shadow-xl transition-all duration-300"
                    >
                      {t.signIn}
                      <FaUser />
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const { data: session } = useSession();
  
  // حالات المكون
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  // روابط وسائل التواصل الاجتماعي
  const socialLinks = useMemo(() => [
    { href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA", icon: <FaYoutube />, label: t.youtube },
    { href: "https://www.instagram.com/fazlaka_platform/", icon: <FaInstagram />, label: t.instagram },
    { href: "https://www.facebook.com/profile.php?id=61579582675453", icon: <FaFacebookF />, label: t.facebook },
    { href: "https://www.tiktok.com/@fazlaka_platform", icon: <FaTiktok />, label: t.tiktok },
   { href: "https://x.com/FazlakaPlatform", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>, label: t.twitter },
  ], [t.youtube, t.instagram, t.facebook, t.tiktok, t.twitter]);

  // التأكد من أننا في بيئة العميل
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // تحميل الحلقات من Sanity
  useEffect(() => {
    let mounted = true;
    async function loadEpisodes() {
      try {
        setLoading(true);
        
        // استخدم الدالة الجديدة لجلب الحلقات
        const data = await fetchEpisodes(language);
        
        if (mounted) {
          // تحويل البيانات إلى الشكل المتوقع
          const formattedEpisodes = data.map((episode: Episode) => ({
            _id: episode._id,
            title: episode.title,
            titleEn: episode.titleEn,
            slug: episode.slug,
            description: episode.description,
            descriptionEn: episode.descriptionEn,
            thumbnailUrl: episode.thumbnailUrl,
            thumbnailUrlEn: episode.thumbnailUrlEn,
            season: episode.season,
            publishedAt: episode.publishedAt,
            language: episode.language
          }));
          
          setEpisodes(formattedEpisodes);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading episodes:", err);
        if (mounted) {
          setEpisodes([]);
          setLoading(false);
        }
      }
    }
    loadEpisodes();
    return () => {
      mounted = false;
    };
  }, [language]);
  
  // تحميل المقالات من Sanity
  useEffect(() => {
    let mounted = true;
    async function loadArticles() {
      try {
        // استخدم الدالة الجديدة لجلب المقالات
        const data = await fetchArticles(language);
        
        if (mounted) {
          // تحويل البيانات إلى الشكل المتوقع
          const formattedArticles = data.map((article: Article) => ({
            _id: article._id,
            title: article.title,
            titleEn: article.titleEn,
            slug: article.slug,
            excerpt: article.excerpt,
            excerptEn: article.excerptEn,
            featuredImageUrl: article.featuredImageUrl,
            featuredImageUrlEn: article.featuredImageUrlEn,
            category: article.categories?.[0], // استخدام الفئة الأولى من المصفوفة
            categoryEn: article.categories?.[0], // استخدام الفئة الأولى من المصفوفة
            publishedAt: article.publishedAt,
            language: article.language
          }));
          
          setArticles(formattedArticles);
        }
      } catch (err) {
        console.error("Error loading articles:", err);
        if (mounted) {
          setArticles([]);
        }
      }
    }
    loadArticles();
    return () => {
      mounted = false;
    };
  }, [language]);
  
  // تحميل الأسئلة الشائعة من Sanity - محسن بالكامل
  useEffect(() => {
    let mounted = true;
    async function loadFaqs() {
      try {
        setFaqLoading(true);
        
        // استخدم الدالة الجديدة لجلب الأسئلة الشائعة
        const data = await fetchFaqs(language);
        console.log('FAQs loaded:', data);
        
        if (mounted) {
          // تحويل البيانات إلى الشكل المتوقع مع التحقق من _id
          const formattedFaqs = data
            .filter((faq: FAQ) => faq._id) // فلترة العناصر التي لا تحتوي على _id
            .map((faq: FAQ) => ({
              _id: faq._id as string, // التأكد من أن _id هو string
              question: faq.question,
              questionEn: faq.questionEn,
              answer: faq.answer,
              answerEn: faq.answerEn,
              category: faq.category,
              categoryEn: faq.categoryEn,
              language: language
            }));
          
          // فلترة الأسئلة الفارغة
          const validFaqs = formattedFaqs.filter(faq => {
            const question = getLocalizedTextEnhanced(faq.question, faq.questionEn, language);
            const answer = getLocalizedTextEnhanced(faq.answer, faq.answerEn, language);
            return question && question.trim() !== '' && answer && answer.trim() !== '';
          });
          
          console.log('Valid FAQs after filtering:', validFaqs);
          setFaqs(validFaqs);
          setFaqLoading(false);
        }
      } catch (err) {
        console.error("Error loading FAQs:", err);
        if (mounted) {
          setFaqs([]);
          setFaqLoading(false);
        }
      }
    }
    loadFaqs();
    return () => {
      mounted = false;
    };
  }, [language]);
  
  return (
    <div className="antialiased bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* ====== HERO مع قسم الإحصائيات المدمج ====== */}
      <motion.header
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={containerVariants}
        className="relative w-full min-h-[100vh] flex items-center justify-center overflow-hidden"
      >
        {/* خلفية متدرجة جديدة - أزرق غامق مع لمسة بنفسجية */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 z-0" />
        <div className="absolute inset-0 bg-black/40 z-0" />
        
        {/* شبكة علمية محسنة - تقليلها على الموبايل */}
        <div className="absolute inset-0 z-0">
          <div className="hidden md:block absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMC41IiBmaWxsPSIjODA4MGZmIiBvcGFjaXR5PSIwLjE1IiAvPgo8L3N2Zz4=')] opacity-30 dark:opacity-20" />
          <div className="hidden md:block absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPHBhdGggZD0iTTAgMEw0NDAgNE00NDAiIDQwIE00IE00IiBzdHJva2U9IiM5OTQ1ZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjIiIC8+CjwvU3ZnPg==')] opacity-15 dark:opacity-10" />
          
          {/* دوائر متحركة محسنة - تقليلها على الموبايل */}
          <motion.div 
            className="hidden md:block absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-600/20 dark:bg-indigo-700/15 blur-3xl"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ 
              duration: 18, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="hidden md:block absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-purple-600/20 dark:bg-purple-700/15 blur-3xl"
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.2, 0.25, 0.2],
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div 
            className="hidden md:block absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-blue-600/20 dark:bg-blue-700/15 blur-3xl"
            animate={{ 
              scale: [1, 1.6, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 1
            }}
          />
          
          {/* إضافة تأثيرات ضوئية جديدة - تقليلها على الموبايل */}
          <motion.div 
            className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 blur-3xl"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 40, 
              repeat: Infinity, 
              ease: "linear"
            }}
          />
        </div>
        
        {/* محتوى الهيرو والإحصائيات */}
        <div className="relative z-10 text-center px-4 py-20 md:py-32 max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-center">
            {/* الشعار مع تأثيرات جديدة */}
            <motion.div 
              className="mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            >
              <motion.div
                className="relative"
                whileHover={{ 
                  scale: 1.15,
                  rotate: [0, 15, -15, 0],
                  transition: { duration: 0.8 }
                }}
              >
                {/* تأثير الإضاءة المحيطة محسن */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-blue-500/40 rounded-full blur-2xl transform scale-150"></div>
                
                {/* الشعار الرئيسي */}
                <motion.div
                  className="relative w-20 md:w-32 h-auto drop-shadow-2xl z-10"
                  style={{ 
                    filter: "drop-shadow(0 15px 12px rgba(99, 102, 241, 0.6))",
                  }}
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 3, -3, 0]
                  }}
                  transition={{ 
                    duration: 8, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <Image
                    src={language === 'ar' ? "/logo.png" : "/logoE.png"}
                    alt={t.platformName}
                    width={120}
                    height={120}
                    className="w-full h-auto"
                  />
                </motion.div>
                
                {/* تأثير النبض محسن */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-indigo-400/40"
                  animate={{ 
                    scale: [1, 1.4, 1], 
                    opacity: [0.8, 0.3, 0.8] 
                  }}
                  transition={{ 
                    duration: 3.5, 
                    repeat: Infinity 
                  }}
                />
                
                {/* تأثير النبض الثاني */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-purple-400/30"
                  animate={{ 
                    scale: [1, 1.6, 1], 
                    opacity: [0.6, 0.2, 0.6] 
                  }}
                  transition={{ 
                    duration: 4.5, 
                    repeat: Infinity,
                    delay: 1.2
                  }}
                />
                
                {/* تأثير النبض الثالث */}
                <motion.div
                  className="absolute inset-0 rounded-full border-1 border-blue-400/20"
                  animate={{ 
                    scale: [1, 1.8, 1], 
                    opacity: [0.4, 0.1, 0.4] 
                  }}
                  transition={{ 
                    duration: 5.5, 
                    repeat: Infinity,
                    delay: 2.4
                  }}
                />
              </motion.div>
            </motion.div>
            
            {/* نص الترحيب مع تأثيرات جديدة */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
                <motion.p
                  className="
                    text-xl 
                    md:text-2xl 
                    lg:text-3xl 
                    max-w-3xl 
                    mx-auto 
                    font-medium
                    bg-gradient-to-r 
                    from-blue-400 
                    to-purple-600 
                    bg-clip-text 
                    text-transparent
                  "
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  {t.platformSubtitle}
                </motion.p>
            </motion.div>
          </div>
        </div>
        
        {/* عناصر علمية زخرفية - تقليلها على الموبايل */}
        <motion.div 
          className="hidden md:block absolute bottom-10 right-10 w-20 h-20 rounded-full bg-cyan-200/20 dark:bg-cyan-500/10 blur-2xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="hidden md:block absolute top-20 left-10 w-16 h-16 rounded-full bg-emerald-200/20 dark:bg-emerald-500/10 blur-2xl"
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="hidden md:block absolute top-1/2 right-1/4 w-18 h-18 rounded-full bg-teal-200/20 dark:bg-teal-500/10 blur-2xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
        />
      </motion.header>
      
      {/* ====== سلايدر المحتوى المميز (Featured Content) ====== */}
      <FeaturedContentSlider />
      
      {/* ====== الحلقات مع تحسينات ====== */}
      <section id="episodes-section" className="container mx-auto py-6 relative overflow-x-hidden">
        <div className="flex items-center justify-between mb-5">
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            {t.latestEpisodes}
          </motion.h2>
          <motion.div initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} className="flex gap-2">
            <Link
              href="/episodes"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-95 transition-all duration-300"
            >
              {t.allEpisodes}
            </Link>
            <Link
              href="/playlists"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              {t.allPlaylists}
            </Link>
            <Link
              href="/seasons"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              {t.allSeasons}
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
          <p className="text-center py-12 text-gray-600 dark:text-gray-400">{t.noEpisodes}</p>
        ) : (
          <>
            <Swiper
              modules={[Pagination, Autoplay, Navigation]}
              spaceBetween={20}
              slidesPerView={1}
              autoHeight={true}
              pagination={{ 
                el: ".custom-pagination", 
                clickable: true,
                bulletClass: "swiper-pagination-bullet-custom",
                bulletActiveClass: "swiper-pagination-bullet-active-custom",
              }}
              navigation={{
                nextEl: ".swiper-button-next-custom",
                prevEl: ".swiper-button-prev-custom",
              }}
              autoplay={{ delay: 4500, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="py-1 relative"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {episodes.map((ep: EpisodeData) => {
                return (
                  <SwiperSlide key={ep._id} className="flex justify-center items-start">
                    <EpisodeCard episode={ep} />
                  </SwiperSlide>
                );
              })}
            </Swiper>
            
            <div className="custom-pagination flex justify-center mt-6 gap-2" />
            <div className="swiper-button-next-custom text-blue-500" />
            <div className="swiper-button-prev-custom text-blue-500" />
          </>
        )}
      </section>
      
      {/* ====== قسم المقالات كـ سلايدر ====== */}
      <section className="container mx-auto py-6 relative overflow-x-hidden">
        <div className="flex items-center justify-between mb-5">
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            {t.latestArticles}
          </motion.h2>
          <motion.div initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} className="flex gap-2">
            <Link
              href="/articles"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-95 transition-all duration-300"
            >
              {t.allArticles}
            </Link>
            <Link
              href="/seasons"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              {t.allSeasons}
            </Link>
            <Link
              href="/playlists"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              {t.allPlaylists}
            </Link>
          </motion.div>
        </div>
        
        {articles.length === 0 ? (
          <p className="text-center py-12 text-gray-600 dark:text-gray-400">{t.noArticles}</p>
        ) : (
          <>
            <Swiper
              modules={[Pagination, Autoplay, Navigation]}
              spaceBetween={20}
              slidesPerView={1}
              autoHeight={true}
              pagination={{ 
                el: ".articles-pagination", 
                clickable: true,
                bulletClass: "swiper-pagination-bullet-custom",
                bulletActiveClass: "swiper-pagination-bullet-active-custom",
              }}
              navigation={{
                nextEl: ".articles-button-next-custom",
                prevEl: ".articles-button-prev-custom",
              }}
              autoplay={{ delay: 4500, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="py-1 relative"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {articles.map((article: ArticleData) => {
                return (
                  <SwiperSlide key={article._id} className="flex justify-center items-start">
                    <ArticleCard article={article} />
                  </SwiperSlide>
                );
              })}
            </Swiper>
            
            <div className="articles-pagination flex justify-center mt-6 gap-2" />
            <div className="articles-button-next-custom text-purple-500" />
            <div className="articles-button-prev-custom text-purple-500" />
          </>
        )}
      </section>
      
      {/* ====== القسم الموحد الجديد - يجمع بين الاشتراك والمجتمع ====== */}
      <UnifiedMembershipSection />
      
      {/* ====== تواصل + FAQ مع تحسينات ====== */}
      <section
        className="container mx-auto py-16 px-4 relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full mb-6 shadow-lg"
          >
            <FaComments className="text-xl" />
            <span className="text-lg font-bold">{t.contactUsTitle}</span>
          </motion.div>

          <p 
            className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto"
          >
            {t.contactUsMessage}
          </p>
        </div>
        
        {/* خلفية متحركة - تعرض فقط على العميل */}
        {isClient && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* جسيمات متحركة - تقليلها على الموبايل */}
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="hidden md:block absolute w-2 h-2 rounded-full bg-blue-400/30 dark:bg-blue-500/20"
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
              className="lg:w-1/3 p-8 bg-gradient-to-br from-blue-900 to-purple-900 text-white relative overflow-hidden"
            >
              {/* خلفية متحركة - تقليلها على الموبايل */}
              <div className="hidden md:block absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMC41IiBmaWxsPSIjODA4MGZmIiBvcGFjaXR5PSIwLjMiIgLz4KPC9zdmc+')]"></div>
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <FaComments className="text-yellow-300" />
                    {t.contactUs}
                  </h3>
                  
                  <div className="text-center">
                    <p className="mb-6 text-blue-100 text-lg">{t.contactUsMessage}</p>
                    <div>
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-semibold shadow-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105"
                      >
                        <FaPaperPlane />
                        {t.send}
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaUsers className="text-yellow-300" />
                    {t.followUs}
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
                          hover:bg-white hover:text-blue-600 hover:shadow-xl hover:scale-105
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
              {/* خلفية زخرفية - تقليلها على الموبايل */}
              <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="hidden md:block absolute bottom-0 left-0 w-40 h-40 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <FaQuestionCircle className="text-blue-500 text-2xl" />
                    {t.commonQuestions}
                  </h3>
                  
                  <div>
                    <Link
                      href="/faq"
                      className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      {t.allQuestions}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Link>
                  </div>
                </div>
                
                {faqLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                  </div>
                ) : faqs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-block bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                      <FaQuestionCircle className="text-gray-400 dark:text-gray-500 text-2xl" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{t.noFaqs}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.noFaqsMessage}</p>
                  </div>
                ) : (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="space-y-6"
                  >
                    {faqs.map((f, index) => (
                      <AnimatedQuestion 
                        key={f._id} 
                        question={f.question} 
                        questionEn={f.questionEn}
                        answer={f.answer} 
                        answerEn={f.answerEn}
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
        .swiper-button-next-custom,
        .swiper-button-prev-custom {
          position: absolute;
          top: 50%;
          width: 30px;
          height: 30px;
          margin-top: -15px;
          z-index: 10;
          cursor: pointer;
          background-size: 20px 20px;
          background-position: center;
          background-repeat: no-repeat;
        }
        .swiper-button-next-custom {
          right: 10px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z'/%3E%3C/svg%3E");
        }
        .swiper-button-prev-custom {
          left: 10px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M15.41 7.41L10.83 12l4.58 4.59L14 18l-6-6 6-6 1.41 1.41z'/%3E%3C/svg%3E");
        }
        .articles-button-next-custom,
        .articles-button-prev-custom {
          position: absolute;
          top: 50%;
          width: 30px;
          height: 30px;
          margin-top: -15px;
          z-index: 10;
          cursor: pointer;
          background-size: 20px 20px;
          background-position: center;
          background-repeat: no-repeat;
        }
        .articles-button-next-custom {
          right: 10px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a855f7'%3E%3Cpath d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z'/%3E%3C/svg%3E");
        }
        .articles-button-prev-custom {
          left: 10px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a855f7'%3E%3Cpath d='M15.41 7.41L10.83 12l4.58 4.59L14 18l-6-6 6-6 1.41 1.41z'/%3E%3C/svg%3E");
        }
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
        
        /* تحسينات إضافية للموبايل */
        @media (max-width: 768px) {
          .swiper-slide {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .card {
            width: 100%;
            max-width: 320px;
          }
          
          /* تقليل التأثيرات البصرية على الموبايل */
          .backdrop-blur-sm {
            backdrop-filter: blur(4px);
          }
          .backdrop-blur-md {
            backdrop-filter: blur(8px);
          }
          .backdrop-blur-lg {
            backdrop-filter: blur(12px);
          }
          
          /* تحسين الأداء على الموبايل */
          .motion-safe {
            will-change: auto;
          }
          
          /* تقليل حجم الخط على الموبايل */
          .text-3xl {
            font-size: 1.5rem;
          }
          .text-4xl {
            font-size: 2rem;
          }
          .text-5xl {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
}