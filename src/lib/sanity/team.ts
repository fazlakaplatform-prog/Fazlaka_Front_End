import { fetchArrayFromSanity } from './client'
import { TeamMember } from './types'

// إعادة تصدير نوع TeamMember
export type { TeamMember } from './types'

// جلب جميع أعضاء الفريق
export async function fetchTeamMembers(language: string = 'ar'): Promise<TeamMember[]> {
  const query = `
    *[_type == "teamMember"] {
      _id,
      name,
      nameEn,
      bio,
      bioEn,
      imageUrl,
      imageUrlEn,
      slug,
      role,
      roleEn,
      socialLinks[] {
        platform,
        url
      },
      _createdAt
    } | order(_createdAt asc)
  `
  
  try {
    const members = await fetchArrayFromSanity<TeamMember>(query)
    
    // إضافة خاصية language إلى كل عضو في الفريق
    const membersWithLanguage = members.map(member => ({
      ...member,
      language: language as 'ar' | 'en'
    }))
    
    return membersWithLanguage.filter(member => member._id !== undefined) || []
  } catch (error) {
    console.error("Error fetching team members:", error)
    return []
  }
}

// جلب عضو فريق واحد بناءً على الـ slug
export async function fetchTeamMemberBySlug(slug: string): Promise<TeamMember | null> {
  const query = `
    *[_type == "teamMember" && slug.current == $slug][0] {
      _id,
      name,
      nameEn,
      bio,
      bioEn,
      imageUrl,
      imageUrlEn,
      slug,
      role,
      roleEn,
      socialLinks[] {
        platform,
        url
      },
      _createdAt
    }
  `
  
  try {
    const member = await fetchArrayFromSanity<TeamMember>(query, { slug })
    return member.length > 0 ? member[0] : null
  } catch (error) {
    console.error("Error fetching team member:", error)
    return null
  }
}