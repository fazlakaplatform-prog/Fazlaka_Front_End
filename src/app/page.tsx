// app/page.tsx
"use client";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaYoutube,
  FaInstagram,
  FaFacebookF,
  FaTiktok,
  FaTwitter,
  FaQuestionCircle,
  FaPlay,
  FaLightbulb,
  FaVideo,
  FaUsers,
  FaGlobe,
  FaUser,
  FaPaperPlane,
  FaComments,
  FaArrowLeft,
  FaListUl,
  FaCalendarAlt,
  FaNewspaper,
  FaHeart,
  FaStar,
  FaCompass,
  FaTimes,
  FaSearch,
  FaBookmark,
  FaFire,
  FaCalendar,
  FaClock,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { fetchArrayFromSanity, SanityImage, fetchFromSanity, HeroSlider, getImageUrl, getVideoUrl } from "@/lib/sanity";
import imageUrlBuilder from '@sanity/image-url';
import { client } from "@/lib/sanity";

// تعريف واجهات البيانات
interface EpisodeData {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  publishedAt?: string;
  thumbnail?: SanityImage;
  season?: {
    _id: string;
    title: string;
    slug: { current: string };
  };
}

interface ArticleData {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt?: string;
  featuredImage?: SanityImage;
  category?: string;
}

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category?: string;
}

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

// متغيرات الحركة للعناصر
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, when: "beforeChildren" },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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

// دوال مساعدة
function buildSearchMediaUrl(image?: SanityImage): string {
  if (!image) return "/placeholder.png";
  try {
    const url = imageUrlBuilder(client).image(image).width(500).height(300).url();
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

// مكون السؤال المتحرك
const AnimatedQuestion = ({ question, answer, index }: { question: string; answer: string; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div 
      variants={faqItemVariants}
      className={`border-2 rounded-2xl p-6 bg-white dark:bg-gray-800 backdrop-blur-sm transition-all duration-300 ${
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

// مكون بطاقة المقال
const ArticleCard = ({ article }: { article: ArticleData }) => {
  const imageUrl = article.featuredImage 
    ? imageUrlBuilder(client).image(article.featuredImage).width(500).height(300).url()
    : "/placeholder.png";
    
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10 -5px rgba(0, 0, 0, 0.04)" }}
      className="card relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col"
    >
      <Link href={`/articles/${encodeURIComponent(String(article.slug.current))}`} className="block flex-grow flex flex-col">
        <div className="relative h-48 md:h-56 overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {article.category && (
            <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {article.category}
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
            {article.title}
          </h3>
          
          {article.excerpt && (
            <p 
              className="text-gray-600 dark:text-gray-400 mb-4 text-sm"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {article.excerpt}
            </p>
          )}
          
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                مقال
              </span>
              {article.publishedAt && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(article.publishedAt).toLocaleDateString('ar-EG')}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// مكون شريط البحث المخصص للهيرو
const HeroSearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  
  // إغلاق النتائج عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
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
    }
  };
  
  const handleClearSearch = () => {
    setQuery("");
    setShowResults(false);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      <form 
        onSubmit={handleSubmit} 
        className="relative"
      >
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن حلقات، مقالات، مواسم والمزيد..."
            className="w-full py-5 px-6 pr-16 rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 border-white/40 dark:border-gray-700 shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg"
          />
          
          {/* زر البحث */}
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 hover:scale-105"
          >
            <FaSearch className="h-5 w-5" />
          </button>
          
          {/* زر المسح (X) - يظهر فقط عند وجود نص */}
          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 shadow-md transition-all duration-300 hover:scale-105"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
      
      <AnimatePresence>
        {showResults && (query.trim().length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 right-0 mt-3 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-96 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-3 text-gray-500 dark:text-gray-400">جاري البحث...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                <div className="px-5 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  نتائج البحث
                </div>
                {results.slice(0, 5).map((result) => (
                  <div
                    key={`${result._type}-${result._id}`}
                    className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150 flex items-center gap-4"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex-shrink-0">
                      {getIcon(result._type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {renderHighlighted(result.title || "", query)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {result._type === "episode" && "حلقة"}
                        {result._type === "article" && "مقال"}
                        {result._type === "playlist" && "قائمة تشغيل"}
                        {result._type === "faq" && "سؤال شائع"}
                        {result._type === "season" && "موسم"}
                        {result._type === "teamMember" && "عضو الفريق"}
                        {result._type === "terms" && "شروط وأحكام"}
                        {result._type === "privacy" && "سياسة الخصوصية"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                        {renderHighlighted(getDisplayText(result), query)}
                      </p>
                    </div>
                    {getImageUrl(result) && (
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                        <Image
                          src={getImageUrl(result)}
                          alt={result.title || ""}
                          width={48}
                          height={48}
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
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={handleSubmit}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl text-base font-semibold transition-colors duration-200 flex items-center justify-center"
                  >
                    عرض جميع نتائج البحث
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 005.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-gray-500 dark:text-gray-400">لا توجد نتائج مطابقة</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// مكون سلايدر الهيرو المدمج - محسن
const HeroSliderComponent = () => {
  const [sliders, setSliders] = useState<HeroSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const loadSliders = async () => {
      try {
        const data = await fetchFromSanity<HeroSlider[]>(`*[_type == "heroSlider"] | order(orderRank)`);
        setSliders(data);
      } catch (error) {
        console.error('Error loading hero sliders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSliders();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-64 md:h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (sliders.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8 px-4 md:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={20}
          slidesPerView={1}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          className="hero-swiper rounded-2xl overflow-hidden shadow-2xl"
          style={{
            height: '60vh',
            maxHeight: '500px',
          }}
        >
          {sliders.map((slider) => (
            <SwiperSlide key={slider._id}>
              <div className="relative w-full h-full">
                {slider.mediaType === 'image' && slider.image && (
                  <Image
                    src={getImageUrl(slider) || '/placeholder.png'}
                    alt={slider.title}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
                
                {slider.mediaType === 'video' && (
                  <div className="relative w-full h-full">
                    {slider.videoUrl ? (
                      <>
                        {slider.videoUrl.includes('youtube.com') || slider.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${extractVideoId(slider.videoUrl)}?autoplay=1&mute=1&loop=1&playlist=${extractVideoId(slider.videoUrl)}&controls=0&showinfo=0&modestbranding=1&rel=0`}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : slider.videoUrl.includes('vimeo.com') ? (
                          <iframe
                            src={`https://player.vimeo.com/video/${extractVideoId(slider.videoUrl)}?autoplay=1&muted=1&loop=1&controls=0`}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={slider.videoUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        )}
                      </>
                    ) : slider.video && (
                      <video
                        src={getVideoUrl(slider) || ''}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    )}
                  </div>
                )}
                
                {/* طبقة التعتيم */}
                <div className="absolute inset-0 bg-black/40"></div>
                
                {/* المحتوى */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-center max-w-3xl px-4">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-2xl md:text-4xl font-bold text-white mb-3"
                    >
                      {slider.title}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-base md:text-lg text-white/90 mb-6"
                    >
                      {slider.description}
                    </motion.p>
                    
                    {slider.link?.url && slider.link?.text && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link
                          href={slider.link.url}
                          className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-2 md:px-8 md:py-3 rounded-full font-bold shadow-lg hover:bg-blue-50 transition-all duration-300"
                        >
                          {slider.link.text}
                          <FaArrowLeft className="transform rotate-180" />
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        <div className="swiper-button-next text-white hidden md:block"></div>
        <div className="swiper-button-prev text-white hidden md:block"></div>
      </div>
      
      <style jsx global>{`
        .hero-slider .swiper-pagination-bullet {
          background-color: rgba(255, 255, 255, 0.5);
          width: 12px;
          height: 12px;
          opacity: 0.7;
        }
        .hero-slider .swiper-pagination-bullet-active {
          background-color: white;
          width: 30px;
          border-radius: 6px;
          opacity: 1;
        }
        .hero-slider-button-next,
        .hero-slider-button-prev {
          color: white;
        }
        @media (max-width: 768px) {
          .hero-swiper {
            height: 50vh !important;
            max-height: 400px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default function Home() {
  // حالات المكون
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [subscribers, setSubscribers] = useState<number | null>(null);
  const [episodesCount, setEpisodesCount] = useState<number>(0);
  const [playlistsCount, setPlaylistsCount] = useState<number>(0);
  const [seasonsCount, setSeasonsCount] = useState<number>(0);
  const [articlesCount, setArticlesCount] = useState<number>(0);
  const { user } = useUser();
  
  // إنشاء imageBuilder مرة واحدة فقط
  const imageBuilder = useMemo(() => imageUrlBuilder(client), []);
  
  // روابط وسائل التواصل الاجتماعي
  const socialLinks = useMemo(() => [
    { href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA", icon: <FaYoutube />, label: "يوتيوب" },
    { href: "https://www.instagram.com/fazlaka_platform/", icon: <FaInstagram />, label: "انستجرام" },
    { href: "https://www.facebook.com/profile.php?id=61579582675453", icon: <FaFacebookF />, label: "فيسبوك" },
    { href: "https://www.tiktok.com/@fazlaka_platform", icon: <FaTiktok />, label: "تيك توك" },
    { href: "https://x.com/FazlakaPlatform", icon: <FaTwitter />, label: "اكس" },
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
  }, []);
  
  // تحميل الحلقات من Sanity
  useEffect(() => {
    let mounted = true;
    async function loadEpisodes() {
      try {
        setLoading(true);
        
        // استعلام لجلب الحلقات من Sanity
        const query = `*[_type == "episode"]{
          _id,
          title,
          slug,
          description,
          thumbnail,
          season->{
            _id,
            title,
            slug
          },
          publishedAt
        } | order(publishedAt desc)[0...9]`;
        
        // استخدم الدالة الجديدة
        const data = await fetchArrayFromSanity<EpisodeData>(query);
        
        if (mounted) {
          setEpisodes(data);
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
  }, []);
  
  // تحميل المقالات من Sanity
  useEffect(() => {
    let mounted = true;
    async function loadArticles() {
      try {
        // استعلام لجلب المقالات من Sanity
        const query = `*[_type == "article"]{
          _id,
          title,
          slug,
          excerpt,
          featuredImage,
          category,
          publishedAt
        } | order(publishedAt desc)[0...6]`;
        
        // استخدم الدالة الجديدة
        const data = await fetchArrayFromSanity<ArticleData>(query);
        
        if (mounted) {
          setArticles(data);
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
  }, []);
  
  // تحميل الإحصائيات
  useEffect(() => {
    let mounted = true;
    
    async function loadStats() {
      try {
        // تحميل عدد المشتركين في يوتيوب
        const subscribersResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCWftbKWXqj0wt-UHMLAcsJA&key=AIzaSyBcPhsKTsQ7YGqKiP-eG6TZh2P9DKN1QnA`, 
          { cache: "no-store" }
        );
        if (subscribersResponse.ok) {
          const data = await subscribersResponse.json();
          const count = data.items?.[0]?.statistics?.subscriberCount;
          if (count && mounted) {
            setSubscribers(parseInt(count, 10));
          }
        }
        
        // تحميل باقي الإحصائيات
        const [episodesCount, playlistsCount, seasonsCount, articlesCount] = await Promise.all([
          fetchFromSanity<number>(`count(*[_type == "episode"])`),
          fetchFromSanity<number>(`count(*[_type == "playlist"])`),
          fetchFromSanity<number>(`count(*[_type == "season"])`),
          fetchFromSanity<number>(`count(*[_type == "article"])`)
        ]);
        
        if (mounted) {
          setEpisodesCount(episodesCount || 0);
          setPlaylistsCount(playlistsCount || 0);
          setSeasonsCount(seasonsCount || 0);
          setArticlesCount(articlesCount || 0);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      }
    }
    
    loadStats();
    return () => {
      mounted = false;
    };
  }, []);
  
  // تحميل الأسئلة الشائعة من Sanity
  useEffect(() => {
    let mounted = true;
    async function loadFaqs() {
      try {
        setFaqLoading(true);
        
        // استعلام لجلب الأسئلة الشائعة من Sanity
        const query = `*[_type == "faq"] | order(_createdAt desc)[0...4] {
          _id,
          question,
          answer,
          category
        }`;
        
        // استخدم الدالة الجديدة
        const data = await fetchArrayFromSanity<FAQItem>(query);
        
        if (mounted) {
          setFaqs(data);
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
  }, []);
  
  // دالة للتمرير إلى قسم الحلقات
  const scrollToEpisodes = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById("episodes-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.location.href = "/episodes";
  }, []);
  
  return (
    <div className="antialiased bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
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
        
        {/* شبكة علمية محسنة */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMC41IiBmaWxsPSIjODA4MGZmIiBvcGFjaXR5PSIwLjE1IiAvPgo8L3N2Zz4=')] opacity-30 dark:opacity-20" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPHBhdGggZD0iTTAgMEw0MCA0ME00MCAwTDAgNDAiIHN0cm9rZT0iIzk5NDVmZiIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMiIgLz4KPC9zdmc+')] opacity-15 dark:opacity-10" />
          
          {/* دوائر متحركة محسنة */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-600/20 dark:bg-indigo-700/15 blur-3xl"
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
            className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-purple-600/20 dark:bg-purple-700/15 blur-3xl"
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
            className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-blue-600/20 dark:bg-blue-700/15 blur-3xl"
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
          
          {/* إضافة تأثيرات ضوئية جديدة */}
          <motion.div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 blur-3xl"
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
                  className="relative w-24 md:w-32 h-auto drop-shadow-2xl z-10"
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
                    src="/logo.png"
                    alt="شعار المنصة"
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
              <motion.h1
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                فذلَكة
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl lg:text-3xl text-indigo-100 max-w-3xl mx-auto font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                منصة المعرفة التفاعلية
              </motion.p>
            </motion.div>
            
            {/* شريط البحث المخصص */}
            <motion.div 
              className="w-full max-w-2xl mx-auto mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <HeroSearchBar />
            </motion.div>
            
            {/* قسم الأزرار مع تأثيرات جديدة */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              <motion.button
                whileHover={{ scale: 1.08, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToEpisodes}
                className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-full text-lg shadow-lg flex items-center gap-3"
              >
                <FaPlay className="text-xl" />
                ابدأ المشاهدة
              </motion.button>
              <Link href="/about">
                <motion.button
                  whileHover={{ scale: 1.08, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-transparent border-2 border-indigo-300 text-indigo-100 font-bold rounded-full text-lg shadow-lg flex items-center gap-3"
                >
                  <FaCompass className="text-xl" />
                  اعرف المزيد
                </motion.button>
              </Link>
            </motion.div>
            
            {/* ====== قسم الإحصائيات الجديد - مع أنيميشن محسن ====== */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full max-w-5xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl">
                {/* كرت مشتركي يوتيوب - في سطر منفصل على الموبايل */}
                {subscribers !== null && (
                  <motion.div 
                    variants={itemVariant}
                    className="md:hidden mb-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 border border-white/20 relative overflow-hidden group"
                    whileHover={{ scale: 1.02 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="text-3xl md:text-4xl mb-3 text-white">
                        <FaYoutube />
                      </div>
                      <p className="text-base md:text-lg font-medium text-white/80 mb-1">مشتركين يوتيوب</p>
                      <motion.p 
                        className="text-2xl md:text-3xl font-bold text-white"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      >
                        {subscribers.toLocaleString('en-US')}
                      </motion.p>
                    </div>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                  {/* كرت مشتركي يوتيوب - مخفي على الموبايل */}
                  {subscribers !== null && (
                    <motion.div 
                      variants={itemVariant}
                      className="hidden md:block bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 border border-white/20 relative overflow-hidden group"
                      whileHover={{ scale: 1.05 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="text-3xl md:text-4xl mb-3 text-white">
                          <FaYoutube />
                        </div>
                        <p className="text-base md:text-lg font-medium text-white/80 mb-1">مشتركين يوتيوب</p>
                        <motion.p 
                          className="text-2xl md:text-3xl font-bold text-white"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        >
                          {subscribers.toLocaleString('en-US')}
                        </motion.p>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* باقي البطاقات */}
                  <motion.div 
                    variants={itemVariant}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 border border-white/20 relative overflow-hidden group"
                    whileHover={{ scale: 1.05 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="text-3xl md:text-4xl mb-3 text-white">
                        <FaVideo />
                      </div>
                      <p className="text-base md:text-lg font-medium text-white/80 mb-1">حلقات</p>
                      <motion.p 
                        className="text-2xl md:text-3xl font-bold text-white"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      >
                        {episodesCount}
                      </motion.p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariant}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 border border-white/20 relative overflow-hidden group"
                    whileHover={{ scale: 1.05 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="text-3xl md:text-4xl mb-3 text-white">
                        <FaListUl />
                      </div>
                      <p className="text-base md:text-lg font-medium text-white/80 mb-1">قوائم تشغيل</p>
                      <motion.p 
                        className="text-2xl md:text-3xl font-bold text-white"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                      >
                        {playlistsCount}
                      </motion.p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariant}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 border border-white/20 relative overflow-hidden group"
                    whileHover={{ scale: 1.05 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="text-3xl md:text-4xl mb-3 text-white">
                        <FaCalendarAlt />
                      </div>
                      <p className="text-base md:text-lg font-medium text-white/80 mb-1">مواسم</p>
                      <motion.p 
                        className="text-2xl md:text-3xl font-bold text-white"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      >
                        {seasonsCount}
                      </motion.p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariant}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 border border-white/20 relative overflow-hidden group"
                    whileHover={{ scale: 1.05 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="text-3xl md:text-4xl mb-3 text-white">
                        <FaNewspaper />
                      </div>
                      <p className="text-base md:text-lg font-medium text-white/80 mb-1">مقالات</p>
                      <motion.p 
                        className="text-2xl md:text-3xl font-bold text-white"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                      >
                        {articlesCount}
                      </motion.p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* عناصر علمية زخرفية */}
        <motion.div 
          className="absolute bottom-10 right-10 w-20 h-20 rounded-full bg-cyan-200/20 dark:bg-cyan-500/10 blur-2xl"
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
          className="absolute top-20 left-10 w-16 h-16 rounded-full bg-emerald-200/20 dark:bg-emerald-500/10 blur-2xl"
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
          className="absolute top-1/2 right-1/4 w-18 h-18 rounded-full bg-teal-200/20 dark:bg-teal-500/10 blur-2xl"
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
      
      {/* ====== سلايدر الهيرو الجديد والمحسن ====== */}
      <HeroSliderComponent />
      
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
            <Link
              href="/seasons"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              المواسم
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
            >
              {episodes.map((ep: EpisodeData) => {
                const slug = ep.slug.current;
                const title = ep.title;
                const thumbnailUrl = ep.thumbnail 
                  ? imageBuilder.image(ep.thumbnail).width(500).height(300).url()
                  : "/placeholder.png";
                
                return (
                  <SwiperSlide key={ep._id} className="flex justify-center items-start">
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
                              {ep.publishedAt && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(ep.publishedAt).toLocaleDateString('ar-EG')}
                                </span>
                              )}
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
            أحدث المقالات
          </motion.h2>
          <motion.div initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} className="flex gap-2">
            <Link
              href="/articles"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-95 transition-all duration-300"
            >
              جميع المقالات
            </Link>
            <Link
              href="/seasons"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              المواسم
            </Link>
            <Link
              href="/playlists"
              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              قوائم التشغيل
            </Link>
          </motion.div>
        </div>
        
        {articles.length === 0 ? (
          <p className="text-center py-12 text-gray-600 dark:text-gray-400">لا توجد مقالات حالياً</p>
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
            >
              {articles.map((article: ArticleData) => {
                const slug = article.slug.current;
                const title = article.title;
                const imageUrl = article.featuredImage 
                  ? imageBuilder.image(article.featuredImage).width(500).height(300).url()
                  : "/placeholder.png";
                
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
                      className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      جميع الأسئلة
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
                        key={f._id} 
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
      
      {/* ====== قسم متكامل في النهاية مع صورة الشخص ====== */}
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
                    نحن منصة تعليمية تقدم محتوى ترفيهي وتعليمي مميز. نعمل باستمرار على تحسين التجربة وتوفير أحدث الحلقات والقوائم.
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
                      <span>اعرف أكثر عن المنصة</span>
                      <FaArrowLeft className="transform rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* قسم "لماذا تشترك؟" */}
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
              
              {/* قسم التسجيل والترحيب مع صورة الشخص */}
              <motion.div 
                variants={itemVariant}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-700/20"></div>
                <div className="relative z-10">
                  <SignedOut>
                    <div className="text-center">
                      {/* صورة الشخص */}
                      <div className="flex justify-center mb-6">
                        <div className="relative">
                          <Image 
                            src="/ali.png" 
                            alt="صورة شخصية" 
                            width={120}
                            height={120}
                            className="w-32 h-32 rounded-full border-4 border-white/30 shadow-lg object-cover"
                          />
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-4">انضم إلى مجتمعنا</h3>
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
                        مرحباً بك، {user?.firstName || user?.username || "صديقنا"}!
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
                            href="/favorites"
                            className="block w-full py-3 px-6 rounded-full bg-white/10 backdrop-blur-sm text-white font-semibold shadow-lg hover:bg-white/20 transition flex items-center justify-center gap-2"
                          >
                            <FaBookmark />
                            المفضلة
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </SignedIn>
                </div>
              </motion.div>
            </div>
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
      `}</style>
    </div>
  );
}