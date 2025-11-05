import React, { useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiRotateCw } from 'react-icons/fi';

const FlashcardsViewer = ({ flashcards, isLoading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D]">
        <h3 className="text-white text-lg font-semibold mb-4">Flashcards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#2A2A3D] rounded-lg p-6 h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D] text-center">
        <h3 className="text-white text-lg font-semibold mb-2">Flashcards</h3>
        <p className="text-[#A0A0B8]">Upload notes to generate flashcards</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < flashcards.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const resetFlip = () => {
    setIsFlipped(false);
  };

  return (
    <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-semibold">Flashcards</h3>
        <span className="text-[#A0A0B8] text-sm">
          {currentIndex + 1} of {flashcards.length}
        </span>
      </div>

      {/* Flashcard with proper flip */}
      <div className="relative mb-6">
        <div
          className="bg-[#2A2A3D] rounded-xl p-6 min-h-[200px] flex items-center justify-center cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="text-center">
            <p className="text-white text-lg font-medium">
              {isFlipped ? currentCard.answer : currentCard.question}
            </p>
            {!isFlipped && (
              <p className="text-[#A0A0B8] text-sm mt-2">Click to reveal answer</p>
            )}
          </div>
        </div>
        
        {/* Flip indicator */}
        <div className="absolute top-4 right-4">
          <div className={`w-3 h-3 rounded-full ${
            isFlipped ? 'bg-[#00FFA3]' : 'bg-[#7C5FFF]'
          }`}></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={resetFlip}
            className="p-2 text-[#A0A0B8] hover:text-white transition-colors disabled:opacity-50"
            disabled={!isFlipped}
            title="Reset card"
          >
            <FiRotateCw size={20} />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={goToPrevious}
            className="p-2 text-[#A0A0B8] hover:text-white transition-colors disabled:opacity-50"
            disabled={!hasPrevious}
            title="Previous card"
          >
            <FiArrowLeft size={20} />
          </button>
          
          <button
            onClick={goToNext}
            className="p-2 text-[#A0A0B8] hover:text-white transition-colors disabled:opacity-50"
            disabled={!hasNext}
            title="Next card"
          >
            <FiArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsViewer;