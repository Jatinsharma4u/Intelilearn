import React, { useState, useEffect } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';

const StudentProgress = ({ classroomId, compact = false }) => {
  const { fetchStudentResults, studentResults, loading } = useClassroom();
  const [progressData, setProgressData] = useState({
    overallScore: 0,
    quizzesCompleted: 0,
    totalQuizzes: 0,
    averageTime: '0m',
    weakTopics: [],
    recentQuizzes: [],
    progressTrend: []
  });

  useEffect(() => {
    if (classroomId) {
      // ✅ FIXED: Reset state before fetching
      setProgressData({
        overallScore: 0,
        quizzesCompleted: 0,
        totalQuizzes: 0,
        averageTime: '0m',
        weakTopics: [],
        recentQuizzes: [],
        progressTrend: []
      });
      fetchStudentResults(classroomId).catch(err => {
        console.error('Error fetching student results:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  useEffect(() => {
    // ✅ FIXED: Backend returns { success: true, examSessions: [], progress: {...} }
    if (studentResults) {
      // Handle both direct response and nested response
      const results = studentResults.examSessions ? studentResults : (studentResults.data || studentResults);
      const progress = results.progress || studentResults.progress || {};
      const overallStats = progress.overallStats || {};
      const topicPerformance = progress.topicPerformance || [];
      const recentActivity = progress.recentActivity || [];
      const examSessions = results.examSessions || studentResults.examSessions || [];

      // Format average time
      const totalMinutes = overallStats.totalTimeSpent || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const averageTime = hours > 0 
        ? `${hours}h ${minutes}m` 
        : `${minutes}m`;

      // ✅ IMPROVED: Get weak topics with detailed information
      const weakTopics = topicPerformance
        .filter(topic => (topic.accuracy || 0) < 0.6)
        .map(topic => ({
          topic: topic.topic || 'Unknown',
          score: Math.round((topic.accuracy || 0) * 100),
          totalQuestions: topic.totalQuestions || 0,
          correctAnswers: topic.correctAnswers || 0,
          wrongAnswers: (topic.totalQuestions || 0) - (topic.correctAnswers || 0),
          averageTime: topic.averageTime || 0,
          improvement: 0 // Can be calculated from historical data if needed
        }))
        .sort((a, b) => a.score - b.score) // Sort by worst performance first
        .slice(0, 8); // Show top 8 weak topics

      // ✅ IMPROVED: Get recent quizzes with weak points per quiz
      const recentQuizzes = recentActivity.map(activity => {
        const timeSpentSeconds = activity.timeSpent || 0;
        const minutes = Math.floor(timeSpentSeconds / 60);
        const seconds = timeSpentSeconds % 60;
        
        // Get weak topics for this specific quiz from exam sessions
        const session = examSessions.find(s => 
          s.quiz?._id?.toString() === activity.quiz?._id?.toString() ||
          s.quiz?.toString() === activity.quiz?.toString()
        );
        
        const quizWeakTopics = session?.topicsPerformance
          ?.filter(tp => (tp.percentage || 0) < 60)
          .map(tp => tp.topic)
          .slice(0, 3) || [];
        
        return {
          name: activity.quiz?.title || 'Quiz',
          quizId: activity.quiz?._id || activity.quiz,
          score: Math.round(activity.percentage || 0),
          date: activity.completedAt || new Date(),
          timeSpent: `${minutes}m ${seconds}s`,
          weakTopics: quizWeakTopics // ✅ NEW: Weak topics for this quiz
        };
      }).slice(0, 6);

      // Calculate progress trend from recent activities
      const progressTrend = recentActivity
        .slice(-6)
        .map(activity => Math.round(activity.percentage || 0));

      // Get total quizzes from exam sessions
      const totalQuizzes = examSessions.length;

      setProgressData({
        overallScore: Math.round(overallStats.averageScore || 0),
        quizzesCompleted: overallStats.completedQuizzes || 0,
        totalQuizzes: totalQuizzes || 0,
        averageTime,
        weakTopics,
        recentQuizzes,
        progressTrend: progressTrend.length > 0 ? progressTrend : [0]
      });
    } else if (studentResults && !progress && examSessions.length === 0) {
      // No data available - set empty state
      setProgressData({
        overallScore: 0,
        quizzesCompleted: 0,
        totalQuizzes: 0,
        averageTime: '0m',
        weakTopics: [],
        recentQuizzes: [],
        progressTrend: [0]
      });
    }
  }, [studentResults]);

  // ✅ FIXED: Show loading only if we don't have any data yet and actually loading
  // Check if we're loading AND don't have data yet
  const isLoading = loading && !studentResults;
  const hasNoData = !loading && (!studentResults || (!studentResults.progress && (!studentResults.examSessions || studentResults.examSessions.length === 0)));
  
  if (isLoading) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">My Progress</h3>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0082FB] mb-4"></div>
          <p className="text-[#A0A0B8]">Loading progress...</p>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Show empty state if no data (but not if still loading)
  if (hasNoData) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">My Progress</h3>
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50 text-[#A0A0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-[#A0A0B8] mb-2">No progress data available yet</p>
          <p className="text-[#A0A0B8] text-sm">Complete quizzes to see your progress here</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-[#00FFA3]';
    if (score >= 60) return 'text-[#FF9F5B]';
    return 'text-[#FF4D6D]';
  };

  const getImprovementColor = (improvement) => {
    if (improvement > 0) return 'text-[#00FFA3]';
    if (improvement < 0) return 'text-[#FF4D6D]';
    return 'text-[#A0A0B8]';
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-[#2A2A3D] rounded-lg">
            <p className={`text-2xl font-bold ${getScoreColor(progressData.overallScore)}`}>
              {progressData.overallScore}%
            </p>
            <p className="text-[#A0A0B8] text-xs mt-1">Overall</p>
          </div>
          <div className="text-center p-3 bg-[#2A2A3D] rounded-lg">
            <p className="text-white text-2xl font-bold">
              {progressData.quizzesCompleted}/{progressData.totalQuizzes}
            </p>
            <p className="text-[#A0A0B8] text-xs mt-1">Completed</p>
          </div>
          <div className="text-center p-3 bg-[#2A2A3D] rounded-lg">
            <p className="text-white text-2xl font-bold">{progressData.averageTime}</p>
            <p className="text-[#A0A0B8] text-xs mt-1">Avg Time</p>
          </div>
          <div className="text-center p-3 bg-[#2A2A3D] rounded-lg">
            <p className="text-[#00FFA3] text-2xl font-bold">
              {progressData.weakTopics.length > 0 ? progressData.weakTopics.length : 0}
            </p>
            <p className="text-[#A0A0B8] text-xs mt-1">Weak Areas</p>
          </div>
        </div>

        {/* ✅ NEW: Weak Topics Section in Compact Mode */}
        {progressData.weakTopics && progressData.weakTopics.length > 0 && (
          <div className="bg-[#2A2A3D] rounded-lg p-4 border border-[#FF4D6D] border-opacity-30">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[#FF4D6D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-white font-medium text-sm">Weak Topics - Need Improvement</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {progressData.weakTopics.slice(0, 6).map((topic, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-[#FF4D6D] bg-opacity-20 rounded-lg border border-[#FF4D6D] border-opacity-30">
                  <span className="text-[#FF4D6D] text-xs font-medium">{topic.topic || topic}</span>
                  <span className="text-[#FF4D6D] text-xs">({topic.score || 0}%)</span>
                </div>
              ))}
            </div>
            {progressData.weakTopics.length > 6 && (
              <p className="text-[#A0A0B8] text-xs mt-2">
                +{progressData.weakTopics.length - 6} more weak topics
              </p>
            )}
          </div>
        )}

        {/* Progress Trend Mini */}
        {progressData.progressTrend && progressData.progressTrend.length > 0 && (
          <div className="bg-[#2A2A3D] rounded-lg p-4">
            <p className="text-[#A0A0B8] text-xs mb-2">Recent Performance</p>
            <div className="h-16 flex items-end justify-between gap-1">
              {progressData.progressTrend.slice(-5).map((score, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t transition-all ${
                      score >= 80 ? 'bg-[#00FFA3]' : 
                      score >= 60 ? 'bg-[#FF9F5B]' : 'bg-[#FF4D6D]'
                    }`}
                    style={{ height: `${Math.max((score / 100) * 100, 10)}%` }}
                    title={`${score}%`}
                  ></div>
                  <span className="text-[#A0A0B8] text-xs mt-1">{score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A0A0B8] text-sm">Overall Score</p>
              <p className={`text-2xl font-bold mt-1 ${getScoreColor(progressData.overallScore)}`}>
                {progressData.overallScore}%
              </p>
            </div>
            <div className="w-12 h-12 bg-[#0082FB] bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#0082FB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A0A0B8] text-sm">Quizzes Completed</p>
              <p className="text-white text-2xl font-bold mt-1">
                {progressData.quizzesCompleted}/{progressData.totalQuizzes}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#00FFA3] bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A0A0B8] text-sm">Average Time</p>
              <p className="text-white text-2xl font-bold mt-1">{progressData.averageTime}</p>
            </div>
            <div className="w-12 h-12 bg-[#FF9F5B] bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#FF9F5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A0A0B8] text-sm">Improvement</p>
              <p className="text-[#00FFA3] text-2xl font-bold mt-1">+13%</p>
            </div>
            <div className="w-12 h-12 bg-[#00FFA3] bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Progress Trend</h3>
        <div className="h-48 flex items-end justify-between gap-2">
          {progressData.progressTrend.map((score, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-[#0082FB] rounded-t transition-all duration-500"
                style={{ height: `${(score / 100) * 80}%` }}
              ></div>
              <span className="text-[#A0A0B8] text-xs mt-2">Q{index + 1}</span>
              <span className="text-white text-sm font-medium">{score}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ✅ IMPROVED: Weak Topics with detailed breakdown and better UI */}
        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-[#FF4D6D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-white text-lg font-semibold">Weak Points - Areas to Improve</h3>
          </div>
          <div className="space-y-3">
            {progressData.weakTopics.length > 0 ? (
              progressData.weakTopics.map((topic, index) => (
                <div key={index} className="p-4 bg-[#2A2A3D] rounded-lg border border-[#FF4D6D] border-opacity-20 hover:border-opacity-40 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-base">{topic.topic || topic}</span>
                      <span className="px-2 py-0.5 bg-[#FF4D6D] bg-opacity-20 text-[#FF4D6D] text-xs rounded-full font-medium">
                        Needs Work
                      </span>
                    </div>
                    <span className={`text-lg font-bold ${getScoreColor(topic.score)}`}>
                      {topic.score}%
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-[#1B1B28] rounded-full h-3 mb-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        topic.score >= 80 ? 'bg-[#00FFA3]' : 
                        topic.score >= 60 ? 'bg-[#FF9F5B]' : 'bg-[#FF4D6D]'
                      }`}
                      style={{ width: `${Math.max(topic.score, 5)}%` }}
                    ></div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#00FFA3] rounded-full"></div>
                      <span className="text-[#A0A0B8]">Correct:</span>
                      <span className="text-[#00FFA3] font-semibold">{topic.correctAnswers || 0}</span>
                      <span className="text-[#A0A0B8]">/ {topic.totalQuestions || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#FF4D6D] rounded-full"></div>
                      <span className="text-[#A0A0B8]">Wrong:</span>
                      <span className="text-[#FF4D6D] font-semibold">{topic.wrongAnswers || 0}</span>
                    </div>
                  </div>
                  
                  {/* Accuracy */}
                  <div className="mt-2 pt-2 border-t border-[#1B1B28]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#A0A0B8] text-xs">Accuracy</span>
                      <span className={`text-xs font-semibold ${getScoreColor(topic.score)}`}>
                        {topic.score}% accuracy
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-[#A0A0B8]">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#00FFA3] bg-opacity-10 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-1">No weak areas identified!</p>
                <p className="text-sm">Great job! Keep up the excellent work</p>
              </div>
            )}
          </div>
        </div>

        {/* ✅ IMPROVED: Recent Quizzes with Weak Points */}
        <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
          <h3 className="text-white text-lg font-semibold mb-4">Recent Quizzes</h3>
          <div className="space-y-4">
            {progressData.recentQuizzes.length > 0 ? (
              progressData.recentQuizzes.map((quiz, index) => (
                <div key={index} className="p-4 bg-[#2A2A3D] rounded-lg hover:bg-[#3A3A4D] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{quiz.name}</p>
                    <p className={`font-semibold text-lg ${getScoreColor(quiz.score)}`}>
                      {quiz.score}%
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#A0A0B8] mb-2">
                    <span>{new Date(quiz.date).toLocaleDateString()}</span>
                    <span>• {quiz.timeSpent}</span>
                  </div>
                  {/* ✅ NEW: Show weak topics for this quiz */}
                  {quiz.weakTopics && quiz.weakTopics.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#1B1B28]">
                      <p className="text-[#FF4D6D] text-xs font-medium mb-2">⚠️ Weak in this quiz:</p>
                      <div className="flex flex-wrap gap-2">
                        {quiz.weakTopics.map((topic, idx) => (
                          <span key={idx} className="px-2 py-1 bg-[#FF4D6D] bg-opacity-20 text-[#FF4D6D] text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[#A0A0B8]">
                <p>No quizzes completed yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;