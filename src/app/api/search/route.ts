import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

// تعريف الأنواع (Interfaces) لاستبدال any
interface BaseData {
  id: number;
  attributes?: {
    [key: string]: unknown;
  };
}

// تعريف نوع الصورة بدعم لكلا الهيكلين (القديم والجديد)
type MediaObject = 
  | { url?: string } 
  | { data?: { attributes?: { url?: string } } }
  | null
  | undefined;

// دالة مساعدة لاستخراج رابط الصورة
function getMediaUrl(media: MediaObject): string | undefined {
  if (!media) return undefined;
  
  // الهيكل القديم (Strapi v3)
  if ('url' in media && media.url) {
    return media.url;
  }
  
  // الهيكل الجديد (Strapi v4)
  if ('data' in media && media.data?.attributes?.url) {
    return media.data.attributes.url;
  }
  
  return undefined;
}

interface EpisodeData extends BaseData {
  title?: string;
  slug?: string;
  thumbnail?: MediaObject;
  description?: string;
  publishedAt?: string;
}

interface SeasonData extends BaseData {
  title?: string;
  name?: string;
  slug?: string;
  thumbnail?: MediaObject;
  description?: string;
  publishedAt?: string;
}

interface PlaylistData extends BaseData {
  title?: string;
  name?: string;
  slug?: string;
  thumbnail?: MediaObject;
  description?: string;
  publishedAt?: string;
}

interface FaqData extends BaseData {
  question?: string;
  answer?: string;
  publishedAt?: string;
}

interface TeamMemberData extends BaseData {
  name?: string;
  photo?: MediaObject;
  position?: string;
  bio?: string;
  publishedAt?: string;
}

interface ContentBlock {
  type: string;
  children?: Array<{
    text: string;
  }>;
}

interface TermsData extends BaseData {
  content?: string | ContentBlock[];
  publishedAt?: string;
}

interface PrivacyData extends BaseData {
  content?: string | ContentBlock[];
  publishedAt?: string;
}

// تعريف نوع النتائج النهائية
interface SearchResult {
  id: number;
  title: string;
  type: "episode" | "season" | "playlist" | "faq" | "teamMember" | "terms" | "privacy";
  slug?: string;
  thumbnail?: string;
  description?: string;
  content?: string;
  publishedAt?: string;
}

function normalizeForSearch(s?: string) {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  
  if (!query.trim()) {
    return NextResponse.json([]);
  }
  
  const normalizedQuery = normalizeForSearch(query);
  
  try {
    // البحث في الحلقات
    const episodesRes = await fetch(
      `${STRAPI_URL}/api/episodes?populate=thumbnail&sort=publishedAt:desc`
    );
    const episodesData = await episodesRes.json();
    const episodes: SearchResult[] = episodesData.data.map((episode: EpisodeData) => ({
      id: episode.id,
      title: episode.title || (episode.attributes?.title as string) || "",
      slug: episode.slug || (episode.attributes?.slug as string),
      type: "episode" as const,
      thumbnail: getMediaUrl(episode.thumbnail) || getMediaUrl(episode.attributes?.thumbnail as MediaObject),
      description: episode.description || (episode.attributes?.description as string),
      publishedAt: episode.publishedAt || (episode.attributes?.publishedAt as string),
    }));
    
    // البحث في المواسم
    const seasonsRes = await fetch(
      `${STRAPI_URL}/api/seasons?populate=thumbnail&sort=publishedAt:desc`
    );
    const seasonsData = await seasonsRes.json();
    const seasons: SearchResult[] = seasonsData.data.map((season: SeasonData) => ({
      id: season.id,
      title: season.title || (season.attributes?.title as string) || season.name || (season.attributes?.name as string),
      slug: season.slug || (season.attributes?.slug as string),
      type: "season" as const,
      thumbnail: getMediaUrl(season.thumbnail) || getMediaUrl(season.attributes?.thumbnail as MediaObject),
      description: season.description || (season.attributes?.description as string),
      publishedAt: season.publishedAt || (season.attributes?.publishedAt as string),
    }));
    
    // البحث في قوائم التشغيل
    const playlistsRes = await fetch(
      `${STRAPI_URL}/api/playlists?populate=thumbnail&sort=publishedAt:desc`
    );
    const playlistsData = await playlistsRes.json();
    const playlists: SearchResult[] = playlistsData.data.map((playlist: PlaylistData) => ({
      id: playlist.id,
      title: playlist.title || (playlist.attributes?.title as string) || playlist.name || (playlist.attributes?.name as string),
      slug: playlist.slug || (playlist.attributes?.slug as string),
      type: "playlist" as const,
      thumbnail: getMediaUrl(playlist.thumbnail) || getMediaUrl(playlist.attributes?.thumbnail as MediaObject),
      description: playlist.description || (playlist.attributes?.description as string),
      publishedAt: playlist.publishedAt || (playlist.attributes?.publishedAt as string),
    }));
    
    // البحث في الأسئلة الشائعة
    const faqsRes = await fetch(
      `${STRAPI_URL}/api/faqs?sort=publishedAt:desc`
    );
    const faqsData = await faqsRes.json();
    const faqs: SearchResult[] = faqsData.data.map((faq: FaqData) => ({
      id: faq.id,
      title: faq.question || (faq.attributes?.question as string),
      type: "faq" as const,
      content: faq.answer || (faq.attributes?.answer as string),
      publishedAt: faq.publishedAt || (faq.attributes?.publishedAt as string),
    }));
    
    // البحث في أعضاء الفريق
    const teamMembersRes = await fetch(
      `${STRAPI_URL}/api/team-members?populate=photo&sort=publishedAt:desc`
    );
    const teamMembersData = await teamMembersRes.json();
    const teamMembers: SearchResult[] = teamMembersData.data.map((member: TeamMemberData) => ({
      id: member.id,
      title: member.name || (member.attributes?.name as string),
      type: "teamMember" as const,
      thumbnail: getMediaUrl(member.photo) || getMediaUrl(member.attributes?.photo as MediaObject),
      description: member.position || (member.attributes?.position as string),
      content: member.bio || (member.attributes?.bio as string),
      publishedAt: member.publishedAt || (member.attributes?.publishedAt as string),
    }));
    
    // البحث في الشروط والأحكام
    const termsRes = await fetch(
      `${STRAPI_URL}/api/terms-conditions`
    );
    const termsData = await termsRes.json();
    let terms: SearchResult[] = [];
    
    if (termsData.data) {
      // Handle array response
      const termsArray = Array.isArray(termsData.data) ? termsData.data : [termsData.data];
      terms = termsArray.map((term: TermsData) => {
        const content = term.content || (term.attributes?.content as string) || "";
        // Extract text from structured content if needed
        let textContent = "";
        if (typeof content === 'string') {
          textContent = content;
        } else if (Array.isArray(content)) {
          textContent = content.map((block: ContentBlock) => {
            if (block.type === 'paragraph' || block.type === 'heading') {
              return block.children?.map((child) => child.text).join(' ') || '';
            }
            return '';
          }).join(' ');
        }
        
        return {
          id: term.id,
          title: "الشروط والأحكام",
          type: "terms" as const,
          content: textContent,
          publishedAt: term.publishedAt || (term.attributes?.publishedAt as string) || new Date().toISOString(),
        };
      });
    }
    
    // البحث في سياسة الخصوصية
    const privacyRes = await fetch(
      `${STRAPI_URL}/api/privacy-policies`
    );
    const privacyData = await privacyRes.json();
    let privacyPolicies: SearchResult[] = [];
    
    if (privacyData.data) {
      // Handle array response
      const privacyArray = Array.isArray(privacyData.data) ? privacyData.data : [privacyData.data];
      privacyPolicies = privacyArray.map((policy: PrivacyData) => {
        const content = policy.content || (policy.attributes?.content as string) || "";
        // Extract text from structured content if needed
        let textContent = "";
        if (typeof content === 'string') {
          textContent = content;
        } else if (Array.isArray(content)) {
          textContent = content.map((block: ContentBlock) => {
            if (block.type === 'paragraph' || block.type === 'heading') {
              return block.children?.map((child) => child.text).join(' ') || '';
            }
            return '';
          }).join(' ');
        }
        
        return {
          id: policy.id,
          title: "سياسة الخصوصية",
          type: "privacy" as const,
          content: textContent,
          publishedAt: policy.publishedAt || (policy.attributes?.publishedAt as string) || new Date().toISOString(),
        };
      });
    }
    
    // دمج جميع النتائج
    const allResults = [...episodes, ...seasons, ...playlists, ...faqs, ...teamMembers, ...terms, ...privacyPolicies];
    
    // تصفية النتائج حسب الاستعلام
    const filteredResults = allResults.filter((item) => {
      const title = normalizeForSearch(item.title);
      const description = normalizeForSearch(item.description || item.content || "");
      
      return title.includes(normalizedQuery) || description.includes(normalizedQuery);
    });
    
    // ترتيب النتائج حسب الصلة
    const sortedResults = filteredResults.sort((a, b) => {
      const aTitle = normalizeForSearch(a.title);
      const bTitle = normalizeForSearch(b.title);
      
      // النتائج التي تبدأ بالاستعلام تأتي أولاً
      const aStartsWithQuery = aTitle.startsWith(normalizedQuery);
      const bStartsWithQuery = bTitle.startsWith(normalizedQuery);
      
      if (aStartsWithQuery && !bStartsWithQuery) return -1;
      if (!aStartsWithQuery && bStartsWithQuery) return 1;
      
      // ثم النتائج التي تحتوي على الاستعلام في العنوان
      const aContainsInTitle = aTitle.includes(normalizedQuery);
      const bContainsInTitle = bTitle.includes(normalizedQuery);
      
      if (aContainsInTitle && !bContainsInTitle) return -1;
      if (!aContainsInTitle && bContainsInTitle) return 1;
      
      // أخيرًا، الترتيب حسب تاريخ النشر (الأحدث أولاً)
      const aDate = new Date(a.publishedAt || 0);
      const bDate = new Date(b.publishedAt || 0);
      
      return bDate.getTime() - aDate.getTime();
    });
    
    return NextResponse.json(sortedResults);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 });
  }
}