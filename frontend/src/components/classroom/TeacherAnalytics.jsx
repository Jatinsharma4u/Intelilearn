import React, { useState, useEffect } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';

// ✅ NEW: Score Distribution Chart Component
const ScoreDistributionChart = ({ topStudents }) => {
  if (!topStudents || topStudents.length === 0) {
    return (
      <div className="text-center py-8 text-[#A0A0B8]">
        <p>No data available for chart</p>
      </div>
    );
  }

  // Calculate distribution
  const distribution = {
    excellent: topStudents.filter(s => s.averageScore >= 80).length,
    good: topStudents.filter(s => s.averageScore >= 60 && s.averageScore < 80).length,
    average: topStudents.filter(s => s.averageScore >= 40 && s.averageScore < 60).length,
    poor: topStudents.filter(s => s.averageScore < 40).length
  };

  const total = topStudents.length;
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {[
          { label: 'Excellent (80-100%)', count: distribution.excellent, color: 'bg-[#00FFA3]' },
          { label: 'Good (60-79%)', count: distribution.good, color: 'bg-[#FF9F5B]' },
          { label: 'Average (40-59%)', count: distribution.average, color: 'bg-[#FFD700]' },
          { label: 'Needs Improvement (<40%)', count: distribution.poor, color: 'bg-[#FF4D6D]' }
        ].map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#A0A0B8] text-sm">{item.label}</span>
              <span className="text-white text-sm font-medium">{item.count} students</span>
            </div>
            <div className="w-full bg-[#2A2A3D] rounded-full h-3 overflow-hidden">
              <div
                className={`${item.color} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ✅ NEW: Performance Trend Chart Component
const PerformanceTrendChart = ({ recentActivity }) => {
  if (!recentActivity || recentActivity.length === 0) {
    return (
      <div className="text-center py-8 text-[#A0A0B8]">
        <p>No activity data for trend</p>
      </div>
    );
  }

  // Get last 7 activities for trend
  const last7Activities = recentActivity.slice(0, 7).reverse();
  const maxScore = 100;
  const minScore = Math.min(...last7Activities.map(a => a.percentage), 0);

  return (
    <div className="space-y-4">
      <div className="h-48 flex items-end justify-between gap-2">
        {last7Activities.map((activity, index) => {
          const height = ((activity.percentage - minScore) / (maxScore - minScore)) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    activity.percentage >= 80 ? 'bg-[#00FFA3]' :
                    activity.percentage >= 60 ? 'bg-[#FF9F5B]' : 'bg-[#FF4D6D]'
                  }`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${activity.percentage}%`}
                ></div>
              </div>
              <span className="text-[#A0A0B8] text-xs mt-2 truncate w-full text-center">
                {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-[#A0A0B8]">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

const TeacherAnalytics = ({ classroomId, compact = false }) => {
  const { fetchClassroomAnalytics, classroomAnalytics, loading } = useClassroom();
  const [analyticsData, setAnalyticsData] = useState({
    totalStudents: 0,
    totalQuizzes: 0,
    averageScore: 0,
    completionRate: 0,
    topPerformer: { name: 'N/A', score: 0 },
    topStudents: [], // ✅ NEW: Top students list
    recentActivity: [],
    topicsWithWrongAnswers: [], // ✅ NEW: Topics where most students got wrong
    participationRate: 0,
    totalAttempts: 0,
    improvementTrend: [] // ✅ NEW: For tracking improvements
  });

  useEffect(() => {
    if (classroomId) {
      fetchClassroomAnalytics(classroomId).catch(err => {
        console.error('Error fetching classroom analytics:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  useEffect(() => {
    if (classroomAnalytics) {
      const overallStats = classroomAnalytics.overallStats || {};
      const studentProgress = classroomAnalytics.studentProgress || [];
      const weakTopics = classroomAnalytics.weakTopics || [];
      
      // ✅ FIXED: Use real totalQuizzes from backend
      const totalQuizzes = classroomAnalytics.totalQuizzes || overallStats.totalQuizzes || 0;
      
      // ✅ FIXED: Find top performer and top students from studentPerformance or studentProgress
      let topPerformer = { name: 'N/A', score: 0 };
      let topStudents = [];
      
      if (classroomAnalytics.studentPerformance && classroomAnalytics.studentPerformance.length > 0) {
        const sorted = [...classroomAnalytics.studentPerformance].sort((a, b) => 
          (b.averageScore || 0) - (a.averageScore || 0)
        );
        const top = sorted[0];
        topPerformer = {
          name: top.student?.fullName || top.student?.username || 'N/A',
          score: top.averageScore || 0,
          avatar: top.student?.avatar,
          quizzesCompleted: top.quizzesCompleted || 0
        };
        
        // ✅ NEW: Get top 10 students
        topStudents = sorted.slice(0, 10).map((student, index) => ({
          rank: index + 1,
          name: student.student?.fullName || student.student?.username || 'N/A',
          username: student.student?.username || '',
          avatar: student.student?.avatar,
          averageScore: Math.round(student.averageScore || 0),
          quizzesCompleted: student.quizzesCompleted || 0,
          totalTimeSpent: student.totalTimeSpent || 0,
          weakTopics: student.weakTopics || [],
          strongTopics: student.strongTopics || []
        }));
      } else if (studentProgress.length > 0) {
        const sorted = [...studentProgress].sort((a, b) => 
          (b.overallStats?.averageScore || 0) - (a.overallStats?.averageScore || 0)
        );
        const top = sorted[0];
        topPerformer = {
          name: top.student?.fullName || top.student?.username || 'N/A',
          score: Math.round(top.overallStats?.averageScore || 0),
          avatar: top.student?.avatar,
          quizzesCompleted: top.overallStats?.completedQuizzes || 0
        };
        
        // ✅ NEW: Get top 10 students
        topStudents = sorted.slice(0, 10).map((progress, index) => ({
          rank: index + 1,
          name: progress.student?.fullName || progress.student?.username || 'N/A',
          username: progress.student?.username || '',
          avatar: progress.student?.avatar,
          averageScore: Math.round(progress.overallStats?.averageScore || 0),
          quizzesCompleted: progress.overallStats?.completedQuizzes || 0,
          totalTimeSpent: progress.overallStats?.totalTimeSpent || 0,
          weakTopics: progress.weakTopics || [],
          strongTopics: progress.strongTopics || []
        }));
      }

      // ✅ FIXED: Use recentExamSessions from backend if available - Enhanced with more details
      let recentActivity = [];
      if (classroomAnalytics.recentExamSessions && classroomAnalytics.recentExamSessions.length > 0) {
        recentActivity = classroomAnalytics.recentExamSessions.slice(0, 10).map(session => ({
          student: session.student?.fullName || session.student?.username || 'Unknown',
          studentAvatar: session.student?.avatar,
          quiz: session.quiz?.title || 'Quiz',
          score: session.score || 0,
          totalMarks: session.totalMarks || 0,
          percentage: Math.round(session.percentage || 0),
          timeSpent: session.timeSpent || 0,
          date: session.completedAt || new Date(),
          status: (session.percentage || 0) >= 60 ? 'good' : (session.percentage || 0) >= 40 ? 'average' : 'poor'
        }));
      } else {
        // Fallback to student progress recent activity
        studentProgress.forEach(progress => {
          if (progress.recentActivity && progress.recentActivity.length > 0) {
            progress.recentActivity.slice(0, 3).forEach(activity => {
              recentActivity.push({
                student: progress.student?.fullName || progress.student?.username || 'Unknown',
                studentAvatar: progress.student?.avatar,
                quiz: activity.quiz?.title || 'Quiz',
                score: activity.score || 0,
                totalMarks: activity.totalMarks || 0,
                percentage: Math.round(activity.percentage || 0),
                timeSpent: activity.timeSpent || 0,
                date: activity.completedAt || new Date(),
                status: (activity.percentage || 0) >= 60 ? 'good' : (activity.percentage || 0) >= 40 ? 'average' : 'poor'
              });
            });
          }
        });
        recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
        recentActivity.splice(10);
      }

      // ✅ REMOVED: Weak areas removed from classroom analytics (kept only in quiz analytics)

      // ✅ NEW: Get topics with most wrong answers - only show top 5-7
      const topicsWithWrongAnswers = (classroomAnalytics.topicsWithWrongAnswers || []).slice(0, 7);

      setAnalyticsData({
        totalStudents: classroomAnalytics.totalStudents || overallStats.totalStudents || 0, // ✅ FIXED: Use from backend
        totalQuizzes: totalQuizzes, // ✅ Real quiz count
        averageScore: Math.round(overallStats.averageScore || 0),
        completionRate: Math.round(overallStats.completionRate || classroomAnalytics.participationRate || 0),
        topPerformer,
        topStudents, // ✅ NEW: Top students list
        recentActivity,
        topicsWithWrongAnswers, // ✅ NEW
        participationRate: Math.round(classroomAnalytics.participationRate || 0),
        totalAttempts: classroomAnalytics.totalAttempts || 0
      });
    }
  }, [classroomAnalytics]);

  if (loading && !classroomAnalytics) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <div className="text-center text-[#A0A0B8]">Loading analytics...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Classroom Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-white text-2xl font-bold">{analyticsData.totalStudents}</p>
            <p className="text-[#A0A0B8] text-sm">Students</p>
          </div>
          <div className="text-center">
            <p className="text-white text-2xl font-bold">{analyticsData.totalQuizzes}</p>
            <p className="text-[#A0A0B8] text-sm">Quizzes</p>
          </div>
          <div className="text-center">
            <p className="text-[#00FFA3] text-2xl font-bold">{analyticsData.averageScore}%</p>
            <p className="text-[#A0A0B8] text-sm">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="text-[#0082FB] text-2xl font-bold">{analyticsData.completionRate}%</p>
            <p className="text-[#A0A0B8] text-sm">Completion</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A0A0B8] text-sm">Total Students</p>
              <p className="text-white text-2xl font-bold mt-1">{analyticsData.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-[#0082FB] bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#0082FB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A0A0B8] text-sm">Total Quizzes</p>
              <p className="text-white text-2xl font-bold mt-1">{analyticsData.totalQuizzes}</p>
            </div>
            <div className="w-12 h-12 bg-[#00FFA3] bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A0A0B8] text-sm">Average Score</p>
              <p className="text-[#00FFA3] text-2xl font-bold mt-1">{analyticsData.averageScore}%</p>
            </div>
            <div className="w-12 h-12 bg-[#00FFA3] bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A0A0B8] text-sm">Completion Rate</p>
              <p className="text-[#0082FB] text-2xl font-bold mt-1">{analyticsData.completionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-[#0082FB] bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#0082FB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Top Students Section */}
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Top Students</h3>
        <div className="space-y-3">
          {analyticsData.topStudents.length > 0 ? (
            analyticsData.topStudents.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-[#2A2A3D] rounded-lg hover:bg-[#3A3A4D] transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-[#FFD700] text-[#0D0D14]' :
                    index === 1 ? 'bg-[#C0C0C0] text-[#0D0D14]' :
                    index === 2 ? 'bg-[#CD7F32] text-white' :
                    'bg-[#0082FB] text-white'
                  }`}>
                    {student.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{student.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-[#A0A0B8] text-sm">
                        {student.quizzesCompleted} quizzes completed
                      </p>
                      {student.strongTopics && student.strongTopics.length > 0 && (
                        <p className="text-[#00FFA3] text-xs">
                          Strong: {student.strongTopics.slice(0, 2).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    student.averageScore >= 80 ? 'text-[#00FFA3]' :
                    student.averageScore >= 60 ? 'text-[#FF9F5B]' : 'text-[#FF4D6D]'
                  }`}>
                    {student.averageScore}%
                  </p>
                  <p className="text-[#A0A0B8] text-xs">Avg Score</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[#A0A0B8]">
              <p>No student data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performer Highlight */}
        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <h3 className="text-white text-lg font-semibold mb-4">🏆 Top Performer</h3>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#00FFA3]/20 to-[#0082FB]/20 rounded-lg border border-[#00FFA3]/30">
            <div className="w-16 h-16 bg-[#00FFA3] bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-[#00FFA3] font-bold text-xl">1</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-lg">{analyticsData.topPerformer.name}</p>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-[#00FFA3] font-medium">
                  {analyticsData.topPerformer.score}% Average
                </p>
                {analyticsData.topPerformer.quizzesCompleted > 0 && (
                  <p className="text-[#A0A0B8] text-sm">
                    {analyticsData.topPerformer.quizzesCompleted} quizzes
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Topics with Most Wrong Answers */}
        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <h3 className="text-white text-lg font-semibold mb-4">Topics Where Students Struggled Most</h3>
          <div className="space-y-3">
            {analyticsData.topicsWithWrongAnswers.length > 0 ? (
              analyticsData.topicsWithWrongAnswers.map((topic, index) => (
                <div key={index} className="p-3 bg-[#2A2A3D] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{topic.topic}</span>
                    <span className="text-[#FF4D6D] text-sm font-medium">
                      {topic.studentsWhoGotWrongCount || 0} students struggled
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-[#A0A0B8]">
                      Wrong: <span className="text-[#FF4D6D]">{topic.wrongAnswers}</span> / {topic.totalQuestions}
                    </span>
                    <span className="text-[#A0A0B8]">
                      Accuracy: <span className="text-[#00FFA3]">{Math.round(topic.accuracy)}%</span>
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-[#1B1B28] rounded-full h-2">
                    <div 
                      className="bg-[#FF4D6D] h-2 rounded-full transition-all"
                      style={{ width: `${100 - topic.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-[#A0A0B8]">
                <p>No data available yet</p>
                <p className="text-sm mt-1">Topics will appear as students complete quizzes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participation Stats */}
        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <h3 className="text-white text-lg font-semibold mb-4">Participation Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#2A2A3D] rounded-lg">
              <span className="text-[#A0A0B8]">Total Attempts</span>
              <span className="text-white font-semibold">{analyticsData.totalAttempts}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#2A2A3D] rounded-lg">
              <span className="text-[#A0A0B8]">Participation Rate</span>
              <span className="text-[#00FFA3] font-semibold">{analyticsData.participationRate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#2A2A3D] rounded-lg">
              <span className="text-[#A0A0B8]">Average Score</span>
              <span className="text-[#0082FB] font-semibold">{analyticsData.averageScore}%</span>
            </div>
          </div>
        </div>

        {/* Score Distribution Chart */}
        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <h3 className="text-white text-lg font-semibold mb-4">Score Distribution</h3>
          <ScoreDistributionChart topStudents={analyticsData.topStudents} />
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Performance Trend</h3>
        <PerformanceTrendChart recentActivity={analyticsData.recentActivity} />
      </div>

      {/* Recent Activity - Enhanced */}
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Recent Activity</h3>
          <span className="text-[#A0A0B8] text-sm">
            Last {analyticsData.recentActivity.length} activities
          </span>
        </div>
        <div className="space-y-3">
          {analyticsData.recentActivity.length > 0 ? (
            analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-[#2A2A3D] rounded-lg hover:bg-[#3A3A4D] transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    activity.status === 'good' ? 'bg-[#00FFA3] bg-opacity-20' :
                    activity.status === 'average' ? 'bg-[#FF9F5B] bg-opacity-20' :
                    'bg-[#FF4D6D] bg-opacity-20'
                  }`}>
                    {activity.studentAvatar ? (
                      <img 
                        src={activity.studentAvatar} 
                        alt={activity.student}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className={`text-lg font-semibold ${
                        activity.status === 'good' ? 'text-[#00FFA3]' :
                        activity.status === 'average' ? 'text-[#FF9F5B]' :
                        'text-[#FF4D6D]'
                      }`}>
                        {activity.student.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.student}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[#A0A0B8] text-sm">Completed <span className="text-white">{activity.quiz}</span></p>
                      {activity.timeSpent > 0 && (
                        <span className="text-[#A0A0B8] text-xs">
                          • {Math.round(activity.timeSpent / 60)} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-lg ${
                      activity.percentage >= 80 ? 'text-[#00FFA3]' :
                      activity.percentage >= 60 ? 'text-[#FF9F5B]' : 'text-[#FF4D6D]'
                    }`}>
                      {activity.percentage}%
                    </p>
                    {activity.percentage >= 80 && (
                      <span className="text-[#00FFA3]">✓</span>
                    )}
                  </div>
                  <p className="text-[#A0A0B8] text-xs mt-1">
                    {activity.score}/{activity.totalMarks}
                  </p>
                  <p className="text-[#A0A0B8] text-xs">
                    {new Date(activity.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[#A0A0B8]">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No recent activity</p>
              <p className="text-sm mt-1">Activity will appear as students complete quizzes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;