import imageUrlBuilder from '@sanity/image-url'
import { client } from './client'
import { SanityImage, SanityFitMode, SanityCropMode, SanityAutoMode, SanityFormat } from './types'

// Create a builder for Sanity images
const builder = imageUrlBuilder(client)

// Updated urlFor function to handle both direct URLs and Sanity image objects
export function urlFor(source: string | SanityImage | undefined) {
  if (!source) {
    return '/placeholder.png'
  }
  
  // If it's a string URL, return it directly
  if (typeof source === 'string') {
    return source
  }
  
  // If it's a Sanity image object, use the builder
  if (source && source._type === 'image' && source.asset) {
    return builder.image(source).url()
  }
  
  // Fallback
  return '/placeholder.png'
}

// Updated urlForImage function to handle both direct URLs and Sanity image objects
export function urlForImage(source: string | SanityImage | undefined) {
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
  
  // If it's a string URL, return a simple object with url method
  if (typeof source === 'string') {
    return {
      url: () => source,
      width: () => ({ url: () => source }),
      height: () => ({ url: () => source }),
      fit: () => ({ url: () => source }),
      crop: () => ({ url: () => source }),
      auto: () => ({ url: () => source }),
      format: () => ({ url: () => source }),
      quality: () => ({ url: () => source }),
      bg: () => ({ url: () => source }),
    }
  }
  
  // If it's a Sanity image object, use the builder
  if (source && source._type === 'image' && source.asset) {
    const imageBuilder = builder.image(source)
    return {
      url: () => imageBuilder.url(),
      width: (w: number) => ({
        url: () => imageBuilder.width(w).url(),
        height: () => ({ url: () => imageBuilder.width(w).url() }),
        fit: () => ({ url: () => imageBuilder.width(w).url() }),
        crop: () => ({ url: () => imageBuilder.width(w).url() }),
        auto: () => ({ url: () => imageBuilder.width(w).url() }),
        format: () => ({ url: () => imageBuilder.width(w).url() }),
        quality: () => ({ url: () => imageBuilder.width(w).url() }),
        bg: () => ({ url: () => imageBuilder.width(w).url() }),
      }),
      height: (h: number) => ({
        url: () => imageBuilder.height(h).url(),
        width: () => ({ url: () => imageBuilder.height(h).url() }),
        fit: () => ({ url: () => imageBuilder.height(h).url() }),
        crop: () => ({ url: () => imageBuilder.height(h).url() }),
        auto: () => ({ url: () => imageBuilder.height(h).url() }),
        format: () => ({ url: () => imageBuilder.height(h).url() }),
        quality: () => ({ url: () => imageBuilder.height(h).url() }),
        bg: () => ({ url: () => imageBuilder.height(h).url() }),
      }),
      fit: (f: SanityFitMode) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        url: () => (imageBuilder.fit as any)(f).url(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        width: () => ({ url: () => (imageBuilder.fit as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        height: () => ({ url: () => (imageBuilder.fit as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        crop: () => ({ url: () => (imageBuilder.fit as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        auto: () => ({ url: () => (imageBuilder.fit as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        format: () => ({ url: () => (imageBuilder.fit as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quality: () => ({ url: () => (imageBuilder.fit as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bg: () => ({ url: () => (imageBuilder.fit as any)(f).url() }),
      }),
      crop: (c: SanityCropMode) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        url: () => (imageBuilder.crop as any)(c).url(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        width: () => ({ url: () => (imageBuilder.crop as any)(c).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        height: () => ({ url: () => (imageBuilder.crop as any)(c).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fit: () => ({ url: () => (imageBuilder.crop as any)(c).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        auto: () => ({ url: () => (imageBuilder.crop as any)(c).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        format: () => ({ url: () => (imageBuilder.crop as any)(c).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quality: () => ({ url: () => (imageBuilder.crop as any)(c).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bg: () => ({ url: () => (imageBuilder.crop as any)(c).url() }),
      }),
      auto: (a: SanityAutoMode) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        url: () => (imageBuilder.auto as any)(a).url(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        width: () => ({ url: () => (imageBuilder.auto as any)(a).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        height: () => ({ url: () => (imageBuilder.auto as any)(a).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fit: () => ({ url: () => (imageBuilder.auto as any)(a).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        crop: () => ({ url: () => (imageBuilder.auto as any)(a).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        format: () => ({ url: () => (imageBuilder.auto as any)(a).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quality: () => ({ url: () => (imageBuilder.auto as any)(a).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bg: () => ({ url: () => (imageBuilder.auto as any)(a).url() }),
      }),
      format: (f: SanityFormat) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        url: () => (imageBuilder.format as any)(f).url(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        width: () => ({ url: () => (imageBuilder.format as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        height: () => ({ url: () => (imageBuilder.format as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fit: () => ({ url: () => (imageBuilder.format as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        crop: () => ({ url: () => (imageBuilder.format as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        auto: () => ({ url: () => (imageBuilder.format as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quality: () => ({ url: () => (imageBuilder.format as any)(f).url() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bg: () => ({ url: () => (imageBuilder.format as any)(f).url() }),
      }),
      quality: (q: number) => ({
        url: () => imageBuilder.quality(q).url(),
        width: () => ({ url: () => imageBuilder.quality(q).url() }),
        height: () => ({ url: () => imageBuilder.quality(q).url() }),
        fit: () => ({ url: () => imageBuilder.quality(q).url() }),
        crop: () => ({ url: () => imageBuilder.quality(q).url() }),
        auto: () => ({ url: () => imageBuilder.quality(q).url() }),
        format: () => ({ url: () => imageBuilder.quality(q).url() }),
        bg: () => ({ url: () => imageBuilder.quality(q).url() }),
      }),
      bg: (b: string) => ({
        url: () => imageBuilder.bg(b).url(),
        width: () => ({ url: () => imageBuilder.bg(b).url() }),
        height: () => ({ url: () => imageBuilder.bg(b).url() }),
        fit: () => ({ url: () => imageBuilder.bg(b).url() }),
        crop: () => ({ url: () => imageBuilder.bg(b).url() }),
        auto: () => ({ url: () => imageBuilder.bg(b).url() }),
        format: () => ({ url: () => imageBuilder.bg(b).url() }),
        quality: () => ({ url: () => imageBuilder.bg(b).url() }),
      }),
    }
  }
  
  // Fallback
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