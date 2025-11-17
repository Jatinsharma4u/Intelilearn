// src/pages/CreateCourse.jsx - FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '../contexts/CourseContext';
import CourseSettingsForm from '../components/courses/CourseSettingsForm';
import FileUploadZone from '../components/upload/FileUploadZone';
import UploadProgress from '../components/upload/UploadProgress';
import GenerationLoader from '../components/upload/GenerationLoader';
import { ArrowLeft, Upload, Settings, BookOpen, CheckCircle, AlertCircle, Sparkles, FileText } from 'lucide-react';

const CreateCourse = () => {
  const navigate = useNavigate();
  const { createCourse, uploadProgress, loading, error: contextError, clearError } = useCourses();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    settings: {
      contentType: 'comprehensive',
      difficulty: 'beginner',
      learningPace: 'moderate',
      questionsPerTopic: 5,
      flashcardsPerModule: 3,
      quizDifficulty: 'medium',
      includeExercises: true,
      contentStyle: 'interactive',
      totalModules: 5,
      lessonsPerModule: 4
    }
  });
  const [creationStatus, setCreationStatus] = useState('idle'); // idle, uploading, generating, completed, failed
  const [generatedCourseId, setGeneratedCourseId] = useState(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [localError, setLocalError] = useState(null); // 🔥 FIX: Added local error state
  const pollIntervalRef = useRef(null);

  // Clear errors when component mounts or step changes
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [step, clearError]);

  // Poll for course generation status
  useEffect(() => {
    if (creationStatus === 'generating' && generatedCourseId) {
      let count = 0;
      pollIntervalRef.current = setInterval(async () => {
        count++;
        setPollingCount(count);
        
        try {
          const response = await fetch(`/api/courses/${generatedCourseId}/status`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          
          if (response.ok) {
            const statusData = await response.json();
            
            if (statusData.success) {
              if (statusData.status === 'completed' && !statusData.isGenerating) {
                setCreationStatus('completed');
                clearInterval(pollIntervalRef.current);
              } else if (statusData.status === 'failed') {
                setCreationStatus('failed');
                setLocalError('Course generation failed. Please try again.'); // 🔥 FIX: Use localError
                clearInterval(pollIntervalRef.current);
              }
              // If still generating, continue polling
            }
          }
        } catch (error) {
          console.error('Status polling error:', error);
          // Continue polling on network errors
        }

        // Timeout after 5 minutes (300 seconds)
        if (count > 100) { // 100 * 3 seconds = 5 minutes
          setCreationStatus('failed');
          setLocalError('Course generation is taking longer than expected. Please check back later.'); // 🔥 FIX: Use localError
          clearInterval(pollIntervalRef.current);
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [creationStatus, generatedCourseId]);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    // Auto-generate title from filename if not set
    if (!courseData.title) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const formattedTitle = fileName
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      setCourseData(prev => ({
        ...prev,
        title: formattedTitle
      }));
    }
    setStep(2);
    clearError();
    setLocalError(null); // 🔥 FIX: Clear local error
  };

  const handleSettingsSubmit = (settings) => {
    setCourseData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
    setStep(3);
    clearError();
    setLocalError(null); // 🔥 FIX: Clear local error
  };

  const handleCreateCourse = async () => {
    if (!file) {
      setLocalError('Please select a file first'); // 🔥 FIX: Use localError
      return;
    }

    try {
      setCreationStatus('uploading');
      clearError();
      setLocalError(null); // 🔥 FIX: Clear local error

      const result = await createCourse(file, courseData);
      
      if (result && result.success) {
        setGeneratedCourseId(result.courseId);
        setCreationStatus('generating');
        setPollingCount(0);
        
        console.log('Course generation started with ID:', result.courseId);
      } else {
        setCreationStatus('failed');
        setLocalError(result?.message || 'Failed to start course generation'); // 🔥 FIX: Use localError
      }
    } catch (err) {
      setCreationStatus('failed');
      setLocalError(err.message || 'Failed to create course'); // 🔥 FIX: Use localError
    }
  };

  const handleBackToCourses = () => {
    navigate('/courses');
  };

  const handleRetry = () => {
    setCreationStatus('idle');
    setStep(3);
    clearError();
    setLocalError(null); // 🔥 FIX: Clear local error
    setPollingCount(0);
  };

  const handleStartNewCourse = () => {
    setCreationStatus('idle');
    setStep(1);
    setFile(null);
    setGeneratedCourseId(null);
    setCourseData({
      title: '',
      description: '',
      settings: {
        contentType: 'comprehensive',
        difficulty: 'beginner',
        learningPace: 'moderate',
        questionsPerTopic: 5,
        flashcardsPerModule: 3,
        quizDifficulty: 'medium',
        includeExercises: true,
        contentStyle: 'interactive',
        totalModules: 5,
        lessonsPerModule: 4
      }
    });
    clearError();
    setLocalError(null); // 🔥 FIX: Clear local error
  };

  const steps = [
    { number: 1, title: 'Upload File', icon: Upload, description: 'Select your learning material' },
    { number: 2, title: 'Course Settings', icon: Settings, description: 'Customize your course' },
    { number: 3, title: 'Create Course', icon: BookOpen, description: 'Generate with AI' }
  ];

  const getStepStatus = (stepNumber) => {
    if (step > stepNumber) return 'completed';
    if (step === stepNumber) return 'current';
    return 'upcoming';
  };

  // 🔥 FIX: Combine context error and local error for display
  const displayError = localError || contextError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D14] to-[#1A1A2E] text-white">
      {/* Enhanced Header */}
      <div className="border-b border-[#2A2A3D]/50 bg-[#1B1B28]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/courses')}
                className="p-2 hover:bg-[#2A2A3D] rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50"
                disabled={creationStatus === 'generating'}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className={`p-3 rounded-2xl shadow-lg transition-all duration-300 ${
                creationStatus === 'completed' 
                  ? 'bg-gradient-to-br from-[#00FFA3] to-[#00CC83] shadow-[#00FFA3]/20' 
                  : creationStatus === 'generating'
                  ? 'bg-gradient-to-br from-[#FF6B35] to-[#FF8E53] shadow-[#FF6B35]/20 animate-pulse'
                  : 'bg-gradient-to-br from-[#0082FB] to-[#0064E0] shadow-[#0082FB]/20'
              }`}>
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {creationStatus === 'completed' ? 'Course Created!' : 
                   creationStatus === 'generating' ? 'Generating Course...' : 
                   'Create New Course'}
                </h1>
                <p className="text-[#A0A0B8]">
                  {creationStatus === 'completed' ? 'Your course is ready to use' :
                   creationStatus === 'generating' ? 'AI is creating your learning content' :
                   'Transform your materials into an AI-powered learning experience'}
                </p>
              </div>
            </div>
            
            {creationStatus === 'generating' && (
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-full">
                <div className="w-2 h-2 bg-[#FF6B35] rounded-full animate-pulse"></div>
                <span className="text-sm text-[#FF6B35]">Generating</span>
              </div>
            )}
          </div>

          {/* Enhanced Progress Steps */}
          {creationStatus !== 'generating' && creationStatus !== 'completed' && (
            <div className="mt-6">
              <div className="flex justify-between relative">
                {steps.map((stepItem, index) => {
                  const StepIcon = stepItem.icon;
                  const status = getStepStatus(stepItem.number);
                  
                  return (
                    <div key={stepItem.number} className="flex flex-col items-center flex-1 z-10">
                      <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300 shadow-lg ${
                        status === 'completed'
                          ? 'bg-gradient-to-br from-[#00FFA3] to-[#00CC83] border-[#00FFA3] shadow-[#00FFA3]/25'
                          : status === 'current'
                          ? 'bg-gradient-to-br from-[#0082FB] to-[#0064E0] border-[#0082FB] shadow-[#0082FB]/25'
                          : 'bg-[#1B1B28] border-[#2A2A3D] shadow-[#2A2A3D]/25'
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle className="h-6 w-6 text-white" />
                        ) : (
                          <StepIcon className={`h-6 w-6 ${
                            status === 'current' ? 'text-white' : 'text-[#A0A0B8]'
                          }`} />
                        )}
                      </div>
                      <span className={`mt-3 text-sm font-semibold text-center ${
                        status === 'completed' || status === 'current' ? 'text-white' : 'text-[#A0A0B8]'
                      }`}>
                        {stepItem.title}
                      </span>
                      <span className="text-xs text-[#A0A0B8] mt-1 text-center max-w-[120px] leading-tight">
                        {stepItem.description}
                      </span>
                      
                      {/* Enhanced Connector line */}
                      {index < steps.length - 1 && (
                        <div className={`absolute top-7 left-1/2 w-full h-1 -z-10 transition-all duration-500 ${
                          status === 'completed' ? 'bg-gradient-to-r from-[#00FFA3] to-[#0082FB]' : 'bg-[#2A2A3D]'
                        }`} style={{ left: `${(index * 33.33) + 16.665}%` }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Enhanced Error Message */}
        {displayError && ( // 🔥 FIX: Use displayError instead of error
          <div className="mb-6 p-6 bg-gradient-to-r from-[#FF4D6D]/10 to-[#FF8FA3]/5 border border-[#FF4D6D]/20 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#FF4D6D] rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[#FF4D6D] font-semibold text-lg mb-1">Something went wrong</p>
                <p className="text-[#FF4D6D] text-sm opacity-90">{displayError}</p> {/* 🔥 FIX: Use displayError */}
              </div>
              {creationStatus === 'failed' && (
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-gradient-to-r from-[#FF4D6D] to-[#FF3366] text-white rounded-xl text-sm font-semibold hover:from-[#FF3366] hover:to-[#FF1A54] transition-all duration-200 hover:scale-105 shadow-lg shadow-[#FF4D6D]/25"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 1: File Upload */}
        {step === 1 && creationStatus === 'idle' && (
          <div className="bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] border border-[#2A2A3D] rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0082FB]/25">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                Upload Your Learning Material
              </h2>
              <p className="text-[#A0A0B8] text-lg max-w-2xl mx-auto">
                Upload PDF or DOCX files to transform them into interactive AI-powered courses with personalized learning paths
              </p>
            </div>
            <FileUploadZone 
              onFileSelect={handleFileSelect}
              isLoading={loading}
            />
          </div>
        )}

        {/* Step 2: Course Settings */}
        {step === 2 && creationStatus === 'idle' && file && (
          <div className="bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] border border-[#2A2A3D] rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0082FB]/25">
                <Settings className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                Customize Your Course
              </h2>
              <p className="text-[#A0A0B8] text-lg">
                Adjust settings to match your learning preferences and goals for the perfect learning experience
              </p>
            </div>
            <CourseSettingsForm
              courseData={courseData}
              onSubmit={handleSettingsSubmit}
              onBack={() => {
                setStep(1);
                clearError();
                setLocalError(null); // 🔥 FIX: Clear local error
              }}
            />
          </div>
        )}

        {/* Step 3: Create Course */}
        {step === 3 && creationStatus === 'idle' && file && (
          <div className="bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] border border-[#2A2A3D] rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0082FB]/25">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                Ready to Create
              </h2>
              <p className="text-[#A0A0B8] text-lg">
                Review your course details and start the AI generation process
              </p>
            </div>

            {/* Enhanced Course Summary */}
            <div className="bg-gradient-to-br from-[#0D0D14] to-[#1A1A2E] rounded-2xl p-8 mb-8 border border-[#2A2A3D] shadow-lg">
              <h3 className="text-xl font-semibold mb-6 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span>Course Summary</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-[#1B1B28] p-4 rounded-xl border border-[#2A2A3D]">
                    <p className="text-[#A0A0B8] text-sm mb-1">Course Title</p>
                    <p className="text-white font-semibold text-lg">{courseData.title}</p>
                  </div>
                  <div className="bg-[#1B1B28] p-4 rounded-xl border border-[#2A2A3D]">
                    <p className="text-[#A0A0B8] text-sm mb-1">Source File</p>
                    <p className="text-white font-medium flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-[#0082FB]" />
                      <span>{file.name}</span>
                    </p>
                  </div>
                  <div className="bg-[#1B1B28] p-4 rounded-xl border border-[#2A2A3D]">
                    <p className="text-[#A0A0B8] text-sm mb-1">Learning Level</p>
                    <p className="text-white font-medium capitalize">{courseData.settings.difficulty}</p>
                  </div>
                  <div className="bg-[#1B1B28] p-4 rounded-xl border border-[#2A2A3D]">
                    <p className="text-[#A0A0B8] text-sm mb-1">Content Depth</p>
                    <p className="text-white font-medium capitalize">{courseData.settings.contentType}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-[#1B1B28] p-4 rounded-xl border border-[#2A2A3D]">
                    <p className="text-[#A0A0B8] text-sm mb-1">Course Structure</p>
                    <p className="text-white font-semibold text-lg">
                      {courseData.settings.totalModules} modules × {courseData.settings.lessonsPerModule} lessons
                    </p>
                  </div>
                  <div className="bg-[#1B1B28] p-4 rounded-xl border border-[#2A2A3D]">
                    <p className="text-[#A0A0B8] text-sm mb-1">Learning Pace</p>
                    <p className="text-white font-medium capitalize">{courseData.settings.learningPace}</p>
                  </div>
                  <div className="bg-[#1B1B28] p-4 rounded-xl border border-[#2A2A3D]">
                    <p className="text-[#A0A0B8] text-sm mb-1">Interactive Elements</p>
                    <div className="flex space-x-4 text-sm">
                      <div>
                        <p className="text-white font-semibold">
                          {courseData.settings.totalModules * courseData.settings.lessonsPerModule * courseData.settings.questionsPerTopic}
                        </p>
                        <p className="text-[#A0A0B8]">Quiz Questions</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {courseData.settings.totalModules * courseData.settings.flashcardsPerModule}
                        </p>
                        <p className="text-[#A0A0B8]">Flashcards</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setStep(2);
                  clearError();
                  setLocalError(null); // 🔥 FIX: Clear local error
                }}
                className="flex-1 px-8 py-4 border-2 border-[#2A2A3D] text-white rounded-2xl hover:border-[#0082FB] hover:bg-[#0082FB]/5 transition-all duration-200 hover:scale-105 font-semibold"
              >
                Back to Settings
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0082FB] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-[#0082FB]/25"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Starting Generation...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <Sparkles className="h-5 w-5" />
                    <span>Generate Course with AI</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {creationStatus === 'uploading' && uploadProgress > 0 && (
          <div className="space-y-8">
            <UploadProgress 
              progress={uploadProgress} 
              fileName={file.name}
              status="Uploading your file..."
              isGenerating={false}
            />
            
            <div className="text-center">
              <p className="text-[#A0A0B8] text-lg">
                Preparing for AI course generation...
              </p>
            </div>
          </div>
        )}

        {/* Generation Loader */}
        {creationStatus === 'generating' && (
          <div className="space-y-8">
            <GenerationLoader 
              courseTitle={courseData.title}
            />
            
            <div className="text-center bg-[#1B1B28] rounded-2xl p-6 border border-[#2A2A3D]">
              <p className="text-[#A0A0B8] text-lg mb-4">
                ✨ AI is crafting your personalized learning experience
              </p>
              <div className="flex justify-center space-x-6 text-sm text-[#A0A0B8]">
                <div className="text-center">
                  <div className="text-white font-semibold text-lg">{courseData.settings.totalModules}</div>
                  <div>Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold text-lg">
                    {courseData.settings.totalModules * courseData.settings.lessonsPerModule}
                  </div>
                  <div>Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold text-lg">
                    {courseData.settings.totalModules * courseData.settings.lessonsPerModule * courseData.settings.questionsPerTopic}
                  </div>
                  <div>Quiz Questions</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Completion State */}
        {creationStatus === 'completed' && (
          <div className="bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] border border-[#2A2A3D] rounded-3xl p-12 text-center shadow-2xl">
            <div className="w-24 h-24 bg-gradient-to-br from-[#00FFA3] to-[#00CC83] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#00FFA3]/25">
              <CheckCircle className="h-12 w-12 text-[#0D0D14]" />
            </div>
            
            <h2 className="text-4xl font-bold bg-gradient-to-r from-[#00FFA3] to-[#00CC83] bg-clip-text text-transparent mb-4">
              Course Created Successfully!
            </h2>
            <p className="text-[#A0A0B8] text-xl mb-12 max-w-2xl mx-auto">
              Your course "<span className="text-white font-semibold">{courseData.title}</span>" is now ready and optimized for your learning journey.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-[#0D0D14] to-[#1A1A2E] p-6 rounded-2xl border border-[#2A2A3D] shadow-lg">
                <div className="text-3xl font-bold text-white mb-2">{courseData.settings.totalModules}</div>
                <div className="text-[#00FFA3] font-semibold">Learning Modules</div>
              </div>
              <div className="bg-gradient-to-br from-[#0D0D14] to-[#1A1A2E] p-6 rounded-2xl border border-[#2A2A3D] shadow-lg">
                <div className="text-3xl font-bold text-white mb-2">
                  {courseData.settings.totalModules * courseData.settings.lessonsPerModule}
                </div>
                <div className="text-[#00FFA3] font-semibold">Interactive Lessons</div>
              </div>
              <div className="bg-gradient-to-br from-[#0D0D14] to-[#1A1A2E] p-6 rounded-2xl border border-[#2A2A3D] shadow-lg">
                <div className="text-3xl font-bold text-white mb-2">
                  {courseData.settings.totalModules * courseData.settings.lessonsPerModule * courseData.settings.questionsPerTopic}
                </div>
                <div className="text-[#00FFA3] font-semibold">Quiz Questions</div>
              </div>
            </div>

            <div className="flex space-x-6 max-w-md mx-auto">
              <button
                onClick={handleStartNewCourse}
                className="flex-1 px-8 py-4 border-2 border-[#2A2A3D] text-white rounded-2xl hover:border-[#0082FB] hover:bg-[#0082FB]/5 transition-all duration-200 hover:scale-105 font-semibold"
              >
                Create Another
              </button>
              {generatedCourseId && (
                <button
                  onClick={() => navigate(`/courses/${generatedCourseId}`)}
                  className="flex-1 bg-gradient-to-r from-[#00FFA3] to-[#00CC83] hover:from-[#00CC83] hover:to-[#00FFA3] text-[#0D0D14] px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-[#00FFA3]/25"
                >
                  Start Learning
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateCourse;