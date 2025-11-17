// src/components/courses/WeakTopics.jsx - Weak Topics Component
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  Target, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import TutorSession from './TutorSession';

const WeakTopics = ({ courseId }) => {
  const navigate = useNavigate();
  const [weakTopics, setWeakTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewingTopic, setReviewingTopic] = useState(null);
  const [tutorSession, setTutorSession] = useState(null); // { topic: '...' }

  useEffect(() => {
    fetchWeakTopics();
  }, [courseId]);

  const fetchWeakTopics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/weaktopics/course/${courseId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weak topics');
      }

      const data = await response.json();
      setWeakTopics(data.weakTopics || []);
    } catch (err) {
      console.error('❌ Failed to fetch weak topics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReviewed = async (weakTopicId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/weaktopics/${weakTopicId}/review`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark as reviewed');
      }

      // Update local state
      setWeakTopics(prev => 
        prev.map(wt => 
          wt._id === weakTopicId 
            ? { ...wt, isReviewed: true, reviewedAt: new Date() }
            : wt
        )
      );

      // Refresh list to remove reviewed topics
      setTimeout(() => {
        fetchWeakTopics();
      }, 500);
    } catch (err) {
      console.error('❌ Failed to mark as reviewed:', err);
      alert('Failed to mark topic as reviewed. Please try again.');
    }
  };

  const handleReviewTopic = (weakTopic) => {
    // Start tutor session instead of navigating
    setTutorSession({ topic: weakTopic.topic });
  };

  const handleTutorComplete = () => {
    setTutorSession(null);
    fetchWeakTopics(); // Refresh weak topics list
  };

  const getWeaknessColor = (score) => {
    if (score >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getWeaknessLabel = (score) => {
    if (score >= 70) return 'Critical';
    if (score >= 50) return 'High';
    return 'Moderate';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (weakTopics.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">No Weak Topics!</h3>
        <p className="text-green-700">
          Great job! You're performing well across all topics. Keep up the excellent work!
        </p>
      </div>
    );
  }

  // Show tutor session if active
  if (tutorSession) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <button
            onClick={() => setTutorSession(null)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Weak Topics
          </button>
          <TutorSession
            courseId={courseId}
            topic={tutorSession.topic}
            onComplete={handleTutorComplete}
            onClose={() => setTutorSession(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Weak Topics</h2>
              <p className="text-gray-500 text-sm">
                Topics that need your attention based on quiz performance
              </p>
            </div>
          </div>
          <button
            onClick={fetchWeakTopics}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {weakTopics.filter(wt => wt.weaknessScore >= 70).length}
            </div>
            <div className="text-sm text-red-700 font-medium">Critical Topics</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {weakTopics.filter(wt => wt.weaknessScore >= 50 && wt.weaknessScore < 70).length}
            </div>
            <div className="text-sm text-orange-700 font-medium">High Priority</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {weakTopics.filter(wt => wt.weaknessScore < 50).length}
            </div>
            <div className="text-sm text-yellow-700 font-medium">Moderate</div>
          </div>
        </div>
      </div>

      {/* Weak Topics List */}
      <div className="space-y-4">
        {weakTopics.map((weakTopic) => {
          const weaknessScore = Math.round(weakTopic.weaknessScore || 0);
          const accuracy = weakTopic.totalQuestions > 0 
            ? Math.round((weakTopic.correctAnswers / weakTopic.totalQuestions) * 100)
            : 0;

          return (
            <div
              key={weakTopic._id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{weakTopic.topic}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getWeaknessColor(weaknessScore)}`}>
                      {getWeaknessLabel(weaknessScore)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-gray-500">Weakness Score</div>
                      <div className="text-xl font-bold text-red-600">{weaknessScore}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Accuracy</div>
                      <div className="text-xl font-bold text-gray-900">{accuracy}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Questions</div>
                      <div className="text-xl font-bold text-gray-900">{weakTopic.totalQuestions}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Avg. Time</div>
                      <div className="text-xl font-bold text-gray-900 flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{weakTopic.averageTimePerQuestion}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Performance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {weakTopic.correctAnswers}/{weakTopic.totalQuestions} correct
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${accuracy}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Problematic Questions */}
                  {weakTopic.problematicQuestions && weakTopic.problematicQuestions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Problematic Questions ({weakTopic.problematicQuestions.length})
                      </div>
                      <div className="space-y-2">
                        {weakTopic.problematicQuestions.slice(0, 3).map((pq, idx) => (
                          <div key={idx} className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                            <div className="flex items-center justify-between">
                              <span className="truncate">{pq.questionText}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {pq.moduleTitle} → {pq.lessonTitle}
                              </span>
                            </div>
                          </div>
                        ))}
                        {weakTopic.problematicQuestions.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{weakTopic.problematicQuestions.length - 3} more questions
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleReviewTopic(weakTopic)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Start Improving</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleMarkAsReviewed(weakTopic._id)}
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark as Reviewed</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeakTopics;


