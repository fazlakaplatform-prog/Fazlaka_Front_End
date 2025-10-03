'use client'

import React, { useState, useEffect } from 'react'
import { useUser, useReverification } from '@clerk/nextjs'
import { EmailAddress } from '@clerk/nextjs/server'

// تعريف أنواع أكثر تحديدًا
interface LinkedObject {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface AppEmailAddress {
  id: string
  emailAddress: string
  verification: {
    status: string
    strategy: string
    attempts: number | null
    expireAt: Date | null
    externalVerificationRedirectURL: URL | null
  }
  linkedTo: LinkedObject[]
  createdAt?: string
  updatedAt?: string
}

function safeString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}
function safeNumber(v: unknown): number | null {
  return typeof v === 'number' ? v : null
}
function safeURL(v: unknown): URL | null {
  try {
    if (typeof v === 'string') return new URL(v)
    if (v instanceof URL) return v
  } catch { }
  return null
}

interface ChangeEmailPanelProps {
  isRTL?: boolean;
}

export default function ChangeEmailPanel({ isRTL = true }: ChangeEmailPanelProps) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [emailId, setEmailId] = useState<string | null>(null)
  const [emailAddresses, setEmailAddresses] = useState<AppEmailAddress[]>([])

  // النصوص حسب اللغة
  const texts = {
    ar: {
      currentEmailAddresses: "عناوين البريد الإلكتروني الحالية",
      noEmailAddresses: "لا توجد عناوين بريد إلكتروني مضافة",
      primary: "الإيميل الأساسي",
      linked: "مرتبط",
      pendingVerification: "في انتظار التحقق",
      addedOn: "أضيف في",
      unknownDate: "غير معروف",
      addNewEmail: "إضافة بريد إلكتروني جديد",
      newEmail: "الإيميل الجديد",
      sendVerificationCode: "أرسل رمز التحقق",
      verificationCode: "رمز التحقق",
      verify: "تحقق",
      verificationSent: "تم إرسال رمز التحقق إلى الإيميل الجديد (أو تأكد من صندوق الرسائل). أدخله هنا.",
      verifying: "جاري التحقق...",
      verifiedPreviously: "تم التحقق مسبقًا — جاري تعيين الإيميل كـ رئيسي...",
      emailChangedSuccessfully: "تم تغيير الإيميل الرئيسي بنجاح",
      creatingEmail: "جاري إنشاء الإيميل...",
      emailNotFound: "لم نتمكن من إيجاد الـ EmailAddress بعد الإنشاء — أعد المحاولة",
      verificationFailed: "التحقق لم ينجح — تأكد من الكود وحاول مرة أخرى",
      errorAddingEmail: "حدث خطأ أثناء إضافة الإيميل",
      errorVerifying: "خطأ أثناء التحقق",
      mustSignIn: "يجب تسجيل الدخول لتغيير الإيميل"
    },
    en: {
      currentEmailAddresses: "Current Email Addresses",
      noEmailAddresses: "No email addresses added",
      primary: "Primary",
      linked: "Linked",
      pendingVerification: "Pending Verification",
      addedOn: "Added on",
      unknownDate: "Unknown",
      addNewEmail: "Add New Email Address",
      newEmail: "New Email",
      sendVerificationCode: "Send Verification Code",
      verificationCode: "Verification Code",
      verify: "Verify",
      verificationSent: "Verification code sent to the new email (or check your inbox). Enter it here.",
      verifying: "Verifying...",
      verifiedPreviously: "Previously verified — setting email as primary...",
      emailChangedSuccessfully: "Primary email changed successfully",
      creatingEmail: "Creating email...",
      emailNotFound: "Could not find EmailAddress after creation — try again",
      verificationFailed: "Verification failed — make sure the code is correct and try again",
      errorAddingEmail: "An error occurred while adding the email",
      errorVerifying: "Error during verification",
      mustSignIn: "You must sign in to change the email"
    }
  };
  
  const t = texts[isRTL ? 'ar' : 'en'];

  // دالة مساعدة لتحويل عناوين البريد بدون استخدام any - تقبل أي شكل مُحتمل من user.emailAddresses
  const mapEmailAddresses = (emails: unknown): AppEmailAddress[] => {
    if (!Array.isArray(emails)) return []
    return emails.map(item => {
      const rec = item as Record<string, unknown>

      // استخراج الحقول الأساسية بأمان (قد تأتي من EmailAddressResource أو EmailAddress)
      const id = safeString(rec.id) ?? ''
      const emailAddr = safeString(rec.emailAddress) ?? ''

      // استخراج verification بشكل آمن
      const verificationRaw = rec.verification as unknown
      let vStatus = 'unverified'
      let vStrategy = 'email_code'
      let vAttempts: number | null = null
      let vExpireAt: Date | null = null
      let vExternalRedirect: URL | null = null

      if (verificationRaw && typeof verificationRaw === 'object') {
        const vObj = verificationRaw as Record<string, unknown>
        vStatus = safeString(vObj.status) ?? vStatus
        vStrategy = safeString(vObj.strategy) ?? vStrategy
        vAttempts = safeNumber(vObj.attempts)
        if (vObj.expireAt) {
          const raw = vObj.expireAt
          const parsed = typeof raw === 'string' ? new Date(raw) : (raw instanceof Date ? raw : null)
          vExpireAt = parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : null
        }
        vExternalRedirect = safeURL(vObj.externalVerificationRedirectURL)
      }

      // linkedTo معالجة آمنة
      const linked: LinkedObject[] = Array.isArray(rec.linkedTo) ? (rec.linkedTo as unknown[]).map(link => {
        if (link && typeof link === 'object') {
          const l = link as Record<string, unknown>
          const lid = safeString(l.id) ?? 'unknown'
          const ltype = safeString(l.type) ?? 'unknown'
          const result: LinkedObject = { id: lid, type: ltype }
          Object.keys(l).forEach(k => { if (k !== 'id' && k !== 'type') result[k] = l[k] })
          return result
        }
        return { id: 'unknown', type: 'unknown' }
      }) : []

      return {
        id: id || String(rec.id || ''),
        emailAddress: emailAddr || String(rec.emailAddress || ''),
        verification: {
          status: vStatus,
          strategy: vStrategy,
          attempts: vAttempts,
          expireAt: vExpireAt,
          externalVerificationRedirectURL: vExternalRedirect,
        },
        linkedTo: linked,
        createdAt: safeString(rec.createdAt),
        updatedAt: safeString(rec.updatedAt),
      } as AppEmailAddress
    })
  }

  // تحديث قائمة الإيميلات عند تغيير بيانات المستخدم
  useEffect(() => {
    if (user) {
      // مرر القيمة مباشرة مهما كان نوعها لأن mapEmailAddresses تقبل unknown
      setEmailAddresses(mapEmailAddresses(user.emailAddresses))
    }
  }, [user])

  const createEmailAddressWithReverification = useReverification(async (e: string) => {
    return await user?.createEmailAddress({ email: e })
  })

  if (!isLoaded) return null
  if (!isSignedIn || !user) return <div className="p-4">{t.mustSignIn}</div>

  const startAdd = async (ev?: React.FormEvent) => {
    ev?.preventDefault()
    try {
      setStatus(t.creatingEmail)
      const created = await createEmailAddressWithReverification(email)

      // تحديث بيانات المستخدم
      await user.reload()
      setEmailAddresses(mapEmailAddresses(user.emailAddresses))

      const emailItem = user.emailAddresses?.find(eA => eA.emailAddress === email || eA.id === created?.id) || created
      if (!emailItem) {
        setStatus(t.emailNotFound)
        return
      }

      setEmailId(emailItem.id)

      // محاولة إرسال رمز التحقق
      try {
        const preparable = emailItem as unknown as { prepareVerification?: (options: { strategy: string }) => Promise<unknown> }
        if (typeof preparable.prepareVerification === 'function') {
          await preparable.prepareVerification({ strategy: 'email_code' })
        }
      } catch (pErr) {
        console.warn('prepareVerification failed locally:', pErr)
      }

      setIsVerifying(true)
      setStatus(t.verificationSent)
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof Error) {
        setStatus(err.message || t.errorAddingEmail)
      } else {
        setStatus(t.errorAddingEmail)
      }
    }
  }

  const verifyCode = async (ev?: React.FormEvent) => {
    ev?.preventDefault()
    if (!emailId) return setStatus('لا يوجد إيميل للتحقق منه')

    try {
      setStatus(t.verifying)

      // تحديث بيانات المستخدم
      await user.reload()
      setEmailAddresses(mapEmailAddresses(user.emailAddresses))
      const fresh = user.emailAddresses?.find(e => e.id === emailId)

      // إذا كان مُتحقّقًا مسبقًا
      if (fresh?.verification?.status === 'verified' || (fresh as EmailAddress & { verified?: boolean })?.verified === true) {
        setStatus(t.verifiedPreviously)
        await user.update({ primaryEmailAddressId: emailId })
        await user.reload()
        setEmailAddresses(mapEmailAddresses(user.emailAddresses))
        setStatus(t.emailChangedSuccessfully)
        setIsVerifying(false)
        setEmail('')
        setCode('')
        return
      }

      // محاولة التحقق
      try {
        const attemptable = fresh as EmailAddress & { attemptVerification?: (options: { code: string }) => Promise<{ verification: { status: string } }> }
        if (fresh && typeof attemptable.attemptVerification === 'function') {
          const attempt = await attemptable.attemptVerification({ code })
          const verified = attempt?.verification?.status === 'verified'
          if (!verified) {
            setStatus(t.verificationFailed)
            return
          }
        } else {
          // Fallback إلى الخادم
          const fallback = await fetch('/api/profile/email/attempt-verify', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ emailAddressId: emailId, code })
          })

          if (!fallback.ok) {
            const txt = await fallback.text().catch(() => null)
            throw new Error(txt || 'فشل التحقق عبر الخادم')
          }
        }

        // بعد التحقق بنجاح
        setStatus(t.verifiedPreviously)
        await user.reload()
        setEmailAddresses(mapEmailAddresses(user.emailAddresses))
        await user.update({ primaryEmailAddressId: emailId })
        await user.reload()
        setEmailAddresses(mapEmailAddresses(user.emailAddresses))

        setStatus(t.emailChangedSuccessfully)
        setIsVerifying(false)
        setEmail('')
        setCode('')
      } catch (innerErr: unknown) {
        if (innerErr instanceof Error) {
          const msg = String(innerErr.message).toLowerCase()
          if (msg.includes('already been verified') || msg.includes('already verified')) {
            setStatus(t.verifiedPreviously)
            await user.reload()
            setEmailAddresses(mapEmailAddresses(user.emailAddresses))
            await user.update({ primaryEmailAddressId: emailId })
            await user.reload()
            setEmailAddresses(mapEmailAddresses(user.emailAddresses))

            setStatus(t.emailChangedSuccessfully)
            setIsVerifying(false)
            setEmail('')
            setCode('')
            return
          }
        }
        throw innerErr
      }
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof Error) {
        setStatus(err.message || t.errorVerifying)
      } else {
        setStatus(t.errorVerifying)
      }
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return t.unknownDate
    const date = new Date(dateString)
    return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 overflow-visible" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* قسم عرض الإيميلات الحالية */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.currentEmailAddresses}</h3>
        
        {emailAddresses.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
            {t.noEmailAddresses}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {emailAddresses.map((emailAddr) => (
              <div 
                key={emailAddr.id} 
                className={`flex flex-col sm:flex-row items-start justify-between p-4 rounded-lg border ${
                  emailAddr.id === user?.primaryEmailAddressId 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                }`}>
                <div className="flex items-start mb-3 sm:mb-0">
                  <div className={`w-3 h-3 rounded-full mt-1.5 mr-3 ${
                    emailAddr.id === user?.primaryEmailAddressId 
                      ? 'bg-green-500' 
                      : emailAddr.verification?.status === 'verified' 
                        ? 'bg-blue-500' 
                        : 'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-white break-all">
                      {emailAddr.emailAddress}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-1">
                      {emailAddr.id === user?.primaryEmailAddressId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <i className="fas fa-check-circle mr-1"></i> {t.primary}
                        </span>
                      ) : emailAddr.verification?.status === 'verified' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          <i className="fas fa-link mr-1"></i> {t.linked}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          <i className="fas fa-clock mr-1"></i> {t.pendingVerification}
                        </span>
                      )}
                      <span className="mx-1">•</span>
                      <span>{t.addedOn} {formatDate(emailAddr.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* قسم إضافة إيميل جديد */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.addNewEmail}</h3>
        
        {!isVerifying ? (
          <form onSubmit={startAdd} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <input
              type="email"
              required
              placeholder={t.newEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button 
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap w-full sm:w-auto" 
              type="submit"
            >
              {t.sendVerificationCode}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <input
              type="text"
              required
              placeholder={t.verificationCode}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button 
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors whitespace-nowrap w-full sm:w-auto" 
              type="submit"
            >
              {t.verify}
            </button>
          </form>
        )}

        {status && (
          <div className={`mt-3 text-sm p-3 rounded-md break-words ${
            status.includes('خطأ') || status.includes('فشل') || status.includes('Error') || status.includes('failed')
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
              : status.includes('نجاح') || status.includes('تم') || status.includes('success')
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  )
}