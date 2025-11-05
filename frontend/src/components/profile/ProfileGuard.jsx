// src/components/profile/ProfileGuard.jsx
import React from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import ProfileForm from './ProfileForm';
import Loader from '../ui/Loader';
import { motion } from 'framer-motion';
import { UserPlus, AlertCircle } from 'lucide-react';

const ProfileGuard = ({ children }) => {
  const { profile, loading, error } = useProfile();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0D0D14]">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0D0D14] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="w-16 h-16 bg-[#FF4D6D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-[#FF4D6D]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-[#A0A0B8] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#7C5FFF] text-white rounded-lg hover:bg-[#6A4EE6] transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  // If user exists but no profile, show profile creation form
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D0D14] to-[#1B1B28] py-8 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-[#7C5FFF] to-[#A084FF] rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to IntelliLearn!</h1>
          <p className="text-[#A0A0B8] text-lg">
            Complete your profile to unlock the full experience
          </p>
        </motion.div>
        <ProfileForm 
          isCreating={true} 
          onSuccess={() => window.location.reload()} 
          onCancel={() => {
            if (confirm('You need to create a profile for better experience. Are you sure you want to cancel?')) {
              window.location.href = '/';
            }
          }}
        />
      </div>
    );
  }

  // If user has a profile, show the protected content
  return children;
};

export default ProfileGuard;