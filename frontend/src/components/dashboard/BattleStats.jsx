// src/components/dashboard/BattleStats.jsx
import React from 'react';
import Card from '../ui/Card';
import { Target, Clock, Zap, TrendingUp } from 'lucide-react';

const BattleStats = ({ stats }) => {
  const statItems = [
    {
      icon: Target,
      label: 'Battles Won',
      value: `${stats.battles_won}/${stats.battles_played}`,
      color: 'text-[#0082FB]'
    },
    {
      icon: Clock,
      label: 'Avg Time',
      value: `${stats.avg_answer_time}s`,
      color: 'text-[#00FFA3]'
    },
    {
      icon: TrendingUp,
      label: 'Accuracy',
      value: `${stats.accuracy}%`,
      color: 'text-[#FF9F5B]'
    },
    {
      icon: Zap,
      label: 'Fastest Answer',
      value: `${stats.fastest_answer}s`,
      color: 'text-[#FF4D6D]'
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#FF4D6D] to-[#FF6B8B] rounded-xl flex items-center justify-center">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Battle Stats</h3>
          <p className="text-sm text-[#A0A0B8]">Your performance</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={index}
              className="bg-[#0D0D14] border border-[#2A2A3D] rounded-xl p-4 text-center hover:border-[#0082FB]/30 transition-all duration-200"
            >
              <Icon className={`h-6 w-6 mx-auto mb-2 ${item.color}`} />
              <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
              <div className="text-xs text-[#A0A0B8]">{item.label}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default BattleStats;