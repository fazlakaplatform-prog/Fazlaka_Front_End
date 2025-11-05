import { fetchArrayFromSanity, fetchFromSanity } from './client'
import { Season, Episode, Article } from './types' // Import Episode and Article

// تعريف نوع أكثر أمانًا لـ PortableTextBlock
type PortableTextBlock = {
  _type: string;
  _key?: string;
  children?: Array<{
    _type: string;
    text?: string;
    marks?: string[];
  }>;
  markDefs?: Array<{
    _key: string;
    _type: string;
    [key: string]: unknown; // استخدام unknown بدلاً من any
  }>;
  style?: string;
  list?: string;
  level?: number;
};

// تعريف نوع لمرجع الموسم - This is no longer needed for the Localized interfaces
// type SeasonReference = {
//   _ref: string;
//   _type: 'reference';
// };

// واجهة جديدة لتمثيل بيانات الحلقة مع الحقول المُترجمة
interface LocalizedEpisode {
  _id: string;
  title: string;
  titleEn?: string;
  slug: { current: string };
  description?: string;
  descriptionEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  videoUrl?: string;
  videoUrlEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  // FIX: Changed from SeasonReference to Season, because the query dereferences it.
  season?: Season; 
  publishedAt?: string;
  // الحقول المضافة
  localizedTitle?: string;
  localizedDescription?: string;
  localizedContent?: PortableTextBlock[];
  localizedVideoUrl?: string;
  localizedThumbnailUrl?: string;
}

// واجهة جديدة لتمثيل بيانات المقال مع الحقول المُترجمة
interface LocalizedArticle {
  _id: string;
  title: string;
  titleEn?: string;
  slug: { current: string };
  excerpt?: string;
  excerptEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  // FIX: Changed from SeasonReference to Season, because the query dereferences it.
  season?: Season;
  publishedAt?: string;
  // الحقول المضافة
  localizedTitle?: string;
  localizedExcerpt?: string;
  localizedContent?: PortableTextBlock[];
  localizedFeaturedImageUrl?: string;
}

export async function fetchSeasons(language: string = 'ar'): Promise<Season[]> {
  try {
    const query = `*[_type == "season"] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      thumbnailUrl,
      thumbnailUrlEn,
      publishedAt
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

export async function fetchSeasonBySlug(slug: string, language: string = 'ar'): Promise<Season | null> {
  try {
    const query = `*[_type == "season" && slug.current == $slug][0]{
      _id,
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      thumbnailUrl,
      thumbnailUrlEn,
      publishedAt
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
    const episodes = await fetchArrayFromSanity<Omit<Episode, '_type'>>(query, { seasonId });
    
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

export async function fetchArticlesBySeason(seasonId: string, language: string = 'ar'): Promise<LocalizedArticle[]> {
  try {
    const query = `*[_type == "article" && season._ref == $seasonId] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      slug,
      excerpt,
      excerptEn,
      content,
      contentEn,
      featuredImageUrl,
      featuredImageUrlEn,
      season->,
      publishedAt
    }`;
    const articles = await fetchArrayFromSanity<Omit<Article, '_type'>>(query, { seasonId });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return articles.map(article => ({
      ...article,
      localizedTitle: language === 'ar' ? article.title : article.titleEn,
      localizedExcerpt: language === 'ar' ? article.excerpt : article.excerptEn,
      localizedContent: language === 'ar' ? article.content : article.contentEn,
      localizedFeaturedImageUrl: language === 'ar' ? article.featuredImageUrl : article.featuredImageUrlEn
    }));
  } catch (error) {
    console.error('Error fetching articles by season from Sanity:', error);
    return [];
  }
}