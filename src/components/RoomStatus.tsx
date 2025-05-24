import React from "react";
import { Users, Crown } from "lucide-react";
import { User } from "../../server/src/types/index.js";

interface RoomStatusProps {
  roomCode: string;
  users: User[];
  currentUser: string;
}

const RoomStatus: React.FC<RoomStatusProps> = ({
  roomCode,
  users,
  currentUser,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-white" />
          <span className="text-white font-medium">Room: {roomCode}</span>
        </div>
        <span className="text-white/80 text-sm">{users.length} users</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`
              flex items-center gap-1 px-3 py-1 rounded-full text-sm
              ${
                user.username === currentUser
                  ? "bg-white text-purple-600"
                  : "bg-white/20 text-white"
              }
            `}
          >
            {index === 0 && <Crown className="w-3 h-3" />}
            {user.username}
            {user.username === currentUser && (
              <span className="text-xs">(You)</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomStatus;
