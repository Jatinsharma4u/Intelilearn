// components/courses/CourseCard.jsx - FIXED
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, CheckCircle, PlayCircle } from 'lucide-react';

const CourseCard = ({ course }) => {
  // ✅ FIXED: Safe progress calculation
  const getProgress = () => {
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

  const progress = getProgress();
  const isGenerating = course.isGenerating || course.generationStatus === 'generating';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
              {course.title}
            </h3>
            {course.description && (
              <p className="text-gray-600 text-xs line-clamp-2 mb-2">
                {course.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {!isGenerating && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Course Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-3 w-3" />
              <span>
                {course.modules?.reduce((acc, module) => acc + (module.lessons?.length || 0), 0) || 0} lessons
              </span>
            </div>
          </div>
          
          {isGenerating ? (
            <div className="flex items-center space-x-1 text-orange-600">
              <Clock className="h-3 w-3" />
              <span>Generating</span>
            </div>
          ) : progress === 100 ? (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Completed</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-blue-600">
              <PlayCircle className="h-3 w-3" />
              <span>Continue</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="border-t border-gray-100 px-4 py-3">
        <Link
          to={isGenerating ? '#' : `/courses/${course._id}`}
          className={`w-full text-center block py-2 px-3 rounded text-xs font-medium transition-colors ${
            isGenerating 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          {isGenerating ? 'Course Generating...' : 'View Course'}
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;