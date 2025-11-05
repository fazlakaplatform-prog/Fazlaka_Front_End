// sanity/favorites.ts

import { fetchArrayFromSanity, fetchFromSanity, createDocument, deleteDocument } from './client'
import { Favorite, Episode, Article } from './types'

// دوال للتعامل مع المفضلة
export async function fetchUserFavorites(userId: string): Promise<Favorite[]> {
  try {
    const query = `*[_type == "favorite" && userId == $userId]{
      _id,
      userId,
      episode->{
        _id,
        _type,
        title,
        titleEn,
        slug,
        thumbnailUrl,
        thumbnailUrlEn,
        duration,
        publishedAt,
        categories,
        language
      },
      article->{
        _id,
        _type,
        title,
        titleEn,
        slug,
        featuredImageUrl,
        featuredImageUrlEn,
        publishedAt,
        readTime,
        categories,
        language
      }
    }`;
    return await fetchArrayFromSanity<Favorite>(query, { userId });
  } catch (error) {
    console.error('Error fetching user favorites from Sanity:', error);
    return [];
  }
}

export async function createFavorite(favoriteData: Omit<Favorite, '_id'>): Promise<Favorite> {
  try {
    return await createDocument<Favorite>(favoriteData);
  } catch (error) {
    console.error('Error creating favorite in Sanity:', error);
    throw error;
  }
}

export async function deleteFavorite(favoriteId: string): Promise<void> {
  try {
    await deleteDocument(favoriteId);
  } catch (error) {
    console.error('Error deleting favorite in Sanity:', error);
    throw error;
  }
}

export async function checkFavorite(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<boolean> {
  try {
    const query = `*[_type == "favorite" && userId == $userId && ${contentType}._ref == $contentId][0]{
      _id
    }`;
    const favorite = await fetchFromSanity<Favorite>(query, { userId, contentId });
    return !!favorite;
  } catch (error) {
    console.error('Error checking favorite status from Sanity:', error);
    return false;
  }
}

export async function addToFavorites(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<Favorite> {
  try {
    // Check if already a favorite
    const isAlreadyFavorite = await checkFavorite(userId, contentId, contentType);
    if (isAlreadyFavorite) {
      throw new Error('Content is already in favorites');
    }

    const favoriteData: Omit<Favorite, '_id'> = {
      _type: 'favorite',
      userId,
      [contentType]: {
        _type: 'reference',
        _ref: contentId
      },
      createdAt: new Date().toISOString()
    };

    return await createFavorite(favoriteData);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

export async function removeFromFavorites(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<void> {
  try {
    const query = `*[_type == "favorite" && userId == $userId && ${contentType}._ref == $contentId][0]{
      _id
    }`;
    const favorite = await fetchFromSanity<Favorite>(query, { userId, contentId });
    
    if (!favorite || !favorite._id) {
      throw new Error('Favorite not found');
    }

    await deleteFavorite(favorite._id);
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}