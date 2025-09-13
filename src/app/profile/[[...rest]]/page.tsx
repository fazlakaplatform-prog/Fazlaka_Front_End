"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // الأنيميشن الرئيسي عند تحميل الصفحة
  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);
  
  // الأنيميشن لفتح/إغلاق قسم التعديل
  useEffect(() => {
    if (editSectionOpen) {
      const timer = setTimeout(() => {
        const editSection = document.getElementById('avatar-edit-section');
        if (editSection) {
          editSection.style.maxHeight = '500px';
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
  
  // تحديث الصورة عند تحميل الصفحة
  useEffect(() => {
    if (!isLoaded) return;
    setPreviewUrl(user?.imageUrl ?? null);
  }, [isLoaded, user]);
  
  const validateFile = (file: File) => {
    if (!file.type.startsWith("image/")) return "الملف مش صورة";
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) return "حجم الصورة أكبر من 5 ميجا";
    return null;
  };
  
  // helper to read file as data URL (base64) - fallback for some SDKs/environments
  const readAsDataUrl = (f: File) =>
    new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = (e) => rej(e);
      fr.readAsDataURL(f);
    });
  
  // Optional: server-upload fallback. If your client-side SDK fails due to CORS or
  // custom fetch wrappers, you can POST the file to an API route on your Next.js server
  // and use the Clerk backend SDK there to update the user's image. Example endpoint
  // name: POST /api/profile/avatar (not implemented here). The client call is kept
  // as an optional commented helper.
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
      // Primary attempt: call Clerk client SDK with an object wrapper.
      // Many Clerk client versions expect { file } instead of the raw File.
      await user?.setProfileImage({ file });
      // show immediate preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setMessage("تم تحديث الصورة بنجاح");
      
      // أنيميشن بعد التحديث الناجح
      const imgElement = document.querySelector('.profile-avatar');
      if (imgElement) {
        imgElement.classList.add('animate-pulse', 'animate-spin-slow');
        setTimeout(() => {
          imgElement.classList.remove('animate-pulse', 'animate-spin-slow');
        }, 1500);
      }
      
      return;
    } catch (e1) {
      console.warn("setProfileImage({file}) failed:", e1);
      // Try data URL fallback
      try {
        const dataUrl = await readAsDataUrl(file); // "data:image/png;base64,...."
        await user?.setProfileImage({ file: dataUrl });
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setMessage("تم تحديث الصورة (بنسق بديل)");
        
        // أنيميشن للتحديث البديل
        const imgElement = document.querySelector('.profile-avatar');
        if (imgElement) {
          imgElement.classList.add('animate-pulse');
          setTimeout(() => {
            imgElement.classList.remove('animate-pulse');
          }, 1000);
        }
        
        return;
      } catch (e2) {
        console.warn("setProfileImage with dataURL failed:", e2);
        // As a last-resort fallback, try to POST to a server-side API route which
        // will use the Clerk backend/admin SDK. This avoids client-side fetch wrappers
        // interfering with multipart/form-data headers. The server route must be
        // implemented separately (e.g. pages/api/profile/avatar or app/api/profile/avatar/route.ts).
        const serverOk = await uploadToServerFallback(file);
        if (serverOk) {
          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl(objectUrl);
          setMessage("تم تحديث الصورة عبر السيرفر (fallback)");
          
          // أنيميشن للتحديث عبر السيرفر
          const imgElement = document.querySelector('.profile-avatar');
          if (imgElement) {
            imgElement.classList.add('animate-bounce');
            setTimeout(() => {
              imgElement.classList.remove('animate-bounce');
            }, 1000);
          }
          
          return;
        }
        // If all attempts fail, surface an error to the user and log details.
        console.error("All avatar upload attempts failed", { e1, e2 });
        setMessage("حصل خطأ أثناء رفع الصورة — حاول مرةً أخرى أو بلغ الإدارة");
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
    // Clear the input value synchronously to avoid React synthetic-event pooling
    // nullifying currentTarget after an `await`. This prevents the "Cannot set
    // properties of null (setting 'value')" runtime error.
    const input = e.target as HTMLInputElement;
    input.value = "";
    await handleFile(file);
  }, [handleFile]);
  
  const toggleEditSection = () => {
    setEditSectionOpen(!editSectionOpen);
  };
  
  if (!isLoaded) return null; // or a spinner
  
  if (!isSignedIn || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">يجب تسجيل الدخول لعرض الملف الشخصي</h2>
        </div>
      </main>
    );
  }
  
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 shadow-md rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-6">الملف الشخصي</h1>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 relative">
            <div className="relative">
              {/* صورة الملف الشخصي */}
              <div className="w-36 h-36 rounded-full overflow-hidden shadow-lg border-4 border-gray-200 dark:border-gray-700 transition-all duration-1000 ease-out transform hover:scale-110">
                <Image
                  src={previewUrl ?? "/images/default-avatar.png"} // صورة افتراضية
                  alt="avatar"
                  width={144}
                  height={144}
                  className={`w-full h-full object-cover profile-avatar ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                />
              </div>
              
              {/* مؤشر التحميل */}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 animate-pulse">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-spinner fa-spin text-blue-600"></i>
                    <span className="text-blue-600 font-medium">جاري التحميل...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 text-left">
            <p className="text-xl font-semibold mb-1">{user.fullName ?? user.username ?? "مستخدم"}</p>
            <p className="text-sm text-gray-500 mb-4">{user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? "لا يوجد بريد إلكتروني"}</p>
            
            <div className="mt-4">
              <div className="mb-4">
                <button
                  onClick={toggleEditSection}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:translate-y-0"
                >
                  <i className="fas fa-camera"></i>
                  تعديل الصورة الشخصية
                </button>
              </div>
              {/* قسم خيارات رفع الصورة */}
              <div id="avatar-edit-section" className="overflow-hidden transition-all duration-300" style={{ maxHeight: '0', opacity: '0' }}>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-3">اختر طريقة رفع الصورة:</p>
                  <div className="space-y-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onFileInputChange}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:translate-y-0"
                      >
                        <i className="fas fa-upload"></i>
                        رفع صورة
                      </button>
                    </label>
                    
                    <span className="mx-2 text-sm text-gray-400">أو</span>
                    
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`inline-block px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 ${dragActive ? 'bg-blue-100 border-2 border-dashed border-blue-500 transform scale-105' : 'bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:scale-105'}`}
                    >
                      <div className="flex items-center gap-2">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <span>سحب وإفلات صورة هنا</span>
                      </div>
                    </div>
                  </div>
                  
                  {message && (
                    <p className={`mt-3 p-3 rounded-lg transition-all duration-500 ${message.includes('خطأ') ? 'bg-red-100 text-red-800' : message.includes('نجاح') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} animate-bounce`} style={{animationIterationCount: 3}}>
                      {message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-left">
          <p className="text-sm text-gray-500 mb-4">معلومات إضافية</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">الاسم الأول</label>
              <input 
                defaultValue={user.firstName ?? ""} 
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">اسم العائلة</label>
              <input 
                defaultValue={user.lastName ?? ""} 
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex gap-3">
        <Link href="/" className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium px-5 py-2 rounded-lg transition-colors duration-200">
          <i className="fas fa-arrow-left"></i>
          العودة
        </Link>
        <Link href="/favorites" className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors duration-200">
          <i className="fas fa-star"></i>
          المفضلات
        </Link>
      </div>
    </main>
  );
}