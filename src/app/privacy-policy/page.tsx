// app/privacy-policy/page.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { PortableText, PortableTextReactComponents } from '@portabletext/react'
import { PortableTextBlock } from '@portabletext/types'
import { 
  getPrivacyPolicy, 
  getUserRights, 
  getDataTypes, 
  getSecurityMeasures 
} from '@/lib/sanity'
import { portableTextComponents } from '@/components/portable-text/PortableTextComponents'

// واجهات البيانات من Sanity
interface PrivacyPolicyData {
  title?: string
  content?: PortableTextBlock[]
  lastUpdated?: string
}

interface UserRightData {
  _id: string
  title: string
  description: string
  icon: string
}

interface DataTypeData {
  _id: string
  title: string
  description: string
  icon: string
  color: string
  textColor: string
}

interface SecurityMeasureData {
  _id: string
  title: string
  description: string
  icon: string
}

export default function PrivacyPolicyPage() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeSection, setActiveSection] = useState('policy')
  const [expandedRights, setExpandedRights] = useState<number | null>(null)
  
  const [privacyData, setPrivacyData] = useState<PrivacyPolicyData | null>(null)
  const [userRights, setUserRights] = useState<UserRightData[]>([])
  const [dataTypes, setDataTypes] = useState<DataTypeData[]>([])
  const [securityMeasures, setSecurityMeasures] = useState<SecurityMeasureData[]>([])
  const [loading, setLoading] = useState(true)
  
  const policyRef = useRef<HTMLDivElement>(null)
  const rightsRef = useRef<HTMLDivElement>(null)
  const dataRef = useRef<HTMLDivElement>(null)
  const securityRef = useRef<HTMLDivElement>(null)
  
  // جلب البيانات من Sanity
  useEffect(() => {
    const fetchData = async () => {
      try {
        const privacy = await getPrivacyPolicy()
        const rights = await getUserRights()
        const types = await getDataTypes()
        const security = await getSecurityMeasures()
        
        // Transform the privacy data
        const transformedPrivacy = privacy ? {
          ...privacy,
          content: privacy.content || []
        } : null
        
        // Transform the user rights data
        const transformedRights = rights
          .filter(right => right._id) // Filter out items without _id
          .map(right => ({
            _id: right._id!,
            title: right.title || '',
            description: right.description || '',
            icon: right.icon || ''
          }))
        
        // Transform the data types
        const transformedTypes = types
          .filter(type => type._id) // Filter out items without _id
          .map(type => ({
            _id: type._id!,
            title: type.title || '',
            description: type.description || '',
            icon: type.icon || '',
            color: type.color || 'bg-blue-50',
            textColor: type.textColor || 'text-blue-800'
          }))
        
        // Transform the security measures
        const transformedSecurity = security
          .filter(measure => measure._id) // Filter out items without _id
          .map(measure => ({
            _id: measure._id!,
            title: measure.title || '',
            description: measure.description || '',
            icon: measure.icon || ''
          }))
        
        setPrivacyData(transformedPrivacy)
        setUserRights(transformedRights)
        setDataTypes(transformedTypes)
        setSecurityMeasures(transformedSecurity)
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
        { id: 'policy', ref: policyRef },
        { id: 'rights', ref: rightsRef },
        { id: 'data', ref: dataRef },
        { id: 'security', ref: securityRef }
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
  
  const toggleRight = (index: number) => {
    if (expandedRights === index) {
      setExpandedRights(null)
    } else {
      setExpandedRights(index)
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
  
  // Format the last updated date safely
  const formattedLastUpdated = privacyData?.lastUpdated 
    ? new Date(privacyData.lastUpdated).toLocaleDateString('ar-EG') 
    : '';
  
  // Create a properly typed components object with all required properties
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
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 transition-colors duration-300">
      {/* قائمة التنقل الجانبية */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/30 p-4">
          <div className="space-y-3">
            <button 
              onClick={() => scrollToSection('policy')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'policy' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className="ml-2">📄</span>
              <span>السياسة</span>
            </button>
            <button 
              onClick={() => scrollToSection('rights')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'rights' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className="ml-2">👤</span>
              <span>الحقوق</span>
            </button>
            <button 
              onClick={() => scrollToSection('data')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'data' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className="ml-2">📊</span>
              <span>البيانات</span>
            </button>
            <button 
              onClick={() => scrollToSection('security')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'security' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className="ml-2">🔒</span>
              <span>الأمان</span>
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
          <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-blue-900 dark:text-blue-200">سياسة الخصوصية</h1>
          <div className="w-24 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
            نحن نلتزم بحماية خصوصيتك وبياناتك الشخصية. يرجى قراءة سياسة الخصوصية التالية بعناية.
          </p>
          <div className="mt-4">
            <span className="text-gray-600 dark:text-blue-300">آخر تحديث: {formattedLastUpdated}</span>
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
        
        {/* محتوى سياسة الخصوصية */}
        {privacyData && privacyData.content && (
          <div 
            id="policy" 
            ref={policyRef}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
          >
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-blue-900 dark:prose-headings:text-blue-200 prose-p:text-gray-700 dark:prose-p:text-blue-100 prose-strong:text-blue-800 dark:prose-strong:text-blue-200">
              <PortableText value={privacyData.content} components={typedComponents} />
            </div>
          </div>
        )}
        
        {/* قسم حقوق المستخدم */}
        <div 
          id="rights" 
          ref={rightsRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">حقوق المستخدم</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              تعرف على حقوقك فيما يتعلق ببياناتك الشخصية وكيفية ممارستها
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRights.map((right, index) => (
              <div 
                key={right._id}
                className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${expandedRights === index ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                onClick={() => toggleRight(index)}
              >
                <div className="flex items-center mb-3">
                  <div className="text-3xl mr-3">{right.icon}</div>
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">{right.title}</h3>
                </div>
                <div className={`overflow-hidden transition-all duration-500 ${expandedRights === index ? 'max-h-96' : 'max-h-0'}`}>
                  <p className="text-gray-700 dark:text-blue-100">{right.description}</p>
                </div>
                <div className="mt-4 text-left">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 ${expandedRights === index ? 'transform rotate-180' : ''}`} 
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
        
        {/* قسم أنواع البيانات */}
        <div 
          id="data" 
          ref={dataRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">أنواع البيانات التي نجمعها</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              نوضح أنواع البيانات التي نقوم بجمعها وسبب جمعها
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataTypes.map((dataType) => (
              <div 
                key={dataType._id}
                className={`${dataType.color} dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{dataType.icon}</div>
                  <h3 className={`font-bold text-lg ${dataType.textColor} dark:text-blue-200`}>{dataType.title}</h3>
                </div>
                <p className="text-gray-700 dark:text-blue-100">{dataType.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* قسم الإجراءات الأمنية */}
        <div 
          id="security" 
          ref={securityRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">الإجراءات الأمنية</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              الإجراءات التي نتخذها لحماية بياناتك الشخصية
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityMeasures.map((measure) => (
              <div 
                key={measure._id}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{measure.icon}</div>
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">{measure.title}</h3>
                </div>
                <p className="text-gray-700 dark:text-blue-100">{measure.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* تذييل الصفحة */}
        <div className="text-center text-gray-600 dark:text-blue-300 text-sm animate-fade-in">
          <p>© 2025 جميع الحقوق محفوظة</p>
          <p className="mt-2">آخر تحديث: {formattedLastUpdated}</p>
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