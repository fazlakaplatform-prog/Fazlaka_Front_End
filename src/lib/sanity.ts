// lib/sanity.ts
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)

// دالة urlFor الأصلية للتعامل مع الحالات العامة
export function urlFor(source: SanityImage | string | undefined | null): string {
  if (!source) {
    return '/placeholder.png'
  }
  
  if (typeof source === 'string') {
    return source
  }
  
  return builder.image(source).url()
}

// دالة متخصصة للصور مع خيارات الحجم
export function urlForImage(source: SanityImage | undefined | null) {
  if (!source) {
    return {
      url: () => '/placeholder.png',
      width: () => ({ url: () => '/placeholder.png' }),
      height: () => ({ url: () => '/placeholder.png' }),
      fit: () => ({ url: () => '/placeholder.png' }),
      crop: () => ({ url: () => '/placeholder.png' }),
      auto: () => ({ url: () => '/placeholder.png' }),
      format: () => ({ url: () => '/placeholder.png' }),
      quality: () => ({ url: () => '/placeholder.png' }),
      bg: () => ({ url: () => '/placeholder.png' }),
    }
  }
  
  return builder.image(source)
}

// تعديل دالة fetchFromSanity لضمان إرجاع مصفوفة دائمًا عند الطلب
export async function fetchFromSanity<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  try {
    const result = await client.fetch<T>(query, params, {
      cache: 'no-store',
    });
    return result;
  } catch (error) {
    console.error('Error fetching from Sanity:', error);
    throw error;
  }
}

// دالة متخصصة لجلب المصفوفات من Sanity
export async function fetchArrayFromSanity<T>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
  try {
    const result = await client.fetch<T[]>(query, params, {
      cache: 'no-store',
    });
    
    // التأكد من أن النتيجة مصفوفة، وإلا أرجع مصفوفة فارغة
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error fetching array from Sanity:', error);
    return [];
  }
}

// تعديل دالة createDocument لتجنب استخدام any
export async function createDocument<T extends { _type: string }>(documentData: T): Promise<T> {
  try {
    const result = await client.create(documentData);
    return result as T;
  } catch (error) {
    console.error('Error creating document in Sanity:', error);
    throw error;
  }
}

// تعديل دالة updateDocument لتجنب استخدام any
export async function updateDocument<T>(documentId: string, documentData: Record<string, unknown>): Promise<T> {
  try {
    const result = await client.patch(documentId).set(documentData).commit() as T;
    return result;
  } catch (error) {
    console.error('Error updating document in Sanity:', error);
    throw error;
  }
}

// دالة لحذف مستند
export async function deleteDocument(documentId: string): Promise<void> {
  try {
    await client.delete(documentId);
  } catch (error) {
    console.error('Error deleting document in Sanity:', error);
    throw error;
  }
}

// دالة لإنشاء تعليق جديد
export async function createComment(commentData: Omit<Comment, '_id' | '_type' | 'createdAt'>): Promise<Comment> {
  try {
    return await createDocument<Comment>({
      _type: 'comment',
      ...commentData,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating comment in Sanity:', error);
    throw error;
  }
}

// دالة لجلب قوائم التشغيل من Sanity
export async function fetchPlaylists(): Promise<Playlist[]> {
  try {
    const query = `*[_type == "playlist"]{
      _id,
      title,
      slug,
      description,
      "imageUrl": image.asset->url,
      "episodes": *[_type == "episode" && references(^._id)]{
        _id,
        title,
        slug,
        "imageUrl": thumbnail.asset->url
      }
    }`;
    return await fetchArrayFromSanity<Playlist>(query);
  } catch (error) {
    console.error('Error fetching playlists from Sanity:', error);
    return [];
  }
}

// دالة لجلب قائمة تشغيل معينة حسب الـ slug
export async function fetchPlaylistBySlug(slug: string): Promise<Playlist | null> {
  try {
    const query = `*[_type == "playlist" && slug.current == $slug][0]{
      _id,
      title,
      slug,
      description,
      "imageUrl": image.asset->url,
      "episodes": *[_type == "episode" && references(^._id)]{
        _id,
        title,
        slug,
        "imageUrl": thumbnail.asset->url,
        content,
        videoUrl,
        publishedAt
      }
    }`;
    return await fetchFromSanity<Playlist>(query, { slug });
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

// دوال للتعامل مع الأسئلة الشائعة (FAQ)
export interface FAQ {
  _id?: string
  _type: 'faq'
  question: string
  answer: string
  category?: string
}

export async function fetchFaqs(): Promise<FAQ[]> {
  try {
    const query = `*[_type == "faq"] | order(_createdAt desc) {
      _id,
      question,
      answer,
      category
    }`;
    return await fetchArrayFromSanity<FAQ>(query);
  } catch (error) {
    console.error('Error fetching FAQs from Sanity:', error);
    return [];
  }
}

export async function createFaq(faqData: Omit<FAQ, '_id' | '_type'>): Promise<FAQ> {
  try {
    return await createDocument<FAQ>({
      _type: 'faq',
      ...faqData
    });
  } catch (error) {
    console.error('Error creating FAQ in Sanity:', error);
    throw error;
  }
}

export async function updateFaq(faqId: string, faqData: Partial<FAQ>): Promise<FAQ> {
  try {
    return await updateDocument<FAQ>(faqId, faqData);
  } catch (error) {
    console.error('Error updating FAQ in Sanity:', error);
    throw error;
  }
}

export async function deleteFaq(faqId: string): Promise<void> {
  try {
    await deleteDocument(faqId);
  } catch (error) {
    console.error('Error deleting FAQ in Sanity:', error);
    throw error;
  }
}

// واجهات جديدة لمحتوى الشروط والأحكام
export interface TermsContent {
  _id?: string
  _type: 'termsContent'
  sectionType: 'mainTerms' | 'legalTerm' | 'rightsResponsibility' | 'additionalPolicy' | 'siteSettings'
  title?: string
  content?: PortableTextBlock[]
  term?: string
  definition?: string
  icon?: string
  rightsType?: 'userRights' | 'userResponsibilities' | 'companyRights'
  items?: { item: string }[]
  color?: string
  borderColor?: string
  description?: string
  linkText?: string
  linkUrl?: string
  siteTitle?: string
  siteDescription?: string
  logo?: SanityImage
  footerText?: string
  lastUpdated?: string
}

// دوال جديدة للتعامل مع محتوى الشروط والأحكام
export async function getAllTermsContent(): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent"] | order(sectionType asc, title asc) {
      _id,
      sectionType,
      title,
      content,
      term,
      definition,
      icon,
      rightsType,
      items,
      color,
      borderColor,
      description,
      linkText,
      linkUrl,
      siteTitle,
      siteDescription,
      logo,
      footerText,
      lastUpdated
    }`
    return await fetchArrayFromSanity<TermsContent>(query);
  } catch (error) {
    console.error('Error fetching all terms content from Sanity:', error);
    return [];
  }
}

// جلب شروط وأحكام الموقع الرئيسية
export async function getMainTerms(): Promise<TermsContent | null> {
  try {
    const query = `*[_type == "termsContent" && sectionType == "mainTerms"][0] {
      _id,
      title,
      content,
      lastUpdated
    }`
    return await fetchFromSanity<TermsContent>(query);
  } catch (error) {
    console.error('Error fetching main terms from Sanity:', error);
    return null;
  }
}

// جلب المصطلحات القانونية
export async function getLegalTerms(): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent" && sectionType == "legalTerm"] | order(term asc) {
      _id,
      term,
      definition,
      icon
    }`
    return await fetchArrayFromSanity<TermsContent>(query);
  } catch (error) {
    console.error('Error fetching legal terms from Sanity:', error);
    return [];
  }
}

// جلب الحقوق والمسؤوليات
export async function getRightsResponsibilities(): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent" && sectionType == "rightsResponsibility"] | order(rightsType asc, title asc) {
      _id,
      title,
      rightsType,
      icon,
      items,
      color,
      borderColor
    }`
    return await fetchArrayFromSanity<TermsContent>(query);
  } catch (error) {
    console.error('Error fetching rights and responsibilities from Sanity:', error);
    return [];
  }
}

// جلب السياسات الإضافية
export async function getAdditionalPolicies(): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent" && sectionType == "additionalPolicy"] | order(title asc) {
      _id,
      title,
      description,
      icon,
      linkText,
      linkUrl
    }`
    return await fetchArrayFromSanity<TermsContent>(query);
  } catch (error) {
    console.error('Error fetching additional policies from Sanity:', error);
    return [];
  }
}

// جلب إعدادات الموقع
export async function getSiteSettings(): Promise<TermsContent | null> {
  try {
    const query = `*[_type == "termsContent" && sectionType == "siteSettings"][0]{
      siteTitle,
      siteDescription,
      logo,
      footerText
    }`
    return await fetchFromSanity<TermsContent>(query);
  } catch (error) {
    console.error('Error fetching site settings from Sanity:', error);
    return null;
  }
}

// دوال لإنشاء وتحديث وحذف محتوى الشروط والأحكام
export async function createTermsContent(termsData: Omit<TermsContent, '_id'>): Promise<TermsContent> {
  try {
    // استخراج _type من termsData إذا كان موجودًا، وإلا استخدم القيمة الافتراضية
    const { _type = 'termsContent', ...restData } = termsData;
    return await createDocument<TermsContent>({
      _type,
      ...restData
    });
  } catch (error) {
    console.error('Error creating terms content in Sanity:', error);
    throw error;
  }
}

export async function updateTermsContent(termsId: string, termsData: Partial<TermsContent>): Promise<TermsContent> {
  try {
    return await updateDocument<TermsContent>(termsId, termsData);
  } catch (error) {
    console.error('Error updating terms content in Sanity:', error);
    throw error;
  }
}

export async function deleteTermsContent(termsId: string): Promise<void> {
  try {
    await deleteDocument(termsId);
  } catch (error) {
    console.error('Error deleting terms content in Sanity:', error);
    throw error;
  }
}

// واجهات جديدة لمحتوى سياسة الخصوصية
export interface PrivacyContent {
  _id?: string
  _type: 'privacyContent'
  sectionType: 'mainPolicy' | 'userRight' | 'dataType' | 'securityMeasure'
  title?: string
  content?: PortableTextBlock[]
  icon?: string
  description?: string
  color?: string
  textColor?: string
  lastUpdated?: string
}

// دوال للتعامل مع سياسة الخصوصية
export async function getPrivacyPolicy(): Promise<PrivacyContent | null> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == "mainPolicy"][0] {
      title,
      content,
      lastUpdated
    }`
    return await client.fetch(query)
  } catch (error) {
    console.error('Error fetching privacy policy from Sanity:', error)
    return null
  }
}

export async function getUserRights(): Promise<PrivacyContent[]> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == "userRight"] | order(title asc) {
      _id,
      title,
      description,
      icon
    }`
    return await client.fetch(query)
  } catch (error) {
    console.error('Error fetching user rights from Sanity:', error)
    return []
  }
}

export async function getDataTypes(): Promise<PrivacyContent[]> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == "dataType"] | order(title asc) {
      _id,
      title,
      description,
      icon,
      color,
      textColor
    }`
    return await client.fetch(query)
  } catch (error) {
    console.error('Error fetching data types from Sanity:', error)
    return []
  }
}

export async function getSecurityMeasures(): Promise<PrivacyContent[]> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == "securityMeasure"] | order(title asc) {
      _id,
      title,
      description,
      icon
    }`
    return await client.fetch(query)
  } catch (error) {
    console.error('Error fetching security measures from Sanity:', error)
    return []
  }
}

// دوال لإنشاء وتحديث وحذف محتوى سياسة الخصوصية
export async function createPrivacyContent(privacyData: Omit<PrivacyContent, '_id'>): Promise<PrivacyContent> {
  try {
    // استخراج _type من privacyData إذا كان موجودًا، وإلا استخدم القيمة الافتراضية
    const { _type = 'privacyContent', ...restData } = privacyData;
    const result = await client.create({
      _type,
      ...restData
    })
    return result as PrivacyContent
  } catch (error) {
    console.error('Error creating privacy content in Sanity:', error)
    throw error
  }
}

export async function updatePrivacyContent(privacyId: string, privacyData: Partial<PrivacyContent>): Promise<PrivacyContent> {
  try {
    const result = await client.patch(privacyId).set(privacyData).commit() as PrivacyContent
    return result
  } catch (error) {
    console.error('Error updating privacy content in Sanity:', error)
    throw error
  }
}

export async function deletePrivacyContent(privacyId: string): Promise<void> {
  try {
    await client.delete(privacyId)
  } catch (error) {
    console.error('Error deleting privacy content in Sanity:', error)
    throw error
  }
}

// دوال للتعامل مع المفضلة
export async function fetchUserFavorites(userId: string): Promise<Favorite[]> {
  try {
    const query = `*[_type == "favorite" && userId == $userId]{
      _id,
      userId,
      episode->{
        _id,
        title,
        slug,
        "imageUrl": thumbnail.asset->url
      },
      article->{
        _id,
        title,
        slug,
        "imageUrl": featuredImage.asset->url
      }
    }`;
    return await fetchArrayFromSanity<Favorite>(query, { userId });
  } catch (error) {
    console.error('Error fetching user favorites from Sanity:', error);
    return [];
  }
}

export async function createFavorite(favoriteData: Omit<Favorite, '_id'>): Promise<Favorite> {
  try {
    return await createDocument<Favorite>(favoriteData);
  } catch (error) {
    console.error('Error creating favorite in Sanity:', error);
    throw error;
  }
}

export async function deleteFavorite(favoriteId: string): Promise<void> {
  try {
    await deleteDocument(favoriteId);
  } catch (error) {
    console.error('Error deleting favorite in Sanity:', error);
    throw error;
  }
}

export async function checkFavorite(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<boolean> {
  try {
    const query = `*[_type == "favorite" && userId == $userId && ${contentType}._ref == $contentId][0]{
      _id
    }`;
    const favorite = await fetchFromSanity<Favorite>(query, { userId, contentId });
    return !!favorite;
  } catch (error) {
    console.error('Error checking favorite status from Sanity:', error);
    return false;
  }
}

export async function addToFavorites(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<Favorite> {
  try {
    // Check if already a favorite
    const isAlreadyFavorite = await checkFavorite(userId, contentId, contentType);
    if (isAlreadyFavorite) {
      throw new Error('Content is already in favorites');
    }

    const favoriteData: Omit<Favorite, '_id'> = {
      _type: 'favorite',
      userId,
      [contentType]: {
        _type: 'reference',
        _ref: contentId
      }
    };

    return await createFavorite(favoriteData);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

export async function removeFromFavorites(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<void> {
  try {
    const query = `*[_type == "favorite" && userId == $userId && ${contentType}._ref == $contentId][0]{
      _id
    }`;
    const favorite = await fetchFromSanity<Favorite>(query, { userId, contentId });
    
    if (!favorite || !favorite._id) {
      throw new Error('Favorite not found');
    }

    await deleteFavorite(favorite._id);
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}

export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export interface SanitySlug {
  _type: 'slug'
  current: string
}

export interface Season {
  _id: string
  _type: 'season'
  title: string
  slug: SanitySlug
  thumbnail?: SanityImage
}

// نوع لبيانات Portable Text من Sanity
export interface PortableTextBlock {
  _type: 'block'
  style?: string
  children: Array<{
    _type: 'span'
    text: string
    marks?: string[]
  }>
  markDefs?: Array<{
    _key: string
    _type: string
    [key: string]: unknown
  }>
}

export interface Episode {
  _id: string
  _type: 'episode'
  title: string
  slug: SanitySlug
  description?: string
  content?: PortableTextBlock[]
  videoUrl?: string
  thumbnail?: SanityImage
  season?: Season
  publishedAt?: string
}

export interface Article {
  _id: string
  _type: 'article'
  title: string
  slug: SanitySlug
  excerpt?: string
  content?: PortableTextBlock[]
  featuredImage?: SanityImage
}

export interface Comment {
  _id?: string
  _type: 'comment'
  name: string
  email: string
  content: string
  episode?: Episode
  article?: Article
  createdAt: string
}

export interface Favorite {
  _id?: string // تم تغييرها إلى اختيارية
  _type: 'favorite'
  userId: string
  episode?: Episode
  article?: Article
}

// واجهة لقائمة التشغيل
export interface Playlist {
  _id?: string
  _type: 'playlist'
  title: string
  slug: SanitySlug
  description?: string
  image?: SanityImage
  episodes?: Episode[]
}

// إضافة هذا السطر لتجنب المشاكل مع الـ Dynamic Server Usage
export const dynamic = 'force-dynamic';