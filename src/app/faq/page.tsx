'use client';
import React, { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { fetchFromSanity } from "@/lib/sanity";

type FaqItem = { 
  id: string; 
  question: string; 
  answer: string;
  category?: string;
};

// تعريف واجهة للبيانات القادمة من Sanity
interface SanityFaqItem {
  _id: string;
  question: string;
  answer: string;
  category?: string;
}

// مكون FAQ مع جلب البيانات من Sanity
function FaqContent() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFaqs, setFilteredFaqs] = useState<FaqItem[]>([]);
  
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const faqIdFromSearch = searchParams.get("faq");
  
  // Refs & measured heights to animate max-height reliably (avoids cut/jump)
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contentHeights, setContentHeights] = useState<Record<string, string>>({});
  
  // جلب البيانات من Sanity
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setFaqLoading(true);
        // استعلام لجلب جميع الأسئلة الشائعة من Sanity
        const query = `*[_type == "faq"] | order(_createdAt desc) {
          _id,
          question,
          answer,
          category
        }`;
        
        // Fix: Explicitly type the response
        const data = await fetchFromSanity(query) as SanityFaqItem[];
        
        // تحويل البيانات من Sanity إلى الشكل المتوقع
        const formattedFaqs = data.map((item: SanityFaqItem) => ({
          id: item._id,
          question: item.question,
          answer: item.answer,
          category: item.category
        }));
        
        setFaqs(formattedFaqs);
        setFilteredFaqs(formattedFaqs);
        setFaqLoading(false);
      } catch (error) {
        console.error("Error fetching FAQs from Sanity:", error);
        setFaqError(true);
        setFaqLoading(false);
      }
    };
    
    fetchFaqs();
  }, []);
  
  // Measure content heights after faqs render and on resize — keeps animation synchronized
  useEffect(() => {
    function measure() {
      const heights: Record<string, string> = {};
      Object.entries(contentRefs.current).forEach(([id, el]) => {
        if (el) heights[id] = `${el.scrollHeight}px`;
      });
      setContentHeights(heights);
    }
    // measure after a tick to ensure DOM painted
    const t = setTimeout(measure, 30);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [faqs]);
  
  // إضافة useEffect جديد لفتح السؤال تلقائيًا
  useEffect(() => {
    if (faqIdFromSearch && faqs.length > 0) {
      // البحث عن السؤال بالمعرف المحدد
      const faq = faqs.find(f => f.id === faqIdFromSearch);
      if (faq) {
        setOpenFaq(faq.id);
        // التمرير إلى السؤال بعد فتحه
        setTimeout(() => {
          const element = document.getElementById(`faq-${faq.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, [faqIdFromSearch, faqs]);
  
  // Filter FAQs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFaqs(faqs);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = faqs.filter(
        faq => 
          faq.question.toLowerCase().includes(term) || 
          faq.answer.toLowerCase().includes(term)
      );
      setFilteredFaqs(filtered);
    }
  }, [searchTerm, faqs]);
  
  const toggleFaq = (id: string) => {
    // ensure measurement before opening to avoid jump
    const el = contentRefs.current[id];
    if (el) {
      // force measurement
      const h = `${el.scrollHeight}px`;
      setContentHeights((s) => ({ ...s, [id]: h }));
    }
    setOpenFaq((prev) => (prev === id ? null : id));
  };
  
  // إضافة دالة لإعادة تحميل البيانات
  const reloadFaqs = () => {
    setFaqLoading(true);
    setFaqError(false);
    
    const fetchFaqs = async () => {
      try {
        const query = `*[_type == "faq"] | order(_createdAt desc) {
          _id,
          question,
          answer,
          category
        }`;
        
        // Fix: Explicitly type the response
        const data = await fetchFromSanity(query) as SanityFaqItem[];
        
        const formattedFaqs = data.map((item: SanityFaqItem) => ({
          id: item._id,
          question: item.question,
          answer: item.answer,
          category: item.category
        }));
        
        setFaqs(formattedFaqs);
        setFilteredFaqs(formattedFaqs);
        setFaqLoading(false);
      } catch (error) {
        console.error("Error fetching FAQs from Sanity:", error);
        setFaqError(true);
        setFaqLoading(false);
      }
    };
    
    fetchFaqs();
  };
  
  // دالة لتحديث refs بشكل صحيح
  const setContentRef = (id: string) => (el: HTMLDivElement | null) => {
    contentRefs.current[id] = el;
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">الأسئلة الشائعة</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">إجابات على استفساراتكم حول قناتنا العلمية على يوتيوب</p>
          </div>
          <Link 
            href="/contact" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors self-start"
          >
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            العودة لصفحة الاتصال
          </Link>
        </div>
        
        {/* Search Bar */}
        <div className="relative mt-4">
          <input
            type="text"
            placeholder="ابحث عن سؤال..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <svg 
            className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
      </header>
      
      {/* إضافة رسالة توضيحية عند فتح سؤال من البحث */}
      {faqIdFromSearch && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <p className="text-blue-700 dark:text-blue-300 flex items-center">
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            لقد تم فتح السؤال الذي بحثت عنه أدناه
          </p>
        </motion.div>
      )}
      
      <main>
        {faqLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {faqError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <p className="text-red-600 dark:text-red-400">حدث خطأ أثناء تحميل الأسئلة. يرجى المحاولة مرة أخرى لاحقاً.</p>
            <button 
              onClick={reloadFaqs}
              className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        
        {!faqLoading && !faqError && filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">لا توجد أسئلة</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm ? "لا توجد أسئلة تطابق بحثك" : "لا توجد أسئلة شائعة حالياً"}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                عرض جميع الأسئلة
              </button>
            )}
          </div>
        )}
        
        {!faqLoading && !faqError && filteredFaqs.length > 0 && (
          <div className="space-y-4">
            {filteredFaqs.map((f) => {
              const isOpen = openFaq === f.id;
              return (
                <div 
                  key={f.id} 
                  id={`faq-${f.id}`}
                  className={`border rounded-lg overflow-visible bg-white dark:bg-gray-800 transition-all duration-300 ${isOpen ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                >
                  <button
                    onClick={() => toggleFaq(f.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="font-medium text-right text-gray-900 dark:text-gray-100">{f.question || "(بدون عنوان)"}</span>
                    <span className={`ml-3 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M19 15l-7-7-7 7" : "M19 9l-7 7-7 7"} />
                      </svg>
                    </span>
                  </button>
                  
                  {/* Collapsible content using measured max-height to avoid cutting/jump */}
                  <div
                    ref={setContentRef(f.id)}
                    style={{
                      maxHeight: isOpen ? contentHeights[f.id] ?? undefined : 0,
                      overflow: "hidden",
                      transition: reduceMotion ? undefined : "max-height 260ms ease, opacity 200ms ease",
                      opacity: isOpen ? 1 : 0,
                    }}
                    aria-hidden={!isOpen}
                  >
                    <div className="px-4 pb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                      {f.answer ? <div dangerouslySetInnerHTML={{ __html: f.answer }} /> : <p>لا يوجد جواب.</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            لم تجد إجابة لسؤالك؟{" "}
            <Link href="/contact" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              تواصل معنا مباشرة
            </Link>
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {filteredFaqs.length} سؤال من أصل {faqs.length}
          </p>
        </div>
      </footer>
    </div>
  );
}

// المكون الرئيسي مع Suspense boundary
export default function FaqPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    }>
      <FaqContent />
    </Suspense>
  );
}