
import React from 'react';
import { Show } from '@/types/show';
import { Heart, RotateCcw, Star } from 'lucide-react';

interface MatchScreenProps {
  show: Show;
  onReset: () => void;
}

const MatchScreen: React.FC<MatchScreenProps> = ({ show, onReset }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-red-500 to-purple-600 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="animate-bounce mb-8">
          <Heart className="w-24 h-24 text-white mx-auto fill-current" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4 animate-pulse">
          It's a Match!
        </h1>
        
        <p className="text-xl text-white/90 mb-8">
          You both want to watch:
        </p>
        
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8 transform scale-105">
          <div className="relative">
            <img
              src={show.poster}
              alt={show.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-white text-sm font-medium">{show.rating}</span>
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{show.title}</h2>
            <p className="text-gray-600 mb-4">{show.year} • {show.type.toUpperCase()}</p>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {show.genre.map((genre, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-white/80 text-lg">
            🍿 Time to grab some snacks and enjoy the show!
          </p>
          
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Find Another Match
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchScreen;
