import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClassroom } from '../../contexts/ClassroomContext';
import ClassroomCard from '../../components/classroom/ClassroomCard';
import JoinClassroomForm from '../../components/classroom/JoinClassroomForm';
import StudentProgress from '../../components/classroom/StudentProgress';
import Leaderboard from '../../components/classroom/Leaderboard';
import Loader from '../../components/ui/Loader';

const StudentDashboard = () => {
  const { 
    studentClassrooms, 
    fetchStudentClassrooms,
    fetchStudentResults,
    studentResults,
    loading 
  } = useClassroom();
  const navigate = useNavigate();
  
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchStudentClassrooms();
  }, []);

  // Fetch student results for each classroom
  useEffect(() => {
    if (studentClassrooms?.classrooms?.length > 0) {
      studentClassrooms.classrooms.forEach(classroom => {
        fetchStudentResults(classroom._id);
      });
    }
  }, [studentClassrooms]);

  const handleOpenClassroom = (classroomId) => {
    navigate(`/classroom/${classroomId}`);
  };

  const handleClassroomJoined = () => {
    setShowJoinModal(false);
    fetchStudentClassrooms();
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

  if (loading && !studentClassrooms.classrooms.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D0D14] to-[#151521] flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  const classrooms = studentClassrooms.classrooms || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D14] to-[#151521] text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-[#A0A0B8] bg-clip-text text-transparent">
                My Classrooms
              </h1>
              <p className="text-[#A0A0B8] mt-2 text-sm sm:text-base">
                Join classrooms and track your learning journey
              </p>
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0050C8] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 group"
            >
              <span>+ Join Classroom</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Quick Stats */}
          {classrooms.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#1B1B28] rounded-xl p-4 border border-[#2A2A3D]">
                <div className="text-2xl font-bold text-white">{classrooms.length}</div>
                <div className="text-[#A0A0B8] text-sm">Classrooms</div>
              </div>
              <div className="bg-[#1B1B28] rounded-xl p-4 border border-[#2A2A3D]">
                <div className="text-2xl font-bold text-[#00D8A7]">
                  {Math.round(classrooms.reduce((acc, curr) => acc + (curr.progress || 0), 0) / classrooms.length)}%
                </div>
                <div className="text-[#A0A0B8] text-sm">Avg Progress</div>
              </div>
              <div className="bg-[#1B1B28] rounded-xl p-4 border border-[#2A2A3D]">
                <div className="text-2xl font-bold text-[#FF6B6B]">
                  {classrooms.reduce((acc, curr) => acc + (curr.pendingAssignments || 0), 0)}
                </div>
                <div className="text-[#A0A0B8] text-sm">Pending</div>
              </div>
              <div className="bg-[#1B1B28] rounded-xl p-4 border border-[#2A2A3D]">
                <div className="text-2xl font-bold text-[#FFD166]">
                  {classrooms.reduce((acc, curr) => acc + (curr.completedQuizzes || 0), 0)}
                </div>
                <div className="text-[#A0A0B8] text-sm">Completed</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Join Classroom Card */}
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-2xl p-6 border border-[#2A2A3D] shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#0082FB] rounded-full"></span>
                    Join a New Classroom
                  </h2>
                  <p className="text-[#A0A0B8] text-sm">
                    Enter the classroom code provided by your teacher to join and start learning
                  </p>
                </div>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0050C8] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Join Now
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
              </div>

              {classrooms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-[#2A2A3D] rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#A0A0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14v6l9-5m-9 5l-9-5m9 5v-6" />
                    </svg>
                  </div>
                  <h3 className="text-white text-lg font-semibold mb-2">No classrooms yet</h3>
                  <p className="text-[#A0A0B8] mb-6 max-w-md mx-auto">
                    Join your first classroom to start your learning journey and track your progress
                  </p>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0050C8] text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Join Your First Classroom
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classrooms.map((classroom) => (
                    <ClassroomCard
                      key={classroom._id}
                      classroomId={classroom._id}
                      name={classroom.name}
                      subject={classroom.subject}
                      teacherName={classroom.teacher?.fullName || classroom.teacher?.username || 'Teacher'}
                      progress={classroom.progress || 0}
                      onOpen={handleOpenClassroom}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Progress Overview */}
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-2xl p-6 border border-[#2A2A3D] shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FFD166] rounded-full"></span>
                My Progress
              </h3>
              {studentClassrooms?.classrooms?.length > 0 && (
                <StudentProgress 
                  compact 
                  classroomId={studentClassrooms.classrooms[0]._id} 
                />
              )}
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-2xl p-6 border border-[#2A2A3D] shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FF6B6B] rounded-full"></span>
                Leaderboard
              </h3>
              {studentClassrooms?.classrooms?.length > 0 && (
                <Leaderboard 
                  compact 
                  classroomId={studentClassrooms.classrooms[0]._id} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Join Classroom Modal */}
        <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)}>
          <JoinClassroomForm
            onClose={() => setShowJoinModal(false)}
            onSuccess={handleClassroomJoined}
          />
        </Modal>
      </div>
    </div>
  );
};

export default StudentDashboard;