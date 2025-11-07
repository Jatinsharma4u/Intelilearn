import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourse } from '../contexts/CourseContext';
import FileUpload from '../components/course/FileUpload';
import SettingsConfiguration from '../components/course/SettingsConfiguration';
import CoursePreview from '../components/course/CoursePreview';
import MainLayout from '../components/layout/MainLayout';

const CourseCreation = () => {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [settings, setSettings] = useState({
    courseName: '',
    modulesCount: 5,
    flashcardsCount: 20,
    difficulty: 'beginner',
    learningPace: 'medium',
    questionsPerModule: 10,
    examType: 'academic',
    depthLevel: 'comprehensive'
  });
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [creationStatus, setCreationStatus] = useState(''); // AI processing, generating, etc.
  
  const { createCourse, loading, error } = useCourse();
  const navigate = useNavigate();

  const handleFileUpload = (uploadedFiles) => {
    setFiles(uploadedFiles);
    setStep(2);
  };

  const handleSettingsSubmit = (newSettings) => {
    setSettings(newSettings);
    setStep(3);
  };

  const handleCreateCourse = async () => {
    try {
      setCreationStatus('processing');
      
      const courseData = {
        title: settings.courseName,
        settings: {
          modulesCount: settings.modulesCount,
          flashcardsCount: settings.flashcardsCount,
          difficulty: settings.difficulty,
          learningPace: settings.learningPace,
          questionsPerModule: settings.questionsPerModule,
          examType: settings.examType,
          depthLevel: settings.depthLevel
        }
      };

      // Simulate AI processing steps
      setCreationStatus('extracting_text');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCreationStatus('analyzing_content');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCreationStatus('generating_course');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const course = await createCourse(courseData, files);
      setGeneratedCourse(course);
      setCreationStatus('completed');
      
      // Navigate to course player after successful creation
      setTimeout(() => {
        navigate(`/courses/learn/${course._id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Course creation error:', err);
      setCreationStatus('error');
    }
  };

  const steps = [
    { number: 1, title: 'Upload Files', icon: '📁', active: step === 1 },
    { number: 2, title: 'Settings', icon: '⚙️', active: step === 2 },
    { number: 3, title: 'Create', icon: '🚀', active: step === 3 }
  ];

  const getStatusMessage = () => {
    switch (creationStatus) {
      case 'processing': return 'Initializing AI processor...';
      case 'extracting_text': return 'Extracting text from your files...';
      case 'analyzing_content': return 'Analyzing content structure...';
      case 'generating_course': return 'Generating course content...';
      case 'completed': return 'Course created successfully!';
      default: return '';
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0D0D14] py-6">
        <div className="container mx-auto px-4 sm:px-6">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Create AI Course
            </h1>
            <p className="text-[#A0A0B8] text-sm sm:text-base">
              Transform your files into an interactive learning experience
            </p>
          </div>

          {/* Progress Steps - Mobile Optimized */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex justify-between items-center relative">
              {/* Connection Line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#2A2A3D] -z-10"></div>
              
              {steps.map((stepInfo, index) => (
                <div key={stepInfo.number} className="flex flex-col items-center relative z-10">
                  {/* Step Circle */}
                  <div className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center 
                    border-2 transition-all duration-300 text-sm sm:text-base
                    ${stepInfo.active 
                      ? 'bg-[#0082FB] border-[#0082FB] text-white scale-110' 
                      : step > stepInfo.number
                      ? 'bg-[#00FFA3] border-[#00FFA3] text-white'
                      : 'bg-[#1B1B28] border-[#2A2A3D] text-[#A0A0B8]'
                    }
                  `}>
                    {step > stepInfo.number ? '✓' : stepInfo.icon}
                  </div>
                  
                  {/* Step Title */}
                  <div className={`
                    mt-2 text-xs sm:text-sm font-medium text-center
                    ${stepInfo.active ? 'text-white' : 'text-[#A0A0B8]'}
                    hidden sm:block
                  `}>
                    {stepInfo.title}
                  </div>
                  
                  {/* Mobile Step Title */}
                  <div className="sm:hidden mt-1 text-[10px] text-[#A0A0B8] text-center">
                    Step {stepInfo.number}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#1B1B28] rounded-xl border border-[#2A2A3D] p-4 sm:p-6">
              
              {/* AI Processing Loader */}
              {creationStatus && creationStatus !== 'completed' && creationStatus !== 'error' && (
                <div className="mb-6 p-4 bg-[#2A2A3D] rounded-lg border border-[#0082FB]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">AI Processing</span>
                    <span className="text-[#0082FB] text-xs">{getStatusMessage()}</span>
                  </div>
                  <div className="w-full bg-[#0D0D14] rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] h-2 rounded-full transition-all duration-1000 animate-pulse"></div>
                  </div>
                </div>
              )}

              <div className="creation-content min-h-96">
                {step === 1 && (
                  <FileUpload onFilesUpload={handleFileUpload} />
                )}

                {step === 2 && (
                  <SettingsConfiguration
                    settings={settings}
                    onSettingsSubmit={handleSettingsSubmit}
                    onBack={() => setStep(1)}
                  />
                )}

                {step === 3 && (
                  <CoursePreview
                    files={files}
                    settings={settings}
                    onBack={() => setStep(2)}
                    onCreateCourse={handleCreateCourse}
                    loading={loading || creationStatus !== ''}
                    creationStatus={creationStatus}
                  />
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-700 text-[#FF4D6D] rounded-lg flex items-center gap-3">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className="font-medium">Creation Failed</div>
                    <div className="text-sm opacity-90">{error}</div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {generatedCourse && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-700 text-[#00FFA3] rounded-lg flex items-center gap-3">
                  <span className="text-lg">🎉</span>
                  <div>
                    <div className="font-medium">Course Created!</div>
                    <div className="text-sm opacity-90">Redirecting to your new course...</div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="text-center text-[#A0A0B8] p-3 bg-[#1B1B28] rounded-lg border border-[#2A2A3D]">
                <div className="text-lg mb-1">📚</div>
                Supports PDF, PPT, DOC, TXT
              </div>
              <div className="text-center text-[#A0A0B8] p-3 bg-[#1B1B28] rounded-lg border border-[#2A2A3D]">
                <div className="text-lg mb-1">⚡</div>
                AI-powered content generation
              </div>
              <div className="text-center text-[#A0A0B8] p-3 bg-[#1B1B28] rounded-lg border border-[#2A2A3D]">
                <div className="text-lg mb-1">🎯</div>
                Interactive quizzes & flashcards
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CourseCreation;