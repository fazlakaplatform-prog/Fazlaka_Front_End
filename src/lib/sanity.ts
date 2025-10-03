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

// دالة لجلب قوائم التشغيل من Sanity (محدثة مع دعم اللغة)
export async function fetchPlaylists(language: string = 'ar'): Promise<Playlist[]> {
  try {
    const query = `*[_type == "playlist" && language == $language] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      "imageUrl": image.asset->url,
      "episodes": episodes[]->{
        _id,
        title,
        titleEn,
        slug,
        "imageUrl": thumbnail.asset->url
      },
      "articles": articles[]->{
        _id,
        title,
        titleEn,
        slug,
        "imageUrl": featuredImage.asset->url,
        excerpt,
        excerptEn
      },
      language
    }`;
    return await fetchArrayFromSanity<Playlist>(query, { language });
  } catch (error) {
    console.error('Error fetching playlists from Sanity:', error);
    return [];
  }
}

// دالة لجلب قائمة تشغيل معينة حسب الـ slug (محدثة مع دعم اللغة)
export async function fetchPlaylistBySlug(slug: string, language: string = 'ar'): Promise<Playlist | null> {
  try {
    const query = `*[_type == "playlist" && slug.current == $slug && language == $language][0]{
      _id,
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      "imageUrl": image.asset->url,
      "episodes": episodes[]->{
        _id,
        title,
        titleEn,
        slug,
        "imageUrl": thumbnail.asset->url,
        content,
        contentEn,
        videoUrl,
        publishedAt,
        language
      },
      "articles": articles[]->{
        _id,
        title,
        titleEn,
        slug,
        "imageUrl": featuredImage.asset->url,
        excerpt,
        excerptEn,
        content,
        contentEn,
        publishedAt,
        language
      },
      language
    }`;
    return await fetchFromSanity<Playlist>(query, { slug, language });
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

// دوال للتعامل مع الأسئلة الشائعة (FAQ) مع دعم اللغة
export interface FAQ {
  _id?: string
  _type: 'faq'
  question: string
  questionEn?: string
  answer: string
  answerEn?: string
  category?: string
  categoryEn?: string
  language: 'ar' | 'en'
  _createdAt?: string
}

export async function fetchFaqs(language: string = 'ar'): Promise<FAQ[]> {
  try {
    const query = `*[_type == "faq" && language == $language] | order(_createdAt desc) {
      _id,
      question,
      questionEn,
      answer,
      answerEn,
      category,
      categoryEn,
      language
    }`;
    return await fetchArrayFromSanity<FAQ>(query, { language });
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

// واجهات جديدة لمحتوى الشروط والأحكام مع دعم اللغة
export interface TermsContent {
  _id?: string
  _type: 'termsContent'
  sectionType: 'mainTerms' | 'legalTerm' | 'rightsResponsibility' | 'additionalPolicy' | 'siteSettings'
  title?: string
  titleEn?: string
  content?: PortableTextBlock[]
  contentEn?: PortableTextBlock[]
  term?: string
  termEn?: string
  definition?: string
  definitionEn?: string
  icon?: string
  rightsType?: 'userRights' | 'userResponsibilities' | 'companyRights'
  items?: { item: string; itemEn?: string }[]
  color?: string
  borderColor?: string
  description?: string
  descriptionEn?: string
  linkText?: string
  linkTextEn?: string
  linkUrl?: string
  siteTitle?: string
  siteTitleEn?: string
  siteDescription?: string
  siteDescriptionEn?: string
  logo?: SanityImage
  footerText?: string
  footerTextEn?: string
  lastUpdated?: string
  language: 'ar' | 'en'
  _createdAt?: string
}

// دوال جديدة للتعامل مع محتوى الشروط والأحكام مع دعم اللغة
export async function getAllTermsContent(language: string = 'ar'): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent" && language == $language] | order(sectionType asc, title asc) {
      _id,
      sectionType,
      title,
      titleEn,
      content,
      contentEn,
      term,
      termEn,
      definition,
      definitionEn,
      icon,
      rightsType,
      items,
      color,
      borderColor,
      description,
      descriptionEn,
      linkText,
      linkTextEn,
      linkUrl,
      siteTitle,
      siteTitleEn,
      siteDescription,
      siteDescriptionEn,
      logo,
      footerText,
      footerTextEn,
      lastUpdated,
      language
    }`
    return await fetchArrayFromSanity<TermsContent>(query, { language });
  } catch (error) {
    console.error('Error fetching all terms content from Sanity:', error);
    return [];
  }
}

// جلب شروط وأحكام الموقع الرئيسية مع دعم اللغة
export async function getMainTerms(language: string = 'ar'): Promise<TermsContent | null> {
  try {
    const query = `*[_type == "termsContent" && sectionType == 'mainTerms' && language == $language][0] {
      _id,
      title,
      titleEn,
      content,
      contentEn,
      lastUpdated,
      language
    }`
    return await fetchFromSanity<TermsContent>(query, { language });
  } catch (error) {
    console.error('Error fetching main terms from Sanity:', error);
    return null;
  }
}

// جلب المصطلحات القانونية مع دعم اللغة
export async function getLegalTerms(language: string = 'ar'): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent" && sectionType == 'legalTerm' && language == $language] | order(term asc) {
      _id,
      term,
      termEn,
      definition,
      definitionEn,
      icon,
      language
    }`
    return await fetchArrayFromSanity<TermsContent>(query, { language });
  } catch (error) {
    console.error('Error fetching legal terms from Sanity:', error);
    return [];
  }
}

// جلب الحقوق والمسؤوليات مع دعم اللغة
export async function getRightsResponsibilities(language: string = 'ar'): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent" && sectionType == 'rightsResponsibility' && language == $language] | order(rightsType asc, title asc) {
      _id,
      title,
      titleEn,
      rightsType,
      icon,
      items,
      color,
      borderColor,
      language
    }`
    return await fetchArrayFromSanity<TermsContent>(query, { language });
  } catch (error) {
    console.error('Error fetching rights and responsibilities from Sanity:', error);
    return [];
  }
}

// جلب السياسات الإضافية مع دعم اللغة
export async function getAdditionalPolicies(language: string = 'ar'): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent" && sectionType == 'additionalPolicy' && language == $language] | order(title asc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      icon,
      linkText,
      linkTextEn,
      linkUrl,
      language
    }`
    return await fetchArrayFromSanity<TermsContent>(query, { language });
  } catch (error) {
    console.error('Error fetching additional policies from Sanity:', error);
    return [];
  }
}

// جلب إعدادات الموقع مع دعم اللغة
export async function getSiteSettings(language: string = 'ar'): Promise<TermsContent | null> {
  try {
    const query = `*[_type == "termsContent" && sectionType == 'siteSettings' && language == $language][0]{
      siteTitle,
      siteTitleEn,
      siteDescription,
      siteDescriptionEn,
      logo,
      footerText,
      footerTextEn,
      language
    }`
    return await fetchFromSanity<TermsContent>(query, { language });
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

// واجهات جديدة لمحتوى سياسة الخصوصية مع دعم اللغة
export interface PrivacyContent {
  _id?: string
  _type: 'privacyContent'
  sectionType: 'mainPolicy' | 'userRight' | 'dataType' | 'securityMeasure'
  title?: string
  titleEn?: string
  content?: PortableTextBlock[]
  contentEn?: PortableTextBlock[]
  icon?: string
  description?: string
  descriptionEn?: string
  color?: string
  textColor?: string
  lastUpdated?: string
  language: 'ar' | 'en'
  _createdAt?: string
}

// دوال للتعامل مع سياسة الخصوصية مع دعم اللغة
export async function getPrivacyPolicy(language: string = 'ar'): Promise<PrivacyContent | null> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == 'mainPolicy' && language == $language][0] {
      title,
      titleEn,
      content,
      contentEn,
      lastUpdated,
      language
    }`
    return await fetchFromSanity<PrivacyContent>(query, { language });
  } catch (error) {
    console.error('Error fetching privacy policy from Sanity:', error);
    return null;
  }
}

export async function getUserRights(language: string = 'ar'): Promise<PrivacyContent[]> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == 'userRight' && language == $language] | order(title asc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      icon,
      language
    }`
    return await fetchArrayFromSanity<PrivacyContent>(query, { language });
  } catch (error) {
    console.error('Error fetching user rights from Sanity:', error);
    return [];
  }
}

export async function getDataTypes(language: string = 'ar'): Promise<PrivacyContent[]> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == 'dataType' && language == $language] | order(title asc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      icon,
      color,
      textColor,
      language
    }`
    return await fetchArrayFromSanity<PrivacyContent>(query, { language });
  } catch (error) {
    console.error('Error fetching data types from Sanity:', error);
    return [];
  }
}

export async function getSecurityMeasures(language: string = 'ar'): Promise<PrivacyContent[]> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == 'securityMeasure' && language == $language] | order(title asc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      icon,
      language
    }`
    return await fetchArrayFromSanity<PrivacyContent>(query, { language });
  } catch (error) {
    console.error('Error fetching security measures from Sanity:', error);
    return [];
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
    });
    return result as PrivacyContent;
  } catch (error) {
    console.error('Error creating privacy content in Sanity:', error);
    throw error;
  }
}

export async function updatePrivacyContent(privacyId: string, privacyData: Partial<PrivacyContent>): Promise<PrivacyContent> {
  try {
    const result = await client.patch(privacyId).set(privacyData).commit() as PrivacyContent;
    return result;
  } catch (error) {
    console.error('Error updating privacy content in Sanity:', error);
    throw error;
  }
}

export async function deletePrivacyContent(privacyId: string): Promise<void> {
  try {
    await client.delete(privacyId);
  } catch (error) {
    console.error('Error deleting privacy content in Sanity:', error);
    throw error;
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
        titleEn,
        slug,
        "imageUrl": thumbnail.asset->url
      },
      article->{
        _id,
        title,
        titleEn,
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

// واجهات للأنواع الأساسية مع دعم اللغة
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
  titleEn?: string
  slug: SanitySlug
  thumbnail?: SanityImage
  description?: string
  descriptionEn?: string
  language: 'ar' | 'en'
  _createdAt?: string
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
  titleEn?: string
  slug: SanitySlug
  description?: string
  descriptionEn?: string
  content?: PortableTextBlock[]
  contentEn?: PortableTextBlock[]
  videoUrl?: string
  thumbnail?: SanityImage
  season?: Season
  publishedAt?: string
  language: 'ar' | 'en'
  _createdAt?: string
}

export interface Article {
  _id: string
  _type: 'article'
  title: string
  titleEn?: string
  slug: SanitySlug
  excerpt?: string
  excerptEn?: string
  content?: PortableTextBlock[]
  contentEn?: PortableTextBlock[]
  featuredImage?: SanityImage
  season?: Season
  episode?: Episode
  publishedAt?: string
  language: 'ar' | 'en'
  _createdAt?: string
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
  _id?: string
  _type: 'favorite'
  userId: string
  episode?: Episode
  article?: Article
}

// واجهة لقائمة التشغيل (محدثة مع دعم اللغة)
export interface Playlist {
  _id?: string
  _type: 'playlist'
  title: string
  titleEn?: string
  slug: SanitySlug
  description?: string
  descriptionEn?: string
  image?: SanityImage
  episodes?: Episode[]
  articles?: Article[]
  language: 'ar' | 'en'
  _createdAt?: string
}

// واجهة لعضو الفريق مع دعم اللغة
export interface TeamMember {
  _id?: string
  _type: 'teamMember'
  name: string
  nameEn?: string
  bio?: string
  bioEn?: string
  image?: SanityImage
  slug: SanitySlug
  role?: string
  roleEn?: string
  socialLinks?: {
    platform?: string
    url?: string
  }[]
  language: 'ar' | 'en'
  _createdAt?: string
}

// واجهة للإشعارات
export interface NotificationItem {
  id: string;
  type: 'episode' | 'article' | 'playlist' | 'faq' | 'terms' | 'privacy' | 'team' | 'season';
  title: string;
  description?: string;
  date: string;
  imageUrl?: string;
  linkUrl: string;
}

// واجهة HeroSlider مع دعم اللغة
export interface HeroSlider {
  _id?: string;
  _type: 'heroSlider';
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  mediaType: 'image' | 'video';
  image?: SanityImage;
  video?: {
    _type: 'file';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  videoUrl?: string;
  link?: {
    text?: string;
    textEn?: string;
    url?: string;
  };
  orderRank?: number;
  language: 'ar' | 'en'
  _createdAt?: string;
}

// دالة لجلب عناصر السلايدر مع دعم اللغة
export async function fetchHeroSliders(language: string = 'ar'): Promise<HeroSlider[]> {
  try {
    const query = `*[_type == "heroSlider" && language == $language] | order(orderRank asc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      mediaType,
      image,
      video,
      videoUrl,
      link,
      orderRank,
      _createdAt,
      language
    }`;
    return await fetchArrayFromSanity<HeroSlider>(query, { language });
  } catch (error) {
    console.error('Error fetching hero sliders from Sanity:', error);
    return [];
  }
}

// دالة للحصول على رابط الفيديو
export function getVideoUrl(slider: HeroSlider): string | null {
  if (slider.mediaType === 'video') {
    if (slider.videoUrl) {
      return slider.videoUrl;
    } else if (slider.video) {
      try {
        return builder.image(slider.video).url();
      } catch (error) {
        console.error('Error building video URL:', error);
        return null;
      }
    }
  }
  return null;
}

// دالة للحصول على رابط الصورة
export function getImageUrl(slider: HeroSlider): string | null {
  if (slider.mediaType === 'image' && slider.image) {
    try {
      return builder.image(slider.image).url();
    } catch (error) {
      console.error('Error building image URL:', error);
      return null;
    }
  }
  return null;
}

// دالة لجلب كل الإشعارات مع دعم اللغة
export async function getAllNotifications(language: string = 'ar'): Promise<NotificationItem[]> {
  try {
    const lang = language || 'ar';
    
    // جلب الحلقات مع فلترة حسب اللغة
    const episodesQuery = `*[_type == "episode" && language == $lang] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      publishedAt,
      _createdAt,
      "imageUrl": thumbnail.asset->url,
      "slug": slug.current,
      "type": "episode"
    }`;
    const episodes = await fetchArrayFromSanity<Episode & { type: string; slug: string; imageUrl?: string }>(episodesQuery, { lang });

    // جلب المقالات مع فلترة حسب اللغة
    const articlesQuery = `*[_type == "article" && language == $lang] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      excerpt,
      excerptEn,
      publishedAt,
      _createdAt,
      "imageUrl": featuredImage.asset->url,
      "slug": slug.current,
      "type": "article"
    }`;
    const articles = await fetchArrayFromSanity<Article & { type: string; slug: string; imageUrl?: string }>(articlesQuery, { lang });

    // جلب قوائم التشغيل مع فلترة حسب اللغة
    const playlistsQuery = `*[_type == "playlist" && language == $lang] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      _createdAt,
      "imageUrl": image.asset->url,
      "slug": slug.current,
      "type": "playlist"
    }`;
    const playlists = await fetchArrayFromSanity<Playlist & { type: string; slug: string; imageUrl?: string }>(playlistsQuery, { lang });

    // جلب المواسم مع فلترة حسب اللغة
    const seasonsQuery = `*[_type == "season" && language == $lang] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      _createdAt,
      "imageUrl": thumbnail.asset->url,
      "slug": slug.current,
      "type": "season"
    }`;
    const seasons = await fetchArrayFromSanity<Season & { type: string; slug: string; imageUrl?: string }>(seasonsQuery, { lang });

    // جلب الأسئلة الشائعة مع فلترة حسب اللغة
    const faqsQuery = `*[_type == "faq" && language == $lang] | order(_createdAt desc) {
      _id,
      question,
      questionEn,
      answer,
      answerEn,
      _createdAt,
      "type": "faq"
    }`;
    const faqs = await fetchArrayFromSanity<FAQ & { type: string }>(faqsQuery, { lang });

    // جلب الشروط والأحكام مع فلترة حسب اللغة
    const termsQuery = `*[_type == "termsContent" && language == $lang] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      _createdAt,
      "type": "terms"
    }`;
    const terms = await fetchArrayFromSanity<TermsContent & { type: string }>(termsQuery, { lang });

    // جلب سياسة الخصوصية مع فلترة حسب اللغة
    const privacyQuery = `*[_type == "privacyContent" && language == $lang] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      _createdAt,
      "type": "privacy"
    }`;
    const privacy = await fetchArrayFromSanity<PrivacyContent & { type: string }>(privacyQuery, { lang });

    // جلب أعضاء الفريق مع فلترة حسب اللغة
    const teamQuery = `*[_type == "teamMember" && language == $lang] | order(_createdAt desc) {
      _id,
      name,
      nameEn,
      bio,
      bioEn,
      _createdAt,
      "imageUrl": image.asset->url,
      "slug": slug.current,
      "type": "team"
    }`;
    const teamMembers = await fetchArrayFromSanity<TeamMember & { type: string; slug: string; imageUrl?: string }>(teamQuery, { lang });

    // دالة للحصول على تاريخ صالح
    const getValidDate = (date1?: string, date2?: string) => {
      const date = date1 || date2;
      if (!date) return new Date().toISOString();
      
      // التحقق من صحة التاريخ
      const d = new Date(date);
      if (isNaN(d.getTime())) return new Date().toISOString();
      
      return date;
    };

    // دالة للحصول على النص المناسب بناءً على اللغة
    const getText = (arText?: string, enText?: string) => {
      return lang === 'ar' ? (arText || '') : (enText || '');
    };

    // تحويل البيانات إلى تنسيق موحد للإشعارات
    const episodeNotifications: NotificationItem[] = episodes.map(ep => ({
      id: ep._id,
      type: 'episode' as const,
      title: getText(ep.title, ep.titleEn),
      description: getText(ep.description, ep.descriptionEn),
      date: getValidDate(ep.publishedAt, ep._createdAt),
      imageUrl: ep.imageUrl,
      linkUrl: `/episodes/${ep.slug}`
    }));

    const articleNotifications: NotificationItem[] = articles.map(article => ({
      id: article._id,
      type: 'article' as const,
      title: getText(article.title, article.titleEn),
      description: getText(article.excerpt, article.excerptEn),
      date: getValidDate(article.publishedAt, article._createdAt),
      imageUrl: article.imageUrl,
      linkUrl: `/articles/${article.slug}`
    }));

    const playlistNotifications: NotificationItem[] = playlists.map(playlist => ({
      id: playlist._id || '',
      type: 'playlist' as const,
      title: getText(playlist.title, playlist.titleEn),
      description: getText(playlist.description, playlist.descriptionEn),
      date: getValidDate(playlist._createdAt),
      imageUrl: playlist.imageUrl,
      linkUrl: `/playlists/${playlist.slug}`
    }));

    const seasonNotifications: NotificationItem[] = seasons.map(season => ({
      id: season._id || '',
      type: 'season' as const,
      title: getText(season.title, season.titleEn),
      description: getText(season.description, season.descriptionEn),
      date: getValidDate(season._createdAt),
      imageUrl: season.imageUrl,
      linkUrl: `/seasons/${season.slug}`
    }));

    const faqNotifications: NotificationItem[] = faqs.map(faq => ({
      id: faq._id || '',
      type: 'faq' as const,
      title: getText(faq.question, faq.questionEn),
      description: getText(faq.answer, faq.answerEn),
      date: getValidDate(faq._createdAt),
      linkUrl: `/faq?faq=${faq._id}`
    }));

    const termsNotifications: NotificationItem[] = terms.map(term => ({
      id: term._id || '',
      type: 'terms' as const,
      title: getText(term.title, term.titleEn) || (lang === 'ar' ? 'شروط وأحكام' : 'Terms & Conditions'),
      date: getValidDate(term._createdAt),
      linkUrl: `/terms#${term._id}`
    }));

    const privacyNotifications: NotificationItem[] = privacy.map(priv => ({
      id: priv._id || '',
      type: 'privacy' as const,
      title: getText(priv.title, priv.titleEn) || (lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'),
      date: getValidDate(priv._createdAt),
      linkUrl: `/privacy#${priv._id}`
    }));

    const teamNotifications: NotificationItem[] = teamMembers.map(member => ({
      id: member._id || '',
      type: 'team' as const,
      title: lang === 'ar' ? `عضو جديد في الفريق: ${getText(member.name, member.nameEn)}` : `New team member: ${getText(member.name, member.nameEn)}`,
      description: getText(member.bio, member.bioEn),
      date: getValidDate(member._createdAt),
      imageUrl: member.imageUrl,
      linkUrl: `/team/${member.slug}`
    }));

    // دمج كل الإشعارات وترتيبها حسب التاريخ
    const allNotifications = [
      ...episodeNotifications,
      ...articleNotifications,
      ...playlistNotifications,
      ...seasonNotifications,
      ...faqNotifications,
      ...termsNotifications,
      ...privacyNotifications,
      ...teamNotifications
    ];

    // ترتيب الإشعارات حسب التاريخ (الأحدث أولاً)
    return allNotifications.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// دوال جديدة لجلب الحلقات والمقالات مع دعم اللغة
export async function fetchEpisodes(language: string = 'ar'): Promise<Episode[]> {
  try {
    const query = `*[_type == "episode" && language == $language] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      content,
      contentEn,
      videoUrl,
      thumbnail,
      season->,
      publishedAt,
      language
    }`;
    return await fetchArrayFromSanity<Episode>(query, { language });
  } catch (error) {
    console.error('Error fetching episodes from Sanity:', error);
    return [];
  }
}

export async function fetchArticles(language: string = 'ar'): Promise<Article[]> {
  try {
    const query = `*[_type == "article" && language == $language] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      slug,
      excerpt,
      excerptEn,
      content,
      contentEn,
      featuredImage,
      season->,
      episode->,
      publishedAt,
      language
    }`;
    return await fetchArrayFromSanity<Article>(query, { language });
  } catch (error) {
    console.error('Error fetching articles from Sanity:', error);
    return [];
  }
}

export async function fetchSeasons(language: string = 'ar'): Promise<Season[]> {
  try {
    const query = `*[_type == "season" && language == $language] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      slug,
      thumbnail,
      description,
      descriptionEn,
      language,
      _createdAt
    }`;
    return await fetchArrayFromSanity<Season>(query, { language });
  } catch (error) {
    console.error('Error fetching seasons from Sanity:', error);
    return [];
  }
}

export async function fetchArticlesBySeason(seasonId: string, language: string = 'ar'): Promise<Article[]> {
  try {
    const query = `*[_type == "article" && season._ref == $seasonId && language == $language] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      slug,
      excerpt,
      excerptEn,
      content,
      contentEn,
      featuredImage,
      season->,
      episode->,
      publishedAt,
      language
    }`;
    return await fetchArrayFromSanity<Article>(query, { seasonId, language });
  } catch (error) {
    console.error('Error fetching articles by season from Sanity:', error);
    return [];
  }
}

export async function fetchTeamMembers(language: string = 'ar'): Promise<TeamMember[]> {
  try {
    const query = `*[_type == "teamMember" && language == $language] | order(_createdAt desc) {
      _id,
      name,
      nameEn,
      bio,
      bioEn,
      image,
      slug,
      role,
      roleEn,
      socialLinks,
      language,
      _createdAt
    }`;
    return await fetchArrayFromSanity<TeamMember>(query, { language });
  } catch (error) {
    console.error('Error fetching team members from Sanity:', error);
    return [];
  }
}

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
export function getLocalizedText(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}

// إضافة هذا السطر لتجنب المشاكل مع الـ Dynamic Server Usage
export const dynamic = 'force-dynamic';