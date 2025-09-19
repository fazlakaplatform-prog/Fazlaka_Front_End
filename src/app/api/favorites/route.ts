import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const contentId = searchParams.get("contentId");
  const contentType = searchParams.get("contentType"); // 'episode' or 'article'

  if (!userId || !contentId || !contentType) {
    return NextResponse.json({ error: "Missing userId, contentId, or contentType" }, { status: 400 });
  }

  try {
    const query = `*[_type == "favorite" && userId == $userId && ${contentType}._ref == $contentId][0]{
      _id
    }`;
    
    const favorite = await client.fetch(query, { userId, contentId });
    
    return NextResponse.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return NextResponse.json({ error: "Failed to check favorite status" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, contentId, contentType } = body;

    if (!userId || !contentId || !contentType) {
      return NextResponse.json({ error: "Missing userId, contentId, or contentType" }, { status: 400 });
    }

    // Check if already a favorite
    const checkQuery = `*[_type == "favorite" && userId == $userId && ${contentType}._ref == $contentId][0]{
      _id
    }`;
    
    const existingFavorite = await client.fetch(checkQuery, { userId, contentId });
    
    if (existingFavorite) {
      return NextResponse.json({ message: "Already in favorites" }, { status: 200 });
    }

    // Create new favorite
    const newFavorite = await client.create({
      _type: "favorite",
      userId,
      [contentType]: {
        _type: "reference",
        _ref: contentId
      }
    });

    return NextResponse.json({ success: true, id: newFavorite._id });
  } catch (error) {
    console.error("Error creating favorite:", error);
    return NextResponse.json({ 
      error: "Failed to add to favorites",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId, contentId, contentType } = body;

    if (!userId || !contentId || !contentType) {
      return NextResponse.json({ error: "Missing userId, contentId, or contentType" }, { status: 400 });
    }

    // Find the favorite document
    const query = `*[_type == "favorite" && userId == $userId && ${contentType}._ref == $contentId][0]{
      _id
    }`;
    
    const favorite = await client.fetch(query, { userId, contentId });
    
    if (!favorite) {
      return NextResponse.json({ message: "Favorite not found" }, { status: 404 });
    }

    // Delete the favorite
    await client.delete(favorite._id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json({ 
      error: "Failed to remove from favorites",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}