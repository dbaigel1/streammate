import React from "react";
import { Room, User } from "../../server/src/types/index.js";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

interface RoomStatusProps {
  room: Room;
  currentUser: User;
}

export default function RoomStatus({ room, currentUser }: RoomStatusProps) {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">
            Room Code:{" "}
            <span className="font-mono font-bold text-purple-700">
              {room.code}
            </span>
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            {room.users.length} {room.users.length === 1 ? "User" : "Users"}{" "}
            Online
          </span>
        </div>
      </div>
    </Card>
  );
}
