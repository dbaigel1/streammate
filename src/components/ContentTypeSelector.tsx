import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ContentType = "movies" | "tv";

interface ContentTypeSelectorProps {
  selectedType: ContentType | null;
  onSelect: (type: ContentType) => void;
}

export default function ContentTypeSelector({
  selectedType,
  onSelect,
}: ContentTypeSelectorProps) {
  return (
    <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Choose Content Type
        </CardTitle>
        <CardDescription className="text-gray-600">
          Select what type of content you want to swipe through
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant={selectedType === "movies" ? "default" : "outline"}
          className={`w-full h-24 text-lg transition-all duration-200 ${
            selectedType === "movies"
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              : "hover:bg-blue-50 border-blue-200 bg-white"
          }`}
          onClick={() => onSelect("movies")}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">🎬</span>
            <span className="font-semibold text-base">Movies</span>
            <span className="text-xs opacity-80 text-center leading-tight">
              Feature films & documentaries
            </span>
          </div>
        </Button>

        <Button
          variant={selectedType === "tv" ? "default" : "outline"}
          className={`w-full h-24 text-lg transition-all duration-200 ${
            selectedType === "tv"
              ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
              : "hover:bg-purple-50 border-purple-200 bg-white"
          }`}
          onClick={() => onSelect("tv")}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">📺</span>
            <span className="font-semibold text-base">TV Shows</span>
            <span className="text-xs opacity-80 text-center leading-tight">
              Series & episodes
            </span>
          </div>
        </Button>

        {selectedType && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              Selected:{" "}
              <span className="font-semibold capitalize">{selectedType}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
