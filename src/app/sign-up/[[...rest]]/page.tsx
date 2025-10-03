"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram, Youtube, Users, BookOpen } from "lucide-react";
import { FaTiktok, FaXTwitter } from "react-icons/fa6";
// We no longer need to import localizations here
// import { arSA, enUS } from "@clerk/localizations";

export default function SignUpPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isRTL, setIsRTL] = useState(true);
  
  useEffect(() => {
    setIsVisible(true);
    
    // التحقق من تفضيل اللغة المحفوظ في localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
      const shouldBeRTL = savedLanguage === 'ar';
      setIsRTL(shouldBeRTL);
    } else {
      // إذا لم يكن هناك تفضيل محفوظ، استخدم لغة المتصفح
      const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage;
      const shouldBeRTL = browserLang ? browserLang.includes('ar') : false;
      setIsRTL(shouldBeRTL);
    }
    
    // الاستماع لتغيرات اللغة
    const handleLanguageChange = () => {
      const currentLanguage = localStorage.getItem('language');
      if (currentLanguage !== null) {
        const shouldBeRTL = currentLanguage === 'ar';
        setIsRTL(shouldBeRTL);
      }
    };
    
    window.addEventListener('storage', handleLanguageChange);
    
    // أيضاً تحقق من التغييرات المحلية
    const checkLanguageInterval = setInterval(() => {
      const currentLanguage = localStorage.getItem('language');
      if (currentLanguage !== null) {
        const shouldBeRTL = currentLanguage === 'ar';
        if (shouldBeRTL !== isRTL) {
          setIsRTL(shouldBeRTL);
        }
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange);
      clearInterval(checkLanguageInterval);
    };
  }, [isRTL]);

  // النصوص حسب اللغة
  const texts = {
    ar: {
      title: "إنشاء حساب جديد",
      subtitle: "انضم إلى مجتمعنا العلمي اليوم",
      featuresTitle: "مميزات التسجيل",
      educationalContent: "محتوى تعليمي",
      educationalContentDesc: "دروس شاملة في مختلف المجالات العلمية",
      interactiveCommunity: "مجتمع تفاعلي",
      interactiveCommunityDesc: "تواصل مع زملائك وشارك المعرفة",
      followUs: "تابعنا على",
      whyChooseUs: "لماذا تختار منصتنا؟",
      reliableContent: "محتوى علمي موثوق ومحدث باستمرار",
      supportiveCommunity: "مجتمع تعليمي تفاعلي وداعم",
      resourceLibrary: "وصول لمكتبة ضخمة من الموارد التعليمية",
      agreementTitle: "الموافقة على الشروط",
      agreementText: "بالتسجيل في حساب جديد، أنت توافق على:",
      privacyPolicy: "سياسة الخصوصية",
      termsOfService: "شروط الخدمة",
      haveAccount: "لديك حساب بالفعل؟",
      signIn: "تسجيل الدخول",
      platformName: "فذلكه",
      platformDesc: "منصة تعليمية رائدة تقدم محتوى علمي مميز وتفاعلي"
    },
    en: {
      title: "Create New Account",
      subtitle: "Join our scientific community today",
      featuresTitle: "Registration Features",
      educationalContent: "Educational Content",
      educationalContentDesc: "Comprehensive lessons in various scientific fields",
      interactiveCommunity: "Interactive Community",
      interactiveCommunityDesc: "Connect with colleagues and share knowledge",
      followUs: "Follow Us On",
      whyChooseUs: "Why Choose Our Platform?",
      reliableContent: "Reliable and constantly updated scientific content",
      supportiveCommunity: "Interactive and supportive educational community",
      resourceLibrary: "Access to a huge library of educational resources",
      agreementTitle: "Agreement to Terms",
      agreementText: "By creating a new account, you agree to:",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      haveAccount: "Already have an account?",
      signIn: "Sign In",
      platformName: "Falthaka",
      platformDesc: "A leading educational platform offering distinctive and interactive scientific content"
    }
  };
  
  const t = texts[isRTL ? 'ar' : 'en'];

  // روابط السوشيال ميديا
  const socialLinks = [
    {
      href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA",
      icon: <Youtube className="w-6 h-6" />,
      label: "YouTube",
      color: "hover:bg-red-500/20 hover:text-red-400",
    },
    {
      href: "https://www.instagram.com/fazlaka_platform/",
      icon: <Instagram className="w-6 h-6" />,
      label: "Instagram",
      color: "hover:bg-pink-500/20 hover:text-pink-400",
    },
    {
      href: "https://www.facebook.com/profile.php?id=61579582675453",
      icon: <Facebook className="w-6 h-6" />,
      label: "Facebook",
      color: "hover:bg-blue-500/20 hover:text-blue-400",
    },
    {
      href: "https://www.tiktok.com/@fazlaka_platform",
      icon: <FaTiktok className="w-6 h-6" />,
      label: "TikTok",
      color: "hover:bg-gray-500/20 hover:text-gray-300",
    },
    {
      href: "https://x.com/FazlakaPlatform",
      icon: <FaXTwitter className="w-6 h-6" />,
      label: "Twitter",
      color: "hover:bg-blue-400/20 hover:text-blue-300",
    },
  ];

  // بيانات المميزات
  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: t.educationalContent,
      description: t.educationalContentDesc,
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t.interactiveCommunity,
      description: t.interactiveCommunityDesc,
      color: "from-purple-500 to-indigo-500",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* دوائر زخرفية متحركة فقط */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-2xl animate-pulse shadow-xl shadow-blue-500/10"></div>
      <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-gradient-to-r from-purple-400/15 to-blue-400/15 blur-3xl animate-pulse shadow-xl shadow-purple-500/10"></div>
      <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-blue-300/30 dark:bg-blue-300/10 blur-xl animate-bounce shadow-lg shadow-blue-400/20"></div>
      <div className="absolute bottom-1/3 left-1/3 w-24 h-24 rounded-full bg-purple-300/30 dark:bg-purple-300/10 blur-lg animate-ping shadow-lg shadow-purple-400/20"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/25 to-purple-500/25 blur-lg animate-pulse shadow-lg shadow-blue-500/20"></div>
      <div className="absolute bottom-1/4 right-1/3 w-28 h-28 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl animate-bounce shadow-lg shadow-purple-500/20"></div>
      
      <div className="w-full max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-center">
          {/* قسم التسجيل - تم تعديله للموبايل */}
          <div className={`w-full lg:w-2/5 transition-all duration-700 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'} order-1 lg:order-2`}>
            {/* في الموبايل: مكون Clerk مباشرة بدون حاوية */}
            <div className="lg:hidden w-full">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 animate-pulse">{t.title}</h1>
                <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
              </div>
              
              <SignUp
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
                // localization prop has been removed
                appearance={{
                  elements: {
                    rootBox: "mx-auto w-full max-w-md",
                    card: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-blue-500/20 border border-gray-200 dark:border-gray-800 w-full",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: 
                      "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-colors duration-200",
                    formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
                    formFieldInput: 
                      "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200",
                    formButtonPrimary: 
                      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105",
                    footer: "hidden",
                    dividerRow: "text-gray-500 dark:text-gray-400 before:bg-gray-300 dark:before:bg-gray-600 after:bg-gray-300 dark:after:bg-gray-600",
                    dividerText: "bg-transparent px-2",
                    identityPreviewText: "text-gray-900 dark:text-white",
                    identityPreviewEditButton: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
                    codeInputField: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
                    codeInputFieldFocused: "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400",
                    codeInputFieldFilled: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
                    input: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
                    inputFocused: "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400",
                  },
                  variables: {
                    colorPrimary: "#2563eb",
                    colorText: "rgb(75 85 99)",
                    colorTextSecondary: "rgb(107 114 128)",
                    colorBackground: "#ffffff",
                    colorInputBackground: "#ffffff",
                    colorInputText: "rgb(17 24 39)",
                    colorTextOnPrimaryBackground: "#ffffff",
                  }
                }}
              />

              {/* إشعار الموافقة على الشروط للموبايل - محسّن */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-8 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg"></div>
                <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                  <div className="flex items-start mb-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="mr-3 text-lg font-bold text-gray-800 dark:text-white">{t.agreementTitle}</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-center mb-3">
                    {t.agreementText}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <motion.a
                      href="/privacy-policy"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      {t.privacyPolicy}
                    </motion.a>
                    <motion.a
                      href="/terms-conditions"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t.termsOfService}
                    </motion.a>
                  </div>
                </div>
              </motion.div>

              {/* رابط تسجيل الدخول للموبايل - محسّن */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-8 text-center"
              >
                <div className="inline-block relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-30"></div>
                  <p className="relative text-gray-600 dark:text-gray-400 mb-3">
                    {t.haveAccount}
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/sign-in"
                      className="relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden"
                    >
                      <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <span className="relative flex items-center">
                        {t.signIn}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
            
            {/* في الشاشات الكبيرة: مكون Clerk داخل الحاوية */}
            <div className="hidden lg:block p-4 sm:p-6 md:p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-blue-500/20 border border-gray-200 dark:border-gray-800 transition-all duration-700 transform">
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-pulse">{t.title}</h1>
                <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
              </div>
              
              <SignUp
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
                // localization prop has been removed
                appearance={{
                  elements: {
                    rootBox: "mx-auto shadow-lg dark:shadow-blue-500/30 dark:shadow-xl",
                    card: "bg-transparent shadow-none dark:shadow-blue-500/20",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: 
                      "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-colors duration-200",
                    formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
                    formFieldInput: 
                      "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200",
                    formButtonPrimary: 
                      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105",
                    footer: "hidden",
                    dividerRow: "text-gray-500 dark:text-gray-400 before:bg-gray-300 dark:before:bg-gray-600 after:bg-gray-300 dark:after:bg-gray-600",
                    dividerText: "bg-transparent px-2",
                    identityPreviewText: "text-gray-900 dark:text-white",
                    identityPreviewEditButton: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
                    codeInputField: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
                    codeInputFieldFocused: "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400",
                    codeInputFieldFilled: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
                    input: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
                    inputFocused: "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400",
                  },
                  variables: {
                    colorPrimary: "#2563eb",
                    colorText: "rgb(75 85 99)",
                    colorTextSecondary: "rgb(107 114 128)",
                    colorBackground: "#ffffff",
                    colorInputBackground: "#ffffff",
                    colorInputText: "rgb(17 24 39)",
                    colorTextOnPrimaryBackground: "#ffffff",
                  }
                }}
              />

              {/* إشعار الموافقة على الشروط */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                  {t.agreementText} 
                  <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium mx-1 transition-colors duration-200">
                    {t.privacyPolicy}
                  </Link>
                  {isRTL ? ' و' : ' and '}
                  <Link href="/terms-conditions" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium mx-1 transition-colors duration-200">
                    {t.termsOfService}
                  </Link>
                </p>
              </div>

              <div className="mt-6 sm:mt-8 text-center pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                  {t.haveAccount}{" "}
                  <Link
                    href="/sign-in"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                  >
                    {t.signIn}
                  </Link>
                </p>
              </div>
            </div>
          </div>
          
          {/* بقية الأقسام */}
          <div className={`w-full lg:w-3/5 transition-all duration-700 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'} order-2 lg:order-1`}>
            {/* قسم العنوان الرئيسي */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center mb-10"
            >
              <motion.h1 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 drop-shadow-lg"
              >
                 {t.platformName}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto drop-shadow"
              >
                {t.platformDesc}
              </motion.p>
            </motion.div>
            
            {/* قسم المميزات */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mb-10"
            >
              <motion.h2 
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-center drop-shadow-md"
              >
                <span className="mr-3 text-3xl">🎓</span> {t.featuresTitle}
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2 + index * 0.2, duration: 0.6 }}
                    whileHover={{ y: -10, scale: 1.03 }}
                    className={`bg-gradient-to-br ${feature.color} p-1 rounded-2xl shadow-lg ${index % 2 === 0 ? 'shadow-blue-500/30' : 'shadow-purple-500/30'}`}
                  >
                    <div className="bg-white dark:bg-gray-800 h-full p-5 rounded-2xl shadow-md dark:shadow-gray-900/50">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 shadow-lg ${index % 2 === 0 ? 'shadow-blue-500/40' : 'shadow-purple-500/40'}`}>
                        <div className="text-white">{feature.icon}</div>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 drop-shadow-sm">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* قسم تابعنا على */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.8 }}
              className="mb-10"
            >
              <motion.h2 
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 2.2, duration: 0.6 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-center drop-shadow-md"
              >
                <span className="mr-3 text-3xl">📱</span> {t.followUs}
              </motion.h2>
              <div className="flex justify-center flex-wrap gap-6">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 2.4 + index * 0.1, type: "spring", stiffness: 100 }}
                    whileHover={{ y: -10, scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-14 h-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center transition-all duration-300 ${social.color} border-2 border-gray-200 dark:border-gray-700 relative group overflow-hidden shadow-lg hover:shadow-xl dark:shadow-gray-900/50`}
                    aria-label={social.label}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {social.icon}
                    <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs bg-gray-900 dark:bg-gray-700 text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10 shadow-lg">
                      {social.label}
                    </span>
                  </motion.a>
                ))}
              </div>
            </motion.div>
            
            {/* قسم لماذا تختار منصتنا */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 0.8 }}
              className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg dark:shadow-gray-900/50"
            >
              <motion.h2 
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 3.2, duration: 0.6 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center drop-shadow-md"
              >
                <span className="mr-3 text-3xl">💎</span> {t.whyChooseUs}
              </motion.h2>
              <ul className="space-y-3">
                {[
                  t.reliableContent,
                  t.supportiveCommunity,
                  t.resourceLibrary
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 3.4 + index * 0.1, duration: 0.6 }}
                    className="flex items-start"
                  >
                    <span className={`mr-3 text-xl ${index % 2 === 0 ? 'text-blue-500' : 'text-purple-500'} animate-pulse drop-shadow`}>✓</span>
                    <span className="text-gray-700 dark:text-gray-300 text-lg drop-shadow-sm">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* CSS مخصص لحقول أرقام كود التحقق */}
      <style jsx global>{`
        /* حقول كود التحقق */
        [data-clerk-component="codeInput"] input {
          background-color: white !important;
          color: rgb(17 24 39) !important;
          border-color: rgb(209 213 219) !important;
        }
        
        .dark [data-clerk-component="codeInput"] input {
          background-color: rgb(55 65 81) !important;
          color: white !important;
          border-color: rgb(75 85 99) !important;
        }
        
        [data-clerk-component="codeInput"] input:focus {
          border-color: rgb(59 130 246) !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
        }
        
        .dark [data-clerk-component="codeInput"] input:focus {
          border-color: rgb(96 165 250) !important;
          box-shadow: 0 0 0 2px rgba(96, 165,250, 0.5) !important;
        }
      `}</style>
    </div>
  );
}