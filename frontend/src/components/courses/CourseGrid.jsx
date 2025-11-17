// src/components/courses/CourseGrid.jsx - IMPROVED VERSION
import React from 'react';
import CourseCard from './CourseCard';
import { Plus } from 'lucide-react';

const CourseGrid = ({ courses, loading, onCreateNew }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
          >
            <div className="flex justify-between mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-1.5 bg-gray-200 rounded mb-2"></div>
            <div className="flex justify-between pt-3">
              <div className="w-12 h-3 bg-gray-200 rounded"></div>
              <div className="w-8 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} />
      ))}
      
      {/* Add New Course Card */}
      <button
        onClick={onCreateNew}
        className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group flex flex-col items-center justify-center min-h-[140px]"
      >
        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors mb-2">
          <Plus className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
        </div>
        <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
          New Course
        </span>
      </button>
    </div>
  );
};

export default CourseGrid;