import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LanguageProvider from "@/components/LanguageProvider";
import "./globals.css";

export const metadata = {
  title: "فذلكه",
  description: "موقع فذلكه",
  icons: {
    icon: '/logo.ico',
    shortcut: '/logo.ico',
    apple: '/logo.ico'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-800 text-black dark:text-white min-h-screen flex flex-col">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}