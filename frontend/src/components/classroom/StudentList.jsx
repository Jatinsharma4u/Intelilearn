import React, { useState } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useProfile } from '../../contexts/ProfileContext';
import Loader from '../ui/Loader';

const StudentList = ({ classroomId }) => {
  const { currentClassroom, loading, removeStudent, fetchClassroomDetails } = useClassroom();
  const { profile } = useProfile();
  const [removingStudentId, setRemovingStudentId] = useState(null);

  const isTeacher = profile?.role === 'teacher';

  // ✅ FIXED: Extract students from nested structure
  const students = currentClassroom?.students || [];

  const getPerformanceColor = (performance) => {
    if (performance >= 80) return 'text-[#00FFA3]';
    if (performance >= 60) return 'text-[#FF9F5B]';
    return 'text-[#FF4D6D]';
  };

  const getPerformanceLabel = (performance) => {
    if (performance >= 80) return 'Excellent';
    if (performance >= 60) return 'Good';
    if (performance >= 40) return 'Average';
    return 'Needs Improvement';
  };

  // ✅ ADDED: Handle remove student
  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this classroom? This action cannot be undone.`)) {
      return;
    }

    try {
      setRemovingStudentId(studentId);
      await removeStudent(classroomId, studentId);
      // Refresh classroom details
      await fetchClassroomDetails(classroomId);
      alert('Student removed successfully');
    } catch (error) {
      console.error('Error removing student:', error);
      alert(`Failed to remove student: ${error.message}`);
    } finally {
      setRemovingStudentId(null);
    }
  };

  // ✅ FIXED: Get student data from nested structure with real data
  const getStudentData = (studentEntry) => {
    // Handle both nested structure { student: {...}, joinedAt, ... } and direct structure
    if (studentEntry.student) {
      // ✅ FIXED: Use real data from backend (quizzesTaken and averageScore are calculated in backend)
      const quizzesTaken = studentEntry.quizzesTaken !== undefined ? studentEntry.quizzesTaken : 0;
      const averageScore = studentEntry.averageScore !== undefined ? studentEntry.averageScore : 0;
      
      return {
        _id: studentEntry.student._id || studentEntry.student,
        name: studentEntry.student.fullName || studentEntry.student.username || 'Unknown',
        username: studentEntry.student.username || '',
        email: studentEntry.student.email || '',
        avatar: studentEntry.student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentEntry.student.fullName || studentEntry.student.username || 'Student')}&background=0082FB&color=fff&size=128`,
        joinedAt: studentEntry.joinedAt,
        quizzesTaken: quizzesTaken, // ✅ Real data from backend
        averageScore: averageScore, // ✅ Real data from backend
        performance: studentEntry.performance || 'needs_improvement'
      };
    } else {
      // Direct structure (fallback)
      return {
        _id: studentEntry._id || studentEntry.userId,
        name: studentEntry.fullName || studentEntry.name || studentEntry.username || 'Unknown',
        username: studentEntry.username || '',
        email: studentEntry.email || '',
        avatar: studentEntry.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentEntry.fullName || studentEntry.name || studentEntry.username || 'Student')}&background=0082FB&color=fff&size=128`,
        joinedAt: studentEntry.joinedAt,
        quizzesTaken: studentEntry.quizzesTaken || 0,
        averageScore: studentEntry.averageScore || 0,
        performance: studentEntry.performance || 'needs_improvement'
      };
    }
  };

  if (loading && !currentClassroom) {
    return (
      <div className="bg-[#1B1B28] rounded-lg border border-[#2A2A3D] p-12">
        <div className="flex justify-center">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1B1B28] rounded-lg border border-[#2A2A3D]">
      {/* Header */}
      <div className="p-6 border-b border-[#2A2A3D]">
        <h2 className="text-xl font-semibold text-white">Students</h2>
        <p className="text-[#A0A0B8] text-sm mt-1">
          {students.length} student{students.length !== 1 ? 's' : ''} enrolled
        </p>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2A2A3D]">
              <th className="text-left p-4 text-[#A0A0B8] text-sm font-medium">Student</th>
              <th className="text-left p-4 text-[#A0A0B8] text-sm font-medium">Email</th>
              <th className="text-left p-4 text-[#A0A0B8] text-sm font-medium">Joined</th>
              <th className="text-left p-4 text-[#A0A0B8] text-sm font-medium">Quizzes Taken</th>
              <th className="text-left p-4 text-[#A0A0B8] text-sm font-medium">Avg. Score</th>
              <th className="text-left p-4 text-[#A0A0B8] text-sm font-medium">Performance</th>
              {isTeacher && (
                <th className="text-left p-4 text-[#A0A0B8] text-sm font-medium">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {students.map((studentEntry, index) => {
              const student = getStudentData(studentEntry);
              return (
                <tr 
                  key={student._id} 
                  className={`border-b border-[#2A2A3D] hover:bg-[#2A2A3D] transition-colors ${
                    index === students.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#2A2A3D]"
                          onError={(e) => {
                            // Fallback to ui-avatars if image fails to load
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0082FB&color=fff&size=128`;
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium">{student.name}</p>
                        {student.username && (
                          <p className="text-[#A0A0B8] text-xs">@{student.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#A0A0B8] text-sm">
                    {student.email || 'N/A'}
                  </td>
                  <td className="p-4 text-[#A0A0B8] text-sm">
                    {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </td>
                  <td className="p-4 text-white font-medium">
                    {student.quizzesTaken}
                  </td>
                  <td className="p-4">
                    <span className={`font-semibold ${getPerformanceColor(student.averageScore)}`}>
                      {student.averageScore > 0 ? `${student.averageScore}%` : 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-medium ${getPerformanceColor(student.averageScore)}`}>
                      {getPerformanceLabel(student.averageScore)}
                    </span>
                  </td>
                  {isTeacher && (
                    <td className="p-4">
                      <button
                        onClick={() => handleRemoveStudent(student._id, student.name)}
                        disabled={removingStudentId === student._id}
                        className="px-3 py-1.5 bg-[#FF4D6D] hover:bg-[#FF3355] text-white text-sm rounded-lg transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove student"
                      >
                        {removingStudentId === student._id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Removing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </>
                        )}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {students.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-[#A0A0B8] mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No students enrolled</h3>
            <p className="text-[#A0A0B8]">Students will appear here once they join your classroom</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;