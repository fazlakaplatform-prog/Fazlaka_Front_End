'use client';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { EmailAddressJSON } from "@clerk/types";
import Link from "next/link";
import Image from "next/image";
import ChangeEmailPanel from './ChangeEmailPanel';

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  useEffect(() => {
    if (editSectionOpen) {
      const timer = setTimeout(() => {
        const editSection = document.getElementById('avatar-edit-section');
        if (editSection) {
          editSection.style.maxHeight = '1200px';
          editSection.style.opacity = '1';
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        const editSection = document.getElementById('avatar-edit-section');
        if (editSection) {
          editSection.style.maxHeight = '0';
          editSection.style.opacity = '0';
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editSectionOpen]);

  // تأثير حركي لأزرار التعديل
  useEffect(() => {
    if (editMode) {
      // تأخير بسيط قبل إظهار الأزرار لإنشاء تأثير متسلسل
      const timer = setTimeout(() => {
        setShowEditButtons(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // إخفاء الأزرار فورًا عند الخروج من وضع التعديل
      setShowEditButtons(false);
    }
  }, [editMode]);

  useEffect(() => {
    if (!isLoaded) return;
    setPreviewUrl(user?.imageUrl ?? null);
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
  }, [isLoaded, user]);

  const validateFile = (file: File) => {
    if (!file.type.startsWith("image/")) return "الملف مش صورة";
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) return "حجم الصورة أكبر من 5 ميجا";
    return null;
  };

  const readAsDataUrl = (f: File) =>
    new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = (e) => rej(e);
      fr.readAsDataURL(f);
    });

  const uploadToServerFallback = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("server upload failed");
      return true;
    } catch (e) {
      console.warn("server upload fallback failed", e);
      return false;
    }
  };

  const handleFile = useCallback(async (file: File) => {
    const err = validateFile(file);
    if (err) {
      setMessage(err);
      return;
    }
    setMessage(null);
    setUploading(true);
    
    try {
      // محاولة رفع الصورة باستخدام Clerk SDK
      console.log("Trying to upload with Clerk SDK...");
      if (user) {
        await user.setProfileImage({ file });
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setMessage("تم تحديث الصورة بنجاح");
        const imgElement = document.querySelector('.profile-avatar');
        if (imgElement) {
          imgElement.classList.add('animate-pulse', 'animate-spin-slow');
          setTimeout(() => {
            imgElement.classList.remove('animate-pulse', 'animate-spin-slow');
          }, 1500);
        }
        return;
      } else {
        throw new Error("User not available");
      }
    } catch (e1) {
      console.warn("setProfileImage({file}) failed:", e1);
      
      try {
        // محاولة ثانية باستخدام Data URL
        console.log("Trying to upload with Data URL...");
        const dataUrl = await readAsDataUrl(file);
        if (user) {
          await user.setProfileImage({ file: dataUrl });
          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl(objectUrl);
          setMessage("تم تحديث الصورة (بنسق بديل)");
          const imgElement = document.querySelector('.profile-avatar');
          if (imgElement) {
            imgElement.classList.add('animate-pulse');
            setTimeout(() => {
              imgElement.classList.remove('animate-pulse');
            }, 1000);
          }
          return;
        } else {
          throw new Error("User not available for Data URL upload");
        }
      } catch (e2) {
        console.warn("setProfileImage with dataURL failed:", e2);
        
        try {
          // محاولة أخيرة باستخدام الخادم
          console.log("Trying server fallback...");
          const serverOk = await uploadToServerFallback(file);
          if (serverOk) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            setMessage("تم تحديث الصورة عبر السيرفر");
            const imgElement = document.querySelector('.profile-avatar');
            if (imgElement) {
              imgElement.classList.add('animate-bounce');
              setTimeout(() => {
                imgElement.classList.remove('animate-bounce');
              }, 1000);
            }
            return;
          } else {
            throw new Error("Server fallback failed");
          }
        } catch (e3) {
          console.error("All avatar upload attempts failed", { 
            clerkError: e1, 
            dataUrlError: e2, 
            serverError: e3,
            fileInfo: {
              name: file.name,
              size: file.size,
              type: file.type
            }
          });
          
          // عرض رسالة خطأ مفصلة
          let errorMessage = "حصل خطأ أثناء رفع الصورة";

          // أضف رسائل الأخطاء المفصّلة باستخدام الدالة المساعدة
          const clerkMsg = getErrorMessage(e1);
          const dataUrlMsg = getErrorMessage(e2);
          const serverMsg = getErrorMessage(e3);

          if (clerkMsg) errorMessage += ` (Clerk: ${clerkMsg})`;
          if (dataUrlMsg) errorMessage += ` (Data URL: ${dataUrlMsg})`;
          if (serverMsg) errorMessage += ` (Server: ${serverMsg})`;

          errorMessage += " — حاول مرةً أخرى أو بلغ الإدارة";
          setMessage(errorMessage);
        }
      }
    } finally {
      setUploading(false);
    }
  }, [user]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const input = e.target as HTMLInputElement;
    input.value = "";
    await handleFile(file);
  }, [handleFile]);

  const toggleEditMode = () => {
    const newEditMode = !editMode;
    setEditMode(newEditMode);
    if (newEditMode) {
      setEditSectionOpen(true);
    }
  };

  const toggleAccountInfo = () => {
    setShowAccountInfo(!showAccountInfo);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await user?.update({
        firstName: firstName,
        lastName: lastName,
      });
      setMessage("تم تحديث المعلومات بنجاح");
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("حدث خطأ أثناء تحديث المعلومات");
    } finally {
      setSaving(false);
    }
  };

  // دالة لتنسيق التاريخ
  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return "تاريخ غير معروف";
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "تاريخ غير معروف";
      }
      return date.toLocaleDateString('ar-EG', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "تاريخ غير معروف";
    }
  };

  // دالة للحصول على تاريخ إنشاء البريد الإلكتروني
  const getEmailCreationDate = (emailAddr: unknown) => {
    // بعض إصدارات Clerk تستخدم أسماء حقول مختلفة. نستخدم "Record<string, unknown>" للوصول الآمن بدون استخدام any.
    const asRecord = emailAddr as unknown as Record<string, unknown>;
    if (typeof asRecord['createdAt'] === 'string') {
      return asRecord['createdAt'] as string;
    }
    if (typeof asRecord['created_at'] === 'string') {
      return asRecord['created_at'] as string;
    }
    if (typeof asRecord['creationDate'] === 'string') {
      return asRecord['creationDate'] as string;
    }
    // إذا لم يتم العثور على تاريخ، إرجاع undefined
    return undefined;
  }; 

  // دالة مساعدة لتحويل أي خطأ إلى رسالة نصية (بدون استخدام any)
  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    const maybe = err as { message?: unknown };
    if (typeof maybe?.message === 'string') return maybe.message;
    try {
      return String(err);
    } catch {
      return 'Unknown error';
    }
  };

  if (!isLoaded) return null;

  if (!isSignedIn || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg">
              <i className="fas fa-user text-white text-4xl"></i>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">يجب تسجيل الدخول</h2>
          <p className="text-gray-600 dark:text-gray-300">لتتمكن من عرض الملف الشخصي</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-0"></div>
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-200 dark:bg-blue-900 opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-indigo-200 dark:bg-indigo-900 opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-200 dark:bg-purple-900 opacity-10 blur-3xl animate-pulse"></div>
      <div className="relative z-10 w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            <h1 className="text-3xl font-bold relative z-10">الملف الشخصي</h1>
            <p className="text-blue-100 mt-1 relative z-10">إدارة معلوماتك الشخصية</p>
          </div>

          <div className="p-8">
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-600 opacity-30 blur-lg animate-pulse"></div>
                <div className="relative">
                  <div className="w-40 h-40 rounded-full overflow-hidden shadow-xl border-4 border-white dark:border-gray-800 relative z-10">
                    <Image
                      src={previewUrl ?? "/images/default-avatar.png"}
                      alt="avatar"
                      width={160}
                      height={160}
                      className={`w-full h-full object-cover profile-avatar ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} transition-all duration-700`}
                    />
                  </div>

                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm z-20">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="mt-2 text-blue-600 dark:text-blue-400 font-medium">جاري التحميل...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {editMode ? (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الأول</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-center font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40"
                          placeholder="الاسم الأول"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم العائلة</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-center font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40"
                          placeholder="اسم العائلة"
                        />
                      </div>
                    </div>
                  ) : (
                    `${firstName} ${lastName}`
                  )}
                </h2>
                
                {/* عرض جميع عناوين البريد الإلكتروني */}
                <div className="mt-3">
                  {user.emailAddresses && user.emailAddresses.length > 0 ? (
                    <div className="space-y-2 max-w-md mx-auto">
                      {user.emailAddresses.map((emailAddr) => (
                        <div 
                          key={emailAddr.id} 
                          className={`flex items-center justify-center p-2 rounded-lg ${
                            emailAddr.id === user.primaryEmailAddressId 
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                              : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
                          }`}>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              emailAddr.id === user.primaryEmailAddressId 
                                ? 'bg-green-500' 
                                : emailAddr.verification?.status === 'verified' 
                                  ? 'bg-blue-500' 
                                  : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-gray-600 dark:text-gray-300 text-sm">
                              {emailAddr.emailAddress}
                              {emailAddr.id === user.primaryEmailAddressId && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  أساسي
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">لا يوجد بريد إلكتروني</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {/* زر عرض معلومات الحساب */}
              <button
                onClick={toggleAccountInfo}
                className={`flex items-center gap-2 font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-500 transform ${
                  showAccountInfo 
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white' 
                    : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white'
                } hover:-translate-y-1 hover:shadow-xl active:translate-y-0 relative overflow-hidden group`}>
                <i className={`fas ${showAccountInfo ? 'fa-eye-slash' : 'fa-eye'} transition-transform duration-300 group-hover:scale-110`}></i>
                {showAccountInfo ? "إخفاء معلومات الحساب" : "عرض معلومات الحساب"}
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              </button>

              {/* زر التعديل مع تأثير حركي */}
              <button
                onClick={toggleEditMode}
                className={`flex items-center gap-2 font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-500 transform ${
                  editMode 
                    ? 'bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white'
                } hover:-translate-y-1 hover:shadow-xl active:translate-y-0 relative overflow-hidden group`}>
                <i className={`fas ${editMode ? 'fa-times-circle' : 'fa-cog'} transition-transform duration-300 group-hover:rotate-90`}></i>
                {editMode ? "إلغاء التعديل" : "الإعدادات"}
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              </button>
            </div>

            {/* أزرار الحفظ والإلغاء مع تأثيرات حركية */}
            <div className={`flex flex-wrap justify-center gap-4 mb-8 transition-all duration-500 ease-in-out ${
              showEditButtons 
                ? 'opacity-100 max-h-20 translate-y-0' 
                : 'opacity-0 max-h-0 translate-y-4 overflow-hidden'
            }`}>
              {/* زر حفظ التغييرات */}
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save transition-transform duration-300 group-hover:scale-110"></i>
                    حفظ التغييرات
                  </>
                )}
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              </button>

              {/* زر إلغاء التعديل */}
              <button
                onClick={toggleEditMode}
                className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0 relative overflow-hidden group">
                <i className="fas fa-times transition-transform duration-300 group-hover:rotate-90"></i>
                إلغاء التعديل
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              </button>
            </div>

            {/* قسم معلومات الحساب مع تأثير حركي */}
            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
              showAccountInfo ? 'max-h-[1000px] opacity-100 mb-8' : 'max-h-0 opacity-0'
            }`}>
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-6 border border-cyan-100 dark:border-gray-700 shadow-lg transform transition-transform duration-500 hover:scale-[1.01]">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 pb-2 border-b border-cyan-200 dark:border-gray-700 flex items-center">
                  <i className="fas fa-user-circle text-cyan-600 dark:text-cyan-400 ml-2"></i>
                  معلومات الحساب
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-user text-blue-600 dark:text-blue-400"></i>
                      </div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الأول</label>
                    </div>
                    <div className="text-gray-900 dark:text-white font-medium text-lg">{firstName}</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-id-card text-indigo-600 dark:text-indigo-400"></i>
                      </div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">اسم العائلة</label>
                    </div>
                    <div className="text-gray-900 dark:text-white font-medium text-lg">{lastName}</div>
                  </div>
                  
                  {/* عرض جميع الإيميلات */}
                  <div className="md:col-span-2 bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-envelope text-green-600 dark:text-green-400"></i>
                      </div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">عناوين البريد الإلكتروني</label>
                    </div>
                    <div className="space-y-3">
                      {user.emailAddresses && user.emailAddresses.length > 0 ? (
                        user.emailAddresses.map((emailAddr) => (
                          <div 
                            key={emailAddr.id} 
                            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                              emailAddr.id === user.primaryEmailAddressId 
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 shadow-sm' 
                                : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${
                                emailAddr.id === user.primaryEmailAddressId 
                                  ? 'bg-green-500' 
                                  : emailAddr.verification?.status === 'verified' 
                                    ? 'bg-blue-500' 
                                    : 'bg-yellow-500'
                              }`}></div>
                              <div>
                                <div className="font-medium text-gray-800 dark:text-white">
                                  {emailAddr.emailAddress}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {emailAddr.id === user.primaryEmailAddressId ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                      <i className="fas fa-check-circle mr-1"></i> الإيميل الأساسي
                                    </span>
                                  ) : emailAddr.verification?.status === 'verified' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                      <i className="fas fa-link mr-1"></i> مرتبط
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                      <i className="fas fa-clock mr-1"></i> في انتظار التحقق
                                    </span>
                                  )}
                                  <span className="mx-2">•</span>
                                  <span>أضيف في {formatDate(getEmailCreationDate(emailAddr))}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                          لا توجد عناوين بريد إلكتروني مضافة
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* قسم تعديل المعلومات مع تأثير حركي مشابه لقسم معلومات الحساب */}
            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
              editMode ? 'max-h-[500px] opacity-100 mb-8' : 'max-h-0 opacity-0'
            }`}>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-6 border border-purple-100 dark:border-gray-700 shadow-lg transform transition-transform duration-500 hover:scale-[1.01]">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 pb-2 border-b border-purple-200 dark:border-gray-700 flex items-center">
                  <i className="fas fa-edit text-purple-600 dark:text-purple-400 ml-2"></i>
                  تعديل المعلومات الشخصية
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-user text-blue-600 dark:text-blue-400"></i>
                      </div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الأول</label>
                    </div>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-4 py-2 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="الاسم الأول"
                    />
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-id-card text-indigo-600 dark:text-indigo-400"></i>
                      </div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">اسم العائلة</label>
                    </div>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-4 py-2 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="اسم العائلة"
                    />
                  </div>
                </div>
              </div>
            </div>

            {editMode && (
              <div id="avatar-edit-section" className="overflow-hidden transition-all duration-500" style={{ maxHeight: editSectionOpen ? '1200px' : '0', opacity: editSectionOpen ? '1' : '0' }}>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="bg-blue-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-blue-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">تحديث الصورة الشخصية</h3>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <label className="flex-1 cursor-pointer">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onFileInputChange}
                        />
                        <div className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-700 border-2 border-dashed border-blue-300 dark:border-blue-500 rounded-xl p-6 text-center hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors duration-300">
                          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <i className="fas fa-upload text-blue-600 dark:text-blue-400"></i>
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-200">رفع صورة</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">من جهازك</span>
                        </div>
                      </label>

                      <div className="flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <span>أو</span>
                      </div>

                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`flex-1 flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-700 border-2 rounded-xl p-6 text-center transition-all duration-300 ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-gray-600 shadow-lg' : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}>
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <i className="fas fa-cloud-upload-alt text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-200">سحب وإفلات</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">صورة هنا</span>
                      </div>
                    </div>

                    {message && (
                      <div className={`mt-6 p-4 rounded-xl text-center font-medium transition-all duration-500 ${
                        message.includes('خطأ') || message.includes('Error') 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' 
                          : message.includes('نجاح') || message.includes('تم')
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      } animate-fadeIn`}> 
                        {message}
                      </div>
                    )}

                    <div className="mt-8">
                      <h4 className="font-semibold mb-3">إدارة عناوين البريد الإلكتروني</h4>
                      <ChangeEmailPanel />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-3 px-6 rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg active:translate-y-0 border border-gray-200 dark:border-gray-700">
            <i className="fas fa-arrow-left"></i>
            العودة
          </Link>
          <Link href="/favorites" className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0">
            <i className="fas fa-star"></i>
            المفضلات
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
