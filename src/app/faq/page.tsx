// app/faq/page.tsx
'use client';
import React, { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { fetchFromSanity } from "@/lib/sanity";
import { useLanguage } from "@/components/LanguageProvider"; // استيراد هوك اللغة
import { 
  FaQuestionCircle, FaEnvelope, FaComments, FaStar, FaLightbulb, FaPaperPlane, 
  FaGlobe, FaHeart, FaSearch, FaTimes, FaFilter, FaHeadset, FaArrowRight
} from "react-icons/fa";

type FaqItem = { 
  id: string; 
  question: string; 
  answer: string;
  category?: string;
};

interface SanityFaqItem {
  _id: string;
  question: string;
  questionEn?: string;
  answer: string;
  answerEn?: string;
  category?: string;
  categoryEn?: string;
}

// إضافة الترجمات
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
    search: "ابحث عن سؤال أو كلمة مفتاحية...",
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
    // ترجمات صفحة الأسئلة الشائعة
    pageTitle: "الأسئلة الأكثر شيوعاً",
    pageSubtitle: "إجابات على استفساراتكم حول قناتنا العلمية على يوتيوب وخدماتنا التعليمية",
    searchButton: "البحث عن سؤال",
    contactButton: "تواصل معنا",
    faqSectionTitle: "الأسئلة الشائعة",
    faqSectionSubtitle: "إجابات على استفساراتكم حول قناتنا العلمية على يوتيوب وخدماتنا التعليمية",
    categories: "التصنيفات",
    allCategories: "جميع التصنيفات",
    filterBy: "التصفية حسب:",
    removeFilter: "إزالة التصفية",
    noQuestions: "لا توجد أسئلة",
    noQuestionsMessage: "لا توجد أسئلة تطابق بحثك أو الفئة المحددة",
    clearSearch: "مسح البحث",
    cancelFilter: "إلغاء الفلتر",
    needHelp: "هل تحتاج إلى مساعدة إضافية؟",
    helpMessage: "فريق الدعم متاح لمساعدتك في أي استفسار. لا تتردد في التواصل معنا للحصول على المساعدة التي تحتاجها.",
    contactDirectly: "تواصل معنا مباشرة",
    errorLoading: "حدث خطأ أثناء تحميل الأسئلة. يرجى المحاولة مرة أخرى لاحقاً.",
    tryAgain: "إعادة المحاولة",
    questionOpened: "لقد تم فتح السؤال الذي بحثت عنه أدناه",
    noQuestionsAvailable: "لا توجد أسئلة شائعة حالياً",
    noTitle: "(بدون عنوان)",
    noAnswer: "لا يوجد جواب."
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
    search: "Search for a question or keyword...",
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
    copyright: "© {year} Falthaka",
    // ترجمات صفحة الأسئلة الشائعة
    pageTitle: "Frequently Asked Questions",
    pageSubtitle: "Answers to your inquiries about our scientific YouTube channel and educational services",
    searchButton: "Search for a question",
    contactButton: "Contact us",
    faqSectionTitle: "Frequently Asked Questions",
    faqSectionSubtitle: "Answers to your inquiries about our scientific YouTube channel and educational services",
    categories: "Categories",
    allCategories: "All Categories",
    filterBy: "Filter by:",
    removeFilter: "Remove Filter",
    noQuestions: "No questions",
    noQuestionsMessage: "No questions match your search or selected category",
    clearSearch: "Clear Search",
    cancelFilter: "Cancel Filter",
    needHelp: "Need additional help?",
    helpMessage: "Our support team is available to help you with any inquiry. Don't hesitate to contact us to get the help you need.",
    contactDirectly: "Contact us directly",
    errorLoading: "An error occurred while loading questions. Please try again later.",
    tryAgain: "Try Again",
    questionOpened: "The question you searched for has been opened below",
    noQuestionsAvailable: "No frequently asked questions available at the moment",
    noTitle: "(No title)",
    noAnswer: "No answer available."
  }
};

// دالة للحصول على النص المناسب بناءً على اللغة (تم نقلها للخارج)
const getLocalizedText = (language: string, arText?: string, enText?: string) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

function FaqContent() {
  // استخدام هوك اللغة للحصول على الحالة الحالية
  const { isRTL, language } = useLanguage();
  
  // تعريف جميع الحالات في بداية المكون
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFaqs, setFilteredFaqs] = useState<FaqItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showContactAnimation, setShowContactAnimation] = useState(true);
  
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const faqIdFromSearch = searchParams.get("faq");
  
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contentHeights, setContentHeights] = useState<Record<string, string>>({});
  
  // الحصول على الترجمات بناءً على اللغة الحالية
  const t = translations[language];
  
  useEffect(() => {
    // التحقق من تفضيل الوضع المحفوظ في localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  
  useEffect(() => {
    const root = document.documentElement;
    const cardColors = [
      { border: "#4b5563", shadow: "rgba(75, 85, 99, 0.3)", shimmer: "rgba(75, 85, 99, 0.3)" },
      { border: "#1e40af", shadow: "rgba(30, 64, 175, 0.3)", shimmer: "rgba(30, 64, 175, 0.3)" },
      { border: "#b45309", shadow: "rgba(180, 83, 9, 0.3)", shimmer: "rgba(180, 83, 9, 0.3)" },
      { border: "#4b5563", shadow: "rgba(75, 85, 99, 0.3)", shimmer: "rgba(75, 85, 99, 0.3)" },
      { border: "#c2410c", shadow: "rgba(194, 65, 12, 0.3)", shimmer: "rgba(194, 65, 12, 0.3)" },
      { border: "#7e22ce", shadow: "rgba(126, 34, 206, 0.3)", shimmer: "rgba(126, 34, 206, 0.3)" },
      { border: "#0f766e", shadow: "rgba(15, 118, 110, 0.3)", shimmer: "rgba(15, 118, 110, 0.3)" },
      { border: "#be185d", shadow: "rgba(190, 24, 93, 0.3)", shimmer: "rgba(190, 24, 93, 0.3)" },
    ];
    
    cardColors.forEach((color, index) => {
      root.style.setProperty(`--card-${index}-border`, color.border);
      root.style.setProperty(`--card-${index}-shadow-color`, color.shadow);
      root.style.setProperty(`--card-${index}-shimmer-color`, color.shimmer);
    });
  }, []);
  
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setFaqLoading(true);
        
        // تمرير اللغة الحالية إلى الاستعلام وجلب الحقول المناسبة
        const query = `*[_type == "faq" && language == $language] | order(_createdAt desc) {
          _id,
          question,
          questionEn,
          answer,
          answerEn,
          category,
          categoryEn
        }`;
        
        const data = await fetchFromSanity(query, { language }) as SanityFaqItem[];
        
        const formattedFaqs = data.map((item: SanityFaqItem) => ({
          id: item._id,
          question: getLocalizedText(language, item.question, item.questionEn),
          answer: getLocalizedText(language, item.answer, item.answerEn),
          category: getLocalizedText(language, item.category, item.categoryEn)
        }));
        
        setFaqs(formattedFaqs);
        setFilteredFaqs(formattedFaqs);
        setFaqLoading(false);
      } catch (error) {
        console.error("Error fetching FAQs from Sanity:", error);
        setFaqError(true);
        setFaqLoading(false);
      }
    };
    
    fetchFaqs();
  }, [language]); // إعادة جلب البيانات عند تغيير اللغة
  
  useEffect(() => {
    function measure() {
      const heights: Record<string, string> = {};
      Object.entries(contentRefs.current).forEach(([id, el]) => {
        if (el) heights[id] = `${el.scrollHeight}px`;
      });
      setContentHeights(heights);
    }
    const timeout = setTimeout(measure, 30);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", measure);
    };
  }, [faqs]);
  
  useEffect(() => {
    if (faqIdFromSearch && faqs.length > 0) {
      const faq = faqs.find(f => f.id === faqIdFromSearch);
      if (faq) {
        setOpenFaq(faq.id);
        setTimeout(() => {
          const element = document.getElementById(`faq-${faq.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, [faqIdFromSearch, faqs]);
  
  useEffect(() => {
    let result = faqs;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        faq => 
          faq.question.toLowerCase().includes(term) || 
          faq.answer.toLowerCase().includes(term)
      );
    }
    
    if (activeCategory) {
      result = result.filter(faq => faq.category === activeCategory);
    }
    
    setFilteredFaqs(result);
  }, [searchTerm, faqs, activeCategory]);
  
  const toggleFaq = (id: string) => {
    const el = contentRefs.current[id];
    if (el) {
      const h = `${el.scrollHeight}px`;
      setContentHeights((s) => ({ ...s, [id]: h }));
    }
    setOpenFaq((prev) => (prev === id ? null : id));
  };
  
  const reloadFaqs = () => {
    setFaqLoading(true);
    setFaqError(false);
    
    const fetchFaqs = async () => {
      try {
        const query = `*[_type == "faq" && language == $language] | order(_createdAt desc) {
          _id,
          question,
          questionEn,
          answer,
          answerEn,
          category,
          categoryEn
        }`;
        
        const data = await fetchFromSanity(query, { language }) as SanityFaqItem[];
        
        const formattedFaqs = data.map((item: SanityFaqItem) => ({
          id: item._id,
          question: getLocalizedText(language, item.question, item.questionEn),
          answer: getLocalizedText(language, item.answer, item.answerEn),
          category: getLocalizedText(language, item.category, item.categoryEn)
        }));
        
        setFaqs(formattedFaqs);
        setFilteredFaqs(formattedFaqs);
        setFaqLoading(false);
      } catch (error) {
        console.error("Error fetching FAQs from Sanity:", error);
        setFaqError(true);
        setFaqLoading(false);
      }
    };
    
    fetchFaqs();
  };
  
  const setContentRef = (id: string) => (el: HTMLDivElement | null) => {
    contentRefs.current[id] = el;
  };
  
  const categories = Array.from(new Set(faqs.map(faq => faq.category).filter(Boolean))) as string[];
  
  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = faqs.filter(faq => faq.category === category).length;
    return acc;
  }, {} as Record<string, number>);
  
  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setShowCategories(false);
  };
  
  const HeroSection = () => {
    return (
      <div className="relative mb-16 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse-slow"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-yellow-400/20 rounded-full blur-lg animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/4 left-1/4 w-10 h-10 border-2 border-white/20 rotate-45"></div>
        <div className="absolute top-1/3 right-1/4 w-8 h-8 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-12 h-12 border-2 border-white/20 rotate-12"></div>
        <div className="absolute bottom-1/3 right-1/3 w-6 h-6 border-2 border-white/20 rotate-45"></div>
        
        <div className="relative z-10 py-16 px-6 md:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-12 md:mb-0 text-center md:text-right">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full mb-6">
              <span className="text-white font-medium flex items-center justify-center">
                <FaStar className="text-yellow-300 ml-2 animate-pulse" />
                {t.faq}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {t.pageTitle.split(' ').map((word, index) => (
                <span key={index} className={index === 2 ? "text-yellow-300" : ""}>
                  {word}{' '}
                </span>
              ))}
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-lg mx-auto md:mx-0">
              {t.pageSubtitle}
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link href="#faq-search" className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-full hover:bg-white/30 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t.searchButton}
              </Link>
              <Link href="#contact-section" className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-full hover:bg-white/30 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg">
                <FaComments className="ml-2" />
                {t.contactButton}
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full filter blur-3xl w-64 h-64 md:w-80 md:h-80 animate-pulse-slow"></div>
              <div className="relative grid grid-cols-3 gap-6 w-64 h-64 md:w-80 md:h-80">
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaQuestionCircle className="text-white text-3xl" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaLightbulb className="text-white text-3xl" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaEnvelope className="text-white text-3xl" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaPaperPlane className="text-white text-3xl" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaGlobe className="text-white text-3xl" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.6s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-110">
                    <FaHeart className="text-white text-3xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
      </div>
    );
  };

  const getBoxShadow = () => {
    if (isDarkMode) {
      return '0 20px 40px -10px rgba(99, 102, 241, 0.3), 0 15px 25px -5px rgba(139, 92, 246, 0.2), 0 10px 15px -3px rgba(236, 72, 153, 0.1)';
    }
    return '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  };

  const getCardColors = (index: number) => {
    const colors = [
      { border: "border-gray-600", bg: "bg-gray-50", darkBg: "dark:bg-gray-800/30", text: "text-gray-800", darkText: "dark:text-gray-200", icon: "text-gray-600", shadow: "shadow-gray-500/30", hoverShadow: "hover:shadow-gray-500/40", ring: "ring-gray-500", headerBg: "bg-gradient-to-r from-gray-600 to-gray-700", headerText: "text-white", shimmer: "shadow-[0_0_15px_rgba(75,85,99,0.3)]" },
      { border: "border-blue-600", bg: "bg-blue-50", darkBg: "dark:bg-blue-900/20", text: "text-blue-800", darkText: "dark:text-blue-200", icon: "text-blue-600", shadow: "shadow-blue-500/30", hoverShadow: "hover:shadow-blue-500/40", ring: "ring-blue-500", headerBg: "bg-gradient-to-r from-blue-600 to-blue-700", headerText: "text-white", shimmer: "shadow-[0_0_15px_rgba(37,99,235,0.3)]" },
      { border: "border-amber-600", bg: "bg-amber-50", darkBg: "dark:bg-amber-900/20", text: "text-amber-800", darkText: "dark:text-amber-200", icon: "text-amber-600", shadow: "shadow-amber-500/30", hoverShadow: "hover:shadow-amber-500/40", ring: "ring-amber-500", headerBg: "bg-gradient-to-r from-amber-600 to-amber-700", headerText: "text-white", shimmer: "shadow-[0_0_15px_rgba(217,119,6,0.3)]" },
      { border: "border-emerald-600", bg: "bg-emerald-50", darkBg: "dark:bg-emerald-900/20", text: "text-emerald-800", darkText: "dark:text-emerald-200", icon: "text-emerald-600", shadow: "shadow-emerald-500/30", hoverShadow: "hover:shadow-emerald-500/40", ring: "ring-emerald-500", headerBg: "bg-gradient-to-r from-emerald-600 to-emerald-700", headerText: "text-white", shimmer: "shadow-[0_0_15px_rgba(5,122,85,0.3)]" },
      { border: "border-orange-600", bg: "bg-orange-50", darkBg: "dark:bg-orange-900/20", text: "text-orange-800", darkText: "dark:text-orange-200", icon: "text-orange-600", shadow: "shadow-orange-500/30", hoverShadow: "hover:shadow-orange-500/40", ring: "ring-orange-500", headerBg: "bg-gradient-to-r from-orange-500 to-orange-600", headerText: "text-white", shimmer: "shadow-[0_0_15px_rgba(234,88,12,0.3)]" },
      { border: "border-purple-600", bg: "bg-purple-50", darkBg: "dark:bg-purple-900/20", text: "text-purple-800", darkText: "dark:text-purple-200", icon: "text-purple-600", shadow: "shadow-purple-500/30", hoverShadow: "hover:shadow-purple-500/40", ring: "ring-purple-500", headerBg: "bg-gradient-to-r from-purple-600 to-purple-700", headerText: "text-white", shimmer: "shadow-[0_0_15px_rgba(126,34,206,0.3)]" },
      { border: "border-teal-600", bg: "bg-teal-50", darkBg: "dark:bg-teal-900/20", text: "text-teal-800", darkText: "dark:text-teal-200", icon: "text-teal-600", shadow: "shadow-teal-500/30", hoverShadow: "hover:shadow-teal-500/40", ring: "ring-teal-500", headerBg: "bg-gradient-to-r from-teal-500 to-teal-600", headerText: "text-white", shimmer: "shadow-[0_0_15px_rgba(13,148,136,0.3)]" },
      { border: "border-rose-600", bg: "bg-rose-50", darkBg: "dark:bg-rose-900/20", text: "text-rose-800", darkText: "dark:text-rose-200", icon: "text-rose-600", shadow: "shadow-rose-500/30", hoverShadow: "hover:shadow-rose-500/40", ring: "ring-rose-500", headerBg: "bg-gradient-to-r from-rose-500 to-rose-600", headerText: "text-white", shimmer: "shadow-[0_0_15px_rgba(225,29,72,0.3)]" },
    ];
    return colors[index % colors.length];
  };

  const ContactSection = () => {
    return (
      <motion.div 
        id="contact-section"
        initial={showContactAnimation ? (reduceMotion ? {} : { opacity: 0, y: 20 }) : {}}
        animate={showContactAnimation ? (reduceMotion ? {} : { opacity: 1, y: 0 }) : {}}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-16 mb-12"
        onAnimationComplete={() => setShowContactAnimation(false)}
      >
        <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-6 md:p-8 border border-indigo-100 dark:border-indigo-800 text-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute top-10 left-10 w-16 h-16 bg-indigo-200/30 dark:bg-indigo-700/20 rounded-full blur-xl"></div>
            <div className="absolute top-20 right-20 w-20 h-20 bg-purple-200/30 dark:bg-purple-700/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-200/30 dark:bg-blue-700/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-1/3 w-18 h-18 bg-pink-200/30 dark:bg-pink-700/20 rounded-full blur-xl"></div>
            <div className="absolute top-1/4 left-1/4 w-8 h-8 border-2 border-indigo-300/30 dark:border-indigo-600/30 rotate-45"></div>
            <div className="absolute top-1/3 right-1/4 w-6 h-6 border-2 border-purple-300/30 dark:border-purple-600/30 rounded-full"></div>
            <div className="absolute bottom-1/4 left-1/3 w-10 h-10 border-2 border-blue-300/30 dark:border-blue-600/30 rotate-12"></div>
            <div className="absolute bottom-1/3 right-1/3 w-5 h-5 border-2 border-pink-300/30 dark:border-pink-600/30 rotate-45"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="bg-indigo-100 dark:bg-indigo-800/50 p-5 rounded-full shadow-lg">
                <FaHeadset className="text-indigo-600 dark:text-indigo-400 text-4xl" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t.needHelp}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              {t.helpMessage}
            </p>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 md:px-10 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center mx-auto transform hover:-translate-y-1"
              >
                {t.contactDirectly}
                <FaArrowRight className="ml-3 text-xl" />
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <HeroSection />
        
        <motion.main 
          id="faq-search"
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 relative dark:shadow-2xl border border-gray-200 dark:border-gray-700 mb-16"
          style={{ boxShadow: getBoxShadow() }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="text-center md:text-right">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 flex flex-col md:flex-row items-center justify-center md:justify-start">
                <motion.div animate={reduceMotion ? {} : { rotate: [0, 5, 0, -5, 0] }} transition={{ repeat: Infinity, duration: 6, repeatDelay: 3, ease: "easeInOut" }}>
                  <FaQuestionCircle className="w-8 h-8 md:w-10 md:h-10 ml-3 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
                <span className="mt-2 md:mt-0">{t.faqSectionTitle}</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-base md:text-lg">{t.faqSectionSubtitle}</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-grow">
              <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => { setShowSuggestions(true); }}
                onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
                className={`w-full p-4 ${isRTL ? 'pr-12 pl-12' : 'pl-12 pr-12'} border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-0 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-lg transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-600 focus:shadow-indigo-500/20`}
                suppressHydrationWarning={true}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}>
                  <FaTimes />
                </button>
              )}
              
              {showSuggestions && searchTerm && (
                <div className={`absolute z-40 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto ${isRTL ? 'right-0' : 'left-0'}`}>
                  {filteredFaqs.slice(0, 5).map((faq) => (
                    <div key={faq.id} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200" onClick={() => { setSearchTerm(faq.question); setShowSuggestions(false); setOpenFaq(faq.id); setTimeout(() => { const element = document.getElementById(`faq-${faq.id}`); if (element) { element.scrollIntoView({ behavior: "smooth", block: "center" }); } }, 300); }}>
                      <p className="font-medium text-gray-900 dark:text-gray-100 break-words">{faq.question}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{faq.answer.replace(/<[^>]*>/g, '').substring(0, 60)}...</p>
                    </div>
                  ))}
                  {filteredFaqs.length === 0 && (<div className="p-3 text-gray-500 dark:text-gray-400 text-center">{t.noResults}</div>)}
                </div>
              )}
            </div>
            
            <div className="relative">
              <button onClick={() => setShowCategories(!showCategories)} suppressHydrationWarning={true} className="flex items-center justify-center w-full md:w-auto px-4 md:px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-0.5">
                <FaFilter className="ml-2" />
                <span className="truncate">{activeCategory ? activeCategory : t.categories}</span>
                {activeCategory && (<span className="ml-2 bg-white text-indigo-600 text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">1</span>)}
              </button>
              
              {showCategories && (
                <div className={`absolute z-40 mt-2 w-full md:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto ${isRTL ? 'right-0' : 'left-0'}`}>
                  <div className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 flex items-center justify-between" onClick={() => { setActiveCategory(null); setShowCategories(false); }}>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t.allCategories}</span>
                    {!activeCategory && (<span className="text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></span>)}
                  </div>
                  {categories.map((category) => (
                    <div key={category} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 flex items-center justify-between" onClick={() => selectCategory(category)}>
                      <div className="flex items-center min-w-0">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{category}</span>
                        <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full flex-shrink-0">{categoryCounts[category] || 0}</span>
                      </div>
                      {activeCategory === category && (<span className="text-indigo-500 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></span>)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {activeCategory && (
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 ml-2">{t.filterBy}:</span>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium truncate max-w-xs">{activeCategory}</span>
              </div>
              <button onClick={() => setActiveCategory(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center flex-shrink-0">
                <FaTimes className="ml-1" />
                {t.removeFilter}
              </button>
            </div>
          )}
          
          {faqIdFromSearch && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-blue-700 dark:text-blue-300 flex items-center">
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                {t.questionOpened}
              </p>
            </motion.div>
          )}
          
          {faqLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {faqError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
              <p className="text-red-600 dark:text-red-400">{t.errorLoading}</p>
              <button onClick={reloadFaqs} className="mt-4 px-6 py-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-xl hover:bg-red-200 dark:hover:bg-red-700 transition-colors font-medium">{t.tryAgain}</button>
            </div>
          )}
          
          {!faqLoading && !faqError && filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">{t.noQuestions}</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">{searchTerm || activeCategory ? t.noQuestionsMessage : t.noQuestionsAvailable}</p>
              {(searchTerm || activeCategory) && (
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {searchTerm && (<button onClick={() => setSearchTerm("")} className="px-6 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors font-medium">{t.clearSearch}</button>)}
                  {activeCategory && (<button onClick={() => setActiveCategory(null)} className="px-6 py-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors font-medium">{t.cancelFilter}</button>)}
                </div>
              )}
            </div>
          )}
          
          {!faqLoading && !faqError && filteredFaqs.length > 0 && (
            <div className="space-y-6">
              {filteredFaqs.map((f, index) => {
                const isOpen = openFaq === f.id;
                const colors = getCardColors(index);
                const colorIndex = index % 8;
                
                return (
                  <motion.div key={f.id} id={`faq-${f.id}`} initial={reduceMotion ? {} : { opacity: 0, y: 10 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`overflow-hidden rounded-2xl bg-white dark:bg-gray-800 transition-all duration-300 ${isOpen ? `ring-2 ring-opacity-50 ${colors.ring} dark:shadow-lg ${colors.shadow} ${colors.shimmer}` : `${colors.shadow} ${colors.hoverShadow}`}`} style={{ borderLeft: `4px solid var(--card-${colorIndex}-border)`, borderTop: `1px solid var(--card-${colorIndex}-border)`, borderRight: `1px solid var(--card-${colorIndex}-border)`, borderBottom: `1px solid var(--card-${colorIndex}-border)`, boxShadow: isOpen ? `0 10px 25px -5px var(--card-${colorIndex}-shadow-color), 0 10px 10px -5px var(--card-${colorIndex}-shadow-color), 0 0 15px var(--card-${colorIndex}-shimmer-color)` : `0 10px 25px -5px var(--card-${colorIndex}-shadow-color), 0 10px 10px -5px var(--card-${colorIndex}-shadow-color)` }}>
                    <div className={`${colors.headerBg} p-4 md:p-6 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-30"></div>
                      <button onClick={() => toggleFaq(f.id)} aria-expanded={isOpen} className="w-full flex items-center justify-between relative z-10" suppressHydrationWarning={true}>
                        <div className="flex items-center min-w-0">
                          <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-sm mr-4 flex-shrink-0`}>
                            <FaQuestionCircle className={`text-xl ${colors.headerText}`} />
                          </div>
                          <span className="font-bold text-base md:text-lg text-right text-white break-words">{f.question || t.noTitle}</span>
                        </div>
                        <motion.span animate={reduceMotion ? {} : { rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="ml-3 flex-shrink-0" aria-hidden>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M19 15l-7-7-7 7" : "M19 9l-7 7-7 7"} /></svg>
                        </motion.span>
                      </button>
                      {f.category && (
                        <div className="mt-3 ml-16 relative z-10">
                          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full">{f.category}</span>
                        </div>
                      )}
                    </div>
                    <motion.div ref={setContentRef(f.id)} style={{ maxHeight: isOpen ? contentHeights[f.id] ?? undefined : 0, overflow: "hidden", transition: reduceMotion ? undefined : "max-height 260ms ease, opacity 200ms ease", opacity: isOpen ? 1 : 0, }} aria-hidden={!isOpen}>
                      <div className={`p-4 md:p-6 bg-white dark:bg-gray-800 ${colors.text} ${colors.darkText} text-sm leading-relaxed`}>
                        {f.answer ? <div dangerouslySetInnerHTML={{ __html: f.answer }} /> : <p>{t.noAnswer}</p>}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.main>
        
        {!faqLoading && !faqError && <ContactSection />}
      </div>
      
      <style jsx global>{`
        @keyframes border-gradient { 0% { border-color: #3b82f6; } 25% { border-color: #8b5cf6; } 50% { border-color: #ec4899; } 75% { border-color: #f59e0b; } 100% { border-color: #3b82f6; } }
        .animate-border-gradient { animation: border-gradient 8s linear infinite; border-width: 4px; border-style: solid; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 3s infinite; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.3; } }
        .animate-pulse-slow { animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}</style>
    </div>
  );
}

export default function FaqPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    }>
      <FaqContent />
    </Suspense>
  );
}