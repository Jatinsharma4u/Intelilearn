import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SettingsConfiguration = ({ settings, onSettingsSubmit, onBack }) => {
  const [formData, setFormData] = useState(settings);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSettingsSubmit(formData);
  };

  const formSections = [
    {
      title: "Course Information",
      icon: "📝",
      fields: [
        {
          label: "Course Name",
          type: "text",
          field: "courseName",
          placeholder: "Enter an engaging course name...",
          required: true
        }
      ]
    },
    {
      title: "Course Structure",
      icon: "🏗️",
      fields: [
        {
          label: "Number of Modules",
          type: "select",
          field: "modulesCount",
          options: [3, 4, 5, 6, 7, 8, 9, 10].map(num => ({
            value: num,
            label: `${num} modules`
          }))
        },
        {
          label: "Questions per Module",
          type: "select",
          field: "questionsPerModule",
          options: [5, 8, 10, 12, 15, 20].map(num => ({
            value: num,
            label: `${num} questions`
          }))
        },
        {
          label: "Flashcards per Module",
          type: "select",
          field: "flashcardsCount",
          options: [10, 15, 20, 25, 30, 40, 50].map(num => ({
            value: num,
            label: `${num} flashcards`
          }))
        }
      ]
    },
    {
      title: "Learning Preferences",
      icon: "🎯",
      fields: [
        {
          label: "Difficulty Level",
          type: "select",
          field: "difficulty",
          options: [
            { value: "beginner", label: "👶 Beginner", description: "Basic concepts, step-by-step learning" },
            { value: "intermediate", label: "🚀 Intermediate", description: "Balanced theory and practice" },
            { value: "advanced", label: "🔥 Advanced", description: "Complex topics, in-depth analysis" }
          ]
        },
        {
          label: "Learning Pace",
          type: "select",
          field: "learningPace",
          options: [
            { value: "slow", label: "🐢 Slow (Detailed)", description: "Comprehensive explanations, more examples" },
            { value: "medium", label: "🚶 Medium (Balanced)", description: "Optimal balance of depth and pace" },
            { value: "fast", label: "⚡ Fast (Concise)", description: "Key concepts, minimal examples" }
          ]
        },
        {
          label: "Exam Type",
          type: "select",
          field: "examType",
          options: [
            { value: "academic", label: "🎓 Academic", description: "Theoretical knowledge, definitions" },
            { value: "practical", label: "🔧 Practical", description: "Real-world applications, case studies" },
            { value: "conceptual", label: "💡 Conceptual", description: "Understanding principles, problem-solving" }
          ]
        },
        {
          label: "Depth Level",
          type: "select",
          field: "depthLevel",
          options: [
            { value: "basic", label: "🌱 Basic Overview", description: "Essential concepts, high-level understanding" },
            { value: "comprehensive", label: "📚 Comprehensive", description: "Detailed coverage with examples" },
            { value: "in-depth", label: "🔬 In-depth Analysis", description: "Advanced topics, expert-level insights" }
          ]
        }
      ]
    }
  ];

  return (
    <motion.div 
      className="settings-configuration"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {formSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            className="bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] p-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-lg flex items-center justify-center">
                <span className="text-lg">{section.icon}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{section.title}</h3>
                <p className="text-[#A0A0B8] text-sm">Configure your learning experience</p>
              </div>
            </div>

            {/* Section Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {section.fields.map((field, fieldIndex) => (
                <motion.div
                  key={field.field}
                  className="form-group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: sectionIndex * 0.1 + fieldIndex * 0.05 }}
                >
                  <label className="block text-white font-medium mb-3 text-lg">
                    {field.label}
                  </label>
                  
                  {field.type === "text" && (
                    <input
                      type="text"
                      value={formData[field.field]}
                      onChange={(e) => handleChange(field.field, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full px-4 py-3 bg-[#0D0D14] border border-[#2A2A3D] rounded-xl text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors"
                    />
                  )}

                  {field.type === "select" && (
                    <div className="relative">
                      <select
                        value={formData[field.field]}
                        onChange={(e) => handleChange(field.field, e.target.value)}
                        className="w-full px-4 py-3 bg-[#0D0D14] border border-[#2A2A3D] rounded-xl text-white focus:outline-none focus:border-[#0082FB] transition-colors appearance-none cursor-pointer"
                      >
                        {field.options.map(option => (
                          <option 
                            key={option.value} 
                            value={option.value}
                            className="bg-[#1B1B28] text-white"
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A0A0B8] pointer-events-none">
                        ▼
                      </div>
                    </div>
                  )}

                  {/* Option Description */}
                  {field.type === "select" && (
                    <motion.p 
                      className="text-[#A0A0B8] text-sm mt-2 leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {field.options.find(opt => opt.value === formData[field.field])?.description}
                    </motion.p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-[#2A2A3D]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-8 py-4 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 order-2 sm:order-1"
          >
            <span>←</span>
            Back to Upload
          </button>
          
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0082FB] text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3 order-1 sm:order-2 shadow-lg shadow-[#0082FB]/25"
          >
            <span>👁️</span>
            Preview Course
            <span>🚀</span>
          </button>
        </motion.div>
      </form>

      {/* Quick Stats Preview */}
      <motion.div 
        className="mt-8 bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] rounded-2xl border border-[#00FFA3]/20 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span>
          Course Preview
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Total Modules', value: formData.modulesCount, icon: '📦' },
            { label: 'Quiz Questions', value: formData.modulesCount * formData.questionsPerModule, icon: '❓' },
            { label: 'Flashcards', value: formData.flashcardsCount, icon: '🎴' },
            { label: 'Est. Duration', value: `${formData.modulesCount * 30}-${formData.modulesCount * 45}m`, icon: '⏱️' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-[#0D0D14] rounded-xl p-3 border border-[#2A2A3D]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-white font-bold text-lg">{stat.value}</div>
              <div className="text-[#A0A0B8] text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsConfiguration;