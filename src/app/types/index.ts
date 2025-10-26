import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    image?: string | null
  }
}

export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
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

// نوع Portable Text للنصوص المنسقة من Sanity
export interface PortableTextBlock {
  _type: 'block'
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote'
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
  _id: string
  _type: 'comment'
  name: string
  email: string
  content: string
  episode?: Episode
  article?: Article
  createdAt: string
}

export interface Favorite {
  _id: string
  _type: 'favorite'
  userId: string
  episode: Episode
}

// أنواع إضافية للتحقق من الأنواع في التطبيق
export type SanityDocument = Episode | Article | Comment | Favorite | Season

// دالة مساعدة للتحقق من نوع المستند
export function isSanityDocument(doc: unknown): doc is SanityDocument {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    '_id' in doc &&
    '_type' in doc &&
    typeof doc._id === 'string' &&
    typeof doc._type === 'string'
  )
}

// نوع المستخدم مع حقول التحقق
export interface SanityUser {
  _id: string
  _type: 'user'
  name: string
  email: string
  password?: string
  image?: string // تغيير من SanityImage إلى string لتخزين رابط الصورة
  isActive: boolean
  verificationToken?: string
  verificationTokenExpiry?: string
  resetToken?: string
  resetTokenExpiry?: string
  magicToken?: string
  magicTokenExpiry?: string
  otpCode?: string
  otpExpiry?: string
  otpPurpose?: 'login' | 'register' | 'reset' | 'verify'
  otpVerified?: boolean
  createdAt: string
  updatedAt?: string
}