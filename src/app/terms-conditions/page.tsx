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
import { useLanguage } from '@/components/LanguageProvider'

// كائن الترجمات
const translations = {
  ar: {
    loading: "جاري تحميل البيانات...",
    termsAndConditions: "الشروط والأحكام",
    termsDescription: "يرجى قراءة الشروط والأحكام التالية بعناية قبل استخدام موقعنا",
    lastUpdated: "آخر تحديث:",
    printPage: "طباعة الصفحة",
    legalTerms: "المصطلحات القانونية",
    legalTermsDescription: "تعريف بالمصطلحات الأساسية المستخدمة في هذه الاتفاقية",
    rightsAndResponsibilities: "الحقوق والمسؤوليات",
    rightsDescription: "توضيح لحقوق ومسؤوليات كل من المستخدم والشركة",
    additionalPolicies: "السياسات الإضافية",
    policiesDescription: "سياسات إضافية تنظم استخدام خدماتنا ومنتجاتنا",
    allRightsReserved: "جميع الحقوق محفوظة",
    terms: "الشروط",
    glossary: "المصطلحات",
    rights: "الحقوق",
    policies: "السياسات",
    readMore: "اقرأ المزيد",
    notAvailable: "غير متوفر",
    undefinedTerm: "مصطلح غير محدد",
    noDefinition: "لا يوجد تعريف متاح",
    undefinedSection: "قسم غير محدد",
    undefinedItem: "بند غير محدد",
    undefinedPolicy: "سياسة غير محددة",
    noDescription: "لا يوجد وصف متاح"
  },
  en: {
    loading: "Loading data...",
    termsAndConditions: "Terms & Conditions",
    termsDescription: "Please read the following terms and conditions carefully before using our site",
    lastUpdated: "Last updated:",
    printPage: "Print Page",
    legalTerms: "Legal Terms",
    legalTermsDescription: "Definition of basic terms used in this agreement",
    rightsAndResponsibilities: "Rights & Responsibilities",
    rightsDescription: "Clarification of the rights and responsibilities of both the user and the company",
    additionalPolicies: "Additional Policies",
    policiesDescription: "Additional policies that govern the use of our services and products",
    allRightsReserved: "All rights reserved",
    terms: "Terms",
    glossary: "Glossary",
    rights: "Rights",
    policies: "Policies",
    readMore: "Read More",
    notAvailable: "Not available",
    undefinedTerm: "Undefined term",
    noDefinition: "No definition available",
    undefinedSection: "Undefined section",
    undefinedItem: "Undefined item",
    undefinedPolicy: "Undefined policy",
    noDescription: "No description available"
  }
};

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

// تم تغيير الاسم لتجنب التعارض مع الاستيراد
interface CustomPortableTextBlock {
  _type: 'block'
  _key?: string
  style?: string
  children: PortableTextSpan[]
  markDefs?: PortableTextMarkDef[]
  level?: number
  listItem?: string
}

interface TermsData {
  title?: string
  titleEn?: string
  content?: CustomPortableTextBlock[]  // تم تحديث النوع هنا
  contentEn?: CustomPortableTextBlock[]
  lastUpdated?: string
}

interface LegalTermData {
  _id?: string
  term?: string
  termEn?: string
  definition?: string
  definitionEn?: string
  icon?: string
}

interface RightsData {
  _id?: string
  title?: string
  titleEn?: string
  rightsType?: string
  icon?: string
  items?: { item?: string; itemEn?: string }[]
  color?: string
  borderColor?: string
}

interface PolicyData {
  _id?: string
  title?: string
  titleEn?: string
  description?: string
  descriptionEn?: string
  icon?: string
  linkText?: string
  linkTextEn?: string
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
  siteTitleEn?: string
  siteDescription?: string
  siteDescriptionEn?: string
  logo?: ImageAsset
  footerText?: string
  footerTextEn?: string
}

export default function TermsConditionsPage() {
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  
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
        const terms = await getMainTerms(language)
        const legal = await getLegalTerms(language)
        const rights = await getRightsResponsibilities(language)
        const policies = await getAdditionalPolicies(language)
        // FIX: Cast the result to SiteSettingsData to ensure correct typing
        const settings = await getSiteSettings(language) as SiteSettingsData | null
        
        const transformedTerms = terms ? {
          ...terms,
          content: language === 'ar' ? (terms.content || []) : (terms.contentEn || [])
        } : null
        
        const transformedLegal = legal
          .filter(term => term._id)
          .map(term => ({
            _id: term._id!,
            term: language === 'ar' ? (term.term || '') : (term.termEn || term.term || ''),
            definition: language === 'ar' ? (term.definition || '') : (term.definitionEn || term.definition || ''),
            icon: term.icon || ''
          }))
        
        // Fixed the transformedRights mapping to maintain the correct structure
        const transformedRights = rights
          .filter(right => right._id)
          .map(right => ({
            _id: right._id!,
            title: language === 'ar' ? (right.title || '') : (right.titleEn || right.title || ''),
            rightsType: right.rightsType || '',
            icon: right.icon || '',
            items: (right.items || []).map(item => ({
              item: language === 'ar' ? (item.item || '') : (item.itemEn || item.item || ''),
              itemEn: language === 'ar' ? (item.itemEn || item.item || '') : (item.itemEn || item.item || '')
            })),
            color: right.color || 'bg-blue-50',
            borderColor: right.borderColor || 'border-blue-100'
          }))
        
        const transformedPolicies = policies
          .filter(policy => policy._id)
          .map(policy => ({
            _id: policy._id!,
            title: language === 'ar' ? (policy.title || '') : (policy.titleEn || policy.title || ''),
            description: language === 'ar' ? (policy.description || '') : (policy.descriptionEn || policy.description || ''),
            icon: policy.icon || '',
            linkText: language === 'ar' ? (policy.linkText || '') : (policy.linkTextEn || policy.linkText || ''),
            linkUrl: policy.linkUrl || '#'
          }))
        
        // FIX: Check if settings exists and has the logo property before using it
        const transformedSettings = settings ? {
          siteTitle: language === 'ar' ? (settings.siteTitle || '') : (settings.siteTitleEn || settings.siteTitle || ''),
          siteDescription: language === 'ar' ? (settings.siteDescription || '') : (settings.siteDescriptionEn || settings.siteDescription || ''),
          logo: settings.logo || undefined,
          footerText: language === 'ar' ? (settings.footerText || '') : (settings.footerTextEn || settings.footerText || '')
        } : null
        
        setTermsData(transformedTerms)
        setLegalTerms(transformedLegal)
        setRightsData(transformedRights)
        setPoliciesData(transformedPolicies)
        setSiteSettings(transformedSettings)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [language])
  
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
  
  // التحقق من وجود جزء من الرابط (#)
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      setActiveSection(hash);
      const section = document.getElementById(hash);
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.pushState(null, '', `#${sectionId}`)
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
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-blue-200">{t.loading}</p>
        </div>
      </div>
    )
  }
  
  const formattedLastUpdated = termsData?.lastUpdated 
    ? new Date(termsData.lastUpdated).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') 
    : t.notAvailable;
  
  const baseComponents = portableTextComponents as Partial<PortableTextReactComponents> || {};
  
  const typedComponents: PortableTextReactComponents = {
    block: baseComponents.block || {},
    list: baseComponents.list || {},
    listItem: baseComponents.listItem || {},
    marks: baseComponents.marks || {},
    types: baseComponents.types || {},
    hardBreak: baseComponents.hardBreak || (() => <br />),
    unknownMark: baseComponents.unknownMark || ((props) => <span>{props.children}</span>),
    unknownType: baseComponents.unknownType || ((props) => <div>Unknown type: {props.value._type}</div>),
    unknownBlockStyle: baseComponents.unknownBlockStyle || ((props) => <p>{props.children}</p>),
    unknownList: baseComponents.unknownList || ((props) => <ul>{props.children}</ul>),
    unknownListItem: baseComponents.unknownListItem || ((props) => <li>{props.children}</li>),
  };
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 transition-colors duration-300">
      {/* قائمة التنقل الجانبية */}
      <div className={`fixed ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 z-40 hidden lg:block`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/30 p-4">
          <div className="space-y-3">
            <button 
              onClick={() => scrollToSection('terms')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'terms' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>📄</span>
              <span>{t.terms}</span>
            </button>
            <button 
              onClick={() => scrollToSection('glossary')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'glossary' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>📚</span>
              <span>{t.glossary}</span>
            </button>
            <button 
              onClick={() => scrollToSection('rights')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'rights' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>⚖️</span>
              <span>{t.rights}</span>
            </button>
            <button 
              onClick={() => scrollToSection('policies')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'policies' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>📋</span>
              <span>{t.policies}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* زر العودة للأعلى */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className={`fixed bottom-6 ${isRTL ? 'right-6' : 'left-6'} bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white p-3 rounded-full shadow-lg dark:shadow-gray-900/30 z-40 transition-all duration-300 transform hover:scale-110`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
      
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* رأس الصفحة */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4 text-blue-900 dark:text-blue-200">{t.termsAndConditions}</h1>
          <div className="w-24 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
            {t.termsDescription}
          </p>
          <div className="mt-4">
            <span className="text-gray-600 dark:text-blue-300">
              {t.lastUpdated} {formattedLastUpdated}
            </span>
          </div>
          <button 
            onClick={handlePrint}
            className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full inline-flex items-center transition duration-300 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            {t.printPage}
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
                components={typedComponents} 
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
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">{t.legalTerms}</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              {t.legalTermsDescription}
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
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">{term.term || t.undefinedTerm}</h3>
                </div>
                <div className={`overflow-hidden transition-all duration-500 ${expandedTerms.includes(index) ? 'max-h-96' : 'max-h-0'}`}>
                  <p className="text-gray-700 dark:text-blue-100">{term.definition || t.noDefinition}</p>
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
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">{t.rightsAndResponsibilities}</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              {t.rightsDescription}
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
                  <h3 className="font-bold text-lg dark:text-blue-200">{section.title || t.undefinedSection}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items?.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 ml-2 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-blue-100">
                        {language === 'ar' ? item.item : item.itemEn || item.item}
                      </span>
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
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">{t.additionalPolicies}</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              {t.policiesDescription}
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
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">{policy.title || t.undefinedPolicy}</h3>
                </div>
                <p className="text-gray-700 dark:text-blue-100 mb-4">{policy.description || t.noDescription}</p>
                <a 
                  href={policy.linkUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center transition-colors duration-300"
                >
                  {policy.linkText || t.readMore}
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
          <p>{siteSettings?.footerText || `© 2025 ${t.allRightsReserved}`}</p>
          <p className="mt-2">
            {t.lastUpdated} {formattedLastUpdated}
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