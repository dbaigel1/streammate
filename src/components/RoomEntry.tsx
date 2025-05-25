import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { socket } from "../services/socket";
import { Loader2 } from "lucide-react";

interface RoomEntryProps {
  isConnecting: boolean;
}

export default function RoomEntry({ isConnecting }: RoomEntryProps) {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      socket.emit("createRoom", { username });
    } catch (error) {
      console.error("Error creating room:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create room"
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      socket.emit("joinRoom", { roomCode, username });
    } catch (error) {
      console.error("Error joining room:", error);
      setError(error instanceof Error ? error.message : "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Streammate
          </h1>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full"
                disabled={isJoining || isConnecting}
              />
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "create" | "join")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create Room</TabsTrigger>
                <TabsTrigger value="join">Join Room</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Create a new room and share the code with your friends to
                    start matching shows together!
                  </p>
                </div>
                <Button
                  onClick={handleCreateRoom}
                  className="w-full"
                  disabled={isJoining || isConnecting}
                >
                  {isJoining || isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Room...
                    </>
                  ) : (
                    "Create Room"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="join" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomCode" className="text-gray-700">
                    Room Code
                  </Label>
                  <Input
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    className="w-full"
                    disabled={isJoining || isConnecting}
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Enter the room code shared by your friend to join their room
                    and start matching shows together!
                  </p>
                </div>
                <Button
                  onClick={handleJoinRoom}
                  className="w-full"
                  disabled={isJoining || isConnecting}
                >
                  {isJoining || isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining Room...
                    </>
                  ) : (
                    "Join Room"
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {(isJoining || isConnecting) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  {isConnecting
                    ? "Connecting to server..."
                    : "Joining room, please wait..."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
