import React, { useState, useEffect } from 'react';
import {
  FileUploadCard,
  UploadedFileItem,
  AISummaryView,
  FlashcardsViewer,
  QuizGenerator
} from '../components/ai-pack';
import { useAIPack } from '../hooks/useAIPack';
import { 
  FiPackage, FiUpload, FiBook, FiLayers, FiHelpCircle, 
  FiSearch, FiFilter, FiX, FiFolder, FiTag 
} from 'react-icons/fi';
import MainLayout from '../components/layout/MainLayout';

const AIPack = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const {
    uploadedFiles,
    currentFile,
    summary,
    flashcards,
    quizQuestions,
    loading,
    uploadFile,
    deleteFile,
    selectFile
  } = useAIPack();

  const tabs = [
    { id: 'upload', label: 'Upload', icon: FiUpload },
    { id: 'summary', label: 'Summary', icon: FiBook },
    { id: 'flashcards', label: 'Flashcards', icon: FiLayers },
    { id: 'quiz', label: 'Quiz', icon: FiHelpCircle }
  ];

  // Get unique subjects for filter
  const subjects = ['all', ...new Set(uploadedFiles.map(file => file.subject).filter(Boolean))];

  // Filter files based on search and subject
  const filteredFiles = uploadedFiles.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || file.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  useEffect(() => {
    if (filteredFiles.length > 0 && !currentFile) {
      selectFile(filteredFiles[0]._id);
    }
  }, [filteredFiles, currentFile, selectFile]);

  const handleFileUpload = async (file) => {
    try {
      await uploadFile(file);
      setActiveTab('summary');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FileUploadCard onFileUpload={handleFileUpload} />
            
            <div className="space-y-4">
              {/* Search and Filter Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">Recent Uploads</h3>
                {uploadedFiles.length > 0 && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center text-[#A0A0B8] hover:text-white transition-colors"
                  >
                    <FiFilter size={18} className="mr-1" />
                    <span className="text-sm">Filter</span>
                  </button>
                )}
              </div>

              {/* Search Bar */}
              {uploadedFiles.length > 0 && (
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A0A0B8]" />
                  <input
                    type="text"
                    placeholder="Search files by name or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-lg pl-10 pr-4 py-2 text-white focus:border-[#7C5FFF] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A0A0B8] hover:text-white"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Filter Options */}
              {showFilters && uploadedFiles.length > 0 && (
                <div className="bg-[#2A2A3D] rounded-lg p-4">
                  <label className="block text-[#A0A0B8] text-sm mb-2">
                    <FiFolder className="inline mr-2" />
                    Filter by Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-lg px-4 py-2 text-white focus:border-[#7C5FFF] focus:outline-none"
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>
                        {subject === 'all' ? 'All Subjects' : subject}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Files List */}
              {filteredFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FiSearch size={48} className="text-[#A0A0B8] mx-auto mb-4" />
                  <p className="text-[#A0A0B8]">No files found</p>
                  {searchQuery || selectedSubject !== 'all' ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSubject('all');
                      }}
                      className="text-[#7C5FFF] hover:text-[#A084FF] mt-2"
                    >
                      Clear filters
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredFiles.map((file) => (
                    <UploadedFileItem
                      key={file._id}
                      file={file}
                      onDelete={deleteFile}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'summary':
        return (
          <AISummaryView
            summary={summary}
            isLoading={loading.summary}
          />
        );

      case 'flashcards':
        return (
          <FlashcardsViewer
            flashcards={flashcards}
            isLoading={loading.flashcards}
          />
        );

      case 'quiz':
        return (
          <QuizGenerator
            quizQuestions={quizQuestions}
            isLoading={loading.quiz}
          />
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0D0D14] text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-[#7C5FFF] rounded-xl">
              <FiPackage className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Learning Pack</h1>
              <p className="text-[#A0A0B8]">
                Upload your notes and get AI-powered study materials
              </p>
            </div>
          </div>

          {/* File Selection */}
          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <label className="block text-[#A0A0B8] text-sm mb-2">
                <FiTag className="inline mr-2" />
                Select File to View
              </label>
              <select
                value={currentFile?._id || ''}
                onChange={(e) => selectFile(e.target.value)}
                className="bg-[#1B1B28] border border-[#2A2A3D] rounded-lg px-4 py-2 text-white focus:border-[#7C5FFF] focus:outline-none w-full md:w-auto"
              >
                {filteredFiles.map((file) => (
                  <option key={file._id} value={file._id}>
                    {file.fileName} {file.subject && `(${file.subject})`}
                  </option>
                ))}
              </select>
              
              {/* Results count */}
              {(searchQuery || selectedSubject !== 'all') && (
                <p className="text-[#A0A0B8] text-sm mt-2">
                  Showing {filteredFiles.length} of {uploadedFiles.length} files
                </p>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-[#1B1B28] rounded-lg p-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-[#7C5FFF] text-white'
                        : 'text-[#A0A0B8] hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D]">
            {renderTabContent()}
          </div>

          {/* Stats Footer */}
          {currentFile && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1B1B28] rounded-lg p-4 text-center">
                <div className="text-[#00FFA3] text-2xl font-bold">
                  {flashcards?.length || 0}
                </div>
                <div className="text-[#A0A0B8] text-sm">Flashcards</div>
              </div>
              <div className="bg-[#1B1B28] rounded-lg p-4 text-center">
                <div className="text-[#7C5FFF] text-2xl font-bold">
                  {quizQuestions?.length || 0}
                </div>
                <div className="text-[#A0A0B8] text-sm">Quiz Questions</div>
              </div>
              <div className="bg-[#1B1B28] rounded-lg p-4 text-center">
                <div className="text-[#A084FF] text-2xl font-bold">
                  {summary ? Math.ceil(summary.split(' ').length / 200) : 0}
                </div>
                <div className="text-[#A0A0B8] text-sm">Min Read</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AIPack;