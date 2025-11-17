// src/pages/Courses.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import CourseGrid from '../components/courses/CourseGrid';
import { Plus, Search, BookOpen, TrendingUp, Clock, Sparkles } from 'lucide-react';

const Courses = () => {
  const { courses, loading, error, fetchCourses } = useCourses();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // ✅ FIXED: Safe progress calculation
  const getCourseProgress = (course) => {
    if (!course.modules || course.modules.length === 0) return 0;
    
    const totalLessons = course.modules.reduce((acc, module) => 
      acc + (module.lessons?.length || 0), 0
    );
    
    if (totalLessons === 0) return 0;
    
    const completedLessons = course.modules.reduce((acc, module) => 
      acc + (module.lessons?.filter(lesson => lesson.completed).length || 0), 0
    );
    
    return Math.round((completedLessons / totalLessons) * 100);
  };

  // ✅ FIXED: Safe course filtering
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const progress = getCourseProgress(course);
    const isGenerating = course.isGenerating || course.generationStatus === 'generating';
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'in-progress' && progress < 100 && !isGenerating) ||
                         (filter === 'completed' && progress === 100) ||
                         (filter === 'generating' && isGenerating);
    
    return matchesSearch && matchesFilter;
  });

  // ✅ FIXED: Safe stats calculation
  const stats = {
    total: courses.length,
    inProgress: courses.filter(c => {
      const progress = getCourseProgress(c);
      const isGenerating = c.isGenerating || c.generationStatus === 'generating';
      return progress < 100 && !isGenerating;
    }).length,
    completed: courses.filter(c => getCourseProgress(c) === 100).length,
    generating: courses.filter(c => c.isGenerating || c.generationStatus === 'generating').length
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = () => {
    navigate('/courses/create');
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Clean and Compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
              <p className="text-gray-600 text-sm mt-1">
                Continue your learning journey
              </p>
            </div>
            
            <button
              onClick={handleCreateCourse}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create Course</span>
            </button>
          </div>

          {/* Stats Grid - More Compact */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Total</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
                </div>
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">In Progress</p>
                  <p className="text-lg font-semibold text-orange-600">{stats.inProgress}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Completed</p>
                  <p className="text-lg font-semibold text-green-600">{stats.completed}</p>
                </div>
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Generating</p>
                  <p className="text-lg font-semibold text-gray-600">{stats.generating}</p>
                </div>
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter - Clean Layout */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
          >
            <option value="all">All Courses</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="generating">Generating</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Course Grid */}
        <CourseGrid 
          courses={filteredCourses.map(course => ({
            ...course,
            progress: {
              overallCompletion: getCourseProgress(course)
            }
          }))}
          loading={loading && courses.length === 0}
          onCreateNew={handleCreateCourse}
        />

        {/* Empty State */}
        {filteredCourses.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filter !== 'all' ? 'No courses found' : 'No courses yet'}
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first AI-powered course to get started.'
                }
              </p>
              {!searchTerm && filter === 'all' && (
                <button
                  onClick={handleCreateCourse}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create First Course</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;