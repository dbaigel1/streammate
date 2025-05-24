import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";

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
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Debug logging for state changes
  useEffect(() => {
    console.log("RoomEntry state:", {
      isConnecting,
      isCreating,
      hasRoomCode: !!roomCode.trim(),
      hasUsername: !!username.trim(),
      isButtonDisabled,
      activeTab,
    });
  }, [
    isConnecting,
    isCreating,
    roomCode,
    username,
    isButtonDisabled,
    activeTab,
  ]);

  const generateRoomCode = async () => {
    try {
      setError(null);
      setConnectionStatus("Creating room...");
      setIsButtonDisabled(true);

      if (!username.trim()) {
        setError("Please enter your name");
        setConnectionStatus(null);
        setIsButtonDisabled(false);
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
      setIsButtonDisabled(false);
    }
  };

  const handleJoinRoom = async () => {
    try {
      setError(null);
      setConnectionStatus("Connecting to room...");
      setIsButtonDisabled(true);

      if (!username.trim()) {
        setError("Please enter your name");
        setConnectionStatus(null);
        setIsButtonDisabled(false);
        return;
      }
      if (!roomCode.trim()) {
        setError("Please enter a room code");
        setConnectionStatus(null);
        setIsButtonDisabled(false);
        return;
      }
      if (roomCode.trim().length !== 6) {
        setError("Room code must be 6 characters");
        setConnectionStatus(null);
        setIsButtonDisabled(false);
        return;
      }

      await onJoinRoom(roomCode.trim().toUpperCase(), username.trim());
    } catch (error) {
      console.error("Error joining room:", error);
      setError(error instanceof Error ? error.message : "Failed to join room");
      setConnectionStatus(null);
      setIsButtonDisabled(false);
    }
  };

  // Reset button state when inputs change
  useEffect(() => {
    if (error || connectionStatus) {
      setIsButtonDisabled(false);
    }
  }, [error, connectionStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Streammate</h1>
            <p className="text-gray-600 mt-2">
              Find your next binge-worthy show together
            </p>
          </div>

          {/* Username Input - Always visible at the top */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-700 font-medium">
              Your Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
              disabled={isConnecting || isCreating}
            />
            {!username.trim() && (
              <p className="text-sm text-red-500 mt-1">
                Please enter your name to continue
              </p>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-2 text-center font-medium transition-colors ${
                activeTab === "create"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 py-2 text-center font-medium transition-colors ${
                activeTab === "join"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Join Room
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {activeTab === "create" ? (
            // Create Room Tab
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">
                  Create a New Room
                </h3>
                <p className="text-sm text-purple-700">
                  Start a new room and invite friends to join. You'll get a
                  unique room code to share.
                </p>
              </div>

              <Button
                onClick={generateRoomCode}
                className={`w-full ${
                  isButtonDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-500 hover:bg-purple-600"
                } text-white`}
                disabled={!username.trim() || isButtonDisabled}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreating ? "Creating Room..." : "Create New Room"}
              </Button>
            </div>
          ) : (
            // Join Room Tab
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Join a Room</h3>
                <p className="text-sm text-blue-700">
                  Enter the 6-character room code to join an existing room.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomCode" className="text-gray-700 font-medium">
                  Room Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="roomCode"
                  type="text"
                  placeholder="Enter 6-character room code"
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  className="w-full font-mono text-center text-lg tracking-wider"
                  disabled={isConnecting || isCreating}
                  maxLength={6}
                />
                {roomCode.length > 0 && roomCode.length !== 6 && (
                  <p className="text-sm text-red-500 mt-1">
                    Room code must be 6 characters
                  </p>
                )}
              </div>

              <Button
                onClick={handleJoinRoom}
                className={`w-full ${
                  isButtonDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
                disabled={
                  !roomCode.trim() ||
                  !username.trim() ||
                  roomCode.length !== 6 ||
                  isButtonDisabled
                }
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isConnecting ? "Joining Room..." : "Join Room"}
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-sm text-red-800 font-medium">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setConnectionStatus(null);
                  setIsCreating(false);
                  setIsButtonDisabled(false);
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
