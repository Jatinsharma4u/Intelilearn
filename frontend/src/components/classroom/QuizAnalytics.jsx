import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassroom } from '../../contexts/ClassroomContext';
import Loader from '../ui/Loader';

const QuizAnalytics = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { fetchQuizAnalytics, exportQuizResults, quizAnalytics, loading } = useClassroom();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (quizId) {
      fetchQuizAnalytics(quizId);
    }
  }, [quizId]);

  const handleExport = async () => {
    try {
      const response = await exportQuizResults(quizId);
      
      // Convert to CSV
      const csv = convertToCSV(response.data);
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', response.filename.replace('.json', '.csv'));
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert(`Failed to export: ${error.message}`);
    }
  };

  const convertToCSV = (data) => {
    if (!data.studentResults || data.studentResults.length === 0) return '';
    
    // Headers
    const headers = Object.keys(data.studentResults[0]).join(',');
    
    // Rows
    const rows = data.studentResults.map(row => {
      return Object.values(row).map(val => {
        // Escape commas and quotes in values
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
    });
    
    return [headers, ...rows].join('\n');
  };

  if (loading && !quizAnalytics) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  if (!quizAnalytics) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">No analytics data available</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#0082FB] text-white rounded-lg hover:bg-[#0064E0]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { quiz, statistics, studentPerformance, topicPerformance, weakTopics } = quizAnalytics;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Student Performance' },
    { id: 'topics', label: 'Topic Analysis' },
    { id: 'leaderboard', label: 'Leaderboard' }
  ];

  return (
    <div className="min-h-screen bg-[#0D0D14] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B1B28] to-[#2A2A3D] border-b border-[#2A2A3D]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="mb-4 text-[#A0A0B8] hover:text-white flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-3xl font-bold text-white mb-2">{quiz.title}</h1>
              <p className="text-[#A0A0B8]">{quiz.description || 'Quiz Analytics'}</p>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-[#00FFA3] text-[#0D0D14] rounded-lg font-medium hover:bg-[#00E693] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1B1B28] border-b border-[#2A2A3D]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#0082FB] border-b-2 border-[#0082FB]'
                    : 'text-[#A0A0B8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <p className="text-[#A0A0B8] text-sm mb-2">Total Attempts</p>
                <p className="text-white text-3xl font-bold">{statistics.totalAttempts}</p>
              </div>
              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <p className="text-[#A0A0B8] text-sm mb-2">Students Attempted</p>
                <p className="text-white text-3xl font-bold">
                  {statistics.totalStudents || 0}
                  {statistics.totalStudentsInClassroom > 0 && (
                    <span className="text-lg text-[#A0A0B8]"> / {statistics.totalStudentsInClassroom}</span>
                  )}
                </p>
                {statistics.attemptRate > 0 && (
                  <p className="text-[#00FFA3] text-sm mt-1">{statistics.attemptRate}% participation</p>
                )}
              </div>
              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <p className="text-[#A0A0B8] text-sm mb-2">Average Score</p>
                <p className="text-[#00FFA3] text-3xl font-bold">{statistics.averageScore}%</p>
              </div>
              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <p className="text-[#A0A0B8] text-sm mb-2">Passing Rate</p>
                <p className="text-[#0082FB] text-3xl font-bold">{statistics.passingRate}%</p>
              </div>
            </div>

            {/* ✅ NEW: Attempt Statistics */}
            {statistics.totalStudentsInClassroom > 0 && (
              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <h3 className="text-white text-lg font-semibold mb-4">Participation Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#2A2A3D] rounded-lg">
                    <p className="text-[#A0A0B8] text-sm mb-2">Total Students</p>
                    <p className="text-white text-2xl font-bold">{statistics.totalStudentsInClassroom}</p>
                  </div>
                  <div className="p-4 bg-[#2A2A3D] rounded-lg">
                    <p className="text-[#A0A0B8] text-sm mb-2">Attempted</p>
                    <p className="text-[#00FFA3] text-2xl font-bold">{statistics.totalStudents || 0}</p>
                  </div>
                  <div className="p-4 bg-[#2A2A3D] rounded-lg">
                    <p className="text-[#A0A0B8] text-sm mb-2">Not Attempted</p>
                    <p className="text-[#FF4D6D] text-2xl font-bold">{statistics.studentsNotAttempted || 0}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#A0A0B8] text-sm">Participation Rate</span>
                    <span className="text-[#00FFA3] font-semibold">{statistics.attemptRate || 0}%</span>
                  </div>
                  <div className="w-full bg-[#2A2A3D] rounded-full h-3">
                    <div
                      className="bg-[#00FFA3] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${statistics.attemptRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Score Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <h3 className="text-white text-lg font-semibold mb-4">Score Range</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A0A0B8]">Highest Score</span>
                    <span className="text-[#00FFA3] font-semibold">{statistics.highestScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A0A0B8]">Lowest Score</span>
                    <span className="text-[#FF4D6D] font-semibold">{statistics.lowestScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A0A0B8]">Average Score</span>
                    <span className="text-white font-semibold">{statistics.averageScore}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <h3 className="text-white text-lg font-semibold mb-4">Pass/Fail Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A0A0B8]">Passed</span>
                    <span className="text-[#00FFA3] font-semibold">{statistics.passedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A0A0B8]">Failed</span>
                    <span className="text-[#FF4D6D] font-semibold">{statistics.failedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A0A0B8]">Passing Marks</span>
                    <span className="text-white font-semibold">{quiz.passingMarks}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weak Topics */}
            {weakTopics && weakTopics.length > 0 && (
              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <h3 className="text-white text-lg font-semibold mb-4">Topics Needing Attention</h3>
                <div className="space-y-3">
                  {weakTopics.map((topic, index) => (
                    <div key={index} className="p-3 bg-[#2A2A3D] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{topic.topic}</span>
                        <span className="text-[#FF4D6D] text-sm">
                          {topic.studentsWhoGotWrong} students struggled
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-[#A0A0B8]">
                          Accuracy: <span className="text-[#FF4D6D]">{Math.round(topic.accuracy)}%</span>
                        </span>
                        <span className="text-[#A0A0B8]">
                          Wrong: <span className="text-[#FF4D6D]">{topic.wrongAnswers}</span> / {topic.totalQuestions}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Student Performance Tab */}
        {activeTab === 'students' && (
          <div className="bg-[#1B1B28] rounded-lg border border-[#2A2A3D] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2A2A3D]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#A0A0B8] uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#A0A0B8] uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#A0A0B8] uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#A0A0B8] uppercase">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#A0A0B8] uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#A0A0B8] uppercase">Time Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A3D]">
                  {studentPerformance.map((student, index) => (
                    <tr key={index} className="hover:bg-[#2A2A3D]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-semibold">#{student.rank}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0082FB] flex items-center justify-center text-white font-semibold">
                            {student.student.fullName?.charAt(0) || student.student.username?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-white font-medium">{student.student.fullName || student.student.username}</p>
                            <p className="text-[#A0A0B8] text-sm">{student.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white">{student.score} / {student.totalMarks}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-semibold ${
                          student.percentage >= 80 ? 'text-[#00FFA3]' :
                          student.percentage >= 60 ? 'text-[#FF9F5B]' : 'text-[#FF4D6D]'
                        }`}>
                          {Math.round(student.percentage)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.passed
                            ? 'bg-[#00FFA3] bg-opacity-20 text-[#00FFA3]'
                            : 'bg-[#FF4D6D] bg-opacity-20 text-[#FF4D6D]'
                        }`}>
                          {student.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#A0A0B8]">{Math.round((student.timeSpent || 0) / 60)} min</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Topic Analysis Tab */}
        {activeTab === 'topics' && (
          <div className="space-y-6">
            {topicPerformance && topicPerformance.length > 0 ? (
              topicPerformance.map((topic, index) => (
                <div key={index} className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-lg font-semibold">{topic.topic}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      topic.accuracy >= 80 ? 'bg-[#00FFA3] bg-opacity-20 text-[#00FFA3]' :
                      topic.accuracy >= 60 ? 'bg-[#FF9F5B] bg-opacity-20 text-[#FF9F5B]' :
                      'bg-[#FF4D6D] bg-opacity-20 text-[#FF4D6D]'
                    }`}>
                      {Math.round(topic.accuracy)}% Accuracy
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-[#A0A0B8] text-sm">Total Questions</p>
                      <p className="text-white text-xl font-semibold">{topic.totalQuestions}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0B8] text-sm">Correct</p>
                      <p className="text-[#00FFA3] text-xl font-semibold">{topic.correctAnswers}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0B8] text-sm">Wrong</p>
                      <p className="text-[#FF4D6D] text-xl font-semibold">{topic.wrongAnswers}</p>
                    </div>
                  </div>
                  <div className="w-full bg-[#2A2A3D] rounded-full h-2">
                    <div
                      className="bg-[#00FFA3] h-2 rounded-full transition-all"
                      style={{ width: `${topic.accuracy}%` }}
                    ></div>
                  </div>
                  {topic.studentsWhoGotWrong > 0 && (
                    <p className="text-[#A0A0B8] text-sm mt-2">
                      {topic.studentsWhoGotWrong} students struggled with this topic
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-[#1B1B28] rounded-lg p-12 text-center border border-[#2A2A3D]">
                <p className="text-[#A0A0B8]">No topic data available</p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-[#1B1B28] rounded-lg border border-[#2A2A3D] overflow-hidden">
            <div className="p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Top Performers</h3>
              <div className="space-y-4">
                {studentPerformance.slice(0, 10).map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-[#2A2A3D] rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-[#FFD700] text-[#0D0D14]' :
                        index === 1 ? 'bg-[#C0C0C0] text-[#0D0D14]' :
                        index === 2 ? 'bg-[#CD7F32] text-white' :
                        'bg-[#0082FB] text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{student.student.fullName || student.student.username}</p>
                        <p className="text-[#A0A0B8] text-sm">{student.student.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#00FFA3] font-semibold text-lg">{Math.round(student.percentage)}%</p>
                      <p className="text-[#A0A0B8] text-sm">{student.score} / {student.totalMarks}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizAnalytics;

