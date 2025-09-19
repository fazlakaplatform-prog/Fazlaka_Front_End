import { NextResponse } from 'next/server'
import { clerkClient, auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { emailAddressId } = body
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const clerk = await clerkClient()
    await clerk.users.updateUser(userId, {
      primaryEmailAddressID: emailAddressId, // ← تم تصحيح الاسم هنا
      notifyPrimaryEmailAddressChanged: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('make-primary error', err)
    if (err instanceof Error) {
      return new NextResponse(err.message || 'Server error', { status: 500 })
    }
    return new NextResponse('Server error', { status: 500 })
  }
}