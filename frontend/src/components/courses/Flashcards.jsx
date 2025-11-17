// src/components/courses/Flashcards.jsx - COMPLETELY FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCourses } from '../../contexts/CourseContext';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, Eye, EyeOff, ArrowLeft, ArrowRight, Layers, Trophy } from 'lucide-react';

const Flashcards = ({ flashcards, onComplete }) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [masteredCards, setMasteredCards] = useState(new Set());
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(true); // 🔥 NEW: Control when to show flashcards
  
  const navigate = useNavigate();
  const { courseId, moduleIndex: urlModuleIndex, lessonIndex: urlLessonIndex } = useParams();
  const { markFlashcardsCompleted, currentCourse, currentLesson } = useCourses();

  // 🔥 FIX: Use Object IDs directly from URL
  const moduleIndex = urlModuleIndex;
  const lessonIndex = urlLessonIndex;

  // 🔥 NEW: Check if flashcards are already completed
  useEffect(() => {
    console.log('📊 Current lesson flashcards status:', {
      flashcardsCompleted: currentLesson?.flashcardsCompleted
    });

    if (currentLesson && currentLesson.flashcardsCompleted) {
      console.log('✅ Flashcards already completed, showing completion screen');
      setSessionCompleted(true);
      setShowFlashcards(false);
    } else {
      console.log('🆕 Flashcards not completed, showing flashcards');
      setShowFlashcards(true);
    }
  }, [currentLesson]);

  // 🔥 NEW: Convert Object ID to numeric module index
  const getNumericModuleIndex = (moduleId) => {
    if (!currentCourse || !currentCourse.modules) return -1;
    
    for (let i = 0; i < currentCourse.modules.length; i++) {
      if (currentCourse.modules[i]._id === moduleId) {
        return i;
      }
    }
    return -1;
  };

  // 🔥 NEW: Convert Object ID to numeric lesson index
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

  const currentFlashcard = flashcards && flashcards[currentCard];

  // 🔥 FIXED: Handle flashcards completion with proper numeric indexes
  const handleFlashcardsComplete = async () => {
    try {
      setIsLoading(true);
      
      // 🔥 Convert Object IDs to numeric indexes for API call
      const numericModuleIndex = getNumericModuleIndex(moduleIndex);
      const numericLessonIndex = getNumericLessonIndex(moduleIndex, lessonIndex);

      console.log('🎴 Completing flashcards:', {
        courseId,
        moduleIndex,
        lessonIndex,
        numericModuleIndex,
        numericLessonIndex
      });

      if (numericModuleIndex === -1 || numericLessonIndex === -1) {
        console.error('❌ Invalid module or lesson indexes');
        return;
      }

      const response = await markFlashcardsCompleted(courseId, numericModuleIndex, numericLessonIndex);
      
      if (response && response.success) {
        onComplete && onComplete();
        console.log('✅ Flashcards completed! Next lesson unlocked.');
        
        // 🔥 NEW: Auto-navigate to next lesson after completion
        setTimeout(() => {
          handleNextLesson();
        }, 1500);
      } else {
        console.error('❌ Flashcards completion failed:', response);
      }
    } catch (error) {
      console.error('❌ Failed to mark flashcards as completed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 NEW: Navigate to next lesson
  const handleNextLesson = () => {
    const currentModuleIdx = getNumericModuleIndex(moduleIndex);
    const currentLessonIdx = getNumericLessonIndex(moduleIndex, lessonIndex);
    
    if (currentModuleIdx === -1 || currentLessonIdx === -1) return;

    const nextLessonIdx = currentLessonIdx + 1;
    
    // Check if next lesson exists in same module
    if (currentCourse?.modules[currentModuleIdx]?.lessons[nextLessonIdx]) {
      const nextLesson = currentCourse.modules[currentModuleIdx].lessons[nextLessonIdx];
      navigate(`/courses/${courseId}/learn/${moduleIndex}/${nextLesson._id}/content`);
    } 
    // Check if next module exists
    else if (currentCourse?.modules[currentModuleIdx + 1]?.lessons[0]) {
      const nextModule = currentCourse.modules[currentModuleIdx + 1];
      const nextLesson = nextModule.lessons[0];
      navigate(`/courses/${courseId}/learn/${nextModule._id}/${nextLesson._id}/content`);
    } 
    // Course completed
    else {
      navigate(`/courses/${courseId}`);
    }
  };

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    } else {
      setSessionCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setShowAnswer(false);
    }
  };

  const handleMarkMastered = () => {
    setMasteredCards(prev => new Set(prev).add(currentCard));
    handleNext();
  };

  const handleResetSession = () => {
    setCurrentCard(0);
    setShowAnswer(false);
    setMasteredCards(new Set());
    setSessionCompleted(false);
    setShowFlashcards(true);
  };

  // 🔥 FIXED: Navigate back to lesson with Object IDs
  const handleBackToLesson = () => {
    console.log('📚 Navigating back to lesson:', { courseId, moduleIndex, lessonIndex });
    navigate(`/courses/${courseId}/learn/${moduleIndex}/${lessonIndex}/content`);
  };

  // Show loading if flashcards are not loaded
  if (!flashcards) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentCard + 1) / flashcards.length) * 100;
  const masteredCount = masteredCards.size;
  const remainingCount = flashcards.length - masteredCount;

  // 🔥 Show completion screen if session completed OR flashcards already completed
  if (sessionCompleted || (currentLesson && currentLesson.flashcardsCompleted)) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-lg">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Flashcards Mastered! 🎉</h2>
          <p className="text-gray-600 mb-6">Congratulations! You've completed all the flashcards for this lesson.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{masteredCount}</div>
              <div className="text-sm text-green-600 font-medium">Mastered</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{remainingCount}</div>
              <div className="text-sm text-orange-600 font-medium">To Review</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={handleResetSession}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 hover:scale-105"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Review Again</span>
            </button>
            <button
              onClick={handleFlashcardsComplete}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-300/50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              <span>Complete & Continue</span>
            </button>
          </div>

          {/* 🔥 NEW: Next Lesson Button */}
          {currentLesson?.flashcardsCompleted && (
            <button
              onClick={handleNextLesson}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg shadow-green-300/50 mb-3"
            >
              <ArrowRight className="h-5 w-5" />
              <span>Next Lesson</span>
            </button>
          )}

          <button
            onClick={handleBackToLesson}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Lesson</span>
          </button>
        </div>
      </div>
    );
  }

  // 🔥 ONLY show flashcards if showFlashcards is true AND flashcards are not completed
  if (!showFlashcards) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (!currentFlashcard) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">No flashcards available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      {/* Progress Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Flashcards Review</h2>
              <p className="text-gray-600 text-sm">
                Card {currentCard + 1} of {flashcards.length}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-semibold text-green-600">{masteredCount} mastered</div>
            <div className="text-xs text-gray-500">{flashcards.length - masteredCount} to go</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="relative mb-6">
        <div 
          className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl p-8 min-h-64 flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:scale-105"
          onClick={() => setShowAnswer(!showAnswer)}
        >
          <div className="text-center max-w-2xl">
            {masteredCards.has(currentCard) && (
              <div className="absolute top-4 right-4">
                <div className="bg-green-500 text-white p-1 rounded-full shadow-lg">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            )}
            
            <div className={`text-2xl font-bold transition-all duration-300 ${
              showAnswer ? 'text-blue-700' : 'text-gray-900'
            }`}>
              {showAnswer ? currentFlashcard.definition : currentFlashcard.term}
            </div>
            
            <p className="text-gray-500 text-sm mt-4 flex items-center justify-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{showAnswer ? 'Click to see term' : 'Click to see definition'}</span>
            </p>
          </div>
        </div>

        {/* Card Indicator */}
        <div className="flex justify-center mt-4 space-x-2">
          {flashcards.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-1 rounded-full transition-all duration-200 ${
                index === currentCard
                  ? 'bg-blue-600'
                  : masteredCards.has(index)
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevious}
          disabled={currentCard === 0}
          className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm"
          >
            {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showAnswer ? 'Show Term' : 'Show Answer'}</span>
          </button>
          
          <button
            onClick={handleMarkMastered}
            disabled={masteredCards.has(currentCard)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Mastered</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-lg font-bold text-gray-900">{currentCard + 1}</div>
          <div className="text-xs text-gray-600 font-medium">Current</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-lg font-bold text-green-600">{masteredCount}</div>
          <div className="text-xs text-green-600 font-medium">Mastered</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-lg font-bold text-orange-600">{flashcards.length - currentCard - 1}</div>
          <div className="text-xs text-orange-600 font-medium">Remaining</div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleBackToLesson}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Lesson</span>
        </button>
      </div>
    </div>
  );
};

export default Flashcards;