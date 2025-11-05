// src/lib/sanity/index.ts

// =================================================================
// Client and Core Functions
// =================================================================
export {
  client,
  fetchFromSanity,
  fetchArrayFromSanity,
  createDocument,
  updateDocument,
  deleteDocument
} from './client';

// =================================================================
// Types
// =================================================================
export type {
  PortableTextBlock,
  SanitySlug,
  Season,
  Episode,
  Article,
  Comment,
  Favorite,
  Playlist,
  TeamMember,
  NotificationItem,
  HeroSlider,
  SocialLink,
  SocialLinks,
  SanityImage,
  SanityFitMode,
  SanityCropMode,
  SanityAutoMode,
  SanityFormat,
  TermsContent,
  PrivacyContent
} from './types';

// =================================================================
// Image Utilities
// =================================================================
export {
  urlFor,
  urlForImage
} from './images';

// =================================================================
// Utility Functions
// =================================================================
// Generic helper function for localized text to be used across the app
export function getLocalizedText(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}

// =================================================================
// Feature Modules (Content, Data, etc.)
// =================================================================

// --- Episodes ---
export {
  fetchEpisodes,
  fetchEpisodeBySlug,
  fetchSeasons,
  fetchSeasonBySlug,
  fetchEpisodesBySeason,
  getLocalizedText as getEpisodeLocalizedText
} from './episodes';

// --- Articles ---
export {
  fetchArticles,
  fetchArticleBySlug,
  getLocalizedText as getArticleLocalizedText
} from './articles';

// --- Other modules without conflicts ---
export * from './seasons';
export * from './playlists';
export * from './favorites';
export * from './team';
export * from './social';
export * from './hero';
export * from './comments';

// --- FAQ module (using explicit exports to avoid conflicts) ---
export {
  fetchFaqs,
  fetchFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  fetchCategories as getFaqCategories,
  fetchFaqsByCategory
} from './faqs';

// --- Notifications module (only exporting what's needed) ---
export {
  getAllNotifications
} from './notifications';

// --- Terms module (using explicit exports) ---
export {
  getMainTerms,
  getLegalTerms,
  getRightsResponsibilities,
  getAdditionalPolicies,
  getSiteSettings,
  getAllTermsContent,
  createTermsContent,
  updateTermsContent,
  deleteTermsContent
} from './terms';

// --- Privacy module (using explicit exports) ---
export {
  getPrivacyPolicy,
  getUserRights,
  getDataTypes,
  getSecurityMeasures,
  createPrivacyContent,
  updatePrivacyContent,
  deletePrivacyContent
} from './privacy';