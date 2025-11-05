import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { useAuth } from '../contexts/AuthContext';
import { useFriend } from '../contexts/FriendContext';
import { getUserProfileByUsername, getProgressByUsername } from '../utils/api';
import { 
  Crown, 
  Trophy, 
  Target, 
  Zap, 
  Clock, 
  GraduationCap, 
  MapPin, 
  BookOpen,
  Users,
  Award,
  Star,
  UserPlus,
  Swords,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Sparkles,
  Siren
} from 'lucide-react';

const PublicProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const { sendRequest, checkStatus } = useFriend();
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (profile && user) {
      checkFriendshipStatus();
    }
  }, [profile, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userProfile, userProgress] = await Promise.all([
        getUserProfileByUsername(username),
        getProgressByUsername(username)
      ]);

      if (!userProfile) {
        setError('Profile not found');
        return;
      }

      setProfile(userProfile);
      setProgress(userProgress);
    } catch (err) {
      console.error('Profile load error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFriendshipStatus = async () => {
    try {
      const status = await checkStatus(username);
      setFriendshipStatus(status.status);
    } catch (err) {
      setFriendshipStatus('none');
    }
  };

  const handleAddFriend = async () => {
    try {
      await sendRequest(username, `Hi! I'd like to connect with you on EduAI!`);
      setFriendshipStatus('pending');
    } catch (err) {
      console.error('Send request error:', err);
    }
  };

  const handleChallenge = () => {
    window.location.href = `/battle?opponent=${username}`;
  };

  const calculateXPProgress = () => {
    if (!progress) return 0;
    const currentLevelXP = (progress.level - 1) * 1000;
    const xpInCurrentLevel = progress.total_xp - currentLevelXP;
    return Math.min((xpInCurrentLevel / 1000) * 100, 100);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0D0D14] to-[#151521]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-[#0082FB] mx-auto mb-4"></div>
            <p className="text-[#A0A0B8] text-sm">Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0D0D14] to-[#151521]">
          <Card className="max-w-md w-full text-center bg-gradient-to-br from-[#1B1B28] to-[#252538] border-[#2A2A3D] shadow-2xl">
            <CardContent className="p-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#2A2A3D] to-[#3A3A4D] rounded-full flex items-center justify-center shadow-lg">
                <Siren className="w-8 h-8 text-[#FF6B6B]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Profile Not Found
              </h2>
              <p className="text-[#A0A0B8] text-sm mb-6 leading-relaxed">
                The user <span className="text-[#0082FB] font-semibold">@{username}</span> doesn't exist or may have been removed.
              </p>
              <Button 
                variant="primary" 
                onClick={() => window.history.back()}
                fullWidth
                icon={ArrowLeft}
                size="lg"
                className="shadow-lg"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const isOwnProfile = user && profile.userId === user.uid;
  const xpProgress = calculateXPProgress();

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0D0D14] to-[#151521] py-6">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Back Button with Better Styling */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-[#A0A0B8] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300 text-sm group"
              icon={ArrowLeft}
              size="sm"
            >
              <span className="group-hover:translate-x-[-2px] transition-transform duration-300">
                Back
              </span>
            </Button>
          </div>
          
          {/* Enhanced Profile Header */}
          <Card className="border-[#2A2A3D] bg-gradient-to-br from-[#1B1B28] to-[#252538] shadow-2xl mb-8 overflow-hidden">
            {/* Gradient Top Bar */}
            <div className="h-1 bg-gradient-to-r from-[#0082FB] via-[#00C896] to-[#FF6B6B]"></div>
            
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                
                {/* Enhanced Avatar Section */}
                <div className="flex-shrink-0 relative">
                  <div className="relative">
                    <Avatar 
                      user={profile} 
                      size="xl"
                      className="ring-4 ring-[#1B1B28] shadow-2xl"
                    />
                    {/* Level Badge with Glow */}
                    <div className="absolute -bottom-2 -right-2">
                      <Badge 
                        variant="primary" 
                        className="text-xs px-2 py-1 shadow-lg bg-gradient-to-r from-[#0082FB] to-[#0064E0] border border-[#0082FB]/40"
                      >
                        <Crown className="w-3 h-3" />
                        <span className="font-bold">Lvl {progress?.level || 1}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Profile Info */}
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                        <h1 className="text-2xl font-bold text-white truncate">
                          {profile.fullName}
                        </h1>
                        {profile.role === 'teacher' && (
                          <Badge variant="primary" className="text-xs bg-gradient-to-r from-[#FF6B6B] to-[#FF4757]">
                            Teacher
                          </Badge>
                        )}
                      </div>
                      <p className="text-[#0082FB] font-semibold text-base mb-3 flex items-center justify-center sm:justify-start gap-2">
                        <span>@{profile.username}</span>
                        <Sparkles className="w-4 h-4 text-[#00C896]" />
                      </p>
                    </div>
                    
                    {/* Enhanced Action Buttons */}
                    {!isOwnProfile && (
                      <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
                        {friendshipStatus === 'none' && (
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={handleAddFriend}
                            icon={UserPlus}
                            className="shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            Add Friend
                          </Button>
                        )}
                        {friendshipStatus === 'pending' && (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            icon={Clock}
                            disabled
                            className="opacity-80"
                          >
                            Request Sent
                          </Button>
                        )}
                        {friendshipStatus === 'friends' && (
                          <Button 
                            variant="success" 
                            size="sm"
                            disabled
                            className="shadow-lg"
                          >
                            Friends
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleChallenge}
                          icon={Swords}
                          className="border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Challenge
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Bio */}
                  {profile.bio && (
                    <p className="text-[#A0A0B8] text-sm leading-relaxed mb-4 bg-[#1B1B28]/50 rounded-lg p-3 border border-[#2A2A3D]">
                      {profile.bio}
                    </p>
                  )}

                  {/* Enhanced Quick Info */}
                  <div className="flex flex-wrap gap-3 text-sm text-[#A0A0B8] justify-center sm:justify-start">
                    {profile.college && (
                      <div className="flex items-center gap-2 bg-[#1B1B28]/50 px-3 py-2 rounded-lg border border-[#2A2A3D]">
                        <GraduationCap className="w-4 h-4 text-[#0082FB]" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{profile.college}</span>
                      </div>
                    )}
                    {profile.course && (
                      <div className="flex items-center gap-2 bg-[#1B1B28]/50 px-3 py-2 rounded-lg border border-[#2A2A3D]">
                        <BookOpen className="w-4 h-4 text-[#00C896]" />
                        <span className="truncate max-w-[100px] sm:max-w-none">{profile.course}</span>
                      </div>
                    )}
                    {profile.year && (
                      <div className="flex items-center gap-2 bg-[#1B1B28]/50 px-3 py-2 rounded-lg border border-[#2A2A3D]">
                        <Calendar className="w-4 h-4 text-[#FF9F5B]" />
                        <span>Year {profile.year}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced XP Progress */}
              <div className="mt-6 bg-[#1B1B28]/50 rounded-xl p-4 border border-[#2A2A3D]">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-[#A0A0B8] font-medium">Level Progress</span>
                  <span className="font-bold text-[#0082FB]">
                    {progress?.total_xp || 0} XP • {Math.floor(xpProgress)}%
                  </span>
                </div>
                <Progress 
                  value={xpProgress} 
                  showLabel={false}
                  className="h-3 bg-[#2A2A3D] rounded-full overflow-hidden"
                  fillClassName="bg-gradient-to-r from-[#0082FB] to-[#00C896] shadow-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { 
                icon: Trophy, 
                value: progress?.level || 1, 
                label: 'Level', 
                color: '#0082FB',
                gradient: 'from-[#0082FB] to-[#0064E0]'
              },
              { 
                icon: Zap, 
                value: progress?.total_xp || 0, 
                label: 'Total XP', 
                color: '#00C896',
                gradient: 'from-[#00C896] to-[#00A878]'
              },
              { 
                icon: Target, 
                value: profile.battle_stats?.battles_played || 0, 
                label: 'Battles', 
                color: '#FF6B6B',
                gradient: 'from-[#FF6B6B] to-[#FF4757]'
              },
              { 
                icon: TrendingUp, 
                value: profile.battle_stats?.battles_won || 0, 
                label: 'Wins', 
                color: '#FF9F5B',
                gradient: 'from-[#FF9F5B] to-[#FF8A00]'
              }
            ].map((stat, index) => (
              <Card 
                key={index}
                className="bg-gradient-to-br from-[#1B1B28] to-[#252538] border-[#2A2A3D] shadow-lg hover:shadow-xl hover:border-[#2A2A3D]/60 transition-all duration-300 group"
              >
                <CardContent className="p-5 text-center">
                  <div className="flex justify-center mb-3">
                    <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[#A0A0B8] font-medium uppercase tracking-wide">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Detailed Sections */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Enhanced Battle Statistics */}
            <Card className="bg-gradient-to-br from-[#1B1B28] to-[#252538] border-[#2A2A3D] shadow-xl">
              <CardHeader className="pb-4 border-b border-[#2A2A3D]">
                <CardTitle className="flex items-center gap-3 text-white text-lg">
                  <div className="p-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF4757] rounded-lg">
                    <Swords className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    Battle Statistics
                    <CardDescription className="text-[#A0A0B8] text-sm mt-1">
                      Combat performance & metrics
                    </CardDescription>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[
                    { label: 'Win Rate', value: `${profile.battle_stats?.win_percentage || 0}%`, type: 'success' },
                    { label: 'Accuracy', value: `${profile.battle_stats?.accuracy || 0}%`, type: 'primary' },
                    { label: 'Avg. Answer Time', value: `${profile.battle_stats?.avg_answer_time || 0}s`, type: 'info' },
                    { label: 'Fastest Answer', value: `${profile.battle_stats?.fastest_answer || 0}s`, type: 'warning' }
                  ].map((stat, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-[#1B1B28] rounded-xl border border-[#2A2A3D] hover:border-[#2A2A3D]/60 transition-all duration-300">
                      <span className="text-[#A0A0B8] text-sm font-medium">{stat.label}</span>
                      {stat.type === 'success' ? (
                        <Badge variant="success" className="text-sm font-bold">
                          {stat.value}
                        </Badge>
                      ) : stat.type === 'primary' ? (
                        <Badge variant="primary" className="text-sm font-bold">
                          {stat.value}
                        </Badge>
                      ) : (
                        <span className="font-bold text-white text-sm">{stat.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Profile Information */}
            <Card className="bg-gradient-to-br from-[#1B1B28] to-[#252538] border-[#2A2A3D] shadow-xl">
              <CardHeader className="pb-4 border-b border-[#2A2A3D]">
                <CardTitle className="flex items-center gap-3 text-white text-lg">
                  <div className="p-2 bg-gradient-to-r from-[#0082FB] to-[#0064E0] rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    Profile Information
                    <CardDescription className="text-[#A0A0B8] text-sm mt-1">
                      Personal details & preferences
                    </CardDescription>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Role */}
                  <div className="flex justify-between items-center p-3 bg-[#1B1B28] rounded-xl border border-[#2A2A3D]">
                    <span className="text-[#A0A0B8] text-sm font-medium">Role</span>
                    <Badge 
                      variant={profile.role === 'teacher' ? 'primary' : 'secondary'} 
                      className={profile.role === 'teacher' 
                        ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF4757]' 
                        : 'bg-[#2A2A3D] text-[#A0A0B8]'
                      }
                    >
                      {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)}
                    </Badge>
                  </div>

                  {/* Interests */}
                  {profile.interests?.length > 0 && (
                    <div className="p-3 bg-[#1B1B28] rounded-xl border border-[#2A2A3D]">
                      <div className="text-[#A0A0B8] text-sm font-medium mb-2">Interests</div>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.interests.slice(0, 4).map((interest, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-xs bg-[#252538] text-[#A0A0B8] border-[#2A2A3D] hover:border-[#0082FB]/30 transition-colors"
                          >
                            {interest}
                          </Badge>
                        ))}
                        {profile.interests.length > 4 && (
                          <Badge variant="outline" className="text-xs bg-[#252538] text-[#A0A0B8] border-[#2A2A3D]">
                            +{profile.interests.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subjects */}
                  {profile.subjects?.length > 0 && (
                    <div className="p-3 bg-[#1B1B28] rounded-xl border border-[#2A2A3D]">
                      <div className="text-[#A0A0B8] text-sm font-medium mb-2">Subjects</div>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.subjects.slice(0, 4).map((subject, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-xs bg-gradient-to-r from-[#0082FB]/20 to-[#00C896]/20 text-[#0082FB] border-[#0082FB]/30"
                          >
                            {subject}
                          </Badge>
                        ))}
                        {profile.subjects.length > 4 && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-[#0082FB]/20 to-[#00C896]/20 text-[#0082FB] border-[#0082FB]/30">
                            +{profile.subjects.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Achievements Section */}
          {(profile.badges?.length > 0 || profile.recent_activity?.length > 0) && (
            <Card className="mt-8 bg-gradient-to-br from-[#1B1B28] to-[#252538] border-[#2A2A3D] shadow-xl">
              <CardHeader className="pb-4 border-b border-[#2A2A3D]">
                <CardTitle className="flex items-center gap-3 text-white text-lg">
                  <div className="p-2 bg-gradient-to-r from-[#FF9F5B] to-[#FF8A00] rounded-lg">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  Achievements & Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Badges Section */}
                  {profile.badges?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-[#A0A0B8]">
                        Recent Badges ({profile.badges.length})
                      </h4>
                      <div className="space-y-3">
                        {profile.badges.slice(0, 4).map((badge, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-[#1B1B28] rounded-xl border border-[#2A2A3D] hover:border-[#FF9F5B]/30 transition-all duration-300">
                            <div className="p-2 bg-gradient-to-r from-[#FF9F5B] to-[#FF8A00] rounded-lg">
                              <Award className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white text-sm truncate">
                                {badge.name}
                              </div>
                              {badge.description && (
                                <div className="text-[#A0A0B8] text-xs truncate">
                                  {badge.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Section */}
                  {profile.recent_activity?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-[#A0A0B8]">
                        Recent Activity
                      </h4>
                      <div className="space-y-3">
                        {profile.recent_activity.slice(0, 4).map((activity, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-[#1B1B28] rounded-xl border border-[#2A2A3D] hover:border-[#00C896]/30 transition-all duration-300">
                            <div className="w-2 h-2 bg-[#00C896] rounded-full flex-shrink-0 animate-pulse"></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[#A0A0B8] text-sm truncate">
                                {activity.action}
                              </div>
                            </div>
                            {activity.xp_earned > 0 && (
                              <Badge variant="success" className="text-xs font-bold bg-gradient-to-r from-[#00C896] to-[#00A878] text-gray-900">
                                +{activity.xp_earned}XP
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PublicProfile;