
import React from 'react';
import { SwipeData } from '@/types/show';

interface UserIndicatorProps {
  currentUser: 'A' | 'B';
  userASwipes: SwipeData[];
  userBSwipes: SwipeData[];
}

const UserIndicator: React.FC<UserIndicatorProps> = ({ currentUser, userASwipes, userBSwipes }) => {
  return (
    <div className="flex justify-center gap-8 mb-6">
      <div className={`
        text-center p-4 rounded-xl transition-all duration-300
        ${currentUser === 'A' ? 'bg-white/20 scale-105' : 'bg-white/10'}
      `}>
        <div className={`
          w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl
          ${currentUser === 'A' ? 'bg-blue-500' : 'bg-gray-400'}
        `}>
          A
        </div>
        <p className="text-white text-sm font-medium">User A</p>
        <p className="text-white/70 text-xs">{userASwipes.length} swipes</p>
      </div>
      
      <div className={`
        text-center p-4 rounded-xl transition-all duration-300
        ${currentUser === 'B' ? 'bg-white/20 scale-105' : 'bg-white/10'}
      `}>
        <div className={`
          w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl
          ${currentUser === 'B' ? 'bg-pink-500' : 'bg-gray-400'}
        `}>
          B
        </div>
        <p className="text-white text-sm font-medium">User B</p>
        <p className="text-white/70 text-xs">{userBSwipes.length} swipes</p>
      </div>
    </div>
  );
};

export default UserIndicator;
