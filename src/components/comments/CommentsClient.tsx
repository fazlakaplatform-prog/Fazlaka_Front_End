"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaComment } from "react-icons/fa";
import Link from "next/link";
import CommentItem from "./CommentItem";

// Define the Comment interface locally since the import is failing
interface Comment {
  _id?: string;
  content: string;
  userId?: string;
  email?: string;
  name?: string;
  userFirstName?: string;
  userLastName?: string;
  userImageUrl?: string;
  createdAt?: string;
  replies?: Comment[];
  parentComment?: string;
  article?: string;
  episode?: string;
}

interface CommentsClientProps {
  contentId: string;
  type: "article" | "episode";
}

interface CommentFormData {
  content: string;
  name: string;
  email: string;
  userId?: string;
  userFirstName?: string;
  userLastName?: string;
  userImageUrl?: string;
  parentComment?: string;
  article?: string;
  episode?: string;
}

export default function CommentsClient({ contentId, type }: CommentsClientProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?${type}Id=${contentId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }, [type, contentId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!content.trim()) {
      setErrorMsg("اكتب تعليقاً قبل الإرسال.");
      return;
    }

    if (status !== "authenticated" || !session?.user) {
      setErrorMsg("يجب تسجيل الدخول لكي تتمكن من إرسال تعليق.");
      return;
    }

    setLoading(true);

    try {
      const commentData: CommentFormData = {
        content,
        name: session.user.name || "مستخدم",
        email: session.user.email || "",
        userId: session.user.id,
        userFirstName: session.user.name?.split(' ')[0] || "",
        userLastName: session.user.name?.split(' ').slice(1).join(' ') || "",
        userImageUrl: session.user.image || "",
        [type]: contentId,
      };

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMsg("تم إرسال تعليقك بنجاح!");
        setContent("");
        fetchComments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create comment");
      }
    } catch (err: unknown) {
      console.error("Error sending comment:", err);
      if (err instanceof Error) {
        if (err.message.includes("Insufficient permissions")) {
          setErrorMsg("ليس لديك صلاحية لإرسال التعليقات. يرجى التواصل مع الإدارة.");
        } else {
          setErrorMsg(`حدث خطأ غير متوقع أثناء الإرسال: ${err.message}`);
        }
      } else {
        setErrorMsg("حدث خطأ غير متوقع أثناء الإرسال");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: string, replyContent: string) => {
    if (status !== "authenticated" || !session?.user) {
      setErrorMsg("يجب تسجيل الدخول لكي تتمكن من الرد.");
      return;
    }

    try {
      const replyData: CommentFormData = {
        content: replyContent,
        name: session.user.name || "مستخدم",
        email: session.user.email || "",
        userId: session.user.id,
        userFirstName: session.user.name?.split(' ')[0] || "",
        userLastName: session.user.name?.split(' ').slice(1).join(' ') || "",
        userImageUrl: session.user.image || "",
        parentComment: parentId,
        [type]: contentId,
      };

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(replyData),
      });

      if (response.ok) {
        setSuccessMsg("تم إرسال الرد بنجاح!");
        fetchComments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create reply");
      }
    } catch (err: unknown) {
      console.error("Error replying to comment:", err);
      if (err instanceof Error) {
        setErrorMsg(`حدث خطأ غير متوقع أثناء الإرسال: ${err.message}`);
      } else {
        setErrorMsg("حدث خطأ غير متوقع أثناء الإرسال");
      }
    }
  };

  const handleDelete = async (commentId: string) => {
    if (status !== "authenticated" || !session?.user) {
      setErrorMsg("يجب تسجيل الدخول لكي تتمكن من الحذف.");
      return;
    }

    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMsg("تم حذف التعليق بنجاح");
        fetchComments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }
    } catch (err: unknown) {
      console.error("Error deleting comment:", err);
      if (err instanceof Error) {
        setErrorMsg(`حدث خطأ غير متوقع أثناء الحذف: ${err.message}`);
      } else {
        setErrorMsg("حدث خطأ غير متوقع أثناء الحذف");
      }
    }
  };

  const getCurrentUserImage = (): string => {
    if (session?.user?.image) {
      return session.user.image;
    }
    const displayName = session?.user?.name || "مستخدم";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff`;
  };

  const getCurrentUserDisplayName = () => {
    return session?.user?.name || "مستخدم";
  };

  return (
    <div className="mt-6 rounded-xl overflow-hidden">
      {status !== "authenticated" && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="mb-2 text-blue-800 dark:text-blue-200">
            يجب تسجيل الدخول لكي تتمكن من إرسال تعليق.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            تسجيل الدخول
          </Link>
        </div>
      )}
      
      {status === "authenticated" && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-700">
                <Image
                  src={getCurrentUserImage()}
                  alt={getCurrentUserDisplayName()}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex-grow">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full border p-3 rounded-lg mb-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="اكتب تعليقك هنا..."
                required
                disabled={loading}
                aria-label="تعليق"
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {errorMsg && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
                  )}
                  {successMsg && (
                    <p className="text-sm text-green-600 dark:text-green-400">{successMsg}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
                    loading || !content.trim()
                      ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                      : "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md hover:shadow-lg"
                  }`}
                  aria-busy={loading}
                >
                  {loading ? "جاري الإرسال..." : "أرسل التعليق"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
      
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaComment className="text-4xl mx-auto mb-2 opacity-50" />
            <p>لا توجد تعليقات بعد.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDelete}
              currentUser={session?.user || null}
              contentId={contentId}
              type={type}
            />
          ))
        )}
      </div>
    </div>
  );
}