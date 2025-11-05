// src/components/dashboard/ProfileCard.jsx
import React from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { useProgress } from '../../contexts/ProgressContext';
import Progress from '../ui/Progress';
import Card from '../ui/Card';
import { User, Star, Coins, Flame } from 'lucide-react';

const ProfileCard = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { progress, loading: progressLoading } = useProgress();

  if (profileLoading || progressLoading) return null;

  const xpPercentage = progress?.total_xp ? (progress.xp / progress.total_xp) * 100 : 0;

  const stats = [
    { 
      icon: Star, 
      label: 'XP', 
      value: `${progress?.xp || 0}`,
      total: `/${progress?.total_xp || 100}`,
      color: 'text-[#0082FB]'
    },
    { 
      icon: Coins, 
      label: 'Coins', 
      value: progress?.coins || 0,
      total: '',
      color: 'text-[#FF9F5B]'
    },
    { 
      icon: Flame, 
      label: 'Streak', 
      value: progress?.daily_streak || 0,
      total: ' days',
      color: 'text-[#FF4D6D]'
    }
  ];

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Profile Info - Mobile Stacked */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Avatar */}
          <div className="flex justify-center sm:justify-start">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-[#0082FB] to-[#0064EO] rounded-2xl flex items-center justify-center overflow-hidden border-2 border-[#0082FB]">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile?.fullName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#00FFA3] rounded-full border-2 border-[#1B1B28] flex items-center justify-center">
                <span className="text-[8px] sm:text-[10px] text-[#1B1B28] font-bold">
                  {progress?.level || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                {profile?.fullName || 'User'}
              </h2>
              <p className="text-xs sm:text-sm text-[#A0A0B8]">
                {profile?.course || 'Computer Science'} • {profile?.bio || 'Passionate Learner'}
              </p>
            </div>
            
            {/* Stats - Grid for Mobile, Flex for Desktop */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:space-x-4 max-w-md mx-auto sm:mx-0">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-1 text-center sm:text-left"
                  >
                    <div className="flex items-center justify-center sm:justify-start space-x-1">
                      <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                      <span className="text-white text-xs sm:text-sm font-medium">
                        {stat.value}
                        <span className="text-[#A0A0B8]">{stat.total}</span>
                      </span>
                    </div>
                    <span className="text-[#A0A0B8] text-xs hidden sm:block">{stat.label}</span>
                    <span className="text-[#A0A0B8] text-xs sm:hidden">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Progress - Full width on mobile */}
        <div className="w-full sm:w-64 lg:w-80">
          <div className="flex justify-between text-xs sm:text-sm text-[#A0A0B8] mb-2">
            <span>Level {progress?.level || 0}</span>
            <span className="text-[#00FFA3]">{progress?.level_name || 'Beginner'}</span>
            <span>Level {progress?.level + 1 || 1}</span>
          </div>
          
          <Progress progress={xpPercentage} />
          
          <div className="text-center text-xs text-[#A0A0B8] mt-2">
            {Math.round(xpPercentage)}% to next level
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCard;