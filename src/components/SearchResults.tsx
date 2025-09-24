// components/SearchResults.tsx
"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import ImageWithFallback from "@/components/ImageWithFallback";
import { fetchFromSanity, urlFor } from "@/lib/sanity";
import { useSearchParams } from "next/navigation";

// تعريف واجهات البيانات
interface SearchResult {
  _id: string;
  _type: string;
  title: string;
  slug?: {
    current: string;
  };
  excerpt?: string;
  description?: string;
  answer?: string;
  role?: string;
  thumbnail?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  featuredImage?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  image?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  season?: {
    _id: string;
    title: string;
    slug: {
      current: string;
    };
  };
  episodeCount?: number;
  category?: string;
  content?: PortableTextBlock[]; // للشروط والأحكام وسياسة الخصوصية
  sectionType?: string; // للشروط والأحكام وسياسة الخصوصية
  imageUrl?: string; // لقوائم التشغيل
  question?: string; // للأسئلة الشائعة
  name?: string; // لأعضاء الفريق
  bio?: string; // لأعضاء الفريق
  episode?: { // إضافة خاصية episode بشكل صريح
    _id: string;
    title: string;
    slug: {
      current: string;
    };
  };
}

// واجهة لكتل Portable Text
interface PortableTextBlock {
  _type: 'block';
  children: PortableTextSpan[];
}

interface PortableTextSpan {
  text: string;
}

// تعريف واجهة لصورة Sanity
interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
}

function buildMediaUrl(image?: SanityImage): string {
  if (!image) return "/placeholder.png";
  return urlFor(image) || "/placeholder.png";
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

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
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
    y: -5,
    transition: { duration: 0.2 }
  }
};

const tabVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

const suggestionItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
  hover: { backgroundColor: "#f3f4f6", x: 5 }
};

// Hero section animations
const heroVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const heroTitleVariants: Variants = {
  hidden: { y: -50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

const heroSubtitleVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      delay: 0.2,
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

const heroSearchVariants: Variants = {
  hidden: { y: 50, opacity: 0, scale: 0.9 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.4,
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

// Small inline icons
function IconEpisodes({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M16 3v4" />
    </svg>
  );
}

function IconArticles({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  );
}

function IconPlaylists({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3h18v18H3z" />
      <path d="M3 9h18" />
      <path d="M9 3v18" />
    </svg>
  );
}

function IconFaqs({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M9.09 9a3 3 0 005.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconSeasons({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
    </svg>
  );
}

function IconTeam({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconPrivacy({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconTerms({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconQuestionMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconPlay({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 3v18l15-9L5 3z" />
    </svg>
  );
}

function IconGrid({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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

function IconSearch({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconBook({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function IconVideo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function IconUsers({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconPlaylist({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3h18v18H3z" />
      <path d="M3 9h18" />
      <path d="M9 3v18" />
    </svg>
  );
}

function IconHelp({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// أيقونة المواسم الجديدة
function IconSeasonsBig({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
    </svg>
  );
}

export default function SearchResults() {
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // إضافة مرجع لقسم النتائج للتمرير التلقائي
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  // استخراج مصطلح البحث من الرابط عند تحميل الصفحة
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  // قائمة بالعناوين للاقتراحات
  const [titles, setTitles] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        // جلب جميع البيانات من Sanity
        const episodesQuery = `*[_type == "episode"]{
          _id,
          _type,
          title,
          slug,
          description,
          thumbnail,
          season->{
            _id,
            title,
            slug
          }
        }`;
        
        const articlesQuery = `*[_type == "article"]{
          _id,
          _type,
          title,
          slug,
          excerpt,
          featuredImage,
          episode->{
            _id,
            title,
            slug
          }
        }`;
        
        const playlistsQuery = `*[_type == "playlist"]{
          _id,
          _type,
          title,
          slug,
          description,
          "imageUrl": image.asset->url
        }`;
        
        const faqsQuery = `*[_type == "faq"]{
          _id,
          _type,
          question,
          answer,
          category
        }`;
        
        const seasonsQuery = `*[_type == "season"]{
          _id,
          _type,
          title,
          slug,
          thumbnail
        }`;
        
        const teamMembersQuery = `*[_type == "teamMember"]{
          _id,
          _type,
          name,
          role,
          slug,
          image,
          bio
        }`;
        
        // استعلامات جديدة للشروط والأحكام وسياسة الخصوصية
        const termsQuery = `*[_type == "termsContent" && sectionType == "mainTerms"][0]{
          _id,
          _type,
          title,
          content,
          lastUpdated
        }`;
        
        const privacyQuery = `*[_type == "privacyContent" && sectionType == "mainPolicy"][0]{
          _id,
          _type,
          title,
          content,
          lastUpdated
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
        
        // تحويل البيانات إلى الأنواع المناسبة
        const episodes = episodesData as SearchResult[];
        const articles = articlesData as SearchResult[];
        const playlists = playlistsData as SearchResult[];
        const seasons = seasonsData as SearchResult[];
        const terms = termsData as SearchResult | null;
        const privacy = privacyData as SearchResult | null;
        
        // حساب عدد الحلقات لكل موسم
        const episodesCountQuery = `*[_type == "episode"]{
          season->{_id}
        }`;
        const episodesCountData = await fetchFromSanity(episodesCountQuery);
        const episodesDataCount = episodesCountData as { season?: { _id: string } }[];
        
        const episodeCounts: Record<string, number> = {};
        episodesDataCount.forEach((ep) => {
          if (ep.season?._id) {
            episodeCounts[ep.season._id] = (episodeCounts[ep.season._id] || 0) + 1;
          }
        });
        
        // إضافة عدد الحلقات لكل موسم
        const seasonsWithCount = seasons.map(season => ({
          ...season,
          episodeCount: episodeCounts[season._id] || 0
        }));
        
        // تحويل الأسئلة الشائعة إلى نفس تنسيق النتائج الأخرى
        const faqs = (faqsData as Array<{
          _id: string;
          _type: string;
          question: string;
          answer: string;
          category?: string;
        }>).map(faq => ({
          ...faq,
          title: faq.question,
          excerpt: faq.answer
        }));
        
        // تحويل أعضاء الفريق إلى نفس تنسيق النتائج الأخرى
        const teamMembers = (teamMembersData as Array<{
          _id: string;
          _type: string;
          name: string;
          role?: string;
          slug?: { current: string };
          image?: SanityImage;
          bio?: string;
        }>).map(member => ({
          ...member,
          title: member.name,
          excerpt: member.bio
        }));
        
        // إضافة الشروط والأحكام وسياسة الخصوصية إذا كانت موجودة
        const termsAndPrivacy: SearchResult[] = [];
        if (terms) {
          termsAndPrivacy.push({
            ...terms,
            _type: "terms",
            slug: { current: "terms-conditions" }
          });
        }
        
        if (privacy) {
          termsAndPrivacy.push({
            ...privacy,
            _type: "privacy",
            slug: { current: "privacy-policy" }
          });
        }
        
        // دمج جميع النتائج
        const allResults = [
          ...episodes,
          ...articles,
          ...playlists,
          ...faqs,
          ...seasonsWithCount,
          ...teamMembers,
          ...termsAndPrivacy
        ];
        
        setSearchResults(allResults);
        
        // إنشاء قائمة بالعناوين للاقتراحات
        const allTitles = allResults.map(result => result.title);
        setTitles(allTitles);
      } catch (err: unknown) {
        console.error("Error loading data:", err);
        const errorMessage = err instanceof Error ? err.message : "خطأ غير معروف";
        setError("حدث خطأ في تحميل البيانات: " + errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, []);

  // فلترة الاقتراحات
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return titles
      .filter(title => title.toLowerCase().includes(term))
      .slice(0, 8); // عرض 8 اقتراحات كحد أقصى
  }, [searchTerm, titles]);

  // التعامل مع اختيار الاقتراح
  const handleSuggestionSelect = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    // التمرير إلى قسم النتائج بعد اختيار اقتراح
    setTimeout(() => {
      resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
        } else {
          // التمرير إلى قسم النتائج عند الضغط على Enter حتى بدون اختيار اقتراح
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
      const title = (result.title || "").toString().toLowerCase();
      
      // البحث في محتوى الشروط والأحكام وسياسة الخصوصية
      let excerpt = (result.excerpt || result.description || result.answer || result.role || "").toString().toLowerCase();
      
      // إذا كان النتيجة من نوع الشروط والأحكام أو سياسة الخصوصية، ابحث في المحتوى أيضاً
      if ((result._type === "terms" || result._type === "privacy") && result.content) {
        try {
          // استخراج النص من محتوى Portable Text
          const contentText = result.content
            .filter((block: PortableTextBlock) => block._type === "block")
            .map((block: PortableTextBlock) => 
              block.children
                .map((child: PortableTextSpan) => child.text)
                .join("")
            )
            .join(" ")
            .toLowerCase();
          
          excerpt = contentText;
        } catch (error) {
          console.error("Error extracting content text:", error);
        }
      }
      
      // فلترة حسب النوع إذا كان هناك تبويب نشط
      if (activeTab !== "all" && result._type !== activeTab) {
        return false;
      }
      
      return title.includes(q) || excerpt.includes(q);
    });
  }, [searchResults, searchTerm, activeTab]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      episode: [],
      article: [],
      playlist: [],
      faq: [],
      season: [],
      teamMember: [],
      terms: [],
      privacy: []
    };
    
    filteredResults.forEach(result => {
      if (groups[result._type]) {
        groups[result._type].push(result);
      }
    });
    
    return groups;
  }, [filteredResults]);

  const typeLabels: Record<string, string> = {
    episode: "الحلقات",
    article: "المقالات",
    playlist: "قوائم التشغيل",
    faq: "الأسئلة الشائعة",
    season: "المواسم",
    teamMember: "أعضاء الفريق",
    terms: "الشروط والأحكام",
    privacy: "سياسة الخصوصية"
  };

  const typeIcons: Record<string, React.ReactNode> = {
    episode: <IconEpisodes className="h-5 w-5" />,
    article: <IconArticles className="h-5 w-5" />,
    playlist: <IconPlaylists className="h-5 w-5" />,
    faq: <IconFaqs className="h-5 w-5" />,
    season: <IconSeasons className="h-5 w-5" />,
    teamMember: <IconTeam className="h-5 w-5" />,
    terms: <IconTerms className="h-5 w-5" />,
    privacy: <IconPrivacy className="h-5 w-5" />
  };

  const typeColors: Record<string, string> = {
    episode: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
    article: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
    playlist: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
    faq: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
    season: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
    teamMember: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20",
    terms: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
    privacy: "from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20"
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    </div>
  );
  
  if (error) return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
      >
        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-red-800 dark:text-red-200">حدث خطأ في تحميل البيانات</h3>
        <p className="mt-2 text-red-600 dark:text-red-300">{error}</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24"> {/* إضافة padding-top هنا لخلق مساحة للناف بار */}
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 max-w-7xl">
          <motion.div 
            variants={heroVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            {/* Logo/Brand */}
            <motion.div 
              variants={heroTitleVariants}
              className="mb-8"
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                فذلكه
              </motion.h1>
              <motion.p 
                variants={heroSubtitleVariants}
                className="mt-4 text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto"
              >
               ابحث هنا في كل ارجاء المنصه
              </motion.p>
            </motion.div>
            
            {/* Search Box */}
            <motion.div 
              variants={heroSearchVariants}
              className="max-w-3xl mx-auto"
            >
              <div className="relative">
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl px-6 py-4 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-300 dark:focus-within:ring-blue-500 transition-all">
                  <IconSearch className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    aria-label="بحث في المنصة"
                    className="bg-transparent outline-none flex-grow text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 py-1 text-xl"
                    placeholder="ابحث عن حلقات، مقالات، قوائم تشغيل، أسئلة شائعة، مواسم، أعضاء الفريق، الشروط والأحكام، سياسة الخصوصية..."
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
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSearchTerm("")}
                      className="flex items-center justify-center rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      aria-label="مسح البحث"
                      title="مسح"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  )}
                </div>
                
                {/* قائمة الاقتراحات */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      ref={suggestionsRef}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      {suggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion}
                          variants={suggestionItemVariants}
                          initial="hidden"
                          animate={index === selectedSuggestion ? "hover" : "visible"}
                          whileHover="hover"
                          className={`px-6 py-4 cursor-pointer transition-colors ${
                            index === selectedSuggestion 
                              ? 'bg-blue-50 dark:bg-blue-900/30' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            
            {/* Feature Icons */}
            <motion.div 
              variants={heroSearchVariants}
              className="mt-16 flex flex-wrap justify-center gap-8 md:gap-12"
            >
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <IconVideo className="h-8 w-8 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">الحلقات</span>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.5 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <IconBook className="h-8 w-8 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">المقالات</span>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <IconPlaylist className="h-8 w-8 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">قوائم التشغيل</span>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1.5 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <IconHelp className="h-8 w-8 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">الأسئلة الشائعة</span>
              </motion.div>
              
              {/* إضافة أيقونة المواسم */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1.7 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <IconSeasonsBig className="h-8 w-8 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">المواسم</span>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 2 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <IconUsers className="h-8 w-8 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">أعضاء الفريق</span>
              </motion.div>

              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 2.5 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <IconTerms className="h-8 w-8 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">الشروط والأحكام</span>
              </motion.div>

              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 3 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <IconPrivacy className="h-8 w-8 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">سياسة الخصوصية</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Results Section */}
      <div ref={resultsSectionRef} className="container mx-auto px-4 py-8 max-w-7xl">
        {/* عدد النتائج */}
        {searchTerm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full px-6 py-3 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {filteredResults.length} نتيجة لـ &ldquo;<span className="text-blue-600 dark:text-blue-400">{searchTerm}</span>&rdquo;
              </span>
            </div>
          </motion.div>
        )}
        
        {/* تبويبات نوع المحتوى */}
        {searchTerm && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            <motion.button
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              onClick={() => setActiveTab("all")}
              className={`px-6 py-3 rounded-full text-base font-medium transition-all shadow-md ${
                activeTab === "all"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              الكل ({filteredResults.length})
            </motion.button>
            {Object.entries(groupedResults).map(([type, results]) => (
              results.length > 0 && (
                <motion.button
                  key={type}
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setActiveTab(type)}
                  className={`px-6 py-3 rounded-full text-base font-medium flex items-center gap-2 transition-all shadow-md ${
                    activeTab === type
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {typeIcons[type]}
                  {typeLabels[type]} ({results.length})
                </motion.button>
              )
            ))}
          </motion.div>
        )}
        
        {/* أزرار التحكم */}
        <div className="flex justify-end mb-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center p-4 transition ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              aria-pressed={viewMode === "grid"}
              title="عرض شبكي"
            >
              <IconGrid className={`h-6 w-6 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center p-4 transition ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              aria-pressed={viewMode === "list"}
              title="عرض قائمة"
            >
              <IconList className={`h-6 w-6 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
            </motion.button>
          </motion.div>
        </div>
        
        {/* نتائج البحث */}
        <div className="space-y-12">
          {!searchTerm ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-16 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-24 w-24 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.div>
              <motion.h2 
                className="mt-8 text-3xl font-bold text-gray-800 dark:text-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ابدأ البحث في فضلكه
              </motion.h2>
              <motion.p 
                className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                اكتب كلمات مفتاحية في مربع البحث للعثور على حلقات، مقالات، قوائم تشغيل، أسئلة شائعة، مواسم، أعضاء الفريق، الشروط والأحكام، أو سياسة الخصوصية.
              </motion.p>
            </motion.div>
          ) : filteredResults.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-16 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl border border-yellow-100 dark:border-yellow-800 shadow-xl"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-24 w-24 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L15 12l-5.25-5" />
                </svg>
              </motion.div>
              <h2 className="mt-8 text-3xl font-bold text-gray-800 dark:text-gray-100">لم نتمكن من العثور على نتائج</h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية.</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchTerm("")}
                className="mt-8 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-bold text-lg shadow-lg"
              >
                مسح البحث
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {activeTab === "all" ? (
                // عرض جميع النتائج مع تجميع حسب النوع
                Object.entries(groupedResults).map(([type, results]) => (
                  results.length > 0 && (
                    <motion.div key={type} className="mb-16">
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 mb-8"
                      >
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${typeColors[type]} shadow-lg`}>
                          {typeIcons[type]}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                          {typeLabels[type]} ({results.length})
                        </h2>
                      </motion.div>
                      
                      {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                          {results.map((result) => (
                            <SearchResultCard key={result._id} result={result} viewMode={viewMode} searchTerm={searchTerm} />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {results.map((result) => (
                            <SearchResultCard key={result._id} result={result} viewMode={viewMode} searchTerm={searchTerm} />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )
                ))
              ) : (
                // عرض نتائج النوع المحدد فقط
                <div>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                      {groupedResults[activeTab]?.map((result) => (
                        <SearchResultCard key={result._id} result={result} viewMode={viewMode} searchTerm={searchTerm} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedResults[activeTab]?.map((result) => (
                        <SearchResultCard key={result._id} result={result} viewMode={viewMode} searchTerm={searchTerm} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Custom styles for blob animation */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

// مكون بطاقة نتيجة البحث
interface SearchResultCardProps {
  result: SearchResult;
  viewMode: "grid" | "list";
  searchTerm: string;
}

const SearchResultCard = ({ result, viewMode, searchTerm }: SearchResultCardProps) => {
  const typeLabels: Record<string, string> = {
    episode: "حلقة",
    article: "مقال",
    playlist: "قائمة تشغيل",
    faq: "سؤال شائع",
    season: "موسم",
    teamMember: "عضو فريق",
    terms: "شروط وأحكام",
    privacy: "سياسة خصوصية"
  };

  const typeIcons: Record<string, React.ReactNode> = {
    episode: <IconEpisodes className="h-4 w-4" />,
    article: <IconArticles className="h-4 w-4" />,
    playlist: <IconPlaylists className="h-4 w-4" />,
    faq: <IconFaqs className="h-4 w-4" />,
    season: <IconSeasons className="h-4 w-4" />,
    teamMember: <IconTeam className="h-4 w-4" />,
    terms: <IconTerms className="h-4 w-4" />,
    privacy: <IconPrivacy className="h-4 w-4" />
  };

  const typeColors: Record<string, string> = {
    episode: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200",
    article: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200",
    playlist: "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200",
    faq: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200",
    season: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200",
    teamMember: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200",
    terms: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200",
    privacy: "bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200"
  };

  const typeGradients: Record<string, string> = {
    episode: "from-blue-500 to-blue-600",
    article: "from-green-500 to-green-600",
    playlist: "from-purple-500 to-purple-600",
    faq: "from-yellow-500 to-yellow-600",
    season: "from-red-500 to-red-600",
    teamMember: "from-indigo-500 to-indigo-600",
    terms: "from-amber-500 to-amber-600",
    privacy: "from-teal-500 to-teal-600"
  };

  // تحديد الرابط المناسب حسب نوع النتيجة
  const getLink = () => {
    switch (result._type) {
      case "episode":
        return `/episodes/${result.slug?.current}`;
      case "article":
        return `/articles/${result.slug?.current}`;
      case "playlist":
        return `/playlists/${result.slug?.current}`;
      case "faq":
        return `/faq?faq=${result._id}`;
      case "season":
        return `/seasons/${result.slug?.current}`;
      case "teamMember":
        return `/team/${result.slug?.current}`;
      case "terms":
        return `/terms-conditions`;
      case "privacy":
        return `/privacy-policy`;
      default:
        return "#";
    }
  };

  // تحديد الصورة المناسبة حسب نوع النتيجة
  const getImageUrl = () => {
    if (result.thumbnail) return buildMediaUrl(result.thumbnail);
    if (result.featuredImage) return buildMediaUrl(result.featuredImage);
    if (result.image) return buildMediaUrl(result.image);
    if (result._type === "playlist" && result.imageUrl) {
      return result.imageUrl;
    }
    
    // صور افتراضية للشروط والأحكام وسياسة الخصوصية
    if (result._type === "terms") {
      return "/images/terms-default.jpg";
    }
    if (result._type === "privacy") {
      return "/images/privacy-default.jpg";
    }
    
    return "/placeholder.png";
  };

  // تحديد النص المناسب للعرض
  const getDisplayText = () => {
    if (result.excerpt) return result.excerpt;
    if (result.description) return result.description;
    if (result.answer) return result.answer;
    if (result.role) return result.role;
    
    // استخراج نص من محتوى الشروط والأحكام وسياسة الخصوصية
    if ((result._type === "terms" || result._type === "privacy") && result.content) {
      try {
        return result.content
          .filter((block: PortableTextBlock) => block._type === "block")
          .slice(0, 2) // أخذ أول فقرتين فقط
          .map((block: PortableTextBlock) => 
            block.children
              .map((child: PortableTextSpan) => child.text)
              .join("")
          )
          .join(" ")
          .substring(0, 200) + "..."; // اقتطاع النص
      } catch (error) {
        console.error("Error extracting content text:", error);
        return "";
      }
    }
    
    return "";
  };

  if (viewMode === "grid") {
    // تصميم خاص للأسئلة الشائعة والشروط والأحكام وسياسة الخصوصية بدون صورة
    if (result._type === "faq" || result._type === "terms" || result._type === "privacy") {
      // تحديد الأيقونة واللون المناسب
      let icon = <IconQuestionMark className="h-20 w-20" />;
      let iconColor = "text-yellow-500";
      let bgColor = "from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700";
      
      if (result._type === "terms") {
        icon = <IconTerms className="h-20 w-20" />;
        iconColor = "text-amber-500";
        bgColor = "from-amber-50 to-amber-100 dark:from-gray-800 dark:to-gray-700";
      } else if (result._type === "privacy") {
        icon = <IconPrivacy className="h-20 w-20" />;
        iconColor = "text-teal-500";
        bgColor = "from-teal-50 to-teal-100 dark:from-gray-800 dark:to-gray-700";
      }
      
      return (
        <motion.article
          variants={cardVariants}
          whileHover="hover"
          className={`border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col bg-gradient-to-br ${bgColor}`}
        >
          <Link href={getLink()} className="block group flex-1">
            <div className="p-8 flex flex-col items-center justify-center h-full">
              <motion.div
                whileHover={{ scale: 1.2, rotate: 15 }}
                className={`mb-6 ${iconColor}`}
              >
                {icon}
              </motion.div>
              <div className="flex items-center gap-1 mb-4">
                <span className={`text-sm px-4 py-2 rounded-full ${typeColors[result._type]} font-bold`}>
                  {typeLabels[result._type]}
                </span>
              </div>
              <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 line-clamp-2 text-center mb-4">
                {renderHighlighted(result.title, searchTerm)}
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 line-clamp-3 text-center">
                {renderHighlighted(getDisplayText(), searchTerm)}
              </p>
            </div>
          </Link>
          <div className="p-6 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center">
            <motion.div
              whileHover={{ x: 8 }}
              className="flex items-center gap-3 text-base font-bold bg-gradient-to-r bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`, 
                       '--tw-gradient-from': typeGradients[result._type].split(' ')[0].replace('from-', ''),
                       '--tw-gradient-to': typeGradients[result._type].split(' ')[1].replace('to-', '') } as React.CSSProperties }
            >
              {typeIcons[result._type]}
              اعرض المزيد
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </div>
        </motion.article>
      );
    }

    // تصميم باقي أنواع البطاقات
    return (
      <motion.article
        variants={cardVariants}
        whileHover="hover"
        className="border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col bg-white dark:bg-gray-800"
      >
        <Link href={getLink()} className="block group">
          {result._type !== "teamMember" ? (
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
              <ImageWithFallback 
                src={getImageUrl()} 
                alt={result.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
              />
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  whileHover={{ scale: 1.3 }}
                  className="bg-black/40 dark:bg-white/10 rounded-full p-4 backdrop-blur-sm"
                >
                  <IconPlay className="h-10 w-10 text-white dark:text-gray-200" />
                </motion.div>
              </motion.div>
            </div>
          ) : (
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
              <ImageWithFallback 
                src={getImageUrl()} 
                alt={result.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
              />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-sm px-4 py-2 rounded-full ${typeColors[result._type]} font-bold`}>
                {typeLabels[result._type]}
              </span>
              {result._type === "season" && result.episodeCount && (
                <span className="text-sm px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold">
                  {result.episodeCount} حلقة
                </span>
              )}
            </div>
            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 line-clamp-2 mb-3">
              {renderHighlighted(result.title, searchTerm)}
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400 line-clamp-3">
              {renderHighlighted(getDisplayText(), searchTerm)}
            </p>
            
            {/* عرض الحلقة المرتبطة بالمقالات */}
            {result._type === "article" && result.episode && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full font-bold">
                  حلقة: {result.episode.title}
                </span>
              </div>
            )}
          </div>
        </Link>
        <div className="mt-auto p-6 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3 text-base text-gray-500 dark:text-gray-400">
            {typeIcons[result._type]}
          </div>
          <motion.div
            whileHover={{ x: 8 }}
            className="flex items-center gap-2 text-base font-bold bg-gradient-to-r bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`, 
                     '--tw-gradient-from': typeGradients[result._type].split(' ')[0].replace('from-', ''),
                     '--tw-gradient-to': typeGradients[result._type].split(' ')[1].replace('to-', '') } as React.CSSProperties }
          >
            اعرض المزيد
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </div>
      </motion.article>
    );
  }

  // عرض القائمة
  if (result._type === "faq" || result._type === "terms" || result._type === "privacy") {
    // تحديد الأيقونة واللون المناسب
    let icon = <IconQuestionMark className="h-10 w-10 text-yellow-500" />;
    let bgColor = "bg-yellow-100 dark:bg-yellow-900/30";
    
    if (result._type === "terms") {
      icon = <IconTerms className="h-10 w-10 text-amber-500" />;
      bgColor = "bg-amber-100 dark:bg-amber-900/30";
    } else if (result._type === "privacy") {
      icon = <IconPrivacy className="h-10 w-10 text-teal-500" />;
      bgColor = "bg-teal-100 dark:bg-teal-900/30";
    }
    
    // تصميم خاص للأسئلة الشائعة والشروط والأحكام وسياسة الخصوصية في وضع القائمة
    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        className={`flex gap-6 items-center border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden p-6 hover:shadow-2xl transition-all duration-300 bg-gradient-to-r ${bgColor}`}
      >
        <Link href={getLink()} className="flex items-center gap-6 flex-1 group">
          <motion.div
            whileHover={{ scale: 1.2, rotate: 15 }}
            className="w-20 h-20 flex-shrink-0 rounded-3xl flex items-center justify-center"
          >
            {icon}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-sm px-4 py-2 rounded-full ${typeColors[result._type]} font-bold`}>
                {typeLabels[result._type]}
              </span>
            </div>
            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 line-clamp-2 mb-3">
              {renderHighlighted(result.title, searchTerm)}
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400 line-clamp-2">
              {renderHighlighted(getDisplayText(), searchTerm)}
            </p>
          </div>
          <motion.div
            whileHover={{ x: 8 }}
            className="flex items-center gap-3 text-base font-bold bg-gradient-to-r bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`, 
                     '--tw-gradient-from': typeGradients[result._type].split(' ')[0].replace('from-', ''),
                     '--tw-gradient-to': typeGradients[result._type].split(' ')[1].replace('to-', '') } as React.CSSProperties }
          >
            اعرض المزيد
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  // عرض باقي الأنواع في وضع القائمة
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className="flex gap-6 items-center border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden p-6 hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800"
    >
      <Link href={getLink()} className="flex items-center gap-6 flex-1 group">
        <div className={`relative ${result._type === "teamMember" ? "w-24 h-24" : "w-40 h-24"} flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden`}>
          <ImageWithFallback 
            src={getImageUrl()} 
            alt={result.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            fill 
            sizes="240px" 
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-sm px-4 py-2 rounded-full ${typeColors[result._type]} font-bold`}>
              {typeLabels[result._type]}
            </span>
            {result._type === "season" && result.episodeCount && (
              <span className="text-sm px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold">
                {result.episodeCount} حلقة
              </span>
            )}
          </div>
          <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 line-clamp-2 mb-3">
            {renderHighlighted(result.title, searchTerm)}
          </h3>
          <p className="text-base text-gray-600 dark:text-gray-400 line-clamp-2">
            {renderHighlighted(getDisplayText(), searchTerm)}
          </p>
          
          {/* عرض الحلقة المرتبطة بالمقالات */}
          {result._type === "article" && result.episode && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full font-bold">
                حلقة: {result.episode.title}
              </span>
            </div>
          )}
        </div>
        <motion.div
          whileHover={{ x: 8 }}
          className="flex items-center gap-2 text-base font-bold bg-gradient-to-r bg-clip-text text-transparent"
          style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`, 
                   '--tw-gradient-from': typeGradients[result._type].split(' ')[0].replace('from-', ''),
                   '--tw-gradient-to': typeGradients[result._type].split(' ')[1].replace('to-', '') } as React.CSSProperties }
        >
          اعرض المزيد
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </Link>
    </motion.div>
  );
};