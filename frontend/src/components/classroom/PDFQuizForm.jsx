import React, { useState } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../ui/Loader';

const PDFQuizForm = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { createPDFQuiz, loading, error } = useClassroom();

  const [pdfFile, setPdfFile] = useState(null);
  const [settings, setSettings] = useState({
    title: '',
    description: '',
    numQuestions: 10,
    difficulty: 'medium',
    examTime: 30,
    focusTopics: [],
    allowRetakes: false,
    shuffleQuestions: true,
    showResults: true,
    showAnswers: false,
    passingMarks: 40
  });
  const [schedule, setSchedule] = useState({
    startTime: '',
    endTime: '',
    timeLimit: 30
  });
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setPdfFile(file);
      setSettings(prev => ({
        ...prev,
        title: file.name.replace('.pdf', '') || 'PDF Quiz',
        description: `Quiz generated from ${file.name}`
      }));
      setCurrentStep(2);
    }
  };

  const handleExtractQuestions = async () => {
    if (!pdfFile) {
      alert('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      
      formData.append('settings', JSON.stringify({
        numQuestions: settings.numQuestions,
        difficulty: settings.difficulty,
        examTime: settings.examTime,
        focusTopics: settings.focusTopics,
        allowRetakes: settings.allowRetakes,
        shuffleQuestions: settings.shuffleQuestions,
        showResults: settings.showResults,
        showAnswers: settings.showAnswers,
        passingMarks: settings.passingMarks,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        timeLimit: schedule.timeLimit,
        exactQuestionCount: true
      }));

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 80) {
            clearInterval(progressInterval);
            return 80;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/classroom/${classroomId}/quizzes/pdf`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formData
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process PDF');
      }

      const data = await response.json();
      setUploadProgress(100);
      
      console.log('📊 Backend Response:', data);
      
      if (data.quiz && data.quiz.questions) {
        const questions = data.quiz.questions;
        
        const transformedQuestions = questions.map((q, index) => ({
          ...q,
          id: `q-${Date.now()}-${index}`,
          options: Array.isArray(q.options) 
            ? q.options.map(opt => 
                typeof opt === 'string' ? opt : 
                opt.text || opt.toString()
              )
            : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: q.correctAnswer || 0
        }));
        
        setExtractedQuestions(transformedQuestions);
        setQuestionsGenerated(true);
        setCurrentStep(3);
        
        console.log(`✅ Generated ${transformedQuestions.length} questions as requested`);
      } else {
        throw new Error('No questions generated from PDF');
      }

    } catch (error) {
      console.error('❌ Error extracting questions:', error);
      alert(`Failed to extract questions: ${error.message}`);
      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!extractedQuestions || extractedQuestions.length === 0) {
      alert('No questions to save');
      return;
    }

    try {
      const quizData = {
        title: settings.title,
        description: settings.description,
        questions: extractedQuestions.map((q, index) => ({
          question: q.question,
          type: "multiple_choice",
          options: q.options.map((opt, optIndex) => ({
            text: opt,
            isCorrect: optIndex === q.correctAnswer
          })),
          correctAnswer: q.options[q.correctAnswer],
          explanation: q.explanation || `Explanation for question ${index + 1}`,
          topic: q.topic || 'General',
          difficulty: q.difficulty || settings.difficulty,
          marks: 1
        })),
        settings: {
          allowRetakes: settings.allowRetakes,
          showResults: settings.showResults,
          shuffleQuestions: settings.shuffleQuestions,
          showAnswers: settings.showAnswers,
          passingMarks: settings.passingMarks,
          totalMarks: extractedQuestions.length,
          duration: settings.examTime
        },
        schedule: schedule.startTime ? {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timeLimit: schedule.timeLimit
        } : undefined,
        status: 'draft',
        topics: [...new Set(extractedQuestions.map(q => q.topic || 'General'))]
      };

      console.log('💾 Saving Quiz Data:', quizData);
      
      const result = await createPDFQuiz(classroomId, pdfFile, quizData);
      
      if (result && result.quiz) {
        alert('Quiz created successfully!');
        navigate(`/classroom/${classroomId}/quizzes`);
      } else {
        throw new Error(result?.message || 'Failed to create quiz');
      }
    } catch (error) {
      console.error('Error creating PDF quiz:', error);
      alert(`Failed to create quiz: ${error.message}`);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDone = () => {
    navigate(`/classroom/${classroomId}/quizzes`);
  };

  const renderFileUpload = () => (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-[#2A2A3D] rounded-lg p-8 text-center hover:border-[#0082FB] transition-colors">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload" className="cursor-pointer block">
          <div className="w-20 h-20 mx-auto mb-4 bg-[#2A2A3D] rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-[#A0A0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-white font-medium mb-2">
            {pdfFile ? pdfFile.name : 'Upload PDF File'}
          </p>
          <p className="text-[#A0A0B8] text-sm">
            Click to upload or drag and drop
          </p>
          <p className="text-[#A0A0B8] text-xs mt-1">PDF files only (max 10MB)</p>
        </label>
      </div>

      {pdfFile && (
        <div className="bg-[#00FFA3] bg-opacity-10 border border-[#00FFA3] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-[#00FFA3] font-medium">File selected successfully</p>
              <p className="text-[#00FFA3] text-sm opacity-80">Ready to configure quiz settings</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-white font-medium mb-4">Basic Settings</h3>
        </div>

        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Quiz Title *
          </label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            placeholder="Enter quiz title"
          />
        </div>

        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Duration (minutes) *
          </label>
          <input
            type="number"
            value={settings.examTime}
            onChange={(e) => setSettings(prev => ({ ...prev, examTime: parseInt(e.target.value) || 30 }))}
            min="1"
            max="180"
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
          />
        </div>

        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Number of Questions *
          </label>
          <select
            value={settings.numQuestions}
            onChange={(e) => setSettings(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
          >
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
            <option value={20}>20 Questions</option>
          </select>
        </div>

        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Difficulty Level *
          </label>
          <select
            value={settings.difficulty}
            onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value }))}
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={settings.description}
            onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
            rows="2"
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors resize-none"
            placeholder="Enter quiz description"
          />
        </div>

        <div className="md:col-span-2 mt-6">
          <h3 className="text-white font-medium mb-4">Schedule Settings</h3>
        </div>

        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Start Time
          </label>
          <input
            type="datetime-local"
            value={schedule.startTime}
            onChange={(e) => setSchedule(prev => ({ ...prev, startTime: e.target.value }))}
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
          />
        </div>

        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            End Time
          </label>
          <input
            type="datetime-local"
            value={schedule.endTime}
            onChange={(e) => setSchedule(prev => ({ ...prev, endTime: e.target.value }))}
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
          />
        </div>

        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Time Limit (minutes)
          </label>
          <input
            type="number"
            min="1"
            value={schedule.timeLimit}
            onChange={(e) => setSchedule(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            placeholder="30"
          />
        </div>

        <div className="md:col-span-2 mt-6">
          <h3 className="text-white font-medium mb-4">Quiz Settings</h3>
        </div>

        <div className="md:col-span-2 space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.shuffleQuestions}
              onChange={(e) => setSettings(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
              className="text-[#0082FB] focus:ring-[#0082FB]"
            />
            <span className="ml-2 text-[#A0A0B8] text-sm">Shuffle Questions</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.showResults}
              onChange={(e) => setSettings(prev => ({ ...prev, showResults: e.target.checked }))}
              className="text-[#0082FB] focus:ring-[#0082FB]"
            />
            <span className="ml-2 text-[#A0A0B8] text-sm">Show Results Immediately</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.allowRetakes}
              onChange={(e) => setSettings(prev => ({ ...prev, allowRetakes: e.target.checked }))}
              className="text-[#0082FB] focus:ring-[#0082FB]"
            />
            <span className="ml-2 text-[#A0A0B8] text-sm">Allow Retakes</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.showAnswers}
              onChange={(e) => setSettings(prev => ({ ...prev, showAnswers: e.target.checked }))}
              className="text-[#0082FB] focus:ring-[#0082FB]"
            />
            <span className="ml-2 text-[#A0A0B8] text-sm">Show Answers After Submission</span>
          </label>
        </div>

        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Passing Marks (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.passingMarks}
            onChange={(e) => setSettings(prev => ({ ...prev, passingMarks: parseInt(e.target.value) || 40 }))}
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={goBack}
          className="flex-1 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white py-3 px-4 rounded-md transition-colors duration-200 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleExtractQuestions}
          disabled={!settings.title.trim() || isProcessing}
          className="flex-1 bg-[#0082FB] hover:bg-[#0064E0] disabled:bg-[#2A2A3D] disabled:cursor-not-allowed text-white py-3 px-4 rounded-md transition-colors duration-200 font-medium"
        >
          {isProcessing ? 'Processing PDF...' : 'Generate Questions'}
        </button>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <div className="w-full bg-[#2A2A3D] rounded-full h-2">
            <div
              className="bg-[#0082FB] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-[#A0A0B8] text-sm text-center">
            Processing PDF... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="bg-[#00FFA3] bg-opacity-10 border border-[#00FFA3] rounded-lg p-4">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-[#00FFA3] font-medium">
              Successfully generated {extractedQuestions.length} questions!
            </p>
            <p className="text-[#A0A0B8] text-sm opacity-80">
              Review the generated questions below
            </p>
          </div>
        </div>
      </div>

      {/* Questions Display - Read Only */}
      <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
        {extractedQuestions.map((question, questionIndex) => (
          <div key={questionIndex} className="bg-[#2A2A3D] rounded-lg p-6 border border-[#3A3A4D]">
            {/* Question Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0082FB] rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {questionIndex + 1}
                </div>
                <div>
                  <h4 className="text-white font-medium text-lg">Question {questionIndex + 1}</h4>
                  <div className="flex gap-2 mt-1">
                    {question.topic && (
                      <span className="text-[#0082FB] text-xs bg-[#0082FB] bg-opacity-10 px-2 py-1 rounded-full">
                        {question.topic}
                      </span>
                    )}
                    {question.difficulty && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        question.difficulty === 'easy' ? 'bg-green-500 bg-opacity-10 text-green-400' :
                        question.difficulty === 'medium' ? 'bg-yellow-500 bg-opacity-10 text-yellow-400' :
                        'bg-red-500 bg-opacity-10 text-red-400'
                      }`}>
                        {question.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <h5 className="text-[#A0A0B8] text-sm font-medium mb-3">Question:</h5>
              <p className="text-white text-lg leading-relaxed bg-[#1B1B28] p-4 rounded-lg border border-[#2A2A3D]">
                {question.question}
              </p>
            </div>

            {/* Options */}
            <div className="mb-6">
              <h5 className="text-[#A0A0B8] text-sm font-medium mb-3">Options:</h5>
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                      optionIndex === question.correctAnswer
                        ? 'border-[#00FFA3] bg-[#00FFA3] bg-opacity-5'
                        : 'border-[#2A2A3D] bg-[#1B1B28]'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mt-1 ${
                      optionIndex === question.correctAnswer
                        ? 'bg-[#00FFA3] text-[#0D0D14]'
                        : 'bg-[#2A2A3D] text-[#A0A0B8]'
                    }`}>
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        optionIndex === question.correctAnswer ? 'text-[#00FFA3]' : 'text-white'
                      }`}>
                        {option}
                      </p>
                      {optionIndex === question.correctAnswer && (
                        <div className="flex items-center gap-2 mt-2">
                          <svg className="w-4 h-4 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-[#00FFA3] text-sm font-medium">Correct Answer</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div>
                <h5 className="text-[#A0A0B8] text-sm font-medium mb-3">Explanation:</h5>
                <div className="bg-[#1B1B28] border border-[#2A2A3D] rounded-lg p-4">
                  <p className="text-white leading-relaxed">{question.explanation}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quiz Summary */}
      <div className="bg-[#2A2A3D] rounded-lg p-6 border border-[#3A3A4D]">
        <h4 className="text-white font-medium text-lg mb-4">Quiz Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#0082FB] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-[#0082FB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-[#A0A0B8] text-sm">Total Questions</p>
            <p className="text-white font-bold text-xl">{extractedQuestions.length}</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#00FFA3] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#A0A0B8] text-sm">Duration</p>
            <p className="text-white font-bold text-xl">{settings.examTime} mins</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#FFD700] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-[#A0A0B8] text-sm">Difficulty</p>
            <p className="text-white font-bold text-xl capitalize">{settings.difficulty}</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#FF6B6B] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-[#FF6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#A0A0B8] text-sm">Total Marks</p>
            <p className="text-white font-bold text-xl">{extractedQuestions.length}</p>
          </div>
        </div>
      </div>

      {/* ✅ FIXED: Simple Done Button */}
      <div className="flex gap-3 pt-6">
        <button
          onClick={goBack}
          className="flex-1 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white py-4 px-6 rounded-lg transition-colors duration-200 font-medium text-lg"
        >
          Back to Settings
        </button>
        <button
          onClick={handleSaveQuiz}
          disabled={loading}
          className="flex-1 bg-[#00FFA3] hover:bg-[#00E693] disabled:bg-[#2A2A3D] disabled:cursor-not-allowed text-[#0D0D14] py-4 px-6 rounded-lg transition-colors duration-200 font-medium text-lg flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader size="small" />
              Creating Quiz...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Create Quiz
            </>
          )}
        </button>
      </div>

      {/* ✅ ADDED: Simple Done Button as Alternative */}
      <div className="border-t border-[#2A2A3D] pt-6">
        <button
          onClick={handleDone}
          className="w-full bg-[#0082FB] hover:bg-[#0064E0] text-white py-3 px-6 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Done - Go to Classroom
        </button>
        <p className="text-[#A0A0B8] text-sm text-center mt-2">
          Click "Done" to go back to classroom without creating quiz
        </p>
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: 'Upload PDF', active: currentStep === 1 },
    { number: 2, title: 'Configure', active: currentStep === 2 },
    { number: 3, title: 'Review', active: currentStep === 3 }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-white text-2xl font-bold">Create Quiz from PDF</h2>
            <p className="text-[#A0A0B8] mt-1">Upload a PDF to automatically generate quiz questions</p>
          </div>
          <button
            onClick={() => navigate(`/classroom/${classroomId}/quizzes`)}
            className="text-[#A0A0B8] hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.active ? 'bg-[#0082FB] text-white' : 
                    currentStep > step.number ? 'bg-[#00FFA3] text-[#0D0D14]' : 
                    'bg-[#2A2A3D] text-[#A0A0B8]'
                  }`}>
                    {currentStep > step.number ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    step.active ? 'text-white' : 
                    currentStep > step.number ? 'text-[#00FFA3]' : 
                    'text-[#A0A0B8]'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 ${
                    currentStep > step.number ? 'bg-[#00FFA3]' : 'bg-[#2A2A3D]'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          </div>
        )}

        {currentStep === 1 && renderFileUpload()}
        {currentStep === 2 && renderSettings()}
        {currentStep === 3 && renderReview()}
      </div>
    </div>
  );
};

export default PDFQuizForm;