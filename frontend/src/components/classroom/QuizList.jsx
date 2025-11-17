import React, { useState, useEffect } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useNavigate } from 'react-router-dom';
import QuizCard from './QuizCard';
import Loader from '../ui/Loader';

const QuizList = ({ classroomId }) => {
  const { 
    classroomQuizzes, 
    fetchClassroomQuizzes, 
    loading,
    updateQuizStatus,
    deleteQuiz,
    scheduleQuiz,
    publishQuiz,
    unpublishQuiz,
    startQuizNow,
    endQuiz
  } = useClassroom();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    if (classroomId) {
      fetchClassroomQuizzes(classroomId, { 
        status: filter === 'all' ? undefined : filter,
        sortBy 
      });
    }
  }, [classroomId, filter, sortBy]);

  const getFilteredQuizzes = () => {
    if (!classroomQuizzes.quizzes.length) return [];

    let filtered = [...classroomQuizzes.quizzes];

    // Students ko sirf active, upcoming, completed quizzes dikhao
    if (!isTeacher) {
      filtered = filtered.filter(quiz => 
        ['active', 'upcoming', 'completed', 'ended'].includes(quiz.status?.toLowerCase())
      );
    }

    // Additional frontend filtering based on selected filter
    if (filter !== 'all') {
      filtered = filtered.filter(quiz => 
        quiz.status?.toLowerCase() === filter.toLowerCase()
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title?.localeCompare(b.title);
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'createdAt':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  };

  const filteredQuizzes = getFilteredQuizzes();

  // ✅ FIXED: Quiz Actions Handlers
  const handleStartQuiz = (quizId) => {
    navigate(`/exam/${quizId}`);
  };

  // ✅ FIXED: Edit Quiz Handler - Navigate to quiz creator with edit mode
  const handleEditQuiz = (quizId, quizType) => {
    const quiz = classroomQuizzes.quizzes.find(q => q._id === quizId);
    const type = quizType || quiz?.createdBy || 'manual';
    
    // Navigate to quiz creator with edit mode
    navigate(`/classroom/${classroomId}/quiz/create?type=${type}&edit=${quizId}`);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      try {
        await deleteQuiz(quizId);
        fetchClassroomQuizzes(classroomId);
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert(`Failed to delete quiz: ${error.message}`);
      }
    }
  };

  const handleViewResults = (quizId) => {
    navigate(`/quiz/results/${quizId}`);
  };

  const handleScheduleQuiz = async (quizId) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await scheduleQuiz(quizId, {
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        timeLimit: 60
      });
      fetchClassroomQuizzes(classroomId);
      alert('Quiz scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling quiz:', error);
      alert(`Failed to schedule quiz: ${error.message}`);
    }
  };

  const handlePublishQuiz = async (quizId) => {
    try {
      await publishQuiz(quizId);
      fetchClassroomQuizzes(classroomId);
      alert('Quiz published successfully!');
    } catch (error) {
      console.error('Error publishing quiz:', error);
      alert(`Failed to publish quiz: ${error.message}`);
    }
  };

  const handleStartNow = async (quizId) => {
    try {
      await startQuizNow(quizId);
      fetchClassroomQuizzes(classroomId);
      alert('Quiz started successfully!');
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert(`Failed to start quiz: ${error.message}`);
    }
  };

  const handleEndQuiz = async (quizId) => {
    try {
      await endQuiz(quizId);
      fetchClassroomQuizzes(classroomId);
      alert('Quiz ended successfully!');
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert(`Failed to end quiz: ${error.message}`);
    }
  };

  const handleUnpublishQuiz = async (quizId) => {
    try {
      await unpublishQuiz(quizId);
      fetchClassroomQuizzes(classroomId);
      alert('Quiz unpublished successfully!');
    } catch (error) {
      console.error('Error unpublishing quiz:', error);
      alert(`Failed to unpublish quiz: ${error.message}`);
    }
  };

  if (loading && !classroomQuizzes.quizzes.length) {
    return (
      <div className="flex justify-center py-8">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#0082FB] text-white'
                : 'bg-[#2A2A3D] text-[#A0A0B8] hover:bg-[#3A3A4D]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-[#00FFA3] text-[#0D0D14]'
                : 'bg-[#2A2A3D] text-[#A0A0B8] hover:bg-[#3A3A4D]'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-[#FF9F5B] text-white'
                : 'bg-[#2A2A3D] text-[#A0A0B8] hover:bg-[#3A3A4D]'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-[#0082FB] text-white'
                : 'bg-[#2A2A3D] text-[#A0A0B8] hover:bg-[#3A3A4D]'
            }`}
          >
            Completed
          </button>
          {isTeacher && (
            <button
              onClick={() => setFilter('draft')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'draft'
                  ? 'bg-[#A0A0B8] text-white'
                  : 'bg-[#2A2A3D] text-[#A0A0B8] hover:bg-[#3A3A4D]'
              }`}
            >
              Drafts
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-1 text-white text-sm focus:outline-none focus:border-[#0082FB]"
        >
          <option value="createdAt">Newest First</option>
          <option value="title">Title A-Z</option>
          <option value="dueDate">Due Date</option>
          <option value="duration">Duration</option>
          <option value="difficulty">Difficulty</option>
        </select>
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-[#1B1B28] rounded-lg p-12 text-center border-2 border-dashed border-[#2A2A3D]">
          <div className="text-[#A0A0B8] mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">
            {isTeacher ? 'No quizzes found' : 'No available quizzes'}
          </h3>
          <p className="text-[#A0A0B8]">
            {isTeacher 
              ? 'Create your first quiz to get started' 
              : 'No quizzes available in this classroom yet'
            }
          </p>
          {isTeacher && filter === 'draft' && (
            <p className="text-[#A0A0B8] text-sm mt-2">
              Draft quizzes are only visible to teachers
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz._id}
              quizId={quiz._id}
              title={quiz.title}
              description={quiz.description}
              questionCount={quiz.questions?.length || 0}
              duration={quiz.duration || quiz.settings?.duration}
              status={quiz.status}
              difficulty={quiz.difficulty}
              dueDate={quiz.schedule?.endTime || quiz.dueDate}
              studentScore={quiz.studentScore}
              totalScore={quiz.totalScore || quiz.settings?.totalMarks}
              isAttempted={quiz.isAttempted}
              attemptsCount={quiz.attemptsCount}
              createdBy={quiz.createdBy}
              allowRetakes={quiz.allowRetakes || quiz.settings?.allowRetakes || false}
              lastSessionId={quiz.lastSessionId}
              settings={quiz.settings || {}}
              schedule={quiz.schedule || null} // ✅ NEW: Pass schedule object
              onStart={handleStartQuiz}
              onEdit={handleEditQuiz}
              onDelete={handleDeleteQuiz}
              onViewResults={handleViewResults}
              onSchedule={handleScheduleQuiz}
              onPublish={handlePublishQuiz}
              onStartNow={handleStartNow}
              onEndQuiz={handleEndQuiz}
              onUnpublish={handleUnpublishQuiz}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizList;