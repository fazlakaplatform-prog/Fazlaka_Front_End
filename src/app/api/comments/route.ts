// app/api/comments/route.ts
import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episodeId");
  const articleId = searchParams.get("articleId");
  
  try {
    let query = `*[_type == "comment"`;
    
    if (episodeId) {
      query += ` && episode._ref == "${episodeId}"`;
    } else if (articleId) {
      query += ` && article._ref == "${articleId}"`;
    } else {
      return NextResponse.json({ data: [] });
    }
    
    query += `]{
      _id,
      name,
      email,
      content,
      createdAt,
      userId,
      userFirstName,
      userLastName,
      userImageUrl,
      "replies": *[_type == "comment" && parentComment._ref == ^._id] | order(createdAt asc) {
        _id,
        name,
        email,
        content,
        createdAt,
        userId,
        userFirstName,
        userLastName,
        userImageUrl
      }
    } | order(createdAt desc)`;
    
    const comments = await client.fetch(query);
    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("Error in GET /api/comments:", error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, episode, article, name, email, userId, userFirstName, userLastName, userImageUrl, parentComment } = body;
    
    if (!content || (!episode && !article) || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // إنشاء مستند التعليق
    const commentData = {
      _type: "comment",
      name,
      email: email || "",
      userId: userId || "",
      userFirstName: userFirstName || "",
      userLastName: userLastName || "",
      userImageUrl: userImageUrl || "",
      content,
      createdAt: new Date().toISOString(),
      ...(episode && { 
        episode: {
          _type: "reference",
          _ref: episode
        }
      }),
      ...(article && { 
        article: {
          _type: "reference",
          _ref: article
        }
      }),
      ...(parentComment && { 
        parentComment: {
          _type: "reference",
          _ref: parentComment
        }
      })
    };
    
    console.log("Creating comment:", commentData);
    
    // استخدام client.create مع التوكن الصحيح
    const result = await client.create(commentData);
    console.log("Comment created:", result);
    
    return NextResponse.json({ 
      success: true, 
      id: result._id,
      message: "Comment created successfully"
    });
  } catch (error) {
    console.error("Error in POST /api/comments:", error);
    return NextResponse.json(
      { error: "Failed to create comment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");
    
    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }
    
    console.log("Deleting comment:", commentId);
    
    // أولاً، احذف جميع الردود المرتبطة بالتعليق
    const repliesQuery = `*[_type == "comment" && parentComment._ref == "${commentId}"]{_id}`;
    const replies = await client.fetch(repliesQuery);
    
    for (const reply of replies) {
      await client.delete(reply._id);
    }
    
    // ثم احذف التعليق نفسه
    await client.delete(commentId);
    
    return NextResponse.json({ 
      success: true, 
      message: "Comment deleted successfully"
    });
  } catch (error) {
    console.error("Error in DELETE /api/comments:", error);
    return NextResponse.json(
      { error: "Failed to delete comment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}