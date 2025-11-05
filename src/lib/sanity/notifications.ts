// src/lib/sanity/notifications.ts

// =================================================================
// Imports
// =================================================================
import { fetchArrayFromSanity, fetchFromSanity, createDocument, updateDocument, deleteDocument } from './client'
// استيراد كل الأنواع من ملف types المركزي
import { NotificationItem, Episode, Article, Playlist, TeamMember, HeroSlider, SocialLinks, TermsContent, PrivacyContent } from './types'
import { FAQ } from './faqs' // Using the FAQ type from the faqs module

// =================================================================
// Notifications Logic
// =================================================================
export async function getAllNotifications(language: string = 'ar'): Promise<NotificationItem[]> {
  try {
    const episodesQuery = `*[_type == "episode"] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      publishedAt,
      _createdAt,
      thumbnailUrl,
      thumbnailUrlEn,
      "slug": slug.current,
      "type": "episode"
    }`;
    const episodes = await fetchArrayFromSanity<Episode & { type: string; slug: string }>(episodesQuery);

    const articlesQuery = `*[_type == "article"] | order(publishedAt desc) {
      _id,
      title,
      titleEn,
      excerpt,
      excerptEn,
      publishedAt,
      _createdAt,
      featuredImageUrl,
      featuredImageUrlEn,
      "slug": slug.current,
      "type": "article"
    }`;
    const articles = await fetchArrayFromSanity<Article & { type: string; slug: string }>(articlesQuery);

    const playlistsQuery = `*[_type == "playlist"] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      _createdAt,
      imageUrl,
      imageUrlEn,
      "slug": slug.current,
      "type": "playlist"
    }`;
    const playlists = await fetchArrayFromSanity<Playlist & { type: string; slug: string }>(playlistsQuery);

    const faqsQuery = `*[_type == "faq"] | order(_createdAt desc) {
      _id,
      question,
      questionEn,
      answer,
      answerEn,
      category,
      categoryEn,
      _createdAt,
      "type": "faq"
    }`;
    const faqs = await fetchArrayFromSanity<FAQ & { type: string }>(faqsQuery);

    const termsQuery = `*[_type == "termsContent" && sectionType == 'mainTerms'] | order(_createdAt desc) {   
      _id,
      title,
      titleEn,
      _createdAt,
      lastUpdated,
      "type": "terms"
    }`;
    const terms = await fetchArrayFromSanity<TermsContent & { type: string }>(termsQuery);

    const privacyQuery = `*[_type == "privacyContent" && sectionType == 'mainPolicy'] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      _createdAt,
      lastUpdated,
      "type": "privacy"
    }`;
    const privacy = await fetchArrayFromSanity<PrivacyContent & { type: string }>(privacyQuery);

    const teamQuery = `*[_type == "teamMember"] | order(_createdAt desc) {
      _id,
      name,
      nameEn,
      bio,
      bioEn,
      _createdAt,
      imageUrl,
      imageUrlEn,
      "slug": slug.current,
      "type": "team"
    }`;
    const teamMembers = await fetchArrayFromSanity<TeamMember & { type: string; slug: string }>(teamQuery);

    const heroSliderQuery = `*[_type == "heroSlider"] | order(_createdAt desc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      _createdAt,
      image,
      imageEn,
      mediaType,
      "type": "heroSlider"
    }`;
    const heroSliders = await fetchArrayFromSanity<HeroSlider & { type: string }>(heroSliderQuery);

    const socialLinksQuery = `*[_type == "socialLinks"] | order(_createdAt desc) {
      _id,
      links,
      _createdAt,
      "type": "socialLinks"
    }`;
    const socialLinks = await fetchArrayFromSanity<SocialLinks & { type: string }>(socialLinksQuery);

    const getLocalizedText = (arText?: string, enText?: string): string => {
      return language === 'ar' ? (arText || '') : (enText || '');
    };

    const getLocalizedImageUrl = (arUrl?: string, enUrl?: string): string | undefined => {
      return language === 'ar' ? arUrl : enUrl;
    };

    const getValidDate = (date1?: string, date2?: string) => {
      const date = date1 || date2;
      if (!date) return new Date().toISOString();
      const d = new Date(date);
      if (isNaN(d.getTime())) return new Date().toISOString();
      return date;
    };

    const episodeNotifications: NotificationItem[] = episodes.map(ep => ({
      id: ep._id,
      type: 'episode' as const,
      title: getLocalizedText(ep.title, ep.titleEn),
      description: getLocalizedText(ep.description, ep.descriptionEn),
      date: getValidDate(ep.publishedAt, ep._createdAt),
      imageUrl: getLocalizedImageUrl(ep.thumbnailUrl, ep.thumbnailUrlEn),
      linkUrl: `/episodes/${ep.slug}`
    }));

    const articleNotifications: NotificationItem[] = articles.map(article => ({
      id: article._id,
      type: 'article' as const,
      title: getLocalizedText(article.title, article.titleEn),
      description: getLocalizedText(article.excerpt, article.excerptEn),
      date: getValidDate(article.publishedAt, article._createdAt),
      imageUrl: getLocalizedImageUrl(article.featuredImageUrl, article.featuredImageUrlEn),
      linkUrl: `/articles/${article.slug}`
    }));

    const playlistNotifications: NotificationItem[] = playlists.map(playlist => ({
      id: playlist._id || '',
      type: 'playlist' as const,
      title: getLocalizedText(playlist.title, playlist.titleEn),
      description: getLocalizedText(playlist.description, playlist.descriptionEn),
      date: getValidDate(playlist._createdAt),
      imageUrl: getLocalizedImageUrl(playlist.imageUrl, playlist.imageUrlEn),
      linkUrl: `/playlists/${playlist.slug}`
    }));

    const faqNotifications: NotificationItem[] = faqs.map(faq => ({
      id: faq._id || '',
      type: 'faq' as const,
      title: getLocalizedText(faq.question, faq.questionEn),
      description: getLocalizedText(faq.answer, faq.answerEn),
      date: getValidDate(faq._createdAt),
      imageUrl: undefined,
      linkUrl: `/faq?faq=${faq._id}`
    }));

    const termsNotifications: NotificationItem[] = terms.map(term => ({
      id: term._id || '',
      type: 'terms' as const,
      title: getLocalizedText(term.title, term.titleEn) || (language === 'ar' ? 'شروط وأحكام' : 'Terms & Conditions'),
      description: language === 'ar' ? 'تم تحديث شروط وأحكام الموقع' : 'Site terms and conditions have been updated',
      date: getValidDate(term.lastUpdated, term._createdAt),
      imageUrl: undefined,
      linkUrl: `/terms#${term._id}`
    }));

    const privacyNotifications: NotificationItem[] = privacy.map(priv => ({
      id: priv._id || '',
      type: 'privacy' as const,
      title: getLocalizedText(priv.title, priv.titleEn) || (language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'),
      description: language === 'ar' ? 'تم تحديث سياسة الخصوصية' : 'Privacy policy has been updated',
      date: getValidDate(priv.lastUpdated, priv._createdAt),
      imageUrl: undefined,
      linkUrl: `/privacy#${priv._id}`
    }));

    const teamNotifications: NotificationItem[] = teamMembers.map(member => ({
      id: member._id || '',
      type: 'team' as const,
      title: language === 'ar' ? `عضو جديد في الفريق: ${getLocalizedText(member.name, member.nameEn)}` : `New team member: ${getLocalizedText(member.name, member.nameEn)}`,
      description: getLocalizedText(member.bio, member.bioEn),
      date: getValidDate(member._createdAt),
      imageUrl: getLocalizedImageUrl(member.imageUrl, member.imageUrlEn),
      linkUrl: `/team/${member.slug}`
    }));

    const heroSliderNotifications: NotificationItem[] = heroSliders.map(slider => ({
      id: slider._id || '',
      type: 'heroSlider' as const,
      title: language === 'ar' ? `تحديث الشريحة الرئيسية: ${getLocalizedText(slider.title, slider.titleEn)}` : `Hero Slider Update: ${getLocalizedText(slider.title, slider.titleEn)}`,
      description: getLocalizedText(slider.description, slider.descriptionEn),
      date: getValidDate(slider._createdAt),
      imageUrl: getLocalizedImageUrl(slider.image, slider.imageEn),
      linkUrl: `/`
    }));

    const socialLinksNotifications: NotificationItem[] = socialLinks.map(links => {
      const linkCount = links.links ? links.links.length : 0;
      return {
        id: links._id || '',
        type: 'socialLinks' as const,
        title: language === 'ar' ? `تحديث الروابط الاجتماعية` : `Social Links Updated`,
        description: language === 'ar' ? `تم تحديث ${linkCount} رابط اجتماعي` : `${linkCount} social links have been updated`,
        date: getValidDate(links._createdAt),
        imageUrl: undefined,
        linkUrl: `/contact`
      };
    });

    const allNotifications: NotificationItem[] = [
      ...episodeNotifications,
      ...articleNotifications,
      ...playlistNotifications,
      ...faqNotifications,
      ...termsNotifications,
      ...privacyNotifications,
      ...teamNotifications,
      ...heroSliderNotifications,
      ...socialLinksNotifications
    ];

    return allNotifications.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}


// =================================================================
// FAQ Logic
// =================================================================

// دوال للتعامل مع الأسئلة الشائعة (FAQ) مع دعم اللغة
// Note: The 'FAQ' interface is now imported from './faqs' at the top of the file.

export async function fetchFaqs(language: string = 'ar'): Promise<FAQ[]> {
  try {
    const query = `*[_type == "faq"] | order(_createdAt desc) {
      _id,
      question,
      questionEn,
      answer,
      answerEn,
      category,
      categoryEn
    }`;
    const faqs = await fetchArrayFromSanity<FAQ>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return faqs.map(faq => ({
      ...faq,
      localizedQuestion: language === 'ar' ? faq.question : faq.questionEn,
      localizedAnswer: language === 'ar' ? faq.answer : faq.answerEn,
      localizedCategory: language === 'ar' ? faq.category : faq.categoryEn
    }));
  } catch (error) {
    console.error('Error fetching FAQs from Sanity:', error);
    return [];
  }
}

export async function fetchFaqById(id: string): Promise<FAQ | null> {
  try {
    const query = `*[_type == "faq" && _id == $id][0]{
      _id,
      question,
      questionEn,
      answer,
      answerEn,
      category,
      categoryEn
    }`;
    return await fetchFromSanity<FAQ>(query, { id });
  } catch (error) {
    console.error('Error fetching FAQ by ID from Sanity:', error);
    return null;
  }
}

export async function createFaq(faqData: Omit<FAQ, '_id' | '_type' | 'localizedQuestion' | 'localizedAnswer' | 'localizedCategory'>): Promise<FAQ> {
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

// دالة لجلب الفئات المتاحة
export async function fetchCategories(language: string = 'ar'): Promise<string[]> {
  try {
    const faqs = await fetchFaqs(language);
    const categoryField = language === 'ar' ? 'category' : 'categoryEn';
    // تعديل: تصفية القيم غير المعرّفة وتحويلها إلى مصفوفة من النوع string[]
    const categories = [...new Set(
      faqs
        .map(faq => faq[categoryField])
        .filter((cat): cat is string => Boolean(cat))
    )];
    return categories;
  } catch (error) {
    console.error('Error fetching categories from Sanity:', error);
    return [];
  }
}

// دالة لجلب الأسئلة الشائعة حسب الفئة
export async function fetchFaqsByCategory(category: string, language: string = 'ar'): Promise<FAQ[]> {
  try {
    const categoryField = language === 'ar' ? 'category' : 'categoryEn';
    const query = `*[_type == "faq" && ${categoryField} == $category] | order(_createdAt desc) {
      _id,
      question,
      questionEn,
      answer,
      answerEn,
      category,
      categoryEn
    }`;
    const faqs = await fetchArrayFromSanity<FAQ>(query, { category });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return faqs.map(faq => ({
      ...faq,
      localizedQuestion: language === 'ar' ? faq.question : faq.questionEn,
      localizedAnswer: language === 'ar' ? faq.answer : faq.answerEn,
      localizedCategory: language === 'ar' ? faq.category : faq.categoryEn
    }));
  } catch (error) {
    console.error('Error fetching FAQs by category from Sanity:', error);
    return [];
  }
}