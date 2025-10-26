"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, AlertCircle } from "lucide-react"
import { signIn } from "next-auth/react"

export default function MagicLinkPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    
    if (!token) {
      setError("رابط تسجيل الدخول غير صالح")
      setIsLoading(false)
      return
    }

    const verifyMagicLink = async () => {
      try {
        const response = await fetch(`/api/auth/verify-magic-link?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setSuccess(true)
          // تسجيل الدخول باستخدام NextAuth
          const result = await signIn("credentials", {
            email: data.user.email,
            password: "", // كلمة مرور فارغة لأننا نستخدم الرابط السحري
            redirect: false,
          })

          if (result?.ok) {
            setTimeout(() => {
              router.push("/")
            }, 3000)
          } else {
            setError("Failed to sign in")
          }
        } else {
          setError(data.error || "Failed to verify magic link")
        }
      } catch (error) {
        setError("An error occurred. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    verifyMagicLink()
  }, [searchParams, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تسجيل الدخول...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
          <div className="text-center mb-8">
            {success ? (
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {success ? "تم تسجيل الدخول بنجاح" : "فشل تسجيل الدخول"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {success 
                ? "سيتم توجيهك إلى الصفحة الرئيسية خلال لحظات..."
                : error || "حدث خطأ أثناء محاولة تسجيل الدخول."
              }
            </p>
          </div>

          <div className="space-y-3">
            {success ? (
              <Link
                href="/"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                الذهاب إلى الصفحة الرئيسية
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  العودة إلى تسجيل الدخول
                </Link>
                <Link
                  href="/sign-in"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  طلب رابط تسجيل دخول جديد
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}