"use client";
import { motion } from "framer-motion";
import { 
  Facebook, Instagram, Youtube, Mail, ChevronRight, Play, List, Calendar, Users, MessageSquare, 
  FileText, Shield, BookOpen
} from "lucide-react";
import { FaTiktok, FaXTwitter } from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();
  
  // روابط السوشيال ميديا
  const socialLinks = [
    {
      href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA",
      icon: <Youtube className="w-5 h-5" />,
      label: "YouTube",
      color: "hover:bg-red-500/20 hover:text-red-400",
    },
    {
      href: "https://www.instagram.com/fazlaka_platform/",
      icon: <Instagram className="w-5 h-5" />,
      label: "Instagram",
      color: "hover:bg-pink-500/20 hover:text-pink-400",
    },
    {
      href: "https://www.facebook.com/profile.php?id=61579582675453",
      icon: <Facebook className="w-5 h-5" />,
      label: "Facebook",
      color: "hover:bg-blue-500/20 hover:text-blue-400",
    },
    {
      href: "https://www.tiktok.com/@fazlaka_platform",
      icon: <FaTiktok className="w-5 h-5" />,
      label: "TikTok",
      color: "hover:bg-gray-500/20 hover:text-gray-300",
    },
    {
      href: "https://x.com/FazlakaPlatform",
      icon: <FaXTwitter className="w-5 h-5" />,
      label: "Twitter",
      color: "hover:bg-blue-400/20 hover:text-blue-300",
    },
  ];
  
  // روابط المحتوى (بدون الرئيسية)
  const contentLinks = [
    { href: "/episodes", text: "الحلقات", icon: <Play className="w-4 h-4" /> },
    { href: "/playlists", text: "قوائم التشغيل", icon: <List className="w-4 h-4" /> },
    { href: "/seasons", text: "المواسم", icon: <Calendar className="w-4 h-4" /> },
    { href: "/articles", text: "المقالات", icon: <FileText className="w-4 h-4" /> },
  ];
  
  // روابط من نحن
  const aboutLinks = [
    { href: "/about", text: "من نحن", icon: <BookOpen className="w-4 h-4" /> },
    { href: "/team", text: "الفريق", icon: <Users className="w-4 h-4" /> },
  ];
  
  // روابط التواصل
  const contactLinks = [
    { href: "/contact", text: "تواصل معنا", icon: <Mail className="w-4 h-4" /> },
    { href: "/faq", text: "الأسئلة الشائعة", icon: <MessageSquare className="w-4 h-4" /> },
  ];
  
  // روابط السياسات
  const policyLinks = [
    { href: "/privacy-policy", text: "سياسة الخصوصية", icon: <Shield className="w-4 h-4" /> },
    { href: "/terms-conditions", text: "الشروط والأحكام", icon: <FileText className="w-4 h-4" /> },
  ];
  
  return (
    <>
      {/* فاصل علوي */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <motion.footer
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-[#0c0a1d] via-[#1a1a2e] to-[#16213e] text-gray-200 pt-20 pb-12 relative overflow-hidden"
      >
        {/* خلفية زخرفية */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* قسم الشعار والوصف */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-3xl p-10 border border-gray-700/30 shadow-2xl">
              <div className="flex flex-col items-center">
                {/* الدائرة الداكنة المحسّنة */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                  className="relative group mb-12"
                >
                  {/* طبقات التوهج الخارجي المتعددة */}
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.6 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="absolute -inset-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full blur-3xl group-hover:opacity-80 transition duration-1000 group-hover:duration-200"
                  />
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.5 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="absolute -inset-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full blur-2xl group-hover:opacity-70 transition duration-1000 group-hover:duration-200"
                  />
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="absolute -inset-4 bg-gradient-to-r from-white via-blue-300 to-purple-400 rounded-full blur-xl group-hover:opacity-60 transition duration-1000 group-hover:duration-200"
                  />
                  
                  {/* الحاوية الرئيسي الداكن */}
                  <motion.div 
                    initial={{ rotate: -5, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 80 }}
                    whileHover={{ rotate: 6, scale: 1.1 }}
                    className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-sm p-8 rounded-full shadow-3xl border-4 border-white/20 transition-all duration-700"
                  >
                    
                    {/* تأثيرات داخلية */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 }}
                      transition={{ delay: 0.7 }}
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100/5 via-purple-100/5 to-pink-100/5 group-hover:opacity-20 transition-opacity duration-500"
                    />
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      transition={{ delay: 0.8 }}
                      className="absolute inset-4 rounded-full border-2 border-white/10 group-hover:border-white/30 transition-opacity duration-500"
                    />
                    
                    {/* اللوجو */}
                    <motion.div 
                      initial={{ rotate: -10, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 0.9, type: "spring", stiffness: 60 }}
                      whileHover={{ rotate: 12, scale: 1.1 }}
                      className="relative z-10"
                    >
                      <Image
                        src="/logo.png"
                        alt="Fazlaka Logo"
                        width={140}
                        height={140}
                        className="object-contain drop-shadow-2xl"
                        priority
                        style={{ 
                          backgroundColor: 'transparent',
                          filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5)) drop-shadow(0 0 30px rgba(147, 51, 234, 0.3))'
                        }}
                      />
                    </motion.div>
                    
                    {/* تأثيرات النقاط المضيئة */}
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1, type: "spring" }}
                      className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.1, type: "spring" }}
                      className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" }}
                      className="absolute top-1/2 left-4 w-1 h-1 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  </motion.div>
                  
                  {/* حلقة التوهج الخارجية */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.3 }}
                    transition={{ delay: 1.3, duration: 1 }}
                    className="absolute -inset-12 rounded-full border-4 border-white/10 group-hover:border-white/30 transition-all duration-700"
                  />
                </motion.div>
                
                {/* مساحة فارغة بدلاً من كلمة "فذلكه" */}
                <div className="h-8"></div>
                
                {/* عبارة "العلم معنى ممتع" مع انيميشن */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, type: "spring", stiffness: 50 }}
                  className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-2xl p-5 mb-8 border border-blue-500/40 shadow-lg"
                >
                  <motion.p 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5, type: "spring", stiffness: 100 }}
                    className="text-white font-bold text-2xl text-center tracking-wider"
                  >
                    العلم معنى ممتع
                  </motion.p>
                </motion.div>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: 0.8 }}
                  className="text-gray-300 text-center leading-relaxed mb-10 text-lg max-w-2xl mx-auto"
                >
                  منصة تعليمية حديثة لعرض العلوم بشكل ممتع، منظم، وسهل
                  لتطوير مهاراتك.
                </motion.p>
                
                {/* وسائل التواصل الاجتماعي */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.7, duration: 0.8 }}
                  className="flex space-x-5 justify-center"
                >
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.8 + index * 0.1, type: "spring", stiffness: 100 }}
                      whileHover={{ y: -10, scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-14 h-14 rounded-full bg-gray-800/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${social.color} border border-gray-700/50 relative group overflow-hidden shadow-xl`}
                      aria-label={social.label}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {social.icon}
                      <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10 shadow-lg">
                        {social.label}
                      </span>
                    </motion.a>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
          
          {/* الأقسام الرئيسية */}
          <div className="flex flex-col space-y-8 mb-12">
            {/* قسم الرئيسية المميز */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.8, type: "spring", stiffness: 50 }}
              className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/40 shadow-2xl"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.4, duration: 0.6 }}
                className="text-center"
              >
                <Link
                  href="/"
                  className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 px-10 rounded-full text-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                  العودة إلى الصفحة الرئيسية
                </Link>
              </motion.div>
            </motion.div>
            
            {/* قسم المحتوى */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.8, type: "spring", stiffness: 50 }}
              className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 shadow-2xl"
            >
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 2.3, duration: 0.6 }}
                className="flex items-center mb-8"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 2.4, type: "spring", stiffness: 120 }}
                  className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mr-4"
                >
                  <Play className="w-6 h-6 text-blue-400" />
                </motion.div>
                <motion.h3 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 2.5, duration: 0.6 }}
                  className="text-2xl font-bold text-white"
                >
                  المحتوى
                </motion.h3>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contentLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 2.6 + index * 0.1, duration: 0.6 }}
                    className="list-none"
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group p-4 rounded-2xl hover:bg-gray-700/30"
                    >
                      <span className="ml-4 text-blue-400">{link.icon}</span>
                      <span className="flex-1 font-medium text-lg">{link.text}</span>
                      <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  </motion.li>
                ))}
              </div>
            </motion.div>
            
            {/* قسم من نحن */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.8, type: "spring", stiffness: 50 }}
              className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 shadow-2xl"
            >
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 2.5, duration: 0.6 }}
                className="flex items-center mb-8"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 2.6, type: "spring", stiffness: 120 }}
                  className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mr-4"
                >
                  <Users className="w-6 h-6 text-purple-400" />
                </motion.div>
                <motion.h3 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 2.7, duration: 0.6 }}
                  className="text-2xl font-bold text-white"
                >
                  تعرف علينا
                </motion.h3>
              </motion.div>
              <ul className="space-y-4">
                {aboutLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 2.8 + index * 0.1, duration: 0.6 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group p-4 rounded-2xl hover:bg-gray-700/30"
                    >
                      <span className="ml-4 text-purple-400">{link.icon}</span>
                      <span className="flex-1 font-medium text-lg">{link.text}</span>
                      <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* قسم التواصل */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.6, duration: 0.8, type: "spring", stiffness: 50 }}
              className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 shadow-2xl"
            >
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 2.7, duration: 0.6 }}
                className="flex items-center mb-8"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 2.8, type: "spring", stiffness: 120 }}
                  className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mr-4"
                >
                  <MessageSquare className="w-6 h-6 text-green-400" />
                </motion.div>
                <motion.h3 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 2.9, duration: 0.6 }}
                  className="text-2xl font-bold text-white"
                >
                  التواصل
                </motion.h3>
              </motion.div>
              <ul className="space-y-4">
                {contactLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 3 + index * 0.1, duration: 0.6 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group p-4 rounded-2xl hover:bg-gray-700/30"
                    >
                      <span className="ml-4 text-green-400">{link.icon}</span>
                      <span className="flex-1 font-medium text-lg">{link.text}</span>
                      <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* قسم السياسات */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.8, duration: 0.8, type: "spring", stiffness: 50 }}
              className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 shadow-2xl"
            >
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 2.9, duration: 0.6 }}
                className="flex items-center mb-8"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 3, type: "spring", stiffness: 120 }}
                  className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mr-4"
                >
                  <Shield className="w-6 h-6 text-purple-400" />
                </motion.div>
                <motion.h3 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 3.1, duration: 0.6 }}
                  className="text-2xl font-bold text-white"
                >
                  السياسات
                </motion.h3>
              </motion.div>
              <ul className="space-y-4">
                {policyLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 3.2 + index * 0.1, duration: 0.6 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group p-4 rounded-2xl hover:bg-gray-700/30"
                    >
                      <span className="ml-4 text-purple-400">{link.icon}</span>
                      <span className="flex-1 font-medium text-lg">{link.text}</span>
                      <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
          
          {/* حقوق النشر */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.4, duration: 0.8, type: "spring", stiffness: 50 }}
            className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 shadow-2xl text-center"
          >
            <motion.p 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 3.5, type: "spring", stiffness: 100 }}
              className="text-gray-400 text-lg"
            >
              {year} فذلكه. جميع الحقوق محفوظة.
            </motion.p>
          </motion.div>
        </div>
      </motion.footer>
      
      <style jsx global>{`
        @keyframes tilt {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        .animate-tilt {
          animation: tilt 3s ease-in-out infinite;
        }
        
        .bg-grid-pattern {
          background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </>
  );
}