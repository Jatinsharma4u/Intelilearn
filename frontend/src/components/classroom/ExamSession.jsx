// ExamSession.js - Updated component
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassroom } from '../../contexts/ClassroomContext';
import QuestionDisplay from './QuestionDisplay';
import Timer from './Timer';
import Loader from '../ui/Loader';

const ExamSession = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { 
    activeExam, 
    startExam, 
    submitAnswer, 
    submitExam, 
    loading,
    error 
  } = useClassroom();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initializeExam = async () => {
      if (quizId && !activeExam) {
        try {
          await startExam(quizId);
        } catch (err) {
          console.error('Failed to start exam:', err);
          navigate('/classroom');
        }
      }
    };
    
    initializeExam();
  }, [quizId, activeExam]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Active Exam Data:', activeExam);
    console.log('🔍 Quiz Questions:', activeExam?.quiz?.questions);
  }, [activeExam]);

  const handleAnswerSelect = async (answerIndex) => {
    if (!activeExam) return;

    const questionId = activeExam.quiz.questions[currentQuestionIndex]._id;
    const newAnswers = {
      ...answers,
      [currentQuestionIndex]: {
        questionId,
        selectedAnswer: answerIndex
      }
    };
    setAnswers(newAnswers);

    try {
      await submitAnswer(activeExam._id, {
        questionId: questionId,
        selectedAnswer: answerIndex,
        timeSpent: 0 // You can track time spent per question
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (activeExam?.quiz?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitExam = async () => {
    if (!activeExam || isSubmitting) return;

    if (!confirm('Are you sure you want to submit the exam? You cannot change your answers after submission.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitExam(activeExam._id);
      // Navigate to results page with session ID
      if (response?.session?._id) {
        navigate(`/exam/results/${response.session._id}`);
      } else if (activeExam._id) {
        navigate(`/exam/results/${activeExam._id}`);
      } else {
        console.error('No session ID available for navigation');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    alert('Time is up! Submitting your exam...');
    handleSubmitExam();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#FF4D6D] text-xl mb-4">Error: {error}</div>
          <button 
            onClick={() => navigate('/classroom')}
            className="bg-[#0082FB] text-white px-6 py-2 rounded-md"
          >
            Back to Classroom
          </button>
        </div>
      </div>
    );
  }

  if (!activeExam || !activeExam.quiz) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  const currentQuestion = activeExam.quiz.questions?.[currentQuestionIndex];
  const totalQuestions = activeExam.quiz.questions?.length || 0;

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">No questions found in this quiz</div>
          <button 
            onClick={() => navigate('/classroom')}
            className="bg-[#0082FB] text-white px-6 py-2 rounded-md"
          >
            Back to Classroom
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D14] text-white">
      {/* Header */}
      <div className="bg-[#1B1B28] border-b border-[#2A2A3D] p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-xl font-bold">{activeExam.quiz.title}</h1>
              <p className="text-[#A0A0B8] text-sm">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            
            <Timer 
              duration={activeExam.quiz.settings?.duration || 60} 
              onTimeUp={handleTimeUp}
            />

            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="bg-[#FF4D6D] hover:bg-[#FF3355] disabled:bg-[#2A2A3D] text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Question Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {activeExam.quiz.questions?.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  currentQuestionIndex === index
                    ? 'bg-[#0082FB] text-white'
                    : answers[index] !== undefined
                    ? 'bg-[#00FFA3] text-[#0D0D14]'
                    : 'bg-[#2A2A3D] text-[#A0A0B8] hover:bg-[#3A3A4D]'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Current Question */}
        <QuestionDisplay
          questionText={currentQuestion.question}
          options={currentQuestion.options.map(opt => opt.text)}
          selectedAnswer={answers[currentQuestionIndex]?.selectedAnswer}
          onSelect={handleAnswerSelect}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          mode="exam"
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="bg-[#2A2A3D] hover:bg-[#3A3A4D] disabled:bg-[#2A2A3D] disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="bg-[#0082FB] hover:bg-[#0064E0] disabled:bg-[#2A2A3D] disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Progress Summary */}
        <div className="mt-8 bg-[#1B1B28] rounded-lg p-4 border border-[#2A2A3D]">
          <h3 className="text-white font-medium mb-3">Progress Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[#00FFA3] text-2xl font-bold">
                {Object.keys(answers).length}
              </p>
              <p className="text-[#A0A0B8] text-sm">Answered</p>
            </div>
            <div>
              <p className="text-[#FF9F5B] text-2xl font-bold">
                {totalQuestions - Object.keys(answers).length}
              </p>
              <p className="text-[#A0A0B8] text-sm">Unanswered</p>
            </div>
            <div>
              <p className="text-white text-2xl font-bold">{totalQuestions}</p>
              <p className="text-[#A0A0B8] text-sm">Total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSession;