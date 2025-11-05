import { createClient, SanityDocumentStub } from 'next-sanity' // تم استيراد SanityDocumentStub
import { cache } from 'react'
import { QueryParams } from '@sanity/client'

// Define a base document type for Sanity documents
interface BaseDocument {
  _id?: string;
  _type?: string;
  _createdAt?: string;
  _updatedAt?: string;
  _rev?: string;
}

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// دالة لجلب بيانات واحدة من Sanity مع التخزين المؤقت
export const fetchFromSanity = cache(async <T>(query: string, params?: QueryParams): Promise<T> => {
  return await client.fetch<T>(query, params || {})
})

// دالة لجلب مصفوفة من البيانات من Sanity مع التخزين المؤقت
export const fetchArrayFromSanity = cache(async <T>(query: string, params?: QueryParams): Promise<T[]> => {
  return await client.fetch<T[]>(query, params || {})
})

// دالة لإنشاء مستند جديد في Sanity
export async function createDocument<T extends BaseDocument>(document: Omit<T, '_id'>): Promise<T> {
  // To satisfy TypeScript and ESLint, we assert the document type to SanityDocumentStub.
  // This is a safe assertion because we expect the input document to be a valid
  // Sanity document stub (i.e., it must contain a `_type` property).
  return await client.create(document as SanityDocumentStub<T>) as T
}

// دالة لتحديث مستند موجود في Sanity
export async function updateDocument<T extends BaseDocument>(id: string, updates: Partial<T>): Promise<T> {
  return await client.patch(id).set(updates).commit() as T
}

// دالة لحذف مستند من Sanity
export async function deleteDocument(id: string): Promise<void> {
  await client.delete(id)
}

// دالة لرفع صورة إلى Sanity
export async function uploadImage(file: File): Promise<{ _id: string; url: string }> {
  return await client.assets.upload('image', file)
}