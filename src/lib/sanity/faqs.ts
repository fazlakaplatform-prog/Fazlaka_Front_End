import { fetchArrayFromSanity, fetchFromSanity, createDocument, updateDocument, deleteDocument } from './client'

// دوال للتعامل مع الأسئلة الشائعة (FAQ) مع دعم اللغة
export interface FAQ {
  _id?: string
  _type: 'faq'
  question: string
  questionEn?: string
  answer: string
  answerEn?: string
  category: string
  categoryEn?: string
  localizedQuestion?: string
  localizedAnswer?: string
  localizedCategory?: string
  _createdAt?: string
}

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