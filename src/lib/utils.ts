export function buildMediaUrl(path?: string) {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  
  // الحصول على base URL من متغيرات البيئة
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 
                 process.env.NEXT_PUBLIC_API_URL || 
                 "";
  
  // إذا كان الرابط يبدأ بـ /uploads/ (صيغة Strapi الشائعة)
  if (path.startsWith("/uploads/")) {
    return `${baseUrl}${path}`;
  }
  
  // إذا كان الرابط لا يبدأ بـ /
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  
  // إزالة // مكررة
  const cleanUrl = `${baseUrl}${path}`.replace(/([^:]\/)\/+/g, "$1");
  
  return cleanUrl;
}

export function normalizeForSearch(s?: string) {
  if (!s) return "";
  try {
    return s
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  } catch {
    return s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  }
}