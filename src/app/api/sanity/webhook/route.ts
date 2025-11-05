// app/api/sanity/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { 
  createEpisodeNotification,
  createArticleNotification,
  createPlaylistNotification,
  createSeasonNotification,
  createTeamMemberNotification,
  createFAQNotification,
  createHeroSliderNotification,
  createTermsNotification,
  createPrivacyNotification,
  createSocialLinksNotification,
  createContentDeletedNotification
} from '@/lib/notifications';
import crypto from 'crypto';

// تعريف نوع أكثر أمانًا لجسم بيانات الـ webhook
type WebhookBody = Record<string, unknown>;

// تعريف نوع محدد لعمليات الـ webhook
type WebhookOperation = 'create' | 'update' | 'delete';

// التحقق من صحة الـ webhook باستخدام المعيار المتبع في Sanity
function verifyWebhook(request: NextRequest, body: WebhookBody): boolean {
  // للـ testing، يمكنك تجاوز التحقق مؤقتاً
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ Skipping webhook signature verification in development mode');
    return true;
  }
    
  const secret = process.env.SANITY_WEBHOOK_SECRET || 'Alysafwat@0109';
  const signature = request.headers.get('sanity-webhook-signature');
  
  if (!signature) {
    console.log('❌ No signature found in request headers');
    return false;
  }
  
  try {
    // استخراج التوقيع من الرأس
    const sig = Buffer.from(signature, 'utf8');
    const timestamp = sig.toString().split('t=')[1]?.split(',')[0];
    
    if (!timestamp) {
      console.log('❌ No timestamp found in signature');
      return false;
    }
    
    // التحقق من أن الطلب ليس قديماً جداً (ضد هجمات إعادة التشغيل)
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    const timeDifference = Math.abs(currentTime - requestTime);
    
    if (timeDifference > 300) { // 5 دقائق
      console.log(`❌ Request timestamp is too old: ${timeDifference} seconds`);
      return false;
    }
    
    // إنشاء التوقيع المتوقع
    const payload = `${timestamp}.${JSON.stringify(body)}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    // مقارنة التوقيعات
    const isValid = crypto.timingSafeEqual(
      Buffer.from(`v1=${expectedSignature}`, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
    
    if (!isValid) {
      console.log(`❌ Signature mismatch. Expected: v1=${expectedSignature}, Received: ${signature}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WebhookBody = await request.json();
    
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', {
      'sanity-transaction-id': request.headers.get('sanity-transaction-id'),
      'sanity-transaction-time': request.headers.get('sanity-transaction-time'),
      'sanity-dataset': request.headers.get('sanity-dataset'),
      'sanity-document-id': request.headers.get('sanity-document-id'),
      'sanity-project-id': request.headers.get('sanity-project-id'),
      'sanity-webhook-id': request.headers.get('sanity-webhook-id'),
      'sanity-operation': request.headers.get('sanity-operation'),
      'idempotency-key': request.headers.get('idempotency-key')
    });
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('========================');
    
    // التحقق من صحة الـ webhook
    if (!verifyWebhook(request, body)) {
      console.log('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // استخراج البيانات من الـ webhook
    let documentIds: string[] = [];
    let documentType: string = '';
    let operation: WebhookOperation = 'create'; // استخدام النوع المخصص مع قيمة افتراضية

    // التحقق من نوع الـ payload
    if (body.operation && body.ids) {
      // Format: { operation: 'delete', ids: ['abc123'], _type: 'episode' }
      documentIds = (body.ids as string[]).map(String);
      documentType = String(body._type);
      // استخدام type assertion لضمان التوافق مع النوع المحدد
      operation = (body.operation as WebhookOperation);
      console.log(`📋 Using operation format: ${operation} for ${documentIds.length} ${documentType} documents`);
    } else if (body._id && body._type) {
      // Format: { _id: 'abc123', _type: 'episode', operation: 'create' }
      documentIds = [String(body._id)];
      documentType = String(body._type);
      operation = (body.operation as WebhookOperation) || 'create';
      console.log(`📋 Using direct format: ${operation} for ${documentType} document`);
    } else if (body.mutations && Array.isArray(body.mutations)) {
      // Format: { mutations: [{ mutation: 'create', result: { _id: 'abc123', _type: 'episode' } }] }
      for (const mutation of body.mutations) {
        if (mutation.result && typeof mutation.result === 'object' && '_id' in mutation.result && '_type' in mutation.result) {
          const result = mutation.result as { _id: string; _type: string };
          documentIds.push(result._id);
          documentType = result._type;
          operation = (mutation.mutation as WebhookOperation) || 'create';
        }
      }
      console.log(`📋 Using mutations format: ${operation} for ${documentIds.length} ${documentType} documents`);
    }

    if (documentIds.length === 0) {
      console.log('❌ No document IDs found in webhook');
      return NextResponse.json({ 
        success: true, 
        message: 'No documents to process',
        received: Object.keys(body)
      });
    }

    console.log(`✅ Processing ${documentIds.length} ${documentType} documents (${operation})`);

    let successCount = 0;
    let errorCount = 0;

    // معالجة كل مستند
    for (const id of documentIds) {
      try {
        console.log(`🔄 Processing ${documentType}: ${id} (${operation})`);

        switch (documentType) {
          case 'episode':
            if (operation === 'delete') {
              // حذف الحلقة - نستخدم الإشعار العام للحذف
              console.log(`🗑️ Deleting episode: ${id}`);
              const result = await createContentDeletedNotification(
                'episode', 
                id, 
                'حلقة', 
                'Episode'
              );
              if (result) {
                successCount++;
                console.log(`✅ Delete notification created for episode: ${id}`);
              } else {
                errorCount++;
                console.log(`❌ Failed to create delete notification for episode: ${id}`);
              }
            } else {
              // إنشاء أو تحديث الحلقة
              const episode = await client.fetch(`
                *[_id == $id][0] {
                  _id,
                  title,
                  titleEn,
                  slug,
                  thumbnailUrl,
                  thumbnailUrlEn,
                  publishedAt
                }
              `, { id });
              
              if (episode) {
                console.log(`📺 Found episode: ${episode.title || episode.titleEn}`);
                const result = await createEpisodeNotification(episode, operation);
                if (result) {
                  successCount++;
                  console.log(`✅ Notification created for episode: ${episode.title || episode.titleEn} (${operation})`);
                } else {
                  errorCount++;
                  console.log(`❌ Failed to create notification for episode: ${episode.title || episode.titleEn}`);
                }
              } else {
                console.log(`❌ Episode not found: ${id}`);
                errorCount++;
              }
            }
            break;

          case 'article':
            if (operation === 'delete') {
              console.log(`🗑️ Deleting article: ${id}`);
              const result = await createContentDeletedNotification(
                'article', 
                id, 
                'مقال', 
                'Article'
              );
              if (result) {
                successCount++;
                console.log(`✅ Delete notification created for article: ${id}`);
              } else {
                errorCount++;
                console.log(`❌ Failed to create delete notification for article: ${id}`);
              }
            } else {
              const article = await client.fetch(`
                *[_id == $id][0] {
                  _id,
                  title,
                  titleEn,
                  slug,
                  featuredImageUrl,
                  featuredImageUrlEn,
                  publishedAt
                }
              `, { id });
              
              if (article) {
                console.log(`📄 Found article: ${article.title || article.titleEn}`);
                const result = await createArticleNotification(article, operation);
                if (result) {
                  successCount++;
                  console.log(`✅ Notification created for article: ${article.title || article.titleEn} (${operation})`);
                } else {
                  errorCount++;
                  console.log(`❌ Failed to create notification for article: ${article.title || article.titleEn}`);
                }
              } else {
                console.log(`❌ Article not found: ${id}`);
                errorCount++;
              }
            }
            break;

          case 'playlist':
            if (operation === 'delete') {
              console.log(`🗑️ Deleting playlist: ${id}`);
              const result = await createContentDeletedNotification(
                'playlist', 
                id, 
                'قائمة تشغيل', 
                'Playlist'
              );
              if (result) {
                successCount++;
                console.log(`✅ Delete notification created for playlist: ${id}`);
              } else {
                errorCount++;
                console.log(`❌ Failed to create delete notification for playlist: ${id}`);
              }
            } else {
              const playlist = await client.fetch(`
                *[_id == $id][0] {
                  _id,
                  title,
                  titleEn,
                  slug,
                  imageUrl,
                  imageUrlEn
                }
              `, { id });
              
              if (playlist) {
                console.log(`🎵 Found playlist: ${playlist.title || playlist.titleEn}`);
                const result = await createPlaylistNotification(playlist, operation);
                if (result) {
                  successCount++;
                  console.log(`✅ Notification created for playlist: ${playlist.title || playlist.titleEn} (${operation})`);
                } else {
                  errorCount++;
                  console.log(`❌ Failed to create notification for playlist: ${playlist.title || playlist.titleEn}`);
                }
              } else {
                console.log(`❌ Playlist not found: ${id}`);
                errorCount++;
              }
            }
            break;

          case 'season':
            if (operation === 'delete') {
              console.log(`🗑️ Deleting season: ${id}`);
              const result = await createContentDeletedNotification(
                'season', 
                id, 
                'موسم', 
                'Season'
              );
              if (result) {
                successCount++;
                console.log(`✅ Delete notification created for season: ${id}`);
              } else {
                errorCount++;
                console.log(`❌ Failed to create delete notification for season: ${id}`);
              }
            } else {
              const season = await client.fetch(`
                *[_id == $id][0] {
                  _id,
                  title,
                  titleEn,
                  slug,
                  thumbnailUrl,
                  thumbnailUrlEn,
                  publishedAt
                }
              `, { id });
              
              if (season) {
                console.log(`🗓️ Found season: ${season.title || season.titleEn}`);
                const result = await createSeasonNotification(season, operation);
                if (result) {
                  successCount++;
                  console.log(`✅ Notification created for season: ${season.title || season.titleEn} (${operation})`);
                } else {
                  errorCount++;
                  console.log(`❌ Failed to create notification for season: ${season.title || season.titleEn}`);
                }
              } else {
                console.log(`❌ Season not found: ${id}`);
                errorCount++;
              }
            }
            break;

          case 'teamMember':
            if (operation === 'delete') {
              console.log(`🗑️ Deleting team member: ${id}`);
              const result = await createContentDeletedNotification(
                'teamMember', 
                id, 
                'عضو فريق', 
                'Team Member'
              );
              if (result) {
                successCount++;
                console.log(`✅ Delete notification created for team member: ${id}`);
              } else {
                errorCount++;
                console.log(`❌ Failed to create delete notification for team member: ${id}`);
              }
            } else {
              const teamMember = await client.fetch(`
                *[_id == $id][0] {
                  _id,
                  name,
                  nameEn,
                  slug,
                  imageUrl,
                  imageUrlEn,
                  role,
                  roleEn
                }
              `, { id });
              
              if (teamMember) {
                console.log(`👥 Found team member: ${teamMember.name || teamMember.nameEn}`);
                const result = await createTeamMemberNotification(teamMember, operation);
                if (result) {
                  successCount++;
                  console.log(`✅ Notification created for team member: ${teamMember.name || teamMember.nameEn} (${operation})`);
                } else {
                  errorCount++;
                  console.log(`❌ Failed to create notification for team member: ${teamMember.name || teamMember.nameEn}`);
                }
              } else {
                console.log(`❌ Team member not found: ${id}`);
                errorCount++;
              }
            }
            break;

          case 'faq':
            if (operation === 'delete') {
              console.log(`🗑️ Deleting FAQ: ${id}`);
              const result = await createContentDeletedNotification(
                'faq', 
                id, 
                'سؤال شائع', 
                'FAQ'
              );
              if (result) {
                successCount++;
                console.log(`✅ Delete notification created for FAQ: ${id}`);
              } else {
                errorCount++;
                console.log(`❌ Failed to create delete notification for FAQ: ${id}`);
              }
            } else {
              const faq = await client.fetch(`
                *[_id == $id][0] {
                  _id,
                  question,
                  questionEn,
                  answer,
                  answerEn,
                  category,
                  categoryEn
                }
              `, { id });
              
              if (faq) {
                console.log(`❓ Found FAQ: ${faq.question || faq.questionEn}`);
                const result = await createFAQNotification(faq, operation);
                if (result) {
                  successCount++;
                  console.log(`✅ Notification created for FAQ: ${faq.question || faq.questionEn} (${operation})`);
                } else {
                  errorCount++;
                  console.log(`❌ Failed to create notification for FAQ: ${faq.question || faq.questionEn}`);
                }
              } else {
                console.log(`❌ FAQ not found: ${id}`);
                errorCount++;
              }
            }
            break;

          case 'heroSlider':
            if (operation === 'delete') {
              console.log(`🗑️ Deleting hero slider: ${id}`);
              const result = await createContentDeletedNotification(
                'heroSlider', 
                id, 
                'شريحة رئيسية', 
                'Hero Slider'
              );
              if (result) {
                successCount++;
                console.log(`✅ Delete notification created for hero slider: ${id}`);
              } else {
                errorCount++;
                console.log(`❌ Failed to create delete notification for hero slider: ${id}`);
              }
            } else {
              const heroSlider = await client.fetch(`
                *[_id == $id][0] {
                  _id,
                  title,
                  titleEn,
                  description,
                  descriptionEn,
                  image,
                  imageEn,
                  mediaType
                }
              `, { id });
              
              if (heroSlider) {
                console.log(`🎨 Found hero slider: ${heroSlider.title || heroSlider.titleEn}`);
                const result = await createHeroSliderNotification(heroSlider, operation);
                if (result) {
                  successCount++;
                  console.log(`✅ Notification created for hero slider: ${heroSlider.title || heroSlider.titleEn} (${operation})`);
                } else {
                  errorCount++;
                  console.log(`❌ Failed to create notification for hero slider: ${heroSlider.title || heroSlider.titleEn}`);
                }
              } else {
                console.log(`❌ Hero slider not found: ${id}`);
                errorCount++;
              }
            }
            break;

          case 'termsContent':
            if (operation === 'delete') {
              console.log(`🗑️ Deleting terms content: ${id}`);
              const result = await createContentDeletedNotification(
                'terms', 
                id, 
                'شروط وأحكام', 
                'Terms & Conditions'
              );
              if (result) {
                successCount++;
                console.log(`✅ Delete notification created for terms content: ${id}`);
              } else {
                errorCount++;
                console.log(`❌ Failed to create delete notification for terms content: ${id}`);
              }
            } else {
              const termsContent = await client.fetch(`
                *[_id == $id][0] {
                  _id,
                  title,
                  titleEn,
                  sectionType,
                  lastUpdated
                }
              `, { id });
              
              if (termsContent) {
                console.log(`📄 Found terms content: ${termsContent.title || termsContent.titleEn}`);
                const result = await createTermsNotification(termsContent, operation);
                if (result) {
                  successCount++;
                  console.log(`✅ Notification created for terms content: ${termsContent.title || termsContent.titleEn} (${operation})`);
                } else {
                  errorCount++;
                  console.log(`❌ Failed to create notification for terms content: ${termsContent.title || termsContent.titleEn}`);
                }
              } else {
                console.log(`❌ Terms content not found: ${id}`);
                errorCount++;
              }
            }
            break;

          case 'privacyContent':
            if (operation === 'delete') {
              console.log(`🗑️ Deleting privacy content: ${id}`);
              const result = await createContentDeletedNotification(
                'privacy', 
                id, 
                'سياسة الخصوصية', 
                'Privacy Policy'
              );
              if (result) {
                successCount++;
                console.log(`✅ Delete notification created for privacy content: ${id}`);
              } else {
                errorCount++;
                console.log(`❌ Failed to create delete notification for privacy content: ${id}`);
              }
            } else {
              const privacyContent = await client.fetch(`
                *[_id == $id][0] {
                  _id,
                  title,
                  titleEn,
                  sectionType,
                  lastUpdated
                }
              `, { id });
              
              if (privacyContent) {
                console.log(`🔒 Found privacy content: ${privacyContent.title || privacyContent.titleEn}`);
                const result = await createPrivacyNotification(privacyContent, operation);
                if (result) {
                  successCount++;
                  console.log(`✅ Notification created for privacy content: ${privacyContent.title || privacyContent.titleEn} (${operation})`);
                } else {
                  errorCount++;
                  console.log(`❌ Failed to create notification for privacy content: ${privacyContent.title || privacyContent.titleEn}`);
                }
              } else {
                console.log(`❌ Privacy content not found: ${id}`);
                errorCount++;
              }
            }
            break;

          case 'socialLinks':
            if (operation === 'delete') {
              console.log(`🗑️ Deleting social links: ${id}`);
              const result = await createContentDeletedNotification(
                'socialLinks', 
                id, 
                'روابط اجتماعية', 
                'Social Links'
              );
              if (result) {
                successCount++;
                console.log(`✅ Delete notification created for social links: ${id}`);
              } else {
                errorCount++;
                console.log(`❌ Failed to create delete notification for social links: ${id}`);
              }
            } else {
              const socialLinks = await client.fetch(`
                *[_id == $id][0] {
                  _id,
                  links
                }
              `, { id });
              
              if (socialLinks) {
                console.log(`🔗 Found social links`);
                const result = await createSocialLinksNotification(socialLinks, operation);
                if (result) {
                  successCount++;
                  console.log(`✅ Notification created for social links (${operation})`);
                } else {
                  errorCount++;
                  console.log(`❌ Failed to create notification for social links`);
                }
              } else {
                console.log(`❌ Social links not found: ${id}`);
                errorCount++;
              }
            }
            break;

          default:
            console.log(`❓ Unknown document type: ${documentType}`);
            errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${documentType} with ID ${id}:`, error);
        errorCount++;
      }
    }

    console.log(`📊 Summary: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      processed: documentIds.length,
      successCount,
      errorCount,
      documentType,
      operation
    });
  } catch (error) {
    console.error('💥 Webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// دالة للـ GET للاختبار
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
    url: request.url,
    headers: {
      'sanity-transaction-id': request.headers.get('sanity-transaction-id'),
      'sanity-transaction-time': request.headers.get('sanity-transaction-time'),
      'sanity-dataset': request.headers.get('sanity-dataset'),
      'sanity-document-id': request.headers.get('sanity-document-id'),
      'sanity-project-id': request.headers.get('sanity-project-id'),
      'sanity-webhook-id': request.headers.get('sanity-webhook-id'),
      'sanity-operation': request.headers.get('sanity-operation'),
      'idempotency-key': request.headers.get('idempotency-key')
    }
  });
}