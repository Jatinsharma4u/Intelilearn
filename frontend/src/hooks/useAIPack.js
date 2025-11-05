import { useState, useEffect } from 'react';
import { api } from '../utils/api';

// Mock useAuth agar original hook nahi hai
const useAuth = () => {
  return {
    user: {
      uid: 'mock-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    }
  };
};

export const useAIPack = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState({
    files: false,
    upload: false,
    summary: false,
    flashcards: false,
    quiz: false
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchUploadedFiles();
  }, [user]);

  useEffect(() => {
    if (currentFile) {
      fetchAIData(currentFile._id);
    }
  }, [currentFile]);

  const fetchUploadedFiles = async () => {
    if (!user) return;

    setLoading(prev => ({ ...prev, files: true }));
    try {
      // COMMENT: Backend ready hone par yeh line uncomment karna
      // const response = await api.get('/ai/uploaded-files');
      // setUploadedFiles(response.data);
      
      // TEMPORARY: Mock data for development
      const mockFiles = [
        {
          _id: '1',
          fileName: 'Networking Basics.pdf',
          fileType: 'pdf',
          uploadDate: new Date().toISOString(),
          status: 'processed',
          subject: 'Computer Networks',
          aiProcessed: true
        },
        {
          _id: '2', 
          fileName: 'Math Formulas.png',
          fileType: 'image/png',
          uploadDate: new Date(Date.now() - 86400000).toISOString(),
          status: 'processing',
          subject: 'Mathematics',
          aiProcessed: false
        },
        {
          _id: '3',
          fileName: 'Physics Concepts.docx',
          fileType: 'document',
          uploadDate: new Date(Date.now() - 172800000).toISOString(),
          status: 'processed',
          subject: 'Physics',
          aiProcessed: true
        }
      ];
      setUploadedFiles(mockFiles);
    } catch (error) {
      console.error('Failed to fetch uploaded files:', error);
    } finally {
      setLoading(prev => ({ ...prev, files: false }));
    }
  };

  const fetchAIData = async (fileId) => {
    setLoading({
      summary: true,
      flashcards: true,
      quiz: true
    });

    try {
      // COMMENT: Backend ready hone par yeh lines uncomment karna
      // const [summaryRes, flashcardsRes, quizRes] = await Promise.all([
      //   api.get(`/ai/summary/${fileId}`),
      //   api.get(`/ai/flashcards/${fileId}`),
      //   api.get(`/ai/quiz/${fileId}`)
      // ]);
      // 
      // setSummary(summaryRes.data.summary);
      // setFlashcards(flashcardsRes.data.flashcards);
      // setQuizQuestions(quizRes.data.questions);

      // TEMPORARY: Mock AI data for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (fileId === '1') {
        setSummary("Networking is the process of connecting devices for communication. LAN (Local Area Network) covers small areas like homes or offices, while WAN (Wide Area Network) spans larger geographical areas. Protocols like TCP/IP ensure reliable data transmission across networks. Network security involves protecting data from unauthorized access through firewalls and encryption.");
        
        setFlashcards([
          { 
            question: "What is networking?", 
            answer: "Connecting devices for communication and resource sharing" 
          },
          { 
            question: "Types of networks?", 
            answer: "LAN, WAN, MAN, PAN - Local, Wide, Metropolitan, Personal Area Networks" 
          },
          { 
            question: "What does LAN stand for?", 
            answer: "Local Area Network" 
          },
          { 
            question: "What does WAN stand for?", 
            answer: "Wide Area Network" 
          },
          { 
            question: "Main protocol used in networking?", 
            answer: "TCP/IP (Transmission Control Protocol/Internet Protocol)" 
          }
        ]);
        
        setQuizQuestions([
          {
            question: "LAN stands for?",
            options: ["Local Area Network", "Long Area Network", "Light Area Network", "Large Area Network"],
            answer: "Local Area Network",
            explanation: "LAN is a network covering a small geographical area like a home, office, or building."
          },
          {
            question: "Which protocol is used for reliable data transmission?",
            options: ["TCP/IP", "HTTP", "FTP", "SMTP"],
            answer: "TCP/IP",
            explanation: "TCP/IP ensures reliable data transmission across networks with error checking and data recovery."
          },
          {
            question: "What is the main purpose of a firewall?",
            options: [
              "To protect against unauthorized access",
              "To increase internet speed", 
              "To store network data",
              "To connect multiple devices"
            ],
            answer: "To protect against unauthorized access",
            explanation: "Firewalls monitor and control incoming and outgoing network traffic based on security rules."
          }
        ]);
      }
      else if (fileId === '3') {
        setSummary("Physics is the natural science that studies matter, energy, and their interactions. Classical mechanics deals with motion and forces, while quantum mechanics describes behavior at atomic scales. Thermodynamics studies heat and temperature relationships. Key concepts include Newton's laws of motion, conservation of energy, and electromagnetic theory.");
        
        setFlashcards([
          { 
            question: "Newton's First Law of Motion", 
            answer: "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force" 
          },
          { 
            question: "Formula for force", 
            answer: "F = m × a (Force = mass × acceleration)" 
          },
          { 
            question: "Law of Conservation of Energy", 
            answer: "Energy cannot be created or destroyed, only transformed from one form to another" 
          }
        ]);
        
        setQuizQuestions([
          {
            question: "What does F = m × a represent?",
            options: ["Newton's Second Law", "Law of Conservation", "Quantum Theory", "Thermodynamics"],
            answer: "Newton's Second Law",
            explanation: "F = m × a is Newton's Second Law of Motion, stating that force equals mass times acceleration."
          }
        ]);
      }
      else {
        setSummary(null);
        setFlashcards([]);
        setQuizQuestions([]);
      }
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
    } finally {
      setLoading({
        summary: false,
        flashcards: false,
        quiz: false
      });
    }
  };

  const uploadFile = async (file) => {
    setLoading(prev => ({ ...prev, upload: true }));
    
    try {
      // COMMENT: Backend ready hone par yeh lines uncomment karna
      // const formData = new FormData();
      // formData.append('file', file);
      // 
      // const response = await api.post('/ai/upload', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
      // 
      // setUploadedFiles(prev => [response.data, ...prev]);
      // setCurrentFile(response.data);
      // return response.data;

      // TEMPORARY: Mock upload for development
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newFile = {
        _id: Date.now().toString(),
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        status: 'processing',
        subject: this.getSubjectFromFilename(file.name),
        aiProcessed: false
      };
      
      setUploadedFiles(prev => [newFile, ...prev]);
      setCurrentFile(newFile);
      
      // Simulate AI processing completion after 5 seconds
      setTimeout(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f._id === newFile._id 
              ? { ...f, status: 'processed', aiProcessed: true }
              : f
          )
        );
        
        if (currentFile?._id === newFile._id) {
          setCurrentFile(prev => ({ ...prev, status: 'processed', aiProcessed: true }));
        }
      }, 5000);
      
      return newFile;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
    }
  };

  // Helper function to extract subject from filename
  const getSubjectFromFilename = (filename) => {
    const lowerName = filename.toLowerCase();
    
    if (lowerName.includes('math') || lowerName.includes('calculus') || lowerName.includes('algebra')) {
      return 'Mathematics';
    }
    if (lowerName.includes('physics') || lowerName.includes('mechanics')) {
      return 'Physics';
    }
    if (lowerName.includes('chem') || lowerName.includes('organic')) {
      return 'Chemistry';
    }
    if (lowerName.includes('bio') || lowerName.includes('biology')) {
      return 'Biology';
    }
    if (lowerName.includes('network') || lowerName.includes('computer') || lowerName.includes('programming')) {
      return 'Computer Science';
    }
    if (lowerName.includes('history') || lowerName.includes('historical')) {
      return 'History';
    }
    if (lowerName.includes('english') || lowerName.includes('literature')) {
      return 'English';
    }
    
    return 'General';
  };

  const deleteFile = async (fileId) => {
    try {
      // COMMENT: Backend ready hone par yeh line uncomment karna
      // await api.delete(`/ai/files/${fileId}`);
      
      // TEMPORARY: Mock delete for development
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadedFiles(prev => prev.filter(file => file._id !== fileId));
      
      if (currentFile?._id === fileId) {
        setCurrentFile(null);
        setSummary(null);
        setFlashcards([]);
        setQuizQuestions([]);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const selectFile = (fileId) => {
    const file = uploadedFiles.find(f => f._id === fileId);
    if (file) {
      setCurrentFile(file);
    }
  };

  // Function to retry AI processing for a file
  const retryAIProcessing = async (fileId) => {
    try {
      // COMMENT: Backend ready hone par yeh line uncomment karna
      // await api.post(`/ai/retry/${fileId}`);
      
      // TEMPORARY: Mock retry for development
      setUploadedFiles(prev => 
        prev.map(file => 
          file._id === fileId 
            ? { ...file, status: 'processing', aiProcessed: false }
            : file
        )
      );
      
      if (currentFile?._id === fileId) {
        setCurrentFile(prev => ({ ...prev, status: 'processing', aiProcessed: false }));
        setSummary(null);
        setFlashcards([]);
        setQuizQuestions([]);
        
        // Simulate processing completion
        setTimeout(() => {
          setUploadedFiles(prev => 
            prev.map(file => 
              file._id === fileId 
                ? { ...file, status: 'processed', aiProcessed: true }
                : file
            )
          );
          
          if (currentFile?._id === fileId) {
            fetchAIData(fileId);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  return {
    uploadedFiles,
    currentFile,
    summary,
    flashcards,
    quizQuestions,
    loading,
    uploadFile,
    deleteFile,
    selectFile,
    retryAIProcessing
  };
};