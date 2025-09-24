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
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // حالات الأقسام القابلة للطي
  const [openSections, setOpenSections] = useState({
    personalInfo: false,
    avatarUpdate: false,
    emailManagement: false
  });
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

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
      console.log("Trying to upload with Clerk SDK...");
      if (user) {
        await user.setProfileImage({ file });
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setToastMessage("تم تحديث الصورة بنجاح");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
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
        console.log("Trying to upload with Data URL...");
        const dataUrl = await readAsDataUrl(file);
        if (user) {
          await user.setProfileImage({ file: dataUrl });
          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl(objectUrl);
          setToastMessage("تم تحديث الصورة (بنسق بديل)");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
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
          console.log("Trying server fallback...");
          const serverOk = await uploadToServerFallback(file);
          if (serverOk) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            setToastMessage("تم تحديث الصورة عبر السيرفر");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
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
          
          let errorMessage = "حصل خطأ أثناء رفع الصورة";
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
    setShowEditModal(!showEditModal);
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
      setToastMessage("تم تحديث المعلومات بنجاح");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("حدث خطأ أثناء تحديث المعلومات");
    } finally {
      setSaving(false);
    }
  };

  // دالة لتبديل حالة الأقسام
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const getEmailCreationDate = (emailAddr: unknown) => {
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
    return undefined;
  }; 

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
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg">
              <i className="fas fa-user text-white text-3xl sm:text-4xl"></i>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">يجب تسجيل الدخول</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">لتتمكن من عرض الملف الشخصي</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center p-4 sm:p-6 overflow-hidden">
      {/* مساحة فارغة في الأعلى للناف بار - تم زيادة الارتفاع للموبايل */}
      <div className="w-full h-20 sm:h-16 md:h-16 lg:h-16"></div>
      
      {/* خلفيات متحركة */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-0"></div>
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-200 dark:bg-blue-900 opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-indigo-200 dark:bg-indigo-900 opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-200 dark:bg-purple-900 opacity-10 blur-3xl animate-pulse"></div>
      
      <div className="relative z-10 w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* الهيدر المحسن */}
          <div className="relative overflow-hidden">
            {/* خلفية متدرجة مع أشكال زخرفية */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white opacity-5 rounded-full"></div>
            
            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="text-center sm:text-right mb-6 sm:mb-0">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">الملف الشخصي</h1>
                  <p className="text-blue-100 text-lg">إدارة معلوماتك الشخصية</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  <Link href="/" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-5 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 transform hover:scale-105 border border-white/30">
                    <i className="fas fa-arrow-left"></i>
                    <span className="hidden sm:inline">العودة</span>
                  </Link>
                  <Link href="/favorites" className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-medium py-3 px-5 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                    <i className="fas fa-star"></i>
                    <span className="hidden sm:inline">المفضلات</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* هيرو سيكشن المحسن */}
            <div className="relative mb-10">
              {/* خلفية زخرفية */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl -z-10"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-900/30 rounded-full -mr-16 -mt-16 opacity-30 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-200 dark:bg-indigo-900/30 rounded-full -ml-20 -mb-20 opacity-30 blur-xl"></div>
              
              <div className="flex flex-col items-center p-6 sm:p-8">
                <div className="relative mb-8">
                  {/* خلفية متوهجة للصورة */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-40 blur-xl animate-pulse"></div>
                  <div className="relative">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 relative z-10">
                      <Image
                        src={previewUrl ?? "/images/default-avatar.png"}
                        alt="avatar"
                        width={176}
                        height={176}
                        className={`w-full h-full object-cover profile-avatar ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} transition-all duration-700`}
                      />
                    </div>

                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm z-20">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="mt-3 text-blue-600 dark:text-blue-400 font-medium">جاري التحميل...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-3">
                    {`${firstName} ${lastName}`}
                  </h2>
                  
                  <div className="mb-6">
                    {user.emailAddresses && user.emailAddresses.length > 0 ? (
                      <div className="space-y-3 max-w-md mx-auto">
                        {user.emailAddresses.map((emailAddr) => (
                          <div 
                            key={emailAddr.id} 
                            className={`flex items-center justify-center p-3 rounded-xl ${
                              emailAddr.id === user.primaryEmailAddressId 
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 shadow-sm' 
                                : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
                            }`}>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${
                                emailAddr.id === user.primaryEmailAddressId 
                                  ? 'bg-green-500' 
                                  : emailAddr.verification?.status === 'verified' 
                                    ? 'bg-blue-500' 
                                    : 'bg-yellow-500'
                              }`}></div>
                              <span className="text-gray-700 dark:text-gray-300">
                                {emailAddr.emailAddress}
                                {emailAddr.id === user.primaryEmailAddressId && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    أساسي
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-xl py-3 px-4">لا يوجد بريد إلكتروني</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <button
                onClick={toggleAccountInfo}
                className={`flex items-center gap-3 font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-500 transform ${
                  showAccountInfo 
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
                } hover:scale-105 hover:shadow-xl active:scale-95 relative overflow-hidden group text-base`}>
                <i className={`fas ${showAccountInfo ? 'fa-eye-slash' : 'fa-eye'} transition-transform duration-300 group-hover:scale-110`}></i>
                {showAccountInfo ? "إخفاء معلومات الحساب" : "عرض معلومات الحساب"}
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              </button>

              <button
                onClick={toggleEditMode}
                className={`flex items-center gap-3 font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-500 transform ${
                  showEditModal 
                    ? 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                } hover:scale-105 hover:shadow-xl active:scale-95 relative overflow-hidden group text-base`}>
                <i className={`fas ${showEditModal ? 'fa-times-circle' : 'fa-cog'} transition-transform duration-300 group-hover:rotate-90`}></i>
                {showEditModal ? "إغلاق النافذة" : "الإعدادات"}
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              </button>
            </div>

            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
              showAccountInfo ? 'max-h-[1000px] opacity-100 mb-8' : 'max-h-0 opacity-0'
            }`}>
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-6 border border-cyan-100 dark:border-gray-700 shadow-lg transform transition-transform duration-500 hover:scale-[1.01]">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 pb-2 border-b border-cyan-200 dark:border-gray-700 flex items-center">
                  <i className="fas fa-user-circle text-cyan-600 dark:text-cyan-400 ml-3"></i>
                  معلومات الحساب
                </h3>

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-user text-blue-600 dark:text-blue-400"></i>
                      </div>
                      <label className="text-base font-medium text-gray-700 dark:text-gray-300">الاسم الأول</label>
                    </div>
                    <div className="text-gray-900 dark:text-white font-medium text-lg">{firstName}</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-id-card text-indigo-600 dark:text-indigo-400"></i>
                      </div>
                      <label className="text-base font-medium text-gray-700 dark:text-gray-300">اسم العائلة</label>
                    </div>
                    <div className="text-gray-900 dark:text-white font-medium text-lg">{lastName}</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-envelope text-green-600 dark:text-green-400"></i>
                      </div>
                      <label className="text-base font-medium text-gray-700 dark:text-gray-300">عناوين البريد الإلكتروني</label>
                    </div>
                    <div className="space-y-3">
                      {user.emailAddresses && user.emailAddresses.length > 0 ? (
                        user.emailAddresses.map((emailAddr) => (
                          <div 
                            key={emailAddr.id} 
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                              emailAddr.id === user.primaryEmailAddressId 
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 shadow-sm' 
                                : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}>
                            <div className="flex items-center mb-2 sm:mb-0">
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
          </div>
        </div>
      </div>

      {/* نافذة التعديل المنبثقة */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* خلفية شفافة مع تأثير ضبابي */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowEditModal(false)}
          ></div>
          
          {/* محتوى النافذة */}
          <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-95 animate-scaleIn border border-gray-200 dark:border-gray-700">
            {/* رأس النافذة */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">تعديل الملف الشخصي</h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            {/* محتوى النافذة */}
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
              <div className="space-y-5">
                {/* قسم تعديل المعلومات الشخصية */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                  <button
                    onClick={() => toggleSection('personalInfo')}
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-purple-100 dark:hover:from-gray-700/70 hover:to-pink-100 dark:hover:to-gray-700/70 transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-user-edit text-purple-600 dark:text-purple-400"></i>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">تعديل المعلومات الشخصية</h3>
                    </div>
                    <i className={`fas fa-chevron-down text-purple-600 dark:text-purple-400 transition-transform duration-300 ${openSections.personalInfo ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openSections.personalInfo ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="p-5">
                      <div className="grid grid-cols-1 gap-5">
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
                </div>

                {/* قسم تحديث الصورة الشخصية */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                  <button
                    onClick={() => toggleSection('avatarUpdate')}
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-blue-100 dark:hover:from-gray-700/70 hover:to-cyan-100 dark:hover:to-gray-700/70 transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-image text-blue-600 dark:text-blue-400"></i>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">تحديث الصورة الشخصية</h3>
                    </div>
                    <i className={`fas fa-chevron-down text-blue-600 dark:text-blue-400 transition-transform duration-300 ${openSections.avatarUpdate ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openSections.avatarUpdate ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="p-5">
                      <div className="flex flex-col gap-4 justify-center">
                        <label className="cursor-pointer">
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
                          className={`flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-700 border-2 rounded-xl p-6 text-center transition-all duration-300 ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-gray-600 shadow-lg' : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}>
                          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <i className="fas fa-cloud-upload-alt text-blue-600 dark:text-blue-400"></i>
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-200">سحب وإفلات</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">صورة هنا</span>
                        </div>
                      </div>

                      {message && (
                        <div className={`mt-4 p-4 rounded-xl text-center font-medium transition-all duration-500 ${
                          message.includes('خطأ') || message.includes('Error') 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' 
                            : message.includes('نجاح') || message.includes('تم')
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        } animate-fadeIn`}> 
                          {message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* قسم إدارة عناوين البريد الإلكتروني */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                  <button
                    onClick={() => toggleSection('emailManagement')}
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-green-100 dark:hover:from-gray-700/70 hover:to-emerald-100 dark:hover:to-gray-700/70 transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                        <i className="fas fa-envelope text-green-600 dark:text-green-400"></i>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">إدارة عناوين البريد الإلكتروني</h3>
                    </div>
                    <i className={`fas fa-chevron-down text-green-600 dark:text-green-400 transition-transform duration-300 ${openSections.emailManagement ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openSections.emailManagement ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="p-5">
                      <ChangeEmailPanel />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* أزرار الحفظ والإلغاء */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-5 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-medium py-3 px-6 rounded-xl shadow-lg disabled:opacity-70 disabled:cursor-not-allowed text-base transition-all duration-300 transform hover:scale-105"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      حفظ التغييرات
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white font-medium py-3 px-6 rounded-xl shadow-lg text-base transition-all duration-300 transform hover:scale-105"
                >
                  <i className="fas fa-times"></i>
                  إلغاء التعديل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* رسالة النجاح المنبثقة */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 transform transition-all duration-500 animate-slideIn">
          <div className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl backdrop-blur-sm border border-green-400/30">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <i className="fas fa-check text-white text-lg"></i>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">{toastMessage}</p>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="flex-shrink-0 ml-2 text-white/80 hover:text-white"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

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
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.4s ease-out forwards;
        }
        
        /* تخصيص شريط التمرير */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          transition: background 0.3s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        @media (max-width: 640px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .text-responsive {
            font-size: 0.875rem;
          }
          
          .p-responsive {
            padding: 0.75rem;
          }
          
          .gap-responsive {
            gap: 0.5rem;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
          .container {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }
        
        @media (min-width: 1025px) {
          .container {
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
          }
        }
        
        /* تحسينات لمنع قطع النص */
        .section-content {
          overflow: visible;
          word-wrap: break-word;
          hyphens: auto;
        }
        
        /* تحسينات للشاشات الصغيرة */
        @media (max-width: 640px) {
          .section-content {
            font-size: 0.9rem;
            line-height: 1.5;
          }
        }
      `}</style>
    </main>
  );
}