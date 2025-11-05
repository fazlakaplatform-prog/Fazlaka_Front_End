import { createDocument, deleteDocument } from './client'
import { Comment } from './types'

// دالة لإنشاء تعليق جديد
export async function createComment(commentData: Omit<Comment, '_id' | '_type' | 'createdAt'>): Promise<Comment> {
  try {
    return await createDocument<Comment>({
      _type: 'comment',
      ...commentData,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating comment in Sanity:', error);
    throw error;
  }
}

// دالة لحذف تعليق
export async function deleteComment(commentId: string): Promise<void> {
  try {
    await deleteDocument(commentId);
  } catch (error) {
    console.error('Error deleting comment in Sanity:', error);
    throw error;
  }
}