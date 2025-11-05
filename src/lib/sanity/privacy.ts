import { fetchArrayFromSanity, fetchFromSanity, createDocument, updateDocument, deleteDocument } from './client'
import { PortableTextBlock, PrivacyContent } from './types' // Import PrivacyContent from types

// The local PrivacyContent interface has been removed to avoid conflicts.

// دوال للتعامل مع سياسة الخصوصية مع دعم اللغة
export async function getPrivacyPolicy(language: string = 'ar'): Promise<PrivacyContent | null> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == 'mainPolicy'][0] {
      title,
      titleEn,
      content,
      contentEn,
      lastUpdated
    }`
    const result = await fetchFromSanity<PrivacyContent>(query);
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedTitle: language === 'ar' ? result.title : result.titleEn,
      localizedContent: language === 'ar' ? result.content : result.contentEn
    };
  } catch (error) {
    console.error('Error fetching privacy policy from Sanity:', error);
    return null;
  }
}

export async function getUserRights(language: string = 'ar'): Promise<PrivacyContent[]> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == 'userRight'] | order(title asc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      icon
    }`
    const rights = await fetchArrayFromSanity<PrivacyContent>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return rights.map(right => ({
      ...right,
      localizedTitle: language === 'ar' ? right.title : right.titleEn,
      localizedDescription: language === 'ar' ? right.description : right.descriptionEn
    }));
  } catch (error) {
    console.error('Error fetching user rights from Sanity:', error);
    return [];
  }
}

export async function getDataTypes(language: string = 'ar'): Promise<PrivacyContent[]> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == "dataType"] | order(title asc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      icon,
      color,
      textColor
    }`
    const dataTypes = await fetchArrayFromSanity<PrivacyContent>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return dataTypes.map(dataType => ({
      ...dataType,
      localizedTitle: language === 'ar' ? dataType.title : dataType.titleEn,
      localizedDescription: language === 'ar' ? dataType.description : dataType.descriptionEn
    }));
  } catch (error) {
    console.error('Error fetching data types from Sanity:', error);
    return [];
  }
}

export async function getSecurityMeasures(language: string = 'ar'): Promise<PrivacyContent[]> {
  try {
    const query = `*[_type == "privacyContent" && sectionType == "securityMeasure"] | order(title asc) {
      _id,
      title,
      titleEn,
      description,
      descriptionEn,
      icon
    }`
    const measures = await fetchArrayFromSanity<PrivacyContent>(query);
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return measures.map(measure => ({
      ...measure,
      localizedTitle: language === 'ar' ? measure.title : measure.titleEn,
      localizedDescription: language === 'ar' ? measure.description : measure.descriptionEn
    }));
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
    const result = await createDocument({
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
    const result = await updateDocument<PrivacyContent>(privacyId, privacyData);
    return result;
  } catch (error) {
    console.error('Error updating privacy content in Sanity:', error);
    throw error;
  }
}

export async function deletePrivacyContent(privacyId: string): Promise<void> {
  try {
    await deleteDocument(privacyId);
  } catch (error) {
    console.error('Error deleting privacy content in Sanity:', error);
    throw error;
  }
}