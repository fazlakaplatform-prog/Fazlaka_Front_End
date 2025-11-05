// lib/notifications.ts
import { client } from '@/lib/sanity';
import { getLocalizedText, urlFor } from '@/lib/sanity';

// تعريف واجهات (Interfaces) لتحديد أنواع البيانات بدلاً من any
interface BaseContent {
  _id: string;
  title?: string;
  titleEn?: string;
  slug?: { current?: string };
}

interface Episode extends BaseContent {
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
}

interface Article extends BaseContent {
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
}

interface Playlist extends BaseContent {
  imageUrl?: string;
  imageUrlEn?: string;
}

interface Season extends BaseContent {
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
}

interface TeamMember extends BaseContent {
  name?: string;
  nameEn?: string;
  role?: string;
  roleEn?: string;
  imageUrl?: string;
  imageUrlEn?: string;
}

interface FAQ {
  _id: string;
  question?: string;
  questionEn?: string;
  category?: string;
  categoryEn?: string;
}

interface HeroSlider {
  _id: string;
  title?: string;
  titleEn?: string;
  image?: string;
  imageEn?: string;
}

interface TermsContent {
  _id: string;
  title?: string;
  titleEn?: string;
}

interface PrivacyContent {
  _id: string;
  title?: string;
  titleEn?: string;
}

// واجهة جديدة لتحديد بنكل الروابط الاجتماعية
interface SocialLinkItem {
  _key?: string;
  platform?: string;
  url?: string;
  icon?: string;
}

interface SocialLinks {
  _id: string;
  links?: SocialLinkItem[]; // تم استخدام النوع الجديد هنا
}

interface NotificationData {
  userId: string;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedId?: string;
  relatedType?: 'episode' | 'article' | 'playlist' | 'season' | 'teamMember' | 'faq' | 'heroSlider' | 'favorite' | 'terms' | 'privacy' | 'socialLinks' | 'welcome' | 'login' | 'contentUpdate' | 'profile' | 'security' | 'comment' | 'mention' | 'achievement' | 'subscription' | 'payment' | 'contact' | 'system' | 'maintenance' | 'custom';
  imageUrl?: string;
  imageUrlEn?: string;
  actionUrl?: string;
  actionText?: string;
  actionTextEn?: string;
  operation?: 'create' | 'update' | 'delete';
}

// دالة لإنشاء إشعار لمستخدم واحد
export async function createNotification(data: NotificationData) {
  try {
    console.log(`🔔 [createNotification] Creating notification for user: ${data.userId}`);
    
    const notification = {
      _type: 'notification',
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const result = await client.create(notification);
    console.log(`✅ [createNotification] Notification created successfully: ${result._id}`);
    return result;
  } catch (error) {
    console.error('❌ [createNotification] Error creating notification:', error);
    throw error;
  }
}

// دالة لإنشاء إشعارات لجميع المستخدمين
export async function createNotificationForAllUsers(data: Omit<NotificationData, 'userId'>) {
  try {
    console.log('🔔 [createNotificationForAllUsers] Starting process...');
    
    // === ملاحظة هامة ===
    // هذا الكود يفترض وجود schema باسم "user" في Sanity يحتوي على حقل "email".
    // إذا لم يكن لديك هذا الـ schema، سيتم استخدام قائمة المستخدمين الافتراضية أدناه.
    // تأكد من إضافة بريدك الإلكتروني إلى هذه القائمة.
    // ===================
    
    // جلب جميع المستخدمين من قاعدة البيانات
    const usersQuery = `*[_type == "user" && email != null].email`;
    let users = await client.fetch(usersQuery);
    
    console.log(`👥 [createNotificationForAllUsers] Found ${users.length} users in Sanity database.`);

    // إذا لم يتم العثور على مستخدمين، استخدم القائمة الافتراضية
    if (users.length === 0) {
      console.log('⚠️ [createNotificationForAllUsers] No users found in database. Using fallback list.');
      // !!! هام: تأكد من إضافة بريدك هنا !!!
      users = [
        'fazlaka.platform@gmail.com', // <--- ضع بريدك هنا
        'aly.safwat.mohamed@gmail.com',
        'admin@example.com',
        'user@example.com'
      ];
    }
    
    let successCount = 0;
    let errorCount = 0;

    // إنشاء إشعار لكل مستخدم في القائمة
    for (const userEmail of users) {
      try {
        await createNotification({
          userId: userEmail,
          ...data,
        });
        successCount++;
        console.log(`✅ [createNotificationForAllUsers] Success for ${userEmail}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ [createNotificationForAllUsers] Failed for ${userEmail}:`, error);
      }
    }
    
    console.log(`📊 [createNotificationForAllUsers] Summary: ${successCount} success, ${errorCount} errors.`);
    return { success: true, count: successCount };
  } catch (error) {
    console.error('💥 [createNotificationForAllUsers] Critical error:', error);
    throw error;
  }
}

// دالة لإنشاء إشعار عند إضافة حلقة جديدة
export async function createEpisodeNotification(episode: Episode, operation: 'create' | 'update' | 'delete' = 'create') {
  const title = getLocalizedText(episode.title, episode.titleEn, 'ar');
  const titleEn = getLocalizedText(episode.title, episode.titleEn, 'en');
  
  // تحديد الرسالة بناءً على العملية
  let titleMessage, titleMessageEn, message, messageEn, actionText, actionTextEn;
  
  if (operation === 'create') {
    titleMessage = 'حلقة جديدة متاحة! 🎬';
    titleMessageEn = 'New Episode Available! 🎬';
    message = `تم إضافة حلقة جديدة: ${title}`;
    messageEn = `New episode added: ${titleEn}`;
    actionText = 'مشاهدة الحلقة';
    actionTextEn = 'Watch Episode';
  } else if (operation === 'update') {
    titleMessage = 'تحديث الحلقة! 🔄';
    titleMessageEn = 'Episode Updated! 🔄';
    message = `تم تحديث الحلقة: ${title}`;
    messageEn = `Episode has been updated: ${titleEn}`;
    actionText = 'مشاهدة الحلقة';
    actionTextEn = 'Watch Episode';
  } else if (operation === 'delete') {
    titleMessage = 'تم حذف الحلقة! 🗑️';
    titleMessageEn = 'Episode Deleted! 🗑️';
    message = `تم حذف الحلقة: ${title}`;
    messageEn = `Episode has been deleted: ${titleEn}`;
    actionText = undefined; // لا يوجد رابط عند الحذف
    actionTextEn = undefined;
  } else {
    titleMessage = 'تغييرات في الحلقة! 📝';
    titleMessageEn = 'Episode Changes! 📝';
    message = `تم إجراء تغييرات على الحلقة: ${title}`;
    messageEn = `Changes have been made to the episode: ${titleEn}`;
    actionText = 'مشاهدة الحلقة';
    actionTextEn = 'Watch Episode';
  }
  
  const data = {
    title: titleMessage,
    titleEn: titleMessageEn,
    message,
    messageEn,
    type: operation === 'delete' ? 'warning' as const : 'info' as const,
    relatedId: episode._id,
    relatedType: 'episode' as const,
    imageUrl: episode.thumbnailUrl,
    imageUrlEn: episode.thumbnailUrlEn,
    actionUrl: operation === 'delete' ? undefined : `/episodes/${episode.slug?.current}`,
    actionText,
    actionTextEn,
    operation
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار عند إضافة مقال جديد
export async function createArticleNotification(article: Article, operation: 'create' | 'update' | 'delete' = 'create') {
  const title = getLocalizedText(article.title, article.titleEn, 'ar');
  const titleEn = getLocalizedText(article.title, article.titleEn, 'en');
  
  // تحديد الرسالة بناءً على العملية
  let titleMessage, titleMessageEn, message, messageEn, actionText, actionTextEn;
  
  if (operation === 'create') {
    titleMessage = 'مقال جديد متاح! 📄';
    titleMessageEn = 'New Article Available! 📄';
    message = `تم إضافة مقال جديد: ${title}`;
    messageEn = `New article added: ${titleEn}`;
    actionText = 'قراءة المقال';
    actionTextEn = 'Read Article';
  } else if (operation === 'update') {
    titleMessage = 'تحديث المقال! 🔄';
    titleMessageEn = 'Article Updated! 🔄';
    message = `تم تحديث المقال: ${title}`;
    messageEn = `Article has been updated: ${titleEn}`;
    actionText = 'قراءة المقال';
    actionTextEn = 'Read Article';
  } else if (operation === 'delete') {
    titleMessage = 'تم حذف المقال! 🗑️';
    titleMessageEn = 'Article Deleted! 🗑️';
    message = `تم حذف المقال: ${title}`;
    messageEn = `Article has been deleted: ${titleEn}`;
    actionText = undefined;
    actionTextEn = undefined;
  } else {
    titleMessage = 'تغييرات في المقال! 📝';
    titleMessageEn = 'Article Changes! 📝';
    message = `تم إجراء تغييرات على المقال: ${title}`;
    messageEn = `Changes have been made to the article: ${titleEn}`;
    actionText = 'قراءة المقال';
    actionTextEn = 'Read Article';
  }
  
  const data = {
    title: titleMessage,
    titleEn: titleMessageEn,
    message,
    messageEn,
    type: operation === 'delete' ? 'warning' as const : 'info' as const,
    relatedId: article._id,
    relatedType: 'article' as const,
    imageUrl: article.featuredImageUrl,
    imageUrlEn: article.featuredImageUrlEn,
    actionUrl: operation === 'delete' ? undefined : `/articles/${article.slug?.current}`,
    actionText,
    actionTextEn,
    operation
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار عند إضافة قائمة تشغيل جديدة
export async function createPlaylistNotification(playlist: Playlist, operation: 'create' | 'update' | 'delete' = 'create') {
  const title = getLocalizedText(playlist.title, playlist.titleEn, 'ar');
  const titleEn = getLocalizedText(playlist.title, playlist.titleEn, 'en');
  
  // تحديد الرسالة بناءً على العملية
  let titleMessage, titleMessageEn, message, messageEn, actionText, actionTextEn;
  
  if (operation === 'create') {
    titleMessage = 'قائمة تشغيل جديدة! 🎵';
    titleMessageEn = 'New Playlist Available! 🎵';
    message = `تم إضافة قائمة تشغيل جديدة: ${title}`;
    messageEn = `New playlist added: ${titleEn}`;
    actionText = 'استعراض القائمة';
    actionTextEn = 'Browse Playlist';
  } else if (operation === 'update') {
    titleMessage = 'تحديث قائمة التشغيل! 🔄';
    titleMessageEn = 'Playlist Updated! 🔄';
    message = `تم تحديث قائمة التشغيل: ${title}`;
    messageEn = `Playlist has been updated: ${titleEn}`;
    actionText = 'استعراض القائمة';
    actionTextEn = 'Browse Playlist';
  } else if (operation === 'delete') {
    titleMessage = 'تم حذف قائمة التشغيل! 🗑️';
    titleMessageEn = 'Playlist Deleted! 🗑️';
    message = `تم حذف قائمة التشغيل: ${title}`;
    messageEn = `Playlist has been deleted: ${titleEn}`;
    actionText = undefined;
    actionTextEn = undefined;
  } else {
    titleMessage = 'تغييرات في قائمة التشغيل! 📝';
    titleMessageEn = 'Playlist Changes! 📝';
    message = `تم إجراء تغييرات على قائمة التشغيل: ${title}`;
    messageEn = `Changes have been made to the playlist: ${titleEn}`;
    actionText = 'استعراض القائمة';
    actionTextEn = 'Browse Playlist';
  }
  
  const data = {
    title: titleMessage,
    titleEn: titleMessageEn,
    message,
    messageEn,
    type: operation === 'delete' ? 'warning' as const : 'info' as const,
    relatedId: playlist._id,
    relatedType: 'playlist' as const,
    imageUrl: playlist.imageUrl,
    imageUrlEn: playlist.imageUrlEn,
    actionUrl: operation === 'delete' ? undefined : `/playlists/${playlist.slug?.current}`,
    actionText,
    actionTextEn,
    operation
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار عند إضافة موسم جديد
export async function createSeasonNotification(season: Season, operation: 'create' | 'update' | 'delete' = 'create') {
  const title = getLocalizedText(season.title, season.titleEn, 'ar');
  const titleEn = getLocalizedText(season.title, season.titleEn, 'en');
  
  // تحديد الرسالة بناءً على العملية
  let titleMessage, titleMessageEn, message, messageEn, actionText, actionTextEn;
  
  if (operation === 'create') {
    titleMessage = 'موسم جديد متاح! 🗓️';
    titleMessageEn = 'New Season Available! 🗓️';
    message = `تم إضافة موسم جديد: ${title}`;
    messageEn = `New season added: ${titleEn}`;
    actionText = 'استعراض الموسم';
    actionTextEn = 'Browse Season';
  } else if (operation === 'update') {
    titleMessage = 'تحديث الموسم! 🔄';
    titleMessageEn = 'Season Updated! 🔄';
    message = `تم تحديث الموسم: ${title}`;
    messageEn = `Season has been updated: ${titleEn}`;
    actionText = 'استعراض الموسم';
    actionTextEn = 'Browse Season';
  } else if (operation === 'delete') {
    titleMessage = 'تم حذف الموسم! 🗑️';
    titleMessageEn = 'Season Deleted! 🗑️';
    message = `تم حذف الموسم: ${title}`;
    messageEn = `Season has been deleted: ${titleEn}`;
    actionText = undefined;
    actionTextEn = undefined;
  } else {
    titleMessage = 'تغييرات في الموسم! 📝';
    titleMessageEn = 'Season Changes! 📝';
    message = `تم إجراء تغييرات على الموسم: ${title}`;
    messageEn = `Changes have been made to the season: ${titleEn}`;
    actionText = 'استعراض الموسم';
    actionTextEn = 'Browse Season';
  }
  
  const data = {
    title: titleMessage,
    titleEn: titleMessageEn,
    message,
    messageEn,
    type: operation === 'delete' ? 'warning' as const : 'info' as const,
    relatedId: season._id,
    relatedType: 'season' as const,
    imageUrl: season.thumbnailUrl,
    imageUrlEn: season.thumbnailUrlEn,
    actionUrl: operation === 'delete' ? undefined : `/seasons/${season.slug?.current}`,
    actionText,
    actionTextEn,
    operation
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار عند إضافة عضو فريق جديد
export async function createTeamMemberNotification(teamMember: TeamMember, operation: 'create' | 'update' | 'delete' = 'create') {
  const name = getLocalizedText(teamMember.name, teamMember.nameEn, 'ar');
  const nameEn = getLocalizedText(teamMember.name, teamMember.nameEn, 'en');
  const role = getLocalizedText(teamMember.role, teamMember.roleEn, 'ar');
  const roleEn = getLocalizedText(teamMember.role, teamMember.roleEn, 'en');
  
  // تحديد الرسالة بناءً على العملية
  let titleMessage, titleMessageEn, message, messageEn, actionText, actionTextEn;
  
  if (operation === 'create') {
    titleMessage = 'عضو جديد في الفريق! 👥';
    titleMessageEn = 'New Team Member! 👥';
    message = `انضم ${name} إلى فريقنا كـ ${role}`;
    messageEn = `${nameEn} has joined our team as ${roleEn}`;
    actionText = 'عرض الملف الشخصي';
    actionTextEn = 'View Profile';
  } else if (operation === 'update') {
    titleMessage = 'تحديث بيانات عضو الفريق! 🔄';
    titleMessageEn = 'Team Member Updated! 🔄';
    message = `تم تحديث بيانات ${name}`;
    messageEn = `${nameEn}'s information has been updated`;
    actionText = 'عرض الملف الشخصي';
    actionTextEn = 'View Profile';
  } else if (operation === 'delete') {
    titleMessage = 'تم حذف عضو الفريق! 🗑️';
    titleMessageEn = 'Team Member Deleted! 🗑️';
    message = `تم حذف ${name} من الفريق`;
    messageEn = `${nameEn} has been removed from the team`;
    actionText = undefined;
    actionTextEn = undefined;
  } else {
    titleMessage = 'تغييرات في بيانات عضو الفريق! 📝';
    titleMessageEn = 'Team Member Changes! 📝';
    message = `تم إجراء تغييرات على بيانات ${name}`;
    messageEn = `Changes have been made to ${nameEn}'s information`;
    actionText = 'عرض الملف الشخصي';
    actionTextEn = 'View Profile';
  }
  
  const data = {
    title: titleMessage,
    titleEn: titleMessageEn,
    message,
    messageEn,
    type: operation === 'delete' ? 'warning' as const : 'info' as const,
    relatedId: teamMember._id,
    relatedType: 'teamMember' as const,
    imageUrl: teamMember.imageUrl,
    imageUrlEn: teamMember.imageUrlEn,
    actionUrl: operation === 'delete' ? undefined : `/team/${teamMember.slug?.current}`,
    actionText,
    actionTextEn,
    operation
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار عند إضافة سؤال شائع جديد
export async function createFAQNotification(faq: FAQ, operation: 'create' | 'update' | 'delete' = 'create') {
  const question = getLocalizedText(faq.question, faq.questionEn, 'ar');
  const questionEn = getLocalizedText(faq.question, faq.questionEn, 'en');
  const category = getLocalizedText(faq.category, faq.categoryEn, 'ar');
  const categoryEn = getLocalizedText(faq.category, faq.categoryEn, 'en');
  
  // تحديد الرسالة بناءً على العملية
  let titleMessage, titleMessageEn, message, messageEn, actionText, actionTextEn;
  
  if (operation === 'create') {
    titleMessage = 'سؤال شائع جديد! ❓';
    titleMessageEn = 'New FAQ Added! ❓';
    message = `${question} (${category})`;
    messageEn = `${questionEn} (${categoryEn})`;
    actionText = 'عرض الإجابة';
    actionTextEn = 'View Answer';
  } else if (operation === 'update') {
    titleMessage = 'تحديث السؤال الشائع! 🔄';
    titleMessageEn = 'FAQ Updated! 🔄';
    message = `تم تحديث السؤال الشائع: ${question}`;
    messageEn = `FAQ has been updated: ${questionEn}`;
    actionText = 'عرض الإجابة';
    actionTextEn = 'View Answer';
  } else if (operation === 'delete') {
    titleMessage = 'تم حذف السؤال الشائع! 🗑️';
    titleMessageEn = 'FAQ Deleted! 🗑️';
    message = `تم حذف السؤال الشائع: ${question}`;
    messageEn = `FAQ has been deleted: ${questionEn}`;
    actionText = undefined;
    actionTextEn = undefined;
  } else {
    titleMessage = 'تغييرات في السؤال الشائع! 📝';
    titleMessageEn = 'FAQ Changes! 📝';
    message = `تم إجراء تغييرات على السؤال الشائع: ${question}`;
    messageEn = `Changes have been made to the FAQ: ${questionEn}`;
    actionText = 'عرض الإجابة';
    actionTextEn = 'View Answer';
  }
  
  const data = {
    title: titleMessage,
    titleEn: titleMessageEn,
    message,
    messageEn,
    type: operation === 'delete' ? 'warning' as const : 'info' as const,
    relatedId: faq._id,
    relatedType: 'faq' as const,
    actionUrl: operation === 'delete' ? undefined : `/faq?faq=${faq._id}`,
    actionText,
    actionTextEn,
    operation
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار عند إضافة شريحة رئيسية جديدة
export async function createHeroSliderNotification(heroSlider: HeroSlider, operation: 'create' | 'update' | 'delete' = 'create') {
  const title = getLocalizedText(heroSlider.title, heroSlider.titleEn, 'ar');
  const titleEn = getLocalizedText(heroSlider.title, heroSlider.titleEn, 'en');
  
  // تحديد الرسالة بناءً على العملية
  let titleMessage, titleMessageEn, message, messageEn, actionText, actionTextEn;
  
  if (operation === 'create') {
    titleMessage = 'شريحة رئيسية جديدة! 🎨';
    titleMessageEn = 'New Hero Slider! 🎨';
    message = `تم إضافة شريحة رئيسية جديدة: ${title}`;
    messageEn = `New hero slider added: ${titleEn}`;
    actionText = 'عرض الرئيسية';
    actionTextEn = 'View Homepage';
  } else if (operation === 'update') {
    titleMessage = 'تحديث الشريحة الرئيسية! 🔄';
    titleMessageEn = 'Hero Slider Updated! 🔄';
    message = `تم تحديث الشريحة الرئيسية: ${title}`;
    messageEn = `Hero slider has been updated: ${titleEn}`;
    actionText = 'عرض الرئيسية';
    actionTextEn = 'View Homepage';
  } else if (operation === 'delete') {
    titleMessage = 'تم حذف الشريحة الرئيسية! 🗑️';
    titleMessageEn = 'Hero Slider Deleted! 🗑️';
    message = `تم حذف الشريحة الرئيسية: ${title}`;
    messageEn = `Hero slider has been deleted: ${titleEn}`;
    actionText = undefined;
    actionTextEn = undefined;
  } else {
    titleMessage = 'تغييرات في الشريحة الرئيسية! 📝';
    titleMessageEn = 'Hero Slider Changes! 📝';
    message = `تم إجراء تغييرات على الشريحة الرئيسية: ${title}`;
    messageEn = `Changes have been made to the hero slider: ${titleEn}`;
    actionText = 'عرض الرئيسية';
    actionTextEn = 'View Homepage';
  }
  
  const data = {
    title: titleMessage,
    titleEn: titleMessageEn,
    message,
    messageEn,
    type: operation === 'delete' ? 'warning' as const : 'info' as const,
    relatedId: heroSlider._id,
    relatedType: 'heroSlider' as const,
    imageUrl: heroSlider.image,
    imageUrlEn: heroSlider.imageEn,
    actionUrl: operation === 'delete' ? undefined : `/`,
    actionText,
    actionTextEn,
    operation
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار عند تحديث الشروط والأحكام
export async function createTermsNotification(termsContent: TermsContent, operation: 'create' | 'update' | 'delete' = 'create') {
  const title = getLocalizedText(termsContent.title, termsContent.titleEn, 'ar');
  const titleEn = getLocalizedText(termsContent.title, termsContent.titleEn, 'en');
  
  // تحديد الرسالة بناءً على العملية
  let titleMessage, titleMessageEn, message, messageEn, actionText, actionTextEn;
  
  if (operation === 'create') {
    titleMessage = 'شروط وأحكام جديدة! 📄';
    titleMessageEn = 'New Terms & Conditions! 📄';
    message = `تم إضافة شروط وأحكام جديدة: ${title}`;
    messageEn = `New terms & conditions added: ${titleEn}`;
    actionText = 'عرض الشروط';
    actionTextEn = 'View Terms';
  } else if (operation === 'update') {
    titleMessage = 'تحديث الشروط والأحكام! 🔄';
    titleMessageEn = 'Terms & Conditions Updated! 🔄';
    message = `تم تحديث الشروط والأحكام: ${title}`;
    messageEn = `Terms & conditions have been updated: ${titleEn}`;
    actionText = 'عرض الشروط';
    actionTextEn = 'View Terms';
  } else if (operation === 'delete') {
    titleMessage = 'تم حذف الشروط والأحكام! 🗑️';
    titleMessageEn = 'Terms & Conditions Deleted! 🗑️';
    message = `تم حذف الشروط والأحكام: ${title}`;
    messageEn = `Terms & conditions have been deleted: ${titleEn}`;
    actionText = undefined;
    actionTextEn = undefined;
  } else {
    titleMessage = 'تغييرات في الشروط والأحكام! 📝';
    titleMessageEn = 'Terms & Conditions Changes! 📝';
    message = `تم إجراء تغييرات على الشروط والأحكام: ${title}`;
    messageEn = `Changes have been made to the terms & conditions: ${titleEn}`;
    actionText = 'عرض الشروط';
    actionTextEn = 'View Terms';
  }
  
  const data = {
    title: titleMessage,
    titleEn: titleMessageEn,
    message,
    messageEn,
    type: operation === 'delete' ? 'warning' as const : 'info' as const,
    relatedId: termsContent._id,
    relatedType: 'terms' as const,
    actionUrl: operation === 'delete' ? undefined : `/terms#${termsContent._id}`,
    actionText,
    actionTextEn,
    operation
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار عند تحديث سياسة الخصوصية
export async function createPrivacyNotification(privacyContent: PrivacyContent, operation: 'create' | 'update' | 'delete' = 'create') {
  const title = getLocalizedText(privacyContent.title, privacyContent.titleEn, 'ar');
  const titleEn = getLocalizedText(privacyContent.title, privacyContent.titleEn, 'en');
  
  // تحديد الرسالة بناءً على العملية
  let titleMessage, titleMessageEn, message, messageEn, actionText, actionTextEn;
  
  if (operation === 'create') {
    titleMessage = 'سياسة خصوصية جديدة! 🔒';
    titleMessageEn = 'New Privacy Policy! 🔒';
    message = `تم إضافة سياسة خصوصية جديدة: ${title}`;
    messageEn = `New privacy policy added: ${titleEn}`;
    actionText = 'عرض السياسة';
    actionTextEn = 'View Policy';
  } else if (operation === 'update') {
    titleMessage = 'تحديث سياسة الخصوصية! 🔄';
    titleMessageEn = 'Privacy Policy Updated! 🔄';
    message = `تم تحديث سياسة الخصوصية: ${title}`;
    messageEn = `Privacy policy has been updated: ${titleEn}`;
    actionText = 'عرض السياسة';
    actionTextEn = 'View Policy';
  } else if (operation === 'delete') {
    titleMessage = 'تم حذف سياسة الخصوصية! 🗑️';
    titleMessageEn = 'Privacy Policy Deleted! 🗑️';
    message = `تم حذف سياسة الخصوصية: ${title}`;
    messageEn = `Privacy policy has been deleted: ${titleEn}`;
    actionText = undefined;
    actionTextEn = undefined;
  } else {
    titleMessage = 'تغييرات في سياسة الخصوصية! 📝';
    titleMessageEn = 'Privacy Policy Changes! 📝';
    message = `تم إجراء تغييرات على سياسة الخصوصية: ${title}`;
    messageEn = `Changes have been made to the privacy policy: ${titleEn}`;
    actionText = 'عرض السياسة';
    actionTextEn = 'View Policy';
  }
  
  const data = {
    title: titleMessage,
    titleEn: titleMessageEn,
    message,
    messageEn,
    type: operation === 'delete' ? 'warning' as const : 'info' as const,
    relatedId: privacyContent._id,
    relatedType: 'privacy' as const,
    actionUrl: operation === 'delete' ? undefined : `/privacy#${privacyContent._id}`,
    actionText,
    actionTextEn,
    operation
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار عند تحديث الروابط الاجتماعية
export async function createSocialLinksNotification(socialLinks: SocialLinks, operation: 'create' | 'update' | 'delete' = 'create') {
  const linkCount = socialLinks.links ? socialLinks.links.length : 0;
  
  // تحديد الرسالة بناءً على العملية
  let titleMessage, titleMessageEn, message, messageEn, actionText, actionTextEn;
  
  if (operation === 'create') {
    titleMessage = 'روابط اجتماعية جديدة! 🔗';
    titleMessageEn = 'New Social Links! 🔗';
    message = `تم إضافة ${linkCount} رابط اجتماعي جديد`;
    messageEn = `${linkCount} new social links have been added`;
    actionText = 'عرض الروابط';
    actionTextEn = 'View Links';
  } else if (operation === 'update') {
    titleMessage = 'تحديث الروابط الاجتماعية! 🔄';
    titleMessageEn = 'Social Links Updated! 🔄';
    message = `تم تحديث ${linkCount} رابط اجتماعي`;
    messageEn = `${linkCount} social links have been updated`;
    actionText = 'عرض الروابط';
    actionTextEn = 'View Links';
  } else if (operation === 'delete') {
    titleMessage = 'تم حذف الروابط الاجتماعية! 🗑️';
    titleMessageEn = 'Social Links Deleted! 🗑️';
    message = `تم حذف ${linkCount} رابط اجتماعي`;
    messageEn = `${linkCount} social links have been deleted`;
    actionText = undefined;
    actionTextEn = undefined;
  } else {
    titleMessage = 'تغييرات في الروابط الاجتماعية! 📝';
    titleMessageEn = 'Social Links Changes! 📝';
    message = `تم إجراء تغييرات على ${linkCount} رابط اجتماعي`;
    messageEn = `Changes have been made to ${linkCount} social links`;
    actionText = 'عرض الروابط';
    actionTextEn = 'View Links';
  }
  
  const data = {
    title: titleMessage,
    titleEn: titleMessageEn,
    message,
    messageEn,
    type: operation === 'delete' ? 'warning' as const : 'info' as const,
    relatedId: socialLinks._id,
    relatedType: 'socialLinks' as const,
    actionUrl: operation === 'delete' ? undefined : `/contact`,
    actionText,
    actionTextEn,
    operation
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار عند حذف محتوى
export async function createContentDeletedNotification(
  contentType: NotificationData['relatedType'],
  contentId: string,
  contentTitleAr: string,
  contentTitleEn: string
) {
  const data = {
    title: `تم حذف ${contentTitleAr}! 🗑️`,
    titleEn: `${contentTitleEn} Deleted! 🗑️`,
    message: `تم حذف ${contentTitleAr} من المنصة`,
    messageEn: `${contentTitleEn} has been removed from the platform`,
    type: 'warning' as const,
    relatedId: contentId,
    relatedType: contentType,
    operation: 'delete' as const,
    actionUrl: undefined,
    actionText: undefined,
    actionTextEn: undefined
  };

  return await createNotificationForAllUsers(data);
}

// دالة لإنشاء إشعار ترحيبي للمستخدم الجديد
export async function createWelcomeNotification(userId: string, userName?: string) {
  const displayName = userName || 'صديقنا';
  const displayNameEn = userName || 'friend';
  
  const data = {
    title: `مرحباً بك في منصتنا! 🎉`,
    titleEn: `Welcome to our platform! 🎉`,
    message: `يسعدنا انضمامك إلينا، ${displayName}. استكشف محتوانا المتنوع.`,
    messageEn: `We're happy to have you here, ${displayNameEn}. Explore our diverse content.`,
    type: 'success' as const,
    relatedType: 'welcome' as const,
    actionUrl: '/',
    actionText: 'استكشف المحتوى',
    actionTextEn: 'Explore Content'
  };

  return await createNotification({
    userId,
    ...data
  });
}

// دالة لإنشاء إشعار عند تسجيل الدخول
export async function createLoginNotification(userId: string, userName?: string) {
  const displayName = userName || 'صديقنا';
  const displayNameEn = userName || 'friend';
  
  const data = {
    title: `مرحباً بعودتك! 👋`,
    titleEn: `Welcome back! 👋`,
    message: `سعيد برؤيتك مرة أخرى، ${displayName}. استمتع بتصفح المحتوى الجديد.`,
    messageEn: `Good to see you again, ${displayNameEn}. Enjoy browsing the new content.`,
    type: 'info' as const,
    relatedType: 'login' as const,
    actionUrl: '/',
    actionText: 'استكشف المحتوى',
    actionTextEn: 'Explore Content'
  };

  return await createNotification({
    userId,
    ...data
  });
}

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
export function getLocalizedTextHelper(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}

// دالة مساعدة للحصول على تاريخ صالح
export function getValidDate(date1?: string, date2?: string): string {
  const date = date1 || date2;
  if (!date) return new Date().toISOString();
  
  // التحقق من صحة التاريخ
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toISOString();
  
  return date;
}

// دالة مساعدة للحصول على رابط الصورة المناسب بناءً على اللغة
export function buildMediaUrl(imageUrl?: string, imageUrlEn?: string, language?: string): string | undefined {
  const url = language === 'ar' ? imageUrl : imageUrlEn;
  
  if (!url) return undefined;
  
  // استخدام دالة urlFor للتعامل مع الصور من Sanity
  return urlFor(url);
}