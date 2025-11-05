// src/components/dashboard/TodayActivity.jsx
import React from 'react';
import Card from '../ui/Card';
import { Trophy, Book, Upload, Zap } from 'lucide-react';

const TodayActivity = ({ activities }) => {
  const getActivityIcon = (action) => {
    switch(action) {
      case 'won_battle': return <Trophy className="h-4 w-4 text-[#00FFA3]" />;
      case 'completed_quiz': return <Book className="h-4 w-4 text-[#0082FB]" />;
      case 'studied': return <Book className="h-4 w-4 text-[#FF9F5B]" />;
      case 'uploaded_notes': return <Upload className="h-4 w-4 text-[#FF4D6D]" />;
      default: return <Zap className="h-4 w-4 text-[#A0A0B8]" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-xl flex items-center justify-center">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Today's Activity</h3>
          <p className="text-sm text-[#A0A0B8">Your daily progress</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-4 bg-[#0D0D14] border border-[#2A2A3D] rounded-xl hover:border-[#0082FB]/30 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#2A2A3D] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                {getActivityIcon(activity.action)}
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {activity.action === 'won_battle' && `Won ${activity.details || 'a battle'}`}
                  {activity.action === 'completed_quiz' && `Completed ${activity.topic} quiz`}
                  {activity.action === 'studied' && `Studied ${activity.topic}`}
                  {activity.action === 'uploaded_notes' && `Uploaded notes`}
                </div>
                <div className="text-xs text-[#A0A0B8] mt-1">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {activity.fastest && (
                <div className="text-xs bg-[#00FFA3]/20 text-[#00FFA3] px-2 py-1 rounded-full flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>{activity.fastest}s</span>
                </div>
              )}
              <div className="text-sm font-semibold text-[#FF9F5B]">
                +{activity.coins_earned}
              </div>
            </div>
          </div>
        ))}
        
        {activities.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#2A2A3D] rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-[#A0A0B8]" />
            </div>
            <p className="text-[#A0A0B8] text-sm">No activities today</p>
            <p className="text-[#A0A0B8] text-xs mt-1">Start learning to see your progress!</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TodayActivity;