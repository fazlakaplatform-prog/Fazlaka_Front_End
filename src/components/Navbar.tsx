"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFromSanity, urlFor, getAllNotifications, NotificationItem } from "@/lib/sanity";

// تعريف واجهات البيانات
interface SearchResult {
  _id: string;
  _type: "episode" | "article" | "faq" | "playlist" | "season" | "teamMember" | "terms" | "privacy";
  title: string;
  slug?: { current: string };
  excerpt?: string;
  description?: string;
  answer?: string;
  role?: string;
  thumbnail?: SanityImage;
  featuredImage?: SanityImage;
  image?: SanityImage;
  season?: { _id: string; title: string; slug: { current: string } };
  episodeCount?: number;
  category?: string;
  content?: PortableTextBlock[];
  sectionType?: string;
  imageUrl?: string;
  question?: string;
  name?: string;
  bio?: string;
  episode?: { _id: string; title: string; slug: { current: string } };
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
  question: string;
  answer: string;
  category?: string;
}

interface TeamMemberResult extends SearchResult {
  _type: "teamMember";
  name: string;
  role?: string;
  slug?: { current: string };
  image?: SanityImage;
  bio?: string;
}

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

// مكون شريط البحث
const SearchBar = ({ initialExpanded = false }: { initialExpanded?: boolean }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // إغلاق النتائج عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
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
  
  // البحث عند تغيير النص
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
  }, [query]);
  
  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      // استعلامات Sanity لجلب البيانات
      const episodesQuery = `*[_type == "episode"]{
        _id, _type, title, slug, description, thumbnail,
        season->{_id, title, slug}
      }`;
      
      const articlesQuery = `*[_type == "article"]{
        _id, _type, title, slug, excerpt, featuredImage,
        episode->{_id, title, slug}
      }`;
      
      const playlistsQuery = `*[_type == "playlist"]{
        _id, _type, title, slug, description,
        "imageUrl": image.asset->url
      }`;
      
      const faqsQuery = `*[_type == "faq"]{
        _id, _type, question, answer, category
      }`;
      
      const seasonsQuery = `*[_type == "season"]{
        _id, _type, title, slug, thumbnail
      }`;
      
      const teamMembersQuery = `*[_type == "teamMember"]{
        _id, _type, name, role, slug, image, bio
      }`;
      
      const termsQuery = `*[_type == "termsContent" && sectionType == "mainTerms"][0]{
        _id, _type, title, content, lastUpdated
      }`;
      
      const privacyQuery = `*[_type == "privacyContent" && sectionType == "mainPolicy"][0]{
        _id, _type, title, content, lastUpdated
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
      const episodesCountQuery = `*[_type == "episode"]{ season->{_id} }`;
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
      const faqs = (faqsData as FaqResult[]).map(faq => ({
        ...faq,
        title: faq.question,
        excerpt: faq.answer
      }));
      
      // تحويل أعضاء الفريق إلى نفس تنسيق النتائج الأخرى
      const teamMembers = (teamMembersData as TeamMemberResult[]).map(member => ({
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
      
      // فلترة النتائج حسب البحث
      const q = searchQuery.trim().toLowerCase();
      const filteredResults = allResults.filter((result) => {
        const title = (result.title || "").toString().toLowerCase();
        let excerpt = (result.excerpt || "").toString().toLowerCase();
        
        // البحث في محتوى الشروط والأحكام وسياسة الخصوصية
        if (result._type === "faq" && (result as FaqResult).answer) {
          excerpt = ((result as FaqResult).answer || "").toString().toLowerCase();
        }
        
        if (result._type === "teamMember" && (result as TeamMemberResult).role) {
          excerpt = ((result as TeamMemberResult).role || "").toString().toLowerCase();
        }
        
        if ((result._type === "terms" || result._type === "privacy") && result.content) {
          try {
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
        
        return title.includes(q) || excerpt.includes(q);
      });
      
      setResults(filteredResults);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setShowResults(false);
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
  };
  
  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
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
    if (result.excerpt) return result.excerpt;
    if (result.description) return result.description;
    if (result._type === "faq" && (result as FaqResult).answer) return (result as FaqResult).answer || "";
    if (result._type === "teamMember" && (result as TeamMemberResult).role) return (result as TeamMemberResult).role || "";
    
    if ((result._type === "terms" || result._type === "privacy") && result.content) {
      try {
        return result.content
          .filter((block: PortableTextBlock) => block._type === "block")
          .slice(0, 2)
          .map((block: PortableTextBlock) => 
            block.children
              .map((child: PortableTextSpan) => child.text)
              .join("")
          )
          .join(" ")
          .substring(0, 200) + "...";
      } catch (error) {
        console.error("Error extracting content text:", error);
        return "";
      }
    }
    
    return "";
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
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="بحث..."
          className={`absolute right-0 top-0 h-10 pr-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-in-out text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
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
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </form>
      
      <AnimatePresence>
        {showResults && isExpanded && (query.trim().length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-96 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">جاري البحث...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-1">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  نتائج البحث
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
                        {renderHighlighted(result.title || "", query)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {result._type === "episode" && "حلقة"}
                        {result._type === "article" && "مقال"}
                        {result._type === "playlist" && "قائمة تشغيل"}
                        {result._type === "faq" && "سؤال شائع"}
                        {result._type === "season" && "موسم"}
                        {result._type === "teamMember" && "عضو الفريق"}
                        {result._type === "terms" && "شروط وأحكام"}
                        {result._type === "privacy" && "سياسة الخصوصية"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {renderHighlighted(getDisplayText(result), query)}
                      </p>
                    </div>
                    {getImageUrl(result) && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                        <Image
                          src={getImageUrl(result)}
                          alt={result.title || ""}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // فقط أخفي الصورة المعطوبة ولا تطبع رسالة خطأ
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
                    عرض جميع نتائج البحث
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">لا توجد نتائج مطابقة</p>
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

// مكون زر الإشعارات المحدث
const NotificationButton = ({ 
  showNotifications, 
  setShowNotifications 
}: { 
  showNotifications: boolean; 
  setShowNotifications: (show: boolean) => void;
}) => {
  const router = useRouter();
  const [hasNewNotifications, setHasNewNotifications] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getAllNotifications();
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
  }, []);
  
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
      if (!dateString) return 'تاريخ غير متوفر';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'تاريخ غير صالح';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'منذ لحظات';
      else if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
      else if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
      else if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
      else if (diffInSeconds < 31536000) return `منذ ${Math.floor(diffInSeconds / 2592000)} شهر`;
      else return `منذ ${Math.floor(diffInSeconds / 31536000)} سنة`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'خطأ في التاريخ';
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
            className={`absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-96 overflow-y-auto ${
              isMobile 
                ? 'right-0 mt-2 w-80'  // للموبايل: ظهور من اليمين
                : 'left-0 mt-2 w-80'    // للكمبيوتر: ظهور من اليسار
            }`}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">الإشعارات</h3>
                <button
                  onClick={() => router.push("/notifications")}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  مشاهدة الكل
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">جاري التحميل...</p>
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
                      <div className="ml-3 flex-1 min-w-0">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد إشعارات جديدة</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// المكون الرئيسي للشريط العلوي
export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
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
  
  function resolveAvatarRaw(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    try {
      if (typeof raw === "string") return raw;
      return undefined;
    } catch {
      return undefined;
    }
  }
  
  const rawAvatarCandidate = user?.imageUrl as string | undefined;
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(
    () => resolveAvatarRaw(rawAvatarCandidate)
  );
  
  useEffect(() => {
    setAvatarSrc(
      resolveAvatarRaw(
        (user?.imageUrl as string | undefined)
      )
    );
  }, [user]);
  
  const displayName = user?.fullName || user?.firstName || "المستخدم";
  const initials = (displayName || "مستخدم")
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
  
  return (
    <>
      {/* النافبار الرئيسي للكمبيوتر */}
      <nav className="hidden md:flex fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[85%] max-w-5xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl rounded-2xl border border-white/20 dark:border-gray-700/30 py-1.5 px-4 transition-all duration-300">
        <div className="flex justify-between items-center w-full">
          {/* القسم الأيسر - الشعار والروابط */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-75 transition duration:500"></div>
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 rounded-full shadow-xl border-2 border-white/30 transition-all duration-500 transform group-hover:scale-110 group-hover:shadow-lg">
                  <Image 
                    src="/logo.png" 
                    alt="فذلكه" 
                    width={32} 
                    height={32}
                    className="object-contain transition-transform duration-500 group-hover:rotate-12"
                  />
                </div>
              </div>
            </Link>
            
            {/* الروابط الرئيسية بجوار الشعار مباشرة */}
            <div className="flex items-center space-x-0 ml-1">
              <Link href="/" className="px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                الرئيسية
              </Link>
              
              <div className="relative content-dropdown">
                <button
                  onClick={() => setContentOpen(!contentOpen)}
                  className="px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                  </svg>
                  محتوانا
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${contentOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                {contentOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-300 transform origin-top opacity-0 scale-95 animate-fade-in z-50">
                    <div className="p-1">
                      <Link href="/episodes" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        <span className="text-sm font-medium">الحلقات</span>
                      </Link>
                      <Link href="/playlists" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 group-hover:text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        <span className="text-sm font-medium">قوائم التشغيل</span>
                      </Link>
                      <Link href="/seasons" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 group-hover:text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H8V3a1 1 0 00-1-1H6zM4 8h12v8H4V8z" />
                        </svg>
                        <span className="text-sm font-medium">المواسم</span>
                      </Link>
                      <Link href="/articles" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 group-hover:text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                        </svg>
                        <span className="text-sm font-medium">المقالات</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative about-dropdown">
                <button
                  onClick={() => setAboutOpen(!aboutOpen)}
                  className="px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                  </svg>
                  تعرف علينا
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${aboutOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                {aboutOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-300 transform origin-top opacity-0 scale-95 animate-fade-in z-50">
                    <div className="p-1">
                      <Link href="/about" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                        </svg>
                        <span className="text-sm font-medium">من نحن</span>
                      </Link>
                      <Link href="/team" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 group-hover:text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                        <span className="text-sm font-medium">الفريق</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative contact-dropdown">
                <button
                  onClick={() => setContactOpen(!contactOpen)}
                  className="px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  التواصل
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${contactOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                {contactOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-300 transform origin-top opacity-0 scale-95 animate-fade-in z-50">
                    <div className="p-1">
                      <Link href="/contact" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span className="text-sm font-medium">تواصل معنا</span>
                      </Link>
                      <Link href="/faq" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 group-hover:text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                        </svg>
                        <span className="text-sm font-medium">الأسئلة الشائعة</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              {/* قسم البحث */}
              <div className="relative">
                <SearchBar />
              </div>
            </div>
          </div>
          
          {/* القسم الأيمن - الوضع الداكن والحساب */}
          <div className="flex items-center space-x-1">
            {/* أيقونة الوضع الداكن قبل الحساب */}
            <DarkModeSwitch isDark={isDark} toggleDarkMode={toggleDarkMode} />
            
            <SignedOut>
              <div className="flex items-center space-x-1">
                <Link href="/sign-in" className="px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium text-gray-900 dark:text-white">
                  تسجيل دخول
                </Link>
                <Link href="/sign-up" className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm font-medium text-white shadow-md">
                  إنشاء حساب
                </Link>
              </div>
            </SignedOut>
            
            <SignedIn>
              {/* زر الإشعارات المحدث */}
              <div className="notification-dropdown">
                <NotificationButton 
                  showNotifications={showNotifications} 
                  setShowNotifications={setShowNotifications} 
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
                  <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-300 transform origin-top-left opacity-0 scale-95 animate-fade-in z-50">
                    <div className="p-1">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</p>
                      </div>
                      <button
                        onClick={handleManage}
                        className="w-full text-right px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between group"
                      >
                        <span className="text-sm font-medium">إدارة الحساب</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleFavorites}
                        className="w-full text-right px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between group"
                      >
                        <span className="text-sm font-medium">مفضلاتي</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-right px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center justify-between group"
                      >
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">تسجيل الخروج</span>
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
              
              {/* زر الإشعارات بجوار زر الحساب في الموبايل */}
              <NotificationButton 
                showNotifications={showNotifications} 
                setShowNotifications={setShowNotifications} 
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
                    src="/logo.png" 
                    alt="فذلكه" 
                    width={36} 
                    height={36}
                    className="object-contain transition-transform duration-500 group-hover:rotate-12"
                  />
                </div>
              </div>
            </Link>
          </div>
          
          {/* القسم الأيمن - الأزرار */}
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
      
      {/* القائمة الجانبية للموبايل من اليسار */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* طبقة التعتيم */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={(e) => {
                // تجاهل النقر إذا كان على زر القائمة
                if ((e.target as Element).closest('#mobile-menu-button')) return;
                setMobileMenuOpen(false);
              }}
            />
            
            {/* القائمة الجانبية */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="mobile-menu-container fixed top-0 left-0 h-full w-80 max-w-full bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto md:hidden"
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
                  <SearchBar initialExpanded={true} />
                </div>
                
                {/* قائمة الروابط */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    {[
                      { href: "/", icon: "home", label: "الرئيسية", color: "from-blue-500 to-cyan-500" },
                      { href: "/episodes", icon: "video", label: "الحلقات", color: "from-purple-500 to-pink-500" },
                      { href: "/playlists", icon: "playlist", label: "قوائم التشغيل", color: "from-green-500 to-teal-500" },
                      { href: "/seasons", icon: "calendar", label: "المواسم", color: "from-yellow-500 to-orange-500" },
                      { href: "/articles", icon: "article", label: "المقالات", color: "from-red-500 to-rose-500" },
                      { href: "/about", icon: "info", label: "من نحن", color: "from-indigo-500 to-blue-500" },
                      { href: "/team", icon: "team", label: "الفريق", color: "from-pink-500 to-rose-500" },
                      { href: "/contact", icon: "mail", label: "تواصل معنا", color: "from-cyan-500 to-blue-500" },
                      { href: "/faq", icon: "question", label: "الأسئلة الشائعة", color: "from-teal-500 to-green-500" }
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
                            <span className="text-lg font-medium text-gray-900 dark:text-white">الإشعارات</span>
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
                            <span className="text-lg font-medium text-gray-900 dark:text-white">تسجيل دخول</span>
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
                          <span className="text-lg font-medium text-white">إنشاء حساب</span>
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
                            <span className="text-lg font-medium text-gray-900 dark:text-white">إدارة الحساب</span>
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
                            <span className="text-lg font-medium text-gray-900 dark:text-white">مفضلاتي</span>
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
                            <span className="text-lg font-medium text-red-600 dark:text-red-400">تسجيل الخروج</span>
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
                        © {new Date().getFullYear()} فذلكه
                      </div>
                      <div className="flex space-x-2">
                        <Link href="/terms-conditions" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
                          الشروط
                        </Link>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <Link href="/privacy-policy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
                          الخصوصية
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