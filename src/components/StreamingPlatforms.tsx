import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface StreamingPlatformsProps {
  selectedPlatform: "netflix" | "hulu";
  onPlatformChange: (platform: "netflix" | "hulu") => void;
}

interface StreamingPlatform {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  color: string;
}

const platforms: StreamingPlatform[] = [
  {
    id: "netflix",
    name: "Netflix",
    icon: "🎬",
    available: true,
    color: "bg-red-600 hover:bg-red-700 text-white",
  },
  {
    id: "hulu",
    name: "Hulu",
    icon: "🟢",
    available: true,
    color: "bg-green-600 hover:bg-green-700 text-white",
  },
  {
    id: "hbo",
    name: "HBO Max",
    icon: "⚫",
    available: false,
    color: "bg-blue-800 hover:bg-blue-900 text-white border-blue-800",
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    icon: "🍊",
    available: false,
    color: "bg-orange-500 hover:bg-orange-600 text-white border-orange-500",
  },
];

export default function StreamingPlatforms({
  selectedPlatform,
  onPlatformChange,
}: StreamingPlatformsProps) {
  const handlePlatformClick = (platform: StreamingPlatform) => {
    if (!platform.available) {
      toast("Coming soon! 🚀", {
        duration: 2000,
        position: "bottom-center",
        style: {
          background: "#6B7280",
          color: "white",
          fontSize: "0.9rem",
          padding: "0.5rem 1rem",
        },
      });
      return;
    }

    // Toggle between Netflix and Hulu
    if (platform.id === "netflix" || platform.id === "hulu") {
      const newPlatform = platform.id as "netflix" | "hulu";
      onPlatformChange(newPlatform);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Available Streaming Platforms
      </h3>
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <Button
            key={platform.id}
            variant={platform.available ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-2 transition-all duration-200 ${
              platform.available
                ? platform.id === selectedPlatform
                  ? platform.color
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                : `${platform.color} cursor-not-allowed`
            }`}
            onClick={() => handlePlatformClick(platform)}
            disabled={!platform.available}
          >
            <span className="text-lg">{platform.icon}</span>
            <span className="text-xs font-medium">{platform.name}</span>
            {platform.available && platform.id === selectedPlatform && (
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                Active
              </span>
            )}
          </Button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        More platforms coming soon! Currently showing{" "}
        {selectedPlatform === "netflix" ? "Netflix" : "Hulu"} content.
      </p>
    </div>
  );
}
