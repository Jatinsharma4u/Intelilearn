import React from 'react';

const QuestionDisplay = ({
  questionText,
  options = [],
  selectedAnswer,
  correctAnswer,
  mode = 'exam', // 'exam', 'review', 'preview'
  onSelect,
  questionNumber,
  totalQuestions,
  showExplanation,
  explanation,
  isCorrect = null // ✅ NEW: Explicit isCorrect prop
}) => {
  const isExamMode = mode === 'exam';
  const isReviewMode = mode === 'review';
  const isPreviewMode = mode === 'preview';

  const getOptionStyle = (optionIndex) => {
    if (isExamMode) {
      return selectedAnswer === optionIndex
        ? 'border-[#0082FB] bg-[#0082FB] bg-opacity-10 text-white'
        : 'border-[#2A2A3D] bg-[#2A2A3D] text-white hover:border-[#0082FB]';
    }

    if (isReviewMode) {
      // ✅ FIXED: Better visual distinction with proper text colors
      if (optionIndex === correctAnswer) {
        return 'border-[#00FFA3] border-2 bg-[#00FFA3] bg-opacity-20 text-white';
      }
      if (optionIndex === selectedAnswer && selectedAnswer !== correctAnswer) {
        return 'border-[#FF4D6D] border-2 bg-[#FF4D6D] bg-opacity-20 text-black'; // ✅ FIXED: Changed to black for visibility
      }
      if (optionIndex === selectedAnswer && selectedAnswer === correctAnswer) {
        return 'border-[#00FFA3] border-2 bg-[#00FFA3] bg-opacity-20 text-white';
      }
      return 'border-[#2A2A3D] bg-[#2A2A3D] text-[#A0A0B8]';
    }

    if (isPreviewMode) {
      return 'border-[#2A2A3D] bg-[#2A2A3D] text-[#A0A0B8]';
    }

    return 'border-[#2A2A3D] bg-[#2A2A3D] text-white';
  };

  const getOptionLabel = (optionIndex) => {
    const labels = ['A', 'B', 'C', 'D'];
    return labels[optionIndex] || String.fromCharCode(65 + optionIndex);
  };

  return (
    <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
      {/* Question Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-[#0082FB] text-sm font-medium">
            Question {questionNumber} of {totalQuestions}
          </span>
          <h2 className="text-white text-xl font-semibold mt-1">{questionText}</h2>
        </div>
        
        {isReviewMode && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isCorrect !== null 
              ? (isCorrect ? 'bg-[#00FFA3] text-[#0D0D14]' : 'bg-[#FF4D6D] text-white')
              : selectedAnswer === correctAnswer && selectedAnswer !== null && selectedAnswer !== undefined
              ? 'bg-[#00FFA3] text-[#0D0D14]'
              : selectedAnswer !== null && selectedAnswer !== undefined
              ? 'bg-[#FF4D6D] text-white'
              : 'bg-[#2A2A3D] text-[#A0A0B8]'
          }`}>
            {isCorrect !== null
              ? (isCorrect ? 'Correct' : 'Incorrect')
              : selectedAnswer === correctAnswer && selectedAnswer !== null && selectedAnswer !== undefined
              ? 'Correct'
              : selectedAnswer !== null && selectedAnswer !== undefined
              ? 'Incorrect'
              : 'Not Answered'}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => isExamMode && onSelect?.(index)}
            disabled={!isExamMode}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-start gap-4 ${getOptionStyle(index)} ${
              isExamMode ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            {/* Option Label */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              isExamMode
                ? selectedAnswer === index
                  ? 'bg-[#0082FB] text-white'
                  : 'bg-[#2A2A3D] text-[#A0A0B8] border border-[#2A2A3D]'
                : isReviewMode
                ? index === correctAnswer
                  ? 'bg-[#00FFA3] text-[#0D0D14] border-2 border-[#00FFA3]'
                  : index === selectedAnswer && selectedAnswer !== correctAnswer
                  ? 'bg-[#FF4D6D] text-white border-2 border-[#FF4D6D]'
                  : index === selectedAnswer && selectedAnswer === correctAnswer
                  ? 'bg-[#00FFA3] text-[#0D0D14] border-2 border-[#00FFA3]'
                  : 'bg-[#2A2A3D] text-[#A0A0B8]'
                : 'bg-[#2A2A3D] text-[#A0A0B8]'
            }`}>
              {getOptionLabel(index)}
            </div>

            {/* Option Text */}
            <div className="flex-1">
              <p className="text-base">{option}</p>
              
              {/* ✅ IMPROVED: Review Mode Icons - Better visibility */}
              {isReviewMode && (
                <div className="mt-2 flex items-center gap-3">
                  {index === correctAnswer && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#00FFA3] bg-opacity-20 rounded-full text-[#00FFA3] text-xs font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Correct Answer
                    </div>
                  )}
                  {index === selectedAnswer && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedAnswer === correctAnswer
                        ? 'bg-[#00FFA3] bg-opacity-20 text-[#00FFA3]'
                        : 'bg-[#FF4D6D] bg-opacity-20 text-[#FF4D6D]'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {selectedAnswer === correctAnswer ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        )}
                      </svg>
                      Your Answer
                    </div>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {isReviewMode && showExplanation && explanation && (
        <div className="bg-[#2A2A3D] rounded-lg p-4 border border-[#0082FB]">
          <h4 className="text-[#0082FB] font-medium mb-2">Explanation</h4>
          <p className="text-white text-sm">{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;