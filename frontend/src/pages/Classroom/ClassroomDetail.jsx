import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import QuizList from '../../components/classroom/QuizList';
import StudentList from '../../components/classroom/StudentList';
import TeacherAnalytics from '../../components/classroom/TeacherAnalytics';
import StudentProgress from '../../components/classroom/StudentProgress';
import Leaderboard from '../../components/classroom/Leaderboard';
import Loader from '../../components/ui/Loader';

const ClassroomDetail = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    currentClassroom, 
    fetchClassroomDetails, 
    loading 
  } = useClassroom();
  const { user } = useAuth();
  const { profile } = useProfile();

  // ✅ NEW: Get tab from URL params, default to 'quizzes'
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'quizzes');
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  useEffect(() => {
    if (classroomId) {
      fetchClassroomDetails(classroomId);
    }
  }, [classroomId]);

  // ✅ NEW: Update active tab when URL param changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const isTeacher = profile?.role === 'teacher';

  // Debug logs
  console.log('🏫 ClassroomDetail Debug:', {
    currentClassroom,
    isTeacher,
    classroomId
  });

  // Tabs based on role
  const tabs = isTeacher 
    ? [
        { id: 'quizzes', label: 'Quizzes', icon: '📝', color: 'text-blue-400' },
        { id: 'students', label: 'Students', icon: '👥', color: 'text-green-400' },
        { id: 'analytics', label: 'Analytics', icon: '📊', color: 'text-purple-400' },
        { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', color: 'text-yellow-400' }
      ]
    : [
        { id: 'quizzes', label: 'Quizzes', icon: '📝', color: 'text-blue-400' },
        { id: 'progress', label: 'My Progress', icon: '📈', color: 'text-green-400' },
        { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', color: 'text-yellow-400' }
      ];

  // Create Quiz Options - FIXED NAVIGATION PATHS
const createOptions = [
  {
    id: 'manual',
    label: 'Create Manual Quiz',
    description: 'Build quiz questions manually',
    icon: '✍️',
    color: 'bg-blue-500',
    onClick: () => {
      setShowCreateMenu(false);
      navigate(`/classroom/${classroomId}/quiz/create?type=manual`);
    }
  },
  {
    id: 'pdf',
    label: 'Create from PDF',
    description: 'Upload PDF and generate quiz automatically',
    icon: '📄',
    color: 'bg-green-500',
    onClick: () => {
      setShowCreateMenu(false);
      navigate(`/classroom/${classroomId}/quiz/create?type=pdf`);
    }
  }
];
  const handleManageClassroom = () => {
    // Classroom settings/edit functionality
    console.log('Manage classroom settings');
  };

  const handleCopyCode = async () => {
    const code = currentClassroom.code || currentClassroom.joinCode;
    try {
      await navigator.clipboard.writeText(code);
      console.log('✅ Code copied to clipboard:', code);
      // Temporary alert - replace with proper toast
      alert(`Classroom code "${code}" copied to clipboard!`);
    } catch (err) {
      console.error('❌ Failed to copy code:', err);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCreateMenu(false);
    };

    if (showCreateMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showCreateMenu]);

  if (loading && !currentClassroom) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  if (!currentClassroom) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Classroom Not Found</h2>
          <p className="text-[#A0A0B8] mb-6">The classroom you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(isTeacher ? '/classroom/teacher-dashboard' : '/classroom/student-dashboard')}
            className="bg-[#0082FB] hover:bg-[#0064E0] text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate classroom statistics from REAL data
  const getClassroomStats = () => {
    const totalStudents = currentClassroom.students?.length || 0;
    const totalQuizzes = currentClassroom.quizzes?.length || 0;
    const activeStudents = currentClassroom.students?.filter(s => s.isActive).length || totalStudents;
    const studentProgress = currentClassroom.studentProgress || 0;
    const studentRank = currentClassroom.studentRank || 'N/A';
    
    return {
      totalStudents,
      totalQuizzes,
      activeStudents,
      studentProgress,
      studentRank,
      completionRate: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0
    };
  };

  const stats = getClassroomStats();

  return (
    <div className="min-h-screen bg-[#0D0D14] text-white">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-[#1B1B28] via-[#1E1E2E] to-[#2A2A3D] border-b border-[#2A2A3D] sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Main Header Row */}
          <div className="flex items-center justify-between mb-4">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => navigate(isTeacher ? '/classroom/teacher-dashboard' : '/classroom/student-dashboard')}
                className="flex items-center gap-2 text-[#A0A0B8] hover:text-white hover:bg-white/10 transition-all duration-200 p-2 rounded-lg flex-shrink-0 group"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold truncate bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                    {currentClassroom.name}
                  </h1>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${
                    isTeacher 
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                      : 'bg-green-500/20 text-green-300 border-green-500/30'
                  }`}>
                    {isTeacher ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[#A0A0B8] text-sm truncate">{currentClassroom.subject}</p>
                  {currentClassroom.description && (
                    <>
                      <div className="w-1 h-1 bg-[#A0A0B8] rounded-full"></div>
                      <p className="text-[#A0A0B8] text-xs truncate max-w-[200px]">
                        {currentClassroom.description}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {isTeacher && (
                <>
                  {/* Class Code with Copy */}
                  <div className="hidden sm:flex items-center gap-2 bg-white/5 hover:bg-white/10 transition-all duration-200 px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer group"
                       onClick={handleCopyCode}>
                    <span className="text-[#A0A0B8] text-xs group-hover:text-white transition-colors">Code:</span>
                    <span className="text-blue-400 font-mono text-sm font-bold group-hover:text-blue-300 transition-colors">
                      {currentClassroom.code || currentClassroom.joinCode}
                    </span>
                    <svg className="w-3 h-3 text-[#A0A0B8] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  {/* Create Quiz Dropdown - FIXED CLICK HANDLING */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCreateMenu(!showCreateMenu);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Create Quiz</span>
                      <svg className={`w-4 h-4 transition-transform duration-200 ${showCreateMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showCreateMenu && (
                      <div 
                        className="absolute right-0 top-full mt-2 w-72 bg-[#1B1B28] border border-[#2A2A3D] rounded-lg shadow-2xl z-50 backdrop-blur-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-3">
                          <h3 className="text-white text-sm font-semibold px-2 py-2 border-b border-[#2A2A3D] mb-2">
                            Create New Quiz
                          </h3>
                          <div className="space-y-2">
                            {createOptions.map((option) => (
                              <button
                                key={option.id}
                                onClick={option.onClick}
                                className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-all duration-200 flex items-center gap-3 group border border-transparent hover:border-white/10"
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${option.color} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200`}>
                                  {option.icon}
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">
                                    {option.label}
                                  </p>
                                  <p className="text-[#A0A0B8] text-xs group-hover:text-[#A0A0B8]/80">
                                    {option.description}
                                  </p>
                                </div>
                                <svg className="w-4 h-4 text-[#A0A0B8] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Settings Button */}
                  <button
                    onClick={handleManageClassroom}
                    className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg transition-all duration-200 border border-transparent hover:border-white/10 hover:scale-105"
                    title="Manage Classroom"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {isTeacher ? (
              // TEACHER STATS - Real data
              <>
                <StatCard 
                  value={stats.totalStudents} 
                  label="Total Students" 
                  color="blue" 
                  icon="👥"
                />
                <StatCard 
                  value={stats.activeStudents} 
                  label="Active Students" 
                  color="green" 
                  icon="✅"
                />
                <StatCard 
                  value={stats.totalQuizzes} 
                  label="Total Quizzes" 
                  color="orange" 
                  icon="📝"
                />
                <StatCard 
                  value={`${stats.completionRate}%`} 
                  label="Completion Rate" 
                  color="purple" 
                  icon="📊"
                />
              </>
            ) : (
              // STUDENT STATS - Real data
              <>
                <StatCard 
                  value={stats.totalStudents} 
                  label="Classmates" 
                  color="blue" 
                  icon="👥"
                />
                <StatCard 
                  value={stats.totalQuizzes} 
                  label="Available Quizzes" 
                  color="orange" 
                  icon="📝"
                />
                <StatCard 
                  value={`${stats.studentProgress}%`} 
                  label="Your Progress" 
                  color="green" 
                  icon="📈"
                />
                <StatCard 
                  value={stats.studentRank} 
                  label="Your Rank" 
                  color="yellow" 
                  icon="🏆"
                />
              </>
            )}
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="border-b border-[#2A2A3D] bg-gradient-to-b from-[#1B1B28] to-[#2A2A3D]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab Content with Smooth Transitions */}
        <div className="animate-in fade-in duration-300">
          {activeTab === 'quizzes' && (
            <QuizList classroomId={classroomId} />
          )}
          
          {activeTab === 'students' && isTeacher && (
            <StudentList classroomId={classroomId} />
          )}
          
          {activeTab === 'analytics' && isTeacher && (
            <TeacherAnalytics classroomId={classroomId} />
          )}
          
          {activeTab === 'progress' && !isTeacher && (
            <StudentProgress classroomId={classroomId} />
          )}
          
          {activeTab === 'leaderboard' && (
            <Leaderboard classroomId={classroomId} />
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ value, label, color, icon }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-white/5 rounded-lg p-3 border ${colors.border} hover:scale-105 transition-all duration-200 cursor-pointer`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-lg font-bold ${colors.text}`}>{value}</p>
          <p className={`text-xs ${colors.text}`}>{label}</p>
        </div>
        <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <span className="text-sm">{icon}</span>
        </div>
      </div>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ tab, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 relative ${
        isActive
          ? `${tab.color} border-current bg-white/5`
          : 'text-[#A0A0B8] border-transparent hover:text-white hover:bg-white/5'
      } rounded-t-lg`}
    >
      <span className="text-base">{tab.icon}</span>
      <span>{tab.label}</span>
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"></div>
      )}
    </button>
  );
};

export default ClassroomDetail;