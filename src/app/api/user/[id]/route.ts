// File: src/app/api/user/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { client } from "@/lib/sanity"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await client.fetch(
      `*[_type == "user" && _id == $id][0]{
        _id,
        name,
        email,
        image,
        bio,
        location,
        website,
        createdAt
      }`,
      { id }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json()
    const { name, bio, image, location, website } = body

    // تحديث المستخدم في Sanity
    const updatedUser = await client
      .patch(id)
      .set({
        ...(name && { name }),
        ...(bio && { bio }),
        ...(image && { image }), // هنا يتم تخزين رابط الصورة من ImgBB
        ...(location && { location }),
        ...(website && { website }),
        updatedAt: new Date().toISOString(),
      })
      .commit()

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}