"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { 
  FaEnvelope, FaPaperPlane, FaArrowRight, FaQuoteRight,
  FaVideo, FaListUl, FaUsers, FaCalendarAlt, FaNewspaper,
  FaStar, FaLightbulb, FaRocket, FaHandshake, FaGem,
  FaCheck, FaPlay, FaBook, FaChartLine,
  FaGraduationCap, FaChalkboardTeacher, FaMedal, FaGlobe,
  FaYoutube, FaInstagram, FaFacebookF, FaTiktok,
  FaHeart, FaAward, FaFire, FaUser, FaBriefcase, FaQuoteLeft,
  FaPhone, FaMapMarkerAlt, FaClock, FaComments, FaHeadset,
  FaTwitter, FaTelegram, FaComments as FaChat,
  FaFlask, FaAtom, FaLandmark, FaBalanceScale
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export default function ContactPage() {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Check for dark mode preference on client side only
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Listen for changes in color scheme
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  useEffect(() => {
    if (user) {
      setEmail(user.emailAddresses?.[0]?.emailAddress || "");
      setName(user.firstName || "");
    }
  }, [user]);
  
  const onDrop = (acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/zip': ['.zip']
    },
    multiple: true
  });
  
  const removeFile = (fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
    if (previewFile && previewFile.name === fileName) {
      closePreview();
    }
  };
  
  const handlePreview = (file: File) => {
    setPreviewFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };
  
  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      fd.set("name", name);
      fd.set("email", email);
      fd.set("message", message);
      
      // التعديل الرئيسي هنا: تغيير اسم الحقل من "files" إلى "attachment"
      files.forEach(file => {
        fd.append("attachment", file);
      });
      
      const res = await fetch("/api/contact", { method: "POST", body: fd });
      if (res.ok) {
        setStatus("success");
        setShowToast(true);
        form.reset();
        setMessage("");
        setFiles([]);
        closePreview();
        setTimeout(() => setShowToast(false), 3500);
      } else {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.message || "تعذر الإرسال.");
        setStatus("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4500);
      }
    } catch (err: unknown) {
      console.error("Error submitting form:", err);
      const errorMessage = err instanceof Error ? err.message : "تعذر الإرسال.";
      setErrorMsg(errorMessage);
      setStatus("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4500);
    }
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (fileType.includes('word')) {
      return (
        <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Social links with enhanced colors
  const socialLinks = [
    { href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA", icon: <FaYoutube />, label: "يوتيوب", color: "from-red-500 to-red-600", hover: "hover:from-red-600 hover:to-red-700" },
    { href: "https://www.instagram.com/fazlaka_platform/", icon: <FaInstagram />, label: "انستجرام", color: "from-pink-500 to-purple-500", hover: "hover:from-pink-600 hover:to-purple-600" },
    { href: "https://www.facebook.com/profile.php?id=61579582675453", icon: <FaFacebookF />, label: "فيس بوك", color: "from-blue-500 to-blue-600", hover: "hover:from-blue-600 hover:to-blue-700" },
    { href: "https://www.tiktok.com/@fazlaka_platform", icon: <FaTiktok />, label: "تيك توك", color: "from-gray-800 to-black", hover: "hover:from-gray-900 hover:to-black" },
    { href: "https://x.com/FazlakaPlatform", icon: <FaXTwitter />, label: "اكس", color: "from-gray-700 to-gray-900", hover: "hover:from-gray-800 hover:to-black" },
  ];

  // Why contact us
  const whyContactUs = [
    {
      icon: <FaComments className="text-3xl" />,
      title: "دعم سريع",
      description: "فريق دعم متخصص متاح للإجابة على استفساراتك",
      color: "from-blue-500 to-cyan-600",
      darkColor: "dark:from-blue-700 dark:to-cyan-800"
    },
    {
      icon: <FaHeadset className="text-3xl" />,
      title: "استشارات مجانية",
      description: "نقدم استشارات أولية مجانية لمساعدتك في البداية",
      color: "from-purple-500 to-indigo-600",
      darkColor: "dark:from-purple-700 dark:to-indigo-800"
    },
    {
      icon: <FaLightbulb className="text-3xl" />,
      title: "حلول مبتكرة",
      description: "نقدم حلولاً مبتكرة تناسب احتياجاتك الخاصة",
      color: "from-yellow-500 to-orange-600",
      darkColor: "dark:from-yellow-700 dark:to-orange-800"
    },
    {
      icon: <FaHandshake className="text-3xl" />,
      title: "شراكة ناجحة",
      description: "نبني علاقات طويلة الأمد مع عملائنا",
      color: "from-green-500 to-teal-600",
      darkColor: "dark:from-green-700 dark:to-teal-800"
    }
  ];

  // Hero Section Component with enhanced design
  const HeroSection = () => {
    return (
      <div className="relative mb-16 overflow-hidden rounded-3xl">
        {/* الخلفية المتدرجة */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950"></div>
        
        {/* العناصر الزخرفية */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {/* دوائر زخرفية */}
          <div className="absolute -top-40 -right-40 w-64 h-64 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
          
          {/* شبكة زخرفية */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
          
          {/* أيقونات المواد الدراسية في الخلفية */}
          <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
            <FaFlask className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
          <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
            <FaAtom className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
            <FaLandmark className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
          <div className="absolute bottom-1/3 right-1/3 text-white/10 transform translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '3s' }}>
            <FaBalanceScale className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
          <div className="absolute top-1/2 left-1/2 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '4s' }}>
            <FaChartLine className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
          <div className="absolute top-2/3 left-1/5 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '5s' }}>
            <FaBook className="text-7xl sm:text-9xl drop-shadow-lg" />
          </div>
        </div>
        
        {/* المحتوى الرئيسي */}
        <div className="relative z-10 py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-center">
          {/* القسم الأيسر - النص */}
          <div className="w-full text-center mb-8 md:mb-0">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
              <span className="text-white font-medium flex items-center text-sm sm:text-base">
                <FaStar className="text-yellow-300 mr-2 animate-pulse" />
                تواصل معنا
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              نحن هنا <span className="text-yellow-300">لنساعدك</span>
            </h1>
            <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
              لأي استفسار أو ملاحظة، لا تتردد في التواصل معنا. فريق الدعم متاح دائماً لمساعدتك.
            </p>
            
            {/* أيقونات المواد الدراسية في الأسفل */}
            <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 flex-wrap">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
                <FaEnvelope className="text-yellow-300 text-lg sm:text-xl" />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
                <FaPaperPlane className="text-yellow-300 text-lg sm:text-xl" />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
                <FaUsers className="text-yellow-300 text-lg sm:text-xl" />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1.5s' }}>
                <FaLightbulb className="text-yellow-300 text-lg sm:text-xl" />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2s' }}>
                <FaGlobe className="text-yellow-300 text-lg sm:text-xl" />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2.5s' }}>
                <FaHeart className="text-yellow-300 text-lg sm:text-xl" />
              </div>
            </div>
          </div>
          
          {/* القسم الأيمن - الصورة أو الرسوم التوضيحية */}
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex justify-center">
            <div className="relative">
              {/* دائرة خلفية */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full filter blur-3xl w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 animate-pulse-slow"></div>
              
              {/* الأيقونات المتحركة */}
              <div className="relative grid grid-cols-3 gap-3 sm:gap-4 w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64">
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                    <FaEnvelope className="text-white text-xl sm:text-2xl" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                    <FaPaperPlane className="text-white text-xl sm:text-2xl" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                    <FaUsers className="text-white text-xl sm:text-2xl" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                    <FaLightbulb className="text-white text-xl sm:text-2xl" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                    <FaGlobe className="text-white text-xl sm:text-2xl" />
                  </div>
                </div>
                <div className="group flex items-center justify-center animate-bounce" style={{ animationDelay: '0.6s' }}>
                  <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg transition-all duration-700 group-hover:scale-101">
                    <FaHeart className="text-white text-xl sm:text-2xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* تأثيرات حركية */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
      </div>
    );
  };

  // Why Contact Us Section
  const WhyContactUsSection = () => {
    return (
      <section className="mb-16">
        <div className="text-center mb-12 px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            لماذا <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">تتواصل معنا</span>؟
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            نقدم لك أفضل تجربة تواصل ممكنة مع ضمان الجودة والسرعة
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4">
          {whyContactUs.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} ${item.darkColor} rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300`}></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center text-center">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r ${item.color} ${item.darkColor} flex items-center justify-center mb-4`}>
                  <div className="text-white">{item.icon}</div>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    );
  };

  // Enhanced Social Media Section
  const SocialMediaSection = () => {
    return (
      <section id="social-media" className="mb-16">
        <div className="text-center mb-12 px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            تابعنا على <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">وسائل التواصل</span>
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            كن على اطلاع دائم بأحدث الأخبار والعروض من خلال متابعتنا على منصات التواصل الاجتماعي
          </p>
        </div>
        
        <div className="flex justify-center flex-wrap gap-4 md:gap-6 px-4">
          {socialLinks.map((social, index) => (
            <a 
              key={index}
              href={social.href} 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label={social.label} 
              title={social.label}
              className="group relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-700 transform hover:scale-105 animate-bounce overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* الخلفية المتدرجة */}
              <div className={`absolute inset-0 bg-gradient-to-r ${social.color} ${social.hover} transition-all duration-700`}></div>
              
              {/* تأثير التوهج */}
              <div className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-100 bg-white/20 blur-md"></div>
              
              {/* تأثير الحركة الدائرية */}
              <div className="absolute inset-0 rounded-full border-2 border-white/30 transition-all duration-700 group-hover:border-white/60 animate-spin-slow"></div>
              
              {/* الأيقونة */}
              <div className="relative z-10 text-white text-xl md:text-2xl lg:text-3xl transition-transform duration-700 group-hover:scale-110">
                {social.icon}
              </div>
              
              {/* تسمية المنصة */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-700 group-hover:opacity-100 whitespace-nowrap">
                {social.label}
              </div>
              
              {/* تأثير اللمعان */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"></div>
            </a>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* خلفية هندسية عصرية مع تحسينات */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-indigo-200 to-blue-200 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-r from-cyan-200 to-teal-200 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"></div>
        
        {/* دوائر صغيرة متحركة مع ألوان محسنة */}
        <motion.div 
          animate={reduceMotion ? {} : { 
            x: [0, 15, 0], 
            y: [0, -15, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 12, 
            ease: "easeInOut" 
          }}
          className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-800/20 dark:to-blue-800/20 rounded-full opacity-30 dark:opacity-20 shadow-lg"
        ></motion.div>
        
        <motion.div 
          animate={reduceMotion ? {} : { 
            x: [0, -10, 0], 
            y: [0, 10, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 15, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-800/20 dark:to-cyan-800/20 rounded-full opacity-30 dark:opacity-20 shadow-lg"
        ></motion.div>
        
        <motion.div 
          animate={reduceMotion ? {} : { 
            x: [0, 10, 0], 
            y: [0, 10, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 18, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-r from-cyan-100 to-teal-100 dark:from-cyan-800/20 dark:to-teal-800/20 rounded-full opacity-30 dark:opacity-20 shadow-lg"
        ></motion.div>
        
        {/* أشكال هندسية متحركة مع تحسينات */}
        <motion.div 
          animate={reduceMotion ? {} : { 
            rotate: [0, 45, 90, 135, 180, 225, 270, 315, 360],
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 30, 
            ease: "linear"
          }}
          className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-800/20 dark:to-blue-800/20 transform opacity-30 dark:opacity-20 shadow-lg"
        ></motion.div>
        
        <motion.div 
          animate={reduceMotion ? {} : { 
            rotate: [0, -30, -60, -30, 0],
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 25, 
            ease: "easeInOut"
          }}
          className="absolute top-1/4 right-10 w-20 h-20 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-800/20 dark:to-cyan-800/20 transform opacity-30 dark:opacity-20 shadow-lg"
        ></motion.div>
        
        {/* مربعات ودوائر زخرفية إضافية */}
        <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg opacity-20 transform rotate-12 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-gradient-to-r from-green-400 to-teal-500 rounded-full opacity-20 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Why Contact Us Section */}
        <WhyContactUsSection />
        
        <motion.div 
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link href="/faq" className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 border border-indigo-200 dark:border-indigo-700">
              <motion.svg 
                className="w-6 h-6 ml-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
                animate={reduceMotion ? {} : { 
                  y: [0, -3, 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4, 
                  repeatDelay: 2,
                  ease: "easeInOut"
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </motion.svg>
              <span className="font-medium group-hover:text-indigo-100 transition-colors">
                عرض الأسئلة الشائعة
              </span>
            </Link>
          </motion.div>
        </motion.div>
        
        <motion.main 
          id="contact-form"
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 md:p-6 lg:p-8 relative border border-gray-200 dark:border-gray-700 mb-16 overflow-x-hidden ${
            isDarkMode ? 'dark-mode-shadow' : 'shadow-md'
          }`}
        >
          <h2 id="contact-heading" className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100 relative z-10 flex items-center">
            <motion.div
              animate={reduceMotion ? {} : { 
                rotate: [0, 5, 0, -5, 0],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 6, 
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            >
              <svg className="w-8 h-8 ml-3 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </motion.div>
            أرسل رسالة
          </h2>
          
          <SignedOut>
            <motion.div 
              initial={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              animate={reduceMotion ? {} : { opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8"
            >
              <div className="flex items-center">
                <motion.div
                  animate={reduceMotion ? {} : { 
                    rotate: [0, 5, 0, -5, 0],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 4, 
                    ease: "easeInOut"
                  }}
                  className="flex-shrink-0"
                >
                  <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </motion.div>
                <div className="ml-4">
                  <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                    يجب تسجيل الدخول لإرسال رسالة. {" "}
                    <Link href="/sign-in" className="font-bold underline text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors">
                      تسجيل الدخول
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </SignedOut>
          
          <SignedIn>
            <form onSubmit={handleSubmit} className="flex flex-col gap-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <motion.div 
                  initial={reduceMotion ? {} : { opacity: 0, x: -10 }}
                  animate={reduceMotion ? {} : { opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
                    <motion.div
                      animate={reduceMotion ? {} : { 
                        y: [0, -2, 0],
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 3, 
                        ease: "easeInOut"
                      }}
                    >
                      <svg className="w-5 h-5 ml-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </motion.div>
                    الاسم
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="الاسم"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 p-4 pr-12 h-14 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                      required
                    />
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={reduceMotion ? {} : { opacity: 0, x: 10 }}
                  animate={reduceMotion ? {} : { opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
                    <motion.div
                      animate={reduceMotion ? {} : { 
                        y: [0, -2, 0],
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 3, 
                        delay: 1,
                        ease: "easeInOut"
                      }}
                    >
                      <svg className="w-5 h-5 ml-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </motion.div>
                    الإيميل
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="الإيميل"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 p-4 pr-12 h-14 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                      required
                      disabled={!!user}
                    />
                  </div>
                </motion.div>
              </div>
              
              <motion.div 
                initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
                  <motion.div
                    animate={reduceMotion ? {} : { 
                      y: [0, -2, 0],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3, 
                      delay: 1.5,
                      ease: "easeInOut"
                    }}
                  >
                    <svg className="w-5 h-5 ml-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </motion.div>
                  رسالتك
                </label>
                <div className="relative">
                  <div className="absolute top-4 right-4 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="اكتب رسالتك هنا..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 p-4 pr-12 pt-4 rounded-lg h-48 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                    required
                  />
                </div>
              </motion.div>
              
              <motion.div 
                initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
                  <motion.div
                    animate={reduceMotion ? {} : { 
                      y: [0, -2, 0],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3, 
                      delay: 2,
                      ease: "easeInOut"
                    }}
                  >
                    <svg className="w-5 h-5 ml-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.585a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </motion.div>
                  مرفقات (اختياري)
                </label>
                
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive 
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-lg' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/70'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center">
                    <motion.div
                      animate={reduceMotion ? {} : { 
                        y: [0, -8, 0],
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 4, 
                        ease: "easeInOut"
                      }}
                    >
                      <svg className="w-10 h-10 md:w-12 md:h-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </motion.div>
                    <motion.p 
                      animate={isDragActive ? { 
                        scale: [1, 1.05, 1],
                        color: ['#4F46E5', '#7C3AED', '#4F46E5']
                      } : {}}
                      transition={{ duration: 0.5 }}
                      className="text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium mb-2"
                    >
                      {isDragActive ? "أفلت الملفات هنا" : "اسحب وأفلت الملفات هنا أو انقر للاختيار"}
                    </motion.p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">الصيغ المسموحة: jpg, png, pdf, doc, docx, zip</p>
                  </div>
                </div>
                
                {files.length > 0 && (
                  <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الملفات المرفقة:</h3>
                    {files.map((file, index) => (
                      <motion.div 
                        key={index}
                        initial={reduceMotion ? {} : { 
                          opacity: 0, 
                          x: -20,
                          scale: 0.9
                        }}
                        animate={reduceMotion ? {} : { 
                          opacity: 1, 
                          x: 0,
                          scale: 1
                        }}
                        transition={{ 
                          delay: 0.1 * index,
                          type: "spring",
                          stiffness: 300,
                          damping: 20
                        }}
                        whileHover={{ 
                          scale: 1.02,
                          x: 5,
                          transition: { duration: 0.2 }
                        }}
                        className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl px-4 py-3 hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center min-w-0">
                          {getFileIcon(file.type)}
                          <div className="mr-3 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <motion.button 
                            whileHover={{ 
                              scale: 1.1,
                              rotate: 15
                            }}
                            whileTap={{ 
                              scale: 0.9,
                              rotate: -15
                            }}
                            type="button"
                            onClick={() => handlePreview(file)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 shadow-sm"
                            title="معاينة"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </motion.button>
                          <motion.button 
                            whileHover={{ 
                              scale: 1.1,
                              rotate: 15
                            }}
                            whileTap={{ 
                              scale: 0.9,
                              rotate: -15
                            }}
                            type="button"
                            onClick={() => removeFile(file.name)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 shadow-sm"
                            title="حذف"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  name="attachment" 
                  multiple 
                  accept="image/*,.pdf,.doc,.docx,.zip" 
                  className="hidden" 
                />
              </motion.div>
              
              {previewFile && (
                <motion.div 
                  initial={reduceMotion ? {} : { 
                    opacity: 0, 
                    y: 20,
                    scale: 0.95
                  }}
                  animate={reduceMotion ? {} : { 
                    opacity: 1, 
                    y: 0,
                    scale: 1
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 25
                  }}
                  className="mt-6 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-700 shadow-xl dark:shadow-2xl"
                >
                  <div className="p-4 border-b border-indigo-100 dark:border-indigo-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
                    <div className="flex items-center min-w-0">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3 flex-shrink-0">
                        {getFileIcon(previewFile.type)}
                      </div>
                      <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 truncate">{previewFile.name}</h3>
                    </div>
                    <button
                      onClick={closePreview}
                      className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex-shrink-0"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-4 md:p-6 overflow-auto max-h-[300px] bg-white dark:bg-gray-800">
                    {previewUrl && previewFile.type.startsWith('image/') ? (
                      <motion.div 
                        initial={reduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                        animate={reduceMotion ? {} : { opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex justify-center"
                      >
                        <motion.img 
                          src={previewUrl} 
                          alt={previewFile.name} 
                          className="max-w-full max-h-[250px] object-contain rounded-xl shadow-md"
                          whileHover={{ 
                            scale: 1.02,
                            transition: { duration: 0.3 }
                          }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
                        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center py-6"
                      >
                        <motion.div
                          animate={reduceMotion ? {} : { 
                            rotate: [0, 5, 0, -5, 0],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 4,
                            ease: "easeInOut"
                          }}
                          className="flex justify-center mb-6"
                        >
                          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                            {getFileIcon(previewFile.type)}
                          </div>
                        </motion.div>
                        <p className="text-xl text-indigo-800 dark:text-indigo-200 font-medium mb-2">لا يمكن معاينة هذا الملف</p>
                        <p className="text-indigo-600 dark:text-indigo-300 mb-1">نوع الملف: {previewFile.type}</p>
                        <p className="text-indigo-600 dark:text-indigo-300 mb-6">الحجم: {formatFileSize(previewFile.size)}</p>
                        <button
                          onClick={() => {
                            const url = URL.createObjectURL(previewFile);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = previewFile.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-medium"
                        >
                          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          تحميل الملف
                        </button>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-100 dark:border-indigo-800 flex flex-col sm:flex-row justify-between items-center">
                    <div className="text-sm text-indigo-700 dark:text-indigo-300 mb-2 sm:mb-0">
                      {previewFile.name} • {formatFileSize(previewFile.size)}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={closePreview}
                        className="px-4 py-2 bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors font-medium"
                      >
                        إغلاق
                      </button>
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(previewFile);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = previewFile.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium"
                      >
                        تحميل
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <motion.div 
                initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.4 }}
                className="mt-6"
              >
                <motion.button 
                  whileHover={{ 
                    scale: 1.01,
                    boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 10px 10px -5px rgba(139, 92, 246, 0.3)'
                  }}
                  whileTap={{ scale: 0.99 }}
                  type="submit" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري الإرسال...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center text-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      إرسال الرسالة
                      <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </motion.button>
                
                <div className="mt-4 text-center">
                  {status === "success" && (
                    <motion.p 
                      initial={reduceMotion ? {} : { opacity: 0, scale: 0.8 }}
                      animate={reduceMotion ? {} : { opacity: 1, scale: 1 }}
                      className="text-green-600 dark:text-green-400 font-bold flex items-center justify-center text-lg"
                    >
                      <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      تم الإرسال بنجاح!
                    </motion.p>
                  )}
                  {status === "error" && (
                    <motion.p 
                      initial={reduceMotion ? {} : { opacity: 0, scale: 0.8 }}
                      animate={reduceMotion ? {} : { opacity: 1, scale: 1 }}
                      className="text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-lg"
                    >
                      <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {errorMsg || "حدث خطأ، حاول مرة أخرى."}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            </form>
          </SignedIn>
        </motion.main>
        
        {/* Social Media Section - منفصل عن نموذج الإرسال */}
        <SocialMediaSection />
      </div>
      
      {/* Toast محسن مع تأثيرات إضافية */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, x: 100, y: 50, scale: 0.8 }}
            animate={reduceMotion ? {} : { opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={reduceMotion ? {} : { opacity: 0, x: 100, y: 50, scale: 0.8 }}
            transition={{ duration: 0.4, type: "spring", damping: 25 }}
            className="fixed right-4 md:right-6 bottom-4 md:bottom-6 z-50 max-w-xs md:max-w-md"
            role="status"
            aria-live="polite"
          >
            <div className={`${
              status === "success" 
                ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                : "bg-gradient-to-r from-red-500 to-rose-600"
            } text-white rounded-2xl px-6 py-5 flex items-center gap-4 shadow-lg backdrop-blur-sm border border-white border-opacity-20 relative overflow-hidden`}>
              {/* تأثير إضافي */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="flex-shrink-0">
                {status === "success" ? (
                  <motion.div
                    animate={reduceMotion ? {} : { 
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }}
                  >
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                ) : (
                  <motion.div
                    animate={reduceMotion ? {} : { 
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }}
                  >
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-lg truncate">
                  {status === "success" ? "تم الإرسال بنجاح!" : "فشل الإرسال"}
                </span>
                <span className="text-sm opacity-90">
                  {status === "success" 
                    ? "شكراً لتواصلك معنا، سنرد عليك قريباً" 
                    : errorMsg || "يرجى المحاولة مرة أخرى لاحقاً"}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowToast(false)}
                className="ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors flex-shrink-0"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* إضافة أنماط CSS للتأثيرات الإضافية */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        @keyframes float-animation {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        .float-animation {
          animation: float-animation 6s ease-in-out infinite;
        }
        
        .dark-mode-shadow {
          box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.3), 0 15px 25px -5px rgba(139, 92, 246, 0.2), 0 10px 15px -3px rgba(236, 72, 153, 0.1) !important;
        }
      `}</style>
    </div>
  );
}