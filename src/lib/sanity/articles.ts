import { fetchArrayFromSanity, fetchFromSanity } from './client'
import { Article } from './types'
import { PortableTextBlock } from '@portabletext/types'

// Define an extended type that includes localized fields
interface ArticleWithLocalized extends Article {
  localizedTitle?: string;
  localizedExcerpt?: string;
  localizedContent?: PortableTextBlock[] | undefined;
  localizedFeaturedImageUrl?: string;
}

export async function fetchArticles(language: string = 'ar'): Promise<ArticleWithLocalized[]> {
  try {
    const query = `*[_type == "article"] | order(publishedAt desc) {
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
      episode->,
      publishedAt
    }`;
    const articles = await fetchArrayFromSanity<Article>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return articles.map(article => ({
      ...article,
      localizedTitle: language === 'ar' ? article.title : article.titleEn,
      localizedExcerpt: language === 'ar' ? article.excerpt : article.excerptEn,
      localizedContent: language === 'ar' ? article.content : article.contentEn,
      localizedFeaturedImageUrl: language === 'ar' ? article.featuredImageUrl : article.featuredImageUrlEn
    }));
  } catch (error) {
    console.error('Error fetching articles from Sanity:', error);
    return [];
  }
}

export async function fetchArticleBySlug(slug: string, language: string = 'ar'): Promise<ArticleWithLocalized | null> {
  try {
    const query = `*[_type == "article" && slug.current == $slug][0]{
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
      episode->,
      publishedAt
    }`;
    
    const result = await fetchFromSanity<Article>(query, { slug });
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedTitle: language === 'ar' ? result.title : result.titleEn,
      localizedExcerpt: language === 'ar' ? result.excerpt : result.excerptEn,
      localizedContent: language === 'ar' ? result.content : result.contentEn,
      localizedFeaturedImageUrl: language === 'ar' ? result.featuredImageUrl : result.featuredImageUrlEn
    };
  } catch (error) {
    console.error('Error fetching article by slug from Sanity:', error);
    return null;
  }
}

export async function fetchArticlesBySeason(seasonId: string, language: string = 'ar'): Promise<ArticleWithLocalized[]> {
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
      episode->,
      publishedAt
    }`;
    const articles = await fetchArrayFromSanity<Article>(query, { seasonId });
    
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

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
export function getLocalizedText(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}