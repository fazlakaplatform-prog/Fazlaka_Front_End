import { ClerkProvider } from "@clerk/nextjs";
import { arSA } from "@clerk/localizations";   // العربية (السعودية) الجاهزة
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata = {
  title: "فذلكه",
  description: "موقع فذلكه",
  icons: {
    icon: '/logo.ico',        // أو '/favicon.ico' إذا سميت الملف هكذا
    shortcut: '/logo.ico',    // اختصار (favicon قديم)
    apple: '/logo.ico'        // لأجهزة Apple (يمكن استبداله بصيغة PNG مناسبة)
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="ar" 
      dir="rtl" 
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <body className="bg-white dark:bg-gray-800 text-black dark:text-white min-h-screen flex flex-col">
        <ClerkProvider localization={arSA}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}