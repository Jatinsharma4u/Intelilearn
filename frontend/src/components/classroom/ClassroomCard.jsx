import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';

const ClassroomCard = ({ 
  classroomId, 
  name, 
  subject, 
  teacherName,
  totalStudents, 
  totalQuizzes, 
  progress, 
  code,
  onOpen,
  isTeacher = false // Explicit prop pass karo
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();

  // Use explicit prop first, then fallback to user role
  const shouldShowTeacherView = isTeacher || user?.role === 'teacher';

  console.log('🎓 ClassroomCard Debug:', {
    classroomId,
    name,
    subject,
    teacherName,
    totalStudents,
    totalQuizzes,
    progress,
    code,
    isTeacher,
    shouldShowTeacherView,
    userRole: user?.role,
    profile
  });

  return (
    <div className="bg-gradient-to-br from-[#1B1B28] to-[#151521] rounded-xl p-6 border border-[#2A2A3D] hover:border-[#0082FB] hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group relative overflow-hidden">
      {/* ✅ NEW: Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#0082FB] opacity-5 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:opacity-10 transition-opacity"></div>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-white text-lg font-semibold group-hover:text-blue-300 transition-colors">{name}</h3>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#A0A0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-[#A0A0B8] text-sm">{subject}</p>
          </div>
        </div>
        {shouldShowTeacherView && code && (
          <div className="bg-gradient-to-r from-[#2A2A3D] to-[#3A3A4D] px-3 py-1.5 rounded-lg flex-shrink-0 ml-2 border border-[#0082FB] border-opacity-30">
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-[#0082FB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-[#0082FB] text-sm font-mono font-semibold">{code}</span>
            </div>
          </div>
        )}
      </div>

      {/* ✅ IMPROVED: Stats - TEACHER SPECIFIC VIEW */}
      {shouldShowTeacherView ? (
        <div className="mb-4 relative z-10">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-[#2A2A3D] to-[#1B1B28] rounded-lg p-3 border border-[#3A3A4D] hover:border-[#0082FB] transition-colors text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <svg className="w-4 h-4 text-[#0082FB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-white font-bold text-xl">{totalStudents || 0}</p>
              </div>
              <p className="text-[#A0A0B8] text-xs">Students</p>
            </div>
            <div className="bg-gradient-to-br from-[#2A2A3D] to-[#1B1B28] rounded-lg p-3 border border-[#3A3A4D] hover:border-[#0082FB] transition-colors text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <svg className="w-4 h-4 text-[#00FFA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-white font-bold text-xl">{totalQuizzes || 0}</p>
              </div>
              <p className="text-[#A0A0B8] text-xs">Quizzes</p>
            </div>
            <div className="bg-gradient-to-br from-[#2A2A3D] to-[#1B1B28] rounded-lg p-3 border border-[#3A3A4D] hover:border-[#0082FB] transition-colors text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <svg className="w-4 h-4 text-[#FF9F5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-[#00FFA3] font-bold text-xl">
                  {totalStudents > 0 ? Math.round((totalStudents / 30) * 100) : 0}%
                </p>
              </div>
              <p className="text-[#A0A0B8] text-xs">Capacity</p>
            </div>
          </div>
        </div>
      ) : (
        /* ✅ IMPROVED: STUDENT VIEW */
        <div className="mb-4 relative z-10">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 flex-1">
              <svg className="w-4 h-4 text-[#A0A0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <p className="text-white font-semibold text-sm">{teacherName}</p>
                <p className="text-[#A0A0B8] text-xs">Teacher</p>
              </div>
            </div>
            {progress !== undefined && (
              <div className="text-center flex-1">
                <p className="text-[#00FFA3] font-bold text-xl">{progress}%</p>
                <p className="text-[#A0A0B8] text-xs">Progress</p>
              </div>
            )}
          </div>
          
          {/* ✅ IMPROVED: Progress Bar for Students */}
          {progress !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#A0A0B8] text-xs">Your Progress</span>
                <span className="text-[#00FFA3] text-xs font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-[#2A2A3D] rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#0082FB] to-[#00FFA3] h-2.5 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/30"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ IMPROVED: Action Button with better styling */}
      <button
        onClick={() => onOpen(classroomId)}
        className="w-full bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0050C8] text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 relative z-10"
      >
        {shouldShowTeacherView ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Classroom
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Enter Classroom
          </>
        )}
      </button>
    </div>
  );
};

export default ClassroomCard;