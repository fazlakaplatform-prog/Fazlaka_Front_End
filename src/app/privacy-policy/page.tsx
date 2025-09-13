import { JSX } from 'react';

async function getPrivacyPolicy() {
  try {
    // استخدم الصيغة الصحيحة للـ API: privacy-policies (جمع)
    const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/privacy-policies`, {
      headers: {
        Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch privacy policy: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Privacy Policy Response:', data);
    
    // تحقق من هيكل البيانات
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      // إذا كانت البيانات مصفوفة، خذ أول عنصر
      return data.data[0].content;
    } else {
      console.error('Unexpected data structure for privacy policy:', data);
      return "سياسة الخصوصية غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقًا.";
    }
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    return "حدث خطأ أثناء تحميل سياسة الخصوصية. يرجى المحاولة مرة أخرى لاحقًا.";
  }
}

// تعريف الواجهات للبيانات
interface ContentChild {
  text: string;
  bold?: boolean;
  children?: ContentChild[]; // إضافة خاصية children للعناصر الفرعية
}

interface ContentBlock {
  type: string;
  level?: number;
  children?: ContentChild[];
}

// دالة بسيطة لعرض محتوى Strapi
function renderContent(content: string | ContentBlock[]) {
  // إذا كان المحتوى سلسلة نصية بسيطة
  if (typeof content === 'string') {
    return <p className="mb-4 leading-relaxed">{content}</p>;
  }
  
  // إذا كان المحتوى مصفوفة من الكتل
  if (Array.isArray(content)) {
    return content.map((block, index) => {
      switch (block.type) {
        case 'paragraph':
          return (
            <p key={index} className="mb-4 leading-relaxed">
              {block.children?.map((child: ContentChild, childIndex: number) => (
                <span key={childIndex} className={child.bold ? 'font-bold' : ''}>
                  {child.text}
                </span>
              ))}
            </p>
          );
        case 'heading':
          const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
          const headingClass = `mb-4 mt-6 font-bold ${
            block.level === 1 ? 'text-2xl' : 
            block.level === 2 ? 'text-xl' : 
            'text-lg'
          }`;
          
          return (
            <HeadingTag key={index} className={headingClass}>
              {block.children?.map((child: ContentChild, childIndex: number) => (
                <span key={childIndex}>{child.text}</span>
              ))}
            </HeadingTag>
          );
        case 'list':
          return (
            <ul key={index} className="list-disc pr-6 mb-4">
              {block.children?.map((item: ContentChild, itemIndex: number) => (
                <li key={itemIndex} className="mb-2">
                  {item.children?.map((child: ContentChild, childIndex: number) => (
                    <span key={childIndex}>{child.text}</span>
                  ))}
                </li>
              ))}
            </ul>
          );
        default:
          return null;
      }
    });
  }
  
  // إذا لم يكن أي من الأنواع المعروفة
  return <p>لا يمكن عرض هذا المحتوى.</p>;
}

export default async function PrivacyPolicyPage() {
  const content = await getPrivacyPolicy();
  return (
    <div dir="rtl" className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">سياسة الخصوصية</h1>
      <div className="prose prose-lg max-w-none">
        {renderContent(content)}
      </div>
    </div>
  );
}