import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourse } from '../../contexts/CourseContext';

const FlashcardSystem = ({ flashcards, courseId, moduleIndex }) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  const card = flashcards?.[currentCard];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    } else {
      // Show celebration when all cards are completed
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const markAsMastered = () => {
    if (card) {
      setMasteredCards(prev => new Set([...prev, card._id || currentCard]));
      if (!showCelebration) {
        handleNext();
      }
    }
  };

  const resetProgress = () => {
    setMasteredCards(new Set());
    setCurrentCard(0);
    setIsFlipped(false);
  };

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-12 bg-[#1B1B28] rounded-2xl border border-[#2A2A3D]">
        <div className="text-6xl mb-4">🎴</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Flashcards Available</h3>
        <p className="text-[#A0A0B8]">This module doesn't have any flashcards yet.</p>
      </div>
    );
  }

  const progress = ((currentCard + 1) / flashcards.length) * 100;
  const masteredCount = masteredCards.size;
  const isCompleted = currentCard === flashcards.length - 1 && masteredCount === flashcards.length;

  return (
    <motion.div 
      className="flashcard-system space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-[#00FFA3] to-[#00CC83] rounded-2xl p-8 text-center shadow-2xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-[#0D0D14] mb-2">Amazing!</h3>
              <p className="text-[#0D0D14] font-medium">You've mastered all flashcards!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Header */}
      <div className="bg-gradient-to-r from-[#1B1B28] to-[#2A2A3D] rounded-2xl border border-[#2A2A3D] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎴</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Flashcards</h2>
              <p className="text-[#A0A0B8]">Test your knowledge with interactive cards</p>
            </div>
          </div>
          <div className="bg-[#0D0D14] px-4 py-2 rounded-xl border border-[#2A2A3D]">
            <div className="text-white font-bold text-lg text-center">
              {currentCard + 1} <span className="text-[#A0A0B8]">/ {flashcards.length}</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-white mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-[#2A2A3D] rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm text-white mb-2">
              <span>Mastered Cards</span>
              <span>{masteredCount} / {flashcards.length}</span>
            </div>
            <div className="w-full bg-[#2A2A3D] rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-[#00FFA3] to-[#00CC83] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(masteredCount / flashcards.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="perspective-1000">
        <motion.div
          className={`relative w-full h-80 sm:h-96 cursor-pointer transition-all duration-500 ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={handleFlip}
          whileHover={{ scale: 1.02 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of Card */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-2xl shadow-2xl p-8 flex items-center justify-center backface-hidden ${
              isFlipped ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-center text-white">
              <div className="text-5xl mb-6">🤔</div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 leading-tight">
                {card?.front}
              </h3>
              <p className="text-blue-100 text-sm">Tap to reveal answer</p>
            </div>
          </motion.div>

          {/* Back of Card */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#00CC83] rounded-2xl shadow-2xl p-8 flex items-center justify-center backface-hidden rotate-y-180 ${
              isFlipped ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-center text-[#0D0D14]">
              <div className="text-5xl mb-6">💡</div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 leading-tight">
                {card?.back}
              </h3>
              <p className="text-green-900 text-sm">Tap to see question</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Previous Button */}
          <motion.button
            onClick={handlePrevious}
            disabled={currentCard === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              currentCard === 0
                ? 'bg-[#2A2A3D] text-[#A0A0B8] cursor-not-allowed'
                : 'bg-[#0D0D14] border border-[#2A2A3D] text-white hover:bg-[#0082FB] hover:border-[#0082FB]'
            }`}
            whileHover={{ scale: currentCard === 0 ? 1 : 1.05 }}
          >
            <span>←</span>
            Previous
          </motion.button>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              onClick={resetProgress}
              className="px-6 py-3 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>🔄</span>
              Reset
            </motion.button>
            
            <motion.button
              onClick={markAsMastered}
              disabled={masteredCards.has(card?._id || currentCard)}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                masteredCards.has(card?._id || currentCard)
                  ? 'bg-[#00FFA3] text-[#0D0D14] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00FFA3] to-[#00CC83] text-[#0D0D14] hover:shadow-lg hover:shadow-[#00FFA3]/20'
              }`}
              whileHover={{ scale: masteredCards.has(card?._id || currentCard) ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{masteredCards.has(card?._id || currentCard) ? '✓' : '🎯'}</span>
              {masteredCards.has(card?._id || currentCard) ? 'Mastered' : 'Mark Mastered'}
            </motion.button>
          </div>

          {/* Next Button */}
          <motion.button
            onClick={handleNext}
            disabled={currentCard === flashcards.length - 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              currentCard === flashcards.length - 1
                ? 'bg-[#2A2A3D] text-[#A0A0B8] cursor-not-allowed'
                : 'bg-[#0D0D14] border border-[#2A2A3D] text-white hover:bg-[#0082FB] hover:border-[#0082FB]'
            }`}
            whileHover={{ scale: currentCard === flashcards.length - 1 ? 1 : 1.05 }}
          >
            Next
            <span>→</span>
          </motion.button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-[#1B1B28] rounded-xl p-4 border border-[#2A2A3D]">
          <div className="text-2xl text-[#0082FB] mb-1">{currentCard + 1}</div>
          <div className="text-[#A0A0B8] text-sm">Current</div>
        </div>
        <div className="bg-[#1B1B28] rounded-xl p-4 border border-[#2A2A3D]">
          <div className="text-2xl text-[#00FFA3] mb-1">{masteredCount}</div>
          <div className="text-[#A0A0B8] text-sm">Mastered</div>
        </div>
        <div className="bg-[#1B1B28] rounded-xl p-4 border border-[#2A2A3D]">
          <div className="text-2xl text-[#FF9F5B] mb-1">{flashcards.length - masteredCount}</div>
          <div className="text-[#A0A0B8] text-sm">Remaining</div>
        </div>
      </div>
    </motion.div>
  );
};

export default FlashcardSystem;