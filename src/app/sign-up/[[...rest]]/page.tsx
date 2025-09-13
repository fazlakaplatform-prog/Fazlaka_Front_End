"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          appearance={{
            elements: {
              footer: "hidden", // حذف الفوتر بالكامل
            },
          }}
        />

        {/* لينك للرجوع لتسجيل الدخول */}
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            عندك حساب بالفعل؟{" "}
          </span>
          <Link
            href="/sign-in"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            سجل دخول
          </Link>
        </div>
      </div>
    </div>
  );
}
