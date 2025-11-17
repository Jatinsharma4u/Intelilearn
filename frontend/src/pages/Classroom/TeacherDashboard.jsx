import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import ClassroomCard from '../../components/classroom/ClassroomCard';
import CreateClassroomForm from '../../components/classroom/CreateClassroomForm';
import TeacherAnalytics from '../../components/classroom/TeacherAnalytics';
import Loader from '../../components/ui/Loader';

const TeacherDashboard = () => {
  const { 
    teacherClassrooms, 
    fetchTeacherClassrooms,
    fetchClassroomAnalytics,
    loading 
  } = useClassroom();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    console.log('🔄 Fetching teacher classrooms...');
    fetchTeacherClassrooms();
  }, []);

  // Fetch analytics for each classroom
  useEffect(() => {
    if (teacherClassrooms?.classrooms?.length > 0) {
      teacherClassrooms.classrooms.forEach(classroom => {
        fetchClassroomAnalytics(classroom._id);
      });
    }
  }, [teacherClassrooms]);

  const handleOpenClassroom = (classroomId) => {
    navigate(`/classroom/${classroomId}`);
  };

  const handleClassroomCreated = () => {
    setShowCreateModal(false);
    fetchTeacherClassrooms();
  };

  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-2xl max-w-md w-full mx-auto border border-[#2A2A3D] shadow-2xl">
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 bg-[#2A2A3D] hover:bg-[#3A3A4D] w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10"
            >
              <span className="text-white text-lg">×</span>
            </button>
            {children}
          </div>
        </div>
      </div>
    );
  };

  if (loading && teacherClassrooms.classrooms.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D0D14] to-[#151521] flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  const classrooms = teacherClassrooms?.classrooms || [];
  const totalStudents = classrooms.reduce((acc, curr) => acc + (curr.students?.length || 0), 0);
  // ✅ FIXED: Use quiz count from backend (number) or fallback to array length
  const totalQuizzes = classrooms.reduce((acc, curr) => {
    const quizCount = typeof curr.quizzes === 'number' ? curr.quizzes : (curr.quizzes?.length || 0);
    return acc + quizCount;
  }, 0);
  const activeQuizzes = classrooms.reduce((acc, curr) => {
    if (typeof curr.activeQuizzes === 'number') {
      return acc + curr.activeQuizzes;
    }
    return acc + (curr.quizzes?.filter(q => q.status === 'active').length || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D14] to-[#151521] text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Welcome */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-[#A0A0B8] bg-clip-text text-transparent">
                Teacher Dashboard
              </h1>
              <p className="text-[#A0A0B8] mt-2 text-sm sm:text-base">
                Welcome back, {profile?.name || user?.displayName || 'Teacher'}! Manage your classrooms and track student progress.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0050C8] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 group"
            >
              <span>+ Create Classroom</span>
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-xl p-4 border border-[#2A2A3D] shadow-lg">
              <div className="text-2xl font-bold text-white">{classrooms.length}</div>
              <div className="text-[#A0A0B8] text-sm">Classrooms</div>
            </div>
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-xl p-4 border border-[#2A2A3D] shadow-lg">
              <div className="text-2xl font-bold text-[#00D8A7]">{totalStudents}</div>
              <div className="text-[#A0A0B8] text-sm">Total Students</div>
            </div>
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-xl p-4 border border-[#2A2A3D] shadow-lg">
              <div className="text-2xl font-bold text-[#FFD166]">{totalQuizzes}</div>
              <div className="text-[#A0A0B8] text-sm">Total Quizzes</div>
            </div>
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-xl p-4 border border-[#2A2A3D] shadow-lg">
              <div className="text-2xl font-bold text-[#FF6B6B]">{activeQuizzes}</div>
              <div className="text-[#A0A0B8] text-sm">Active Quizzes</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Create Classroom Card */}
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-2xl p-6 border border-[#2A2A3D] shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#0082FB] rounded-full"></span>
                    Create New Classroom
                  </h2>
                  <p className="text-[#A0A0B8] text-sm">
                    Set up a new classroom, invite students, and start creating engaging learning experiences
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0050C8] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Now
                </button>
              </div>
            </div>

            {/* Classrooms Section */}
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-2xl p-6 border border-[#2A2A3D] shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00D8A7] rounded-full"></span>
                  My Classrooms
                  <span className="bg-[#2A2A3D] text-[#A0A0B8] text-sm px-2 py-1 rounded-lg ml-2">
                    {classrooms.length}
                  </span>
                </h2>
                <div className="text-[#A0A0B8] text-sm">
                  {totalStudents} students • {totalQuizzes} quizzes
                </div>
              </div>

              {classrooms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-[#2A2A3D] rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#A0A0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-white text-lg font-semibold mb-2">No classrooms yet</h3>
                  <p className="text-[#A0A0B8] mb-6 max-w-md mx-auto">
                    Create your first classroom to start managing students, creating quizzes, and tracking progress
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0050C8] text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Create Your First Classroom
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classrooms.map((classroom) => {
                    // ✅ FIXED: Get real quiz counts from backend
                    const quizCount = typeof classroom.quizzes === 'number' 
                      ? classroom.quizzes 
                      : (classroom.quizzes?.length || 0);
                    
                    return (
                      <ClassroomCard
                        key={classroom._id}
                        classroomId={classroom._id}
                        name={classroom.name}
                        subject={classroom.subject}
                        teacherName={profile?.name || user?.displayName || 'Teacher'}
                        totalStudents={classroom.students?.length || 0}
                        totalQuizzes={quizCount}
                        code={classroom.code || classroom.joinCode}
                        onOpen={handleOpenClassroom}
                        isTeacher={true}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Analytics Summary */}
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-2xl p-6 border border-[#2A2A3D] shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FFD166] rounded-full"></span>
                Analytics Overview
              </h3>
              {teacherClassrooms?.classrooms?.length > 0 && (
                <TeacherAnalytics 
                  compact 
                  classroomId={teacherClassrooms.classrooms[0]._id} 
                />
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-2xl p-6 border border-[#2A2A3D] shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FF6B6B] rounded-full"></span>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white p-3 rounded-lg text-left transition-colors duration-200 flex items-center gap-3 group">
                  <svg className="w-5 h-5 text-[#0082FB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Create Quiz</span>
                </button>
                <button className="w-full bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white p-3 rounded-lg text-left transition-colors duration-200 flex items-center gap-3 group">
                  <svg className="w-5 h-5 text-[#00D8A7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>View Reports</span>
                </button>
                <button className="w-full bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white p-3 rounded-lg text-left transition-colors duration-200 flex items-center gap-3 group">
                  <svg className="w-5 h-5 text-[#FFD166]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Manage Students</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Create Classroom Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <CreateClassroomForm
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleClassroomCreated}
          />
        </Modal>
      </div>
    </div>
  );
};

export default TeacherDashboard;