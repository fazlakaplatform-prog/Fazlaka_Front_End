import { NextResponse } from "next/server";
import { createComment, fetchFromSanity } from "@/lib/sanity";
import { Comment } from "@/lib/sanity"; // Import the Comment type

// Define a type for the comment input data that matches what we're sending
type CommentInput = {
  _type: "comment";
  name: string;
  email: string;
  content: string;
  createdAt: string;
  episode?: { _type: "reference"; _ref: string };
  article?: { _type: "reference"; _ref: string };
};

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
      content,
      createdAt
    } | order(createdAt desc)`;
    
    const comments = await fetchFromSanity(query);
    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("Error in GET /api/comments:", error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, episode, article, name, email } = body;
    
    if (!content || (!episode && !article) || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create the comment data with proper references
    const commentData: CommentInput = {
      _type: "comment",
      name,
      email: email || "",
      content,
      createdAt: new Date().toISOString(),
      ...(episode ? { 
        episode: {
          _type: "reference",
          _ref: episode
        }
      } : {}),
      ...(article ? { 
        article: {
          _type: "reference",
          _ref: article
        }
      } : {})
    };
    
    console.log("Creating comment:", commentData);
    
    // Convert to the expected type by creating a new object with the correct structure
    const createCommentData = {
      name: commentData.name,
      email: commentData.email,
      content: commentData.content,
      ...(episode ? { 
        episode: {
          _type: "reference",
          _ref: episode
        }
      } : {}),
      ...(article ? { 
        article: {
          _type: "reference",
          _ref: article
        }
      } : {})
    };
    
    const commentId = await createComment(createCommentData as Omit<Comment, "_type" | "_id" | "createdAt">);
    console.log("Comment created with ID:", commentId);
    
    return NextResponse.json({ 
      success: true, 
      id: commentId,
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