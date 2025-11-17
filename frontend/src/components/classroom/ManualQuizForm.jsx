import React, { useState } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useParams, useNavigate } from 'react-router-dom';

const ManualQuizForm = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { createManualQuiz, loading } = useClassroom();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    difficulty: 'medium',
    settings: {
      showResults: true,
      shuffleQuestions: false,
      allowRetakes: false,
      showAnswers: false,
      passingMarks: 40
    },
    schedule: {
      startTime: '',
      endTime: '',
      timeLimit: ''
    },
    questions: [
      {
        question: '',
        type: 'multiple_choice',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        correctAnswer: '',
        explanation: '',
        topic: '',
        difficulty: 'medium',
        marks: 1,
        timeLimit: 30
      }
    ],
    topics: []
  });

  const [currentTopic, setCurrentTopic] = useState('');

  // Add new question
  const addQuestion = (type = 'multiple_choice') => {
    let newQuestion = {
      question: '',
      type: type,
      difficulty: 'medium',
      marks: 1,
      timeLimit: 30,
      topic: currentTopic || '',
      explanation: ''
    };

    // Type-specific fields
    if (type === 'multiple_choice') {
      newQuestion.options = [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ];
    } else if (type === 'true_false') {
      newQuestion.correctAnswer = 'true';
    } else if (type === 'short_answer') {
      newQuestion.correctAnswer = '';
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      setFormData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  const updateQuestion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options.map((opt, j) => 
                j === optionIndex ? { ...opt, [field]: value } : opt
              )
            } 
          : q
      )
    }));
  };

  const setCorrectAnswer = (questionIndex, correctIndex) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options.map((opt, j) => ({
                ...opt,
                isCorrect: j === correctIndex
              }))
            } 
          : q
      )
    }));
  };

  const addTopic = () => {
    if (currentTopic.trim() && !formData.topics.includes(currentTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, currentTopic.trim()]
      }));
      setCurrentTopic('');
    }
  };

  const removeTopic = (topicToRemove) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const updateSettings = (field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value }
    }));
  };

  const updateSchedule = (field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    // Validate questions
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      
      if (!question.question.trim()) {
        alert(`Please enter question ${i + 1}`);
        return;
      }

      if (question.type === 'multiple_choice') {
        if (question.options.some(opt => !opt.text.trim())) {
          alert(`Please fill all options for question ${i + 1}`);
          return;
        }
        if (!question.options.some(opt => opt.isCorrect)) {
          alert(`Please select correct answer for question ${i + 1}`);
          return;
        }
      } else if (question.type === 'true_false' || question.type === 'short_answer') {
        if (!question.correctAnswer.trim()) {
          alert(`Please provide correct answer for question ${i + 1}`);
          return;
        }
      }
    }

    try {
      // Prepare final data
      const quizData = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        difficulty: formData.difficulty,
        questions: formData.questions,
        settings: formData.settings,
        schedule: formData.schedule.startTime ? formData.schedule : undefined,
        topics: formData.topics,
        createdBy: 'manual'
      };

      console.log('Sending quiz data:', quizData);
      await createManualQuiz(classroomId, quizData);
      navigate(`/classroom/${classroomId}`);
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const renderQuestionFields = (question, questionIndex) => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3 mb-4">
            <label className="block text-[#A0A0B8] text-sm font-medium">
              Options *
            </label>
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`correct-${questionIndex}`}
                  checked={option.isCorrect}
                  onChange={() => setCorrectAnswer(questionIndex, optionIndex)}
                  className="text-[#0082FB] focus:ring-[#0082FB]"
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(questionIndex, optionIndex, 'text', e.target.value)}
                  required
                  placeholder={`Option ${optionIndex + 1}`}
                  className="flex-1 bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors"
                />
              </div>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3 mb-4">
            <label className="block text-[#A0A0B8] text-sm font-medium">
              Correct Answer *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`tf-${questionIndex}`}
                  value="true"
                  checked={question.correctAnswer === 'true'}
                  onChange={(e) => updateQuestion(questionIndex, 'correctAnswer', e.target.value)}
                  className="text-[#0082FB] focus:ring-[#0082FB]"
                />
                <span className="text-white">True</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`tf-${questionIndex}`}
                  value="false"
                  checked={question.correctAnswer === 'false'}
                  onChange={(e) => updateQuestion(questionIndex, 'correctAnswer', e.target.value)}
                  className="text-[#0082FB] focus:ring-[#0082FB]"
                />
                <span className="text-white">False</span>
              </label>
            </div>
          </div>
        );

      case 'short_answer':
        return (
          <div className="space-y-3 mb-4">
            <label className="block text-[#A0A0B8] text-sm font-medium">
              Correct Answer *
            </label>
            <input
              type="text"
              value={question.correctAnswer}
              onChange={(e) => updateQuestion(questionIndex, 'correctAnswer', e.target.value)}
              required
              placeholder="Enter the correct answer"
              className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-[#1B1B28] rounded-lg p-6 border border-[#2A2A3D]">
        <h2 className="text-white text-2xl font-bold mb-6">Create Manual Quiz</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors"
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                required
                className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                Difficulty *
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                required
                className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors"
                placeholder="Quiz description (optional)"
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="bg-[#2A2A3D] rounded-lg p-4">
            <h3 className="text-white text-lg font-semibold mb-4">Schedule (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.schedule.startTime}
                  onChange={(e) => updateSchedule('startTime', e.target.value)}
                  className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.schedule.endTime}
                  onChange={(e) => updateSchedule('endTime', e.target.value)}
                  className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.schedule.timeLimit}
                  onChange={(e) => updateSchedule('timeLimit', parseInt(e.target.value))}
                  className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Topics Section */}
          <div className="bg-[#2A2A3D] rounded-lg p-4">
            <h3 className="text-white text-lg font-semibold mb-4">Topics</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                placeholder="Add a topic"
                className="flex-1 bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors"
              />
              <button
                type="button"
                onClick={addTopic}
                className="bg-[#0082FB] hover:bg-[#0064E0] text-white px-4 py-2 rounded-md transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.topics.map((topic, index) => (
                <div key={index} className="bg-[#0082FB] text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeTopic(topic)}
                    className="hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-[#2A2A3D] rounded-lg p-4">
            <h3 className="text-white text-lg font-semibold mb-4">Quiz Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.settings.showResults}
                  onChange={(e) => updateSettings('showResults', e.target.checked)}
                  className="text-[#0082FB] focus:ring-[#0082FB]"
                />
                <span className="text-white">Show Results to Students</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.settings.shuffleQuestions}
                  onChange={(e) => updateSettings('shuffleQuestions', e.target.checked)}
                  className="text-[#0082FB] focus:ring-[#0082FB]"
                />
                <span className="text-white">Shuffle Questions</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.settings.allowRetakes}
                  onChange={(e) => updateSettings('allowRetakes', e.target.checked)}
                  className="text-[#0082FB] focus:ring-[#0082FB]"
                />
                <span className="text-white">Allow Retakes</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.settings.showAnswers}
                  onChange={(e) => updateSettings('showAnswers', e.target.checked)}
                  className="text-[#0082FB] focus:ring-[#0082FB]"
                />
                <span className="text-white">Show Answers After Submission</span>
              </label>
            </div>
            <div className="mt-4">
              <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                Passing Marks (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.settings.passingMarks}
                onChange={(e) => updateSettings('passingMarks', parseInt(e.target.value))}
                className="w-32 bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">Questions</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion('multiple_choice')}
                  className="bg-[#0082FB] hover:bg-[#0064E0] text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  + MCQ
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('true_false')}
                  className="bg-[#00C851] hover:bg-[#00A843] text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  + True/False
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('short_answer')}
                  className="bg-[#FF8800] hover:bg-[#E67A00] text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  + Short Answer
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {formData.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="bg-[#2A2A3D] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-medium">
                        Question {questionIndex + 1} 
                        <span className="ml-2 text-sm text-[#A0A0B8] capitalize">
                          ({question.type.replace('_', ' ')})
                        </span>
                      </h4>
                    </div>
                    {formData.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-[#FF4D6D] hover:text-[#FF3355] text-sm transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Question Type */}
                  <div className="mb-4">
                    <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                      Question Type
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(questionIndex, 'type', e.target.value)}
                      className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                      <option value="short_answer">Short Answer</option>
                    </select>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                      Question Text *
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                      required
                      rows="3"
                      className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors resize-none"
                      placeholder="Enter your question here..."
                    />
                  </div>

                  {/* Type-specific fields */}
                  {renderQuestionFields(question, questionIndex)}

                  {/* Additional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                        Marks
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={question.marks}
                        onChange={(e) => updateQuestion(questionIndex, 'marks', parseInt(e.target.value))}
                        className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                        Difficulty
                      </label>
                      <select
                        value={question.difficulty}
                        onChange={(e) => updateQuestion(questionIndex, 'difficulty', e.target.value)}
                        className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                        Time Limit (sec)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={question.timeLimit}
                        onChange={(e) => updateQuestion(questionIndex, 'timeLimit', parseInt(e.target.value))}
                        className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="mt-4">
                    <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                      Explanation (Optional)
                    </label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                      rows="2"
                      className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors resize-none"
                      placeholder="Add explanation for the answer..."
                    />
                  </div>

                  {/* Topic */}
                  <div className="mt-4">
                    <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={question.topic}
                      onChange={(e) => updateQuestion(questionIndex, 'topic', e.target.value)}
                      className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors"
                      placeholder="Question topic"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate(`/classroom/${classroomId}`)}
              className="flex-1 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white py-3 px-4 rounded-md transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#0082FB] hover:bg-[#0064E0] disabled:bg-[#2A2A3D] disabled:cursor-not-allowed text-white py-3 px-4 rounded-md transition-colors duration-200 font-medium"
            >
              {loading ? 'Creating Quiz...' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualQuizForm;