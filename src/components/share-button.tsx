"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { ShareModal } from "./share-modal";

interface ShareButtonProps {
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
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ShareButton({ recipe, variant = "outline", size = "sm", className }: ShareButtonProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowShareModal(true)}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        recipe={recipe}
      />
    </>
  );
}
