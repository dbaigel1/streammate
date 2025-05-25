import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Room, User } from "../../server/src/types/index.js";
import { socketService } from "@/services/socket";

interface RoomEntryProps {
  isConnecting: boolean;
}

export default function RoomEntry({ isConnecting }: RoomEntryProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  useEffect(() => {
    // Set up socket event listener for roomJoined
    const socket = socketService.getSocket();

    const handleRoomJoined = (data: { room: Room; user: User }) => {
      console.log("Room joined event received:", data);
      navigate("/swipe", {
        state: {
          room: data.room,
          user: data.user,
          isHost: false,
        },
      });
    };

    socket?.on("roomJoined", handleRoomJoined);

    return () => {
      socket?.off("roomJoined", handleRoomJoined);
    };
  }, [navigate]);

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    try {
      console.log("Create room button clicked with username:", username);
      setIsJoining(true);
      setError("");

      const socket = socketService.getSocket();
      console.log("Socket status before create room:", {
        connected: socket?.connected,
        id: socket?.id,
        transport: socket?.io?.engine?.transport?.name,
      });

      socket?.emit(
        "createRoom",
        { username },
        (response: { room: Room; user: User } | { error: string }) => {
          console.log("Create room response received:", response);
          if ("error" in response) {
            console.error("Error in create room response:", response.error);
            setError(response.error);
          } else {
            console.log("Room created successfully:", {
              roomCode: response.room.code,
              userId: response.user.id,
              username: response.user.username,
            });
            navigate("/swipe", {
              state: {
                room: response.room,
                user: response.user,
                isHost: true,
              },
            });
          }
          setIsJoining(false);
        }
      );

      // Add a timeout to handle cases where the callback isn't called
      setTimeout(() => {
        if (isJoining) {
          console.error("Create room timeout - no response received");
          setError("Failed to create room - no response from server");
          setIsJoining(false);
        }
      }, 5000);
    } catch (err) {
      console.error("Error in handleCreateRoom:", err);
      setError("Failed to create room. Please try again.");
      setIsJoining(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim() || !roomCode.trim()) {
      setError("Please enter both username and room code");
      return;
    }

    try {
      console.log("Attempting to join room:", { username, roomCode });
      setIsJoining(true);
      setError("");

      const socket = socketService.getSocket();
      console.log(
        "Socket instance:",
        socket?.connected ? "connected" : "disconnected"
      );

      socket?.emit("joinRoom", { username, roomCode }, (error?: string) => {
        console.log("Join room response:", error);
        if (error) {
          setError(error);
          setIsJoining(false);
        }
        // Note: We don't set isJoining to false here because we're waiting for the roomJoined event
        // which will trigger navigation
      });
    } catch (err) {
      console.error("Error joining room:", err);
      setError("Failed to join room. Please try again.");
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
