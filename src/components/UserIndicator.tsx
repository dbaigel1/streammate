import React from "react";
import { User } from "../../server/src/types/index.js";
import { Card } from "@/components/ui/card";

interface UserIndicatorProps {
  users: User[];
  currentUser: User;
}

export default function UserIndicator({
  users,
  currentUser,
}: UserIndicatorProps) {
  const getUserColor = (user: User) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    const index = users.findIndex((u) => u.id === user.id);
    return colors[index % colors.length];
  };

  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm">
      <div className="flex flex-wrap gap-2">
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
              user.id === currentUser.id
                ? "ring-2 ring-purple-500"
                : "bg-gray-100"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-medium ${getUserColor(
                user
              )}`}
            >
              {user.username[0].toUpperCase()}
            </div>
            <span
              className={`text-sm font-medium ${
                user.id === currentUser.id ? "text-purple-700" : "text-gray-700"
              }`}
            >
              {user.username}
              {user.id === currentUser.id && " (You)"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
