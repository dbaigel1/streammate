
import React, { useState } from 'react';
import { Show } from '@/types/show';
import { Star, Calendar, Tag } from 'lucide-react';

interface SwipeCardProps {
  show: Show;
  onSwipe: (direction: 'left' | 'right') => void;
  currentUser: 'A' | 'B';
}

const SwipeCard: React.FC<SwipeCardProps> = ({ show, onSwipe, currentUser }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('left');

  const handleSwipe = (direction: 'left' | 'right') => {
    setAnimationDirection(direction);
    setIsAnimating(true);
    
    setTimeout(() => {
      onSwipe(direction);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="relative">
      <div 
        className={`
          relative w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300
          ${isAnimating ? (animationDirection === 'right' ? 'translate-x-full rotate-12' : '-translate-x-full -rotate-12') : ''}
          ${isAnimating ? 'opacity-0' : 'opacity-100'}
        `}
      >
        <div className="relative h-96">
          <img
            src={show.poster}
            alt={show.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full">
            <span className="text-white text-sm font-medium uppercase">
              {show.type}
            </span>
          </div>
          
          <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-white text-sm font-medium">{show.rating}</span>
          </div>
        </div>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{show.title}</h2>
          
          <div className="flex items-center gap-4 mb-3 text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{show.year}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {show.genre.map((genre, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
              >
                <Tag className="w-3 h-3" />
                {genre}
              </span>
            ))}
          </div>
          
          <p className="text-gray-700 text-sm leading-relaxed mb-6">
            {show.description}
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={() => handleSwipe('left')}
              disabled={isAnimating}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pass
            </button>
            <button
              onClick={() => handleSwipe('right')}
              disabled={isAnimating}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Like
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;
