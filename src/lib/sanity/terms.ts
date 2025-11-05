import { fetchArrayFromSanity, fetchFromSanity, createDocument, updateDocument, deleteDocument } from './client'
import { PortableTextBlock, TermsContent } from './types' // استيراد الواجهة المركزية

// تم حذف الواجهة المكررة 'TermsContent' من هنا

// دوال جديدة للتعامل مع محتوى الشروط والأحكام مع دعم اللغة
export async function getAllTermsContent(language: string = 'ar'): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent"] | order(sectionType asc, title asc) {
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
      logoEn,
      footerText,
      footerTextEn,
      lastUpdated
    }`
    const terms = await fetchArrayFromSanity<TermsContent>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return terms.map(term => ({
      ...term,
      localizedTitle: language === 'ar' ? term.title : term.titleEn,
      localizedContent: language === 'ar' ? term.content : term.contentEn,
      localizedTerm: language === 'ar' ? term.term : term.termEn,
      localizedDefinition: language === 'ar' ? term.definition : term.definitionEn,
      localizedDescription: language === 'ar' ? term.description : term.descriptionEn,
      localizedLinkText: language === 'ar' ? term.linkText : term.linkTextEn,
      localizedSiteTitle: language === 'ar' ? term.siteTitle : term.siteTitleEn,
      localizedSiteDescription: language === 'ar' ? term.siteDescription : term.siteDescriptionEn,
      localizedFooterText: language === 'ar' ? term.footerText : term.footerTextEn,
      localizedLogo: language === 'ar' ? term.logo : term.logoEn
    }));
  } catch (error) {
    console.error('Error fetching all terms content from Sanity:', error);
    return [];
  }
}

// جلب شروط وأحكام الموقع الرئيسية مع دعم اللغة
export async function getMainTerms(language: string = 'ar'): Promise<TermsContent | null> {
  try {
    const query = `*[_type == "termsContent" && sectionType == 'mainTerms'][0] {
      _id,
      title,
      titleEn,
      content,
      contentEn,
      lastUpdated
    }`
    const result = await fetchFromSanity<TermsContent>(query);
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedTitle: language === 'ar' ? result.title : result.titleEn,
      localizedContent: language === 'ar' ? result.content : result.contentEn
    };
  } catch (error) {
    console.error('Error fetching main terms from Sanity:', error);
    return null;
  }
}

// جلب المصطلحات القانونية مع دعم اللغة
export async function getLegalTerms(language: string = 'ar'): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent" && sectionType == 'legalTerm'] | order(term asc) {
      _id,
      term,
      termEn,
      definition,
      definitionEn,
      icon
    }`
    const terms = await fetchArrayFromSanity<TermsContent>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return terms.map(term => ({
      ...term,
      localizedTerm: language === 'ar' ? term.term : term.termEn,
      localizedDefinition: language === 'ar' ? term.definition : term.definitionEn
    }));
  } catch (error) {
    console.error('Error fetching legal terms from Sanity:', error);
    return [];
  }
}

// جلب الحقوق والمسؤوليات مع دعم اللغة
export async function getRightsResponsibilities(language: string = 'ar'): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent" && sectionType == 'rightsResponsibility'] | order(rightsType asc, title asc) {
      _id,
      title,
      titleEn,
      rightsType,
      icon,
      items,
      color,
      borderColor
    }`
    const rights = await fetchArrayFromSanity<TermsContent>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return rights.map(right => ({
      ...right,
      localizedTitle: language === 'ar' ? right.title : right.titleEn,
      localizedItems: language === 'ar' ? 
        right.items?.map(item => item.item) : 
        right.items?.map(item => item.itemEn || item.item)
    }));
  } catch (error) {
    console.error('Error fetching rights and responsibilities from Sanity:', error);
    return [];
  }
}

// جلب السياسات الإضافية مع دعم اللغة
export async function getAdditionalPolicies(language: string = 'ar'): Promise<TermsContent[]> {
  try {
    const query = `*[_type == "termsContent" && sectionType == 'additionalPolicy'] | order(title asc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      icon,
      linkText,
      linkTextEn,
      linkUrl
    }`
    const policies = await fetchArrayFromSanity<TermsContent>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return policies.map(policy => ({
      ...policy,
      localizedTitle: language === 'ar' ? policy.title : policy.titleEn,
      localizedDescription: language === 'ar' ? policy.description : policy.descriptionEn,
      localizedLinkText: language === 'ar' ? policy.linkText : policy.linkTextEn
    }));
  } catch (error) {
    console.error('Error fetching additional policies from Sanity:', error);
    return [];
  }
}

// جلب إعدادات الموقع مع دعم اللغة
export async function getSiteSettings(language: string = 'ar'): Promise<TermsContent | null> {
  try {
    const query = `*[_type == "termsContent" && sectionType == 'siteSettings'][0]{
      siteTitle,
      siteTitleEn,
      siteDescription,
      siteDescriptionEn,
      logo,
      logoEn,
      footerText,
      footerTextEn
    }`
    const result = await fetchFromSanity<TermsContent>(query);
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedSiteTitle: language === 'ar' ? result.siteTitle : result.siteTitleEn,
      localizedSiteDescription: language === 'ar' ? result.siteDescription : result.siteDescriptionEn,
      localizedFooterText: language === 'ar' ? result.footerText : result.footerTextEn,
      localizedLogo: language === 'ar' ? result.logo : result.logoEn
    };
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