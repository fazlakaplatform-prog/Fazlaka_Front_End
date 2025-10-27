// File: src/app/profile/[[...rest]]/page.tsx

"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { User, Mail, Calendar, Edit, Shield, X, CheckCircle, AlertCircle, Camera, Trash2, ChevronDown, ChevronUp, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/LanguageProvider"

// Translation object
const translations = {
  ar: {
    profile: "الملف الشخصي",
    name: "الاسم",
    bio: "نبذة شخصية",
    editProfile: "تعديل الملف الشخصي",
    changePassword: "تغيير كلمة المرور",
    changeEmail: "تغيير البريد الإلكتروني",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    profileUpdated: "تم تحديث الملف الشخصي بنجاح",
    updateFailed: "فشل تحديث الملف الشخصي",
    errorOccurred: "حدث خطأ ما. يرجى المحاولة مرة أخرى",
    noBio: "لا توجد نبذة شخصية",
    user: "مستخدم",
    changeProfilePicture: "تغيير الصورة الشخصية",
    uploading: "جاري الرفع...",
    uploadFailed: "فشل رفع الصورة",
    imageTooLarge: "حجم الصورة كبير جدًا (الحد الأقصى 5 ميجابايت)",
    invalidImageType: "نوع الملف غير مدعوم (يرجى رفع صورة بصيغة JPEG, PNG, أو WebP)",
    imageUpdated: "تم تحديث الصورة الشخصية بنجاح",
    personalInfo: "المعلومات الشخصية",
    profilePicture: "الصورة الشخصية",
    chooseImage: "اختر صورة",
    removeImage: "إزالة الصورة",
    confirmRemove: "هل أنت متأكد من أنك تريد إزالة الصورة الشخصية؟",
    yes: "نعم",
    no: "لا",
    email: "البريد الإلكتروني",
    memberSince: "عضو منذ",
    accountInfo: "معلومات الحساب",
    // New translations for email change
    newEmail: "البريد الإلكتروني الجديد",
    confirmNewEmail: "تأكيد البريد الإلكتروني الجديد",
    verificationCode: "كود التحقق",
    sendVerificationCode: "إرسال كود التحقق",
    verifyCode: "تحقق من الكود",
    emailChangeSent: "تم إرسال كود التحقق إلى بريدك الإلكتروني الجديد",
    emailChanged: "تم تغيير بريدك الإلكتروني بنجاح",
    emailChangeFailed: "فشل تغيير البريد الإلكتروني",
    invalidCode: "كود التحقق غير صحيح أو منتهي الصلاحية",
    emailsNotMatch: "البريدان الإلكترونيان غير متطابقين",
    enterVerificationCode: "أدخل كود التحقق المرسل إلى بريدك الإلكتروني الجديد",
    currentEmail: "البريد الإلكتروني الحالي",
    // New translations
    memberSinceDate: "عضو منذ {date}",
    formatDate: (date: Date) => {
      // Using Gregorian calendar with Arabic month names
      const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
      ];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    }
  },
  en: {
    profile: "Profile",
    name: "Name",
    bio: "Bio",
    editProfile: "Edit Profile",
    changePassword: "Change Password",
    changeEmail: "Change Email",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    profileUpdated: "Profile updated successfully",
    updateFailed: "Failed to update profile",
    errorOccurred: "An error occurred. Please try again",
    noBio: "No bio available",
    user: "User",
    changeProfilePicture: "Change Profile Picture",
    uploading: "Uploading...",
    uploadFailed: "Failed to upload image",
    imageTooLarge: "Image too large (max 5MB)",
    invalidImageType: "Invalid file type (please upload JPEG, PNG, or WebP)",
    imageUpdated: "Profile image updated successfully",
    personalInfo: "Personal Information",
    profilePicture: "Profile Picture",
    chooseImage: "Choose Image",
    removeImage: "Remove Image",
    confirmRemove: "Are you sure you want to remove your profile picture?",
    yes: "Yes",
    no: "No",
    email: "Email",
    memberSince: "Member Since",
    accountInfo: "Account Information",
    // New translations for email change
    newEmail: "New Email",
    confirmNewEmail: "Confirm New Email",
    verificationCode: "Verification Code",
    sendVerificationCode: "Send Verification Code",
    verifyCode: "Verify Code",
    emailChangeSent: "Verification code sent to your new email",
    emailChanged: "Your email has been changed successfully",
    emailChangeFailed: "Failed to change email",
    invalidCode: "Invalid or expired verification code",
    emailsNotMatch: "Emails do not match",
    enterVerificationCode: "Enter the verification code sent to your new email",
    currentEmail: "Current Email",
    // New translations
    memberSinceDate: "Member since {date}",
    formatDate: (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    }
  }
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { isRTL, language } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [image, setImage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [imageError, setImageError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [createdAt, setCreatedAt] = useState<Date | null>(null)
  const t = translations[language]
  
  // Email change states
  const [newEmail, setNewEmail] = useState("")
  const [confirmNewEmail, setConfirmNewEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [emailChangeMessage, setEmailChangeMessage] = useState("")
  const [emailChangeError, setEmailChangeError] = useState("")
  
  // Accordion states
  const [profilePictureSection, setProfilePictureSection] = useState(false)
  const [personalInfoSection, setPersonalInfoSection] = useState(false)
  const [emailSection, setEmailSection] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/sign-in")
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user/${session!.user.id}`)
        if (response.ok) {
          const userData = await response.json()
          setName(userData.name || "")
          setBio(userData.bio || "")
          setImage(userData.image || session.user?.image || "")
          setCreatedAt(userData.createdAt ? new Date(userData.createdAt) : null)
        }
      } catch {
        console.error("Error fetching user data")
      }
    }

    fetchUserData()
  }, [session, status, router])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isEditing || showConfirmDialog) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isEditing, showConfirmDialog])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setImageError(t.imageTooLarge)
      return
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      setImageError(t.invalidImageType)
      return
    }

    setImageError("")
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const imageUrl = data.url
        
        setImage(imageUrl)
        
        const updateResponse = await fetch(`/api/user/${session!.user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: imageUrl,
          }),
        })

        if (updateResponse.ok) {
          await update({
            ...session!,
            user: {
              ...session!.user,
              image: imageUrl,
            }
          })
          
          setMessage(t.imageUpdated)
          setTimeout(() => setMessage(""), 3000)
        } else {
          setImageError(t.updateFailed)
        }
      } else {
        setImageError(t.uploadFailed)
      }
    } catch {
      setImageError(t.uploadFailed)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    try {
      const updateResponse = await fetch(`/api/user/${session!.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: "",
        }),
      })

      if (updateResponse.ok) {
        await update({
          ...session!,
          user: {
            ...session!.user,
            image: "",
          }
        })
        
        setImage("")
        setMessage(t.imageUpdated)
        setTimeout(() => setMessage(""), 3000)
        setShowConfirmDialog(false)
      } else {
        setImageError(t.updateFailed)
      }
    } catch {
      setImageError(t.updateFailed)
    }
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`/api/user/${session!.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          bio,
          image,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(t.profileUpdated)
        setIsEditing(false)
        
        await update({
          ...session!,
          user: {
            ...session!.user,
            name,
            image,
          }
        })
      } else {
        setError(data.error || t.updateFailed)
      }
    } catch {
      setError(t.errorOccurred)
    } finally {
      setIsLoading(false)
    }
  }

  // Email change functions
  const handleSendVerificationCode = async () => {
    if (newEmail !== confirmNewEmail) {
      setEmailChangeError(t.emailsNotMatch)
      return
    }

    setEmailChangeError("")
    setEmailChangeMessage("")

    try {
      const response = await fetch("/api/auth/send-email-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentEmail: session?.user?.email,
          newEmail,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsCodeSent(true)
        setEmailChangeMessage(t.emailChangeSent)
      } else {
        setEmailChangeError(data.error || t.emailChangeFailed)
      }
    } catch {
      setEmailChangeError(t.errorOccurred)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setEmailChangeError(t.enterVerificationCode)
      return
    }

    setEmailChangeError("")
    setEmailChangeMessage("")
    setIsVerifyingCode(true)

    try {
      const response = await fetch("/api/auth/verify-email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentEmail: session?.user?.email,
          newEmail,
          verificationCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailChangeMessage(t.emailChanged)
        
        // تحديث الجلسة بالإيميل الجديد
        await update({
          ...session!,
          user: {
            ...session!.user,
            email: newEmail,
          }
        })
        
        // Close email change section after a short delay
        setTimeout(() => {
          setEmailSection(false)
          setIsCodeSent(false)
          setNewEmail("")
          setConfirmNewEmail("")
          setVerificationCode("")
        }, 2000)
      } else {
        setEmailChangeError(data.error || t.invalidCode)
      }
    } catch {
      setEmailChangeError(t.errorOccurred)
    } finally {
      setIsVerifyingCode(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated stars background */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.8 + 0.2,
                animation: `twinkle ${Math.random() * 5 + 5}s linear infinite`,
              }}
            />
          ))}
        </div>
        
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
        
        <style jsx>{`
          @keyframes twinkle {
            0% { opacity: 0.2; }
            50% { opacity: 0.8; }
            100% { opacity: 0.2; }
          }
        `}</style>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Animated stars background */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.8 + 0.2,
              animation: `twinkle ${Math.random() * 5 + 5}s linear infinite`,
            }}
          />
        ))}
      </div>
      
      {/* Golden accent elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-400 rounded-full filter blur-3xl opacity-10"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400 rounded-full filter blur-3xl opacity-10"></div>
      
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 relative z-10">
        {/* Profile Card - Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden mb-8 border border-yellow-400/20"
          style={{
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(251, 191, 36, 0.1)'
          }}
        >
          {/* Content */}
          <div className="relative z-10">
            {/* Background Gradient with gold accent */}
            <div className="h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 to-transparent"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full filter blur-3xl opacity-20"></div>
            </div>
            
            {/* Profile Content */}
            <div className="px-6 pb-6">
              {/* Profile Image - Centered with Frame */}
              <div className="flex flex-col items-center -mt-20 mb-4">
                <div className="relative p-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-xl">
                  <div className="p-1 bg-white dark:bg-gray-800 rounded-full">
                    {image || session.user?.image ? (
                      <Image
                        src={image || session.user?.image || ""}
                        alt={session.user?.name || "User"}
                        width={120}
                        height={120}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-30 h-30 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="h-16 w-16 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Name with golden color */}
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mt-4">
                  {name || session.user?.name || t.user}
                </h2>
                
                {/* Bio */}
                <p className="text-gray-600 dark:text-gray-300 text-center mt-2 max-w-md">
                  {bio || t.noBio}
                </p>
              </div>

              {/* Messages */}
              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {message}
                  </motion.div>
                )}
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-center"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Account Information - Enhanced Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative group"
        >
          {/* Card Background with gradient overlay */}
          <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl border border-yellow-400/20"></div>
          
          {/* Card Content */}
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
            {/* Header with gradient text */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.accountInfo}
              </h3>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
              >
                <Edit className="h-4 w-4 inline mr-2" />
                {t.editProfile}
              </motion.button>
            </div>
            
            {/* Info Items with enhanced styling */}
            <div className="space-y-6">
              <div className="group/item flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4 group-hover/item:scale-110 transition-transform">
                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.email}</p>
                    <p className="text-gray-900 dark:text-white font-medium">{session.user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="group/item flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4 group-hover/item:scale-110 transition-transform">
                    <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.name}</p>
                    <p className="text-gray-900 dark:text-white font-medium">{name || session.user?.name || t.user}</p>
                  </div>
                </div>
              </div>

              <div className="group/item flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4 group-hover/item:scale-110 transition-transform">
                    <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.memberSince}</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {createdAt ? t.formatDate(createdAt) : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-yellow-400/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                    {t.editProfile}
                  </h2>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Profile Picture Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setProfilePictureSection(!profilePictureSection)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <Camera className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{t.profilePicture}</span>
                    </div>
                    {profilePictureSection ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                  </button>
                  
                  <AnimatePresence>
                    {profilePictureSection && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-4">
                            {image || session.user?.image ? (
                              <div className="relative">
                                <Image
                                  src={image || session.user?.image || ""}
                                  alt={session.user?.name || "User"}
                                  width={80}
                                  height={80}
                                  className="rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-md"
                                />
                                <button
                                  onClick={() => setShowConfirmDialog(true)}
                                  className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors shadow-md"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-md">
                                <User className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                              >
                                {isUploading ? t.uploading : t.chooseImage}
                              </button>
                              {imageError && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{imageError}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Personal Information Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setPersonalInfoSection(!personalInfoSection)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{t.personalInfo}</span>
                    </div>
                    {personalInfoSection ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                  </button>
                  
                  <AnimatePresence>
                    {personalInfoSection && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t.name}
                            </label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t.bio}
                            </label>
                            <textarea
                              rows={3}
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email Change Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setEmailSection(!emailSection)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{t.changeEmail}</span>
                    </div>
                    {emailSection ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                  </button>
                  
                  <AnimatePresence>
                    {emailSection && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t.currentEmail}
                            </label>
                            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm">
                              {session.user?.email}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t.newEmail}
                            </label>
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t.confirmNewEmail}
                            </label>
                            <input
                              type="email"
                              value={confirmNewEmail}
                              onChange={(e) => setConfirmNewEmail(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                            />
                          </div>

                          {isCodeSent && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t.verificationCode}
                              </label>
                              <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                              />
                            </div>
                          )}

                          {/* Email Change Messages */}
                          <AnimatePresence>
                            {emailChangeMessage && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg flex items-center shadow-sm"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {emailChangeMessage}
                              </motion.div>
                            )}
                            
                            {emailChangeError && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-center shadow-sm"
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {emailChangeError}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex gap-2">
                            {!isCodeSent ? (
                              <button
                                onClick={handleSendVerificationCode}
                                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm"
                              >
                                {t.sendVerificationCode}
                              </button>
                            ) : (
                              <button
                                onClick={handleVerifyCode}
                                disabled={isVerifyingCode}
                                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
                              >
                                {isVerifyingCode ? t.saving : t.verifyCode}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password Change Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                  <Link href="/change-password" className="block">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{t.changePassword}</span>
                      </div>
                      <div className="text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 shadow-md"
                  >
                    {isLoading ? t.saving : t.save}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium shadow-md"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-yellow-400/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <X className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">
                  {t.confirmRemove}
                </h3>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleRemoveImage}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md"
                >
                  {t.yes}
                </button>
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium shadow-md"
                >
                  {t.no}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}