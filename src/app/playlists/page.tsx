"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchPlaylists, Playlist } from "@/lib/sanity";
import { useLanguage } from "@/components/LanguageProvider";
import { useSession } from "next-auth/react";
import { 
  FaPlay, 
  FaList, 
  FaTh, 
  FaSearch, 
  FaTimes, 
  FaStar,
  FaHeart,
  FaFilter,
  FaUser,
  FaSignInAlt,
  FaArrowRight
} from "react-icons/fa";
import { client, urlFor } from "@/lib/sanity";

// تعريف نوع موسع للتعامل مع الصور المختلفة
type PlaylistWithImage = Playlist & {
  imageUrl?: string;
  titleEn?: string;
  descriptionEn?: string;
  language?: 'ar' | 'en';
};

// تعريف أنواع المفضلة من Sanity
interface SanityEpisode {
  _id: string;
  title: string;
  titleEn?: string;
  slug: {
    current: string;
  };
  thumbnailUrl?: string;
  duration?: number;
  publishedAt?: string;
  categories?: string[];
  language?: 'ar' | 'en';
}

interface SanityArticle {
  _id: string;
  title: string;
  titleEn?: string;
  slug: {
    current: string;
  };
  featuredImageUrl?: string;
  publishedAt?: string;
  readTime?: number;
  categories?: string[];
  language?: 'ar' | 'en';
}

// نوع موحد للعناصر المفضلة
type FavoriteItem = SanityEpisode | SanityArticle;

// Helper function to determine if an item is an episode
function isEpisode(item: FavoriteItem): item is SanityEpisode {
  return (item as SanityEpisode).thumbnailUrl !== undefined;
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
    return item.thumbnailUrl || "/placeholder.png";
  } else {
    return item.featuredImageUrl || "/placeholder.png";
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

// كائن الترجمات
const translations = {
  ar: {
    loading: "جاري التحميل...",
    noPlaylists: "لا توجد قوائم حاليًا",
    noResults: "لا توجد نتائج مطابقة للبحث",
    clearSearch: "مسح البحث",
    playlists: "قوائم التشغيل",
    discover: "اكتشف",
    collections: "مجموعاتنا",
    description: "استكشف مجموعتنا المتنوعة من قوائم التشغيل المنظمة التي تجمع بين الحلقات والمقالات لتجربة تعليمية شاملة ومتكاملة.",
    searchPlaceholder: "بحث عن قائمة...",
    searchInPlaylists: "ابحث في قوائم التشغيل حسب العنوان",
    gridView: "شبكي",
    listView: "قائمة",
    items: "عنصر",
    episode: "حلقة",
    episodes: "حلقات",
    article: "مقال",
    articles: "مقالات",
    myFavorites: "قائمتي المفضلة",
    favoriteDescription: "جميع المحتوى الذي تفضله في مكان واحد",
    totalEpisodes: " الحلقات",
    totalArticles: " المقالات",
    viewAll: "عرض الكل",
    totalPlaylists: "إجمالي قوائم التشغيل",
    filterByType: "تصفية حسب النوع",
    allTypes: "جميع الأنواع",
    withEpisodes: "تحتوي على حلقات",
    withArticles: "تحتوي على مقالات",
    withBoth: "تحتوي على الاثنين",
    loginToViewFavorites: "سجل دخولك لعرض المفضلة",
    loginPrompt: "سجل دخولك لحفظ المحتوى المفضل لديك والوصول إليه بسهولة",
    signIn: "تسجيل الدخول",
    noFavoritesYet: "لا توجد عناصر في المفضلة بعد",
    startAddingFavorites: "ابدأ بإضافة المحتوى الذي يعجبك إلى المفضلة",
    recentItems: "أحدث العناصر",
    savedItems: "العناصر المحفوظة",
    exploreEpisodes: "استكشف الحلقات",
    exploreArticles: "استكشف المقالات",
    loadingFavorites: "جاري تحميل المفضلات...",
    loginRequired: "تسجيل الدخول مطلوب",
    loginMessage: "يجب تسجيل الدخول لعرض المفضلات.",
    swipeToDelete: "اسحب العنصر لليسار أو اليمين للحذف",
    minute: "دقيقة",
    minutes: "دقائق",
    minRead: "دقيقة قراءة",
    minReads: "دقائق قراءة",
    filter: "فلتر",
    close: "إغلاق",
    remove: "إزالة",
    noMatchingFavorites: "لا توجد مفضلات تطابق البحث",
    tryDifferentKeywords: "جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية.",
    addFavorites: "أضف حلقات أو مقالات إلى المفضلة للعرض هنا.",
    confirmDelete: "تأكيد الحذف",
    deleteMessage: "هل أنت متأكد من أنك تريد حذف هذا العنصر من المفضلة؟",
    cancel: "إلغاء",
    confirm: "تأكيد الحذف",
    viewMyFavorites: "عرض قائمتي المفضلة",
    yourFavorites: "مفضلاتك الشخصية"
  },
  en: {
    loading: "Loading...",
    noPlaylists: "No playlists available",
    noResults: "No matching results",
    clearSearch: "Clear Search",
    playlists: "Playlists",
    discover: "Discover",
    collections: "Our Collections",
    description: "Explore our diverse collection of organized playlists that combine episodes and articles for a comprehensive and integrated educational experience.",
    searchPlaceholder: "Search for a playlist...",
    searchInPlaylists: "Search playlists by title",
    gridView: "Grid",
    listView: "List",
    items: "item",
    episode: "episode",
    episodes: "episodes",
    article: "article",
    articles: "articles",
    myFavorites: "My Favorites",
    favoriteDescription: "All your favorite content in one place",
    totalEpisodes: "Episodes",
    totalArticles: "Articles",
    viewAll: "View All",
    totalPlaylists: "Total Playlists",
    filterByType: "Filter by type",
    allTypes: "All Types",
    withEpisodes: "With Episodes",
    withArticles: "With Articles",
    withBoth: "With Both",
    loginToViewFavorites: "Login to view your favorites",
    loginPrompt: "Sign in to save your favorite content and access it easily",
    signIn: "Sign In",
    noFavoritesYet: "No items in favorites yet",
    startAddingFavorites: "Start adding content you like to your favorites",
    recentItems: "Recent Items",
    savedItems: "Saved Items",
    exploreEpisodes: "Explore Episodes",
    exploreArticles: "Explore Articles",
    loadingFavorites: "Loading favorites...",
    loginRequired: "Login Required",
    loginMessage: "You need to login to view your favorites.",
    swipeToDelete: "Swipe item left or right to delete",
    minute: "minute",
    minutes: "minutes",
    minRead: "min read",
    minReads: "mins read",
    filter: "Filter",
    close: "Close",
    remove: "Remove",
    noMatchingFavorites: "No favorites match your search",
    tryDifferentKeywords: "Try different keywords or remove filters.",
    addFavorites: "Add episodes or articles to favorites to display here.",
    confirmDelete: "Confirm Delete",
    deleteMessage: "Are you sure you want to remove this item from favorites?",
    cancel: "Cancel",
    confirm: "Confirm Delete",
    viewMyFavorites: "View My Favorites",
    yourFavorites: "Your Personal Favorites"
  }
};

const PlaylistsPage = () => {
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  
  // استخدام هوك NextAuth الصحيح للحصول على بيانات المستخدم
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";
  const user = session?.user;
  const isLoaded = status !== "loading";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [heroAnimation, setHeroAnimation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [favoritesData, setFavoritesData] = useState({
    episodes: 0,
    articles: 0,
    recentItems: [] as FavoriteItem[]
  });
  const [fetchError, setFetchError] = useState(false);
  
  useEffect(() => {
    async function fetchPlaylistsData() {
      try {
        const data = await fetchPlaylists(language);
        console.log("Fetched playlists:", data);
        setPlaylists(data);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlaylistsData();
  }, [language]);

  // جلب بيانات المفضلة من Sanity CMS
  useEffect(() => {
    async function fetchFavoritesData() {
      try {
        // إذا لم يكن المستخدم مسجل دخول، لا نحاول جلب البيانات
        if (!isSignedIn || !user?.email) {
          setFavoritesData({
            episodes: 0,
            articles: 0,
            recentItems: []
          });
          return;
        }

        console.log("Fetching favorites from Sanity for user:", user.email);

        // جلب الحلقات المفضلة من Sanity
        const episodesQuery = `*[_type == "favorite" && userId == $userId && episode._ref != null]{
          episode->{
            _id,
            title,
            titleEn,
            slug,
            duration,
            publishedAt,
            categories,
            language,
            thumbnailUrl
          }
        }`;
        
        // جلب المقالات المفضلة من Sanity
        const articlesQuery = `*[_type == "favorite" && userId == $userId && article._ref != null]{
          article->{
            _id,
            title,
            titleEn,
            slug,
            readTime,
            publishedAt,
            categories,
            language,
            featuredImageUrl
          }
        }`;
        
        const episodesData = await client.fetch(episodesQuery, { userId: user.email });
        const articlesData = await client.fetch(articlesQuery, { userId: user.email });
        
        console.log("Episodes data:", episodesData);
        console.log("Articles data:", articlesData);
        
        const episodes = episodesData.map((fav: { episode?: SanityEpisode }) => fav.episode).filter(Boolean) as SanityEpisode[];
        const articles = articlesData.map((fav: { article?: SanityArticle }) => fav.article).filter(Boolean) as SanityArticle[];
        
        // فلترة حسب اللغة الحالية
        const filteredEpisodes = episodes.filter((ep: SanityEpisode) => ep.language === language);
        const filteredArticles = articles.filter((ar: SanityArticle) => ar.language === language);
        
        // جلب أحدث العناصر مع ترتيب حسب تاريخ النشر
        const allItems = [...filteredEpisodes, ...filteredArticles]
          .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
          .slice(0, 3);
        
        setFavoritesData({
          episodes: filteredEpisodes.length,
          articles: filteredArticles.length,
          recentItems: allItems
        });
      } catch (error) {
        console.error("Error fetching favorites data:", error);
        setFetchError(true);
        setFavoritesData({
          episodes: 0,
          articles: 0,
          recentItems: []
        });
      }
    }
    
    // انتظر حتى يتم تحميل حالة المستخدم من NextAuth
    if (isLoaded && !loading) {
      fetchFavoritesData();
    }
  }, [loading, isLoaded, isSignedIn, user, language]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    // بدء أنيميشن الهيرو بعد تحميل الصفحة
    const timer = setTimeout(() => setHeroAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // التحقق مما إذا كانت المفضلة يجب أن تظهر في نتائج البحث
  const shouldShowFavoritesInSearch = () => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const favoritesTitle = language === 'ar' ? 'مفضلاتي' : 'my favorites';
    
    // التحقق من عنوان المفضلة
    if (favoritesTitle.includes(searchLower)) return true;
    
    // التحقق من العناصر في المفضلة
    return favoritesData.recentItems.some(item => {
      const title = language === 'ar' ? item.title : (item.titleEn || item.title);
      return title && title.toLowerCase().includes(searchLower);
    });
  };

  const filteredPlaylists = useMemo(() => {
    let result = playlists.filter(
      (playlist) => {
        const playlistWithImage = playlist as PlaylistWithImage;
        const title = language === 'ar' 
          ? (playlistWithImage.title || "")
          : (playlistWithImage.titleEn || playlistWithImage.title || "");
        
        return title
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      }
    );
    
    // تطبيق فلتر النوع إذا تم تحديده
    if (filterType) {
      result = result.filter((playlist) => {
        const playlistWithImage = playlist as PlaylistWithImage;
        const episodesCount = playlistWithImage.episodes?.length || 0;
        const articlesCount = playlistWithImage.articles?.length || 0;
        
        if (filterType === 'episodes') return episodesCount > 0 && articlesCount === 0;
        if (filterType === 'articles') return articlesCount > 0 && episodesCount === 0;
        if (filterType === 'both') return episodesCount > 0 && articlesCount > 0;
        
        return true; // 'all'
      });
    }
    
    return result;
  }, [playlists, searchTerm, language, filterType]);

  // حساب العدد الإجمالي لقوائم التشغيل (بما في ذلك المفضلة)
  const totalPlaylistsCount = shouldShowFavoritesInSearch() ? filteredPlaylists.length + 1 : filteredPlaylists.length;
  const originalTotalCount = playlists.length + 1; // +1 للمفضلة

  // عرض حالة التحميل حتى يتم تحميل بيانات المستخدم من NextAuth
  if (loading || !isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="text-center">
          <div className="inline-block animate-bounce bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mb-4">
            <FaList className="text-white text-3xl" />
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <FaList className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{t.noPlaylists}</p>
        </div>
      </div>
    );
  }

  // دالة للحصول على رابط الصورة من كائن Playlist
  const getImageUrl = (playlist: Playlist): string | null => {
    const playlistWithImage = playlist as PlaylistWithImage;
    
    if (playlistWithImage.imageUrl) return playlistWithImage.imageUrl;
    
    return null;
  };

  // Hero Section Component
  const HeroSection = () => {
    return (
      <div className={`relative mb-8 sm:mb-12 overflow-hidden rounded-3xl transition-all duration-1000 ${heroAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* الخلفية المتدرجة */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950"></div>
        
        {/* العناصر الزخرفية */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {/* دوائر زخرفية */}
          <div className="absolute -top-40 -right-40 w-64 h-64 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
          
          {/* شبكة زخرفية */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
          
          {/* أيقونات المواد الدراسية في الخلفية */}
          <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
            <FaList className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
          <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
            <FaPlay className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
            <FaStar className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
        </div>
        
        {/* المحتوى الرئيسي */}
        <div className="relative z-10 pt-12 sm:pt-16 pb-10 sm:pb-12 md:pb-16 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-center">
          <div className="w-full text-center mb-8 md:mb-0">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
              <span className="text-white font-medium flex items-center text-sm sm:text-base">
                <FaStar className="text-yellow-300 mr-2 animate-pulse" />
                {t.playlists}
                <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs sm:text-sm">
                  {originalTotalCount}
                </span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              {t.discover} <span className="text-yellow-300">{t.collections}</span> {language === 'ar' ? 'التعليمية' : 'Educational'}
            </h1>
            <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
              {t.description}
            </p>
          </div>
          
          {/* أيقونات المواد الدراسية في الأسفل */}
          <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 flex-wrap">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
              <FaList className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
              <FaPlay className="text-yellow-300 text-lg sm:text-xl" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
              <FaStar className="text-yellow-300 text-lg sm:text-xl" />
            </div>
          </div>
        </div>
        
        {/* تأثيرات حركية */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
      </div>
    );
  };

  // قائمة المفضلة الثابتة - كارت بسيط وجذاب
  const FavoritesPlaylist = () => {
    // إذا كان هناك خطأ في جلب البيانات
    if (fetchError) {
      return (
        <div className="group block border-2 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-[1.03] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900/30 dark:via-gray-800/30 dark:to-gray-700/30 border-gray-300 dark:border-gray-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-300/50 relative">
          <div className="relative p-6 flex flex-col items-center justify-center h-full min-h-[250px] z-10">
            <div className="relative mb-4">
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-600">
                <FaHeart className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t.myFavorites}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              {language === 'ar' ? 'حدث خطأ في تحميل المفضلات' : 'Error loading favorites'}
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        </div>
      );
    }

    // إذا لم يكن المستخدم مسجل دخول، عرض بطاقة تسجيل الدخول
    if (!isSignedIn) {
      return (
        <div className="group block border-2 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-[1.03] bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900/30 dark:via-blue-900/30 dark:to-cyan-900/30 border-indigo-300 dark:border-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/50 relative">
          {/* خلفية متحركة متعددة الطبقات */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/10 dark:from-indigo-500/20 dark:via-blue-500/20 dark:to-cyan-500/20 rounded-2xl"></div>
          
          {/* تأثيرات الضوء المتحركة */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>
          
          {/* محتوى البطاقة */}
          <div className="relative p-6 flex flex-col items-center justify-center h-full min-h-[250px] z-10">
            {/* أيقونة المستخدم مع القلب */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg border-2 border-indigo-200 dark:border-indigo-700">
                <div className="relative">
                  <FaUser className="h-8 w-8 text-indigo-500" />
                  <FaHeart className="h-4 w-4 text-red-500 absolute -bottom-1 -right-1" />
                </div>
              </div>
            </div>
            
            {/* النصوص */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t.loginToViewFavorites}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              {t.loginPrompt}
            </p>
            
            {/* زر تسجيل الدخول */}
            <Link
              href="/api/auth/signin"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 z-20 relative"
            >
              <FaSignInAlt className="mr-2" />
              {t.signIn}
            </Link>
          </div>
          
          {/* تأثير التوهج عند التمرير */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl pointer-events-none"></div>
        </div>
      );
    }

    // كارت بسيط وجذاب للمستخدم المسجل دخول
    return (
      <Link
        href="/favorites"
        className="group block border-2 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-[1.03] bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-rose-900/30 dark:via-pink-900/30 dark:to-purple-900/30 border-rose-300 dark:border-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/50 relative"
      >
        {/* خلفية متحركة متعددة الطبقات */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-purple-500/10 dark:from-rose-500/20 dark:via-pink-500/20 dark:to-purple-500/20 rounded-2xl"></div>
        
        {/* تأثيرات الضوء المتحركة */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-rose-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* محتوى البطاقة */}
        <div className="relative p-6 z-10 flex flex-col items-center justify-center h-full min-h-[280px]">
          {/* صورة المستخدم الشخصية مع القلب */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full blur-xl animate-pulse"></div>
            <div className="relative">
              {/* صورة المستخدم */}
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center">
                    <FaUser className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              {/* أيقونة القلب */}
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border-2 border-rose-200 dark:border-rose-700">
                <FaHeart className="h-5 w-5 text-rose-500" />
              </div>
            </div>
          </div>
          
          {/* العنوان الرئيسي */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
            {t.yourFavorites}
          </h2>
          
          {/* اسم المستخدم */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            {user?.name || (language === 'ar' ? 'المستخدم' : 'User')}
          </p>
          
          {/* زر عرض المفضلة */}
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full hover:from-rose-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group">
            <span className="font-medium">{t.viewMyFavorites}</span>
            <FaArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
        
        {/* تأثير التوهج عند التمرير */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl pointer-events-none"></div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Hero Section */}
        <HeroSection />
        
        {/* رأس الصفحة */}
        <div className="flex flex-col gap-4 mb-6">
          {/* شريط البحث والفلاتر */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-sm px-3 py-2 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-200">
              <FaSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                aria-label={t.searchPlaceholder}
                className="bg-transparent outline-none flex-grow text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 py-1"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="flex items-center justify-center rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  aria-label={t.clearSearch}
                  title={t.clearSearch}
                >
                  <FaTimes className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                </button>
              ) : null}
            </div>
            
            {/* أزرار التحكم */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                {/* أزرار تغيير العرض */}
                <div className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center justify-center p-2 transition ${
                      viewMode === "grid"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    aria-pressed={viewMode === "grid"}
                    title={t.gridView}
                  >
                    <FaTh className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center justify-center p-2 transition ${
                      viewMode === "list"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    aria-pressed={viewMode === "list"}
                    title={t.listView}
                  >
                    <FaList className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                  </button>
                </div>
                
                {/* زر الفلاتر */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-md text-sm transition flex items-center justify-center shadow-md ${
                    showFilters 
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white" 
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <FaFilter className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{t.filterByType}</span>
                </button>
              </div>
            </div>
            
            {/* فلتر الأنواع */}
            {showFilters && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterType(null)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filterType === null
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {t.allTypes}
                  </button>
                  <button
                    onClick={() => setFilterType('episodes')}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filterType === 'episodes'
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {t.withEpisodes}
                  </button>
                  <button
                    onClick={() => setFilterType('articles')}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filterType === 'articles'
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {t.withArticles}
                  </button>
                  <button
                    onClick={() => setFilterType('both')}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filterType === 'both'
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {t.withBoth}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* عدد النتائج */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <FaList className="ml-2" />
              {totalPlaylistsCount} {language === 'ar' ? 'قائمة تشغيل' : 'playlists'}
            </div>
            {searchTerm && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar' 
                  ? `عرض ${totalPlaylistsCount} من أصل ${originalTotalCount} قائمة`
                  : `Showing ${totalPlaylistsCount} of ${originalTotalCount} playlists`
                }
              </div>
            )}
          </div>
        </div>
        
        {/* محتوى القوائم مع الرسوم المتحركة */}
        <div className={`${fadeIn ? "opacity-100" : "opacity-0"} transition-opacity duration-500`} style={{ minHeight: "200px" }}>
          {totalPlaylistsCount === 0 ? (
            <div className="text-center mt-10 py-12 rounded-3xl shadow-lg">
              <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <FaSearch className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t.noResults}
              </p>
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full hover:opacity-90 transition-all duration-300 transform hover:scale-105"
              >
                {t.clearSearch}
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* قائمة المفضلة الثابتة - تظهر دائماً */}
              <FavoritesPlaylist />
              
              {filteredPlaylists.map((playlist, index) => {
                const playlistWithImage = playlist as PlaylistWithImage;
                const imageUrl = getImageUrl(playlist);
                // حساب عدد الحلقات والمقالات
                const episodesCount = playlistWithImage.episodes?.length || 0;
                const articlesCount = playlistWithImage.articles?.length || 0;
                const totalItems = episodesCount + articlesCount;
                // الحصول على العنوان المناسب حسب اللغة
                const title = language === 'ar' 
                  ? (playlistWithImage.title || "")
                  : (playlistWithImage.titleEn || playlistWithImage.title || "");
                
                return (
                  <Link
                    key={playlist._id || playlist.slug?.current}
                    href={`/playlists/${playlist.slug?.current}`}
                    className="group block border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-700 transform hover:scale-[1.02] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:shadow-blue-900/20 dark:hover:shadow-blue-900/30"
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
                  >
                    {imageUrl && (
                      <div className="w-full h-48 relative overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={title}
                          fill
                          className="object-cover bg-gray-100 dark:bg-gray-700 transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {/* تأثير التدرج على الصورة */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      </div>
                    )}
                    <div className="p-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{title}</h2>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <FaList className="h-4 w-4" />
                        <span>{totalItems} {t.items}</span>
                        {episodesCount > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full animate-pulse">
                            {episodesCount} {episodesCount === 1 ? t.episode : t.episodes}
                          </span>
                        )}
                        {articlesCount > 0 && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full animate-pulse">
                            {articlesCount} {articlesCount === 1 ? t.article : t.articles}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* قائمة المفضلة الثابتة في وضع القائمة - تظهر دائماً */}
              <FavoritesPlaylist />
              
              {filteredPlaylists.map((playlist, index) => {
                const playlistWithImage = playlist as PlaylistWithImage;
                const imageUrl = getImageUrl(playlist);
                // حساب عدد الحلقات والمقالات
                const episodesCount = playlistWithImage.episodes?.length || 0;
                const articlesCount = playlistWithImage.articles?.length || 0;
                const totalItems = episodesCount + articlesCount;
                // الحصول على العنوان المناسب حسب اللغة
                const title = language === 'ar' 
                  ? (playlistWithImage.title || "")
                  : (playlistWithImage.titleEn || playlistWithImage.title || "");
                
                return (
                  <Link
                    key={playlist._id || playlist.slug?.current}
                    href={`/playlists/${playlist.slug?.current}`}
                    className="group flex gap-4 items-center border rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-700 transform hover:scale-[1.01] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:shadow-blue-900/20 dark:hover:shadow-blue-900/30"
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
                  >
                    {imageUrl && (
                      <div className="w-32 h-20 relative overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={title}
                          fill
                          className="object-cover rounded-lg bg-gray-100 dark:bg-gray-700 transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        {/* تأثير التدرج على الصورة */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{title}</h2>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <FaList className="h-4 w-4" />
                        <span>{totalItems} {t.items}</span>
                        {episodesCount > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full animate-pulse">
                            {episodesCount} {episodesCount === 1 ? t.episode : t.episodes}
                          </span>
                        )}
                        {articlesCount > 0 && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full animate-pulse">
                            {articlesCount} {articlesCount === 1 ? t.article : t.articles}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-blue-500 transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* أنماط CSS مخصصة للأنيميشن */}
      <style jsx>{`
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
};

export default PlaylistsPage;