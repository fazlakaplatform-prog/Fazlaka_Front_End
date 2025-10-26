"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Lock, ArrowLeft, Mail, Key, Shield, CheckCircle, AlertCircle, Sparkles, User, Globe } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/LanguageProvider"

// تعريف واجهة للبيانات
interface ChangePasswordData {
  newPassword: string;
  currentPassword?: string;
  email?: string;
}

// نصوص التطبيق باللغتين
const translations = {
  ar: {
    backToProfile: "العودة إلى الملف الشخصي",
    changePassword: "تغيير كلمة المرور",
    chooseVerificationMethod: "اختر طريقة التحقق لتأمين حسابك",
    verificationMethod: "طريقة التحقق",
    password: "كلمة المرور",
    email: "بريد إلكتروني",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور الجديدة",
    sendVerificationCode: "إرسال كود التحقق",
    verificationCode: "كود التحقق",
    verify: "تحقق",
    resend: "إعادة إرسال",
    passwordStrength: "قوة كلمة المرور",
    weak: "ضعيفة",
    medium: "متوسطة",
    good: "جيدة",
    strong: "قوية",
    passwordsMatch: "كلمات المرور متطابقة",
    passwordsNotMatch: "كلمات المرور غير متطابقة",
    changePasswordButton: "تغيير كلمة المرور",
    changing: "جاري التغيير...",
    sending: "جاري الإرسال...",
    verifying: "جاري التحقق...",
    passwordMinLength: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    passwordsNotMatchError: "كلمات المرور الجديدة غير متطابقة",
    passwordChangedSuccess: "تم تغيير كلمة المرور بنجاح",
    otpSentSuccess: "تم إرسال كود التحقق إلى بريدك الإلكتروني",
    otpVerifiedSuccess: "تم التحقق من الكود بنجاح",
    identityVerified: "تم التحقق من هويتك بنجاح. يمكنك الآن إدخال كلمة المرور الجديدة.",
    weWillSendCode: "سنرسل كود تحقق إلى بريدك الإلكتروني:",
    enterCode: "أدخل الكود المكون من 6 أرقام",
    errorOccurred: "حدث خطأ ما. يرجى المحاولة مرة أخرى",
    failedToSendCode: "فشل في إرسال كود التحقق",
    invalidCode: "كود التحقق غير صحيح أو منتهي الصلاحية",
    failedToChangePassword: "فشل في تغيير كلمة المرور",
    mustVerifyCode: "يجب التحقق من الكود أولاً",
    codePlaceholder: "••••••••",
  },
  en: {
    backToProfile: "Back to Profile",
    changePassword: "Change Password",
    chooseVerificationMethod: "Choose a verification method to secure your account",
    verificationMethod: "Verification Method",
    password: "Password",
    email: "Email",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    sendVerificationCode: "Send Verification Code",
    verificationCode: "Verification Code",
    verify: "Verify",
    resend: "Resend",
    passwordStrength: "Password Strength",
    weak: "Weak",
    medium: "Medium",
    good: "Good",
    strong: "Strong",
    passwordsMatch: "Passwords match",
    passwordsNotMatch: "Passwords don't match",
    changePasswordButton: "Change Password",
    changing: "Changing...",
    sending: "Sending...",
    verifying: "Verifying...",
    passwordMinLength: "Password must be at least 6 characters",
    passwordsNotMatchError: "New passwords don't match",
    passwordChangedSuccess: "Password changed successfully",
    otpSentSuccess: "Verification code sent to your email",
    otpVerifiedSuccess: "Code verified successfully",
    identityVerified: "Your identity has been verified. You can now enter a new password.",
    weWillSendCode: "We will send a verification code to your email:",
    enterCode: "Enter the 6-digit code",
    errorOccurred: "An error occurred. Please try again",
    failedToSendCode: "Failed to send verification code",
    invalidCode: "Invalid or expired verification code",
    failedToChangePassword: "Failed to change password",
    mustVerifyCode: "You must verify the code first",
    codePlaceholder: "••••••••",
  }
};

export default function ChangePasswordPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isRTL, language, setLanguage } = useLanguage()
  const t = translations[language]
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // حالات جديدة للتحقق عبر OTP
  const [verificationMethod, setVerificationMethod] = useState<"password" | "otp">("password")
  const [otpStep, setOtpStep] = useState<'verification' | 'newPassword'>('verification')
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  
  // حالة قوة كلمة المرور
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [stars, setStars] = useState<{x: number, y: number, size: number, opacity: number}[]>([])

  // Handle redirect to sign-in page when not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in")
    }
  }, [status, router])

  useEffect(() => {
    // Generate random stars for space background
    const generatedStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    }))
    setStars(generatedStars)
  }, [])

  useEffect(() => {
    // Calculate password strength
    if (newPassword.length === 0) {
      setPasswordStrength(0)
      return
    }
    
    let strength = 0
    if (newPassword.length >= 6) strength += 25
    if (newPassword.length >= 10) strength += 25
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) strength += 25
    if (/[0-9]/.test(newPassword)) strength += 12.5
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 12.5
    
    setPasswordStrength(strength)
  }, [newPassword])

  useEffect(() => {
    // Reset OTP states when switching methods
    setOtpCode('')
    setOtpSent(false)
    setOtpStep('verification')
    setError('')
    setSuccess('')
  }, [verificationMethod])

  const handleSendOtp = async () => {
    if (!session?.user?.email) return
    
    setIsSendingOtp(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          purpose: "change-password",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        setSuccess(t.otpSentSuccess)
      } else {
        setError(data.error || t.failedToSendCode)
      }
    } catch {
      setError(t.errorOccurred)
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!session?.user?.email || !otpCode) return
    
    setIsVerifyingOtp(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          otpCode,
          purpose: "change-password",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t.otpVerifiedSuccess)
        setTimeout(() => {
            setSuccess("") // Clear success message before transitioning
            setOtpStep('newPassword')
        }, 1500)
      } else {
        setError(data.error || t.invalidCode)
      }
    } catch {
      setError(t.errorOccurred)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError(t.passwordsNotMatchError)
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError(t.passwordMinLength)
      setIsLoading(false)
      return
    }

    try {
      const endpoint = "/api/user/change-password"
      const body: ChangePasswordData = {
        newPassword,
      }

      if (verificationMethod === "password") {
        body.currentPassword = currentPassword
      } else {
        body.email = session?.user?.email || undefined
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t.passwordChangedSuccess)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setOtpCode("")
        setOtpSent(false)
        setOtpStep('verification')
        
        // Redirect after success
        setTimeout(() => {
          router.push("/profile")
        }, 2000)
      } else {
        setError(data.error || t.failedToChangePassword)
      }
    } catch {
      setError(t.errorOccurred)
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "bg-red-500"
    if (passwordStrength < 50) return "bg-orange-500"
    if (passwordStrength < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return t.weak
    if (passwordStrength < 50) return t.medium
    if (passwordStrength < 75) return t.good
    return t.strong
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (the useEffect will handle the redirect)
  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16 relative overflow-hidden ${isRTL ? 'font-arabic' : ''}`}>
      {/* Space Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-transparent"></div>
        {stars.map((star, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, ${star.opacity})`
            }}
          />
        ))}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-purple-500/10 blur-xl"
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-40 h-40 rounded-full bg-blue-500/10 blur-xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
      
      {/* Language Toggle */}
      <div className="absolute top-8 right-8 z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-white/20 dark:border-gray-700/30 text-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <Globe className="w-5 h-5" />
        </motion.button>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30">
          <div className="mb-6">
            <Link
              href="/profile"
              className={`inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isRTL ? <ArrowLeft className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
              {t.backToProfile}
            </Link>
            <div className="flex items-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
              {t.changePassword}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
              {t.chooseVerificationMethod}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800/30 flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800/30 flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
              <span>{success}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* اختيار طريقة التحقق */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.verificationMethod}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setVerificationMethod("password")}
                  className={`flex items-center justify-center px-4 py-3 border rounded-xl transition-all ${
                    verificationMethod === "password"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <Lock className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                  {t.password}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setVerificationMethod("otp")}
                  className={`flex items-center justify-center px-4 py-3 border rounded-xl transition-all ${
                    verificationMethod === "otp"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <Mail className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                  {t.email}
                </motion.button>
              </div>
            </div>

            {/* حقول التحقق حسب الطريقة المختارة */}
            <AnimatePresence mode="wait">
              {verificationMethod === "password" && (
                <motion.div
                  key="password-method"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.currentPassword}
                    </label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`appearance-none block w-full ${isRTL ? 'pl-10 pr-10' : 'pr-10 pl-10'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                        placeholder={t.codePlaceholder}
                      />
                      <button
                        type="button"
                        className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {verificationMethod === "otp" && otpStep === 'verification' && (
                <motion.div
                  key="otp-verification-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                    <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t.weWillSendCode} <span className="font-semibold">{session?.user?.email}</span>
                    </p>
                  </div>
                  {!otpSent ? (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition"
                    >
                      {isSendingOtp ? (
                        <span className="flex items-center">
                          <svg className="animate-spin" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t.sending}
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Mail className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                          {t.sendVerificationCode}
                        </span>
                      )}
                    </motion.button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.verificationCode}
                        </label>
                        <div className="relative">
                          <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                            <Key className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            id="otpCode"
                            type="text"
                            required
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className={`appearance-none block w-full ${isRTL ? 'pl-10' : 'pr-10'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                            placeholder={t.enterCode}
                          />
                        </div>
                      </div>
                      <div className={`flex space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp}
                          className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition"
                        >
                          {isVerifyingOtp ? (
                            <span className="flex items-center">
                              <svg className="animate-spin" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t.verifying}
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <CheckCircle className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                              {t.verify}
                            </span>
                          )}
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSendOtp}
                          disabled={isSendingOtp}
                          className="flex-1 flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition"
                        >
                          {isSendingOtp ? (
                            <span className="flex items-center">
                              <svg className="animate-spin" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t.sending}
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Mail className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                              {t.resend}
                            </span>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {verificationMethod === "otp" && otpStep === 'newPassword' && (
                <motion.div
                  key="otp-new-password-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/30">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t.identityVerified}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* حقول كلمة المرور الجديدة */}
            {(verificationMethod === "password" || otpStep === 'newPassword') && (
              <motion.div
                key="password-fields"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.newPassword}
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`appearance-none block w-full ${isRTL ? 'pl-10 pr-10' : 'pr-10 pl-10'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                      placeholder={t.codePlaceholder}
                    />
                    <button
                      type="button"
                      className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword.length > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t.passwordStrength}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{getPasswordStrengthText()}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full ${getPasswordStrengthColor()}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.confirmPassword}
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`appearance-none block w-full ${isRTL ? 'pl-10 pr-10' : 'pr-10 pl-10'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                      placeholder={t.codePlaceholder}
                    />
                    <button
                      type="button"
                      className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Match Indicator */}
                  {confirmPassword.length > 0 && (
                    <div className="mt-2 flex items-center">
                      {newPassword === confirmPassword ? (
                        <div className={`flex items-center text-green-500 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <CheckCircle className="w-3 h-3" style={isRTL ? { marginLeft: '0.25rem' } : { marginRight: '0.25rem' }} />
                          <span>{t.passwordsMatch}</span>
                        </div>
                      ) : (
                        <div className={`flex items-center text-red-500 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <svg className="w-3 h-3" style={isRTL ? { marginLeft: '0.25rem' } : { marginRight: '0.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>{t.passwordsNotMatch}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <div>
              <motion.button
                type="submit"
                disabled={isLoading || (verificationMethod === "otp" && otpStep !== 'newPassword')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-105"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.changing}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Shield className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                    {t.changePasswordButton}
                  </span>
                )}
              </motion.button>
            </div>
          </form>
        </div>
        
        {/* Floating Elements */}
        <motion.div
          className="absolute -top-10 -right-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-30 blur-xl"
          animate={{
            x: [0, 20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-20 h-20 bg-purple-200 dark:bg-purple-800 rounded-full opacity-30 blur-xl"
          animate={{
            x: [0, -20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </motion.div>
    </div>
  )
}