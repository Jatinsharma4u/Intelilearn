// src/components/dashboard/BadgesDisplay.jsx
import React from 'react';
import Card from '../ui/Card';
import { Award, Trophy, Star } from 'lucide-react';

const BadgesDisplay = ({ badges }) => {
  const getBadgeIcon = (type) => {
    switch(type) {
      case 'gold': return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 'silver': return <Award className="h-5 w-5 text-gray-300" />;
      default: return <Star className="h-5 w-5 text-[#00FFA3]" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#FF9F5B] to-[#FFA45B] rounded-xl flex items-center justify-center">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Recent Badges</h3>
          <p className="text-sm text-[#A0A0B8]">Your achievements</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {badges.slice(0, 3).map((badge, index) => (
          <div 
            key={index} 
            className="flex items-center p-4 bg-[#0D0D14] border border-[#2A2A3D] rounded-xl hover:border-[#0082FB]/30 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              {getBadgeIcon(badge.type)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{badge.name}</div>
              <div className="text-xs text-[#A0A0B8] mt-1">
                Earned {new Date(badge.earned_date).toLocaleDateString()}
              </div>
            </div>
            <div className="text-xs text-[#00FFA3] bg-[#00FFA3]/10 px-2 py-1 rounded-full">
              +{badge.xp} XP
            </div>
          </div>
        ))}
        
        {badges.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#2A2A3D] rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="h-6 w-6 text-[#A0A0B8]" />
            </div>
            <p className="text-[#A0A0B8] text-sm">No badges earned yet</p>
            <p className="text-[#A0A0B8] text-xs mt-1">Complete challenges to earn badges!</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BadgesDisplay;