import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Plus, LogIn } from "lucide-react";

interface RoomEntryProps {
  onJoinRoom: (roomCode: string, username: string) => void;
  isConnecting?: boolean;
}

const RoomEntry: React.FC<RoomEntryProps> = ({
  onJoinRoom,
  isConnecting = false,
}) => {
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const generateRoomCode = async () => {
    try {
      setError(null);
      setConnectionStatus("Creating room...");

      if (!username.trim()) {
        setError("Please enter your name");
        setConnectionStatus(null);
        return;
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomCode(code);
      setIsCreating(true);

      // Wait a moment before joining to ensure socket is ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setConnectionStatus("Connecting to room...");
      await onJoinRoom(code, username.trim());
    } catch (error) {
      console.error("Error creating room:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create room"
      );
      setIsCreating(false);
      setConnectionStatus(null);
    }
  };

  const handleJoinRoom = async () => {
    try {
      setError(null);
      setConnectionStatus("Connecting to room...");

      if (!username.trim()) {
        setError("Please enter your name");
        setConnectionStatus(null);
        return;
      }
      if (!roomCode.trim()) {
        setError("Please enter a room code");
        setConnectionStatus(null);
        return;
      }
      if (roomCode.trim().length !== 6) {
        setError("Room code must be 6 characters");
        setConnectionStatus(null);
        return;
      }

      await onJoinRoom(roomCode.trim().toUpperCase(), username.trim());
    } catch (error) {
      console.error("Error joining room:", error);
      setError(error instanceof Error ? error.message : "Failed to join room");
      setConnectionStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            🍿 Show Match
          </CardTitle>
          <CardDescription>
            Create or join a room to find shows to watch together
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-gray-700"
            >
              Your Name
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              className="w-full"
              disabled={isConnecting || isCreating}
            />
          </div>

          <div className="space-y-4">
            <Button
              onClick={generateRoomCode}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              disabled={!username.trim() || isCreating || isConnecting}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? "Creating Room..." : "Create New Room"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="roomCode"
                className="text-sm font-medium text-gray-700"
              >
                Room Code
              </label>
              <Input
                id="roomCode"
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                className="w-full uppercase"
                maxLength={6}
                disabled={isCreating || isConnecting}
              />
            </div>

            <Button
              onClick={handleJoinRoom}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={
                !roomCode.trim() ||
                !username.trim() ||
                isCreating ||
                isConnecting
              }
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isConnecting ? "Joining Room..." : "Join Room"}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-sm text-red-800 font-medium">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setConnectionStatus(null);
                  setIsCreating(false);
                }}
                className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
              >
                Try Again
              </button>
            </div>
          )}

          {connectionStatus && !error && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-800 font-medium">
                {connectionStatus}
              </p>
              {isCreating && roomCode && (
                <p className="text-xs text-blue-600 mt-1">
                  Room code:{" "}
                  <span className="font-mono font-bold">{roomCode}</span>
                </p>
              )}
            </div>
          )}

          {isCreating && roomCode && !error && !connectionStatus && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-800 font-medium">
                Room Created!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Room code:{" "}
                <span className="font-mono font-bold">{roomCode}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomEntry;
