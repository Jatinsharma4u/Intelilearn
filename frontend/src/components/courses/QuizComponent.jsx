// src/components/courses/QuizComponent.jsx - WEAK TOPICS REMOVED
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCourses } from '../../contexts/CourseContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { CheckCircle, XCircle, Clock, Award, ArrowLeft, ArrowRight, Play, Zap, Save } from 'lucide-react';

const QuizComponent = ({ quiz, onComplete }) => {
  const { submitQuizAndUnlockFlashcards, currentCourse } = useCourses();
  const { recordQuizAttempt } = useAnalytics();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quizTimeSpent, setQuizTimeSpent] = useState(0);
  const [questionTimes, setQuestionTimes] = useState({});
  
  const navigate = useNavigate();
  const { courseId, moduleIndex: urlModuleIndex, lessonIndex: urlLessonIndex } = useParams();
  const questionStartTimeRef = useRef(Date.now());
  const quizStartTimeRef = useRef(Date.now());

  // Use Object IDs directly from URL
  const moduleIndex = urlModuleIndex;
  const lessonIndex = urlLessonIndex;

  // Timer for quiz countdown
  useEffect(() => {
    if (timeLeft > 0 && !showResults && !quizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResults) {
      handleSubmit();
    }
  }, [timeLeft, showResults, quizCompleted]);

  // Track time spent on each question
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    
    return () => {
      const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
      if (timeSpent > 0) {
        setQuestionTimes(prev => ({
          ...prev,
          [currentQuestion]: timeSpent
        }));
        setQuizTimeSpent(prev => prev + timeSpent);
      }
    };
  }, [currentQuestion]);

  // Convert Object ID to numeric module index
  const getNumericModuleIndex = (moduleId) => {
    if (!currentCourse || !currentCourse.modules) return -1;
    
    for (let i = 0; i < currentCourse.modules.length; i++) {
      if (currentCourse.modules[i]._id === moduleId) {
        return i;
      }
    }
    return -1;
  };

  // Convert Object ID to numeric lesson index
  const getNumericLessonIndex = (moduleId, lessonId) => {
    const moduleIdx = getNumericModuleIndex(moduleId);
    if (moduleIdx === -1 || !currentCourse.modules[moduleIdx].lessons) return -1;
    
    const module = currentCourse.modules[moduleIdx];
    for (let i = 0; i < module.lessons.length; i++) {
      if (module.lessons[i]._id === lessonId) {
        return i;
      }
    }
    return -1;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Submit quiz with analytics
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Convert Object IDs to numeric indexes for API call
      const numericModuleIndex = getNumericModuleIndex(moduleIndex);
      const numericLessonIndex = getNumericLessonIndex(moduleIndex, lessonIndex);

      console.log('📝 Submitting quiz with analytics:', {
        courseId,
        moduleIndex,
        lessonIndex,
        numericModuleIndex,
        numericLessonIndex,
        totalTimeSpent: quizTimeSpent
      });

      if (numericModuleIndex === -1 || numericLessonIndex === -1) {
        console.error('❌ Invalid module or lesson indexes');
        return;
      }

      // Calculate score and results
      let correct = 0;
      const results = quiz.map((question, index) => {
        const isCorrect = selectedAnswers[index] === question.correctAnswer;
        if (isCorrect) correct++;
        return {
          questionId: question._id,
          selectedAnswer: selectedAnswers[index],
          correctAnswer: question.correctAnswer,
          isCorrect,
          timeSpent: questionTimes[index] || 0
        };
      });

      const finalScore = Math.round((correct / quiz.length) * 100);
      setScore(finalScore);
      setShowResults(true);

      const currentLesson = currentCourse?.modules[numericModuleIndex]?.lessons[numericLessonIndex];
      const currentModule = currentCourse?.modules[numericModuleIndex];

      // RECORD QUIZ ATTEMPT TO ANALYTICS
      try {
        await recordQuizAttempt({
          courseId,
          lessonId: lessonIndex,
          moduleId: moduleIndex,
          lessonTitle: currentLesson?.title || 'Unknown Lesson',
          moduleTitle: currentModule?.title || 'Unknown Module',
          score: finalScore,
          totalQuestions: quiz.length,
          correctAnswers: correct,
          timeSpent: quizTimeSpent,
          answers: results
        });
        console.log('✅ Quiz attempt recorded to analytics');
      } catch (analyticsError) {
        console.error('❌ Failed to record quiz attempt to analytics:', analyticsError);
      }

      // ✅ NEW: RECORD WEAK TOPICS
      try {
        // Prepare question details with topic information
        const questionDetails = quiz.map((question, index) => ({
          questionId: question._id || question.id || index.toString(),
          questionText: question.question,
          topic: question.topic || 'General',
          timeSpent: questionTimes[index] || 0,
          isCorrect: results[index].isCorrect,
          moduleId: moduleIndex,
          lessonId: lessonIndex,
          moduleTitle: currentModule?.title || 'Unknown Module',
          lessonTitle: currentLesson?.title || 'Unknown Lesson'
        }));

        // Call weak topics API
        const weakTopicsResponse = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/weaktopics/course/${courseId}/record-attempt`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
              answers: results,
              questionDetails
            })
          }
        );

        if (weakTopicsResponse.ok) {
          const weakTopicsData = await weakTopicsResponse.json();
          console.log('✅ Weak topics recorded:', weakTopicsData);
        } else {
          console.error('❌ Failed to record weak topics:', await weakTopicsResponse.text());
        }
      } catch (weakTopicsError) {
        console.error('❌ Failed to record weak topics:', weakTopicsError);
      }

      // Submit quiz and unlock flashcards
      const response = await submitQuizAndUnlockFlashcards(
        courseId, 
        numericModuleIndex, 
        numericLessonIndex, 
        {
          answers: results,
          totalTime: quizTimeSpent
        }
      );

      if (response && response.success) {
        setQuizCompleted(true);
        console.log('✅ Quiz completed! Flashcards unlocked.');
      } else {
        console.error('❌ Quiz submission failed:', response);
      }
    } catch (error) {
      console.error('❌ Failed to submit quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setTimeLeft(600);
    setQuizCompleted(false);
    setQuizTimeSpent(0);
    setQuestionTimes({});
    quizStartTimeRef.current = Date.now();
  };

  // Navigate to flashcards with Object IDs
  const handleProceedToFlashcards = () => {
    console.log('🎴 Navigating to flashcards:', { courseId, moduleIndex, lessonIndex });
    navigate(`/courses/${courseId}/learn/${moduleIndex}/${lessonIndex}/flashcards`);
  };

  // Navigate back to lesson with Object IDs
  const handleBackToLesson = () => {
    console.log('📚 Navigating back to lesson:', { courseId, moduleIndex, lessonIndex });
    navigate(`/courses/${courseId}/learn/${moduleIndex}/${lessonIndex}/content`);
  };

  if (showResults) {
    const correctAnswers = Math.round((score / 100) * quiz.length);
    const incorrectAnswers = quiz.length - correctAnswers;
    const totalQuizTime = Math.floor((Date.now() - quizStartTimeRef.current) / 1000);

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
          {/* Results Header */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              score >= 80 ? 'bg-green-500' :
              score >= 60 ? 'bg-orange-500' : 'bg-red-500'
            }`}>
              <Award className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {score >= 80 ? 'Excellent! 🎉' : 
               score >= 60 ? 'Good Job! 👍' : 'Keep Practicing! 💪'}
            </h2>
            <div className="text-4xl font-bold text-gray-900 mb-2">{score}%</div>
            <p className="text-gray-600 text-lg">
              You scored {correctAnswers} out of {quiz.length} questions correctly
            </p>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{quiz.length}</div>
              <div className="text-sm text-gray-600 font-medium">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-green-600 font-medium">Correct</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{incorrectAnswers}</div>
              <div className="text-sm text-orange-600 font-medium">Incorrect</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{formatTime(totalQuizTime)}</div>
              <div className="text-sm text-blue-600 font-medium">Time</div>
            </div>
          </div>

          {/* Analytics Info */}
          <div className="space-y-3 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Quiz Analytics Recorded</h4>
                  <p className="text-blue-700 text-xs">
                    Your performance has been saved to your learning analytics
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Answers</h3>
            {quiz.map((question, index) => {
              const isCorrect = selectedAnswers[index] === question.correctAnswer;
              const userAnswer = selectedAnswers[index];
              const timeSpent = questionTimes[index] || 0;
              
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    isCorrect
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}
                >
                  <div className="flex items-start space-x-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-base">{question.question}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        {!isCorrect && (
                          <span>
                            Your answer: <span className="text-red-600 font-medium">{userAnswer}</span>
                          </span>
                        )}
                        <span>
                          Time: <span className="font-medium">{timeSpent}s</span>
                        </span>
                        {question.topic && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {question.topic}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        Correct: <span className="text-green-600 font-medium">{question.correctAnswer}</span>
                      </p>
                    </div>
                  </div>
                  
                  {question.explanation && (
                    <div className="bg-white rounded-lg p-3 mt-2 border border-gray-200">
                      <p className="text-sm text-gray-700">
                        <strong className="text-blue-600">Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 hover:scale-105"
            >
              <span>Retry Quiz</span>
            </button>
            
            <button
              onClick={handleProceedToFlashcards}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-300/50"
            >
              <Play className="h-5 w-5" />
              <span>{isLoading ? 'Saving...' : 'Review Flashcards'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuiz = quiz && quiz[currentQuestion];

  if (!currentQuiz) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      {/* Quiz Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Play className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quiz Time</h2>
              <p className="text-gray-600 text-sm">
                Question {currentQuestion + 1} of {quiz.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Spent Tracker */}
            <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg font-semibold">
              <Clock className="h-4 w-4" />
              <span>{formatTime(quizTimeSpent)}</span>
            </div>
            
            {/* Time Left */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-semibold ${
              timeLeft > 120 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
            }`}>
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Current Question */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentQuiz.question}
          </h3>
          
          <div className="flex items-center space-x-3">
            {currentQuiz.difficulty && (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                currentQuiz.difficulty === 'easy' 
                  ? 'bg-green-100 text-green-700'
                  : currentQuiz.difficulty === 'medium'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {currentQuiz.difficulty}
              </span>
            )}
            
            {currentQuiz.topic && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {currentQuiz.topic}
              </span>
            )}
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-3 mb-6">
          {currentQuiz.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(currentQuestion, option)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 text-base ${
                selectedAnswers[currentQuestion] === option
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedAnswers[currentQuestion] === option
                    ? 'bg-white border-white'
                    : 'bg-white border-gray-400'
                }`}>
                  {selectedAnswers[currentQuestion] === option && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
                <span className="text-left font-medium">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleBackToLesson}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Lesson</span>
          </button>
          
          <div className="flex flex-1 gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            <button
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestion]}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-300/50"
            >
              <span>{currentQuestion === quiz.length - 1 ? 'Submit' : 'Next'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizComponent;