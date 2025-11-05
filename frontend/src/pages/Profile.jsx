// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import Layout from '../components/layout/MainLayout';
import ProfileGuard from '../components/profile/ProfileGuard';
import AvatarSelector from '../components/profile/AvatarSelector';
import ProfileForm from '../components/profile/ProfileForm';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Toast from '../components/ui/Toast';
import Progress from '../components/ui/Progress';
import { motion } from 'framer-motion';
import {
  User,
  Edit3,
  LogOut,
  Camera,
  Award,
  BarChart3,
  Flame,
  Mail,
  Calendar,
  BookOpen,
  GraduationCap,
  Crown,
  Target,
  Users,
  Clock,
  TrendingUp,
  Shield,
  MapPin,
  Book
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const { profile, updateProfile, refreshProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const handleSaveSuccess = async () => {
    setIsEditing(false);
    await refreshProfile();
    setToastMessage('Profile updated successfully!');
    setToastType('success');
    setShowToast(true);
  };

  const handleAvatarSelect = async (avatar) => {
    try {
      await updateProfile({ avatar });
      setShowAvatarModal(false);
      setToastMessage('Avatar updated successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to update avatar');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Stats data
  const stats = [
    { 
      icon: Crown, 
      label: 'Battles Won', 
      value: profile?.battle_stats?.battles_won || 0, 
      color: '#0082FB'
    },
    { 
      icon: Target, 
      label: 'Accuracy', 
      value: profile?.battle_stats?.accuracy ? `${profile.battle_stats.accuracy}%` : '0%', 
      color: '#00FFA3'
    },
    { 
      icon: Clock, 
      label: 'Avg Time', 
      value: profile?.battle_stats?.avg_answer_time ? `${profile.battle_stats.avg_answer_time}s` : '0s', 
      color: '#FF9F5B'
    },
    { 
      icon: Users, 
      label: 'Global Rank', 
      value: profile?.leaderboard?.global_rank ? `#${profile.leaderboard.global_rank}` : 'N/A', 
      color: '#FF4D6D'
    }
  ];

  if (!profile) {
    return (
      <ProfileGuard>
        <Layout>
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="p-2 max-w-md w-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Create Profile</h2>
              <p className="text-[#A0A0B8] text-sm mb-4">Complete your profile to get started</p>
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full"
              >
                Create Profile
              </Button>
            </Card>

            {isEditing && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="w-full max-w-2xl">
                  <ProfileForm 
                    onCancel={() => setIsEditing(false)} 
                    onSave={handleSaveSuccess}
                    isCreating={true}
                  />
                </div>
              </div>
            )}

            <Toast
              isOpen={showToast}
              onClose={() => setShowToast(false)}
              message={toastMessage}
              type={toastType}
            />
          </div>
        </Layout>
      </ProfileGuard>
    );
  }

  const currentXP = profile?.progress?.xp || 0;
  const nextLevelXP = 1000; // Simple XP calculation
  const xpPercentage = Math.min(100, (currentXP / nextLevelXP) * 100);

  return (
    <ProfileGuard>
      <Layout>
        <div className="min-h-screen p-3 md:p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            {isEditing ? (
              <ProfileForm onCancel={() => setIsEditing(false)} onSave={handleSaveSuccess} />
            ) : (
              <div className="space-y-4">
                {/* Header Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-xl flex items-center justify-center overflow-hidden border-2 border-[#0082FB]">
                          {profile.avatar ? (
                            <img
                              src={profile.avatar}
                              alt={profile.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <button
                          onClick={() => setShowAvatarModal(true)}
                          className="absolute -bottom-1 -right-1 bg-[#0082FB] p-1.5 rounded-full hover:bg-[#0064EO] transition-colors"
                        >
                          <Camera className="h-3 w-3 text-white" />
                        </button>
                      </div>

                      {/* Profile Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h1 className="text-xl font-bold text-white truncate">
                            {profile.fullName}
                          </h1>
                          <Badge className="bg-[#0082FB]/20 text-[#0082FB] border-[#0082FB]/30 text-xs">
                            {profile.role || 'Student'}
                          </Badge>
                        </div>
                        
                        <p className="text-[#A0A0B8] text-sm mb-2">@{profile.username}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <div className="flex items-center gap-1 text-[#00FFA3]">
                            <Flame className="h-3 w-3" />
                            <span>{profile?.progress?.daily_streak || 0} day streak</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#FF9F5B]">
                            <Award className="h-3 w-3" />
                            <span>{profile?.badges?.length || 0} badges</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#0082FB]">
                            <TrendingUp className="h-3 w-3" />
                            <span>Level {profile?.progress?.level || 1}</span>
                          </div>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <Button
                        onClick={() => setIsEditing(true)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                      <div className="mt-3 p-3 bg-[#0D0D14] rounded-lg border border-[#2A2A3D]">
                        <p className="text-white text-sm">"{profile.bio}"</p>
                      </div>
                    )}
                  </Card>
                </motion.div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Personal Info */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="p-4">
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <User className="h-4 w-4 text-[#0082FB]" />
                          Personal Info
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-3 bg-[#0D0D14] rounded-lg">
                            <Mail className="h-4 w-4 text-[#0082FB]" />
                            <div>
                              <p className="text-xs text-[#A0A0B8]">Email</p>
                              <p className="text-sm text-white truncate">{user.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-[#0D0D14] rounded-lg">
                            <Calendar className="h-4 w-4 text-[#00FFA3]" />
                            <div>
                              <p className="text-xs text-[#A0A0B8]">Joined</p>
                              <p className="text-sm text-white">
                                {new Date(user.metadata.creationTime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {profile.college && (
                            <div className="flex items-center gap-3 p-3 bg-[#0D0D14] rounded-lg">
                              <MapPin className="h-4 w-4 text-[#FF9F5B]" />
                              <div>
                                <p className="text-xs text-[#A0A0B8]">College</p>
                                <p className="text-sm text-white">{profile.college}</p>
                              </div>
                            </div>
                          )}

                          {profile.course && (
                            <div className="flex items-center gap-3 p-3 bg-[#0D0D14] rounded-lg">
                              <Book className="h-4 w-4 text-[#FF4D6D]" />
                              <div>
                                <p className="text-xs text-[#A0A0B8]">Course</p>
                                <p className="text-sm text-white">{profile.course}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="p-4">
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-[#00FFA3]" />
                          Performance
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                          {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                              <div key={index} className="bg-[#0D0D14] border border-[#2A2A3D] p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon className="h-3 w-3" style={{ color: stat.color }} />
                                  <span className="text-xs text-[#A0A0B8]">{stat.label}</span>
                                </div>
                                <span className="text-base font-bold text-white" style={{ color: stat.color }}>
                                  {stat.value}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </motion.div>

                    {/* Badges */}
                    {profile.badges?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Card className="p-4">
                          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Award className="h-4 w-4 text-[#FF9F5B]" />
                            Badges
                          </h2>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {profile.badges.slice(0, 4).map((badge, index) => (
                              <div key={index} className="bg-[#0D0D14] border border-[#2A2A3D] p-3 rounded-lg text-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-full flex items-center justify-center mx-auto mb-2">
                                  <Award className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-white text-xs font-medium truncate">
                                  {badge.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </motion.div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* XP Progress */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className="p-4">
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[#0082FB]" />
                          XP Progress
                        </h2>
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">Level {profile?.progress?.level || 1}</div>
                            <div className="text-sm text-[#A0A0B8]">
                              {currentXP} / {nextLevelXP} XP
                            </div>
                          </div>
                          
                          <Progress value={xpPercentage} showLabel={false} />
                          
                          <div className="text-center text-xs text-[#00FFA3]">
                            {nextLevelXP - currentXP} XP to next level
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {/* Interests */}
                    {profile.interests?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Card className="p-4">
                          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-[#00FFA3]" />
                            Interests
                          </h2>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.interests.slice(0, 6).map((interest, index) => (
                              <Badge
                                key={index}
                                className="bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20 text-xs"
                              >
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </Card>
                      </motion.div>
                    )}

                    {/* Logout */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Card className="p-4 border-[#FF4D6D]/20">
                        <div className="text-center space-y-3">
                          <h3 className="text-sm font-semibold text-white">Account</h3>
                          <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="w-full border-[#FF4D6D] text-[#FF4D6D] hover:bg-[#FF4D6D]/10 flex items-center justify-center gap-2 text-sm"
                          >
                            <LogOut className="h-3 w-3" />
                            Logout
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  </div>
                </div>
              </div>
            )}

            {/* Avatar Selector */}
            <AvatarSelector
              isOpen={showAvatarModal}
              onClose={() => setShowAvatarModal(false)}
              onSelect={handleAvatarSelect}
              currentAvatar={profile.avatar}
            />

            {/* Toast */}
            <Toast
              isOpen={showToast}
              onClose={() => setShowToast(false)}
              message={toastMessage}
              type={toastType}
            />
          </div>
        </div>
      </Layout>
    </ProfileGuard>
  );
};

export default Profile;