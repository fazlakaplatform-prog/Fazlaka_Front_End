// src/lib/sanity/types.ts

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

// واجهات للأنواع الأساسية مع دعم اللغة
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
  thumbnailUrl?: string
  thumbnailUrlEn?: string
  description?: string
  descriptionEn?: string
  _createdAt?: string
  // Added localized properties
  localizedTitle?: string;
  localizedDescription?: string;
  localizedThumbnailUrl?: string;
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
  videoUrlEn?: string
  thumbnailUrl?: string
  thumbnailUrlEn?: string
  season?: Season
  publishedAt?: string
  duration?: number
  categories?: string[]
  language?: 'ar' | 'en'
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
  featuredImageUrl?: string
  featuredImageUrlEn?: string
  season?: Season
  episode?: Episode
  publishedAt?: string
  readTime?: number
  categories?: string[]
  language?: 'ar' | 'en'
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
  userId?: string
  parentComment?: {
    _ref: string
    _type: 'reference'
  }
}

export interface Favorite {
  _id?: string
  _type: 'favorite'
  userId: string
  episode?: Episode
  article?: Article
  createdAt?: string
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
  imageUrl?: string
  imageUrlEn?: string
  episodes?: Episode[]
  articles?: Article[]
  _createdAt?: string
  // Added localized properties
  localizedTitle?: string;
  localizedDescription?: string;
  localizedImageUrl?: string;
}

// واجهة لعضو الفريق مع دعم اللغة
export interface TeamMember {
  _id?: string
  _type: 'teamMember'
  name: string
  nameEn?: string
  bio?: string
  bioEn?: string
  imageUrl?: string
  imageUrlEn?: string
  slug: SanitySlug
  role?: string
  roleEn?: string
  socialLinks?: {
    platform?: string
    url?: string
  }[]
  _createdAt?: string
}

// واجهة للإشعارات
export interface NotificationItem {
  id: string;
  type: 'episode' | 'article' | 'playlist' | 'faq' | 'terms' | 'privacy' | 'team' | 'season' | 'heroSlider' | 'socialLinks';
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
  image?: string;
  imageEn?: string;
  videoUrl?: string;
  videoUrlEn?: string;
  link?: {
    text?: string;
    textEn?: string;
    url?: string;
  };
  orderRank?: number;
  _createdAt?: string;
}

// واجهة للروابط الاجتماعية
export interface SocialLink {
  _id: string
  _type: 'socialLinks'
  platform: string
  url: string
}

// واجهة للمستند الذي يحتوي على الروابط الاجتماعية
export interface SocialLinks {
  _id: string
  _type: 'socialLinks'
  links: {
    platform: string
    url: string
  }[]
  _createdAt?: string
}

// واجهة لشروط وأحكام الموقع (محدثة بالكامل)
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
  logo?: SanityImage;
  logoEn?: SanityImage;
  footerText?: string
  footerTextEn?: string
  lastUpdated?: string
  _createdAt?: string
  // Added localized properties
  localizedTitle?: string;
  localizedContent?: PortableTextBlock[];
  localizedTerm?: string;
  localizedDefinition?: string;
  localizedDescription?: string;
  localizedLinkText?: string;
  localizedSiteTitle?: string;
  localizedSiteDescription?: string;
  localizedFooterText?: string;
  localizedLogo?: SanityImage;
  localizedItems?: string[];
}

// واجهة لسياسة الخصوصية
export interface PrivacyContent {
  _id: string
  _type: 'privacyContent'
  sectionType: string
  title: string
  titleEn?: string
  content?: PortableTextBlock[]
  contentEn?: PortableTextBlock[]
  description?: string
  descriptionEn?: string
  lastUpdated?: string
  _createdAt?: string
  // Added properties from queries
  icon?: string;
  color?: string;
  textColor?: string;
  // Added localized properties
  localizedTitle?: string;
  localizedContent?: PortableTextBlock[];
  localizedDescription?: string;
}

// Define the SanityImage interface for type safety
export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
}

// Define the valid modes for Sanity image transformations
export type SanityFitMode = 'fill' | 'crop' | 'scale' | 'clip' | 'max' | 'min'
export type SanityCropMode = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'focalpoint' | 'entropy'
export type SanityAutoMode = 'format'
export type SanityFormat = 'jpg' | 'png' | 'webp' | 'avif' | 'gif' | 'svg'