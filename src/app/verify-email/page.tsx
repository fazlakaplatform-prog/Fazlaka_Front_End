"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, AlertCircle, Mail, ArrowRight, ArrowLeft } from "lucide-react"

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [isRTL, setIsRTL] = useState(true)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  // النصوص حسب اللغة
  const texts = {
    ar: {
      title: "تفعيل البريد الإلكتروني",
      verifying: "جاري التحقق من بريدك الإلكتروني...",
      success: "تم تفعيل بريدك الإلكتروني بنجاح!",
      successMessage: "شكراً لك على تفعيل بريدك الإلكتروني. يمكنك الآن تسجيل الدخول إلى حسابك.",
      error: "فشل التحقق",
      errorMessage: "انتهت صلاحية رابط التحقق أو غير صالح. يرجى طلب رابط جديد.",
      tokenExpired: "انتهت صلاحية رابط التحقق",
      tokenExpiredMessage: "لقد انتهت صلاحية رابط التحقق. يرجى طلب رابط جديد.",
      goToLogin: "الذهاب إلى تسجيل الدخول",
      requestNewLink: "طلب رابط جديد",
      platformName: "فذلكه"
    },
    en: {
      title: "Email Verification",
      verifying: "Verifying your email...",
      success: "Your email has been verified successfully!",
      successMessage: "Thank you for verifying your email. You can now log in to your account.",
      error: "Verification Failed",
      errorMessage: "The verification link has expired or is invalid. Please request a new link.",
      tokenExpired: "Verification link expired",
      tokenExpiredMessage: "The verification link has expired. Please request a new one.",
      goToLogin: "Go to Login",
      requestNewLink: "Request New Link",
      platformName: "Fazlaka"
    }
  };
  
  const t = texts[isRTL ? 'ar' : 'en'];

  useEffect(() => {
    // التحقق من تفضيل اللغة المحفوظ في localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
      const shouldBeRTL = savedLanguage === 'ar';
      setIsRTL(shouldBeRTL);
    } else {
      // إذا لم يكن هناك تفضيل محفوظ، استخدم لغة المتصفح
      const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || '';
      const shouldBeRTL = browserLang.includes('ar');
      setIsRTL(shouldBeRTL);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage(t.errorMessage)
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setMessage(t.successMessage)
        } else {
          setStatus("error")
          
          // تحديد نوع الخطأ بناءً على الرسالة
          if (data.error && data.error.includes("expired")) {
            setMessage(t.tokenExpiredMessage)
          } else {
            setMessage(data.error || t.errorMessage)
          }
        }
      } catch (error) {
        console.error("Email verification error:", error)
        setStatus("error")
        setMessage(t.errorMessage)
      }
    }

    verifyEmail()
  }, [token]) // Removed the t.* values from the dependency array

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* دوائر زخرفية متحركة */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-2xl animate-pulse shadow-xl shadow-blue-500/10"></div>
      <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-gradient-to-r from-purple-400/15 to-blue-400/15 blur-3xl animate-pulse shadow-xl shadow-purple-500/10"></div>
      
      <div className="w-full max-w-md mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-blue-500/20 border border-gray-200 dark:border-gray-800 p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {t.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t.platformName}
            </p>
          </div>

          {/* Status Content */}
          <div className="text-center">
            {status === "loading" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">{t.verifying}</p>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="py-8"
              >
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t.success}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {message}
                </p>
                <button
                  onClick={() => router.push("/sign-in")}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  {t.goToLogin}
                  {isRTL ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                </button>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="py-8"
              >
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t.error}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/resend-verification")}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    {t.requestNewLink}
                    {isRTL ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  </button>
                  <button
                    onClick={() => router.push("/sign-in")}
                    className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                  >
                    {t.goToLogin}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}