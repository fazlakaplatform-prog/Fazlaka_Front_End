// components/SearchResults.tsx
"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import ImageWithFallback from "@/components/ImageWithFallback";
import { fetchFromSanity } from "@/lib/sanity";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

// تعريف واجهات البيانات
interface SearchResult {
  _id: string;
  _type: string;
  title: string;
  titleEn?: string;
  slug?: {
    current: string;
  };
  excerpt?: string;
  excerptEn?: string;
  description?: string;
  descriptionEn?: string;
  answer?: string;
  answerEn?: string;
  role?: string;
  roleEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  imageUrl?: string;
  imageUrlEn?: string;
  season?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: {
      current: string;
    };
  };
  episodeCount?: number;
  category?: string;
  categoryEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  sectionType?: string;
  question?: string;
  questionEn?: string;
  name?: string;
  nameEn?: string;
  bio?: string;
  bioEn?: string;
  episode?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: {
      current: string;
    };
  };
  language?: 'ar' | 'en';
}

interface PortableTextBlock {
  _type: 'block';
  children: PortableTextSpan[];
}

interface PortableTextSpan {
  text: string;
}

// دالة محدثة للحصول على رابط الصورة
function buildMediaUrl(imageUrl?: string, imageUrlEn?: string, language: string = 'ar'): string {
  if (!imageUrl && !imageUrlEn) return "/placeholder.png";
  
  const url = language === 'ar' ? imageUrl : imageUrlEn;
  
  if (!url) return "/placeholder.png";
  
  return url;
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
            <mark key={i} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1 rounded-sm font-medium">
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

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const cardVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  },
  hover: {
    y: -8,
    transition: { duration: 0.3 }
  }
};

const suggestionVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
  hover: { 
    backgroundColor: "#eff6ff",
    x: 4,
    transition: { duration: 0.15 }
  }
};

// Icons
function IconSearch({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconClose({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconGrid({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconList({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function IconFilter({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  );
}

function IconPlay({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconChevronRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// Type-specific icons
function getTypeIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    episode: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>,
    article: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
    playlist: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="15" x2="15" y2="15" /></svg>,
    faq: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    season: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>,
    teamMember: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    terms: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    privacy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  };
  return icons[type] || <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><circle cx="12" cy="12" r="10" /></svg>;
}

export default function SearchResults() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  // نصوص التطبيق حسب اللغة
  const texts = {
    ar: {
      searchPlaceholder: "ابحث عن حلقات، مقالات، قوائم تشغيل، أسئلة شائعة، مواسم، أعضاء الفريق...",
      searchInPlatform: "ابحث في كل محتوى المنصة",
      resultsCount: "نتيجة لـ",
      noResults: "لم نتمكن من العثور على نتائج",
      tryDifferentKeywords: "جرب كلمات مفتاحية أخرى",
      clearSearch: "مسح البحث",
      startSearching: "ابدأ البحث لاكتشاف المحتوى",
      searchInstructions: "اكتب ما تبحث عنه في مربع البحث أعلاه",
      showMore: "عرض التفاصيل",
      episodes: "الحلقات",
      articles: "المقالات",
      playlists: "قوائم التشغيل",
      faqs: "الأسئلة الشائعة",
      seasons: "المواسم",
      teamMembers: "أعضاء الفريق",
      terms: "الشروط والأحكام",
      privacy: "سياسة الخصوصية",
      all: "الكل",
      episode: "حلقة",
      article: "مقال",
      playlist: "قائمة تشغيل",
      faq: "سؤال شائع",
      season: "موسم",
      teamMember: "عضو فريق",
      episodeCount: "حلقة",
      episodeInArticle: "حلقة:",
      loadingData: "جاري التحميل...",
      errorLoadingData: "حدث خطأ",
      gridView: "عرض شبكي",
      listView: "عرض قائمة",
      brandName: "فذلكه",
      filters: "الفلاتر",
      searchSuggestions: "اقتراحات البحث"
    },
    en: {
      searchPlaceholder: "Search for episodes, articles, playlists, FAQs, seasons, team members...",
      searchInPlatform: "Search all platform content",
      resultsCount: "results for",
      noResults: "No results found",
      tryDifferentKeywords: "Try different keywords",
      clearSearch: "Clear Search",
      startSearching: "Start searching to discover content",
      searchInstructions: "Type what you're looking for in the search box above",
      showMore: "View Details",
      episodes: "Episodes",
      articles: "Articles",
      playlists: "Playlists",
      faqs: "FAQs",
      seasons: "Seasons",
      teamMembers: "Team Members",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      all: "All",
      episode: "Episode",
      article: "Article",
      playlist: "Playlist",
      faq: "FAQ",
      season: "Season",
      teamMember: "Team Member",
      episodeCount: "episodes",
      episodeInArticle: "Episode:",
      loadingData: "Loading...",
      errorLoadingData: "Error occurred",
      gridView: "Grid View",
      listView: "List View",
      brandName: "fazlaka",
      filters: "Filters",
      searchSuggestions: "Search Suggestions"
    }
  };

  const t = texts[language];

  // استخراج مصطلح البحث من الرابط عند تحميل الصفحة
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  // قائمة بالعناوين للاقتراحات
  const [suggestions, setSuggestions] = useState<Array<{title: string, type: string, result: SearchResult}>>([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        // جلب جميع البيانات من Sanity
        const episodesQuery = `*[_type == "episode"]{
          _id, _type, title, titleEn, slug, description, descriptionEn, thumbnailUrl, thumbnailUrlEn,
          season->{_id, title, titleEn, slug}
        }`;
        
        const articlesQuery = `*[_type == "article"]{
          _id, _type, title, titleEn, slug, excerpt, excerptEn, featuredImageUrl, featuredImageUrlEn,
          episode->{_id, title, titleEn, slug}
        }`;
        
        const playlistsQuery = `*[_type == "playlist"]{
          _id, _type, title, titleEn, slug, description, descriptionEn, imageUrl, imageUrlEn
        }`;
        
        const faqsQuery = `*[_type == "faq"]{
          _id, _type, question, questionEn, answer, answerEn, category, categoryEn
        }`;
        
        const seasonsQuery = `*[_type == "season"]{
          _id, _type, title, titleEn, slug, thumbnailUrl, thumbnailUrlEn
        }`;
        
        const teamMembersQuery = `*[_type == "teamMember"]{
          _id, _type, name, nameEn, role, roleEn, slug, imageUrl, imageUrlEn, bio, bioEn
        }`;
        
        const termsQuery = `*[_type == "termsContent" && sectionType == "mainTerms"][0]{
          _id, _type, title, titleEn, content, contentEn, lastUpdated
        }`;
        
        const privacyQuery = `*[_type == "privacyContent" && sectionType == "mainPolicy"][0]{
          _id, _type, title, titleEn, content, contentEn, lastUpdated
        }`;
        
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
          fetchFromSanity(episodesQuery),
          fetchFromSanity(articlesQuery),
          fetchFromSanity(playlistsQuery),
          fetchFromSanity(faqsQuery),
          fetchFromSanity(seasonsQuery),
          fetchFromSanity(teamMembersQuery),
          fetchFromSanity(termsQuery),
          fetchFromSanity(privacyQuery)
        ]);
        
        const episodes = episodesData as SearchResult[];
        const articles = articlesData as SearchResult[];
        const playlists = playlistsData as SearchResult[];
        const seasons = seasonsData as SearchResult[];
        const terms = termsData as SearchResult | null;
        const privacy = privacyData as SearchResult | null;
        
        // حساب عدد الحلقات لكل موسم
        const episodesCountQuery = `*[_type == "episode"]{ season->{_id} }`;
        const episodesCountData = await fetchFromSanity(episodesCountQuery);
        const episodesDataCount = episodesCountData as { season?: { _id: string } }[];
        
        const episodeCounts: Record<string, number> = {};
        episodesDataCount.forEach((ep) => {
          if (ep.season?._id) {
            episodeCounts[ep.season._id] = (episodeCounts[ep.season._id] || 0) + 1;
          }
        });
        
        const seasonsWithCount = seasons.map(season => ({
          ...season,
          episodeCount: episodeCounts[season._id] || 0
        }));
        
        const faqs = (faqsData as Array<{
          _id: string; _type: string; question: string; questionEn?: string;
          answer: string; answerEn?: string; category?: string; categoryEn?: string;
        }>).map(faq => ({
          ...faq,
          title: faq.question,
          titleEn: faq.questionEn,
          excerpt: faq.answer,
          excerptEn: faq.answerEn
        }));
        
        const teamMembers = (teamMembersData as Array<{
          _id: string; _type: string; name: string; nameEn?: string;
          role?: string; roleEn?: string; slug?: { current: string };
          imageUrl?: string; imageUrlEn?: string; bio?: string; bioEn?: string;
        }>).map(member => ({
          ...member,
          title: member.name,
          titleEn: member.nameEn,
          excerpt: member.bio,
          excerptEn: member.bioEn
        }));
        
        const termsAndPrivacy: SearchResult[] = [];
        if (terms) {
          termsAndPrivacy.push({ ...terms, _type: "terms", slug: { current: "terms-conditions" } });
        }
        if (privacy) {
          termsAndPrivacy.push({ ...privacy, _type: "privacy", slug: { current: "privacy-policy" } });
        }
        
        const allResults = [
          ...episodes, ...articles, ...playlists, ...faqs, 
          ...seasonsWithCount, ...teamMembers, ...termsAndPrivacy
        ];
        
        setSearchResults(allResults);
        
        const allSuggestions = allResults.map(result => {
          const title = language === 'ar' ? result.title : (result.titleEn || result.title);
          return {
            title: title || "",
            type: result._type,
            result
          };
        });
        setSuggestions(allSuggestions);
      } catch (err: unknown) {
        console.error("Error loading data:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(`${t.errorLoadingData}: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, [language, t.errorLoadingData]);

  // فلترة الاقتراحات
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return suggestions
      .filter(suggestion => suggestion.title.toLowerCase().includes(term))
      .slice(0, 6);
  }, [searchTerm, suggestions]);

  // التعامل مع اختيار الاقتراح
  const handleSuggestionSelect = (suggestion: {title: string, type: string, result: SearchResult}) => {
    setSearchTerm(suggestion.title);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    setTimeout(() => {
      resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // التعامل مع مفاتيح لوحة المفاتيح
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0 && selectedSuggestion < filteredSuggestions.length) {
          handleSuggestionSelect(filteredSuggestions[selectedSuggestion]);
        } else {
          setTimeout(() => {
            resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        break;
    }
  };

  // إغلاق الاقتراحات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current && !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const q = searchTerm.trim().toLowerCase();
    return searchResults.filter((result) => {
      const title = language === 'ar' 
        ? (result.title || "").toString().toLowerCase()
        : ((result.titleEn || result.title) || "").toString().toLowerCase();
      
      let excerpt = language === 'ar'
        ? (result.excerpt || result.description || result.answer || result.role || "").toString().toLowerCase()
        : ((result.excerptEn || result.descriptionEn || result.answerEn || result.roleEn || 
            result.excerpt || result.description || result.answer || result.role) || "").toString().toLowerCase();
      
      if ((result._type === "terms" || result._type === "privacy")) {
        try {
          const content = language === 'ar' ? result.content : result.contentEn;
          if (content) {
            const contentText = content
              .filter((block: PortableTextBlock) => block._type === "block")
              .map((block: PortableTextBlock) => 
                block.children.map((child: PortableTextSpan) => child.text).join("")
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
  }, [searchResults, searchTerm, language]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      episode: [], article: [], playlist: [], faq: [], season: [], 
      teamMember: [], terms: [], privacy: []
    };
    
    filteredResults.forEach(result => {
      if (groups[result._type]) {
        groups[result._type].push(result);
      }
    });
    
    return groups;
  }, [filteredResults]);

  const typeLabels: Record<string, string> = {
    episode: t.episodes, article: t.articles, playlist: t.playlists, faq: t.faqs,
    season: t.seasons, teamMember: t.teamMembers, terms: t.terms, privacy: t.privacy
  };

  const typeColors: Record<string, string> = {
    episode: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    article: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
    playlist: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
    faq: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
    season: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    teamMember: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
    terms: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    privacy: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800"
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{t.loadingData}</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-md">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t.errorLoadingData}</h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Space Section */}
      <div className="relative h-32 md:h-48 bg-gradient-to-b from-blue-600 to-blue-500 dark:from-blue-800 dark:to-blue-700 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="stars-container">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-full opacity-70"
                style={{
                  width: `${Math.random() * 3}px`,
                  height: `${Math.random() * 3}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animation: `twinkle ${3 + Math.random() * 2}s infinite`
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{t.brandName}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">{t.searchInPlatform}</p>
          </div>
          
          {/* Search Box */}
          <div className="max-w-3xl mx-auto relative">
            <div className="relative">
              <div className="flex items-center bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-800 transition-all shadow-lg">
                <div className="pl-4 pr-2">
                  <IconSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="flex-1 py-3 px-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none text-lg bg-transparent"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                    setSelectedSuggestion(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={t.clearSearch}
                  >
                    <IconClose className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.searchSuggestions}</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {filteredSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={`${suggestion.title}-${index}`}
                          variants={suggestionVariants}
                          initial="hidden"
                          animate={index === selectedSuggestion ? "hover" : "visible"}
                          className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                            index === selectedSuggestion ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${typeColors[suggestion.type]}`}>
                              {getTypeIcon(suggestion.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 dark:text-gray-100 font-medium truncate">
                                {renderHighlighted(suggestion.title, searchTerm)}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {typeLabels[suggestion.type]}
                              </p>
                            </div>
                            <IconChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Section */}
      <div ref={resultsSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        {searchTerm && (
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">
                {filteredResults.length} {t.resultsCount}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">&quot;{searchTerm}&quot;</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-blue-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                  title={t.gridView}
                >
                  <IconGrid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                  title={t.listView}
                >
                  <IconList className="h-5 w-5" />
                </button>
              </div>
              
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors shadow-sm ${
                  showFilters 
                    ? "bg-blue-500 text-white border-blue-500" 
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <IconFilter className="h-5 w-5" />
                {t.filters}
              </button>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <AnimatePresence>
          {showFilters && searchTerm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeFilter === "all"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {t.all} ({filteredResults.length})
                  </button>
                  {Object.entries(groupedResults).map(([type, results]) => (
                    results.length > 0 && (
                      <button
                        key={type}
                        onClick={() => setActiveFilter(type)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          activeFilter === type
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {typeLabels[type]} ({results.length})
                      </button>
                    )
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Results */}
        <div className="space-y-8">
          {!searchTerm ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <IconSearch className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.startSearching}</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{t.searchInstructions}</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.noResults}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{t.tryDifferentKeywords}</p>
              <button
                onClick={() => setSearchTerm("")}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
              >
                {t.clearSearch}
              </button>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {activeFilter === "all" ? (
                Object.entries(groupedResults).map(([type, results]) => (
                  results.length > 0 && (
                    <div key={type} className="mb-12">
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 rounded-lg ${typeColors[type]}`}>
                          {getTypeIcon(type)}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {typeLabels[type]} ({results.length})
                        </h2>
                      </div>
                      
                      {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {results.map((result) => (
                            <SearchResultCard key={result._id} result={result} viewMode={viewMode} searchTerm={searchTerm} language={language} />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {results.map((result) => (
                            <SearchResultCard key={result._id} result={result} viewMode={viewMode} searchTerm={searchTerm} language={language} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ))
              ) : (
                <div>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {groupedResults[activeFilter]?.map((result) => (
                        <SearchResultCard key={result._id} result={result} viewMode={viewMode} searchTerm={searchTerm} language={language} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupedResults[activeFilter]?.map((result) => (
                        <SearchResultCard key={result._id} result={result} viewMode={viewMode} searchTerm={searchTerm} language={language} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

// SearchResultCard Component
interface SearchResultCardProps {
  result: SearchResult;
  viewMode: "grid" | "list";
  searchTerm: string;
  language: 'ar' | 'en';
}

const SearchResultCard = ({ result, viewMode, searchTerm, language }: SearchResultCardProps) => {
  const texts = {
    ar: {
      showMore: "عرض التفاصيل",
      episode: "حلقة",
      article: "مقال",
      playlist: "قائمة تشغيل",
      faq: "سؤال شائع",
      season: "موسم",
      teamMember: "عضو فريق",
      terms: "شروط وأحكام",
      privacy: "سياسة خصوصية",
      episodeCount: "حلقة",
      episodeInArticle: "حلقة:"
    },
    en: {
      showMore: "View Details",
      episode: "Episode",
      article: "Article",
      playlist: "Playlist",
      faq: "FAQ",
      season: "Season",
      teamMember: "Team Member",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      episodeCount: "episodes",
      episodeInArticle: "Episode:"
    }
  };

  const t = texts[language];

  const typeLabels: Record<string, string> = {
    episode: t.episode, article: t.article, playlist: t.playlist, faq: t.faq,
    season: t.season, teamMember: t.teamMember, terms: t.terms, privacy: t.privacy
  };

  const typeColors: Record<string, string> = {
    episode: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    article: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
    playlist: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
    faq: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
    season: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    teamMember: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
    terms: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    privacy: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800"
  };

  const typeCardStyles: Record<string, string> = {
    episode: "border-blue-200 dark:border-blue-800 shadow-blue-100 dark:shadow-blue-900/20",
    article: "border-green-200 dark:border-green-800 shadow-green-100 dark:shadow-green-900/20",
    playlist: "border-purple-200 dark:border-purple-800 shadow-purple-100 dark:shadow-purple-900/20",
    faq: "border-yellow-200 dark:border-yellow-800 shadow-yellow-100 dark:shadow-yellow-900/20",
    season: "border-red-200 dark:border-red-800 shadow-red-100 dark:shadow-red-900/20",
    teamMember: "border-indigo-200 dark:border-indigo-800 shadow-indigo-100 dark:shadow-indigo-900/20",
    terms: "border-amber-200 dark:border-amber-800 shadow-amber-100 dark:shadow-amber-900/20",
    privacy: "border-teal-200 dark:border-teal-800 shadow-teal-100 dark:shadow-teal-900/20"
  };

  const getLink = () => {
    switch (result._type) {
      case "episode": return `/episodes/${result.slug?.current}`;
      case "article": return `/articles/${result.slug?.current}`;
      case "playlist": return `/playlists/${result.slug?.current}`;
      case "faq": return `/faq?faq=${result._id}`;
      case "season": return `/seasons/${result.slug?.current}`;
      case "teamMember": return `/team/${result.slug?.current}`;
      case "terms": return `/terms-conditions`;
      case "privacy": return `/privacy-policy`;
      default: return "#";
    }
  };

  const getImageUrl = () => {
    return buildMediaUrl(
      result.thumbnailUrl || result.featuredImageUrl || result.imageUrl,
      result.thumbnailUrlEn || result.featuredImageUrlEn || result.imageUrlEn,
      language
    );
  };

  const getDisplayText = () => {
    if (language === 'ar') {
      if (result.excerpt) return result.excerpt;
      if (result.description) return result.description;
      if (result.answer) return result.answer;
      if (result.role) return result.role;
    } else {
      if (result.excerptEn) return result.excerptEn;
      if (result.descriptionEn) return result.descriptionEn;
      if (result.answerEn) return result.answerEn;
      if (result.roleEn) return result.roleEn;
      if (result.excerpt) return result.excerpt;
      if (result.description) return result.description;
      if (result.answer) return result.answer;
      if (result.role) return result.role;
    }
    
    if ((result._type === "terms" || result._type === "privacy")) {
      try {
        const content = language === 'ar' ? result.content : result.contentEn;
        if (content) {
          return content
            .filter((block: PortableTextBlock) => block._type === "block")
            .slice(0, 2)
            .map((block: PortableTextBlock) => 
              block.children.map((child: PortableTextSpan) => child.text).join("")
            )
            .join(" ")
            .substring(0, 150) + "...";
        }
      } catch (error) {
        console.error("Error extracting content text:", error);
      }
    }
    
    return "";
  };

  const getDisplayTitle = () => {
    if (language === 'ar') {
      return result.title;
    } else {
      return result.titleEn || result.title;
    }
  };

  const getEpisodeTitle = () => {
    if (!result.episode) return "";
    if (language === 'ar') {
      return result.episode.title;
    } else {
      return result.episode.titleEn || result.episode.title;
    }
  };

  if (viewMode === "grid") {
    // Special design for FAQ, Terms, Privacy without images
    if (result._type === "faq" || result._type === "terms" || result._type === "privacy") {
      return (
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${typeCardStyles[result._type]} hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2`}
        >
          <Link href={getLink()} className="block p-6 h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl mb-4 mx-auto shadow-lg">
                <div className={`p-3 rounded-lg ${typeColors[result._type]}`}>
                  {getTypeIcon(result._type)}
                </div>
              </div>
              
              <div className="flex items-center justify-center mb-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${typeColors[result._type]}`}>
                  {typeLabels[result._type]}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-white text-center mb-3 line-clamp-2">
                {renderHighlighted(getDisplayTitle(), searchTerm)}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center line-clamp-3 flex-grow">
                {renderHighlighted(getDisplayText(), searchTerm)}
              </p>
              
              <div className="flex items-center justify-center mt-4 text-blue-600 dark:text-blue-400 font-medium text-sm">
                {t.showMore}
                <IconChevronRight className="h-4 w-4 mr-1" />
              </div>
            </div>
          </Link>
        </motion.div>
      );
    }

    // Regular cards with images
    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${typeCardStyles[result._type]} hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-2xl transition-all duration-300 overflow-hidden group transform hover:-translate-y-2`}
      >
        <Link href={getLink()} className="block">
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
            <ImageWithFallback 
              src={getImageUrl()} 
              alt={getDisplayTitle()} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
            />
            {result._type !== "teamMember" && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl">
                  <IconPlay className="h-7 w-7 text-blue-600 dark:text-blue-400 ml-1" />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${typeColors[result._type]}`}>
                {typeLabels[result._type]}
              </span>
              {result._type === "season" && result.episodeCount && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {result.episodeCount} {t.episodeCount}
                </span>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {renderHighlighted(getDisplayTitle(), searchTerm)}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {renderHighlighted(getDisplayText(), searchTerm)}
            </p>
            
            {result._type === "article" && result.episode && (
              <div className="mt-3">
                <span className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                  {t.episodeInArticle} {getEpisodeTitle()}
                </span>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    );
  }

  // List view
  if (result._type === "faq" || result._type === "terms" || result._type === "privacy") {
    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${typeCardStyles[result._type]} hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 p-6 transform hover:-translate-y-1`}
      >
        <Link href={getLink()} className="flex items-center gap-4 group">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${typeColors[result._type]}`}>
              {getTypeIcon(result._type)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${typeColors[result._type]}`}>
                {typeLabels[result._type]}
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
              {renderHighlighted(getDisplayTitle(), searchTerm)}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {renderHighlighted(getDisplayText(), searchTerm)}
            </p>
          </div>
          
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <IconChevronRight className="h-5 w-5" />
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${typeCardStyles[result._type]} hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 p-6 transform hover:-translate-y-1`}
    >
      <Link href={getLink()} className="flex items-center gap-4 group">
        <div className={`relative ${result._type === "teamMember" ? "w-20 h-20" : "w-32 h-20"} flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-lg`}>
          <ImageWithFallback 
            src={getImageUrl()} 
            alt={getDisplayTitle()} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            fill 
            sizes="200px" 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${typeColors[result._type]}`}>
              {typeLabels[result._type]}
            </span>
            {result._type === "season" && result.episodeCount && (
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {result.episodeCount} {t.episodeCount}
              </span>
            )}
          </div>
          
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
            {renderHighlighted(getDisplayTitle(), searchTerm)}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {renderHighlighted(getDisplayText(), searchTerm)}
          </p>
          
          {result._type === "article" && result.episode && (
            <div className="mt-2">
              <span className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                {t.episodeInArticle} {getEpisodeTitle()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-blue-600 dark:text-blue-400">
          <IconChevronRight className="h-5 w-5" />
        </div>
      </Link>
    </motion.div>
  );
};