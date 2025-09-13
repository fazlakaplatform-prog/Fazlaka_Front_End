"use client";
import { useEffect, useState } from "react";
import { addToFavorites, removeFromFavorites, checkFavorite } from "@/lib/favorites";
import { useUser } from "@clerk/nextjs";
import { Heart } from "lucide-react";

export default function FavoriteButton({ episodeId }: { episodeId: number }) {
  const { user } = useUser();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkFavorite(user.id, episodeId).then((exists) => {
        setIsFavorite(exists);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user, episodeId]);

  async function handleToggle() {
    if (!user) return;
    try {
      if (isFavorite) {
        await removeFromFavorites(user.id, episodeId);
        setIsFavorite(false);
      } else {
        await addToFavorites(user.id, episodeId);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return null;

  return (
    <button
      onClick={handleToggle}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className="flex items-center justify-center p-2 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 md:px-4 md:py-2"
      style={{
        backgroundColor: isFavorite ? '#ef4444' : '#e5e7eb',
        color: isFavorite ? 'white' : '#374151'
      }}
    >
      <Heart 
        className="w-5 h-5 md:w-5 md:h-5" 
        fill={isFavorite ? "currentColor" : "none"} 
        stroke={isFavorite ? "white" : "#374151"}
      />
      <span className="hidden md:inline ml-2">
        {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      </span>
    </button>
  );
}