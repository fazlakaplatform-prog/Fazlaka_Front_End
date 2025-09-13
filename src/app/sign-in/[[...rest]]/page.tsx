"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              footer: "hidden", // حذف الفوتر بالكامل
            },
          }}
        />

        {/* لينك لتسجيل حساب جديد */}
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            لسه ماعندكش حساب؟{" "}
          </span>
          <Link
            href="/sign-up"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            اعمل حساب جديد
          </Link>
        </div>
      </div>
    </div>
  );
}
