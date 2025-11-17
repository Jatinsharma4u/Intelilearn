// src/components/courses/LessonContent.jsx - IMPROVED CONTENT FORMATTING
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCourses } from '../../contexts/CourseContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { 
  CheckCircle, 
  Clock, 
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Play,
  Layers,
  FileText,
  AlertTriangle,
  Lightbulb,
  Info,
  Quote,
  Zap,
  Target,
  Award,
  Save,
  Star,
  List,
  Eye,
  Rocket,
  GraduationCap,
  TargetIcon,
  Bookmark,
  Key,
  TrendingUp,
  Brain,
  Sparkles
} from 'lucide-react';

const LessonContent = ({ lesson, onProgressUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);
  const [isTrackingTime, setIsTrackingTime] = useState(true);
  
  const navigate = useNavigate();
  const { courseId, moduleIndex: urlModuleIndex, lessonIndex: urlLessonIndex } = useParams();
  const moduleIndex = urlModuleIndex;
  const lessonIndex = urlLessonIndex;

  const { 
    currentCourse, 
    markContentCompleted
  } = useCourses();

  const { updateTimeSpent } = useAnalytics();

  // Time Tracking System
  useEffect(() => {
    if (!isTrackingTime || !lesson || lesson.contentCompleted) {
      console.log('⏰ Time tracking stopped:', { isTrackingTime, hasLesson: !!lesson, completed: lesson?.contentCompleted });
      return;
    }

    console.log('⏰ Starting time tracking...');
    
    let seconds = 0;
    const interval = setInterval(() => {
      seconds += 1;
      setTimeSpent(seconds);
      console.log('⏱️ Time:', seconds, 'seconds');
    }, 1000);

    const autoSaveInterval = setInterval(() => {
      if (seconds > 0) {
        console.log('🕑 Auto-saving:', seconds, 'seconds');
        saveTimeToAnalytics(seconds);
      }
    }, 120000);

    return () => {
      console.log('🛑 Cleaning up time tracking, final time:', seconds, 'seconds');
      clearInterval(interval);
      clearInterval(autoSaveInterval);
      
      if (seconds > 0) {
        saveTimeToAnalytics(seconds);
      }
    };
  }, [isTrackingTime, lesson]);

  // Save time to analytics
  const saveTimeToAnalytics = async (seconds) => {
    try {
      if (courseId && seconds > 0) {
        console.log('💾 Saving to analytics:', seconds, 'seconds');
        const response = await updateTimeSpent(courseId, seconds);
        
        if (response && response.success) {
          setTotalTimeSaved(prev => prev + seconds);
          console.log('✅ Time saved successfully');
        }
      }
    } catch (error) {
      console.error('❌ Failed to save time:', error);
    }
  };

  // Helper function to clean text from markdown symbols
  const cleanText = (text) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic
      .replace(/`(.*?)`/g, '$1')       // Remove code
      .replace(/#{1,6}\s?/g, '')       // Remove headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links but keep text
      .replace(/\n{3,}/g, '\n\n')      // Normalize multiple newlines
      .trim();
  };

  // Helper function to extract and highlight important topics
  const extractImportantTopics = (text) => {
    if (!text) return [];
    
    const topics = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const cleanSentence = cleanText(sentence);
      // Look for sentences that indicate importance
      if (
        cleanSentence.toLowerCase().includes('important') ||
        cleanSentence.toLowerCase().includes('key') ||
        cleanSentence.toLowerCase().includes('essential') ||
        cleanSentence.toLowerCase().includes('critical') ||
        cleanSentence.toLowerCase().includes('crucial') ||
        cleanSentence.toLowerCase().includes('must know') ||
        cleanSentence.toLowerCase().includes('vital') ||
        cleanSentence.toLowerCase().includes('fundamental') ||
        cleanSentence.match(/\b[A-Z][a-z]+\s+is\s+[a-z]+\b/i) || // Pattern: "Concept is important"
        cleanSentence.length > 100 // Longer sentences often contain important info
      ) {
        topics.push(cleanSentence);
      }
    });
    
    return topics.slice(0, 5); // Return top 5 important topics
  };

  // Manual save
  const handleManualSave = () => {
    if (timeSpent > 0) {
      console.log('🔄 Manual save:', timeSpent, 'seconds');
      saveTimeToAnalytics(timeSpent);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Handle content completion
  const handleContentComplete = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Completing content, time:', timeSpent);

      if (timeSpent > 0) {
        await saveTimeToAnalytics(timeSpent);
      }

      setIsTrackingTime(false);

      const numericModuleIndex = getNumericModuleIndex(moduleIndex);
      const numericLessonIndex = getNumericLessonIndex(moduleIndex, lessonIndex);

      const response = await markContentCompleted(courseId, numericModuleIndex, numericLessonIndex);
      
      if (response && response.success) {
        onProgressUpdate && onProgressUpdate();
        console.log('✅ Content completed!');
        
        setTimeout(() => {
          navigate(`/courses/${courseId}/learn/${moduleIndex}/${lessonIndex}/quiz`);
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Completion failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getNumericModuleIndex = (moduleId) => {
    if (!currentCourse?.modules) return -1;
    for (let i = 0; i < currentCourse.modules.length; i++) {
      if (currentCourse.modules[i]._id === moduleId) return i;
    }
    return -1;
  };

  const getNumericLessonIndex = (moduleId, lessonId) => {
    const moduleIndex = getNumericModuleIndex(moduleId);
    if (moduleIndex === -1 || !currentCourse.modules[moduleIndex].lessons) return -1;
    const module = currentCourse.modules[moduleIndex];
    for (let i = 0; i < module.lessons.length; i++) {
      if (module.lessons[i]._id === lessonId) return i;
    }
    return -1;
  };

  // Navigation handlers
  const handleTakeQuiz = () => {
    if (lesson.contentCompleted) {
      console.log('🧭 Navigating to quiz...');
      navigate(`/courses/${courseId}/learn/${moduleIndex}/${lessonIndex}/quiz`);
    } else {
      console.log('❌ Cannot take quiz - content not completed');
    }
  };

  const handleReviewFlashcards = () => {
    if (lesson.quizCompleted) {
      console.log('🧭 Navigating to flashcards...');
      navigate(`/courses/${courseId}/learn/${moduleIndex}/${lessonIndex}/flashcards`);
    } else {
      console.log('❌ Cannot review flashcards - quiz not completed');
    }
  };

  const handleBackToCourse = () => {
    console.log('🧭 Navigating back to course...');
    navigate(`/courses/${courseId}`);
  };

  const handleNextLesson = () => {
    const currentModuleIdx = getNumericModuleIndex(moduleIndex);
    const currentLessonIdx = getNumericLessonIndex(moduleIndex, lessonIndex);
    
    if (currentModuleIdx === -1 || currentLessonIdx === -1) {
      console.error('❌ Invalid indexes for next lesson navigation');
      return;
    }

    const nextLessonIdx = currentLessonIdx + 1;
    
    if (currentCourse?.modules[currentModuleIdx]?.lessons[nextLessonIdx]) {
      const nextLesson = currentCourse.modules[currentModuleIdx].lessons[nextLessonIdx];
      console.log('🧭 Navigating to next lesson in same module:', nextLesson.title);
      navigate(`/courses/${courseId}/learn/${moduleIndex}/${nextLesson._id}/content`);
    } 
    else if (currentCourse?.modules[currentModuleIdx + 1]?.lessons[0]) {
      const nextModule = currentCourse.modules[currentModuleIdx + 1];
      const nextLesson = nextModule.lessons[0];
      console.log('🧭 Navigating to first lesson in next module:', nextModule.title);
      navigate(`/courses/${courseId}/learn/${nextModule._id}/${nextLesson._id}/content`);
    } 
    else {
      console.log('🎉 Course completed! Navigating to course overview');
      navigate(`/courses/${courseId}`);
    }
  };

  // IMPROVED: Render Structured Content with Better Formatting
  const renderStructuredContent = (content) => {
    if (!content || typeof content !== 'object') {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No structured content available for this lesson.</p>
        </div>
      );
    }

    // Extract important topics from detailed explanation
    const importantTopics = content.detailedExplanation ? 
      extractImportantTopics(content.detailedExplanation) : [];

    return (
      <div className="space-y-8">
        {/* Introduction Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-blue-900">Introduction</h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-line">
            {cleanText(content.introduction) || "This lesson covers essential concepts and their practical applications."}
          </p>
        </section>

        {/* Learning Objectives */}
        {content.learningObjectives && content.learningObjectives.length > 0 && (
          <section className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TargetIcon className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-bold text-green-900">What You'll Learn</h2>
            </div>
            <ul className="space-y-3">
              {content.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-[15px] leading-relaxed">
                    {cleanText(objective)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Key Concepts */}
        {content.keyConcepts && content.keyConcepts.length > 0 && (
          <section className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Key className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-bold text-purple-900">Core Concepts</h2>
            </div>
            <div className="grid gap-3">
              {content.keyConcepts.map((concept, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 text-[15px] leading-relaxed flex-1">
                      {cleanText(concept)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Important Topics Highlight */}
        {importantTopics.length > 0 && (
          <section className="bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-300 rounded-2xl p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="h-6 w-6 text-orange-600" />
              <h2 className="text-xl font-bold text-orange-900">Key Highlights</h2>
            </div>
            <div className="space-y-3">
              {importantTopics.map((topic, index) => (
                <div key={index} className="flex items-start space-x-3 bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-gray-800 text-[15px] leading-relaxed font-medium flex-1">
                    {topic}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Detailed Explanation */}
        {content.detailedExplanation && (
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">In-Depth Explanation</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <div className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-line space-y-4">
                {cleanText(content.detailedExplanation)
                  .split('\n\n')
                  .map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* Practical Examples */}
        {content.practicalExamples && content.practicalExamples.length > 0 && (
          <section className="bg-gradient-to-br from-teal-50 to-cyan-100 border border-teal-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Lightbulb className="h-6 w-6 text-teal-600" />
              <h2 className="text-xl font-bold text-teal-900">Practical Applications</h2>
            </div>
            <div className="space-y-4">
              {content.practicalExamples.map((example, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-teal-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 text-[15px] leading-relaxed">
                        {cleanText(example)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Important Points */}
        {content.importantPoints && content.importantPoints.length > 0 && (
          <section className="bg-gradient-to-br from-red-50 to-pink-100 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-900">Critical Points to Remember</h2>
            </div>
            <ul className="space-y-3">
              {content.importantPoints.map((point, index) => (
                <li key={index} className="flex items-start space-x-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-100">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bookmark className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-gray-700 text-[15px] leading-relaxed flex-1">
                    {cleanText(point)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Prerequisites */}
        {content.prerequisites && content.prerequisites.length > 0 && (
          <section className="bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <GraduationCap className="h-6 w-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-yellow-900">What You Should Know</h2>
            </div>
            <ul className="space-y-2">
              {content.prerequisites.map((prereq, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700 text-[15px]">
                    {cleanText(prereq)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Applications */}
        {content.applications && (
          <section className="bg-gradient-to-br from-indigo-50 to-purple-100 border border-indigo-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Rocket className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-indigo-900">Real-World Applications</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-line">
              {cleanText(content.applications)}
            </p>
          </section>
        )}

        {/* Summary */}
        {content.summary && (
          <section className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <List className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Quick Summary</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-line">
              {cleanText(content.summary)}
            </p>
          </section>
        )}

        {/* Difficulty & Time Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <span className="font-semibold text-gray-700">Estimated Reading Time:</span>
                <span className="text-gray-600 ml-2">{content.estimatedReadingTime || 5} minutes</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <div>
                <span className="font-semibold text-gray-700">Difficulty Level:</span>
                <span className="text-gray-600 ml-2 capitalize">{content.difficulty || 'medium'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // IMPROVED: Render Legacy Content (for string format)
  const renderLegacyContent = (content) => {
    if (!content) return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No content available for this lesson.</p>
      </div>
    );

    const cleanContent = cleanText(content);
    const importantTopics = extractImportantTopics(cleanContent);
    const paragraphs = cleanContent.split('\n\n').filter(p => p.trim().length > 0);

    return (
      <div className="space-y-8">
        {/* Important Topics from Legacy Content */}
        {importantTopics.length > 0 && (
          <section className="bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-300 rounded-2xl p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="h-6 w-6 text-orange-600" />
              <h2 className="text-xl font-bold text-orange-900">Key Highlights</h2>
            </div>
            <div className="space-y-3">
              {importantTopics.map((topic, index) => (
                <div key={index} className="flex items-start space-x-3 bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-gray-800 text-[15px] leading-relaxed font-medium flex-1">
                    {topic}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Content */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <BookOpen className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Lesson Content</h2>
          </div>
          <div className="space-y-6">
            {paragraphs.map((paragraph, index) => (
              <div key={index} className="text-gray-700 leading-relaxed text-[15px] bg-white px-5 py-4 rounded-xl border border-gray-100 shadow-sm">
                {paragraph}
              </div>
            ))}
          </div>
        </section>

        {/* Quick Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <span className="font-semibold text-gray-700">Estimated Reading Time:</span>
                <span className="text-gray-600 ml-2">5-10 minutes</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <div>
                <span className="font-semibold text-gray-700">Content Type:</span>
                <span className="text-gray-600 ml-2">Text Lesson</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main Content Renderer
  const renderContent = () => {
    if (!lesson?.content) {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No content available for this lesson.</p>
        </div>
      );
    }

    if (typeof lesson.content === 'object' && lesson.content !== null) {
      return renderStructuredContent(lesson.content);
    } else {
      return renderLegacyContent(lesson.content);
    }
  };

  if (!lesson) {
    return (
      <div className="max-w-5xl mx-auto px-2 sm:px-4">
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lesson Not Found</h2>
          <p className="text-gray-600 mb-4">The requested lesson could not be loaded.</p>
          <button
            onClick={handleBackToCourse}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4">
      {/* Enhanced Lesson Header */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-200 rounded-3xl p-8 mb-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
              {/* Time Tracking Badge */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-100 px-3 py-2 rounded-full border border-green-200 shadow-sm">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-700">{formatTime(timeSpent)}</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>

              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-700">{lesson.duration || 10} min</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-full border border-purple-200 shadow-sm">
                <BookOpen className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-purple-700">Lesson</span>
              </div>
              
              {lesson.completed && (
                <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-2 rounded-full border border-green-200 shadow-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-semibold">Completed</span>
                </div>
              )}

              {lesson.contentCompleted && (
                <div className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                  <Target className="h-4 w-4" />
                  <span className="font-semibold">Content Done</span>
                </div>
              )}

              {lesson.quizCompleted && (
                <div className="flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-full border border-purple-200 shadow-sm">
                  <Award className="h-4 w-4" />
                  <span className="font-semibold">Quiz Done</span>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent">
              {lesson.title}
            </h1>
          </div>
          
          {/* Action Buttons */}
          {!lesson.completed && (
            <div className="flex flex-col gap-3">
              {!lesson.contentCompleted && (
                <button
                  onClick={handleContentComplete}
                  disabled={isLoading}
                  className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-2xl shadow-green-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  <span className="text-lg">Complete Content</span>
                </button>
              )}

              {lesson.contentCompleted && !lesson.quizCompleted && (
                <button
                  onClick={handleTakeQuiz}
                  className="flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-2xl shadow-purple-300/50"
                >
                  <Play className="h-5 w-5" />
                  <span className="text-lg">Take Quiz</span>
                </button>
              )}

              {lesson.quizCompleted && !lesson.flashcardsCompleted && (
                <button
                  onClick={handleReviewFlashcards}
                  className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-2xl shadow-orange-300/50"
                >
                  <Layers className="h-5 w-5" />
                  <span className="text-lg">Review Flashcards</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress Tracking Info */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                Time spent: <strong className="text-green-600">{formatTime(timeSpent)}</strong>
                {totalTimeSaved > 0 && (
                  <span className="text-gray-500 ml-2">
                    (Saved: {formatTime(totalTimeSaved)})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500">
                Auto-saves every 2 minutes ✅
              </div>
              <button
                onClick={handleManualSave}
                className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
              >
                <Save className="h-3 w-3" />
                <span>Save Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="bg-white border border-gray-200 rounded-3xl p-8 mb-8 shadow-lg">
        <div className="max-w-none">
          {renderContent()}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          onClick={handleBackToCourse}
          className="flex-1 flex items-center justify-center space-x-3 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl text-base font-semibold hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Course Overview</span>
        </button>
        
        {lesson.completed ? (
          <button
            onClick={handleNextLesson}
            className="flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 hover:scale-105 shadow-2xl shadow-blue-400/50"
          >
            <span>Next Lesson</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            {!lesson.contentCompleted && (
              <button
                onClick={handleContentComplete}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 hover:scale-105 shadow-2xl shadow-green-300/50 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                <span>Complete Content</span>
              </button>
            )}

            {lesson.contentCompleted && !lesson.quizCompleted && (
              <button
                onClick={handleTakeQuiz}
                className="flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 hover:scale-105 shadow-2xl shadow-purple-300/50"
              >
                <Play className="h-5 w-5" />
                <span>Take Quiz</span>
              </button>
            )}

            {lesson.quizCompleted && !lesson.flashcardsCompleted && (
              <button
                onClick={handleReviewFlashcards}
                className="flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 hover:scale-105 shadow-2xl shadow-orange-300/50"
              >
                <Layers className="h-5 w-5" />
                <span>Review Flashcards</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonContent;