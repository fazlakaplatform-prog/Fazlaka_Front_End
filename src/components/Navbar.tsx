"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut, useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchFromSanity, urlFor, getAllNotifications, NotificationItem } from '@/lib/sanity';

// تعريفات واجهات البيانات
interface SearchResult {
  _id: string;
  _type: "episode" | "article" | "faq" | "playlist" | "season" | "teamMember" | "terms" | "privacy";
  title?: string;
  titleEn?: string;
  slug?: { current: string };
  excerpt?: string;
  excerptEn?: string;
  description?: string;
  descriptionEn?: string;
  answer?: string;
  answerEn?: string;
  role?: string;
  roleEn?: string;
  thumbnail?: SanityImage;
  featuredImage?: SanityImage;
  image?: SanityImage;
  season?: { _id: string; title: string; titleEn?: string; slug: { current: string } };
  episodeCount?: number;
  category?: string;
  categoryEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  sectionType?: string;
  imageUrl?: string;
  question?: string;
  questionEn?: string;
  name?: string;
  nameEn?: string;
  bio?: string;
  bioEn?: string;
  episode?: { _id: string; title: string; titleEn?: string; slug: { current: string } };
  language?: string;
}

interface PortableTextBlock {
  _type: 'block';
  children: PortableTextSpan[];
}

interface PortableTextSpan {
  text: string;
}

interface SanityImage {
  _type: 'image';
  asset: { _ref: string; _type: 'reference' };
}

interface FaqResult extends SearchResult {
  _type: "faq";
  question?: string;
  questionEn?: string;
  answer?: string;
  answerEn?: string;
  category?: string;
  categoryEn?: string;
}

interface TeamMemberResult extends SearchResult {
  _type: "teamMember";
  name?: string;
  nameEn?: string;
  role?: string;
  roleEn?: string;
  slug?: { current: string };
  image?: SanityImage;
  bio?: string;
  bioEn?: string;
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
    platforms: "تجدنا على",
    team: "الفريق",
    contact: "التواصل",
    contactUs: "تواصل معنا",
    faq: "الأسئلة الشائعة",
    search: "بحث...",
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
    copyright: "© {year} فذلكة"
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
    platforms: "Find us on",
    team: "Team",
    contact: "Contact",
    contactUs: "Contact Us",
    faq: "FAQ",
    search: "Search...",
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
    copyright: "© {year} Falthaka"
  }
};

// دوال مساعدة
function buildSearchMediaUrl(image?: SanityImage): string {
  if (!image) return "/placeholder.png";
  try {
    const url = urlFor(image);
    return url || "/placeholder.png";
  } catch (error) {
    console.error("Error building image URL:", error);
    return "/placeholder.png";
  }
}

function escapeRegExp(str = ""): string {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlighted(text: string, q: string): React.ReactNode {
  if (!q) return <>{text}</>;
  try {
    const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
    const parts = text.split(re);
    return (
      <>
        {parts.map((part, i) =>
          re.test(part) ? (
            <mark key={i} className="bg-yellow-100 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-200 rounded px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}

// مكون شريط البحث مع دعم اللغة
const SearchBar = ({ initialExpanded = false, isRTL }: { initialExpanded?: boolean; isRTL: boolean }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [titles, setTitles] = useState<string[]>([]);
  
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // نصوص التطبيق حسب اللغة
  const searchTexts = {
    ar: {
      searchPlaceholder: "ابحث عن حلقات، مقالات، قوائم تشغيل...",
      searchInPlatform: "ابحث هنا في كل ارجاء المنصه",
      resultsCount: "نتيجة لـ",
      noResults: "لم نتمكن من العثور على نتائج",
      tryDifferentKeywords: "جرب كلمات مفتاحية أخرى",
      clearSearch: "مسح البحث",
      searching: "جاري البحث...",
      viewAllResults: "عرض جميع النتائج",
      loading: "جاري التحميل...",
      episode: "حلقة",
      article: "مقال",
      playlist: "قائمة تشغيل",
      faq: "سؤال شائع",
      season: "موسم",
      teamMember: "عضو فريق",
      terms: "شروط وأحكام",
      privacy: "سياسة الخصوصية"
    },
    en: {
      searchPlaceholder: "Search for episodes, articles, playlists...",
      searchInPlatform: "Search across the entire platform",
      resultsCount: "results for",
      noResults: "We couldn't find any results",
      tryDifferentKeywords: "Try different keywords",
      clearSearch: "Clear Search",
      searching: "Searching...",
      viewAllResults: "View All Results",
      loading: "Loading...",
      episode: "Episode",
      article: "Article",
      playlist: "Playlist",
      faq: "FAQ",
      season: "Season",
      teamMember: "Team Member",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy"
    }
  };
  
  const searchT = searchTexts[isRTL ? 'ar' : 'en'];
  
  // إغلاق النتائج عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setShowSuggestions(false);
        if (!initialExpanded && !query.trim()) {
          setIsExpanded(false);
        }
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [query, initialExpanded]);
  
  // جلب العناوين للاقتراحات مع فلترة حسب اللغة
  useEffect(() => {
    async function loadTitles() {
      try {
        // جلب جميع البيانات من Sanity مع دعم اللغة
        const episodesQuery = `*[_type == "episode"]{
          _id,
          title,
          titleEn,
          language
        }`;
        
        const articlesQuery = `*[_type == "article"]{
          _id,
          title,
          titleEn,
          language
        }`;
        
        const playlistsQuery = `*[_type == "playlist"]{
          _id,
          title,
          titleEn,
          language
        }`;
        
        const faqsQuery = `*[_type == "faq"]{
          _id,
          question,
          questionEn,
          language
        }`;
        
        const seasonsQuery = `*[_type == "season"]{
          _id,
          title,
          titleEn,
          language
        }`;
        
        const teamMembersQuery = `*[_type == "teamMember"]{
          _id,
          name,
          nameEn,
          language
        }`;
        
        const [
          episodesData, 
          articlesData, 
          playlistsData, 
          faqsData, 
          seasonsData, 
          teamMembersData
        ] = await Promise.all([
          fetchFromSanity(episodesQuery) as Promise<SearchResult[]>,
          fetchFromSanity(articlesQuery) as Promise<SearchResult[]>,
          fetchFromSanity(playlistsQuery) as Promise<SearchResult[]>,
          fetchFromSanity(faqsQuery) as Promise<FaqResult[]>,
          fetchFromSanity(seasonsQuery) as Promise<SearchResult[]>,
          fetchFromSanity(teamMembersQuery) as Promise<TeamMemberResult[]>
        ]);
        
        // فلترة البيانات حسب اللغة الحالية فقط
        const currentLanguage = isRTL ? 'ar' : 'en';
        
        // إنشاء قائمة بالعناوين للاقتراحات مع فلترة حسب اللغة
        const allTitles = [
          // فلترة الحلقات حسب اللغة
          ...episodesData
            .filter((item: SearchResult) => item.language === currentLanguage)
            .map((item: SearchResult) => isRTL ? item.title || '' : (item.titleEn || item.title || '')),
          
          // فلترة المقالات حسب اللغة
          ...articlesData
            .filter((item: SearchResult) => item.language === currentLanguage)
            .map((item: SearchResult) => isRTL ? item.title || '' : (item.titleEn || item.title || '')),
          
          // فلترة قوائم التشغيل حسب اللغة
          ...playlistsData
            .filter((item: SearchResult) => item.language === currentLanguage)
            .map((item: SearchResult) => isRTL ? item.title || '' : (item.titleEn || item.title || '')),
          
          // فلترة الأسئلة الشائعة حسب اللغة
          ...faqsData
            .filter((item: FaqResult) => item.language === currentLanguage)
            .map((item: FaqResult) => isRTL ? item.question || '' : (item.questionEn || item.question || '')),
          
          // فلترة المواسم حسب اللغة
          ...seasonsData
            .filter((item: SearchResult) => item.language === currentLanguage)
            .map((item: SearchResult) => isRTL ? item.title || '' : (item.titleEn || item.title || '')),
          
          // فلترة أعضاء الفريق حسب اللغة
          ...teamMembersData
            .filter((item: TeamMemberResult) => item.language === currentLanguage)
            .map((item: TeamMemberResult) => isRTL ? item.name || '' : (item.nameEn || item.name || ''))
        ];
        
        // فلترة المصفوفة لإزالة أي قيم فارغة أو undefined
        const filteredTitles = allTitles.filter(title => title && title.trim() !== '');
        setTitles(filteredTitles);
      } catch (error) {
        console.error("Error loading titles:", error);
      }
    }
    
    loadTitles();
  }, [isRTL]); // إعادة التحميل عند تغيير اللغة
  
  // فلترة الاقتراحات
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    
    const term = query.toLowerCase();
    const filteredSuggestions = titles
      .filter(title => title.toLowerCase().includes(term))
      .slice(0, 8); // عرض 8 اقتراحات كحد أقصى
    
    setSuggestions(filteredSuggestions);
  }, [query, titles]);
  
  // البحث عند تغيير النص
  const performSearch = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      // استعلامات Sanity لجلب البيانات مع دعم اللغة
      const episodesQuery = `*[_type == "episode"]{
        _id, _type, title, titleEn, slug, description, descriptionEn, thumbnail,
        season->{_id, title, titleEn, slug},
        language
      }`;
      
      const articlesQuery = `*[_type == "article"]{
        _id, _type, title, titleEn, slug, excerpt, excerptEn, featuredImage,
        episode->{_id, title, titleEn, slug},
        language
      }`;
      
      const playlistsQuery = `*[_type == "playlist"]{
        _id, _type, title, titleEn, slug, description, descriptionEn,
        "imageUrl": image.asset->url,
        language
      }`;
      
      const faqsQuery = `*[_type == "faq"]{
        _id, _type, question, questionEn, answer, answerEn, category, categoryEn,
        language
      }`;
      
      const seasonsQuery = `*[_type == "season"]{
        _id, _type, title, titleEn, slug, thumbnail,
        language
      }`;
      
      const teamMembersQuery = `*[_type == "teamMember"]{
        _id, _type, name, nameEn, role, roleEn, slug, image, bio, bioEn,
        language
      }`;
      
      const termsQuery = `*[_type == "termsContent" && sectionType == "mainTerms"][0]{
        _id, _type, title, titleEn, content, contentEn, lastUpdated,
        language
      }`;
      
      const privacyQuery = `*[_type == "privacyContent" && sectionType == "mainPolicy"][0]{
        _id, _type, title, titleEn, content, contentEn, lastUpdated,
        language
      }`;
      
      // جلب البيانات بشكل متوازٍ
      const [
        episodesData, 
        articlesData, 
        playlistsData, 
        faqsData, 
        seasonsData, 
        teamMembersData, 
        termsData, 
        privacyData
      ] = await Promise.all([
        fetchFromSanity(episodesQuery) as Promise<SearchResult[]>,
        fetchFromSanity(articlesQuery) as Promise<SearchResult[]>,
        fetchFromSanity(playlistsQuery) as Promise<SearchResult[]>,
        fetchFromSanity(faqsQuery) as Promise<FaqResult[]>,
        fetchFromSanity(seasonsQuery) as Promise<SearchResult[]>,
        fetchFromSanity(teamMembersQuery) as Promise<TeamMemberResult[]>,
        fetchFromSanity(termsQuery) as Promise<SearchResult | null>,
        fetchFromSanity(privacyQuery) as Promise<SearchResult | null>
      ]);
      
      // تحويل البيانات إلى الأنواع المناسبة
      const episodes = episodesData as SearchResult[];
      const articles = articlesData as SearchResult[];
      const playlists = playlistsData as SearchResult[];
      const seasons = seasonsData as SearchResult[];
      const terms = termsData as SearchResult | null;
      const privacy = privacyData as SearchResult | null;
      
      // فلترة البيانات حسب اللغة الحالية فقط
      const currentLanguage = isRTL ? 'ar' : 'en';
      
      const filteredEpisodes = episodes.filter(item => item.language === currentLanguage);
      const filteredArticles = articles.filter(item => item.language === currentLanguage);
      const filteredPlaylists = playlists.filter(item => item.language === currentLanguage);
      const filteredFaqs = (faqsData as FaqResult[]).filter(item => item.language === currentLanguage);
      const filteredSeasons = seasons.filter(item => item.language === currentLanguage);
      const filteredTeamMembers = (teamMembersData as TeamMemberResult[]).filter(item => item.language === currentLanguage);
      
      // حساب عدد الحلقات لكل موسم
      const episodesCountQuery = `*[_type == "episode"]{ season->{_id} }`;
      const episodesCountData = await fetchFromSanity(episodesCountQuery) as { season?: { _id: string } }[];
      
      const episodeCounts: Record<string, number> = {};
      episodesCountData.forEach((ep) => {
        if (ep.season?._id) {
          episodeCounts[ep.season._id] = (episodeCounts[ep.season._id] || 0) + 1;
        }
      });
      
      // إضافة عدد الحلقات لكل موسم
      const seasonsWithCount = filteredSeasons.map(season => ({
        ...season,
        episodeCount: episodeCounts[season._id] || 0
      }));
      
      // تحويل الأسئلة الشائعة إلى نفس تنسيق النتائج الأخرى
      const faqs = filteredFaqs.map(faq => ({
        ...faq,
        title: faq.question,
        titleEn: faq.questionEn,
        excerpt: faq.answer,
        excerptEn: faq.answerEn
      }));
      
      // تحويل أعضاء الفريق إلى نفس تنسيق النتائج الأخرى
      const teamMembers = filteredTeamMembers.map(member => ({
        ...member,
        title: member.name,
        titleEn: member.nameEn,
        excerpt: member.bio,
        excerptEn: member.bioEn
      }));
      
      // إضافة الشروط والأحكام وسياسة الخصوصية إذا كانت موجودة وتطابق اللغة
      const termsAndPrivacy: SearchResult[] = [];
      if (terms && terms.language === currentLanguage) {
        termsAndPrivacy.push({
          ...terms,
          _type: "terms",
          slug: { current: "terms-conditions" }
        });
      }
      
      if (privacy && privacy.language === currentLanguage) {
        termsAndPrivacy.push({
          ...privacy,
          _type: "privacy",
          slug: { current: "privacy-policy" }
        });
      }
      
      // دمج جميع النتائج المفلترة حسب اللغة
      const allResults = [
        ...filteredEpisodes,
        ...filteredArticles,
        ...filteredPlaylists,
        ...faqs,
        ...seasonsWithCount,
        ...teamMembers,
        ...termsAndPrivacy
      ];
      
      // فلترة النتائج حسب البحث
      const q = searchQuery.trim().toLowerCase();
      const searchResults = allResults.filter((result) => {
        // البحث في العناوين بناءً على اللغة الحالية
        const title = isRTL 
          ? (result.title || "").toString().toLowerCase()
          : ((result.titleEn || result.title) || "").toString().toLowerCase();
        
        // البحث في المحتوى بناءً على اللغة الحالية
        let excerpt = isRTL
          ? (result.excerpt || result.description || result.answer || result.role || "").toString().toLowerCase()
          : ((result.excerptEn || result.descriptionEn || result.answerEn || result.roleEn || 
              result.excerpt || result.description || result.answer || result.role) || "").toString().toLowerCase();
        
        // إذا كان النتيجة من نوع الشروط والأحكام أو سياسة الخصوصية، ابحث في المحتوى أيضاً
        if ((result._type === "terms" || result._type === "privacy")) {
          try {
            const content = isRTL ? result.content : result.contentEn;
            if (content) {
              const contentText = content
                .filter((block: PortableTextBlock) => block._type === "block")
                .map((block: PortableTextBlock) => 
                  block.children
                    .map((child: PortableTextSpan) => child.text)
                    .join("")
                )
                .join(" ")
                .toLowerCase();
              
              excerpt = contentText;
            }
          } catch (error) {
            console.error("Error extracting content text:", error);
          }
        }
        
        return title.includes(q) || excerpt.includes(q);
      });
      
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isRTL]);
  
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    
    const delayDebounce = setTimeout(() => {
      performSearch(query);
    }, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [query, performSearch]);
  
  // التعامل مع اختيار الاقتراح
  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
  };
  
  // التعامل مع مفاتيح لوحة المفاتيح للاقتراحات
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0 && selectedSuggestion < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedSuggestion]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        break;
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setShowResults(false);
      setShowSuggestions(false);
      if (!initialExpanded) {
        setIsExpanded(false);
      }
    }
  };
  
  const handleFocus = () => {
    if (!initialExpanded) {
      setIsExpanded(true);
    }
    if (query.trim().length >= 2) {
      setShowResults(true);
    }
    setShowSuggestions(true);
  };
  
  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setShowSuggestions(false);
    if (!initialExpanded) {
      setIsExpanded(false);
    }
    setTimeout(() => {
      const inputElement = searchRef.current?.querySelector('input');
      if (inputElement) {
        inputElement.focus();
      }
    }, 0);
  };
  
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setShowSuggestions(false);
    setQuery("");
    
    // تحديد الرابط المناسب حسب نوع النتيجة
    const getLink = () => {
      const idOrSlug = result.slug?.current ?? result._id;
      const encoded = encodeURIComponent(String(idOrSlug));
      switch (result._type) {
        case "episode": return `/episodes/${encoded}`;
        case "article": return `/articles/${encoded}`;
        case "playlist": return `/playlists/${encoded}`;
        case "faq": return `/faq?faq=${encoded}`;
        case "season": return `/seasons/${encoded}`;
        case "teamMember": return `/team/${encoded}`;
        case "terms": return `/terms-conditions`;
        case "privacy": return `/privacy-policy`;
        default: return "#";
      }
    };
    
    const href = getLink();
    router.push(href);
    
    if (!initialExpanded) {
      setIsExpanded(false);
    }
  };
  
  const getIcon = (type: string) => {
    switch (type) {
      case "episode":
        return (
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "article":
        return (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        );
      case "playlist":
        return (
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        );
      case "faq":
        return (
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "season":
        return (
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "teamMember":
        return (
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 100-6 3 3 0 000 6zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case "terms":
        return (
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case "privacy":
        return (
          <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 dark:bg-gray-700/30 rounded-xl shadow-sm">
            <svg className="w-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        );
    }
  };
  
  const getImageUrl = (result: SearchResult): string => {
    try {
      if (result.thumbnail) {
        const url = buildSearchMediaUrl(result.thumbnail);
        return url;
      }
      if (result.featuredImage) {
        const url = buildSearchMediaUrl(result.featuredImage);
        return url;
      }
      if (result.image) {
        const url = buildSearchMediaUrl(result.image);
        return url;
      }
      if (result._type === "playlist" && result.imageUrl) {
        return result.imageUrl;
      }
      
      if (result._type === "terms") {
        return "/images/terms-default.jpg";
      }
      if (result._type === "privacy") {
        return "/images/privacy-default.jpg";
      }
      
      return "/placeholder.png";
    } catch (error) {
      console.error("Error getting image URL:", error);
      return "/placeholder.png";
    }
  };
  
  const getDisplayText = (result: SearchResult) => {
    if (isRTL) {
      if (result.excerpt) return result.excerpt;
      if (result.description) return result.description;
      if (result.answer) return result.answer;
      if (result.role) return result.role;
    } else {
      if (result.excerptEn) return result.excerptEn;
      if (result.descriptionEn) return result.descriptionEn;
      if (result.answerEn) return result.answerEn;
      if (result.roleEn) return result.roleEn;
      // إذا لم توجد ترجمة، استخدم النص العربي كبديل
      if (result.excerpt) return result.excerpt;
      if (result.description) return result.description;
      if (result.answer) return result.answer;
      if (result.role) return result.role;
    }
    
    if ((result._type === "terms" || result._type === "privacy") && result.content) {
      try {
        const content = isRTL ? result.content : result.contentEn;
        if (content) {
          return content
            .filter((block: PortableTextBlock) => block._type === "block")
            .slice(0, 2)
            .map((block: PortableTextBlock) => 
              block.children
                .map((child: PortableTextSpan) => child.text)
                .join("")
            )
            .join(" ")
            .substring(0, 200) + "...";
        }
      } catch (error) {
        console.error("Error extracting content text:", error);
      }
    }
    
    return "";
  };
  
  const getDisplayTitle = (result: SearchResult) => {
    if (isRTL) {
      return result.title || '';
    } else {
      return result.titleEn || result.title || '';
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "episode": return searchT.episode;
      case "article": return searchT.article;
      case "playlist": return searchT.playlist;
      case "faq": return searchT.faq;
      case "season": return searchT.season;
      case "teamMember": return searchT.teamMember;
      case "terms": return searchT.terms;
      case "privacy": return searchT.privacy;
      default: return type;
    }
  };
  
  return (
    <div className="relative" ref={searchRef}>
      <form 
        onSubmit={handleSubmit} 
        className={`relative flex items-center transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-10'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedSuggestion(-1);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={searchT.searchPlaceholder}
          className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 h-10 ${isRTL ? 'pr-10 pl-2' : 'pl-10 pr-2'} rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-in-out text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
            isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'
          }`}
        />
        <button
          type="submit"
          className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 shadow-md hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 ease-in-out"
          onClick={handleFocus}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </button>
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </form>
      
      {/* قائمة الاقتراحات */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 ${isRTL ? 'right-0' : 'left-0'} mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-96 overflow-y-auto`}
          >
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150 flex items-center gap-3 ${
                    index === selectedSuggestion ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* قائمة النتائج */}
      <AnimatePresence>
        {showResults && isExpanded && (query.trim().length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 ${isRTL ? 'right-0' : 'left-0'} mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-96 overflow-y-auto`}
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{searchT.searching}</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-1">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {results.length} {searchT.resultsCount} &quot;{query}&quot;
                </div>
                {results.slice(0, 5).map((result) => (
                  <div
                    key={`${result._type}-${result._id}`}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150 flex items-center gap-3"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex-shrink-0">
                      {getIcon(result._type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {renderHighlighted(getDisplayTitle(result), query)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {getTypeLabel(result._type)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {renderHighlighted(getDisplayText(result), query)}
                      </p>
                    </div>
                    {getImageUrl(result) && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                        <Image
                          src={getImageUrl(result)}
                          alt={getDisplayTitle(result)}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={handleSubmit}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                  >
                    {searchT.viewAllResults}
                    <svg className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                    </svg>
                  </button>
                </div>
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{searchT.noResults}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{searchT.tryDifferentKeywords}</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// مكون تبديل الوضع الداكن
const DarkModeSwitch = ({ isDark, toggleDarkMode }: { isDark: boolean; toggleDarkMode: () => void }) => {
  return (
    <motion.button
      onClick={toggleDarkMode}
      className={`relative inline-flex items-center h-7 rounded-full w-14 transition-all duration-500 ease-in-out focus:outline-none overflow-hidden ${
        isDark ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-yellow-400 to-orange-500'
      }`}
      aria-label="تبديل الوضع الليلي"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* خلفية متحركة */}
      <motion.div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)'
        }}
      />
      
      {/* مؤشر التبديل */}
      <motion.div
        className={`absolute w-5 h-5 rounded-full bg-white shadow-lg z-10 ${
          isDark ? 'left-8' : 'left-1'
        }`}
        layout
        transition={{ 
          type: "spring", 
          stiffness: 700, 
          damping: 30,
          duration: 0.5
        }}
      />
      
      {/* أيقونة الشمس */}
      <motion.div
        className={`absolute right-1.5 top-1.5 text-yellow-300 z-0 ${
          isDark ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
        }`}
        animate={{ 
          opacity: isDark ? 0 : 1,
          scale: isDark ? 0.5 : 1,
          rotate: isDark ? -30 : 0
        }}
        transition={{ duration: 0.5 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 00-1-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707+.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      </motion.div>
      
      {/* أيقونة القمر */}
      <motion.div
        className={`absolute left-1.5 top-1.5 text-blue-200 z-0 ${
          isDark ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
        animate={{ 
          opacity: isDark ? 1 : 0,
          scale: isDark ? 1 : 0.5,
          rotate: isDark ? 0 : 30
        }}
        transition={{ duration: 0.5 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </motion.div>
      
      {/* النجوم في الوضع الليلي */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${20 + i * 15}%`,
              left: `${30 + (i * 10) % 40}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </motion.button>
  );
};

// مكون تبديل اللغة المُحسَّن بنفس حجم زر الوضع الليلي
const LanguageSwitch = ({ isRTL, toggleLanguage }: { isRTL: boolean; toggleLanguage: () => void }) => {
  return (
    <motion.button
      onClick={toggleLanguage}
      className={`relative inline-flex items-center h-7 rounded-full w-14 transition-all duration-500 ease-in-out focus:outline-none overflow-hidden shadow-lg ${
        isRTL ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
      }`}
      aria-label="تبديل اللغة"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* خلفية متحركة مع تأثير التوهج */}
      <motion.div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          isRTL ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)'
        }}
      />
      
      {/* مؤشر التبديل المحسَّن */}
      <motion.div
        className={`absolute w-5 h-5 rounded-full bg-white shadow-lg z-10 flex items-center justify-center ${
          isRTL ? 'left-8' : 'left-1'
        }`}
        layout
        transition={{ 
          type: "spring", 
          stiffness: 700, 
          damping: 30,
          duration: 0.5
        }}
      >
        {/* أيقونة صغيرة داخل المؤشر */}
        <motion.div
          animate={{ 
            rotate: isRTL ? 0 : 180,
            transition: { duration: 0.5 }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </motion.div>
      </motion.div>
      
      {/* أيقونة الإنجليزية المحسَّنة */}
      <motion.div
        className={`absolute right-1.5 top-1.5 text-white z-0 flex items-center justify-center ${
          isRTL ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
        }`}
        animate={{ 
          opacity: isRTL ? 0 : 1,
          scale: isRTL ? 0.5 : 1,
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold">EN</span>
          <div className="w-2 h-0.5 bg-white rounded-full mt-0.5"></div>
        </div>
      </motion.div>
      
      {/* أيقونة العربية المحسَّنة */}
      <motion.div
        className={`absolute left-1.5 top-1.5 text-white z-0 flex items-center justify-center ${
          isRTL ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
        animate={{ 
          opacity: isRTL ? 1 : 0,
          scale: isRTL ? 1 : 0.5,
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold">AR</span>
          <div className="w-2 h-0.5 bg-white rounded-full mt-0.5"></div>
        </div>
      </motion.div>
      
      {/* تأثير النجوم المتحركة */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isRTL ? 'opacity-100' : 'opacity-0'}`}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${25 + i * 25}%`,
              left: `${20 + (i * 15) % 60}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
      
      {/* تأثير التوهج حول الزر */}
      <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
        isRTL ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 blur-md"></div>
      </div>
    </motion.button>
  );
};

// مكون تبديل اللغة للقائمة الجانبية في الموبايل
const MobileLanguageSwitch = ({ isRTL, toggleLanguage }: { isRTL: boolean; toggleLanguage: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <button
        onClick={() => {
          toggleLanguage();
        }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
      >
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
          isRTL 
            ? 'from-emerald-500 via-teal-500 to-cyan-500' 
            : 'from-blue-500 via-indigo-500 to-purple-500'
        } flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg`}>
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 11-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
            </svg>
            {/* مؤشر اللغة الحالية */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-gray-800">
                {isRTL ? 'ع' : 'E'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {isRTL ? 'اللغة العربية' : 'English Language'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isRTL ? 'English' : 'العربية'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className={`h-0.5 w-0 bg-gradient-to-r ${
            isRTL 
              ? 'from-emerald-500 to-cyan-500' 
              : 'from-blue-500 to-purple-500'
          } group-hover:w-full transition-all duration-300`}></div>
        </div>
      </button>
    </motion.div>
  );
};

// مكون زر الإشعارات المحدث مع دعم اللغة
const NotificationButton = ({ 
  showNotifications, 
  setShowNotifications,
  isRTL,
  isMobile = false
}: { 
  showNotifications: boolean; 
  setShowNotifications: (show: boolean) => void;
  isRTL: boolean;
  isMobile?: boolean;
}) => {
  const router = useRouter();
  const [hasNewNotifications, setHasNewNotifications] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const notificationRef = useRef<HTMLDivElement>(null);
  const t = translations[isRTL ? 'ar' : 'en'];
  
  // تعديل: جلب الإشعارات حسب اللغة الحالية
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // تمرير اللغة الحالية إلى دالة getAllNotifications
        const currentLanguage = isRTL ? 'ar' : 'en';
        const data = await getAllNotifications(currentLanguage);
        setNotifications(data.slice(0, 3)); // أخذ آخر 3 إشعارات فقط
        if (data.length > 0) {
          setHasNewNotifications(true);
        } else {
          setHasNewNotifications(false);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isRTL]); // إعادة التحميل عند تغيير اللغة
  
  const handleNotificationClick = (notification: NotificationItem) => {
    let finalLink = notification.linkUrl;
    if (notification.type === 'faq' && notification.id) {
      finalLink = `/faq?faq=${notification.id}`;
    } else if (notification.type === 'terms') {
      finalLink = notification.id ? `/terms-conditions#${notification.id}` : '/terms-conditions';
    } else if (notification.type === 'privacy') {
      finalLink = notification.id ? `/privacy-policy#${notification.id}` : '/privacy-policy';
    }
    
    router.push(finalLink);
    setShowNotifications(false);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return isRTL ? 'تاريخ غير متوفر' : 'Date not available';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return isRTL ? 'تاريخ غير صالح' : 'Invalid date';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (isRTL) {
        if (diffInSeconds < 60) return 'منذ لحظات';
        else if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
        else if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
        else if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
        else if (diffInSeconds < 31536000) return `منذ ${Math.floor(diffInSeconds / 2592000)} شهر`;
        else return `منذ ${Math.floor(diffInSeconds / 31536000)} سنة`;
      } else {
        if (diffInSeconds < 60) return 'Just now';
        else if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        else if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        else if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        else if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
        else return `${Math.floor(diffInSeconds / 31536000)} years ago`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return isRTL ? 'خطأ في التاريخ' : 'Date error';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'episode': return '🎬';
      case 'article': return '📝';
      case 'playlist': return '📋';
      case 'faq': return '❓';
      case 'terms': return '📜';
      case 'privacy': return '🔒';
      case 'team': return '👥';
      default: return '📢';
    }
  };

  // في الموبايل، سنعرض الإشعارات كشريط من الأعلى بدلاً من القائمة المنسدلة
  if (isMobile) {
    return (
      <>
        <motion.button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* أيقونة الجرس */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          
          {/* مؤشر الإشعارات الجديدة */}
          {hasNewNotifications && (
            <motion.span 
              className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                delay: 0.2
              }}
            />
          )}
          
          {/* حركة تموج عند وجود إشعارات جديدة */}
          {hasNewNotifications && (
            <motion.span 
              className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full opacity-70"
              animate={{ 
                scale: [1, 1.5, 2],
                opacity: [0.7, 0.4, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
            />
          )}
        </motion.button>
        
        {/* قائمة الإشعارات من الأعلى للموبايل - مع تحسينات في التصميم والانحناءات */}
        <AnimatePresence>
          {showNotifications && (
            <>
              {/* طبقة التعتيم بدون تأثير الضبابية */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setShowNotifications(false)}
              />
              
              {/* قائمة الإشعارات من الأعلى مع تحسينات */}
              <motion.div
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ 
                  y: "-100%", 
                  opacity: 0,
                  transition: {
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1]
                  }
                }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 300,
                  mass: 0.8,
                  duration: 0.5
                }}
                className="fixed top-20 left-4 right-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl z-50 max-h-[70vh] overflow-hidden"
                style={{
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* مقبض السحب المحسن */}
                <div className="flex justify-center py-3 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                  <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                
                {/* رأس الإشعارات المحسن */}
                <div className="px-5 pb-4 pt-2 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {hasNewNotifications && (
                          <motion.span 
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [1, 0.7, 1]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity
                            }}
                          />
                        )}
                      </span>
                      {t.notifications}
                    </h3>
                    <button
                      onClick={() => router.push("/notifications")}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 px-3 py-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                    >
                      {t.viewAll}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* قائمة الإشعارات المحسنة */}
                <div className="overflow-y-auto max-h-[50vh] px-5 pb-5">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t.loading}</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="space-y-3 py-4">
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={`${notification.type}-${notification.id}`}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                              {getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {formatDate(notification.date)}
                              </p>
                              {notification.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                  {notification.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-base text-gray-500 dark:text-gray-400">{t.noNotifications}</p>
                    </div>
                  )}
                </div>
                
                {/* شريط سفيف مع انحناءات */}
                <div className="px-5 pb-5 pt-2 bg-gradient-to-t from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                  <motion.button
                    onClick={() => setShowNotifications(false)}
                    className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {isRTL ? 'إغلاق' : 'Close'}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // للكمبيوتر، نستخدم القائمة المنسدلة الأصلية
  return (
    <div className="relative notification-dropdown" ref={notificationRef}>
      <motion.button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* أيقونة الجرس */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* مؤشر الإشعارات الجديدة */}
        {hasNewNotifications && (
          <motion.span 
            className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              delay: 0.2
            }}
          />
        )}
        
        {/* حركة تموج عند وجود إشعارات جديدة */}
        {hasNewNotifications && (
          <motion.span 
            className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full opacity-70"
            animate={{ 
              scale: [1, 1.5, 2],
              opacity: [0.7, 0.4, 0]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 0.5
            }}
          />
        )}
      </motion.button>
      
      {/* القائمة المنسدلة للإشعارات */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-96 overflow-y-auto ${
              isRTL ? 'left-0' : 'right-0'
            } mt-2 w-80`}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.notifications}</h3>
                <button
                  onClick={() => router.push("/notifications")}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  {t.viewAll}
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t.loading}</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={`${notification.type}-${notification.id}`}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className={`${isRTL ? 'mr-3' : 'ml-3'} flex-1 min-w-0`}>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(notification.date)}
                        </p>
                        {notification.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.noNotifications}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// المكون الرئيسي للشريط العلوي مع دعم اللغة
export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isRTL, setIsRTL] = useState(true); // القيمة الافتراضية هي العربية (RTL)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const t = translations[isRTL ? 'ar' : 'en'];
  
  useEffect(() => {
    setMounted(true);
    
    // التحقق من تفضيل الوضع المحفوظ في localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDark(savedDarkMode === 'true');
    } else {
      // إذا لم يكن هناك تفضيل محفوظ، استخدم تفضيل النظام
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    }
    
    // التحقق من تفضيل اللغة المحفوظ في localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
      setIsRTL(savedLanguage === 'ar');
    } else {
      // إذا لم يكن هناك تفضيل محفوظ، استخدم لغة المتصفح
      const browserLang = navigator.language || '';
      setIsRTL(browserLang.includes('ar'));
    }
  }, []);
  
  useEffect(() => {
    if (mounted) {
      // حفظ تفضيل المستخدم في localStorage
      localStorage.setItem('darkMode', isDark.toString());
      
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [isDark, mounted]);
  
  useEffect(() => {
    if (mounted) {
      // حفظ تفضيل اللغة في localStorage
      localStorage.setItem('language', isRTL ? 'ar' : 'en');
      
      // تطبيق اتجاه الصفحة بناءً على اللغة
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = isRTL ? 'ar' : 'en';
    }
  }, [isRTL, mounted]);
  
  function resolveAvatarRaw(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    try {
      if (typeof raw === "string") return raw;
      return undefined;
    } catch {
      return undefined;
    }
  }
  
  const rawAvatarCandidate = user?.imageUrl;
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(
    () => resolveAvatarRaw(rawAvatarCandidate)
  );
  
  useEffect(() => {
    setAvatarSrc(
      resolveAvatarRaw(
        user?.imageUrl
      )
    );
  }, [user]);
  
  const displayName = user?.fullName || user?.firstName || (isRTL ? "المستخدم" : "User");
  const initials = (displayName || (isRTL ? "مستخدم" : "User"))
    .split(" ")
    .filter(Boolean)
    .map(s => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  
  const handleManage = () => {
    setProfileOpen(false);
    setTimeout(() => router.push("/profile"), 100);
  };
  
  const handleFavorites = () => {
    setProfileOpen(false);
    setTimeout(() => router.push("/favorites"), 100);
  };
  
  const handleSignOut = async () => {
    setProfileOpen(false);
    setTimeout(async () => {
      await signOut();
      router.push("/");
    }, 100);
  };
  
  const toggleMobileMenu = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };
  
  const toggleLanguage = () => {
    // حفظ اللغة الجديدة في localStorage
    localStorage.setItem('language', isRTL ? 'en' : 'ar');
    
    // إعادة تحميل الصفحة لتطبيق التغيير
    window.location.reload();
  };
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (contentOpen && !(e.target as Element).closest('.content-dropdown')) {
        setContentOpen(false);
      }
      if (aboutOpen && !(e.target as Element).closest('.about-dropdown')) {
        setAboutOpen(false);
      }
      if (contactOpen && !(e.target as Element).closest('.contact-dropdown')) {
        setContactOpen(false);
      }
      // إغلاق قائمة الإشعارات عند النقر خارجها
      if (showNotifications && !(e.target as Element).closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
      // إغلاق القائمة الجانبية عند النقر خارجها
      if (mobileMenuOpen && !(e.target as Element).closest('.mobile-menu-container')) {
        setMobileMenuOpen(false);
      }
    }
    
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setContentOpen(false);
        setAboutOpen(false);
        setContactOpen(false);
        setShowNotifications(false);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [contentOpen, mobileMenuOpen, aboutOpen, contactOpen, showNotifications]);
  
  if (!mounted) return null;
  
  // تحديد مسار الشعار بناءً على اللغة
  const logoSrc = isRTL ? "/logo.png" : "/logoE.png";
  
  return (
    <>
      {/* النافبار الرئيسي للكمبيوتر - تم تكبير العرض */}
      <nav className="hidden md:flex fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-6xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl rounded-2xl border border-white/20 dark:border-gray-700/30 py-1.5 px-4 transition-all duration-300">
        <div className="flex justify-between items-center w-full">
          {/* القسم الأيسر - الشعار والروابط */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-75 transition duration:500"></div>
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 rounded-full shadow-xl border-2 border-white/30 transition-all duration-500 transform group-hover:scale-110 group-hover:shadow-lg">
                  <Image 
                    src={logoSrc} 
                    alt="فذلكه" 
                    width={32} 
                    height={32}
                    className="object-contain transition-transform duration-500 group-hover:rotate-12"
                  />
                </div>
              </div>
            </Link>
            
            {/* الروابط الرئيسية بجوار الشعار مباشرة */}
            <div className={`flex items-center space-x-0 ${isRTL ? 'mr-1' : 'ml-1'}`}>
              <Link href="/" className={`px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                {t.home}
              </Link>
              
              <div className="relative content-dropdown">
                <button
                  onClick={() => setContentOpen(!contentOpen)}
                  className={`px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                  {t.content}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${contentOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                {contentOpen && (
                  <div className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-300 transform origin-top opacity-0 scale-95 animate-fade-in z-50`}>
                    <div className="p-1">
                      <Link href="/episodes" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        <span className="text-sm font-medium">{t.episodes}</span>
                      </Link>
                      <Link href="/playlists" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 group-hover:text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        <span className="text-sm font-medium">{t.playlists}</span>
                      </Link>
                      <Link href="/seasons" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 group-hover:text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H8V3a1 1 0 00-1-1H6zM4 8h12v8H4V8z" />
                        </svg>
                        <span className="text-sm font-medium">{t.seasons}</span>
                      </Link>
                      <Link href="/articles" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 group-hover:text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                        </svg>
                        <span className="text-sm font-medium">{t.articles}</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative about-dropdown">
                <button
                  onClick={() => setAboutOpen(!aboutOpen)}
                  className={`px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                  </svg>
                  {t.about}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${aboutOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                {aboutOpen && (
                  <div className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-300 transform origin-top opacity-0 scale-95 animate-fade-in z-50`}>
                    <div className="p-1">
                      <Link href="/about" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                        </svg>
                        <span className="text-sm font-medium">{t.whoWeAre}</span>
                      </Link>
                      
                      <Link href="/follow-us" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        {/* أيقونة الشبكة الجديدة باللون الأحمر */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 group-hover:text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.75 5.25A.75.75 0 014.5 4.5h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75V5.25zm0 9A.75.75 0 014.5 13.5h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75v-5.25zm9-9A.75.75 0 0113.5 4.5h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H13.5a.75.75 0 01-.75-.75V5.25zm0 9a.75.75 0 01.75-.75h5.25a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H13.5a.75.75 0 01-.75-.75v-5.25z" />
                        </svg>
                        <span className="text-sm font-medium">{t.platforms}</span>
                      </Link>
                      
                      <Link href="/team" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 group-hover:text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                        <span className="text-sm font-medium">{t.team}</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative contact-dropdown">
                <button
                  onClick={() => setContactOpen(!contactOpen)}
                  className={`px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {t.contact}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${contactOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                {contactOpen && (
                  <div className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-300 transform origin-top opacity-0 scale-95 animate-fade-in z-50`}>
                    <div className="p-1">
                      <Link href="/contact" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span className="text-sm font-medium">{t.contactUs}</span>
                      </Link>
                      <Link href="/faq" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 group-hover:text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                        </svg>
                        <span className="text-sm font-medium">{t.faq}</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              {/* قسم البحث */}
              <div className="relative">
                <SearchBar isRTL={isRTL} />
              </div>
            </div>
          </div>
          
          {/* القسم الأيمن - الوضع الداكن واللغة والحساب */}
          <div className="flex items-center space-x-1">
            {/* أيقونة الوضع الداكن */}
            <DarkModeSwitch isDark={isDark} toggleDarkMode={toggleDarkMode} />
            
            {/* أيقونة تبديل اللغة - بنفس حجم زر الوضع الليلي */}
            <LanguageSwitch isRTL={isRTL} toggleLanguage={toggleLanguage} />
            
            <SignedOut>
              <div className="flex items-center space-x-1">
                <Link href="/sign-in" className="px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white">
                  {t.signIn}
                </Link>
                <Link href="/sign-up" className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm font-medium text-white shadow-md">
                  {t.signUp}
                </Link>
              </div>
            </SignedOut>
            
            <SignedIn>
              {/* زر الإشعارات المحدث */}
              <div className="notification-dropdown">
                <NotificationButton 
                  showNotifications={showNotifications} 
                  setShowNotifications={setShowNotifications}
                  isRTL={isRTL}
                />
              </div>
              
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(prev => !prev)}
                  aria-expanded={profileOpen}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-all duration-300"
                >
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt={displayName}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover border-2 border-white/30"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarSrc(undefined)}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-800 text-white flex items-center justify-center font-semibold border-2 border-white/30 text-xs">
                      {initials}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium text-gray-900 dark:text-white">{displayName}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-gray-500 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                
                {profileOpen && (
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-300 transform origin-top-${isRTL ? 'left' : 'right'} opacity-0 scale-95 animate-fade-in z-50`}>
                    <div className="p-1">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</p>
                      </div>
                      <button
                        onClick={handleManage}
                        className="w-full text-right px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between group"
                      >
                        <span className="text-sm font-medium">{t.manageAccount}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleFavorites}
                        className="w-full text-right px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between group"
                      >
                        <span className="text-sm font-medium">{t.favorites}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-right px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center justify-between group"
                      >
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">{t.signOut}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 group-hover:text-red-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SignedIn>
          </div>
        </div>
      </nav>
      
      {/* النافبار الجديد للموبايل */}
      <nav className="md:hidden fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl rounded-2xl border border-white/20 dark:border-gray-700/30 py-3 px-4 transition-all duration-300">
        <div className="flex justify-between items-center">
          {/* القسم الأيسر - حساب المستخدم والإشعارات */}
          <div className="flex items-center space-x-2">
            <SignedIn>
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center"
              >
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={displayName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarSrc(undefined)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-800 text-white flex items-center justify-center font-semibold border-2 border-white/30 text-xs">
                    {initials}
                  </div>
                )}
              </button>
              
              {/* زر الإشعارات بجنب زر الحساب في الموبايل - مع تمرير isMobile=true */}
              <NotificationButton 
                showNotifications={showNotifications} 
                setShowNotifications={setShowNotifications}
                isRTL={isRTL}
                isMobile={true}
              />
            </SignedIn>
            
            <SignedOut>
              <Link href="/sign-in">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" />
                  </svg>
                </div>
              </Link>
            </SignedOut>
          </div>
          
          {/* القسم الأوسط - الشعار */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="flex items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-75 transition duration:500"></div>
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 rounded-full shadow-xl border-2 border-white/30 transition-all duration-500 transform group-hover:scale-110 group-hover:shadow-lg">
                  <Image 
                    src={logoSrc} 
                    alt="فذلكه" 
                    width={36} 
                    height={36}
                    className="object-contain transition-transform duration-500 group-hover:rotate-12"
                  />
                </div>
              </div>
            </Link>
          </div>
          
          {/* القسم الأيمن - الأزرار (تم إزالة زر تبديل اللغة) */}
          <div className="flex items-center space-x-2">
            {/* أيقونة الوضع الداكن */}
            <DarkModeSwitch isDark={isDark} toggleDarkMode={toggleDarkMode} />
            
            {/* زر القائمة */}
            <button
              id="mobile-menu-button"
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
      
      {/* القائمة الجانبية للموبايل - تعديل اتجاه الظهور حسب اللغة */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* طبقة التعتيم */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={(e) => {
                // تجاهل النقر إذا كان على زر القائمة
                if ((e.target as Element).closest('#mobile-menu-button')) return;
                setMobileMenuOpen(false);
              }}
            />
            
            {/* القائمة الجانبية - تعديل اتجاه الظهور حسب اللغة */}
            <motion.div
              initial={{ x: isRTL ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? "-100%" : "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`mobile-menu-container fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-80 max-w-full bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto md:hidden`}
            >
              <div className="flex flex-col h-full">
                {/* رأس القائمة */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">فذلكة</h2>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* معلومات المستخدم */}
                  <SignedIn>
                    <div className="mt-6 flex items-center">
                      {avatarSrc ? (
                        <Image
                          src={avatarSrc}
                          alt={displayName}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white/30"
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarSrc(undefined)}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center font-semibold border-2 border-white/30 text-lg">
                          {initials}
                        </div>
                      )}
                      <div className="mr-3">
                        <p className="font-semibold text-lg">{displayName}</p>
                        <p className="text-sm opacity-80">{user?.emailAddresses?.[0]?.emailAddress}</p>
                      </div>
                    </div>
                  </SignedIn>
                </div>
                
                {/* شريط البحث */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <SearchBar initialExpanded={true} isRTL={isRTL} />
                </div>
                
                {/* قائمة الروابط */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    {[
                      { href: "/", icon: "home", label: t.home, color: "from-blue-500 to-cyan-500" },
                      { href: "/episodes", icon: "video", label: t.episodes, color: "from-purple-500 to-pink-500" },
                      { href: "/playlists", icon: "playlist", label: t.playlists, color: "from-green-500 to-teal-500" },
                      { href: "/seasons", icon: "calendar", label: t.seasons, color: "from-yellow-500 to-orange-500" },
                      { href: "/articles", icon: "article", label: t.articles, color: "from-red-500 to-rose-500" },
                      { href: "/about", icon: "info", label: t.whoWeAre, color: "from-indigo-500 to-blue-500" },
                      { href: "/follow-us", icon: "grid", label: t.platforms, color: "from-indigo-500 to-blue-500" },
                      { href: "/team", icon: "team", label: t.team, color: "from-pink-500 to-rose-500" },
                      { href: "/contact", icon: "mail", label: t.contactUs, color: "from-cyan-500 to-blue-500" },
                      { href: "/faq", icon: "question", label: t.faq, color: "from-teal-500 to-green-500" }
                    ].map((item, index) => (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg`}>
                            {item.icon === "home" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                              </svg>
                            )}
                            {item.icon === "video" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                            )}
                            {item.icon === "playlist" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                              </svg>
                            )}
                            {item.icon === "calendar" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H8V3a1 1 0 00-1-1H6zM4 8h12v8H4V8z" />
                              </svg>
                            )}
                            {item.icon === "article" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                              </svg>
                            )}
                            {item.icon === "question" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                              </svg>
                            )}
                            {item.icon === "info" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                              </svg>
                            )}
                            {item.icon === "team" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                              </svg>
                            )}
                            {item.icon === "mail" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="text-lg font-medium text-gray-900 dark:text-white">{item.label}</span>
                            <div className="h-0.5 w-0 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    
                    {/* إضافة زر تبديل اللغة في قائمة الموبايل */}
                    <MobileLanguageSwitch isRTL={isRTL} toggleLanguage={toggleLanguage} />
                    
                    {/* إضافة رابط الإشعارات في قائمة الموبايل */}
                    <SignedIn>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/notifications"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="text-lg font-medium text-gray-900 dark:text-white">{t.notifications}</span>
                            <div className="h-0.5 w-0 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300"></div>
                          </div>
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </Link>
                      </motion.div>
                    </SignedIn>
                  </div>
                  
                  <SignedOut>
                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/sign-in"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="text-lg font-medium text-gray-900 dark:text-white">{t.signIn}</span>
                            <div className="h-0.5 w-0 bg-gradient-to-r from-gray-500 to-gray-700 group-hover:w-full transition-all duration-300"></div>
                          </div>
                        </Link>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/sign-up"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                          </div>
                          <span className="text-lg font-medium text-white">{t.signUp}</span>
                        </Link>
                      </motion.div>
                    </div>
                  </SignedOut>
                  
                  <SignedIn>
                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="text-lg font-medium text-gray-900 dark:text-white">{t.manageAccount}</span>
                            <div className="h-0.5 w-0 bg-gradient-to-r from-indigo-500 to-blue-500 group-hover:w-full transition-all duration-300"></div>
                          </div>
                        </Link>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/favorites"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="text-lg font-medium text-gray-900 dark:text-white">{t.favorites}</span>
                            <div className="h-0.5 w-0 bg-gradient-to-r from-red-500 to-pink-500 group-hover:w-full transition-all duration-300"></div>
                          </div>
                        </Link>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="text-lg font-medium text-red-600 dark:text-red-400">{t.signOut}</span>
                            <div className="h-0.5 w-0 bg-gradient-to-r from-red-600 to-red-800 group-hover:w-full transition-all duration-300"></div>
                          </div>
                        </button>
                      </motion.div>
                    </div>
                  </SignedIn>
                </div>
                
                {/* تذييل القائمة */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t.copyright.replace('{year}', new Date().getFullYear().toString())}
                      </div>
                      <div className="flex space-x-2">
                        <Link href="/terms-conditions" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
                          {t.terms}
                        </Link>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <Link href="/privacy-policy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
                          {t.privacy}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        @keyframes tilt {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        .animate-tilt {
          animation: tilt 3s ease-in-out infinite;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}