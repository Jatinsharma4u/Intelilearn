import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourse } from '../../contexts/CourseContext';

const QuizComponent = ({ quiz, courseId, moduleIndex }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [timeStarted] = useState(Date.now());
  const [selectedOption, setSelectedOption] = useState(null);
  const { submitQuiz } = useCourse();

  const question = quiz?.[currentQuestion];

  const handleAnswerSelect = (answer, optionIndex) => {
    setSelectedOption(optionIndex);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(answers[currentQuestion - 1] ? 
        question.options.indexOf(answers[currentQuestion - 1]) : null
      );
    }
  };

  const handleSubmitQuiz = async () => {
    const timeTaken = Math.floor((Date.now() - timeStarted) / 1000);
    
    try {
      const results = await submitQuiz(courseId, moduleIndex, answers, timeTaken);
      setQuizResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setQuizResults(null);
    setSelectedOption(null);
  };

  if (!quiz || quiz.length === 0) {
    return (
      <div className="text-center py-12 bg-[#1B1B28] rounded-2xl border border-[#2A2A3D]">
        <div className="text-6xl mb-4">❓</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Quiz Available</h3>
        <p className="text-[#A0A0B8]">This module doesn't have a quiz yet.</p>
      </div>
    );
  }

  if (showResults && quizResults) {
    const scoreColor = quizResults.score >= 70 ? 'from-[#00FFA3] to-[#00CC83]' :
                      quizResults.score >= 50 ? 'from-[#FF9F5B] to-[#FF7B3A]' :
                      'from-[#FF4D6D] to-[#FF2E4D]';

    return (
      <motion.div 
        className="quiz-results bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <motion.div 
            className="text-6xl mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            {quizResults.score >= 70 ? '🎉' : quizResults.score >= 50 ? '👍' : '💪'}
          </motion.div>
          
          <motion.div
            className={`text-5xl font-bold mb-4 bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {quizResults.score}%
          </motion.div>
          
          <motion.h2 
            className="text-2xl font-bold text-white mb-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {quizResults.score >= 70 ? 'Excellent!' : quizResults.score >= 50 ? 'Good Job!' : 'Keep Practicing!'}
          </motion.h2>
          
          <motion.p 
            className="text-[#A0A0B8]"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            You got {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correct
          </motion.p>
          
          {quizResults.xpEarned > 0 && (
            <motion.p 
              className="text-[#00FFA3] font-bold mt-2 flex items-center justify-center gap-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              <span>⭐</span>
              +{quizResults.xpEarned} XP Earned!
            </motion.p>
          )}
        </div>

        {/* Results Review */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>📝</span>
            Review Answers
          </h3>
          {quizResults.results.map((result, index) => (
            <motion.div
              key={index}
              className={`p-4 rounded-xl border backdrop-blur-sm ${
                result.isCorrect
                  ? 'bg-[#00FFA3]/10 border-[#00FFA3]/30'
                  : 'bg-[#FF4D6D]/10 border-[#FF4D6D]/30'
              }`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <h4 className="font-semibold text-white mb-3 text-lg">
                {index + 1}. {result.question}
              </h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong className="text-[#A0A0B8]">Your answer:</strong>{' '}
                  <span className={result.isCorrect ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}>
                    {result.userAnswer}
                  </span>
                </p>
                {!result.isCorrect && (
                  <p className="text-sm">
                    <strong className="text-[#A0A0B8]">Correct answer:</strong>{' '}
                    <span className="text-[#00FFA3]">{result.correctAnswer}</span>
                  </p>
                )}
                {result.explanation && (
                  <div className="mt-3 p-3 bg-[#0D0D14] rounded-lg border border-[#2A2A3D]">
                    <strong className="text-[#0082FB] text-sm">Explanation:</strong>
                    <p className="text-[#A0A0B8] text-sm mt-1">{result.explanation}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="mt-8 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <button
            onClick={restartQuiz}
            className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0082FB] text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <span>🔄</span>
            Try Again
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="quiz-component bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Quiz Header */}
      <div className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] p-6 border-b border-[#0082FB]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">❓</span>
            </div>
            <h2 className="text-xl font-bold text-white">Module Quiz</h2>
          </div>
          <div className="text-white/90 text-sm bg-white/10 px-3 py-1 rounded-full">
            Question {currentQuestion + 1} of {quiz.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-white/90 text-sm">
            <span>Progress</span>
            <span>{Math.round(((currentQuestion + 1) / quiz.length) * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-white h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        <motion.h3 
          key={currentQuestion}
          className="text-xl font-semibold text-white mb-6 leading-relaxed"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {question.question}
        </motion.h3>

        <div className="space-y-3">
          {question.options.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => handleAnswerSelect(option, index)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                selectedOption === index
                  ? 'bg-[#0082FB] border-[#0082FB] text-white shadow-lg shadow-[#0082FB]/25'
                  : 'bg-[#0D0D14] border-[#2A2A3D] text-[#A0A0B8] hover:border-[#0082FB]/50 hover:bg-[#0D0D14]/80'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              whileHover={{ scale: selectedOption === index ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center mr-4 transition-all ${
                  selectedOption === index
                    ? 'bg-white border-white'
                    : 'border-[#A0A0B8]'
                }`}>
                  {selectedOption === index && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-[#0082FB] rounded-full"
                    />
                  )}
                </div>
                <span className="font-medium">{option}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-[#2A2A3D] bg-[#0D0D14] flex flex-col sm:flex-row gap-4 justify-between">
        <motion.button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            currentQuestion === 0
              ? 'bg-[#2A2A3D] text-[#A0A0B8] cursor-not-allowed'
              : 'bg-[#1B1B28] border border-[#2A2A3D] text-white hover:bg-[#0082FB] hover:border-[#0082FB]'
          }`}
          whileHover={{ scale: currentQuestion === 0 ? 1 : 1.05 }}
        >
          <span>←</span>
          Previous
        </motion.button>
        
        <motion.button
          onClick={handleNext}
          disabled={!answers[currentQuestion]}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            !answers[currentQuestion]
              ? 'bg-[#2A2A3D] text-[#A0A0B8] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#00FFA3] to-[#00CC83] text-[#0D0D14] hover:shadow-lg hover:shadow-[#00FFA3]/20'
          }`}
          whileHover={{ scale: !answers[currentQuestion] ? 1 : 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {currentQuestion === quiz.length - 1 ? (
            <>
              <span>🚀</span>
              Submit Quiz
            </>
          ) : (
            <>
              Next
              <span>→</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default QuizComponent;