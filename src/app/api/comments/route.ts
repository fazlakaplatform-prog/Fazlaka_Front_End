import { NextResponse } from "next/server";
import { headers } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL || "https://growing-acoustics-35909e61eb.strapiapp.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episodeId");
  const articleId = searchParams.get("articleId");
  
  try {
    let url = `${STRAPI_URL}/api/comments?`;
    
    if (episodeId) {
      url += `filters[episode][documentId][$eq]=${episodeId}&populate[episode]=true`;
    } else if (articleId) {
      url += `filters[article][documentId][$eq]=${articleId}&populate[article]=true`;
    } else {
      return NextResponse.json({ data: [] });
    }
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
      cache: "no-store",
    });
    
    if (!res.ok) {
      console.error("Error fetching comments:", await res.text());
      return NextResponse.json({ data: [] });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/comments:", error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  const headersList = await headers(); // تم تعديل هذا السطر لإضافة await
  const contentType = headersList.get("content-type");
  
  if (!contentType || !contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 }
    );
  }
  
  try {
    const body = await request.json();
    const { content, episodeId, articleId, name, email } = body;
    
    if (!content || (!episodeId && !articleId) || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // الصيغة الصحيحة لربط العلاقات في Strapi v5
    const commentData = {
      data: {
        content,
        name,
        email,
        ...(episodeId ? { episode: episodeId } : {}),
        ...(articleId ? { article: articleId } : {}),
        publishedAt: new Date().toISOString(),
      },
    };
    
    console.log("Sending data to Strapi (v5):", JSON.stringify(commentData, null, 2));
    
    const res = await fetch(`${STRAPI_URL}/api/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify(commentData),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error creating comment:", errorText);
      return NextResponse.json(
        { error: "Failed to create comment", details: errorText },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST /api/comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}