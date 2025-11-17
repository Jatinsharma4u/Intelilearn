import React, { useState, useEffect } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';

const QuizProgress = ({ quizId, sessionId, sessionData }) => {
  const { fetchQuizAnalytics, quizAnalytics, loading } = useClassroom();
  const [progressData, setProgressData] = useState({
    score: 0,
    percentage: 0,
    rank: 0,
    totalAttempts: 0,
    averageScore: 0,
    weakTopics: [],
    timeSpent: 0,
    totalMarks: 0
  });

  useEffect(() => {
    if (quizId) {
      fetchQuizAnalytics(quizId).catch(err => {
        console.error('Error fetching quiz analytics:', err);
      });
    }
  }, [quizId]);

  useEffect(() => {
    // ✅ FIXED: Handle both analytics format and direct response
    const analytics = quizAnalytics?.analytics || quizAnalytics;
    
    if (analytics && analytics.studentPerformance) {
      // Find current student's performance by matching session ID
      const currentStudent = analytics.studentPerformance.find(
        student => student.sessionId === sessionId || 
                  student.student?._id?.toString() === sessionId
      );

      if (currentStudent) {
        // Get weak topics from topic performance or weakTopics array
        const weakTopics = analytics.weakTopics?.map(t => t.topic || t) || [];
        
        setProgressData({
          score: currentStudent.score || 0,
          percentage: currentStudent.percentage || 0,
          rank: currentStudent.rank || 0,
          totalAttempts: analytics.statistics?.totalAttempts || 0,
          averageScore: analytics.statistics?.averageScore || 0,
          weakTopics: weakTopics,
          timeSpent: currentStudent.timeSpent || 0,
          totalMarks: currentStudent.totalMarks || 0
        });
      }
    } else if (sessionData) {
      // ✅ FALLBACK: Use session data if analytics not available
      setProgressData({
        score: sessionData.score || 0,
        percentage: sessionData.percentage || 0,
        rank: 0,
        totalAttempts: 0,
        averageScore: 0,
        weakTopics: [],
        timeSpent: sessionData.timeSpent || 0,
        totalMarks: sessionData.totalMarks || 0
      });
    }
  }, [quizAnalytics, sessionId, sessionData]);

  if (loading && !quizAnalytics && !sessionData) {
    return (
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0082FB] mb-4"></div>
          <p className="text-[#A0A0B8]">Loading quiz progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Your Performance in This Quiz</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-[#2A2A3D] rounded-lg">
            <p className="text-[#A0A0B8] text-sm mb-1">Your Score</p>
            <p className="text-white text-2xl font-bold">{progressData.score}/{progressData.totalMarks || 'N/A'}</p>
          </div>
          <div className="text-center p-4 bg-[#2A2A3D] rounded-lg">
            <p className="text-[#A0A0B8] text-sm mb-1">Percentage</p>
            <p className="text-[#00FFA3] text-2xl font-bold">{progressData.percentage}%</p>
          </div>
          <div className="text-center p-4 bg-[#2A2A3D] rounded-lg">
            <p className="text-[#A0A0B8] text-sm mb-1">Your Rank</p>
            <p className="text-[#0082FB] text-2xl font-bold">#{progressData.rank || 'N/A'}</p>
          </div>
          <div className="text-center p-4 bg-[#2A2A3D] rounded-lg">
            <p className="text-[#A0A0B8] text-sm mb-1">Class Average</p>
            <p className="text-white text-2xl font-bold">{Math.round(progressData.averageScore)}%</p>
          </div>
        </div>

        {progressData.weakTopics && progressData.weakTopics.length > 0 && (
          <div className="mt-6">
            <h4 className="text-white font-medium mb-3">Topics to Improve</h4>
            <div className="flex flex-wrap gap-2">
              {progressData.weakTopics.map((topic, index) => (
                <span key={index} className="px-3 py-1 bg-[#FF4D6D] bg-opacity-20 text-[#FF4D6D] text-sm rounded-full">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizProgress;
