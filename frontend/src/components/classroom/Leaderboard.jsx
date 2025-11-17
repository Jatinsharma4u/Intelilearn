import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClassroom } from '../../contexts/ClassroomContext';

const Leaderboard = ({ classroomId, compact = false }) => {
  const navigate = useNavigate();
  const { fetchLeaderboard, leaderboard, loading } = useClassroom();
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    if (classroomId) {
      // ✅ FIXED: Reset state before fetching
      setLeaderboardData([]);
      fetchLeaderboard(classroomId).catch(err => {
        console.error('Error fetching leaderboard:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  useEffect(() => {
    // ✅ FIXED: Handle both array and object response formats
    if (leaderboard) {
      let leaderboardArray = [];
      
      if (Array.isArray(leaderboard)) {
        leaderboardArray = leaderboard;
      } else if (leaderboard.leaderboard && Array.isArray(leaderboard.leaderboard)) {
        leaderboardArray = leaderboard.leaderboard;
      }
      
      if (leaderboardArray.length > 0) {
        // Transform backend data to frontend format
        const transformed = leaderboardArray.map((item, index) => ({
          rank: item.rank || index + 1,
          name: item.student?.fullName || item.student?.username || 'Unknown',
          score: Math.round(item.averageScore || 0),
          avatar: item.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.student?.fullName || item.student?.username || 'Unknown')}&background=0082FB&color=fff`,
          progress: 0, // Can be calculated from historical data if needed
          completedQuizzes: item.completedQuizzes || 0,
          totalTimeSpent: item.totalTimeSpent || 0
        }));
        setLeaderboardData(transformed);
      } else {
        setLeaderboardData([]);
      }
    } else {
      setLeaderboardData([]);
    }
  }, [leaderboard]);

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-[#FFD700] text-[#0D0D14]';
      case 2: return 'bg-[#C0C0C0] text-[#0D0D14]';
      case 3: return 'bg-[#CD7F32] text-white';
      default: return 'bg-[#2A2A3D] text-white';
    }
  };

  const getProgressColor = (progress) => {
    if (progress > 0) return 'text-[#00FFA3]';
    if (progress < 0) return 'text-[#FF4D6D]';
    return 'text-[#A0A0B8]';
  };

  const getProgressIcon = (progress) => {
    if (progress > 0) return '↗';
    if (progress < 0) return '↘';
    return '→';
  };

  // ✅ FIXED: Better loading state check
  const isLoading = loading && leaderboardData.length === 0 && !leaderboard;
  const hasNoData = !loading && leaderboardData.length === 0 && (!leaderboard || (Array.isArray(leaderboard) && leaderboard.length === 0));
  
  if (isLoading) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Class Leaderboard</h3>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0082FB] mb-4"></div>
          <p className="text-[#A0A0B8]">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (hasNoData) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Class Leaderboard</h3>
        <div className="text-center py-8">
          <p className="text-[#A0A0B8] mb-2">No leaderboard data available yet</p>
          <p className="text-[#A0A0B8] text-sm">Students need to complete quizzes to appear on leaderboard</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Class Leaderboard</h3>
        <div className="space-y-3">
          {leaderboardData.slice(0, 5).map((student) => (
            <div key={student.rank} className="flex items-center justify-between p-3 bg-[#2A2A3D] rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(student.rank)}`}>
                  {student.rank}
                </div>
                <div className="flex items-center gap-2">
                  {student.avatar && student.avatar !== '/assets/default-avatar.png' ? (
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.name) + '&background=0082FB&color=fff';
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#0082FB] flex items-center justify-center text-white text-xs font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-white text-sm font-medium">{student.name}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#00FFA3] font-semibold text-sm">{student.score}%</p>
                <p className="text-[#A0A0B8] text-xs">
                  {student.completedQuizzes} quizzes
                </p>
              </div>
            </div>
          ))}
        </div>
        {/* ✅ NEW: View Complete Leaderboard button in compact mode */}
        {classroomId && (
          <button 
            onClick={() => {
              navigate(`/classroom/${classroomId}?tab=leaderboard`);
            }}
            className="w-full mt-4 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white py-2 px-4 rounded-md transition-colors duration-200 font-medium text-sm flex items-center justify-center gap-2"
          >
            <span>View Complete Leaderboard</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#1B1B28] rounded-lg border border-[#2A2A3D]">
      {/* Header */}
      <div className="p-6 border-b border-[#2A2A3D]">
        <h2 className="text-xl font-semibold text-white">Class Leaderboard</h2>
        <p className="text-[#A0A0B8] text-sm mt-1">
          Top performers based on quiz scores
        </p>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-[#2A2A3D]">
        {leaderboardData.map((student) => (
          <div key={student.rank} className="p-4 hover:bg-[#2A2A3D] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getRankColor(student.rank)}`}>
                  {student.rank}
                </div>

                {/* Avatar and Name */}
                <div className="flex items-center gap-3">
                  {student.avatar && student.avatar !== '/assets/default-avatar.png' ? (
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-10 h-10 rounded-full border-2 border-[#0082FB]"
                      onError={(e) => {
                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.name) + '&background=0082FB&color=fff';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0082FB] border-2 border-[#0082FB] flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold">{student.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#A0A0B8] text-xs">
                        {student.completedQuizzes} quizzes completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="text-[#00FFA3] text-2xl font-bold">{student.score}%</p>
                <p className="text-[#A0A0B8] text-sm">Average Score</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#A0A0B8] text-sm">Performance</span>
                <span className="text-white text-sm font-medium">{student.score}%</span>
              </div>
              <div className="w-full bg-[#2A2A3D] rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    student.score >= 90 ? 'bg-[#00FFA3]' : 
                    student.score >= 70 ? 'bg-[#0082FB]' : 'bg-[#FF9F5B]'
                  }`}
                  style={{ width: `${student.score}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="p-4 border-t border-[#2A2A3D]">
        <button 
          onClick={() => {
            if (classroomId) {
              navigate(`/classroom/${classroomId}?tab=leaderboard`);
            }
          }}
          className="w-full bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white py-2 px-4 rounded-md transition-colors duration-200 font-medium flex items-center justify-center gap-2"
        >
          <span>View Complete Leaderboard</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;