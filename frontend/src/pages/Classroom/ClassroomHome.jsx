// pages/Classroom/ClassroomHome.jsx - FIXED VERSION
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import Loader from '../../components/ui/Loader';

const ClassroomHome = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [hasCheckedRole, setHasCheckedRole] = useState(false);

  // Debug - check what's in profile
  console.log('🔍 ClassroomHome Debug:', {
    user: user,
    profile: profile,
    profileRole: profile?.role,
    profileLoading: profileLoading,
    hasCheckedRole: hasCheckedRole
  });

  // Profile se role check karo
  const isTeacher = profile?.role === 'teacher';

  console.log('🎯 Rendering:', isTeacher ? 'TEACHER DASHBOARD' : 'STUDENT DASHBOARD');

  useEffect(() => {
    // Agar user nahi hai toh login pe redirect
    if (!user) {
      console.log('🚫 No user, redirecting to login');
      navigate('/login');
      return;
    }

    // Agar profile load ho gaya hai toh role set kar do
    if (profile && !hasCheckedRole) {
      console.log('✅ Role determined:', profile.role);
      setHasCheckedRole(true);
    }

    // Agar profile loading complete ho gayi but profile nahi hai (new user)
    if (!profileLoading && !profile && !hasCheckedRole) {
      console.log('📝 No profile found, redirecting to setup');
      navigate('/profile/setup');
      setHasCheckedRole(true);
    }
  }, [user, profile, profileLoading, hasCheckedRole, navigate]);

  // Agar user nahi hai ya profile setup pending hai
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  // Agar profile loading hai toh loader dikhao
  if (profileLoading || !hasCheckedRole) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex flex-col items-center justify-center text-[#A0A0B8] gap-4">
        <Loader size="xl" />
        <p className="text-lg">Loading your classroom...</p>
        <p className="text-sm text-[#A0A0B8]">Setting up your dashboard</p>
      </div>
    );
  }

  // Agar profile nahi hai (first time user) - should be handled by useEffect redirect
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex flex-col items-center justify-center text-[#A0A0B8] gap-4">
        <Loader size="xl" />
        <p className="text-lg">Redirecting to profile setup...</p>
      </div>
    );
  }

  // Simple return based on role
  return (
    <div className="min-h-screen bg-[#0D0D14]">
      {isTeacher ? <TeacherDashboard /> : <StudentDashboard />}
    </div>
  );
};

export default ClassroomHome;