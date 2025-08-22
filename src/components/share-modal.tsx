"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  ExternalLink,
  Facebook,
  Twitter,
  Mail,
  QrCode,
  Link as LinkIcon,
  Share2
} from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: {
    id: number;
    title: string;
    summary?: string | null;
    cover_image_key?: string | null;
    author: {
      username: string | null;
      display_name: string | null;
    };
    categories: Array<{ name: string }>;
  };
}

export function ShareModal({ isOpen, onClose, recipe }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [recipeUrl, setRecipeUrl] = useState('');

  // Set the recipe URL after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/r/${recipe.id}-${recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      setRecipeUrl(url);
    }
  }, [recipe.id, recipe.title]);

  const shareText = `${recipe.title} by ${recipe.author.display_name || recipe.author.username || 'Anonymous'}`;
  const shareDescription = recipe.summary || `Check out this delicious recipe!`;

  const handleCopyLink = async () => {
    if (!recipeUrl) {
      toast.error("Recipe URL not ready yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(recipeUrl);
      setCopied(true);
      toast.success("Recipe link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleSocialShare = (platform: string) => {
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(recipeUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(recipeUrl)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(recipeUrl)}&description=${encodeURIComponent(shareDescription)}&media=${encodeURIComponent(recipe.cover_image_key ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${recipe.cover_image_key}` : '')}`,
    };

    const url = urls[platform as keyof typeof urls];
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const handleEmailShare = () => {
    const subject = `Recipe: ${recipe.title}`;
    const body = `Hi!\n\nI wanted to share this recipe with you:\n\n${recipe.title}\n${shareDescription}\n\nView the full recipe here: ${recipeUrl}\n\nBon appétit!`;

    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleNativeShare = async () => {
    if (!recipeUrl) {
      toast.error("Recipe URL not ready yet");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareDescription,
          url: recipeUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Recipe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipe Preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg">{recipe.title}</h3>
            {recipe.summary && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {recipe.summary}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>by {recipe.author.display_name || recipe.author.username || 'Anonymous'}</span>
            </div>
            {recipe.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.categories.slice(0, 3).map((category, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipe Link</label>
            <div className="flex gap-2">
              <Input
                value={recipeUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Media Sharing */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share to Social Media</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare('facebook')}
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare('twitter')}
                className="flex items-center gap-2"
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare('pinterest')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4 text-red-600" />
                Pinterest
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmailShare}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4 text-gray-600" />
                Email
              </Button>
            </div>
          </div>

          {/* Native Share (Mobile) */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <Button
              onClick={handleNativeShare}
              className="w-full"
              variant="default"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share via System
            </Button>
          )}

          {/* View Full Recipe */}
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onClose();
                window.open(recipeUrl, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Recipe
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
