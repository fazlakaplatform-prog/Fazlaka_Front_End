// src/lib/favorites.ts

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
const API_TOKEN = process.env.STRAPI_API_TOKEN ?? "";

// تعريف الأنواع المستخدمة
interface Episode {
  id: number;
  // يمكنك إضافة خصائص أخرى للحلقة إذا لزم الأمر
}

interface FavoriteData {
  documentId: string;
  episodes?: Episode[];
  // يمكنك إضافة خصائص أخرى للمفضلة إذا لزم الأمر
}

interface ApiResponse {
  data: FavoriteData[];
}

// 🔹 Helper للتعامل مع الأخطاء (تم تعديله ليكون عاماً)
async function handleResponse<T>(res: Response, action: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ ${action} failed:`, text);
    throw new Error(`${action} failed`);
  }
  return res.json() as Promise<T>;
}

export async function addToFavorites(userId: string, episodeId: number) {
  // 👀 الأول نشوف هل فيه Favorite record للمستخدم
  const checkRes = await fetch(
    `${STRAPI_URL}/api/favorites?filters[userId][$eq]=${userId}&populate=episodes`,
    {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    }
  );
  const existing = await handleResponse<ApiResponse>(checkRes, "Check favorites");
  
  if (existing.data.length > 0) {
    // ✅ لو فيه record → استعمل documentId مش id
    const favoriteDocId = existing.data[0].documentId;
    const currentEpisodes: number[] = 
      existing.data[0].episodes?.map((ep: Episode) => ep.id) || [];
    
    const updateRes = await fetch(
      `${STRAPI_URL}/api/favorites/${favoriteDocId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            episodes: [...new Set([...currentEpisodes, episodeId])],
          },
        }),
      }
    );
    return handleResponse<ApiResponse>(updateRes, "Update favorite");
  } else {
    // 🆕 لو مفيش → اعمل واحد جديد
    const res = await fetch(`${STRAPI_URL}/api/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          userId,
          episodes: [episodeId],
        },
      }),
    });
    return handleResponse<ApiResponse>(res, "Create favorite");
  }
}

export async function removeFromFavorites(userId: string, episodeId: number) {
  const checkRes = await fetch(
    `${STRAPI_URL}/api/favorites?filters[userId][$eq]=${userId}&populate=episodes`,
    {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    }
  );
  const existing = await handleResponse<ApiResponse>(checkRes, "Check favorites");
  
  if (existing.data.length > 0) {
    const favoriteDocId = existing.data[0].documentId;
    const currentEpisodes: number[] = 
      existing.data[0].episodes?.map((ep: Episode) => ep.id) || [];
    const updatedEpisodes = currentEpisodes.filter((id: number) => id !== episodeId);
    
    const updateRes = await fetch(
      `${STRAPI_URL}/api/favorites/${favoriteDocId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            episodes: updatedEpisodes,
          },
        }),
      }
    );
    return handleResponse<ApiResponse>(updateRes, "Remove favorite");
  }
}

export async function checkFavorite(userId: string, episodeId: number) {
  const res = await fetch(
    `${STRAPI_URL}/api/favorites?filters[userId][$eq]=${userId}&filters[episodes][id][$eq]=${episodeId}`,
    {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    }
  );
  const data = await handleResponse<ApiResponse>(res, "Fetch favorites");
  return data.data.length > 0;
}