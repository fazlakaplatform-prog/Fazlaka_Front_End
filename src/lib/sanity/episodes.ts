import { fetchArrayFromSanity, fetchFromSanity } from './client'
import { Episode, Season } from './types'
import { PortableTextBlock } from '@portabletext/types' // استيراد النوع الصحيح للمحتوى

// === تعديل الواجهات بالأنواع الصحيحة ===
interface LocalizedEpisode extends Episode {
  localizedTitle?: string;
  localizedDescription?: string;
  localizedContent?: PortableTextBlock[]; // تغيير النوع ليتوافق مع PortableTextBlock[]
  localizedVideoUrl?: string;
  localizedThumbnailUrl?: string;
}

interface LocalizedSeason extends Season {
  localizedTitle?: string;
  localizedDescription?: string;
  localizedThumbnailUrl?: string;
}

// دوال جديدة لجلب الحلقات مع دعم اللغة
export async function fetchEpisodes(language: string = 'ar'): Promise<LocalizedEpisode[]> {
  try {
    const query = `*[_type == "episode"] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      content,
      contentEn,
      videoUrl,
      videoUrlEn,
      thumbnailUrl,
      thumbnailUrlEn,
      season->,
      publishedAt
    }`;
    const episodes = await fetchArrayFromSanity<Episode>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return episodes.map(episode => ({
      ...episode,
      localizedTitle: language === 'ar' ? episode.title : episode.titleEn,
      localizedDescription: language === 'ar' ? episode.description : episode.descriptionEn,
      localizedContent: language === 'ar' ? episode.content : episode.contentEn,
      localizedVideoUrl: language === 'ar' ? episode.videoUrl : episode.videoUrlEn,
      localizedThumbnailUrl: language === 'ar' ? episode.thumbnailUrl : episode.thumbnailUrlEn
    }));
  } catch (error) {
    console.error('Error fetching episodes from Sanity:', error);
    return [];
  }
}

export async function fetchEpisodeBySlug(slug: string, language: string = 'ar'): Promise<LocalizedEpisode | null> {
  try {
    const query = `*[_type == "episode" && slug.current == $slug][0]{
      _id,
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      content,
      contentEn,
      videoUrl,
      videoUrlEn,
      thumbnailUrl,
      thumbnailUrlEn,
      season->,
      publishedAt
    }`;
    
    const result = await fetchFromSanity<Episode>(query, { slug });
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedTitle: language === 'ar' ? result.title : result.titleEn,
      localizedDescription: language === 'ar' ? result.description : result.descriptionEn,
      localizedContent: language === 'ar' ? result.content : result.contentEn,
      localizedVideoUrl: language === 'ar' ? result.videoUrl : result.videoUrlEn,
      localizedThumbnailUrl: language === 'ar' ? result.thumbnailUrl : result.thumbnailUrlEn
    };
  } catch (error) {
    console.error('Error fetching episode by slug from Sanity:', error);
    return null;
  }
}

export async function fetchSeasons(language: string = 'ar'): Promise<LocalizedSeason[]> {
  try {
    const query = `*[_type == "season"] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      slug,
      thumbnailUrl,
      thumbnailUrlEn,
      description,
      descriptionEn,
      _createdAt
    }`;
    const seasons = await fetchArrayFromSanity<Season>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return seasons.map(season => ({
      ...season,
      localizedTitle: language === 'ar' ? season.title : season.titleEn,
      localizedDescription: language === 'ar' ? season.description : season.descriptionEn,
      localizedThumbnailUrl: language === 'ar' ? season.thumbnailUrl : season.thumbnailUrlEn
    }));
  } catch (error) {
    console.error('Error fetching seasons from Sanity:', error);
    return [];
  }
}

export async function fetchSeasonBySlug(slug: string, language: string = 'ar'): Promise<LocalizedSeason | null> {
  try {
    const query = `*[_type == "season" && slug.current == $slug][0]{
      _id,
      title,
      titleEn,
      slug,
      thumbnailUrl,
      thumbnailUrlEn,
      description,
      descriptionEn,
      _createdAt
    }`;
    
    const result = await fetchFromSanity<Season>(query, { slug });
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedTitle: language === 'ar' ? result.title : result.titleEn,
      localizedDescription: language === 'ar' ? result.description : result.descriptionEn,
      localizedThumbnailUrl: language === 'ar' ? result.thumbnailUrl : result.thumbnailUrlEn
    };
  } catch (error) {
    console.error('Error fetching season by slug from Sanity:', error);
    return null;
  }
}

export async function fetchEpisodesBySeason(seasonId: string, language: string = 'ar'): Promise<LocalizedEpisode[]> {
  try {
    const query = `*[_type == "episode" && season._ref == $seasonId] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      content,
      contentEn,
      videoUrl,
      videoUrlEn,
      thumbnailUrl,
      thumbnailUrlEn,
      season->,
      publishedAt
    }`;
    const episodes = await fetchArrayFromSanity<Episode>(query, { seasonId });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return episodes.map(episode => ({
      ...episode,
      localizedTitle: language === 'ar' ? episode.title : episode.titleEn,
      localizedDescription: language === 'ar' ? episode.description : episode.descriptionEn,
      localizedContent: language === 'ar' ? episode.content : episode.contentEn,
      localizedVideoUrl: language === 'ar' ? episode.videoUrl : episode.videoUrlEn,
      localizedThumbnailUrl: language === 'ar' ? episode.thumbnailUrl : episode.thumbnailUrlEn
    }));
  } catch (error) {
    console.error('Error fetching episodes by season from Sanity:', error);
    return [];
  }
}

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
export function getLocalizedText(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}