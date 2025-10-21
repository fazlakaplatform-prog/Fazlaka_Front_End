"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { client, urlFor } from "@/lib/sanity";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";

// Updated Episode interface with proper Sanity image structure
interface Episode {
  _id: string;
  title: string;
  titleEn?: string;
  slug: {
    current: string;
  };
  thumbnail?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  duration?: number;
  publishedAt?: string;
  categories?: string[];
  language?: 'ar' | 'en';
}

// Updated Article interface with proper Sanity image structure
interface Article {
  _id: string;
  title: string;
  titleEn?: string;
  slug: {
    current: string;
  };
  featuredImage?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  publishedAt?: string;
  readTime?: number;
  categories?: string[];
  language?: 'ar' | 'en';
}

// Union type for favorite items
type FavoriteItem = Episode | Article;

// Helper function to determine if an item is an episode
function isEpisode(item: FavoriteItem): item is Episode {
  return (item as Episode).thumbnail !== undefined;
}

// Helper function to get the URL for a favorite item
function getItemUrl(item: FavoriteItem): string {
  if (isEpisode(item)) {
    return `/episodes/${item.slug.current}`;
  } else {
    return `/articles/${item.slug.current}`;
  }
}

// Helper function to get the image URL for a favorite item
function getItemImageUrl(item: FavoriteItem): string {
  if (isEpisode(item)) {
    return item.thumbnail ? urlFor(item.thumbnail) : "/placeholder.png";
  } else {
    return item.featuredImage ? urlFor(item.featuredImage) : "/placeholder.png";
  }
}

// Helper function to get additional info for a favorite item
function getItemInfo(item: FavoriteItem, language: 'ar' | 'en'): string {
  if (isEpisode(item)) {
    return item.duration ? `${Math.floor(item.duration / 60)} ${language === 'ar' ? 'دقيقة' : 'minutes'}` : language === 'ar' ? "حلقة" : "episode";
  } else {
    return item.readTime ? `${item.readTime} ${language === 'ar' ? 'دقيقة قراءة' : 'min read'}` : language === 'ar' ? "مقال" : "article";
  }
}

// Helper function to format date - modified to show numbers only
function formatDate(dateString?: string, language: 'ar' | 'en' = 'ar'): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  if (language === 'ar') {
    return `${day}/${month}/${year}`;
  } else {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[date.getMonth()]} ${day}, ${year}`;
  }
}

// Get unique categories from favorites
function getUniqueCategories(favorites: FavoriteItem[]): string[] {
  const categoriesSet = new Set<string>();
  
  favorites.forEach(item => {
    if (item.categories && item.categories.length > 0) {
      item.categories.forEach(cat => categoriesSet.add(cat));
    }
  });
  
  return Array.from(categoriesSet).sort();
}

// Custom Confirmation Modal Component
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  language
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string;
  language: 'ar' | 'en';
}) => {
  const texts = {
    ar: {
      confirmDelete: "تأكيد الحذف",
      deleteMessage: "هل أنت متأكد من أنك تريد حذف هذا العنصر من المفضلة؟",
      cancel: "إلغاء",
      confirm: "تأكيد الحذف"
    },
    en: {
      confirmDelete: "Confirm Delete",
      deleteMessage: "Are you sure you want to remove this item from favorites?",
      cancel: "Cancel",
      confirm: "Confirm Delete"
    }
  };
  
  const t = texts[language];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 z-10 dark:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t.confirmDelete}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-1">{t.deleteMessage}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 truncate" title={title}>{title}</p>
              
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={onConfirm}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-700 hover:to-red-800 transition-all focus:outline-none focus:ring-2 focus:ring-red-300 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function FavoritesPage() {
  const { user } = useUser();
  const { language, isRTL } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  // Respect user motion preferences
  const [reduceMotion, setReduceMotion] = useState(false);
  // Swipe to delete state
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: "episode" | "article", title: string} | null>(null);

  // Text translations based on language
  const texts = {
    ar: {
      pageTitle: "مفضلاتي",
      pageSubtitle: "كل المحتوى الذي تحبه في مكان واحد",
      savedItems: "العناصر المحفوظة",
      episodes: "حلقات",
      articles: "مقالات",
      searchPlaceholder: "ابحث في المفضلات...",
      categories: "التصنيفات",
      all: "الكل",
      episodesOnly: "الحلقات فقط",
      articlesOnly: "المقالات فقط",
      gridView: "شبكي",
      listView: "قائمة",
      allEpisodes: "جميع الحلقات",
      allArticles: "جميع المقالات",
      remove: "إزالة",
      noFavorites: "لا توجد عناصر في المفضلة",
      noMatchingFavorites: "لا توجد مفضلات تطابق البحث",
      tryDifferentKeywords: "جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية.",
      addFavorites: "أضف حلقات أو مقالات إلى المفضلة للعرض هنا.",
      exploreEpisodes: "استكشف الحلقات",
      exploreArticles: "استكشف المقالات",
      loadingFavorites: "جاري تحميل المفضلات...",
      loginRequired: "تسجيل الدخول مطلوب",
      loginMessage: "يجب تسجيل الدخول لعرض المفضلات.",
      signIn: "تسجيل الدخول",
      swipeToDelete: "اسحب العنصر لليسار أو اليمين للحذف",
      clearSearch: "مسح",
      episode: "حلقة",
      article: "مقال",
      minute: "دقيقة",
      minutes: "دقائق",
      minRead: "دقيقة قراءة",
      minReads: "دقائق قراءة"
    },
    en: {
      pageTitle: "My Favorites",
      pageSubtitle: "All your favorite content in one place",
      savedItems: "Saved Items",
      episodes: "Episodes",
      articles: "Articles",
      searchPlaceholder: "Search in favorites...",
      categories: "Categories",
      all: "All",
      episodesOnly: "Episodes Only",
      articlesOnly: "Articles Only",
      gridView: "Grid",
      listView: "List",
      allEpisodes: "All Episodes",
      allArticles: "All Articles",
      remove: "Remove",
      noFavorites: "No items in favorites",
      noMatchingFavorites: "No favorites match your search",
      tryDifferentKeywords: "Try different keywords or remove filters.",
      addFavorites: "Add episodes or articles to favorites to display here.",
      exploreEpisodes: "Explore Episodes",
      exploreArticles: "Explore Articles",
      loadingFavorites: "Loading favorites...",
      loginRequired: "Login Required",
      loginMessage: "You need to login to view your favorites.",
      signIn: "Sign In",
      swipeToDelete: "Swipe item left or right to delete",
      clearSearch: "Clear",
      episode: "episode",
      article: "article",
      minute: "minute",
      minutes: "minutes",
      minRead: "min read",
      minReads: "mins read"
    }
  };
  
  const t = texts[language];

  // Prevent horizontal scrolling on the page
  useEffect(() => {
    const preventHorizontalScroll = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      
      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (!moveEvent.touches.length) return;
        
        const touchMove = moveEvent.touches[0];
        const deltaX = touchMove.clientX - startX;
        const deltaY = touchMove.clientY - startY;
        
        // Prevent horizontal scroll if swipe is more horizontal than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          moveEvent.preventDefault();
        }
      };
      
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      
      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchstart', preventHorizontalScroll, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', preventHorizontalScroll);
    };
  }, []);

  useEffect(() => {
    // Check if mobile
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    async function fetchFavorites() {
      try {
        // Fetch episode favorites - FILTERED BY LANGUAGE
        const episodeQuery = `*[_type == "favorite" && userId == $userId && episode._ref != null]{
          episode->{
            _id,
            title,
            titleEn,
            slug,
            thumbnail{ _type, asset },
            duration,
            publishedAt,
            categories,
            language
          }
        }`;
        
        // Fetch article favorites - FILTERED BY LANGUAGE
        const articleQuery = `*[_type == "favorite" && userId == $userId && article._ref != null]{
          article->{
            _id,
            title,
            titleEn,
            slug,
            featuredImage{ _type, asset },
            publishedAt,
            readTime,
            categories,
            language
          }
        }`;
        
        const episodeFavs = await client.fetch(episodeQuery, { userId: user!.id });
        const articleFavs = await client.fetch(articleQuery, { userId: user!.id });
        
        // Extract episodes and articles
        const episodes = episodeFavs.map((fav: { episode: Episode }) => fav.episode).filter(Boolean);
        const articles = articleFavs.map((fav: { article: Article }) => fav.article).filter(Boolean);
        
        // FILTER BY CURRENT LANGUAGE - This is the key fix
        const filteredEpisodes = episodes.filter((episode: Episode) => episode.language === language);
        const filteredArticles = articles.filter((article: Article) => article.language === language);
        
        // Combine and sort by title
        const combinedFavorites = [...filteredEpisodes, ...filteredArticles].sort((a, b) => {
          const titleA = language === 'ar' ? a.title : (a.titleEn || a.title);
          const titleB = language === 'ar' ? b.title : (b.titleEn || b.title);
          return titleA.localeCompare(titleB, language === 'ar' ? 'ar' : 'en');
        });
        
        setFavorites(combinedFavorites);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFavorites();
  }, [user, language]); // Add language as dependency

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  async function handleRemove(itemId: string, contentType: "episode" | "article") {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/favorites`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user!.id, // Non-null assertion
          contentId: itemId,
          contentType,
        }),
      });

      if (response.ok) {
        setFavorites((prev) => prev.filter((item) => item._id !== itemId));
        setSwipedItemId(null); // Reset swiped item state
      } else {
        const errorData = await response.json();
        console.error("Error removing favorite:", errorData);
        alert(language === 'ar' ? "حدث خطأ أثناء إزالة العنصر من المفضلة. يرجى المحاولة مرة أخرى." : "An error occurred while removing the item from favorites. Please try again.");
      }
    } catch (err) {
      console.error("❌ Failed to remove favorite:", err);
      alert(language === 'ar' ? "حدث خطأ أثناء إزالة العنصر من المفضلة. يرجى المحاولة مرة أخرى." : "An error occurred while removing the item from favorites. Please try again.");
    }
  }

  // Handle swipe gestures for list view (swipe left OR right to delete)
  const handleDragEndList = (itemId: string, contentType: "episode" | "article", title: string, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Check if swipe was to the left OR right with enough velocity or offset
    if (Math.abs(offset.x) > 80 || Math.abs(velocity.x) > 500) {
      // Show confirmation modal before deleting
      setItemToDelete({ id: itemId, type: contentType, title });
      setShowConfirmModal(true);
    } else {
      // Reset position if not swiped far enough
      setSwipedItemId(null);
    }
  };

  // Handle confirmation modal actions
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      handleRemove(itemToDelete.id, itemToDelete.type);
      setItemToDelete(null);
      setShowConfirmModal(false);
    }
  };

  const handleCancelDelete = () => {
    setSwipedItemId(null);
    setItemToDelete(null);
    setShowConfirmModal(false);
  };

  const filteredFavorites = useMemo(() => {
    let result = favorites;
    
    // Filter by type (episodes or articles)
    if (selectedCategory === "episodes") {
      result = result.filter(isEpisode);
    } else if (selectedCategory === "articles") {
      result = result.filter(item => !isEpisode(item));
    } else if (selectedCategory !== "all") {
      // Filter by content category
      result = result.filter(item => 
        item.categories && item.categories.includes(selectedCategory)
      );
    }
    
    // Filter by search term
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter((item) => {
        const title = language === 'ar' 
          ? (item.title || "").toString().toLowerCase()
          : ((item.titleEn || item.title) || "").toString().toLowerCase();
        return title.includes(q);
      });
    }
    
    return result;
  }, [favorites, searchTerm, selectedCategory, language]);

  // Calculate statistics
  const episodeCount = favorites.filter(isEpisode).length;
  const articleCount = favorites.length - episodeCount;
  const categories = getUniqueCategories(favorites);

  // motion variants
  const heroVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      } 
    },
  };

  const statCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.5,
        type: "spring" as const,
        stiffness: 100
      } 
    },
    hover: { 
      scale: 1.05, 
      y: -5,
      transition: { 
        duration: 0.2 
      } 
    }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.995 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32 } },
    hover: { scale: 1.02, y: -4, transition: { duration: 0.16 } },
    exit: { opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.22 } },
  } as const;

  const heartVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.8,
        type: "spring" as const,
        stiffness: 100,
        damping: 10
      } 
    },
    hover: { 
      scale: 1.2, 
      transition: { 
        duration: 0.3,
        repeat: Infinity,
        repeatType: "reverse" as const,
      } 
    }
  };

  // Swipe to delete variants
  const swipeItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -100, transition: { duration: 0.3 } },
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCategoryDropdown) {
        const target = event.target as Element;
        if (!target.closest('.category-dropdown')) {
          setShowCategoryDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">{t.loadingFavorites}</p>
      </div>
    </div>
  );
  
  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 dark:shadow-[0_0_15px_rgba(99,102,241,0.5)]">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1">
          <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h3 className="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{t.loginRequired}</h3>
        <p className="mt-3 text-gray-600 dark:text-gray-300">{t.loginMessage}</p>
        <div className="mt-8">
          <Link
            href="/sign-in"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition hover:scale-105"
          >
            {t.signIn}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      {/* Enhanced Hero Section with Multiple Waves */}
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-900 text-white pt-24"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        {/* Enhanced background with more colorful elements */}
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
          {/* Larger, more colorful gradient orbs */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Additional colorful elements */}
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-25 animate-pulse"></div>
          
          {/* Multiple Animated Lines */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <motion.path 
              d="M0,100 Q150,50 300,100 T600,100" 
              stroke="url(#grad1)" 
              strokeWidth="2" 
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 2, delay: 0.5 }}
            />
            <motion.path 
              d="M0,200 Q200,150 400,200 T800,200" 
              stroke="url(#grad2)" 
              strokeWidth="2" 
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ duration: 2, delay: 0.7 }}
            />
            <motion.path 
              d="M0,150 Q180,100 360,150 T720,150" 
              stroke="url(#grad3)" 
              strokeWidth="1.5" 
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 2, delay: 0.9 }}
            />
            <motion.path 
              d="M0,250 Q220,200 440,250 T880,250" 
              stroke="url(#grad1)" 
              strokeWidth="1.5" 
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 2, delay: 1.1 }}
            />
          </svg>
          
          {/* Enhanced Favorite Icons with different colors and animations */}
          <motion.div 
            className="absolute top-20 left-10"
            variants={heartVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-300 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <motion.div 
                className="absolute inset-0 rounded-full bg-blue-400 opacity-30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="absolute bottom-20 right-10"
            variants={heartVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-300 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <motion.div 
                className="absolute inset-0 rounded-full bg-purple-400 opacity-30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="absolute top-1/3 right-1/4"
            variants={heartVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-300 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <motion.div 
                className="absolute inset-0 rounded-full bg-red-400 opacity-30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="absolute top-1/4 left-1/3"
            variants={heartVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6 }}
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-300 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <motion.div 
                className="absolute inset-0 rounded-full bg-blue-400 opacity-30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="absolute bottom-1/4 right-1/3"
            variants={heartVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.8 }}
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-purple-300 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <motion.div 
                className="absolute inset-0 rounded-full bg-purple-400 opacity-30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
              />
            </div>
          </motion.div>
          
          {/* Additional decorative elements */}
          <motion.div 
            className="absolute top-1/2 left-1/4"
            animate={{ 
              y: [0, -20, 0], 
              rotate: [0, 5, 0] 
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
          >
            <div className="w-4 h-4 bg-yellow-300 rounded-full opacity-60 blur-sm"></div>
          </motion.div>
          
          <motion.div 
            className="absolute bottom-1/3 right-1/4"
            animate={{ 
              y: [0, -15, 0], 
              rotate: [0, -5, 0] 
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              repeatType: "reverse",
              delay: 1
            }}
          >
            <div className="w-3 h-3 bg-pink-300 rounded-full opacity-60 blur-sm"></div>
          </motion.div>
          
          <motion.div 
            className="absolute top-1/4 right-1/2"
            animate={{ 
              y: [0, -10, 0], 
              rotate: [0, 3, 0] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatType: "reverse",
              delay: 0.5
            }}
          >
            <div className="w-5 h-5 bg-green-300 rounded-full opacity-50 blur-sm"></div>
          </motion.div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <motion.div 
              className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-6 shadow-lg"
              variants={heroVariants}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </motion.div>
            <motion.h1 
              className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100"
              variants={heroVariants}
            >
              {t.pageTitle}
            </motion.h1>
            <motion.p 
              className="mt-6 max-w-2xl mx-auto text-xl text-blue-100"
              variants={heroVariants}
            >
              {t.pageSubtitle}
            </motion.p>
          </div>

          {/* Enhanced Stats Cards with colorful shadows */}
          <motion.div 
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl mx-auto"
            variants={heroVariants}
          >
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border border-white/20 transform transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 dark:hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
              variants={statCardVariants}
              whileHover="hover"
            >
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-100 to-white bg-clip-text text-transparent">{favorites.length}</div>
              <div className="text-blue-100">{t.savedItems}</div>
              <div className="mt-3 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-transparent opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
            
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border border-white/20 transform transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 dark:hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
              variants={statCardVariants}
              whileHover="hover"
            >
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-100 to-white bg-clip-text text-transparent">{episodeCount}</div>
              <div className="text-blue-100">{t.episodes}</div>
              <div className="mt-3 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-transparent opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
            
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border border-white/20 transform transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/30 dark:hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
              variants={statCardVariants}
              whileHover="hover"
            >
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-100 to-white bg-clip-text text-transparent">{articleCount}</div>
              <div className="text-blue-100">{t.articles}</div>
              <div className="mt-3 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400/20 to-transparent opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative">
        {/* Search and Filters Section - Removed Glow Effects */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 mb-8 border border-gray-100 dark:border-gray-700 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="relative max-w-2xl">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 outline-none transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl"
                />
                {/* Clear button on the left */}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition-all duration-200 hover:scale-110"
                    aria-label={t.clearSearch}
                    title={t.clearSearch}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {/* Search icon on the right */}
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center lg:justify-end">
              {/* Category Dropdown */}
              <div className="relative category-dropdown">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:from-blue-700 hover:to-purple-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>{t.categories}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showCategoryDropdown && (
                  <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden`}>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setShowCategoryDropdown(false);
                        }}
                        className={`flex items-center w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-3 text-sm transition-colors ${
                          selectedCategory === "all"
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        {t.all}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCategory("episodes");
                          setShowCategoryDropdown(false);
                        }}
                        className={`flex items-center w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-3 text-sm transition-colors ${
                          selectedCategory === "episodes"
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {t.episodesOnly}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCategory("articles");
                          setShowCategoryDropdown(false);
                        }}
                        className={`flex items-center w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-3 text-sm transition-colors ${
                          selectedCategory === "articles"
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4-H7V8z" />
                        </svg>
                        {t.articlesOnly}
                      </button>
                      
                      {categories.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>
                      )}
                      
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setShowCategoryDropdown(false);
                          }}
                          className={`flex items-center w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-3 text-sm transition-colors ${
                            selectedCategory === category
                              ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10M7 17h10" />
                          </svg>
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="inline-flex items-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition-all duration-200 ${
                    viewMode === "grid" 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  aria-pressed={viewMode === "grid"}
                  title={t.gridView}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" />
                  </svg>
                  <span className="hidden sm:inline">{t.gridView}</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition-all duration-200 ${
                    viewMode === "list" 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  aria-pressed={viewMode === "list"}
                  title={t.listView}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="hidden sm:inline">{t.listView}</span>
                </button>
              </div>
              
              <Link
                href="/episodes"
                className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                title={t.allEpisodes}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRTL ? 'ml-1' : 'mr-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.allEpisodes}
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                title={t.allArticles}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRTL ? 'ml-1' : 'mr-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4-H7V8z" />
                </svg>
                {t.allArticles}
              </Link>
            </div>
          </div>
          
          {/* Swipe hint for mobile - only show in list view */}
          {isMobile && viewMode === "list" && (
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRTL ? 'mr-1' : 'ml-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              {t.swipeToDelete}
            </div>
          )}
        </motion.div>
        
        <div className={`${fadeIn ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}>
          {filteredFavorites.length === 0 ? (
            <motion.div 
              className="text-center p-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-2xl max-w-2xl mx-auto dark:shadow-[0_0_30px_rgba(99,102,241,0.3)]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-1">
                <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-6 text-xl font-medium text-gray-900 dark:text-gray-100">
                {searchTerm || selectedCategory !== "all" ? t.noMatchingFavorites : t.noFavorites}
              </div>
              <div className="mt-2 text-gray-500 dark:text-gray-400">
                {searchTerm || selectedCategory !== "all" 
                  ? t.tryDifferentKeywords
                  : t.addFavorites}
              </div>
              {!searchTerm && selectedCategory === "all" && (
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/episodes"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition hover:scale-105"
                  >
                    {t.exploreEpisodes}
                  </Link>
                  <Link
                    href="/articles"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-full shadow-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition hover:scale-105"
                  >
                    {t.exploreArticles}
                  </Link>
                </div>
              )}
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" layout variants={listVariants} initial="hidden" animate="visible">
              <AnimatePresence initial={false}>
                {filteredFavorites.map((item) => {
                  const itemUrl = getItemUrl(item);
                  const thumbnailUrl = getItemImageUrl(item);
                  const isEpisodeItem = isEpisode(item);
                  const itemInfo = getItemInfo(item, language);
                  const itemDate = formatDate(item.publishedAt, language);
                  const itemTitle = language === 'ar' ? item.title : (item.titleEn || item.title);
                  
                  return (
                    <motion.div
                      key={item._id}
                      layout
                      initial={reduceMotion ? undefined : "hidden"}
                      animate={reduceMotion ? undefined : "visible"}
                      whileHover={reduceMotion ? undefined : "hover"}
                      exit={reduceMotion ? undefined : "exit"}
                      variants={cardVariants}
                      className="relative group"
                    >
                      {/* Enhanced Card with Glassmorphism and Glow Effects */}
                      <motion.div
                        className="relative overflow-hidden rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col group dark:shadow-[0_0_25px_rgba(99,102,241,0.15)] hover:dark:shadow-[0_0_35px_rgba(99,102,241,0.25)]"
                        whileHover={{ 
                          y: -8,
                          scale: 1.02,
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 20 
                        }}
                      >
                        {/* Shimmer/Gloss Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"></div>
                        
                        {/* Glow Effect on Hover */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        
                        <Link href={itemUrl} className="group block flex-1">
                          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden rounded-t-3xl">
                            <Image 
                              src={thumbnailUrl} 
                              alt={itemTitle} 
                              fill
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
                              <motion.div 
                                className="rounded-full bg-black/60 backdrop-blur-sm p-4"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                              >
                                {/* Different icon for articles vs episodes */}
                                {isEpisodeItem ? (
                                  <svg viewBox="0 0 24 24" className="h-10 w-10 text-white fill-current">
                                    <path d="M5 3v18l15-9L5 3z" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" className="h-10 w-10 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                  </svg>
                                )}
                              </motion.div>
                            </div>
                            
                            {/* Enhanced Type Badge */}
                            <div className="absolute top-4 right-4">
                              <motion.div 
                                className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg ${
                                  isEpisodeItem 
                                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-500/50" 
                                    : "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-500/50"
                                }`}
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  {isEpisodeItem ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4-H7V8z" />
                                  )}
                                </svg>
                                {isEpisodeItem ? t.episode : t.article}
                              </motion.div>
                            </div>
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                              {itemTitle}
                            </h3>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span>{itemInfo}</span>
                              </div>
                              
                              {itemDate && (
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <span>{itemDate}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Categories */}
                            {item.categories && item.categories.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {item.categories.slice(0, 2).map((category) => (
                                  <motion.span 
                                    key={category} 
                                    className="inline-block px-3 py-1.5 text-xs bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    {category}
                                  </motion.span>
                                ))}
                                {item.categories.length > 2 && (
                                  <span className="inline-block px-3 py-1.5 text-xs bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600">
                                    +{item.categories.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="mt-auto px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"></div>
                          <div className="flex items-center gap-2">
                            {/* Enhanced Delete Button */}
                            <motion.button
                              onClick={() => {
                                setItemToDelete({ id: item._id, type: isEpisodeItem ? "episode" : "article", title: itemTitle });
                                setShowConfirmModal(true);
                              }}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 text-red-600 dark:text-red-200 border border-red-200 dark:border-red-800/30 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-900/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-300 shadow-md hover:shadow-lg"
                              aria-label={language === 'ar' ? "حذف من المفضلات" : "Remove from favorites"}
                              title={t.remove}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                              <span className="text-sm font-medium">{t.remove}</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div className="space-y-4 overflow-x-hidden" layout variants={listVariants} initial="hidden" animate="visible">
              <AnimatePresence initial={false}>
                {filteredFavorites.map((item) => {
                  const itemUrl = getItemUrl(item);
                  const thumbnailUrl = getItemImageUrl(item);
                  const isEpisodeItem = isEpisode(item);
                  const itemInfo = getItemInfo(item, language);
                  const itemDate = formatDate(item.publishedAt, language);
                  const itemTitle = language === 'ar' ? item.title : (item.titleEn || item.title);
                  const isSwiped = swipedItemId === item._id;
                  
                  return (
                    <motion.div
                      key={item._id}
                      layout
                      initial={reduceMotion ? undefined : "hidden"}
                      animate={reduceMotion ? undefined : "visible"}
                      whileHover={reduceMotion ? undefined : "hover"}
                      exit={reduceMotion ? undefined : "exit"}
                      variants={swipeItemVariants}
                      className="relative group"
                    >
                      {/* Delete background that appears when swiping left OR right */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl flex items-center justify-center z-0 shadow-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isSwiped ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-white font-bold text-lg">{t.remove}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                      </motion.div>
                      
                      {/* Enhanced List Item */}
                      <motion.div
                        className="relative flex gap-6 items-center border border-gray-200/50 dark:border-gray-700/50 rounded-3xl overflow-hidden p-2 hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl group dark:shadow-[0_0_25px_rgba(99,102,241,0.15)] hover:dark:shadow-[0_0_35px_rgba(99,102,241,0.25)] z-10"
                        drag={isMobile ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.1}
                        dragMomentum={false}
                        dragPropagation={false}
                        onDragStart={() => setSwipedItemId(item._id)}
                        onDragEnd={(_, info) => handleDragEndList(item._id, isEpisodeItem ? "episode" : "article", itemTitle, info)}
                        onDragTransitionEnd={() => {
                          if (!isSwiped) {
                            setSwipedItemId(null);
                          }
                        }}
                        animate={{ x: isSwiped ? 80 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        whileHover={{ 
                          x: isSwiped ? 80 : 0,
                          scale: isSwiped ? 1 : 1.01,
                        }}
                      >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none rounded-3xl"></div>
                        
                        <Link href={itemUrl} className="flex items-center gap-6 flex-1 group">
                          <div className="relative w-48 h-32 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden shadow-lg">
                            <Image 
                              src={thumbnailUrl} 
                              alt={itemTitle} 
                              fill
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
                              <motion.div 
                                className="rounded-full bg-black/60 backdrop-blur-sm p-3"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                              >
                                {/* Different icon for articles vs episodes */}
                                {isEpisodeItem ? (
                                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-white fill-current">
                                    <path d="M5 3v18l15-9L5 3z" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                  </svg>
                                )}
                              </motion.div>
                            </div>
                            
                            {/* Enhanced Type Badge */}
                            <div className="absolute top-3 right-3">
                              <motion.div 
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg ${
                                  isEpisodeItem 
                                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-500/50" 
                                    : "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-500/50"
                                }`}
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  {isEpisodeItem ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4-H7V8z" />
                                  )}
                                </svg>
                                {isEpisodeItem ? t.episode : t.article}
                              </motion.div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span>{itemInfo}</span>
                              </div>
                              
                              {itemDate && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <span>{itemDate}</span>
                                </div>
                              )}
                            </div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 line-clamp-2 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                              {itemTitle}
                            </h3>
                            
                            {/* Categories */}
                            {item.categories && item.categories.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {item.categories.slice(0, 3).map((category) => (
                                  <motion.span 
                                    key={category} 
                                    className="inline-block px-3 py-1.5 text-xs bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    {category}
                                  </motion.span>
                                ))}
                                {item.categories.length > 3 && (
                                  <span className="inline-block px-3 py-1.5 text-xs bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600">
                                    +{item.categories.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-shrink-0 flex items-center gap-3 px-4">
                          <motion.button
                            onClick={() => {
                              setItemToDelete({ id: item._id, type: isEpisodeItem ? "episode" : "article", title: itemTitle });
                              setShowConfirmModal(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 text-red-600 dark:text-red-200 border border-red-200 dark:border-red-800/30 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-900/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-300 shadow-md hover:shadow-lg"
                            aria-label={language === 'ar' ? "حذف من المفضلات" : "Remove from favorites"}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                            <span className="hidden sm:inline text-sm font-medium">{t.remove}</span>
                          </motion.button>
                        </div>
                        
                        {/* Swipe hint indicator for mobile */}
                        {isMobile && (
                          <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 bottom-0 w-10 flex items-center justify-center`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showConfirmModal} 
        onClose={handleCancelDelete} 
        onConfirm={handleConfirmDelete}
        title={itemToDelete?.title || ""}
        language={language}
      />
    </div>
  );
}