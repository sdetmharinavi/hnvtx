// components/common/ui/HtmlContent.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface HtmlContentProps {
  content: string | null | undefined;
  className?: string;
}

export const HtmlContent: React.FC<HtmlContentProps> = ({ content, className }) => {
  if (!content) return <span className="text-gray-400 italic">No description</span>;

  return (
    <div 
      className={cn("prose dark:prose-invert prose-sm max-w-none leading-snug", className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};