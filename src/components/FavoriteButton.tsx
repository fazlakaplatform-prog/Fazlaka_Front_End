"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface FavoriteButtonProps {
  contentId: string;
  contentType: "episode" | "article";
}

export default function FavoriteButton({ contentId, contentType }: FavoriteButtonProps) {
  const { user } = useUser();
  const { isRTL, language } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(false);
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
  }, [user, contentId, contentType]);

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
        setIsFavorite(!isFavorite);
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
      className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 md:px-4 md:py-2 disabled:opacity-50`}
      style={{
        backgroundColor: isFavorite ? '#ef4444' : '#e5e7eb',
        color: isFavorite ? 'white' : '#374151'
      }}
    >
      {actionLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Heart 
          className="w-5 h-5 md:w-5 md:h-5" 
          fill={isFavorite ? "currentColor" : "none"} 
          stroke={isFavorite ? "white" : "#374151"}
        />
      )}
      <span className={`hidden md:inline ${isRTL ? "mr-2" : "ml-2"}`}>
        {isFavorite ? t.removeFromFavorites : t.addToFavorites}
      </span>
    </button>
  );
}