"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Edit, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/LanguageProvider"

// Translation object
const translations = {
  ar: {
    profile: "الملف الشخصي",
    name: "الاسم",
    bio: "نبذة شخصية",
    joinDate: "انضم في",
    editProfile: "تعديل الملف الشخصي",
    changePassword: "تغيير كلمة المرور",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    profileUpdated: "تم تحديث الملف الشخصي بنجاح",
    updateFailed: "فشل تحديث الملف الشخصي",
    errorOccurred: "حدث خطأ ما. يرجى المحاولة مرة أخرى",
    noBio: "لا توجد نبذة شخصية",
    user: "مستخدم",
    security: "الأمان والخصوصية",
  },
  en: {
    profile: "Profile",
    name: "Name",
    bio: "Bio",
    joinDate: "Joined on",
    editProfile: "Edit Profile",
    changePassword: "Change Password",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    profileUpdated: "Profile updated successfully",
    updateFailed: "Failed to update profile",
    errorOccurred: "An error occurred. Please try again",
    noBio: "No bio available",
    user: "User",
    security: "Security & Privacy",
  }
};

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isRTL, language } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const t = translations[language]

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
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [session, status, router])

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
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(t.profileUpdated)
        setIsEditing(false)
      } else {
        setError(data.error || t.updateFailed)
      }
    } catch (error) {
      setError(t.errorOccurred)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Subtle Hero Section */}
      <div className="relative h-48 bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900">
        {/* Subtle Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-12 relative z-10">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Profile Header */}
          <div className="relative">
            {/* Profile Image */}
            <div className="flex justify-center pt-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                className="relative"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={128}
                    height={128}
                    className="rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </motion.div>
            </div>

            {/* User Info */}
            <div className="text-center px-8 pb-6 pt-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {name || session.user?.name || t.user}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center justify-center">
                  <Mail className="h-4 w-4 ml-2" />
                  {session.user?.email}
                </div>
                <div className="flex items-center justify-center">
                  <Calendar className="h-4 w-4 ml-2" />
                  {t.joinDate} {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="px-8 pb-8 space-y-6">
            {/* Bio Section */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t.bio}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {bio || t.noBio}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              >
                <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.editProfile}
              </button>
              
              <Link
                href="/change-password"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <Shield className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.changePassword}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsEditing(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t.editProfile}</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                {message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.name}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.bio}
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isLoading ? t.saving : t.save}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}