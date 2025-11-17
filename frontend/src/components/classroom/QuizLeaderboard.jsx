import React, { useState, useEffect } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../ui/Loader';

const QuizLeaderboard = ({ quizId, sessionId }) => {
  const { fetchQuizAnalytics, quizAnalytics } = useClassroom();
  const { user, profile } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentStudentRank, setCurrentStudentRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptStats, setAttemptStats] = useState({
    totalStudents: 0,
    attempted: 0,
    notAttempted: 0,
    attemptRate: 0
  });

  useEffect(() => {
    if (quizId) {
      setIsLoading(true);
      setError(null);
      fetchQuizAnalytics(quizId)
        .then(() => {
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching quiz analytics:', err);
          setError(err.message || 'Failed to load leaderboard');
          setIsLoading(false);
        });
    }
  }, [quizId, fetchQuizAnalytics]);

  useEffect(() => {
    // ✅ FIXED: Handle both analytics format and direct response
    const analytics = quizAnalytics?.analytics || quizAnalytics;
    
    if (analytics) {
      // ✅ NEW: Set attempt statistics
      if (analytics.statistics) {
        setAttemptStats({
          totalStudents: analytics.statistics.totalStudentsInClassroom || 0,
          attempted: analytics.statistics.totalStudents || analytics.statistics.uniqueStudentsAttempted || 0,
          notAttempted: analytics.statistics.studentsNotAttempted || 0,
          attemptRate: analytics.statistics.attemptRate || 0
        });
      }

      if (analytics.studentPerformance && analytics.studentPerformance.length > 0) {
        // ✅ FIXED: Get current user's ID for matching
        const currentUserId = profile?._id?.toString() || user?.uid;
        const currentUserFirebaseId = profile?.userId || user?.uid;
        
        // Transform student performance to leaderboard format
        const leaderboard = analytics.studentPerformance
          .map((student, index) => {
            // ✅ FIXED: Better matching logic for current student
            const studentId = student.student?._id?.toString();
            const studentFirebaseId = student.student?.userId;
            const isCurrentStudent = 
              student.sessionId === sessionId || 
              studentId === currentUserId ||
              studentFirebaseId === currentUserFirebaseId;
            
            return {
              rank: student.rank || index + 1,
              name: student.student?.fullName || student.student?.username || 'Unknown',
              username: student.student?.username || '',
              avatar: student.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.student?.fullName || student.student?.username || 'Unknown')}&background=0082FB&color=fff`,
              score: student.score || 0,
              percentage: Math.round(student.percentage || 0),
              timeSpent: student.timeSpent || 0,
              isCurrentStudent
            };
          })
          .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
          .map((item, index) => ({
            ...item,
            rank: index + 1
          }));

        setLeaderboardData(leaderboard);
        
        // Find current student's rank
        const currentStudent = leaderboard.find(s => s.isCurrentStudent);
        if (currentStudent) {
          setCurrentStudentRank(currentStudent.rank);
        }
      } else {
        setLeaderboardData([]);
      }
    }
  }, [quizAnalytics, sessionId, user, profile]);

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-[#FFD700] text-[#0D0D14]';
      case 2: return 'bg-[#C0C0C0] text-[#0D0D14]';
      case 3: return 'bg-[#CD7F32] text-white';
      default: return 'bg-[#2A2A3D] text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <div className="text-center py-8">
          <Loader size="md" />
          <p className="text-[#A0A0B8] mt-4">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <div className="text-center py-8">
          <p className="text-[#FF4D6D] mb-2">Error loading leaderboard</p>
          <p className="text-[#A0A0B8] text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Quiz Leaderboard</h3>
        <div className="text-center py-8">
          <p className="text-[#A0A0B8] mb-2">No leaderboard data available yet</p>
          <p className="text-[#A0A0B8] text-sm">Students need to complete this quiz to appear on leaderboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ NEW: Attempt Statistics */}
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Quiz Participation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-[#2A2A3D] rounded-lg">
            <p className="text-[#A0A0B8] text-sm mb-1">Total Students</p>
            <p className="text-white text-2xl font-bold">{attemptStats.totalStudents}</p>
          </div>
          <div className="text-center p-4 bg-[#2A2A3D] rounded-lg">
            <p className="text-[#A0A0B8] text-sm mb-1">Attempted</p>
            <p className="text-[#00FFA3] text-2xl font-bold">{attemptStats.attempted}</p>
          </div>
          <div className="text-center p-4 bg-[#2A2A3D] rounded-lg">
            <p className="text-[#A0A0B8] text-sm mb-1">Not Attempted</p>
            <p className="text-[#FF4D6D] text-2xl font-bold">{attemptStats.notAttempted}</p>
          </div>
          <div className="text-center p-4 bg-[#2A2A3D] rounded-lg">
            <p className="text-[#A0A0B8] text-sm mb-1">Participation Rate</p>
            <p className="text-[#0082FB] text-2xl font-bold">{attemptStats.attemptRate}%</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#A0A0B8] text-sm">Participation Progress</span>
            <span className="text-[#00FFA3] font-semibold">{attemptStats.attemptRate}%</span>
          </div>
          <div className="w-full bg-[#2A2A3D] rounded-full h-3">
            <div
              className="bg-[#00FFA3] h-3 rounded-full transition-all duration-500"
              style={{ width: `${attemptStats.attemptRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Top Performers</h3>
        
        <div className="space-y-3">
        {leaderboardData.map((student) => (
          <div
            key={student.rank}
            className={`p-4 rounded-lg border-2 transition-all ${
              student.isCurrentStudent
                ? 'bg-[#0082FB] bg-opacity-10 border-[#0082FB]'
                : 'bg-[#2A2A3D] border-[#2A2A3D] hover:border-[#0082FB]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(student.rank)}`}>
                  {student.rank}
                </div>
                
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0082FB&color=fff`;
                  }}
                />
                
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">
                      {student.isCurrentStudent ? 'You' : student.name}
                    </p>
                    {student.isCurrentStudent && (
                      <span className="px-2 py-0.5 bg-[#0082FB] text-white text-xs rounded-full font-medium">
                        You
                      </span>
                    )}
                  </div>
                  {student.username && (
                    <p className="text-[#A0A0B8] text-xs">@{student.username}</p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-white font-semibold text-lg">{student.percentage}%</p>
                <p className="text-[#A0A0B8] text-xs">
                  {student.timeSpent > 0 
                    ? `${Math.floor(student.timeSpent / 60)}m ${student.timeSpent % 60}s`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default QuizLeaderboard;

