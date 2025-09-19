import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { emailAddressId, code } = body
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // استخدام واجهة برمجة التطبيقات مباشرة
    const response = await fetch(`https://api.clerk.dev/v1/email_addresses/${emailAddressId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`
      },
      body: JSON.stringify({
        code: code
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Clerk API error:', error)
      return new NextResponse(error.errors?.[0]?.message || 'Verification failed', { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('attempt-verify error', err)
    if (err instanceof Error) {
      return new NextResponse(err.message || 'Server error', { status: 500 })
    }
    return new NextResponse('Server error', { status: 500 })
  }
}