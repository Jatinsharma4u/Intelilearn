// src/components/dashboard/LeaderboardCard.jsx
import React from 'react';
import Card from '../ui/Card';
import { Globe, Users, Crown } from 'lucide-react';

const LeaderboardCard = ({ leaderboard }) => {
  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#00FFA3] to-[#00CC83] rounded-xl flex items-center justify-center">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
          <p className="text-sm text-[#A0A0B8]">Your rankings</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-[#0D0D14] border border-[#2A2A3D] rounded-xl hover:border-[#0082FB]/30 transition-all duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Global Rank</div>
              <div className="text-xs text-[#A0A0B8]">Among all users</div>
            </div>
          </div>
          <div className="text-lg font-bold text-white">#{leaderboard.global_rank || "N/A"}</div>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-[#0D0D14] border border-[#2A2A3D] rounded-xl hover:border-[#0082FB]/30 transition-all duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF9F5B] to-[#FFA45B] rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Friends Rank</div>
              <div className="text-xs text-[#A0A0B8]">Among your friends</div>
            </div>
          </div>
          <div className="text-lg font-bold text-white">#{leaderboard.friends_rank || "N/A"}</div>
        </div>
        
        <div className="text-xs text-[#A0A0B8] text-center pt-2">
          Updated: {leaderboard.last_updated ? 
            new Date(leaderboard.last_updated).toLocaleDateString() : 
            "Never"}
        </div>
      </div>
    </Card>
  );
};

export default LeaderboardCard;