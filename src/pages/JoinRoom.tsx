import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { socketService } from "@/services/socket";
import { trackUserJoinedRoom, trackCustomEvent } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, ArrowLeft } from "lucide-react";

export default function JoinRoom() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [roomExists, setRoomExists] = useState(true); // Assume room exists initially

  useEffect(() => {
    console.log("JoinRoom component mounted with roomCode:", roomCode);
    console.log("Current URL:", window.location.href);
    console.log("Room code from params:", roomCode);

    if (roomCode) {
      // Skip validation for now - just assume the room exists
      // This will be validated when they actually try to join
      setIsValidating(false);

      // Track that someone accessed a shareable link
      trackCustomEvent("shareable_link_accessed", {
        room_code: roomCode,
        referrer: document.referrer || "direct_link",
      });

      console.log("Successfully set up join room for code:", roomCode);
    } else {
      console.error("No room code found in URL params");
    }
  }, [roomCode]);

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    if (!roomCode) {
      setError("Invalid room code");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      // Track analytics for shareable link access
      trackCustomEvent("shareable_link_join_attempt", {
        room_code: roomCode,
        username: username.trim(),
        join_method: "shareable_link",
      });

      // Navigate directly to home page with join information
      // The home page will handle the actual room joining
      navigate("/", {
        state: {
          joinRoom: true,
          roomCode: roomCode,
          username: username.trim(),
        },
      });
    } catch (error) {
      setError("Failed to process join request. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  // Remove validation checks - just show the join form directly

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
      <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Join Room
          </CardTitle>
          <CardDescription className="text-gray-600">
            You've been invited to join room{" "}
            <span className="font-mono font-bold text-purple-700">
              {roomCode}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
              className="w-full"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handleJoinRoom}
            disabled={isJoining || !username.trim()}
            className="w-full"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Room"
            )}
          </Button>

          <Button variant="outline" onClick={handleGoBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
