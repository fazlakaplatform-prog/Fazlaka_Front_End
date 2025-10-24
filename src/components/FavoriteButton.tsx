"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface FavoriteButtonProps {
  contentId: string;
  contentType: "episode" | "article";
  isFavorite?: boolean;
  onToggle?: () => void;
}

export default function FavoriteButton({ 
  contentId, 
  contentType, 
  isFavorite: propIsFavorite,
  onToggle: propOnToggle 
}: FavoriteButtonProps) {
  const { user } = useUser();
  const { isRTL, language } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(propIsFavorite || false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // نصوص التطبيق حسب اللغة
  const texts = {
    ar: {
      addToFavorites: "إضافة للمفضلة",
      removeFromFavorites: "إزالة من المفضلة",
      errorMessage: "حدث خطأ أثناء تحديث المفضلة. يرجى المحاولة مرة أخرى."
    },
    en: {
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
      errorMessage: "An error occurred while updating favorites. Please try again."
    }
  };

  const t = texts[language];

  useEffect(() => {
    // إذا تم تمرير حالة الإعجاب كـ prop، استخدمها مباشرة
    if (propIsFavorite !== undefined) {
      setIsFavorite(propIsFavorite);
      setLoading(false);
      return;
    }
    
    // خلاف ذلك، تحقق من API
    if (user) {
      // Check if the content is in favorites
      const checkFavorite = async () => {
        try {
          const response = await fetch(`/api/favorites?userId=${user.id}&contentId=${contentId}&contentType=${contentType}`);
          if (response.ok) {
            const data = await response.json();
            setIsFavorite(data.isFavorite);
          }
        } catch (error) {
          console.error("Error checking favorite status:", error);
        } finally {
          setLoading(false);
        }
      };

      checkFavorite();
    } else {
      setLoading(false);
    }
  }, [user, contentId, contentType, propIsFavorite]);

  async function handleToggle() {
    if (!user || actionLoading) return;
    
    setActionLoading(true);
    
    try {
      const method = isFavorite ? "DELETE" : "POST";
      const response = await fetch(`/api/favorites`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          contentId,
          contentType,
        }),
      });

      if (response.ok) {
        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);
        
        // إذا تم تمرير دالة onToggle، استدعها
        if (propOnToggle) {
          propOnToggle();
        }
      } else {
        const errorData = await response.json();
        console.error("Error toggling favorite:", errorData);
        alert(t.errorMessage);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert(t.errorMessage);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={actionLoading}
      aria-label={isFavorite ? t.removeFromFavorites : t.addToFavorites}
      className={`group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 overflow-hidden`}
    >
      {/* خلفية متدرجة */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isFavorite ? 'from-red-500 to-pink-600' : 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'} transition-all duration-500`}></div>
      
      {/* تأثير اللمعان */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* تأثير الحركة عند التفعيل */}
      {isFavorite && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-red-500/30 animate-ping"></div>
        </div>
      )}
      
      {/* الأيقونة */}
      <div className="relative z-10 flex items-center justify-center">
        {actionLoading ? (
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg 
            className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${isFavorite ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} 
            fill={isFavorite ? "currentColor" : "none"} 
            stroke={isFavorite ? "white" : "currentColor"}
            strokeWidth={isFavorite ? 0 : 2}
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        )}
      </div>
      
      {/* تأثير النبض عند التفعيل */}
      {isFavorite && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
    </button>
  );
}