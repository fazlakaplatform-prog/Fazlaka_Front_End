// app/terms-conditions/page.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { PortableText, PortableTextReactComponents } from '@portabletext/react'
import { 
  getMainTerms, 
  getLegalTerms, 
  getRightsResponsibilities, 
  getAdditionalPolicies, 
  getSiteSettings 
} from '@/lib/sanity'
import { portableTextComponents } from '@/components/portable-text/PortableTextComponents'

// واجهات البيانات من Sanity
interface PortableTextMarkDef {
  _key?: string
  _type: string
  href?: string
  [key: string]: unknown
}

interface PortableTextSpan {
  _type: 'span'
  text: string
  marks?: string[]
}

interface PortableTextBlock {
  _type: 'block'
  _key?: string
  style?: string
  children: PortableTextSpan[]
  markDefs?: PortableTextMarkDef[]
  level?: number
  listItem?: string
}

// تعديل واجهة TermsData لتتوافق مع البيانات الفعلية
interface TermsData {
  title?: string
  content?: PortableTextBlock[]
  lastUpdated?: string
}

interface LegalTermData {
  _id?: string
  term?: string
  definition?: string
  icon?: string
}

interface RightsData {
  _id?: string
  title?: string
  rightsType?: string
  icon?: string
  items?: { item?: string }[]
  color?: string
  borderColor?: string
}

interface PolicyData {
  _id?: string
  title?: string
  description?: string
  icon?: string
  linkText?: string
  linkUrl?: string
}

interface ImageAsset {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  alt?: string
  caption?: string
}

interface SiteSettingsData {
  siteTitle?: string
  siteDescription?: string
  logo?: ImageAsset
  footerText?: string
}

export default function TermsConditionsPage() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeSection, setActiveSection] = useState('terms')
  const [expandedTerms, setExpandedTerms] = useState<number[]>([])
  
  const [termsData, setTermsData] = useState<TermsData | null>(null)
  const [legalTerms, setLegalTerms] = useState<LegalTermData[]>([])
  const [rightsData, setRightsData] = useState<RightsData[]>([])
  const [policiesData, setPoliciesData] = useState<PolicyData[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  
  const termsRef = useRef<HTMLDivElement>(null)
  const glossaryRef = useRef<HTMLDivElement>(null)
  const rightsRef = useRef<HTMLDivElement>(null)
  const policiesRef = useRef<HTMLDivElement>(null)
  
  // جلب البيانات من Sanity
  useEffect(() => {
    const fetchData = async () => {
      try {
        const terms = await getMainTerms()
        const legal = await getLegalTerms()
        const rights = await getRightsResponsibilities()
        const policies = await getAdditionalPolicies()
        const settings = await getSiteSettings()
        
        setTermsData(terms)
        setLegalTerms(legal)
        setRightsData(rights)
        setPoliciesData(policies)
        setSiteSettings(settings)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // مراقبة التمرير
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
      
      const sections = [
        { id: 'terms', ref: termsRef },
        { id: 'glossary', ref: glossaryRef },
        { id: 'rights', ref: rightsRef },
        { id: 'policies', ref: policiesRef }
      ]
      
      for (const section of sections) {
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  
  const toggleTerm = (index: number) => {
    if (expandedTerms.includes(index)) {
      setExpandedTerms(expandedTerms.filter(i => i !== index))
    } else {
      setExpandedTerms([...expandedTerms, index])
    }
  }
  
  const handlePrint = () => {
    window.print()
  }
  
  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-blue-200">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 transition-colors duration-300">
      {/* قائمة التنقل الجانبية */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/30 p-4">
          <div className="space-y-3">
            <button 
              onClick={() => scrollToSection('terms')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'terms' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className="ml-2">📄</span>
              <span>الشروط</span>
            </button>
            <button 
              onClick={() => scrollToSection('glossary')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'glossary' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className="ml-2">📚</span>
              <span>المصطلحات</span>
            </button>
            <button 
              onClick={() => scrollToSection('rights')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'rights' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className="ml-2">⚖️</span>
              <span>الحقوق</span>
            </button>
            <button 
              onClick={() => scrollToSection('policies')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'policies' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className="ml-2">📋</span>
              <span>السياسات</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* زر العودة للأعلى */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white p-3 rounded-full shadow-lg dark:shadow-gray-900/30 z-40 transition-all duration-300 transform hover:scale-110"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
      
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* رأس الصفحة */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4 text-blue-900 dark:text-blue-200">الشروط والأحكام</h1>
          <div className="w-24 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
            يرجى قراءة الشروط والأحكام التالية بعناية قبل استخدام موقعنا
          </p>
          <div className="mt-4">
            <span className="text-gray-600 dark:text-blue-300">
              آخر تحديث: {termsData?.lastUpdated ? new Date(termsData.lastUpdated).toLocaleDateString('ar-EG') : 'غير متوفر'}
            </span>
          </div>
          <button 
            onClick={handlePrint}
            className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full inline-flex items-center transition duration-300 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            طباعة الصفحة
          </button>
        </div>
        
        {/* محتوى الشروط والأحكام */}
        {termsData && termsData.content && (
          <div 
            id="terms" 
            ref={termsRef}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
          >
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-blue-900 dark:prose-headings:text-blue-200 prose-p:text-gray-700 dark:prose-p:text-blue-100 prose-strong:text-blue-800 dark:prose-strong:text-blue-200">
              <PortableText 
                value={termsData.content} 
                // استخدام النوع الصحيح للمكونات
                components={portableTextComponents as Partial<PortableTextReactComponents>} 
              />
            </div>
          </div>
        )}
        
        {/* قسم المصطلحات القانونية */}
        <div 
          id="glossary" 
          ref={glossaryRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">المصطلحات القانونية</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              تعريف بالمصطلحات الأساسية المستخدمة في هذه الاتفاقية
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {legalTerms.map((term, index) => (
              <div 
                key={term._id || index}
                className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${expandedTerms.includes(index) ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                onClick={() => toggleTerm(index)}
              >
                <div className="flex items-center mb-3">
                  <div className="text-3xl mr-3">{term.icon || '📝'}</div>
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">{term.term || 'مصطلح غير محدد'}</h3>
                </div>
                <div className={`overflow-hidden transition-all duration-500 ${expandedTerms.includes(index) ? 'max-h-96' : 'max-h-0'}`}>
                  <p className="text-gray-700 dark:text-blue-100">{term.definition || 'لا يوجد تعريف متاح'}</p>
                </div>
                <div className="mt-4 text-left">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 ${expandedTerms.includes(index) ? 'transform rotate-180' : ''}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* قسم الحقوق والمسؤوليات */}
        <div 
          id="rights" 
          ref={rightsRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">الحقوق والمسؤوليات</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              توضيح لحقوق ومسؤوليات كل من المستخدم والشركة
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rightsData.map((section, index) => (
              <div 
                key={section._id || index}
                className={`${section.color || 'bg-blue-50'} ${section.borderColor || 'border-blue-100'} dark:bg-gray-700 dark:border-gray-600 rounded-xl p-6 border transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{section.icon || '⚖️'}</div>
                  <h3 className="font-bold text-lg dark:text-blue-200">{section.title || 'قسم غير محدد'}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items?.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 ml-2 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-blue-100">{item.item || 'بند غير محدد'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {/* قسم السياسات الإضافية */}
        <div 
          id="policies" 
          ref={policiesRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">السياسات الإضافية</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              سياسات إضافية تنظم استخدام خدماتنا ومنتجاتنا
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policiesData.map((policy, index) => (
              <div 
                key={policy._id || index}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{policy.icon || '📋'}</div>
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">{policy.title || 'سياسة غير محددة'}</h3>
                </div>
                <p className="text-gray-700 dark:text-blue-100 mb-4">{policy.description || 'لا يوجد وصف متاح'}</p>
                <a 
                  href={policy.linkUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center transition-colors duration-300"
                >
                  {policy.linkText || 'اقرأ المزيد'}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
        
        {/* تذييل الصفحة */}
        <div className="text-center text-gray-600 dark:text-blue-300 text-sm animate-fade-in">
          <p>{siteSettings?.footerText || '© 2025 جميع الحقوق محفوظة'}</p>
          <p className="mt-2">
            آخر تحديث: {termsData?.lastUpdated ? new Date(termsData.lastUpdated).toLocaleDateString('ar-EG') : 'غير متوفر'}
          </p>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}