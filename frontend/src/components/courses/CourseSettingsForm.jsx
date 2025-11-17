import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const CourseSettingsForm = ({ courseData, onSubmit, onBack }) => {
  const [settings, setSettings] = useState({
    contentType: 'comprehensive',
    difficulty: 'beginner',
    learningPace: 'moderate',
    contentStyle: 'interactive',
    questionsPerTopic: 5,
    flashcardsPerModule: 3,
    quizDifficulty: 'medium',
    includeExercises: true,
    totalModules: 5,
    lessonsPerModule: 4,
    ...courseData.settings
  });
  
  const [expandedSection, setExpandedSection] = useState('basic');

  const contentTypes = [
    { value: 'conceptual', label: 'Conceptual (Theory-heavy)', description: 'Focus on concepts and theories' },
    { value: 'practical', label: 'Practical (Examples-focused)', description: 'Emphasis on real-world applications' },
    { value: 'exam-oriented', label: 'Exam-oriented (Quick revisions)', description: 'Concise content for quick review' },
    { value: 'comprehensive', label: 'Comprehensive (Complete coverage)', description: 'Detailed coverage of all topics' }
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner', description: 'Basic concepts, step-by-step explanations' },
    { value: 'intermediate', label: 'Intermediate', description: 'Builds on fundamentals, some prior knowledge' },
    { value: 'advanced', label: 'Advanced', description: 'Complex topics, assumes solid foundation' },
    { value: 'mixed', label: 'Mixed (Auto-adjust)', description: 'Adapts difficulty based on content' }
  ];

  const learningPaces = [
    { value: 'slow', label: 'Slow & Detailed', description: 'Thorough explanations, more examples' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced pace for most learners' },
    { value: 'fast', label: 'Fast-paced', description: 'Concise content, quicker progression' },
    { value: 'crash', label: 'Crash Course', description: 'Rapid overview of key concepts' }
  ];

  const contentStyles = [
    { value: 'visual', label: 'Visual (Diagrams, charts)', description: 'Heavy on visuals and diagrams' },
    { value: 'textual', label: 'Textual (Detailed explanations)', description: 'Detailed written explanations' },
    { value: 'interactive', label: 'Interactive (Q&A format)', description: 'Engaging, question-based learning' },
    { value: 'story-based', label: 'Story-based (Real examples)', description: 'Learning through stories and cases' }
  ];

  const quizDifficulties = [
    { value: 'easy', label: 'Easy', description: 'Basic comprehension questions' },
    { value: 'medium', label: 'Medium', description: 'Application and analysis questions' },
    { value: 'hard', label: 'Hard', description: 'Complex problem-solving questions' },
    { value: 'adaptive', label: 'Adaptive', description: 'Adjusts based on performance' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(settings);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SettingSection = ({ title, section, children, description }) => (
    <div className="border border-[#2A2A3D] rounded-xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#0D0D14] transition-colors"
      >
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-sm text-[#A0A0B8] mt-1">{description}</p>
          )}
        </div>
        {expandedSection === section ? (
          <ChevronUp className="h-5 w-5 text-[#A0A0B8]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#A0A0B8]" />
        )}
      </button>
      
      {expandedSection === section && (
        <div className="p-4 border-t border-[#2A2A3D] bg-[#0D0D14]">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Settings */}
      <SettingSection
        title="Basic Settings"
        section="basic"
        description="Core course structure and learning approach"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Content Type
            </label>
            <select
              value={settings.contentType}
              onChange={(e) => setSettings(prev => ({ ...prev, contentType: e.target.value }))}
              className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            >
              {contentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#A0A0B8] mt-1">
              {contentTypes.find(t => t.value === settings.contentType)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Difficulty Level
            </label>
            <select
              value={settings.difficulty}
              onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            >
              {difficultyLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#A0A0B8] mt-1">
              {difficultyLevels.find(l => l.value === settings.difficulty)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Learning Pace
            </label>
            <select
              value={settings.learningPace}
              onChange={(e) => setSettings(prev => ({ ...prev, learningPace: e.target.value }))}
              className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            >
              {learningPaces.map(pace => (
                <option key={pace.value} value={pace.value}>
                  {pace.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#A0A0B8] mt-1">
              {learningPaces.find(p => p.value === settings.learningPace)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Content Style
            </label>
            <select
              value={settings.contentStyle}
              onChange={(e) => setSettings(prev => ({ ...prev, contentStyle: e.target.value }))}
              className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            >
              {contentStyles.map(style => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#A0A0B8] mt-1">
              {contentStyles.find(s => s.value === settings.contentStyle)?.description}
            </p>
          </div>
        </div>
      </SettingSection>

      {/* Course Structure */}
      <SettingSection
        title="Course Structure"
        section="structure"
        description="Define the organization of your course content"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Total Modules
            </label>
            <input
              type="number"
              min="2"
              max="20"
              value={settings.totalModules}
              onChange={(e) => setSettings(prev => ({ ...prev, totalModules: parseInt(e.target.value) || 5 }))}
              className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            />
            <p className="text-xs text-[#A0A0B8] mt-1">
              Number of main modules in the course (2-20)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Lessons per Module
            </label>
            <input
              type="number"
              min="2"
              max="8"
              value={settings.lessonsPerModule}
              onChange={(e) => setSettings(prev => ({ ...prev, lessonsPerModule: parseInt(e.target.value) || 4 }))}
              className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            />
            <p className="text-xs text-[#A0A0B8] mt-1">
              Average number of lessons in each module (2-8)
            </p>
          </div>
        </div>
      </SettingSection>

      {/* Assessment Settings */}
      <SettingSection
        title="Assessment & Practice"
        section="assessment"
        description="Configure quizzes, exercises, and practice materials"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Questions per Topic
            </label>
            <input
              type="number"
              min="2"
              max="15"
              value={settings.questionsPerTopic}
              onChange={(e) => setSettings(prev => ({ ...prev, questionsPerTopic: parseInt(e.target.value) || 5 }))}
              className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            />
            <p className="text-xs text-[#A0A0B8] mt-1">
              Number of quiz questions for each topic (2-15)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Flashcards per Module
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={settings.flashcardsPerModule}
              onChange={(e) => setSettings(prev => ({ ...prev, flashcardsPerModule: parseInt(e.target.value) || 3 }))}
              className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            />
            <p className="text-xs text-[#A0A0B8] mt-1">
              Key concept flashcards for each module (2-10)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Quiz Difficulty
            </label>
            <select
              value={settings.quizDifficulty}
              onChange={(e) => setSettings(prev => ({ ...prev, quizDifficulty: e.target.value }))}
              className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
            >
              {quizDifficulties.map(diff => (
                <option key={diff.value} value={diff.value}>
                  {diff.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#A0A0B8] mt-1">
              {quizDifficulties.find(d => d.value === settings.quizDifficulty)?.description}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="includeExercises"
              checked={settings.includeExercises}
              onChange={(e) => setSettings(prev => ({ ...prev, includeExercises: e.target.checked }))}
              className="w-4 h-4 text-[#0082FB] bg-[#1B1B28] border-[#2A2A3D] rounded focus:ring-[#0082FB] focus:ring-2"
            />
            <label htmlFor="includeExercises" className="text-sm font-medium text-white">
              Include Practical Exercises
            </label>
            <HelpCircle className="h-4 w-4 text-[#A0A0B8]" />
          </div>
        </div>
      </SettingSection>

      {/* Summary */}
      <div className="bg-[#0D0D14] border border-[#2A2A3D] rounded-xl p-4">
        <h3 className="font-semibold text-white mb-2">Course Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[#A0A0B8]">Total Modules</p>
            <p className="text-white font-medium">{settings.totalModules}</p>
          </div>
          <div>
            <p className="text-[#A0A0B8]">Total Lessons</p>
            <p className="text-white font-medium">{settings.totalModules * settings.lessonsPerModule}</p>
          </div>
          <div>
            <p className="text-[#A0A0B8]">Quiz Questions</p>
            <p className="text-white font-medium">{settings.totalModules * settings.lessonsPerModule * settings.questionsPerTopic}</p>
          </div>
          <div>
            <p className="text-[#A0A0B8]">Flashcards</p>
            <p className="text-white font-medium">{settings.totalModules * settings.flashcardsPerModule}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-6 border-t border-[#2A2A3D]">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-[#2A2A3D] text-white rounded-xl hover:border-[#0082FB] transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-[#0082FB] to-[#0064EO] hover:from-[#0064EO] hover:to-[#0082FB] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
        >
          Generate Course
        </button>
      </div>
    </form>
  );
};

export default CourseSettingsForm;