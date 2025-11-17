import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ManualQuizForm from '../../components/classroom/ManualQuizForm';
import PDFQuizForm from '../../components/classroom/PDFQuizForm';
import Loader from '../../components/ui/Loader';

const QuizCreator = () => {
  const { classroomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const quizType = searchParams.get('type') || 'manual';
  const [activeMode, setActiveMode] = useState(quizType);
  const [loading, setLoading] = useState(false);

  const modes = [
    { 
      id: 'manual', 
      label: 'Manual Quiz', 
      description: 'Create questions manually with full control',
      icon: '✍️',
      features: ['Full control over questions', 'Custom options', 'Instant creation']
    },
    { 
      id: 'pdf', 
      label: 'PDF / AI Quiz', 
      description: 'Upload PDF and generate quiz automatically using AI',
      icon: '📄',
      features: ['AI-powered generation', 'Save time', 'Automatic extraction']
    }
  ];

  const handleModeChange = (modeId) => {
    setActiveMode(modeId);
    navigate(`/classroom/${classroomId}/quiz/create?type=${modeId}`, { replace: true });
  };

  const handleBackToClassroom = () => {
    navigate(`/classroom/${classroomId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D14] text-white">
      {/* Compact Header */}
      <div className="bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] border-b border-[#2A2A3D]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBackToClassroom}
              className="flex items-center gap-2 text-[#A0A0B8] hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Create New Quiz
              </h1>
              <p className="text-[#A0A0B8] text-sm">Choose your preferred creation method</p>
            </div>
          </div>

          {/* Compact Mode Selection */}
          <div className="flex gap-3 mb-4">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  activeMode === mode.id
                    ? 'border-blue-500 bg-blue-500/10 shadow-md shadow-blue-500/10'
                    : 'border-[#2A2A3D] bg-[#1B1B28] hover:border-blue-500/30 hover:bg-blue-500/5'
                }`}
              >
                <div className={`text-lg p-2 rounded-md ${
                  activeMode === mode.id ? 'bg-blue-500/20' : 'bg-[#2A2A3D]'
                }`}>
                  {mode.icon}
                </div>
                
                <div className="flex-1 text-left">
                  <h3 className={`font-semibold text-sm ${
                    activeMode === mode.id ? 'text-blue-400' : 'text-white'
                  }`}>
                    {mode.label}
                  </h3>
                  <p className="text-[#A0A0B8] text-xs hidden sm:block">
                    {mode.description}
                  </p>
                </div>
                
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  activeMode === mode.id 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-[#A0A0B8]'
                }`}>
                  {activeMode === mode.id && (
                    <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Feature Highlights - Only show for active mode */}
          <div className="bg-[#1B1B28]/50 rounded-lg p-3 border border-[#2A2A3D]">
            <div className="flex flex-wrap gap-4 justify-center">
              {modes
                .find(mode => mode.id === activeMode)
                ?.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-[#A0A0B8]">
                    <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Form Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-[#1B1B28] rounded-xl border border-[#2A2A3D]">
          {activeMode === 'manual' && <ManualQuizForm />}
          {activeMode === 'pdf' && <PDFQuizForm />}
        </div>
      </div>
    </div>
  );
};

export default QuizCreator;