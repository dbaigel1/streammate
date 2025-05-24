
import React, { useState } from 'react';
import SwipeCard from '@/components/SwipeCard';
import MatchScreen from '@/components/MatchScreen';
import UserIndicator from '@/components/UserIndicator';
import { Show, SwipeData } from '@/types/show';
import { mockShows } from '@/data/mockShows';

const Index = () => {
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [userASwipes, setUserASwipes] = useState<SwipeData[]>([]);
  const [userBSwipes, setUserBSwipes] = useState<SwipeData[]>([]);
  const [currentUser, setCurrentUser] = useState<'A' | 'B'>('A');
  const [matchedShow, setMatchedShow] = useState<Show | null>(null);

  const currentShow = mockShows[currentShowIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentShow) return;

    const swipeData: SwipeData = {
      showId: currentShow.id,
      direction,
      user: currentUser
    };

    if (currentUser === 'A') {
      const newUserASwipes = [...userASwipes, swipeData];
      setUserASwipes(newUserASwipes);
      
      // Check if User B has already swiped on this show
      const userBSwipe = userBSwipes.find(swipe => swipe.showId === currentShow.id);
      
      if (userBSwipe && userBSwipe.direction === 'right' && direction === 'right') {
        setMatchedShow(currentShow);
        return;
      }
      
      setCurrentUser('B');
    } else {
      const newUserBSwipes = [...userBSwipes, swipeData];
      setUserBSwipes(newUserBSwipes);
      
      // Check if User A has already swiped on this show
      const userASwipe = userASwipes.find(swipe => swipe.showId === currentShow.id);
      
      if (userASwipe && userASwipe.direction === 'right' && direction === 'right') {
        setMatchedShow(currentShow);
        return;
      }
      
      // Move to next show after both users have swiped
      setCurrentShowIndex(prev => prev + 1);
      setCurrentUser('A');
    }
  };

  const resetApp = () => {
    setCurrentShowIndex(0);
    setUserASwipes([]);
    setUserBSwipes([]);
    setCurrentUser('A');
    setMatchedShow(null);
  };

  if (matchedShow) {
    return <MatchScreen show={matchedShow} onReset={resetApp} />;
  }

  if (currentShowIndex >= mockShows.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-4">No more shows!</h2>
          <p className="text-xl mb-6">You've gone through all available shows without finding a match.</p>
          <button
            onClick={resetApp}
            className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <UserIndicator currentUser={currentUser} userASwipes={userASwipes} userBSwipes={userBSwipes} />
        
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
        </div>
      </div>
    </div>
  );
};

export default Index;
