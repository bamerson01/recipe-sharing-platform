"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Edit2, Trash2, X, Check } from "lucide-react";
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

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  recipeAuthorId?: string;
  onReply?: (commentId: string) => void;
  onUpdate?: (commentId: string, newText: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onLike?: (commentId: string, isLiked: boolean) => Promise<void>;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  currentUserId,
  recipeAuthorId,
  onReply,
  onUpdate,
  onDelete,
  onLike,
  isReply = false
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(comment.like_count);
  const [localIsLiked, setLocalIsLiked] = useState(comment.is_liked || false);

  const isAuthor = currentUserId === comment.user_id;
  const isRecipeAuthor = currentUserId === recipeAuthorId;
  const canDelete = isAuthor || isRecipeAuthor;
  const canEdit = isAuthor;

  const handleSaveEdit = async () => {
    if (!onUpdate || editText.trim() === comment.body) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(comment.id, editText.trim());
      setIsEditing(false);
      toast.success("Comment updated");
    } catch (error) {
      toast.error("Failed to update comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await onDelete(comment.id);
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleLike = async () => {
    if (!onLike || !currentUserId) {
      toast.error("Please sign in to like comments");
      return;
    }

    // Optimistic update
    const newIsLiked = !localIsLiked;
    setLocalIsLiked(newIsLiked);
    setLocalLikeCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      await onLike(comment.id, newIsLiked);
    } catch (error) {
      // Revert on error
      setLocalIsLiked(!newIsLiked);
      setLocalLikeCount(prev => !newIsLiked ? prev + 1 : Math.max(0, prev - 1));
      toast.error("Failed to update like");
    }
  };

  const avatarUrl = comment.author.avatar_key
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${comment.author.avatar_key}`
    : undefined;

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      <Link href={`/u/${comment.author.username}`}>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-xs">
            {comment.author.display_name?.[0]?.toUpperCase() ||
              comment.author.username?.[0]?.toUpperCase() ||
              'U'}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/u/${comment.author.username}`}
                className="font-semibold text-sm hover:underline"
              >
                {comment.author.display_name || comment.author.username || 'Anonymous'}
              </Link>
              {isRecipeAuthor && comment.user_id === recipeAuthorId && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Recipe Author
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>

            {(canEdit || canDelete) && !isEditing && (
              <div className="flex items-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setIsEditing(true);
                      setEditText(comment.body);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] text-sm"
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSubmitting || editText.trim().length === 0}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.body);
                  }}
                  disabled={isSubmitting}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${localIsLiked ? 'text-red-500' : ''}`}
            onClick={handleLike}
          >
            <Heart className={`h-3 w-3 mr-1 ${localIsLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">{localLikeCount}</span>
          </Button>

          {onReply && !isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => onReply(comment.id)}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              <span className="text-xs">Reply</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}