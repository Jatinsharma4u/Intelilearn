import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassroom } from '../../contexts/ClassroomContext';
import QuestionDisplay from './QuestionDisplay';
import ExportButton from './ExportButton';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../ui/Loader';

const ExamResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { 
    examSessionDetails, 
    fetchExamSessionDetails, 
    loading 
  } = useClassroom();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('summary');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [studentRank, setStudentRank] = useState(null);

  useEffect(() => {
    if (sessionId) {
      fetchExamSessionDetails(sessionId);
    }
  }, [sessionId]);

  // ✅ NEW: Extract total attempts and rank from exam session details
  useEffect(() => {
    if (examSessionDetails) {
      // Backend returns { success: true, examSession: {...}, totalAttempts: number, studentRank: number }
      const attempts = examSessionDetails?.totalAttempts || 0;
      const rank = examSessionDetails?.studentRank || null;
      setTotalAttempts(attempts);
      setStudentRank(rank);
    }
  }, [examSessionDetails]);

  const isTeacher = user?.role === 'teacher';

  if (loading || !examSessionDetails) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  // Extract data from examSessionDetails (backend structure)
  // Backend returns { success: true, examSession: {...} }
  const session = examSessionDetails?.examSession || examSessionDetails?.session || examSessionDetails;
  const quiz = session?.quiz || {};
  const answers = session?.answers || [];
  
  const quizTitle = quiz?.title || 'Exam Results';
  const score = session?.score || 0;
  const totalScore = session?.totalMarks || quiz?.questions?.length || 0;
  const percentage = session?.percentage || 0;
  const timeSpentSeconds = session?.timeSpent || 0;
  const timeSpent = timeSpentSeconds > 0 
    ? `${Math.floor(timeSpentSeconds / 60)}m ${timeSpentSeconds % 60}s` 
    : '0m';
  const completedAt = session?.endTime || session?.completedAt || new Date();
  const questions = quiz?.questions || [];
  const classroomId = session?.classroom?._id || session?.classroom;
  const quizId = quiz?._id || session?.quiz?._id || session?.quiz;

  const tabs = isTeacher 
    ? [
        { id: 'summary', label: 'Summary' },
        { id: 'review', label: 'Question Review' },
        { id: 'analytics', label: 'Analytics' }
      ]
    : [
        { id: 'summary', label: 'Summary' },
        { id: 'review', label: 'Review Answers' }
      ];

  return (
    <div className="min-h-screen bg-[#0D0D14] text-white">
      {/* Header */}
      <div className="bg-[#1B1B28] border-b border-[#2A2A3D]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#A0A0B8] hover:text-white mb-4 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              
              <h1 className="text-3xl font-bold mb-2">Exam Results</h1>
              <p className="text-[#A0A0B8] text-lg">{quizTitle}</p>
            </div>

            {isTeacher && classroomId && (
              <div className="flex items-center gap-4">
                <ExportButton classroomId={classroomId} />
              </div>
            )}
          </div>

          {/* Score Summary */}
          <div className={`grid grid-cols-2 ${totalAttempts > 0 || studentRank ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-6 mt-8`}>
            <div className="text-center">
              <p className="text-white text-3xl font-bold">{score}/{totalScore}</p>
              <p className="text-[#A0A0B8] text-sm">Score</p>
            </div>
            <div className="text-center">
              <p className="text-[#00FFA3] text-3xl font-bold">{percentage}%</p>
              <p className="text-[#A0A0B8] text-sm">Percentage</p>
            </div>
            {/* ✅ NEW: Student Rank */}
            {studentRank && !isTeacher && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <svg className="w-6 h-6 text-[#FFD700]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <p className="text-[#FFD700] text-3xl font-bold">#{studentRank}</p>
                </div>
                <p className="text-[#A0A0B8] text-sm">Your Rank</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-white text-3xl font-bold">{timeSpent}</p>
              <p className="text-[#A0A0B8] text-sm">Time Spent</p>
            </div>
            <div className="text-center">
              <p className="text-white text-3xl font-bold">
                {new Date(completedAt).toLocaleDateString()}
              </p>
              <p className="text-[#A0A0B8] text-sm">Completed</p>
            </div>
            {/* ✅ NEW: Total Students Attempted */}
            {totalAttempts > 0 && (
              <div className="text-center">
                <p className="text-[#0082FB] text-3xl font-bold">{totalAttempts}</p>
                <p className="text-[#A0A0B8] text-sm">Students Attempted</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="border-b border-[#2A2A3D] mb-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#0082FB] text-[#0082FB]'
                    : 'border-transparent text-[#A0A0B8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Overview */}
              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <h3 className="text-white text-lg font-semibold mb-4">Performance Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#A0A0B8]">Correct Answers</span>
                      <span className="text-[#00FFA3] font-semibold">{score}/{totalScore}</span>
                    </div>
                    <div className="w-full bg-[#2A2A3D] rounded-full h-3">
                      <div 
                        className="bg-[#00FFA3] h-3 rounded-full"
                        style={{ width: `${(score / totalScore) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#A0A0B8]">Incorrect Answers</span>
                      <span className="text-[#FF4D6D] font-semibold">
                        {totalScore - score}/{totalScore}
                      </span>
                    </div>
                    <div className="w-full bg-[#2A2A3D] rounded-full h-3">
                      <div 
                        className="bg-[#FF4D6D] h-3 rounded-full"
                        style={{ width: `${((totalScore - score) / totalScore) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <h3 className="text-white text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  {/* ✅ NEW: Your Rank */}
                  {studentRank && !isTeacher && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 rounded-lg border border-[#FFD700]/30">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#FFD700]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-[#A0A0B8]">Your Rank</span>
                      </div>
                      <span className="text-[#FFD700] font-bold text-lg">#{studentRank}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-3 bg-[#2A2A3D] rounded-lg">
                    <span className="text-[#A0A0B8]">Accuracy Rate</span>
                    <span className="text-[#00FFA3] font-semibold">{percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#2A2A3D] rounded-lg">
                    <span className="text-[#A0A0B8]">Time Per Question</span>
                    <span className="text-white font-semibold">
                      {timeSpentSeconds > 0 && totalScore > 0 
                        ? `${Math.round(timeSpentSeconds / totalScore)}s` 
                        : '0s'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#2A2A3D] rounded-lg">
                    <span className="text-[#A0A0B8]">Completion Time</span>
                    <span className="text-white font-semibold">{timeSpent}</span>
                  </div>
                  {/* ✅ NEW: Total Attempts */}
                  {totalAttempts > 0 && !isTeacher && (
                    <div className="flex justify-between items-center p-3 bg-[#2A2A3D] rounded-lg">
                      <span className="text-[#A0A0B8]">Total Attempts</span>
                      <span className="text-[#0082FB] font-semibold">{totalAttempts} students</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Review Tab */}
          {activeTab === 'review' && (
            <div className="space-y-6">
              {/* Question Navigation */}
              <div className="flex flex-wrap gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentQuestionIndex === index
                        ? 'bg-[#0082FB] text-white'
                        : answers[index]?.isCorrect
                        ? 'bg-[#00FFA3] text-[#0D0D14]'
                        : 'bg-[#FF4D6D] text-white'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* ✅ IMPROVED: Current Question Review with better data extraction */}
              {questions[currentQuestionIndex] && (() => {
                const question = questions[currentQuestionIndex];
                const answer = answers[currentQuestionIndex];
                const options = question.options?.map(opt => opt.text) || [];
                
                // ✅ FIXED: Find correct answer index
                const correctIndex = question.options?.findIndex(opt => opt.isCorrect) ?? -1;
                const correctAnswerText = question.correctAnswer || (correctIndex >= 0 ? options[correctIndex] : '');
                
                // ✅ FIXED: Find selected answer index - handle both text and index
                let selectedIndex = -1;
                if (answer?.selectedAnswer !== undefined && answer.selectedAnswer !== null) {
                  if (typeof answer.selectedAnswer === 'number') {
                    selectedIndex = answer.selectedAnswer;
                  } else if (typeof answer.selectedAnswer === 'string') {
                    // It's text, find the index
                    selectedIndex = options.findIndex(opt => opt === answer.selectedAnswer || opt.trim() === answer.selectedAnswer.trim());
                    // If not found by exact match, try case-insensitive
                    if (selectedIndex === -1) {
                      selectedIndex = options.findIndex(opt => 
                        opt.toLowerCase() === answer.selectedAnswer.toLowerCase()
                      );
                    }
                  }
                }
                
                // ✅ NEW: Get selected answer text for display
                const selectedAnswerText = selectedIndex >= 0 ? options[selectedIndex] : answer?.selectedAnswer || 'Not answered';
                
                // ✅ FIXED: Determine if answer is correct
                const isCorrect = answer?.isCorrect !== undefined 
                  ? answer.isCorrect 
                  : (selectedIndex === correctIndex && selectedIndex >= 0);
                
                return (
                  <div className="space-y-4">
                    <QuestionDisplay
                      questionText={question.question}
                      options={options}
                      selectedAnswer={selectedIndex >= 0 ? selectedIndex : null}
                      correctAnswer={correctIndex}
                      questionNumber={currentQuestionIndex + 1}
                      totalQuestions={questions.length}
                      mode="review"
                      showExplanation={true}
                      explanation={question.explanation}
                      isCorrect={isCorrect} // ✅ NEW: Pass isCorrect prop
                    />
                    
                    {/* ✅ NEW: Answer Summary Card */}
                    <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                      <h3 className="text-white text-lg font-semibold mb-4">Answer Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border-2 ${
                          answer?.isCorrect 
                            ? 'border-[#00FFA3] bg-[#00FFA3] bg-opacity-10' 
                            : 'border-[#FF4D6D] bg-[#FF4D6D] bg-opacity-10'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm font-medium ${
                              answer?.isCorrect ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'
                            }`}>
                              {answer?.isCorrect ? '✓' : '✗'} Your Answer
                            </span>
                          </div>
                          <p className={`font-medium ${
                            answer?.isCorrect ? 'text-white' : 'text-black' // ✅ FIXED: Black text on red background
                          }`}>
                            {selectedAnswerText}
                          </p>
                          {selectedIndex >= 0 && (
                            <p className="text-[#A0A0B8] text-xs mt-1">Option {String.fromCharCode(65 + selectedIndex)}</p>
                          )}
                        </div>
                        
                        <div className="p-4 rounded-lg border-2 border-[#00FFA3] bg-[#00FFA3] bg-opacity-10">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#00FFA3] text-sm font-medium">✓ Correct Answer</span>
                          </div>
                          <p className="text-white font-medium">
                            {correctAnswerText || (correctIndex >= 0 ? options[correctIndex] : 'N/A')}
                          </p>
                          {correctIndex >= 0 && (
                            <p className="text-[#A0A0B8] text-xs mt-1">Option {String.fromCharCode(65 + correctIndex)}</p>
                          )}
                        </div>
                      </div>
                      
                      {answer?.isCorrect === false && (
                        <div className="mt-4 p-3 bg-[#FF4D6D] bg-opacity-10 border border-[#FF4D6D] rounded-lg">
                          <p className="text-[#FF4D6D] text-sm font-medium">⚠️ Incorrect Answer</p>
                          <p className="text-black text-sm mt-1 font-medium"> {/* ✅ FIXED: Black text for visibility */}
                            You selected: <span className="font-bold">{selectedAnswerText}</span>
                          </p>
                          <p className="text-black text-sm font-medium"> {/* ✅ FIXED: Black text for visibility */}
                            Correct answer: <span className="font-bold text-[#00FFA3]">
                              {correctAnswerText || (correctIndex >= 0 ? options[correctIndex] : 'N/A')}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && isTeacher && (
            <div className="space-y-6">
              <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
                <h3 className="text-white text-lg font-semibold mb-4">Student Analytics</h3>
                {/* Add teacher analytics components here */}
                <p className="text-[#A0A0B8]">Detailed analytics for this exam session</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamResults;