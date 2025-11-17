import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';

const QuizCard = ({ 
  quizId,
  title,
  description,
  questionCount,
  duration,
  status = 'draft',
  difficulty = 'medium',
  dueDate,
  studentScore,
  totalScore,
  isAttempted = false,
  attemptsCount = 0,
  createdBy = 'manual',
  allowRetakes = false, // ✅ ADDED: From quiz settings
  lastSessionId = null, // ✅ ADDED: Last exam session ID for viewing results
  settings = {}, // ✅ ADDED: Full settings object
  schedule = null, // ✅ NEW: Schedule object with startTime and endTime
  onStart,
  onEdit,
  onDelete,
  onViewResults,
  onSchedule,
  onPublish,
  onStartNow,
  onEndQuiz,
  onUnpublish
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const isTeacher = profile?.role === 'teacher';
  const normalizedStatus = status?.toLowerCase() || 'draft';

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-[#00FFA3] text-[#0D0D14]';
      case 'upcoming': return 'bg-[#FF9F5B] text-white';
      case 'completed': return 'bg-[#0082FB] text-white';
      case 'ended': return 'bg-[#FF4D6D] text-white';
      case 'draft': return 'bg-[#A0A0B8] text-white';
      default: return 'bg-[#2A2A3D] text-[#A0A0B8]';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-[#00FFA3]';
      case 'medium': return 'text-[#FF9F5B]';
      case 'hard': return 'text-[#FF4D6D]';
      default: return 'text-[#A0A0B8]';
    }
  };

  const getScoreColor = (score, total) => {
    if (!score || !total) return 'text-[#A0A0B8]';
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-[#00FFA3]';
    if (percentage >= 60) return 'text-[#FF9F5B]';
    return 'text-[#FF4D6D]';
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return 'Not Set';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // ✅ FIXED: Better edit handler with quiz type detection
  const handleEdit = () => {
    if (createdBy === 'manual') {
      // Navigate to manual quiz edit
      onEdit?.(quizId, 'manual');
    } else if (createdBy === 'ai_pdf') {
      // Navigate to PDF quiz edit
      onEdit?.(quizId, 'pdf');
    } else {
      // Default fallback
      onEdit?.(quizId, 'manual');
    }
  };

  const handleAction = (action, quizId) => {
    switch (action) {
      case 'start':
        onStart?.(quizId);
        break;
      case 'edit':
        handleEdit(); // ✅ FIXED: Use the fixed edit handler
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
          onDelete?.(quizId);
        }
        break;
      case 'viewResults':
        onViewResults?.(quizId);
        break;
      case 'schedule':
        if (confirm('Schedule this quiz for tomorrow? It will become upcoming.')) {
          onSchedule?.(quizId);
        }
        break;
      case 'publish':
        if (confirm('Publish this quiz? Students will be able to see and attempt it.')) {
          onPublish?.(quizId);
        }
        break;
      case 'startNow':
        if (confirm('Start this quiz now? It will become active immediately.')) {
          onStartNow?.(quizId);
        }
        break;
      case 'endQuiz':
        if (confirm('End this quiz? No more attempts will be allowed.')) {
          onEndQuiz?.(quizId);
        }
        break;
      case 'unpublish':
        if (confirm('Unpublish this quiz? It will be hidden from students.')) {
          onUnpublish?.(quizId);
        }
        break;
      default:
        console.warn('Unknown action:', action);
    }
  };

  const getDisplayStatus = () => {
    return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  };

  const getDisplayDifficulty = () => {
    if (!difficulty) return 'N/A';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  // ✅ FIXED: Student action logic based on attempt status, allowRetakes, schedule, and ended status
  const canStudentAttempt = () => {
    if (isTeacher) return false;
    
    // ✅ NEW: Check if quiz is ended (manually ended by teacher)
    if (normalizedStatus === 'ended') return false;
    
    // ✅ NEW: Check schedule - if schedule exists, enforce it strictly
    const now = new Date();
    if (schedule) {
      const startTime = schedule.startTime ? new Date(schedule.startTime) : null;
      const endTime = schedule.endTime ? new Date(schedule.endTime) : null;
      
      // Check if quiz hasn't started yet
      if (startTime && now < startTime) return false;
      
      // Check if quiz deadline has passed
      if (endTime && now > endTime) return false;
    } else if (dueDate) {
      // Fallback to dueDate if schedule not available
      const endTime = new Date(dueDate);
      if (now > endTime) return false; // Schedule time has passed
    }
    
    // Quiz must be active
    if (normalizedStatus !== 'active') return false;
    
    // If not attempted, can start
    if (!isAttempted) return true;
    
    // If attempted, can retake only if allowRetakes is true
    return allowRetakes;
  };

  const canStudentViewResults = () => {
    if (isTeacher) return false;
    // Can view results if attempted
    return isAttempted;
  };

  const canStudentRetake = () => {
    if (isTeacher) return false;
    // Can retake if attempted AND allowRetakes is true AND quiz is active
    return isAttempted && allowRetakes && normalizedStatus === 'active';
  };

  return (
    <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-xl p-6 border border-[#2A2A3D] hover:border-[#0082FB] hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group relative overflow-hidden">
      {/* ✅ NEW: Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#0082FB] opacity-5 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:opacity-10 transition-opacity"></div>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-white text-lg font-semibold group-hover:text-blue-300 transition-colors">
              {title || 'Untitled Quiz'}
            </h3>
            {/* ✅ IMPROVED: Status badge with icon */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(normalizedStatus)}`}>
              {normalizedStatus === 'active' && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="6" />
                </svg>
              )}
              {normalizedStatus === 'upcoming' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {getDisplayStatus()}
            </span>
          </div>
          {description && (
            <p className="text-[#A0A0B8] text-sm mb-3 line-clamp-2">{description}</p>
          )}
          {/* ✅ IMPROVED: Quiz Type Badge with better styling */}
          {isTeacher && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2A2A3D] text-[#A0A0B8] text-xs rounded-full border border-[#3A3A4D]">
                {createdBy === 'manual' ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Manual
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    PDF Generated
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ✅ IMPROVED: Quiz Details with better visual design */}
      <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
        <div className="bg-[#2A2A3D] rounded-lg p-3 text-center border border-[#3A3A4D] hover:border-[#0082FB] transition-colors">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <svg className="w-4 h-4 text-[#0082FB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white font-bold text-lg">{questionCount || 0}</p>
          </div>
          <p className="text-[#A0A0B8] text-xs">Questions</p>
        </div>
        <div className="bg-[#2A2A3D] rounded-lg p-3 text-center border border-[#3A3A4D] hover:border-[#0082FB] transition-colors">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <svg className="w-4 h-4 text-[#FF9F5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white font-bold text-lg">{formatDuration(duration)}</p>
          </div>
          <p className="text-[#A0A0B8] text-xs">Duration</p>
        </div>
        <div className="bg-[#2A2A3D] rounded-lg p-3 text-center border border-[#3A3A4D] hover:border-[#0082FB] transition-colors">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <svg className="w-4 h-4 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p className={`font-bold text-lg ${getDifficultyColor(difficulty)}`}>
              {getDisplayDifficulty()}
            </p>
          </div>
          <p className="text-[#A0A0B8] text-xs">Difficulty</p>
        </div>
        {isTeacher ? (
          <div className="bg-[#2A2A3D] rounded-lg p-3 text-center border border-[#3A3A4D] hover:border-[#0082FB] transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <svg className="w-4 h-4 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white font-bold text-lg">{attemptsCount || 0}</p>
            </div>
            <p className="text-[#A0A0B8] text-xs">Attempts</p>
          </div>
        ) : (
          <div className="bg-[#2A2A3D] rounded-lg p-3 text-center border border-[#3A3A4D] hover:border-[#0082FB] transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <svg className="w-4 h-4 text-[#0082FB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className={`font-bold text-lg ${getScoreColor(studentScore, totalScore)}`}>
                {isAttempted ? `${studentScore || 0}/${totalScore || 0}` : 'N/A'}
              </p>
            </div>
            <p className="text-[#A0A0B8] text-xs">Score</p>
          </div>
        )}
      </div>

      {/* ✅ IMPROVED: Schedule/Due Date with better styling */}
      {(dueDate || schedule) && (
        <div className="mb-4 p-3 bg-gradient-to-r from-[#2A2A3D] to-[#3A3A4D] rounded-lg border border-[#3A3A4D] relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[#FF9F5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[#A0A0B8] text-xs font-medium">Schedule</p>
          </div>
          {schedule?.startTime && (
            <p className="text-white text-sm font-medium mb-1">
              Starts: {formatDate(schedule.startTime)}
            </p>
          )}
          {(schedule?.endTime || dueDate) && (
            <p className="text-white text-sm font-medium">
              {schedule?.endTime ? `Ends: ${formatDate(schedule.endTime)}` : `Due: ${formatDate(dueDate)}`}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isTeacher ? (
          <>
            {/* DRAFT QUIZ ACTIONS */}
            {normalizedStatus === 'draft' && (
              <>
                <button
                  onClick={() => handleAction('edit', quizId)}
                  className="flex-1 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleAction('publish', quizId)}
                  className="flex-1 bg-[#00FFA3] hover:bg-[#00E693] text-[#0D0D14] py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Publish
                </button>
                <button
                  onClick={() => handleAction('schedule', quizId)}
                  className="flex-1 bg-[#FF9F5B] hover:bg-[#FF8B42] text-white py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </button>
              </>
            )}

            {/* UPCOMING QUIZ ACTIONS */}
            {normalizedStatus === 'upcoming' && (
              <>
                <button
                  onClick={() => handleAction('edit', quizId)}
                  className="flex-1 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleAction('startNow', quizId)}
                  className="flex-1 bg-[#00FFA3] hover:bg-[#00E693] text-[#0D0D14] py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  Start Now
                </button>
                <button
                  onClick={() => handleAction('schedule', quizId)}
                  className="flex-1 bg-[#FF9F5B] hover:bg-[#FF8B42] text-white py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Reschedule
                </button>
              </>
            )}

            {/* ACTIVE QUIZ ACTIONS */}
            {normalizedStatus === 'active' && (
              <>
                <button
                  onClick={() => navigate(`/quiz/${quizId}/analytics`)}
                  className="flex-1 bg-[#0082FB] hover:bg-[#0064E0] text-white py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </button>
                <button
                  onClick={() => handleAction('endQuiz', quizId)}
                  className="flex-1 bg-[#FF4D6D] hover:bg-[#FF3355] text-white py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  End Quiz
                </button>
              </>
            )}

            {/* COMPLETED/ENDED QUIZ ACTIONS */}
            {(normalizedStatus === 'completed' || normalizedStatus === 'ended') && (
              <>
                <button
                  onClick={() => navigate(`/quiz/${quizId}/analytics`)}
                  className="flex-1 bg-[#0082FB] hover:bg-[#0064E0] text-white py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </button>
                <button
                  onClick={() => handleAction('unpublish', quizId)}
                  className="flex-1 bg-[#A0A0B8] hover:bg-[#8A8A9E] text-white py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  Unpublish
                </button>
              </>
            )}

            {/* DELETE BUTTON - Always visible */}
            <button
              onClick={() => handleAction('delete', quizId)}
              className="px-3 bg-[#FF4D6D] hover:bg-[#FF3355] text-white py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-center"
              title="Delete Quiz"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        ) : (
          // ✅ FIXED: STUDENT ACTIONS - Proper logic based on attempt and allowRetakes
          <>
            {/* Show Start Exam if not attempted and quiz is active */}
            {!isAttempted && normalizedStatus === 'active' && (
              <button
                onClick={() => handleAction('start', quizId)}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Exam
              </button>
            )}

            {/* Show Retake if attempted, allowRetakes is true, and quiz is active */}
            {canStudentRetake() && (
              <button
                onClick={() => handleAction('start', quizId)}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retake Exam
              </button>
            )}

            {/* Show View Results if attempted */}
            {canStudentViewResults() && (
              <button
                onClick={() => {
                  // Navigate to results using lastSessionId if available
                  if (lastSessionId) {
                    navigate(`/exam/results/${lastSessionId}`);
                  } else {
                    handleAction('viewResults', quizId);
                  }
                }}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Show Results
              </button>
            )}

            {/* Disabled state for unavailable quizzes */}
            {!canStudentAttempt() && !canStudentViewResults() && (
              <button
                disabled
                className="w-full py-3 px-4 rounded-lg font-medium bg-[#2A2A3D] text-[#A0A0B8] cursor-not-allowed flex items-center justify-center gap-2"
                title={
                  normalizedStatus === 'ended' ? 'Quiz has been ended by teacher' :
                  normalizedStatus === 'upcoming' ? 'Quiz has not started yet' :
                  dueDate && new Date(dueDate) < new Date() ? 'Quiz deadline has passed' :
                  normalizedStatus === 'draft' ? 'Quiz is not available' :
                  isAttempted && !allowRetakes ? 'You have already attempted this quiz' :
                  'Quiz is not available'
                }
              >
                {normalizedStatus === 'upcoming' && (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Upcoming
                  </>
                )}
                {normalizedStatus === 'ended' && (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Quiz Ended
                  </>
                )}
                {dueDate && new Date(dueDate) < new Date() && normalizedStatus !== 'ended' && (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Deadline Passed
                  </>
                )}
                {normalizedStatus === 'draft' && 'Not Available'}
                {isAttempted && !allowRetakes && normalizedStatus === 'active' && !dueDate && 'Already Attempted'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuizCard;