// src/components/upload/GenerationLoader.jsx - UPDATED
import React, { useState, useEffect } from 'react';
import { Cpu, BookOpen, CheckCircle, Clock, Sparkles, FileText, Brain, Target } from 'lucide-react';

const GenerationLoader = ({ courseTitle }) => {
  const [currentStep, setCurrentStep] = useState('analyzing');
  const [completedSteps, setCompletedSteps] = useState([]);

  const steps = [
    { key: 'analyzing', label: 'Analyzing Content', icon: FileText, description: 'Reading and understanding your material' },
    { key: 'structuring', label: 'Structuring Course', icon: BookOpen, description: 'Organizing modules and lessons' },
    { key: 'generating', label: 'Generating Content', icon: Brain, description: 'Creating lessons and examples' },
    { key: 'assessments', label: 'Creating Assessments', icon: Target, description: 'Building quizzes and flashcards' },
    { key: 'finalizing', label: 'Finalizing', icon: CheckCircle, description: 'Putting everything together' }
  ];

  useEffect(() => {
    // Simulate the generation process
    const stepInterval = setInterval(() => {
      setCompletedSteps(prev => {
        const currentIndex = steps.findIndex(step => step.key === currentStep);
        if (currentIndex < steps.length - 1) {
          setCurrentStep(steps[currentIndex + 1].key);
          return [...prev, steps[currentIndex].key];
        } else {
          clearInterval(stepInterval);
          return prev;
        }
      });
    }, 3000);

    return () => {
      clearInterval(stepInterval);
    };
  }, [currentStep]);

  const getStepStatus = (stepKey) => {
    if (completedSteps.includes(stepKey)) return 'completed';
    if (currentStep === stepKey) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-[#1B1B28] border border-[#2A2A3D] rounded-2xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-[#FF6B35] to-[#FF8E53] rounded-full flex items-center justify-center mx-auto mb-4 relative">
          <Cpu className="h-8 w-8 text-white" />
          <div className="absolute -top-1 -right-1">
            <Sparkles className="h-5 w-5 text-yellow-400 animate-ping" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Creating Your Course</h3>
        <p className="text-[#A0A0B8]">
          AI is generating "<span className="text-white font-medium">{courseTitle}</span>"
        </p>
      </div>

      {/* Overall Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-[#A0A0B8] mb-2">
          <span>Overall Progress</span>
          <span>{completedSteps.length}/{steps.length} steps completed</span>
        </div>
        <div className="w-full bg-[#2A2A3D] rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-[#FF6B35] to-[#FF8E53] h-3 rounded-full transition-all duration-500"
            style={{ 
              width: `${(completedSteps.length / steps.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Generation Steps */}
      <div className="space-y-4 mb-8">
        <h4 className="text-sm font-semibold text-white mb-3">Generation Steps</h4>
        {steps.map((step, index) => {
          const status = getStepStatus(step.key);
          const StepIcon = step.icon;
          
          return (
            <div
              key={step.key}
              className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-300 ${
                status === 'active'
                  ? 'bg-[#FF6B35]/10 border-[#FF6B35]'
                  : status === 'completed'
                  ? 'bg-[#00FFA3]/10 border-[#00FFA3]'
                  : 'bg-[#2A2A3D] border-[#2A2A3D]'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                status === 'active'
                  ? 'bg-[#FF6B35] animate-pulse'
                  : status === 'completed'
                  ? 'bg-[#00FFA3]'
                  : 'bg-[#2A2A3D] border border-[#3A3A4D]'
              }`}>
                {status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <StepIcon className="h-5 w-5 text-white" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${
                    status === 'active' ? 'text-white' : 
                    status === 'completed' ? 'text-[#00FFA3]' : 
                    'text-[#A0A0B8]'
                  }`}>
                    {step.label}
                  </span>
                  <span className={`text-sm ${
                    status === 'active' ? 'text-[#FF6B35]' : 
                    status === 'completed' ? 'text-[#00FFA3]' : 
                    'text-[#A0A0B8]'
                  }`}>
                    {status === 'active' ? 'In Progress...' : 
                     status === 'completed' ? 'Completed' : 
                     'Pending'}
                  </span>
                </div>
                <p className="text-xs text-[#A0A0B8]">{step.description}</p>
                
                {status === 'active' && (
                  <div className="mt-2">
                    <div className="flex space-x-1">
                      {['Processing', 'Analyzing', 'Generating'].map((action, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-[#FF6B35]/20 rounded px-2 py-1 text-xs text-[#FF6B35] text-center animate-pulse"
                        >
                          {action}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Message */}
      <div className="mt-6 p-4 bg-[#0D0D14] rounded-xl border border-[#2A2A3D]">
        <div className="flex items-center space-x-3">
          <Brain className="h-5 w-5 text-[#FF6B35]" />
          <div>
            <p className="text-white text-sm font-medium">AI is Working Hard</p>
            <p className="text-[#A0A0B8] text-xs">
              {currentStep === 'analyzing' && 'Reading and understanding your document...'}
              {currentStep === 'structuring' && 'Organizing content into modules and lessons...'}
              {currentStep === 'generating' && 'Creating detailed lesson content and examples...'}
              {currentStep === 'assessments' && 'Building quizzes and interactive flashcards...'}
              {currentStep === 'finalizing' && 'Finalizing your course...'}
            </p>
          </div>
        </div>
      </div>

      {/* Estimated Time */}
      <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-[#A0A0B8]">
        <Clock className="h-4 w-4" />
        <span>Estimated time remaining: {Math.max(1, 5 - completedSteps.length)}-{Math.max(2, 8 - completedSteps.length)} minutes</span>
      </div>
    </div>
  );
};

export default GenerationLoader;