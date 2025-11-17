import React, { useState } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';

const CreateClassroomForm = ({ onClose, onSuccess }) => {
  const { createClassroom, loading } = useClassroom();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createClassroom(formData);
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error creating classroom:', error);
    }
  };

  return (
    <div className="bg-[#1B1B28] rounded-lg p-6 max-w-md w-full mx-auto">
      <h2 className="text-white text-xl font-bold mb-6">Create New Classroom</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Classroom Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors"
            placeholder="Enter classroom name"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Subject *
          </label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#0082FB] transition-colors"
          >
            <option value="">Select Subject</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="History">History</option>
            <option value="Geography">Geography</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0082FB] transition-colors resize-none"
            placeholder="Describe your classroom (optional)"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white py-2 px-4 rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#0082FB] hover:bg-[#0064E0] disabled:bg-[#2A2A3D] disabled:cursor-not-allowed text-white py-2 px-4 rounded-md transition-colors duration-200 font-medium"
          >
            {loading ? 'Creating...' : 'Create Classroom'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClassroomForm;