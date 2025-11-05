import { fetchArrayFromSanity, fetchFromSanity } from './client'
import { SocialLink } from './types'

// دالة لجلب الروابط الاجتماعية - تم إصلاح الخطأ
export async function fetchSocialLinks(): Promise<SocialLink[]> {
  try {
    const query = `*[_type == "socialLinks"] | order(platform asc) {
      _id,
      platform,
      url
    }`
    return await fetchArrayFromSanity<SocialLink>(query);
  } catch (error) {
    console.error('Error fetching social links from Sanity:', error);
    return [];
  }
}

// دالة لجلب مستند الروابط الاجتماعية كامل
export async function fetchSocialLinksDocument(): Promise<{ links: SocialLink[] } | null> {
  try {
    const query = `*[_type == "socialLinksDocument"][0] {
      links[] {
        _id,
        platform,
        url
      }
    }`
    return await fetchFromSanity<{ links: SocialLink[] }>(query);
  } catch (error) {
    console.error('Error fetching social links document from Sanity:', error);
    return null;
  }
}