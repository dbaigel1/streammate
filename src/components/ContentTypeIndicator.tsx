import React from "react";
import { Badge } from "@/components/ui/badge";
import { ContentType } from "./ContentTypeSelector";

interface ContentTypeIndicatorProps {
  contentType: ContentType;
}

export default function ContentTypeIndicator({
  contentType,
}: ContentTypeIndicatorProps) {
  const getIcon = () => {
    return contentType === "movies" ? "🎬" : "📺";
  };

  const getColor = () => {
    return contentType === "movies"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  return (
    <Badge variant="outline" className={`${getColor()} text-sm font-medium`}>
      <span className="mr-1">{getIcon()}</span>
      {contentType === "movies" ? "Movies" : "TV Shows"}
    </Badge>
  );
}
