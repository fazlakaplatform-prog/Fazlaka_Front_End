"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function ContactPage() {  // إزالة نوع الإرجاع JSX.Element
  const { user } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const reduceMotion = useReducedMotion();
  
  useEffect(() => {
    if (user) {
      setEmail(user.emailAddresses?.[0]?.emailAddress || "");
      setName(user.firstName || "");
    }
  }, [user]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      fd.set("name", name);
      fd.set("email", email);
      fd.set("message", message);
      const res = await fetch("/api/contact", { method: "POST", body: fd });
      if (res.ok) {
        setStatus("success");
        setShowToast(true);
        form.reset();
        setMessage("");
        setTimeout(() => setShowToast(false), 3500);
      } else {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.message || "تعذر الإرسال.");
        setStatus("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4500);
      }
    } catch (err: unknown) {
      console.error("Error submitting form:", err);
      const errorMessage = err instanceof Error ? err.message : "تعذر الإرسال.";
      setErrorMsg(errorMessage);
      setStatus("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4500);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2 text-center text-gray-900 dark:text-gray-100">تواصل معنا</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          لأي استفسار أو ملاحظة، ارسل لنا رسالة أو اطلع على الأسئلة الشائعة — اختر ما يناسبك.
        </p>
      </header>
      
      <div className="flex justify-center mb-8">
        <Link href="/faq" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          عرض الأسئلة الشائعة
        </Link>
      </div>
      
      <main className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-sm p-4 sm:p-6 overflow-visible">
        <h2 id="contact-heading" className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">أرسل رسالة</h2>
        
        <SignedOut>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-center text-yellow-700 dark:text-yellow-300">
              يجب تسجيل الدخول لإرسال رسالة. {" "}
              <Link href="/sign-in" className="font-medium underline">تسجيل الدخول</Link>
            </p>
          </div>
        </SignedOut>
        
        <SignedIn>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" encType="multipart/form-data">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">الاسم</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="الاسم"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border p-3 h-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">الإيميل</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="الإيميل"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border p-3 h-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                  disabled={!!user}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">رسالتك</label>
              <textarea
                id="message"
                name="message"
                placeholder="اكتب رسالتك هنا..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border p-3 rounded-lg h-40 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">مرفقات (اختياري)</label>
              <div className="flex items-center gap-3 w-full p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <input type="file" name="attachment" multiple accept="image/*,.pdf,.doc,.docx,.zip" className="text-sm" />
                <span className="text-gray-500 dark:text-gray-400 text-sm">أضف صورة أو مستند</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">الصيغ المسموحة: jpg, png, pdf, doc, docx, zip</p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
              <button 
                type="submit" 
                className="flex-1 bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors font-medium"
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الإرسال...
                  </span>
                ) : "إرسال الرسالة"}
              </button>
              
              <div className="min-w-[140px] text-center">
                {status === "success" && <p className="text-green-600 font-medium">تم الإرسال بنجاح!</p>}
                {status === "error" && <p className="text-red-600 font-medium">{errorMsg || "حدث خطأ، حاول مرة أخرى."}</p>}
              </div>
            </div>
          </form>
        </SignedIn>
      </main>
      
      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 8 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            exit={reduceMotion ? {} : { opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div className="bg-white dark:bg-gray-800 border shadow-md rounded-xl px-4 py-3 flex items-center gap-3 pointer-events-auto">
              <div>
                {status === "success" ? (
                  <span className="text-green-600 font-medium">تم إرسال الرسالة بنجاح</span>
                ) : (
                  <span className="text-red-600 font-medium">{errorMsg || "فشل الإرسال"}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}