
import React, { useState } from 'react';
import SwipeCard from '@/components/SwipeCard';
import MatchScreen from '@/components/MatchScreen';
import UserIndicator from '@/components/UserIndicator';
import RoomEntry from '@/components/RoomEntry';
import RoomStatus from '@/components/RoomStatus';
import { Show, SwipeData, Room } from '@/types/show';
import { mockShows } from '@/data/mockShows';

const Index: React.FC = () => {
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [matchedShow, setMatchedShow] = useState<Show | null>(null);

  const currentShow = mockShows[currentShowIndex];

  const handleJoinRoom = (roomCode: string, username: string) => {
    console.log(`Creating/joining room ${roomCode} with user ${username}`);
    // In a real app, this would connect to a backend
    // For now, we'll simulate room creation/joining
    const newRoom: Room = {
      code: roomCode,
      users: [username], // In real app, this would be fetched from server
      swipes: []
    };
    
    setRoom(newRoom);
    setCurrentUser(username);
    console.log('Room created:', newRoom);
    console.log('Current user set:', username);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentShow || !room) {
      console.log('Cannot swipe: missing show or room', { currentShow, room });
      return;
    }

    console.log(`Processing swipe: ${direction} by ${currentUser} on ${currentShow.title}`);

    const swipeData: SwipeData = {
      showId: currentShow.id,
      direction,
      user: currentUser
    };

    const newSwipes = [...room.swipes, swipeData];
    const updatedRoom = {
      ...room,
      swipes: newSwipes
    };
    
    setRoom(updatedRoom);
    console.log('Updated swipes:', newSwipes);

    // Check if all users in the room have swiped right on this show
    if (direction === 'right') {
      const rightSwipesForShow = newSwipes.filter(
        swipe => swipe.showId === currentShow.id && swipe.direction === 'right'
      );
      
      const usersWhoSwipedRight = new Set(
        rightSwipesForShow.map(swipe => swipe.user)
      );

      console.log(`Users who swiped right on ${currentShow.title}:`, Array.from(usersWhoSwipedRight));
      console.log(`Total users in room: ${room.users.length}`);

      // If all users in the room have swiped right on this show, it's a match!
      if (usersWhoSwipedRight.size === room.users.length) {
        console.log('MATCH FOUND!', currentShow.title);
        setMatchedShow(currentShow);
        return;
      }
    }

    // Check if current user has swiped on this show, if so move to next
    const currentUserSwipesForShow = newSwipes.filter(
      swipe => swipe.showId === currentShow.id && swipe.user === currentUser
    );

    if (currentUserSwipesForShow.length > 0) {
      console.log('Moving to next show');
      setCurrentShowIndex(prev => prev + 1);
    }
  };

  const resetApp = () => {
    console.log('Resetting app');
    setCurrentShowIndex(0);
    setRoom(null);
    setCurrentUser('');
    setMatchedShow(null);
  };

  const leaveRoom = () => {
    console.log('Leaving room');
    setRoom(null);
    setCurrentUser('');
    setMatchedShow(null);
    setCurrentShowIndex(0);
  };

  // Show room entry if not in a room
  if (!room) {
    console.log('Showing room entry screen');
    return <RoomEntry onJoinRoom={handleJoinRoom} />;
  }

  // Show match screen if there's a match
  if (matchedShow) {
    console.log('Showing match screen for:', matchedShow.title);
    return <MatchScreen show={matchedShow} onReset={resetApp} />;
  }

  // Show end screen if no more shows
  if (currentShowIndex >= mockShows.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-4">No more shows!</h2>
          <p className="text-xl mb-6">You've gone through all available shows without finding a match.</p>
          <div className="space-y-3">
            <button
              onClick={resetApp}
              className="block w-full bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={leaveRoom}
              className="block w-full bg-white/20 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/30 transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('Showing swipe screen for room:', room.code, 'user:', currentUser);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <RoomStatus roomCode={room.code} users={room.users} currentUser={currentUser} />
        
        <UserIndicator 
          currentUser={currentUser} 
          allSwipes={room.swipes}
          roomUsers={room.users}
        />
        
        <div className="mt-8">
          <SwipeCard 
            show={currentShow} 
            onSwipe={handleSwipe}
            currentUser={currentUser}
          />
        </div>
        
        <div className="mt-6 text-center text-white/80">
          <p className="text-sm">
            Show {currentShowIndex + 1} of {mockShows.length}
          </p>
          <button
            onClick={leaveRoom}
            className="text-xs text-white/60 hover:text-white/80 mt-2 underline"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
