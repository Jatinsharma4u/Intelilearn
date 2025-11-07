import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCourse } from '../contexts/CourseContext';
import MainLayout from '../components/layout/MainLayout';

const CourseDashboard = () => {
  const { courses, loading, error } = useCourse();

  if (loading) return (
    <MainLayout>
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-lg text-[#A0A0B8]">Loading your courses...</div>
      </div>
    </MainLayout>
  );

  if (error) return (
    <MainLayout>
      <div className="mx-4 mt-4 bg-red-900/20 border border-red-700 text-[#FF4D6D] px-4 py-3 rounded-lg">
        {error}
      </div>
    </MainLayout>
  );

  // Sort courses by last accessed or created date
  const recentCourses = [...courses]
    .sort((a, b) => new Date(b.lastAccessed || b.createdAt) - new Date(a.lastAccessed || a.createdAt))
    .slice(0, 3);

  const inProgressCourses = courses.filter(c => c.progress > 0 && c.progress < 100);
  const completedCourses = courses.filter(c => c.progress === 100);
  const notStartedCourses = courses.filter(c => c.progress === 0);

  const stats = [
    { 
      label: 'In Progress', 
      value: inProgressCourses.length, 
      color: 'text-[#0082FB]',
      icon: '🔄'
    },
    { 
      label: 'Completed', 
      value: completedCourses.length,
      color: 'text-[#00FFA3]',
      icon: '✅'
    },
    { 
      label: 'Not Started', 
      value: notStartedCourses.length,
      color: 'text-[#FF9F5B]',
      icon: '🆕'
    },
    { 
      label: 'Total', 
      value: courses.length, 
      color: 'text-white',
      icon: '📚'
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0D0D14]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Courses</h1>
              <p className="text-[#A0A0B8]">Continue your learning journey</p>
            </div>
            
            <Link 
              to="/courses/create"
              className="bg-[#0082FB] hover:bg-[#0064E0] text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>+</span>
              <span>New Course</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-[#1B1B28] rounded-lg p-4 border border-[#2A2A3D]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xl font-bold ${stat.color} mb-1`}>
                      {stat.value}
                    </div>
                    <div className="text-[#A0A0B8] text-sm">
                      {stat.label}
                    </div>
                  </div>
                  <div className="text-xl">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Courses */}
          {recentCourses.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Recently Opened</h2>
                <Link to="/courses" className="text-[#0082FB] text-sm hover:text-[#0064E0]">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentCourses.map((course, index) => (
                  <motion.div
                    key={course._id}
                    className="bg-[#1B1B28] rounded-lg border border-[#2A2A3D] p-4 hover:border-[#2A2A3D] transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">
                            {course.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-white truncate">
                            {course.title}
                          </h3>
                          <p className="text-[#A0A0B8] text-sm truncate">
                            {course.description || 'Continue learning'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right min-w-[80px]">
                          <div className="text-sm text-white font-medium">{Math.round(course.progress || 0)}%</div>
                          <div className="w-16 bg-[#2A2A3D] rounded-full h-1.5">
                            <div 
                              className="bg-[#0082FB] h-1.5 rounded-full"
                              style={{ width: `${course.progress || 0}%` }}
                            />
                          </div>
                        </div>
                        
                        <Link to={`/courses/learn/${course._id}`}>
                          <button className="bg-[#0082FB] hover:bg-[#0064E0] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
                            Continue
                          </button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All Courses */}
          {courses.length === 0 ? (
            <div className="text-center py-12 bg-[#1B1B28] rounded-xl border border-[#2A2A3D]">
              <div className="text-5xl mb-3">📚</div>
              <h2 className="text-xl font-semibold text-white mb-2">No courses yet</h2>
              <p className="text-[#A0A0B8] mb-6 max-w-md mx-auto">
                Create your first AI-powered course by uploading study materials
              </p>
              <Link 
                to="/courses/create"
                className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0064E0] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                <span>Create First Course</span>
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">All Courses</h2>
              <div className="space-y-3">
                {courses.map((course, index) => (
                  <motion.div
                    key={course._id}
                    className="bg-[#1B1B28] rounded-lg border border-[#2A2A3D] p-4 hover:border-[#2A2A3D] transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">
                            {course.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-white truncate">
                              {course.title}
                            </h3>
                            {course.status === 'processing' && (
                              <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded text-xs font-medium">
                                Processing
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[#A0A0B8] text-sm mb-2 line-clamp-1">
                            {course.description || 'No description available'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-[#A0A0B8]">
                            <span className="flex items-center gap-1">
                              <span>📚</span>
                              <span>{course.total_lessons || 0} lessons</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span>⏱️</span>
                              <span>{course.total_duration || 0} min</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right min-w-[100px]">
                          <div className="flex justify-between text-sm text-[#A0A0B8] mb-1">
                            <span>Progress</span>
                            <span className="text-white font-medium">{Math.round(course.progress || 0)}%</span>
                          </div>
                          <div className="w-full bg-[#2A2A3D] rounded-full h-2">
                            <div 
                              className="bg-[#0082FB] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${course.progress || 0}%` }}
                            />
                          </div>
                        </div>
                        
                        <Link to={`/courses/learn/${course._id}`}>
                          <button className="bg-[#0082FB] hover:bg-[#0064E0] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-w-[100px] justify-center">
                            {course.progress > 0 ? (
                              <>
                                <span>Continue</span>
                                <span>→</span>
                              </>
                            ) : (
                              <span>Start</span>
                            )}
                          </button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {courses.length > 0 && (
            <div className="mt-8 bg-[#1B1B28] rounded-xl border border-[#2A2A3D] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link 
                  to="/courses/create"
                  className="bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white p-4 rounded-lg transition-colors text-center"
                >
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-medium">Create New Course</div>
                </Link>
                
                {inProgressCourses.length > 0 && (
                  <Link 
                    to={`/courses/learn/${inProgressCourses[0]._id}`}
                    className="bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white p-4 rounded-lg transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">🚀</div>
                    <div className="font-medium">Continue Learning</div>
                  </Link>
                )}
                
                <div className="bg-[#2A2A3D] text-[#A0A0B8] p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium">View Analytics</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CourseDashboard;