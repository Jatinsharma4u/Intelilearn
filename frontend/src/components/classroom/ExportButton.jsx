import React, { useState } from 'react';
import { useClassroom } from '../../contexts/ClassroomContext';

const ExportButton = ({ classroomId, quizId, type = 'classroom' }) => {
  const { exportClassroomResults, downloadExportFile, loading } = useClassroom();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!classroomId) return;

    setIsExporting(true);
    try {
      const response = await exportClassroomResults(classroomId);
      
      if (response.downloadUrl) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = response.filename || `classroom-${classroomId}-results.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Export completed! Check your downloads folder.');
      }
    } catch (error) {
      console.error('Error exporting results:', error);
      alert('Failed to export results. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getButtonText = () => {
    if (isExporting) return 'Exporting...';
    if (loading) return 'Processing...';
    
    switch (type) {
      case 'quiz':
        return 'Export Quiz Results';
      case 'student':
        return 'Export Student Report';
      default:
        return 'Export Classroom Results';
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || loading}
      className="bg-[#00FFA3] hover:bg-[#00E693] disabled:bg-[#2A2A3D] text-[#0D0D14] px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {getButtonText()}
    </button>
  );
};

export default ExportButton;