// src/hooks/useCourses.js - UPDATED WITH PROGRESSIVE LEARNING
import { useState, useEffect } from 'react';
import { courseApi } from '../utils/courseApi';

export const useCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseApi.getCourses();
      if (response.success) {
        // 🔥 ONLY show completed courses
        const completedCourses = response.courses.filter(course => 
          course.generationStatus === 'completed' && !course.isGenerating
        );
        setCourses(completedCourses);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return { courses, loading, error, refetch: fetchCourses };
};

export default useCourses;