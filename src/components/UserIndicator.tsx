import React from "react";
import { SwipeData } from "@/types/show";
import { User } from "../../server/src/types/index.js";

interface UserIndicatorProps {
  currentUser: string;
  allSwipes: SwipeData[];
  roomUsers: User[];
}

const UserIndicator: React.FC<UserIndicatorProps> = ({
  currentUser,
  allSwipes,
  roomUsers,
}) => {
  const getUserSwipeCount = (userId: string) => {
    return allSwipes.filter((swipe) => swipe.user === userId).length;
  };

  const getUserColor = (user: User, index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-purple-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex justify-center gap-3 mb-6 flex-wrap">
      {roomUsers.map((user, index) => (
        <div
          key={user.id}
          className={`
            text-center p-3 rounded-xl transition-all duration-300
            ${
              user.username === currentUser
                ? "bg-white/20 scale-105"
                : "bg-white/10"
            }
          `}
        >
          <div
            className={`
            w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm
            ${
              user.username === currentUser
                ? getUserColor(user, index)
                : "bg-gray-400"
            }
          `}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <p className="text-white text-xs font-medium truncate max-w-16">
            {user.username === currentUser ? "You" : user.username}
          </p>
          <p className="text-white/70 text-xs">
            {getUserSwipeCount(user.id)} swipes
          </p>
        </div>
      ))}
    </div>
  );
};

export default UserIndicator;
