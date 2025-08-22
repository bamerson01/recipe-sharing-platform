"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommentItem } from "./comment-item";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import Link from "next/link";

interface Author {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_key: string | null;
}

interface Comment {
  id: string;
  recipe_id: number;
  user_id: string;
  parent_id: string | null;
  body: string;
  is_edited: boolean;
  edited_at: string | null;
  like_count: number;
  created_at: string;
  author: Author;
  is_liked?: boolean;
}

interface CommentsSectionProps {
  recipeId: number;
  recipeAuthorId: string;
}

export function CommentsSection({ recipeId, recipeAuthorId }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [recipeId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newComment.trim(),
          parentId: replyTo
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment("");
        setReplyTo(null);
        toast.success(replyTo ? "Reply posted" : "Comment posted");
      } else {
        throw new Error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string, newText: string) => {
    const response = await fetch(`/api/recipes/${recipeId}/comments?commentId=${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText })
    });

    if (response.ok) {
      const data = await response.json();
      setComments(prev => prev.map(c => c.id === commentId ? data.comment : c));
    } else {
      throw new Error("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const response = await fetch(`/api/recipes/${recipeId}/comments?commentId=${commentId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else {
      throw new Error("Failed to delete comment");
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    // This would need a separate API endpoint for comment likes
    // For now, we'll just update the local state
    toast.info("Comment likes coming soon!");
  };

  // Separate comments into root comments and replies
  const rootComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);
  const getReplies = (commentId: string) => replies.filter(r => r.parent_id === commentId);

  // Find the comment being replied to
  const replyingTo = replyTo ? comments.find(c => c.id === replyTo) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment input */}
        {user ? (
          <div className="space-y-3">
            {replyingTo && (
              <div className="bg-muted p-2 rounded text-sm">
                <div className="flex items-center justify-between">
                  <span>
                    Replying to <strong>{replyingTo.author.display_name || replyingTo.author.username}</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Textarea
                placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
                disabled={submitting}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="self-end"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Sign in to join the conversation
            </p>
            <Link href="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        )}

        {/* Comments list */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rootComments.map(comment => (
              <div key={comment.id} className="space-y-3">
                <CommentItem
                  comment={comment}
                  currentUserId={user?.id}
                  recipeAuthorId={recipeAuthorId}
                  onReply={user ? setReplyTo : undefined}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                />
                {/* Replies */}
                {getReplies(comment.id).map(reply => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    currentUserId={user?.id}
                    recipeAuthorId={recipeAuthorId}
                    onUpdate={handleUpdateComment}
                    onDelete={handleDeleteComment}
                    onLike={handleLikeComment}
                    isReply
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}