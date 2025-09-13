"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { buildMediaUrl } from "@/lib/utils";
// تعريف واجهة لنتائج البحث
interface SearchResult {
  slug?: string;
  id: string | number;
  type: string;
  title?: string;
  thumbnail?: string;
}
// تعريف نوع لبيانات الأفاتار
type AvatarRaw = 
  | string 
  | ((...args: unknown[]) => string) 
  | { url?: string; imageUrl?: string } 
  | string[];
// دالة موحدة للتوجيه - معدلة لاستخدام التوجيه الجديد للأسئلة الشائعة والعناصر الجديدة
const getHrefForResult = (result: SearchResult) => {
  const idOrSlug = result.slug ?? result.id;
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
// مكون SearchBar المعدل
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
  
  // تعديل دالة التوجيه لاستخدام الدالة الموحدة
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery("");
    
    // استخدام الدالة الموحدة للتوجيه
    const href = getHrefForResult(result);
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
  
  // عرض مختلف للموبايل - نفس شكل الكمبيوتر
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
        
        {/* زر الحذف (X) */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </form>
      
      {/* نتائج البحث المقترحة */}
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
                    key={`${result.type}-${result.id}`}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150 flex items-center gap-3"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex-shrink-0">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                        <Image
                          src={buildMediaUrl(result.thumbnail)}
                          alt={result.title || ""}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error("Image load error in search results:", {
                              src: e.currentTarget.src,
                              thumbnail: result.thumbnail,
                              builtUrl: buildMediaUrl(result.thumbnail)
                            });
                            e.currentTarget.style.display = 'none';
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
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [floatingProfileOpen, setFloatingProfileOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [mobileContentOpen, setMobileContentOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileNavbarVisible, setMobileNavbarVisible] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [sideMenuAnimation, setSideMenuAnimation] = useState(false);
  const [joinMenuOpen, setJoinMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileContactOpen, setMobileContactOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const floatingProfileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  useEffect(() => {
    setMounted(true);
    
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
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (!isMobile) {
        if (currentScrollY > 50 && currentScrollY > lastScrollY) {
          setIsVisible(true);
        }
        else if (currentScrollY <= 50 || (currentScrollY < lastScrollY && currentScrollY < 100)) {
          setIsVisible(false);
        }
      } else {
        if (currentScrollY > 100) {
          setMobileNavbarVisible(true);
        } else {
          setMobileNavbarVisible(false);
        }
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMobile]);
  
  function resolveAvatarRaw(raw: AvatarRaw): string | undefined {
    if (!raw) return undefined;
    try {
      if (typeof raw === "string") return raw;
      if (typeof raw === "function") {
        try {
          return raw({ size: 128 });
        } catch {
          return raw();
        }
      }
      if (Array.isArray(raw) && raw.length) return raw[0];
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        if (raw.url) return raw.url;
        if (raw.imageUrl) return raw.imageUrl;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }
  
  const rawAvatarCandidate = user?.imageUrl;
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(
    () => resolveAvatarRaw(rawAvatarCandidate as AvatarRaw)
  );
  
  useEffect(() => {
    setAvatarSrc(
      resolveAvatarRaw(
        (user?.imageUrl) as AvatarRaw
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
  
  const handleFloatingManage = () => {
    setFloatingProfileOpen(false);
    setTimeout(() => router.push("/profile"), 100);
  };
  
  const handleFloatingFavorites = () => {
    setFloatingProfileOpen(false);
    setTimeout(() => router.push("/favorites"), 100);
  };
  
  const handleFloatingSignOut = async () => {
    setFloatingProfileOpen(false);
    setTimeout(async () => {
      await signOut();
      router.push("/");
    }, 100);
  };
  
  const closeMobileMenuWithAnimation = () => {
    setMobileContentOpen(false);
    setMobileAboutOpen(false);
    setMobileContactOpen(false);
    setTimeout(() => setIsMenuOpen(false), 300);
  };
  
  const handleMobileLinkClick = (href: string) => {
    closeMobileMenuWithAnimation();
    setTimeout(() => router.push(href), 300);
  };
  
  const handleMobileSignOut = async () => {
    closeMobileMenuWithAnimation();
    setTimeout(async () => {
      await signOut();
      router.push("/");
    }, 300);
  };
  
  
  const toggleMobileContent = () => {
    setMobileContentOpen(!mobileContentOpen);
  };
  
  const toggleMobileAbout = () => {
    setMobileAboutOpen(!mobileAboutOpen);
  };
  
  const toggleMobileContact = () => {
    setMobileContactOpen(!mobileContactOpen);
  };
  
  const toggleSideMenu = () => {
    if (sideMenuOpen) {
      setSideMenuAnimation(false);
      setTimeout(() => setSideMenuOpen(false), 300);
    } else {
      setSideMenuOpen(true);
      setTimeout(() => setSideMenuAnimation(true), 10);
    }
  };
  
  const closeSideMenu = () => {
    setSideMenuAnimation(false);
    setTimeout(() => setSideMenuOpen(false), 300);
  };
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (floatingProfileRef.current && !floatingProfileRef.current.contains(e.target as Node)) {
        setFloatingProfileOpen(false);
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
      if (joinMenuOpen && !(e.target as Element).closest('.join-menu')) {
        setJoinMenuOpen(false);
      }
    }
    
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setFloatingProfileOpen(false);
        setContentOpen(false);
        setMobileContentOpen(false);
        setAboutOpen(false);
        setMobileAboutOpen(false);
        setContactOpen(false);
        setMobileContactOpen(false);
        setJoinMenuOpen(false);
        if (isMenuOpen) closeMobileMenuWithAnimation();
        if (sideMenuOpen) closeSideMenu();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [contentOpen, isMenuOpen, sideMenuOpen, joinMenuOpen, aboutOpen, contactOpen, mobileAboutOpen, mobileContactOpen]);
  
  if (!mounted) return null;
  
  return (
    <>
      {/* Navbar العادي في الأعلى */}
      <nav className={`bg-gradient-to-r from-indigo-900 to-purple-800 text-white py-2 shadow-lg relative z-20 transition-all duration-500 ${
        isMobile ? (mobileNavbarVisible ? "opacity-0 -translate-y-6 pointer-events-none" : "opacity-100 translate-y-0") : (isVisible ? "opacity-0 -translate-y-6 pointer-events-none" : "opacity-100 translate-y-0")
      }`}>
        <div className="container mx-auto flex justify-between items-center px-4">
          <Link href="/" className="flex items-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-xl border-2 border-white/30 transition-all duration-500 transform group-hover:scale-110 group-hover:shadow-2xl group-hover:rotate-6">
                <Image 
                  src="/logo.png" 
                  alt="فذلكه" 
                  width={40} 
                  height={40}
                  className="object-contain transition-transform duration-500 group-hover:rotate-12"
                />
              </div>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Link href="/" className="px-4 py-2 rounded-md hover:bg-white/20 transition-all duration-300 hover:text-blue-200 transform hover:scale-105 text-sm font-medium flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                الرئيسية
              </Link>
              
              <div className="relative content-dropdown">
                <button
                  onClick={() => setContentOpen(!contentOpen)}
                  className="px-4 py-2 rounded-md hover:bg-white/20 transition-all duration-300 hover:text-blue-200 transform hover:scale-105 text-sm font-medium flex items-center gap-1.5"
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
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                        <span className="text-sm font-medium">الحلقات</span>
                      </Link>
                      <Link href="/playlists" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 group-hover:text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                        </svg>
                        <span className="text-sm font-medium">قوائم التشغيل</span>
                      </Link>
                      <Link href="/seasons" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 group-hover:text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
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
            </div>
            
            <div className="flex items-center space-x-2">
              {/* زرار " تعرف علينا" مع القائمة المنسدلة */}
              <div className="relative about-dropdown">
                <button
                  onClick={() => setAboutOpen(!aboutOpen)}
                  className="px-4 py-2 rounded-md hover:bg-white/20 transition-all duration-300 hover:text-blue-200 transform hover:scale-105 text-sm font-medium flex items-center gap-1.5"
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
              
              {/* زرار "التواصل" مع القائمة المنسدلة */}
              <div className="relative contact-dropdown">
                <button
                  onClick={() => setContactOpen(!contactOpen)}
                  className="px-4 py-2 rounded-md hover:bg-white/20 transition-all duration-300 hover:text-blue-200 transform hover:scale-105 text-sm font-medium flex items-center gap-1.5"
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
            </div>
            
            {/* قسم البحث - مكون SearchBar الجديد */}
            <div className="relative max-w-xs">
              <SearchBar />
            </div>
            
            <SignedOut>
              <div className="flex items-center space-x-2">
                <Link href="/sign-in" className="px-4 py-2 rounded-md hover:bg-white/20 transition-all duration-300 hover:text-blue-200 transform hover:scale-105 text-sm font-medium flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" />
                  </svg>
                  تسجيل دخول
                </Link>
                <Link href="/sign-up" className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 text-sm font-medium flex items-center gap-1.5 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  إنشاء حساب
                </Link>
              </div>
            </SignedOut>
            
            <SignedIn>
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(prev => !prev)}
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/20 focus:outline-none transition-all duration-300 transform hover:scale-105"
                >
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt={displayName}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover border-2 border-white/30"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarSrc(undefined)}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-800 text-white flex items-center justify-center font-semibold border-2 border-white/30 text-xs">
                      {initials}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
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
            
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707+.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707+.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            
            <button
              onClick={toggleSideMenu}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className={`md:hidden bg-gradient-to-b from-indigo-900 to-purple-800 backdrop-blur-sm border-t border-white/20 shadow-xl transition-all duration-500 transform origin-top ${
            isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
          }`}>
            <div className="container mx-auto px-4 py-4">
              {/* Mobile Search Bar - مكون SearchBar الجديد */}
              <div className="mb-4">
                <SearchBar initialExpanded={true} />
              </div>
              
              <div className="space-y-1">
                <button
                  onClick={() => handleMobileLinkClick("/")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <span className="text-base font-medium">الرئيسية</span>
                </button>
                
                <div className="space-y-1">
                  <button
                    onClick={toggleMobileContent}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                        </svg>
                      </div>
                      <span className="text-base font-medium">محتوانا</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white/70 transition-transform duration-300 ${mobileContentOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                  
                  {mobileContentOpen && (
                    <div className="ml-11 space-y-1">
                      <button
                        onClick={() => handleMobileLinkClick("/episodes")}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                      >
                        <div className="w-7 h-7 rounded-md bg-blue-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          </svg>
                        </div>
                        <span className="text-sm">الحلقات</span>
                      </button>
                      <button
                        onClick={() => handleMobileLinkClick("/playlists")}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                      >
                        <div className="w-7 h-7 rounded-md bg-purple-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                          </svg>
                        </div>
                        <span className="text-sm">قوائم التشغيل</span>
                      </button>
                      <button
                        onClick={() => handleMobileLinkClick("/seasons")}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                      >
                        <div className="w-7 h-7 rounded-md bg-green-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-300" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                          </svg>
                        </div>
                        <span className="text-sm">المواسم</span>
                      </button>
                      <button
                        onClick={() => handleMobileLinkClick("/articles")}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                      >
                        <div className="w-7 h-7 rounded-md bg-yellow-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                          </svg>
                        </div>
                        <span className="text-sm">المقالات</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* زرار " تعرف علينا" مع القائمة المنسدلة للموبايل */}
                <div className="space-y-1">
                  <button
                    onClick={toggleMobileAbout}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                        </svg>
                      </div>
                      <span className="text-base font-medium"> تعرف علينا</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white/70 transition-transform duration-300 ${mobileAboutOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                  
                  {mobileAboutOpen && (
                    <div className="ml-11 space-y-1">
                      <button
                        onClick={() => handleMobileLinkClick("/about")}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                      >
                        <div className="w-7 h-7 rounded-md bg-blue-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                          </svg>
                        </div>
                        <span className="text-sm">من نحن</span>
                      </button>
                      <button
                        onClick={() => handleMobileLinkClick("/team")}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                      >
                        <div className="w-7 h-7 rounded-md bg-purple-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                        </div>
                        <span className="text-sm">الفريق</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* زرار "التواصل" مع القائمة المنسدلة للموبايل */}
                <div className="space-y-1">
                  <button
                    onClick={toggleMobileContact}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <span className="text-base font-medium">التواصل</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white/70 transition-transform duration-300 ${mobileContactOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                  
                  {mobileContactOpen && (
                    <div className="ml-11 space-y-1">
                      <button
                        onClick={() => handleMobileLinkClick("/contact")}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                      >
                        <div className="w-7 h-7 rounded-md bg-blue-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        </div>
                        <span className="text-sm">تواصل معنا</span>
                      </button>
                      <button
                        onClick={() => handleMobileLinkClick("/faq")}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                      >
                        <div className="w-7 h-7 rounded-md bg-green-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-300" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                          </svg>
                        </div>
                        <span className="text-sm">الأسئلة الشائعة</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-white/20 my-3"></div>
              
              <SignedOut>
                <div className="space-y-1">
                  <button
                    onClick={() => handleMobileLinkClick("/sign-in")}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" />
                      </svg>
                    </div>
                    <span className="text-base font-medium">تسجيل دخول</span>
                  </button>
                  <button
                    onClick={() => handleMobileLinkClick("/sign-up")}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg w-full"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                    </div>
                    <span className="text-base font-medium text-white">إنشاء حساب</span>
                  </button>
                </div>
              </SignedOut>
              
              <SignedIn>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300">
                    {avatarSrc ? (
                      <Image
                        src={avatarSrc}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarSrc(undefined)}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg border-2 border-white/30">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-base font-medium">{displayName}</p>
                      <p className="text-xs text-blue-200">{user?.emailAddresses?.[0]?.emailAddress}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      closeMobileMenuWithAnimation();
                      setTimeout(() => router.push("/profile"), 300);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                      </svg>
                    </div>
                    <span className="text-base font-medium">إدارة الحساب</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      closeMobileMenuWithAnimation();
                      setTimeout(() => router.push("/favorites"), 300);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                    </div>
                    <span className="text-base font-medium">مفضلاتي</span>
                  </button>
                  
                  <button
                    onClick={handleMobileSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all duration-300 transform hover:translate-x-1 w-full"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" />
                      </svg>
                    </div>
                    <span className="text-base font-medium text-red-300">تسجيل الخروج</span>
                  </button>
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </nav>
      
      {sideMenuOpen && (
        <>
          <div 
            className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
              sideMenuAnimation ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeSideMenu}
          ></div>
          
          <div className={`fixed top-0 left-0 h-full w-80 max-w-full bg-gradient-to-b from-indigo-900 to-purple-800 shadow-2xl z-50 transition-all duration-300 ease-in-out ${
            sideMenuAnimation ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <Link href="/" className="flex items-center" onClick={closeSideMenu}>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-xl border-2 border-white/30 transition-all duration-500 transform group-hover:scale-110 group-hover:shadow-lg">
                      <Image 
                        src="/logo.png" 
                        alt="فذلكه" 
                        width={40} 
                        height={40}
                        className="object-contain transition-transform duration-500 group-hover:rotate-12"
                      />
                    </div>
                  </div>
                </Link>
                
                <button 
                  onClick={closeSideMenu}
                  className="p-2 rounded-full hover:bg-white/20 transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {/* Side Menu Search Bar - مكون SearchBar الجديد */}
                <div className="mb-6">
                  <SearchBar initialExpanded={true} />
                </div>
                
                <div className="space-y-2">
                  {[
                    { href: "/", icon: "home", label: "الرئيسية" },
                    { href: "/episodes", icon: "play", label: "الحلقات" },
                    { href: "/playlists", icon: "music", label: "قوائم التشغيل" },
                    { href: "/seasons", icon: "calendar", label: "المواسم" },
                    { href: "/articles", icon: "article", label: "المقالات" },
                    { href: "/about", icon: "info", label: "من نحن" },
                    { href: "/team", icon: "team", label: "الفريق" },
                    { href: "/contact", icon: "mail", label: "تواصل معنا" },
                    { href: "/faq", icon: "question", label: "الأسئلة الشائعة" }
                  ].map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeSideMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 ${
                        sideMenuAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                      style={{ transitionDelay: sideMenuAnimation ? `${index * 50}ms` : '0ms' }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        {item.icon === "home" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                          </svg>
                        )}
                        {item.icon === "play" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          </svg>
                        )}
                        {item.icon === "music" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                          </svg>
                        )}
                        {item.icon === "calendar" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                          </svg>
                        )}
                        {item.icon === "article" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                          </svg>
                        )}
                        {item.icon === "question" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                          </svg>
                        )}
                        {item.icon === "info" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                          </svg>
                        )}
                        {item.icon === "team" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                        )}
                        {item.icon === "mail" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-base font-medium">{item.label}</span>
                    </Link>
                  ))}
                  
                  <div className="border-t border-white/20 my-4"></div>
                  
                  <SignedOut>
                    <div className="space-y-2">
                      <Link
                        href="/sign-in"
                        onClick={closeSideMenu}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full ${
                          sideMenuAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ transitionDelay: sideMenuAnimation ? '300ms' : '0ms' }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" />
                          </svg>
                        </div>
                        <span className="text-base font-medium">تسجيل دخول</span>
                      </Link>
                      
                      <Link
                        href="/sign-up"
                        onClick={closeSideMenu}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg w-full ${
                          sideMenuAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ transitionDelay: sideMenuAnimation ? '350ms' : '0ms' }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                        </div>
                        <span className="text-base font-medium text-white">إنشاء حساب</span>
                      </Link>
                    </div>
                  </SignedOut>
                  
                  <SignedIn>
                    <div className="space-y-2">
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 ${
                        sideMenuAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`} style={{ transitionDelay: sideMenuAnimation ? '300ms' : '0ms' }}>
                        {avatarSrc ? (
                          <Image
                            src={avatarSrc}
                            alt={displayName}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                            referrerPolicy="no-referrer"
                            onError={() => setAvatarSrc(undefined)}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg border-2 border-white/30">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="text-base font-medium">{displayName}</p>
                          <p className="text-xs text-blue-200">{user?.emailAddresses?.[0]?.emailAddress}</p>
                        </div>
                      </div>
                      
                      <Link
                        href="/profile"
                        onClick={closeSideMenu}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full ${
                          sideMenuAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ transitionDelay: sideMenuAnimation ? '350ms' : '0ms' }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                          </svg>
                        </div>
                        <span className="text-base font-medium">إدارة الحساب</span>
                      </Link>
                      
                      <Link
                        href="/favorites"
                        onClick={closeSideMenu}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:translate-x-1 w-full ${
                          sideMenuAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ transitionDelay: sideMenuAnimation ? '400ms' : '0ms' }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                        </div>
                        <span className="text-base font-medium">مفضلاتي</span>
                      </Link>
                      
                      <button
                        onClick={async () => {
                          closeSideMenu();
                          await signOut();
                          router.push("/");
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all duration-300 transform hover:translate-x-1 w-full ${
                          sideMenuAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ transitionDelay: sideMenuAnimation ? '450ms' : '0ms' }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" />
                          </svg>
                        </div>
                        <span className="text-base font-medium text-red-300">تسجيل الخروج</span>
                      </button>
                    </div>
                  </SignedIn>
                </div>
              </div>
              
              <div className={`p-4 border-t border-white/20 ${
                sideMenuAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} style={{ transitionDelay: sideMenuAnimation ? '500ms' : '0ms' }}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setIsDark(!isDark);
                      closeSideMenu();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                  >
                    {isDark ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707+.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                        </svg>
                        <span className="text-sm">الوضع النهاري</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                        <span className="text-sm">الوضع الليلي</span>
                      </>
                    )}
                  </button>
                  
                  <div className="text-xs text-white/60">
                    فذلكه © {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {isMobile && (
        <nav className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-500 ${
          mobileNavbarVisible 
            ? "opacity-100 translate-y-0 pointer-events-auto py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl rounded-full border border-white/30 dark:border-gray-700/30 max-w-md w-[90%]" 
            : "opacity-0 -translate-y-6 pointer-events-none"
        }`}>
          <div className="container mx-auto flex justify-between items-center px-4">
            <Link href="/" className="flex items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-full shadow-md transition-all duration-500 transform group-hover:scale-110 group-hover:shadow-lg">
                  <Image 
                    src="/logo.png" 
                    alt="فذلكه" 
                    width={28} 
                    height={28}
                    className="object-contain transition-transform duration-500 group-hover:rotate-12"
                  />
                </div>
              </div>
            </Link>
            
            <div className="flex items-center space-x-2">
              <Link href="/" className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-gray-700 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </Link>
              
              <Link
                href="/episodes"
                className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-gray-700 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </Link>
              
              <Link
                href="/favorites"
                className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-gray-700 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              </Link>
              
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-gray-700 transition-all duration-300"
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707+.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={toggleSideMenu}
                className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-gray-700 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      )}
      
      {!isMobile && (
        <nav className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-500 ${
          isVisible 
            ? "opacity-100 translate-y-0 pointer-events-auto py-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-xl rounded-2xl border border-white/20 dark:border-gray-700/30 max-w-5xl w-[90%]"  // تغيير من max-w-4xl إلى max-w-5xl
            : "opacity-0 -translate-y-6 pointer-events-none"
        }`}>
          <div className="container mx-auto flex justify-between items-center px-4">
            <Link href="/" className="flex items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-full shadow-md transition-all duration-500 transform group-hover:scale-110 group-hover:shadow-lg">
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
            
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/" className="px-3 py-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                الرئيسية
              </Link>
              
              <div className="relative content-dropdown">
                <button
                  onClick={() => setContentOpen(!contentOpen)}
                  className="px-3 py-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium flex items-center gap-1"
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
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                        <span className="text-sm font-medium">الحلقات</span>
                      </Link>
                      <Link href="/playlists" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 group-hover:text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                        </svg>
                        <span className="text-sm font-medium">قوائم التشغيل</span>
                      </Link>
                      <Link href="/seasons" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 group-hover:text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
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
              
              {/* زرار " تعرف علينا" مع القائمة المنسدلة */}
              <div className="relative about-dropdown">
                <button
                  onClick={() => setAboutOpen(!aboutOpen)}
                  className="px-3 py-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium flex items-center gap-1"
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
              
              {/* زرار "التواصل" مع القائمة المنسدلة */}
              <div className="relative contact-dropdown">
                <button
                  onClick={() => setContactOpen(!contactOpen)}
                  className="px-3 py-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium flex items-center gap-1"
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
              
              {/* Floating Navbar Search - مكون SearchBar الجديد */}
              <div className="relative flex-grow max-w-md">
                <SearchBar />
              </div>
              
              <SignedOut>
                <div className="relative join-menu">
                  <button
                    onClick={() => setJoinMenuOpen(!joinMenuOpen)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm font-medium text-white flex items-center gap-1 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    انضم إلينا
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${joinMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                  
                  {joinMenuOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-300 transform origin-top-left opacity-0 scale-95 animate-fade-in z-50">
                      <div className="p-1">
                        <Link href="/sign-in" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" />
                          </svg>
                          <span className="text-sm font-medium">تسجيل الدخول</span>
                        </Link>
                        <Link href="/sign-up" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 group-hover:text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                          <span className="text-sm font-medium">إنشاء حساب</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </SignedOut>
              
              <SignedIn>
                <div className="relative" ref={floatingProfileRef}>
                  <button
                    onClick={() => setFloatingProfileOpen(prev => !prev)}
                    aria-expanded={floatingProfileOpen}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700 focus:outline-none transition-all duration-300 transform hover:scale-105"
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
                      <div className="w-6 h-6 rounded-full bg-blue-800 text-white flex items-center justify-center font-semibold text-xs border-2 border-white/30">
                        {initials}
                      </div>
                    )}
                    <span className="hidden sm:inline text-xs font-medium">{displayName}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${floatingProfileOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                  
                  {floatingProfileOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-300 transform origin-top-left opacity-0 scale-95 animate-fade-in z-50">
                      <div className="p-1">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</p>
                        </div>
                        <button
                          onClick={handleFloatingManage}
                          className="w-full text-right px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between group"
                        >
                          <span className="text-sm font-medium">إدارة الحساب</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c-.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                          </svg>
                        </button>
                        <button
                          onClick={handleFloatingFavorites}
                          className="w-full text-right px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between group"
                        >
                          <span className="text-sm font-medium">مفضلاتي</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                        </button>
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                        <button
                          onClick={handleFloatingSignOut}
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
              
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-1 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707+.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-900 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </nav>
      )}
      
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
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}