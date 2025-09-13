"use client";
import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { buildMediaUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

// تعريف واجهة نتائج البحث المحدثة
interface SearchResult {
  id: string;
  title: string;
  slug?: string;
  type: "episode" | "faq" | "playlist" | "season" | "teamMember" | "terms" | "privacy";
  thumbnail?: string;
  description?: string;
  content?: string;
  publishedAt?: string;
}

// Helper: مسار النتيجة بشكل موثوق (يشمل أعضاء الفريق والشروط وسياسة الخصوصية)
const getHrefForResult = (result: SearchResult) => {
  const idOrSlug = result.slug ?? result.id;
  // ضمان ترميز أي محارف خاصة
  const encoded = encodeURIComponent(String(idOrSlug));
  switch (result.type) {
    case "episode":
      return `/episodes/${encoded}`;
    case "faq":
      return `/faq?faq=${encoded}`;
    case "playlist":
      return `/playlists/${encoded}`;
    case "season":
      return `/seasons/${encoded}`;
    case "teamMember":
      return `/team/${encoded}`;
    case "terms":
      return `/terms-conditions`;
    case "privacy":
      return `/privacy-policy`;
    default:
      return "#";
  }
};

// مكون بطاقة نتيجة البحث
const SearchResultCard = ({ result }: { result: SearchResult }) => {
  const getTypeLabel = () => {
    switch (result.type) {
      case "episode":
        return "حلقة";
      case "faq":
        return "سؤال شائع";
      case "playlist":
        return "قائمة تشغيل";
      case "season":
        return "موسم";
      case "teamMember":
        return "عضو الفريق";
      case "terms":
        return "الشروط والأحكام";
      case "privacy":
        return "سياسة الخصوصية";
      default:
        return "";
    }
  };

  const getTypeColor = () => {
    switch (result.type) {
      case "episode":
        return "bg-blue-500 text-white";
      case "faq":
        return "bg-green-500 text-white";
      case "playlist":
        return "bg-purple-500 text-white";
      case "season":
        return "bg-yellow-500 text-white";
      case "teamMember":
        return "bg-red-500 text-white";
      case "terms":
        return "bg-indigo-500 text-white";
      case "privacy":
        return "bg-pink-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // كروت الأسئلة الشائعة والشروط وسياسة الخصوصية (معروضة بشكل مختلف)
  if (result.type === "faq" || result.type === "terms" || result.type === "privacy") {
    const getIcon = () => {
      switch (result.type) {
        case "faq":
          return (
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case "terms":
          return (
            <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          );
        case "privacy":
          return (
            <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          );
        default:
          return null;
      }
    };

    const getBgColor = () => {
      switch (result.type) {
        case "faq":
          return "bg-green-100 dark:bg-green-900/30";
        case "terms":
          return "bg-indigo-100 dark:bg-indigo-900/30";
        case "privacy":
          return "bg-pink-100 dark:bg-pink-900/30";
        default:
          return "bg-gray-100 dark:bg-gray-700/30";
      }
    };

    return (
      <motion.div
        whileHover={{
          y: -8,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)"
        }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300"
      >
        <Link href={getHrefForResult(result)} className="block">
          <div className="p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 mr-4">
                <div className={`p-3 ${getBgColor()} rounded-xl shadow-md`}>
                  {getIcon()}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{result.title}</h3>
                <span className={`text-xs px-3 py-1 rounded-full ${getTypeColor()} font-medium shadow-sm`}>{getTypeLabel()}</span>
              </div>
            </div>
            {(result.description || result.content) && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {result.description || (result.content && result.content.length > 150 
                    ? `${result.content.substring(0, 150)}...` 
                    : result.content)}
                </p>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    );
  }

  // كروت الحلقات، المواسم، وقوائم التشغيل (بدون تاريخ ووصف)
  return (
    <motion.div
      whileHover={{
        y: -8,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)"
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300"
    >
      <Link href={getHrefForResult(result)} className="block">
        {result.thumbnail && (
          <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <Image
                src={buildMediaUrl(result.thumbnail)}
                alt={result.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </motion.div>
          </div>
        )}
        <div className="p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-lg">{result.title}</h3>
            <span className={`text-xs px-3 py-1 rounded-full ${getTypeColor()} flex-shrink-0 ml-2 font-medium shadow-sm`}>{getTypeLabel()}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// مكون نتائج البحث
const SearchResults = ({ query }: { query: string }) => {
  const [results, setResults] = useState<{
    episodes: SearchResult[];
    faqs: SearchResult[];
    playlists: SearchResult[];
    seasons: SearchResult[];
    teamMembers: SearchResult[];
    terms: SearchResult[];
    privacy: SearchResult[];
  }>({
    episodes: [],
    faqs: [],
    playlists: [],
    seasons: [],
    teamMembers: [],
    terms: [],
    privacy: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          // تصنيف النتائج حسب النوع
          const categorizedResults = {
            episodes: data.filter((item: SearchResult) => item.type === "episode"),
            faqs: data.filter((item: SearchResult) => item.type === "faq"),
            playlists: data.filter((item: SearchResult) => item.type === "playlist"),
            seasons: data.filter((item: SearchResult) => item.type === "season"),
            teamMembers: data.filter((item: SearchResult) => item.type === "teamMember"),
            terms: data.filter((item: SearchResult) => item.type === "terms"),
            privacy: data.filter((item: SearchResult) => item.type === "privacy"),
          };
          setResults(categorizedResults);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (query) {
      fetchResults();
    }
  }, [query]);

  const totalResults =
    results.episodes.length +
    results.faqs.length +
    results.playlists.length +
    results.seasons.length +
    results.teamMembers.length +
    results.terms.length +
    results.privacy.length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 border-t-2 border-b-2 border-blue-500 rounded-full"
        ></motion.div>
      </div>
    );
  }

  if (totalResults === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center border border-gray-200 dark:border-gray-700"
      >
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">لا توجد نتائج</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-lg">
          لم نعثر على أي نتائج لـ &ldquo;<span className="font-medium">{query}</span>&rdquo;. جرب كلمات مفتاحية أخرى.
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          نتائج البحث عن &ldquo;<span className="text-blue-600 dark:text-blue-400">{query}</span>&rdquo;
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{totalResults} نتيجة تم العثور عليها</p>
      </motion.div>
      <div className="space-y-12">
        {/* الحلقات */}
        {results.episodes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-4 shadow-md">
                <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">الحلقات</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{results.episodes.length} نتيجة</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.episodes.map((episode, index) => (
                <motion.div key={`episode-${episode.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <SearchResultCard result={episode} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {/* المواسم */}
        {results.seasons.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <div className="flex items-center mb-6">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl mr-4 shadow-md">
                <svg className="w-7 h-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">المواسم</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{results.seasons.length} نتيجة</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.seasons.map((season, index) => (
                <motion.div key={`season-${season.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <SearchResultCard result={season} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {/* قوائم التشغيل */}
        {results.playlists.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-4 shadow-md">
                <svg className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">قوائم التشغيل</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{results.playlists.length} نتيجة</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.playlists.map((playlist, index) => (
                <motion.div key={`playlist-${playlist.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <SearchResultCard result={playlist} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {/* الأسئلة الشائعة */}
        {results.faqs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl mr-4 shadow-md">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">الأسئلة الشائعة</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{results.faqs.length} نتيجة</p>
              </div>
            </div>
            <div className="space-y-4">
              {results.faqs.map((faq, index) => (
                <motion.div key={`faq-${faq.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <SearchResultCard result={faq} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {/* أعضاء الفريق */}
        {results.teamMembers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
            <div className="flex items-center mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl mr-4 shadow-md">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">أعضاء الفريق</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{results.teamMembers.length} نتيجة</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.teamMembers.map((member, index) => (
                <motion.div key={`member-${member.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <SearchResultCard result={member} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {/* الشروط والأحكام */}
        {results.terms.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
            <div className="flex items-center mb-6">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mr-4 shadow-md">
                <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">الشروط والأحكام</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{results.terms.length} نتيجة</p>
              </div>
            </div>
            <div className="space-y-4">
              {results.terms.map((term, index) => (
                <motion.div key={`term-${term.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <SearchResultCard result={term} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {/* سياسة الخصوصية */}
        {results.privacy.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}>
            <div className="flex items-center mb-6">
              <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl mr-4 shadow-md">
                <svg className="w-7 h-7 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">سياسة الخصوصية</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{results.privacy.length} نتيجة</p>
              </div>
            </div>
            <div className="space-y-4">
              {results.privacy.map((policy, index) => (
                <motion.div key={`policy-${policy.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <SearchResultCard result={policy} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// مكون SearchBar
const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // إغلاق النتائج عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsFocused(false);
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
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setShowResults(true);
      }
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
      setShowResults(false);
    }
  };

  // التوجيه المركزي - نستخدم getHrefForResult لضمان التوجيه الموحد
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery("");
    setIsFocused(false);
    const href = getHrefForResult(result);
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
      case "faq":
        return (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      case "season":
        return (
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "teamMember":
        return (
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case "terms":
        return (
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case "privacy":
        return (
          <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 dark:bg-gray-700/30 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative">
        <div className={`relative transition-all duration-300 ${isFocused ? 'scale-105' : ''}`}>
          {/* شريط البحث الجديد */}
          <div className="relative flex items-center">
            {/* الخلفية الزجاجية */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full backdrop-blur-sm"></div>
            {/* الإطار الخارجي */}
            <div className="absolute inset-0 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg"></div>
            {/* حقل الإدخال */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                if (query.trim().length >= 2) setShowResults(true);
              }}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="ابحث عن حلقات، مواسم، شروط، سياسات..."
              className="relative w-full px-8 py-4 pl-16 pr-16 rounded-full bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none z-10 text-right"
              aria-label="بحث"
            />
            {/* أيقونة البحث (في اليمين) */}
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 z-10">
              <motion.div animate={{ rotate: isFocused ? 360 : 0 }} transition={{ duration: 0.5 }}>
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.div>
            </div>
            {/* زر المسح (في اليسار) */}
            {query && (
              <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setQuery(""); setResults([]); setShowResults(false); }} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10" aria-label="مسح البحث">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
            {/* تأثير توهج عند التركيز */}
            <motion.div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30" initial={{ opacity: 0 }} animate={{ opacity: isFocused ? 1 : 0 }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      </motion.form>
      
      <AnimatePresence>
        {showResults && (query.trim().length >= 2 || results.length > 0) && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute z-50 w-full mt-4 bg-white dark:bg-gray-800 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto"></motion.div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">جاري البحث...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                <div className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">نتائج البحث</div>
                {results.slice(0, 8).map((result, index) => (
                  <motion.div key={`${result.type}-${result.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: index * 0.03 }} whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)", x: 5, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }} className="px-5 py-4 cursor-pointer transition-all duration-150 flex items-center gap-4" onClick={() => handleResultClick(result)}>
                    <div className="flex-shrink-0">{getIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-right">{result.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate text-right">
                        {result.type === "episode" && "حلقة"}
                        {result.type === "faq" && "سؤال شائع"}
                        {result.type === "playlist" && "قائمة تشغيل"}
                        {result.type === "season" && "موسم"}
                        {result.type === "teamMember" && "عضو الفريق"}
                        {result.type === "terms" && "شروط وأحكام"}
                        {result.type === "privacy" && "سياسة الخصوصية"}
                      </p>
                    </div>
                    {result.thumbnail && (
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden shadow-md">
                        <Image
                          src={buildMediaUrl(result.thumbnail)}
                          alt={result.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center shadow-md">
                    عرض جميع نتائج البحث
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-8 text-center">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">لا توجد نتائج مطابقة</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// مكون المحتوى الرئيسي للصفحة (يستخدم useSearchParams)
const SearchPageContent = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">بحث</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">ابحث في جميع محتويات الموقع: الحلقات، المواسم، قوائم التشغيل، الأسئلة الشائعة، أعضاء الفريق، الشروط والأحكام وسياسة الخصوصية</p>
      </motion.div>
      
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-12">
        <SearchBar />
      </motion.div>
      
      <Suspense fallback={
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full"></motion.div>
        </motion.div>
      }>
        {searchQuery ? (
          <SearchResults query={searchQuery} />
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <svg className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">ابحث في محتوى الموقع</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-lg">أدخل كلمات مفتاحية في مربع البحث للعثور على الحلقات، المواسم، قوائم التشغيل، الشروط والأحكام وسياسة الخصوصية</p>
          </motion.div>
        )}
      </Suspense>
    </>
  );
};

// صفحة البحث الرئيسية
const SearchPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full"></motion.div>
            </motion.div>
          }>
            <SearchPageContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;