import React, { useState } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';

const JoinClassroomForm = ({ onClose, onSuccess }) => {
  const { joinClassroom, loading } = useClassroom();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter a classroom code');
      return;
    }

    if (code.trim().length !== 6) {
      setError('Classroom code must be 6 characters');
      return;
    }

    try {
      await joinClassroom(code.trim().toUpperCase());
      setCode('');
      setError('');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="bg-[#1B1B28] rounded-lg p-6 max-w-md w-full mx-auto">
      <h2 className="text-white text-xl font-bold mb-2">Join Classroom</h2>
      <p className="text-[#A0A0B8] text-sm mb-6">
        Enter the 6-digit code provided by your teacher
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Code Input */}
        <div>
          <label className="block text-[#A0A0B8] text-sm font-medium mb-2">
            Classroom Code *
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            maxLength={6}
            placeholder="ABCDEF"
            className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-md px-3 py-2 text-white placeholder-[#A0A0B8] text-center text-lg font-mono tracking-widest focus:outline-none focus:border-[#0082FB] transition-colors"
          />
          {error && (
            <p className="text-[#FF4D6D] text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white py-2 px-4 rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="flex-1 bg-[#0082FB] hover:bg-[#0064E0] disabled:bg-[#2A2A3D] disabled:cursor-not-allowed text-white py-2 px-4 rounded-md transition-colors duration-200 font-medium"
          >
            {loading ? 'Joining...' : 'Join Classroom'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinClassroomForm;