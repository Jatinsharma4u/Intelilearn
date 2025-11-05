import React, { useState } from 'react';
import { FiCheck, FiX, FiHelpCircle } from 'react-icons/fi';

const QuizGenerator = ({ quizQuestions, isLoading }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState({});

  if (isLoading) {
    return (
      <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Quiz Questions</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#2A2A3D] rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-[#1B1B28] rounded mb-3 w-3/4"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-3 bg-[#1B1B28] rounded w-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!quizQuestions || quizQuestions.length === 0) {
    return (
      <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D] text-center">
        <h3 className="text-white text-lg font-semibold mb-2">Quiz Questions</h3>
        <p className="text-[#A0A0B8]">Upload notes to generate quiz questions</p>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isAnswered = answered[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

  const handleOptionSelect = (optionIndex) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
  };

  const checkAnswer = () => {
    if (selectedOption === null) return;

    const isCorrect = currentQuestion.options[selectedOption] === currentQuestion.answer;
    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswered({ ...answered, [currentQuestionIndex]: true });
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    setAnswered({});
  };

  const getOptionStyle = (optionIndex) => {
    if (!isAnswered) {
      return selectedOption === optionIndex
        ? 'border-[#7C5FFF] bg-[#7C5FFF]/20'
        : 'border-[#2A2A3D] hover:border-[#A084FF]';
    }

    const isCorrectOption = currentQuestion.options[optionIndex] === currentQuestion.answer;
    const isSelected = selectedOption === optionIndex;

    if (isCorrectOption) {
      return 'border-[#00FFA3] bg-[#00FFA3]/20';
    } else if (isSelected && !isCorrectOption) {
      return 'border-[#FF4D6D] bg-[#FF4D6D]/20';
    }
    return 'border-[#2A2A3D] opacity-50';
  };

  return (
    <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-lg font-semibold">Quiz Questions</h3>
        <div className="text-[#A0A0B8] text-sm">
          Question {currentQuestionIndex + 1} of {quizQuestions.length}
          {Object.keys(answered).length > 0 && (
            <span className="ml-3 text-[#00FFA3]">
              Score: {score}/{Object.keys(answered).length}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="bg-[#2A2A3D] rounded-lg p-6 mb-6">
        <p className="text-white text-lg font-medium mb-4">
          {currentQuestion.question}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${getOptionStyle(index)}`}
              onClick={() => handleOptionSelect(index)}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-3">
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-white">{option}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="bg-[#2A2A3D] rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <FiHelpCircle className="text-[#A084FF] mr-2" />
            <span className="text-white font-medium">Explanation</span>
          </div>
          <p className="text-[#A0A0B8]">{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        {!isAnswered ? (
          <button
            onClick={checkAnswer}
            disabled={selectedOption === null}
            className="bg-[#7C5FFF] text-white px-6 py-2 rounded-lg hover:bg-[#A084FF] transition-colors disabled:opacity-50"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            disabled={isLastQuestion}
            className="bg-[#7C5FFF] text-white px-6 py-2 rounded-lg hover:bg-[#A084FF] transition-colors disabled:opacity-50"
          >
            {isLastQuestion ? 'Quiz Complete' : 'Next Question'}
          </button>
        )}

        {Object.keys(answered).length > 0 && (
          <button
            onClick={resetQuiz}
            className="text-[#A0A0B8] hover:text-white transition-colors"
          >
            Restart Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizGenerator;