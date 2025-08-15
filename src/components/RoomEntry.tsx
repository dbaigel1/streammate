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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { socketService } from "@/services/socket";
import ContentTypeSelector, { ContentType } from "./ContentTypeSelector";

interface RoomEntryProps {
  onJoinRoom: (
    roomCode: string,
    username: string,
    contentType?: ContentType
  ) => void;
  isConnecting: boolean;
}

export default function RoomEntry({
  onJoinRoom,
  isConnecting,
}: RoomEntryProps) {
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("");

  const handleCreateRoom = async () => {
    if (!username.trim() || !contentType) {
      setError("Please enter a username and select a content type");
      return;
    }

    console.log("Creating room with:", {
      username: username.trim(),
      contentType,
    });
    setIsCreating(true);
    setError("");
    setConnectionStatus("Creating room...");

    try {
      console.log("Calling socketService.createRoom...");
      const result = await socketService.createRoom(
        username.trim(),
        contentType
      );
      console.log("createRoom result:", result);

      if ("error" in result) {
        console.error("Error creating room:", result.error);
        setError(result.error);
      } else {
        console.log("Room created successfully:", result);
        setConnectionStatus("Room created successfully! Redirecting...");
        onJoinRoom(result.room.code, result.user.username, contentType);
      }
    } catch (error) {
      console.error("Exception in handleCreateRoom:", error);
      setError("Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
      setConnectionStatus("");
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !username.trim()) {
      setError("Please enter a room code and username");
      return;
    }

    setIsJoining(true);
    setError("");
    setConnectionStatus("Joining room...");

    try {
      // For joining, we don't need contentType - it will be provided by the room
      const result = await socketService.joinRoom(
        roomCode.trim().toUpperCase(),
        username.trim(),
        "tv" // Placeholder - will be overridden by room's actual contentType
      );
      if (result.error) {
        setError(result.error);
      } else {
        setConnectionStatus("Joined room successfully! Redirecting...");
        // We'll get the actual contentType from the room when we join
        onJoinRoom(roomCode.trim().toUpperCase(), username.trim());
      }
    } catch (error) {
      setError("Failed to join room. Please try again.");
    } finally {
      setIsJoining(false);
      setConnectionStatus("");
    }
  };

  const handleInputChange = () => {
    setError("");
    setConnectionStatus("");
  };

  const isButtonDisabled =
    isConnecting || isCreating || isJoining || !username.trim();

  const isCreateButtonDisabled = isButtonDisabled || !contentType;

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Streammate</h1>
        <p className="text-lg text-white/90">
          Find your next favorite show together
        </p>
      </div>

      <Card className="mt-6 bg-white/95 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900">Join or Create Room</CardTitle>
          <CardDescription className="text-gray-600">
            Join an existing room or create a new one to start swiping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                handleInputChange();
              }}
              className="w-full"
            />
          </div>

          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join">Join Room</TabsTrigger>
              <TabsTrigger value="create">Create Room</TabsTrigger>
            </TabsList>

            <TabsContent value="join" className="space-y-4">
              <div>
                <label
                  htmlFor="roomCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Room Code
                </label>
                <Input
                  id="roomCode"
                  type="text"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value);
                    handleInputChange();
                  }}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleJoinRoom}
                disabled={isButtonDisabled}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isJoining ? "Joining..." : "Join Room"}
              </Button>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <ContentTypeSelector
                selectedType={contentType}
                onSelect={setContentType}
              />
              <Button
                onClick={handleCreateRoom}
                disabled={isCreateButtonDisabled}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCreating ? "Creating..." : "Create Room"}
              </Button>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}

          {connectionStatus && (
            <div className="text-blue-600 text-sm text-center bg-blue-50 p-3 rounded border border-blue-200">
              {connectionStatus}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
