// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/MainLayout";
import ProfileGuard from '../components/profile/ProfileGuard';
import { useAuth } from "../contexts/AuthContext";
import { useProgress } from "../contexts/ProgressContext";
import { motion } from "framer-motion";

// Import our new components
import ProfileCard from "../components/dashboard/ProfileCard";
import BattleStats from "../components/dashboard/BattleStats";
import BadgesDisplay from "../components/dashboard/BadgesDisplay";
import TodayActivity from "../components/dashboard/TodayActivity";
import LeaderboardCard from "../components/dashboard/LeaderboardCard";

import {
  BookOpen,
  Trophy,
  Target,
  Flame,
  Brain,
  Users,
  Award,
  BookMarked,
  Zap,
  GraduationCap,
  ArrowRight,
  Rocket,
  Star,
  TrendingUp,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { progress, loading: progressLoading } = useProgress();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const quickActions = [
    {
      id: 1,
      title: "Quick Quiz",
      description: "5-min challenge",
      icon: Zap,
      color: "#0082FB",
      action: () => navigate("/ai-pack"),
    },
    {
      id: 2,
      title: "AI Notes",
      description: "Upload & learn",
      icon: BookMarked,
      color: "#00FFA3",
      action: () => navigate("/ai-pack"),
    },
    {
      id: 3,
      title: "AI Mentor",
      description: "Learn smart",
      icon: GraduationCap,
      color: "#FF9F5B",
      action: () => navigate("/mentor"),
    },
    {
      id: 4,
      title: "Weakness Test",
      description: "Find weak areas",
      icon: Brain,
      color: "#FF4D6D",
      action: () => navigate("/weakness"),
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading || progressLoading || !progress) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2A2A3D] border-t-[#0082FB]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <ProfileGuard>
      <Layout>
        <div className="p-4 space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ProfileCard />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.action}
                    className="bg-[#1B1B28] border border-[#2A2A3D] p-4 rounded-xl text-left group hover:border-[#0082FB]/40 transition-all duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="p-2 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${action.color}15` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: action.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white mb-1 truncate">
                          {action.title}
                        </h3>
                        <p className="text-xs text-[#A0A0B8]">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Left Column - Stats & Activity */}
            <div className="xl:col-span-3 space-y-6">
              {/* Stats Overview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {[
                  { 
                    icon: BookOpen, 
                    label: "Courses", 
                    value: progress.stats?.courses_completed || 0, 
                    color: "#0082FB" 
                  },
                  { 
                    icon: Trophy, 
                    label: "Battles Won", 
                    value: progress.battle_stats?.battles_won || 0, 
                    color: "#00FFA3" 
                  },
                  { 
                    icon: TrendingUp, 
                    label: "Total XP", 
                    value: progress.total_xp || 0, 
                    color: "#FF9F5B" 
                  },
                  { 
                    icon: Target, 
                    label: "Accuracy", 
                    value: `${progress.battle_stats?.accuracy || 0}%`, 
                    color: "#FF4D6D" 
                  },
                ].map((stat, index) => (
                  <div key={index} className="bg-[#1B1B28] border border-[#2A2A3D] p-4 rounded-xl hover:border-[#0082FB]/30 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${stat.color}15` }}
                      >
                        <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#A0A0B8] mb-1">{stat.label}</p>
                        <p className="text-lg font-bold text-white truncate">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Battle Stats and Badges */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BattleStats stats={progress.battle_stats || {
                  battles_won: 0,
                  battles_played: 0,
                  win_percentage: 0,
                  avg_answer_time: 0,
                  accuracy: 0,
                  fastest_answer: 0
                }} />
                
                <BadgesDisplay badges={progress.badges || []} />
              </div>

              {/* Today's Activity */}
              <TodayActivity activities={progress.recent_activity || []} />
            </div>

            {/* Right Column - Side Cards */}
            <div className="xl:col-span-2 space-y-6">
              {/* Current Streak */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-[#1B1B28] border border-[#FF9F5B]/20 p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-[#FF9F5B]/10 rounded-lg">
                        <Flame className="h-5 w-5 text-[#FF9F5B]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-white">Current Streak</h2>
                        <p className="text-xs text-[#A0A0B8]">Keep learning daily</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#FF9F5B]">{progress.daily_streak || 0}</div>
                      <div className="text-xs text-[#A0A0B8]">days</div>
                    </div>
                  </div>
                  <div className="text-xs text-[#00FFA3] font-medium bg-[#00FFA3]/10 rounded-full px-3 py-1 inline-block">
                    +5 XP per day
                  </div>
                </div>
              </motion.div>

              {/* Leaderboard */}
              <LeaderboardCard leaderboard={progress.leaderboard || {
                global_rank: 0,
                friends_rank: 0,
                last_updated: new Date()
              }} />

              {/* Continue Learning */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="bg-gradient-to-br from-[#0082FB] to-[#0064EO] text-white p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Rocket className="h-5 w-5" />
                      <h2 className="text-sm font-semibold">Continue Learning</h2>
                    </div>
                    <Star className="h-4 w-4" />
                  </div>
                  <p className="text-xs opacity-90 mb-4">
                    You're making great progress! Ready for your next lesson?
                  </p>
                  <button 
                    onClick={() => navigate("/mentor")}
                    className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>Continue Course</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    </ProfileGuard>
  );
};

export default Dashboard;