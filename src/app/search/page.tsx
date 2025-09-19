// app/search/page.tsx
import { Suspense } from 'react';
import SearchResults from '@/components/SearchResults';

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">جاري تحميل صفحة البحث...</p>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}