import { fetchArrayFromSanity, fetchFromSanity, createDocument, updateDocument, deleteDocument } from './client'
import { Playlist } from './types'

// دالة لجلب قوائم التشغيل من Sanity (محدثة مع دعم اللغة)
export async function fetchPlaylists(language: string = 'ar'): Promise<Playlist[]> {
  try {
    const query = `*[_type == "playlist"] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      imageUrl,
      imageUrlEn,
      "episodes": episodes[]->{
        _id,
        title,
        titleEn,
        slug,
        thumbnailUrl,
        thumbnailUrlEn
      },
      "articles": articles[]->{
        _id,
        title,
        titleEn,
        slug,
        featuredImageUrl,
        featuredImageUrlEn,
        excerpt,
        excerptEn
      }
    }`;
    const playlists = await fetchArrayFromSanity<Playlist>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return playlists.map(playlist => ({
      ...playlist,
      localizedTitle: language === 'ar' ? playlist.title : playlist.titleEn,
      localizedDescription: language === 'ar' ? playlist.description : playlist.descriptionEn,
      localizedImageUrl: language === 'ar' ? playlist.imageUrl : playlist.imageUrlEn
    }));
  } catch (error) {
    console.error('Error fetching playlists from Sanity:', error);
    return [];
  }
}

// دالة لجلب قائمة تشغيل معينة حسب الـ slug (محدثة مع دعم اللغة)
export async function fetchPlaylistBySlug(slug: string, language: string = 'ar'): Promise<Playlist | null> {
  try {
    // جلب القائمة
    const query = `*[_type == "playlist" && slug.current == $slug][0]{
      _id,
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      imageUrl,
      imageUrlEn,
      "episodes": episodes[]->{
        _id,
        title,
        titleEn,
        slug,
        thumbnailUrl,
        thumbnailUrlEn,
        content,
        contentEn,
        videoUrl,
        videoUrlEn,
        publishedAt
      },
      "articles": articles[]->{
        _id,
        title,
        titleEn,
        slug,
        featuredImageUrl,
        featuredImageUrlEn,
        excerpt,
        excerptEn,
        content,
        contentEn,
        publishedAt
      }
    }`;
    
    const result = await fetchFromSanity<Playlist>(query, { slug });
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedTitle: language === 'ar' ? result.title : result.titleEn,
      localizedDescription: language === 'ar' ? result.description : result.descriptionEn,
      localizedImageUrl: language === 'ar' ? result.imageUrl : result.imageUrlEn
    };
  } catch (error) {
    console.error('Error fetching playlist by slug from Sanity:', error);
    return null;
  }
}

// دالة لإنشاء قائمة تشغيل جديدة
export async function createPlaylist(playlistData: Omit<Playlist, '_id' | '_type'>): Promise<Playlist> {
  try {
    return await createDocument<Playlist>({
      _type: 'playlist',
      ...playlistData
    });
  } catch (error) {
    console.error('Error creating playlist in Sanity:', error);
    throw error;
  }
}

// دالة لتحديث قائمة تشغيل معينة
export async function updatePlaylist(playlistId: string, playlistData: Partial<Playlist>): Promise<Playlist> {
  try {
    return await updateDocument<Playlist>(playlistId, playlistData);
  } catch (error) {
    console.error('Error updating playlist in Sanity:', error);
    throw error;
  }
}

// دالة لحذف قائمة تشغيل معينة
export async function deletePlaylist(playlistId: string): Promise<void> {
  try {
    await deleteDocument(playlistId);
  } catch (error) {
    console.error('Error deleting playlist in Sanity:', error);
    throw error;
  }
}