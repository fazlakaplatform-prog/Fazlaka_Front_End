import { fetchArrayFromSanity } from './client'
import { HeroSlider } from './types'

// دالة لجلب عناصر السلايدر مع دعم اللغة
export async function fetchHeroSliders(language: string = 'ar'): Promise<HeroSlider[]> {
  try {
    const query = `*[_type == "heroSlider"] | order(orderRank asc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      mediaType,
      image,
      imageEn,
      videoUrl,
      videoUrlEn,
      link,
      orderRank,
      _createdAt
    }`;
    const sliders = await fetchArrayFromSanity<HeroSlider>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return sliders.map(slider => ({
      ...slider,
      localizedTitle: language === 'ar' ? slider.title : slider.titleEn,
      localizedDescription: language === 'ar' ? slider.description : slider.descriptionEn,
      localizedImage: language === 'ar' ? slider.image : slider.imageEn,
      localizedVideoUrl: language === 'ar' ? slider.videoUrl : slider.videoUrlEn,
      localizedLinkText: language === 'ar' ? slider.link?.text : slider.link?.textEn
    }));
  } catch (error) {
    console.error('Error fetching hero sliders from Sanity:', error);
    return [];
  }
}

// دالة للحصول على رابط الفيديو
export function getVideoUrl(slider: HeroSlider, language: string = 'ar'): string | null {
  if (slider.mediaType === 'video') {
    // تعديل: استخدام معامل التحقق من القيم الفارغة (nullish coalescing) لتحويل undefined إلى null
    return language === 'ar' ? (slider.videoUrl ?? null) : (slider.videoUrlEn ?? null);
  }
  return null;
}

// دالة للحصول على رابط الصورة
export function getImageUrl(slider: HeroSlider, language: string = 'ar'): string | null {
  if (slider.mediaType === 'image') {
    // تعديل: استخدام معامل التحقق من القيم الفارغة (nullish coalescing) لتحويل undefined إلى null
    return language === 'ar' ? (slider.image ?? null) : (slider.imageEn ?? null);
  }
  return null;
}