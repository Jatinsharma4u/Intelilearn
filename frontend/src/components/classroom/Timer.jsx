import React, { useState, useEffect } from 'react';

const Timer = ({ duration, onTimeUp, isRunning = true }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds

  useEffect(() => {
    setTimeLeft(duration * 60);
  }, [duration]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, onTimeUp]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const percentage = (timeLeft / (duration * 60)) * 100;
    if (percentage > 50) return 'text-[#00FFA3]';
    if (percentage > 20) return 'text-[#FF9F5B]';
    return 'text-[#FF4D6D]';
  };

  const getProgressBarColor = () => {
    const percentage = (timeLeft / (duration * 60)) * 100;
    if (percentage > 50) return 'bg-[#00FFA3]';
    if (percentage > 20) return 'bg-[#FF9F5B]';
    return 'bg-[#FF4D6D]';
  };

  const progressPercentage = (timeLeft / (duration * 60)) * 100;

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Timer Display */}
      <div className={`text-2xl font-bold font-mono ${getProgressColor()}`}>
        {formatTime(timeLeft)}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#2A2A3D] rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${getProgressBarColor()}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* Status */}
      <div className="text-[#A0A0B8] text-sm">
        {timeLeft <= 300 && timeLeft > 0 && (
          <div className="flex items-center gap-1 text-[#FF4D6D]">
            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Less than 5 minutes left!
          </div>
        )}
        {timeLeft === 0 && (
          <div className="text-[#FF4D6D] font-medium">Time's up!</div>
        )}
      </div>
    </div>
  );
};

export default Timer;