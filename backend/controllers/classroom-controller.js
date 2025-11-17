const Classroom = require('../models/Classroom');
const Quiz = require('../models/Quiz');
const ExamSession = require('../models/Exam');
const StudentProgress = require('../models/StudentProgress');
const User = require('../models/User');
const pdfExtractionService = require('../services/classroom-services/pdf-extraction');
const quizGenerationService = require('../services/classroom-services/quiz-generation');
const analyticsService = require('../services/classroom-services/analytics-service');
const geminiProcessor = require('../services/classroom-services/gemini-processor');

class ClassroomController {
  
  // ===== CLASSROOM MANAGEMENT =====
  
  async createClassroom(req, res) {
    try {
      const { name, description, subject, gradeLevel, settings } = req.body;
      
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      console.log('🔍 Firebase User ID:', firebaseUserId);
      console.log('🔍 Complete req.user:', req.user);

      if (!firebaseUserId) {
        return res.status(400).json({
          success: false,
          message: 'User ID not found in authentication token'
        });
      }

      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found in database'
        });
      }

      if (user.role !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: 'Only teachers can create classrooms'
        });
      }

      console.log('✅ User found:', {
        id: user._id,
        userId: user.userId,
        role: user.role,
        name: user.fullName
      });

      const generateUniqueCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const classroomData = {
        name,
        description,
        subject,
        gradeLevel,
        teacher: user._id,
        code: generateUniqueCode(),
        settings: settings || {}
      };

      console.log('🎯 Final classroom data:', classroomData);

      const classroom = new Classroom(classroomData);
      await classroom.save();
      
      await classroom.populate('teacher', 'username fullName avatar');

      res.status(201).json({
        success: true,
        message: 'Classroom created successfully',
        classroom
      });
    } catch (error) {
      console.error('❌ Create classroom error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTeacherClassrooms(req, res) {
    try {
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const classrooms = await Classroom.find({ teacher: user._id })
        .populate('students.student', 'username fullName avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      // ✅ Add quiz counts for each classroom
      const classroomsWithQuizzes = await Promise.all(
        classrooms.map(async (classroom) => {
          const quizCount = await Quiz.countDocuments({ classroom: classroom._id });
          const activeQuizCount = await Quiz.countDocuments({ 
            classroom: classroom._id,
            status: 'active'
          });
          
          return {
            ...classroom.toObject(),
            quizzes: quizCount, // Total quizzes count
            activeQuizzes: activeQuizCount // Active quizzes count
          };
        })
      );

      const total = await Classroom.countDocuments({ teacher: user._id });

      res.json({
        success: true,
        classrooms: classroomsWithQuizzes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ Get teacher classrooms error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async joinClassroom(req, res) {
    try {
      const { code } = req.body;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Only students can join classrooms'
        });
      }

      const classroom = await Classroom.findOne({ code });
      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found'
        });
      }

      if (!classroom.settings.allowStudentJoin) {
        return res.status(400).json({
          success: false,
          message: 'Classroom is not accepting new students'
        });
      }

      if (classroom.students.length >= classroom.settings.maxStudents) {
        return res.status(400).json({
          success: false,
          message: 'Classroom is full'
        });
      }

      const alreadyJoined = classroom.students.some(
        s => s.student.toString() === user._id.toString()
      );
      if (alreadyJoined) {
        return res.status(400).json({
          success: false,
          message: 'You have already joined this classroom'
        });
      }

      classroom.addStudent(user._id);
      await classroom.save();

      await classroom.populate('teacher', 'username fullName avatar');

      res.json({
        success: true,
        message: 'Successfully joined classroom',
        classroom
      });
    } catch (error) {
      console.error('❌ Join classroom error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getStudentClassrooms(req, res) {
    try {
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const classrooms = await Classroom.find({
        'students.student': user._id,
        'students.status': 'active'
      })
        .populate('teacher', 'username fullName avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Classroom.countDocuments({
        'students.student': user._id,
        'students.status': 'active'
      });

      res.json({
        success: true,
        classrooms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ Get student classrooms error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getClassroomDetails(req, res) {
    try {
      const { classroomId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const classroom = await Classroom.findById(classroomId)
        .populate('teacher', 'username fullName avatar email')
        .populate('students.student', 'username fullName avatar email');

      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found'
        });
      }

      const isTeacher = classroom.teacher._id.toString() === user._id.toString();
      const isStudent = classroom.students.some(
        s => s.student._id.toString() === user._id.toString() && s.status === 'active'
      );

      if (!isTeacher && !isStudent) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this classroom'
        });
      }

      // ✅ FIXED: Enrich students with performance data for teachers
      if (isTeacher) {
        // ✅ ADDED: Get all exam sessions for this classroom once (more efficient)
        // ✅ FIXED: Include both 'completed' and 'graded' status
        const allClassroomSessions = await ExamSession.find({
          classroom: classroomId,
          status: { $in: ['completed', 'graded'] }
        }).lean();

        const enrichedStudents = await Promise.all(
          classroom.students.map(async (studentEntry) => {
            if (!studentEntry.student || !studentEntry.student._id) {
              return null;
            }

            const studentId = studentEntry.student._id.toString();
            
            // ✅ FIXED: Filter exam sessions for this student from pre-fetched data
            const examSessions = allClassroomSessions.filter(session => {
              const sessionStudentId = session.student?.toString() || session.student;
              return sessionStudentId === studentId;
            });

            const quizzesTaken = examSessions.length;
            let averageScore = 0;
            
            if (quizzesTaken > 0) {
              const totalPercentage = examSessions.reduce((sum, session) => {
                // ✅ FIXED: Handle percentage calculation properly
                let percentage = session.percentage;
                if (!percentage && session.score !== undefined && session.totalMarks) {
                  percentage = (session.score / session.totalMarks) * 100;
                }
                return sum + (percentage || 0);
              }, 0);
              averageScore = Math.round(totalPercentage / quizzesTaken);
            }

            return {
              ...studentEntry.toObject(),
              student: {
                ...studentEntry.student.toObject(),
                // Ensure avatar has fallback
                avatar: studentEntry.student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentEntry.student.fullName || studentEntry.student.username || 'Student')}&background=0082FB&color=fff&size=128`
              },
              quizzesTaken,
              averageScore,
              performance: averageScore >= 80 ? 'excellent' : averageScore >= 60 ? 'good' : averageScore >= 40 ? 'average' : 'needs_improvement'
            };
          })
        );

        // Filter out null entries
        classroom.students = enrichedStudents.filter(s => s !== null);
      }

      res.json({
        success: true,
        classroom,
        userRole: isTeacher ? 'teacher' : 'student'
      });
    } catch (error) {
      console.error('❌ Get classroom details error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ ADDED: Remove student from classroom
  async removeStudent(req, res) {
    try {
      const { classroomId, studentId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const classroom = await Classroom.findById(classroomId);
      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found'
        });
      }

      // Check if user is the teacher
      if (classroom.teacher.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only teachers can remove students'
        });
      }

      // Remove student from classroom
      classroom.students = classroom.students.filter(
        s => s.student.toString() !== studentId
      );

      await classroom.save();

      res.json({
        success: true,
        message: 'Student removed successfully',
        classroom
      });
    } catch (error) {
      console.error('❌ Remove student error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== QUIZ MANAGEMENT =====

  async createManualQuiz(req, res) {
    try {
      const { classroomId } = req.params;
      const quizData = req.body;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: 'Only teachers can create quizzes'
        });
      }

      const classroom = await Classroom.findOne({
        _id: classroomId,
        teacher: user._id
      });
      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found or access denied'
        });
      }

      if (quizData.schedule) {
        quizGenerationService.validateQuizSchedule(
          quizData.schedule.startTime,
          quizData.schedule.endTime,
          quizData.schedule.timeLimit
        );
      }

      const quiz = await quizGenerationService.createManualQuiz(
        { ...quizData, classroom: classroomId },
        user._id
      );

      await quiz.populate('teacher', 'username fullName avatar');
      await quiz.populate('classroom', 'name subject');

      res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        quiz
      });
    } catch (error) {
      console.error('❌ Create manual quiz error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createQuizFromPDF(req, res) {
    try {
      const { classroomId } = req.params;
      // Parse settings from FormData (it comes as JSON string)
      let settings = {};
      if (req.body.settings) {
        try {
          settings = typeof req.body.settings === 'string' 
            ? JSON.parse(req.body.settings) 
            : req.body.settings;
        } catch (e) {
          console.error('Error parsing settings:', e);
          settings = req.body.settings || {};
        }
      }
      const file = req.file;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: 'Only teachers can create quizzes'
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'PDF file is required'
        });
      }

      const classroom = await Classroom.findOne({
        _id: classroomId,
        teacher: user._id
      });
      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found or access denied'
        });
      }

      console.log('📤 Processing PDF for quiz generation...');
      
      const processedData = await pdfExtractionService.processPDFWithAI(
        file.buffer,
        settings
      );

      const quiz = await quizGenerationService.createAIQuiz(
        processedData.quizData,
        classroomId,
        user._id,
        settings
      );

      await quiz.populate('teacher', 'username fullName avatar');
      await quiz.populate('classroom', 'name subject');

      res.status(201).json({
        success: true,
        message: 'Quiz generated successfully from PDF',
        quiz,
        topics: processedData.topics
      });
    } catch (error) {
      console.error('❌ Create PDF quiz error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getClassroomQuizzes(req, res) {
    try {
      const { classroomId } = req.params;
      const { page, limit, status } = req.query;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const classroom = await Classroom.findOne({
        _id: classroomId,
        $or: [
          { teacher: user._id },
          { 'students.student': user._id, 'students.status': 'active' }
        ]
      });

      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found or access denied'
        });
      }

      const quizzes = await quizGenerationService.getQuizzesByClassroom(
        classroomId,
        { page, limit, status }
      );

      // ✅ FIXED: Add student attempt info for students
      if (user.role === 'student') {
        const enrichedQuizzes = await Promise.all(
          quizzes.quizzes.map(async (quiz) => {
            // Check if student has attempted this quiz
            const examSession = await ExamSession.findOne({
              student: user._id,
              quiz: quiz._id,
              status: 'completed'
            }).sort({ endTime: -1 });

            const isAttempted = !!examSession;
            const lastSessionId = examSession?._id;
            const studentScore = examSession?.score || 0;
            const totalScore = examSession?.totalMarks || quiz.settings?.totalMarks || quiz.questions?.length || 0;

            return {
              ...quiz.toObject(),
              isAttempted,
              lastSessionId,
              studentScore,
              totalScore,
              allowRetakes: quiz.settings?.allowRetakes || false
            };
          })
        );

        return res.json({
          success: true,
          quizzes: enrichedQuizzes,
          pagination: quizzes.pagination
        });
      }

      // ✅ FIXED: For teachers, add attempt counts
      const enrichedQuizzes = await Promise.all(
        quizzes.quizzes.map(async (quiz) => {
          const attemptsCount = await ExamSession.countDocuments({
            quiz: quiz._id,
            status: 'completed'
          });

          return {
            ...quiz.toObject(),
            attemptsCount
          };
        })
      );

      res.json({
        success: true,
        quizzes: enrichedQuizzes,
        pagination: quizzes.pagination
      });
    } catch (error) {
      console.error('❌ Get classroom quizzes error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getQuizDetails(req, res) {
    try {
      const { quizId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const quiz = await quizGenerationService.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      const isTeacher = quiz.teacher._id.toString() === user._id.toString();
      const isStudent = await Classroom.exists({
        _id: quiz.classroom._id,
        'students.student': user._id,
        'students.status': 'active'
      });

      if (!isTeacher && !isStudent) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this quiz'
        });
      }

      if (!isTeacher) {
        quiz.questions = quiz.questions.map(q => ({
          ...q.toObject(),
          correctAnswer: undefined,
          options: q.options.map(opt => ({
            text: opt.text,
            isCorrect: undefined
          }))
        }));
      }

      res.json({
        success: true,
        quiz,
        userRole: isTeacher ? 'teacher' : 'student'
      });
    } catch (error) {
      console.error('❌ Get quiz details error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== NEW QUIZ MANAGEMENT FUNCTIONS =====

  async updateQuizStatus(req, res) {
    try {
      const { quizId } = req.params;
      const { status, schedule } = req.body;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: 'Only teachers can update quiz status'
        });
      }

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      if (quiz.teacher.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this quiz'
        });
      }

      const validStatuses = ['draft', 'upcoming', 'active', 'completed', 'ended'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: draft, upcoming, active, completed, ended'
        });
      }

      if (status) {
        quiz.status = status;
      }
      
      if (schedule) {
        quiz.schedule = { ...quiz.schedule, ...schedule };
        
        if (schedule.startTime && new Date(schedule.startTime) > new Date()) {
          quiz.status = 'upcoming';
        }
      }

      quiz.updatedAt = new Date();
      await quiz.save();

      await quiz.populate('teacher', 'username fullName avatar');
      await quiz.populate('classroom', 'name subject');

      res.json({
        success: true,
        message: 'Quiz status updated successfully',
        quiz
      });
    } catch (error) {
      console.error('❌ Update quiz status error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteQuiz(req, res) {
    try {
      const { quizId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: 'Only teachers can delete quizzes'
        });
      }

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      if (quiz.teacher.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this quiz'
        });
      }

      const examSessionsCount = await ExamSession.countDocuments({ quiz: quizId });
      if (examSessionsCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete quiz with existing exam sessions'
        });
      }

      await Quiz.findByIdAndDelete(quizId);

      res.json({
        success: true,
        message: 'Quiz deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete quiz error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async scheduleQuiz(req, res) {
    try {
      const { quizId } = req.params;
      const { startTime, endTime, timeLimit } = req.body;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: 'Only teachers can schedule quizzes'
        });
      }

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      if (quiz.teacher.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to schedule this quiz'
        });
      }

      if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be before end time'
        });
      }

      if (timeLimit && timeLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Time limit must be greater than 0'
        });
      }

      quiz.schedule = {
        startTime: startTime || quiz.schedule.startTime,
        endTime: endTime || quiz.schedule.endTime,
        timeLimit: timeLimit || quiz.schedule.timeLimit
      };

      if (startTime && new Date(startTime) > new Date()) {
        quiz.status = 'upcoming';
      } else if (startTime && new Date(startTime) <= new Date()) {
        quiz.status = 'active';
      }

      quiz.updatedAt = new Date();
      await quiz.save();

      await quiz.populate('teacher', 'username fullName avatar');
      await quiz.populate('classroom', 'name subject');

      res.json({
        success: true,
        message: 'Quiz scheduled successfully',
        quiz
      });
    } catch (error) {
      console.error('❌ Schedule quiz error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== EXAM SESSION MANAGEMENT =====

  async startExam(req, res) {
    try {
      const { quizId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      console.log('🚀 Starting exam for quiz:', quizId);
      console.log('👤 User Firebase ID:', firebaseUserId);

      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Only students can take exams'
        });
      }

      console.log('🎯 Student found:', user._id);

      // ✅ FIXED: Properly populate quiz with questions and classroom
      const quiz = await Quiz.findById(quizId)
        .populate('classroom')
        .populate('teacher', 'username fullName');
      
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      console.log('📝 Quiz found with questions:', quiz.questions?.length);

      // ✅ FIXED: Check if student is in classroom
      const classroom = await Classroom.findById(quiz.classroom._id);
      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found'
        });
      }

      const isStudentInClass = classroom.students.some(
        s => s.student.toString() === user._id.toString() && s.status === 'active'
      );
      
      if (!isStudentInClass) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Not enrolled in this classroom'
        });
      }

      // ✅ FIXED: Check schedule and ended status properly
      const now = new Date();
      
      // Check if quiz is ended (manually ended by teacher)
      if (quiz.status === 'ended') {
        return res.status(400).json({
          success: false,
          message: 'This quiz has been ended by the teacher. No more attempts are allowed.'
        });
      }

      // Check schedule - if schedule exists, enforce it strictly
      if (quiz.schedule) {
        const startTime = quiz.schedule.startTime ? new Date(quiz.schedule.startTime) : null;
        const endTime = quiz.schedule.endTime ? new Date(quiz.schedule.endTime) : null;
        
        if (startTime && now < startTime) {
          return res.status(400).json({
            success: false,
            message: `Quiz has not started yet. It will be available from ${startTime.toLocaleString()}`
          });
        }

        if (endTime && now > endTime) {
          return res.status(400).json({
            success: false,
            message: `Quiz has ended. The deadline was ${endTime.toLocaleString()}`
          });
        }

        // If schedule exists, quiz must be active during the scheduled time
        if (startTime && endTime && (now < startTime || now > endTime)) {
          return res.status(400).json({
            success: false,
            message: 'Quiz is not available at this time. Please check the schedule.'
          });
        }
      }

      // Check if quiz is active (not draft or upcoming)
      if (quiz.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Quiz is not active. Current status: ${quiz.status}`
        });
      }

      // Check for existing active session
      const existingSession = await ExamSession.findOne({
        student: user._id,
        quiz: quizId,
        status: 'in_progress'
      });

      if (existingSession) {
        console.log('🔄 Resuming existing session');
        // ✅ FIXED: Populate quiz data for existing session
        await existingSession.populate({
          path: 'quiz',
          select: 'title questions settings duration'
        });
        
        return res.json({
          success: true,
          session: existingSession,
          resumed: true
        });
      }

      // Check if retakes are allowed
      const completedSessions = await ExamSession.countDocuments({
        student: user._id,
        quiz: quizId,
        status: 'completed'
      });

      if (completedSessions > 0 && !quiz.settings.allowRetakes) {
        return res.status(400).json({
          success: false,
          message: 'Retakes are not allowed for this quiz'
        });
      }

      // Create new exam session
      const examSession = new ExamSession({
        student: user._id,
        quiz: quizId,
        classroom: quiz.classroom._id,
        status: 'in_progress',
        startTime: now
      });

      await examSession.save();
      
      // ✅ FIXED: Properly populate quiz data for frontend
      await examSession.populate({
        path: 'quiz',
        select: 'title questions settings duration schedule'
      });
      
      // Ensure questions are available (they're embedded, not referenced)
      if (!examSession.quiz.questions || examSession.quiz.questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Quiz has no questions'
        });
      }

      console.log('✅ Exam session created successfully');
      console.log('📊 Session data:', {
        sessionId: examSession._id,
        quizTitle: examSession.quiz.title,
        questionsCount: examSession.quiz.questions?.length,
        duration: examSession.quiz.settings?.duration
      });

      res.json({
        success: true,
        session: examSession,
        resumed: false
      });
    } catch (error) {
      console.error('❌ Start exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async submitAnswer(req, res) {
    try {
      const { sessionId } = req.params;
      const { questionId, selectedAnswer, timeSpent } = req.body;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const examSession = await ExamSession.findOne({
        _id: sessionId,
        student: user._id
      }).populate('quiz');

      if (!examSession) {
        return res.status(404).json({
          success: false,
          message: 'Exam session not found'
        });
      }

      if (examSession.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Exam session is not active'
        });
      }

      // Find the question to check correct answer
      const question = examSession.quiz.questions.id(questionId);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      // Check if correct answer - handle both index and text comparison
      let isCorrect = false;
      if (typeof selectedAnswer === 'number') {
        // selectedAnswer is an index
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption) {
          const correctIndex = question.options.findIndex(opt => opt.isCorrect);
          isCorrect = correctIndex === selectedAnswer;
        }
      } else {
        // selectedAnswer is text - compare with correctAnswer
        isCorrect = question.correctAnswer === selectedAnswer || 
                   question.options.find(opt => opt.isCorrect)?.text === selectedAnswer;
      }

      // Update or add answer
      const existingAnswerIndex = examSession.answers.findIndex(
        a => a.question.toString() === questionId
      );

      if (existingAnswerIndex > -1) {
        examSession.answers[existingAnswerIndex].selectedAnswer = selectedAnswer;
        examSession.answers[existingAnswerIndex].isCorrect = isCorrect;
        examSession.answers[existingAnswerIndex].timeSpent = timeSpent;
        examSession.answers[existingAnswerIndex].questionText = question.question;
        examSession.answers[existingAnswerIndex].correctAnswer = question.correctAnswer;
      } else {
        examSession.answers.push({
          question: questionId,
          selectedAnswer,
          isCorrect,
          timeSpent,
          questionText: question.question,
          correctAnswer: question.correctAnswer
        });
      }

      await examSession.save();

      res.json({
        success: true,
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });
    } catch (error) {
      console.error('❌ Submit answer error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async submitExam(req, res) {
    try {
      const { sessionId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const examSession = await ExamSession.findOne({
        _id: sessionId,
        student: user._id
      }).populate('quiz');

      if (!examSession) {
        return res.status(404).json({
          success: false,
          message: 'Exam session not found'
        });
      }

      if (examSession.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Exam session is already submitted'
        });
      }

      // Calculate final score before saving
      examSession.endTime = new Date();
      examSession.status = 'completed';
      examSession.timeSpent = Math.floor(
        (examSession.endTime - examSession.startTime) / 1000
      );

      // Calculate score from answers
      if (examSession.answers && examSession.answers.length > 0) {
        const correctAnswers = examSession.answers.filter(answer => answer.isCorrect).length;
        examSession.score = correctAnswers;
        examSession.totalMarks = examSession.answers.length;
        examSession.percentage = (correctAnswers / examSession.answers.length) * 100;
        
        // Check if passed - passingMarks is a percentage
        if (examSession.quiz && examSession.quiz.settings && examSession.quiz.settings.passingMarks) {
          examSession.passed = examSession.percentage >= examSession.quiz.settings.passingMarks;
        } else {
          // Default passing marks: 40%
          examSession.passed = examSession.percentage >= 40;
        }
      }

      await examSession.save();

      // ✅ FIXED: Ensure quiz has classroom populated before updating progress
      // The quiz should already have classroom field (it's a reference in Quiz model)
      // But we need to ensure it's an ObjectId, not a populated object
      const classroomId = examSession.classroom?._id || examSession.classroom || examSession.quiz?.classroom?._id || examSession.quiz?.classroom;
      
      if (!examSession.quiz.classroom || typeof examSession.quiz.classroom === 'object') {
        // If quiz.classroom is populated, get the ID
        examSession.quiz.classroom = classroomId;
      }

      // Update student progress and analytics
      await analyticsService.updateStudentProgress(examSession);

      await examSession.populate('student', 'username fullName avatar');
      await examSession.populate('quiz', 'title settings questions');
      await examSession.populate('classroom', 'name subject');

      res.json({
        success: true,
        message: 'Exam submitted successfully',
        result: {
          score: examSession.score,
          totalMarks: examSession.totalMarks,
          percentage: examSession.percentage,
          timeSpent: examSession.timeSpent,
          topicsPerformance: examSession.topicsPerformance,
          passed: examSession.passed
        },
        session: examSession
      });
    } catch (error) {
      console.error('❌ Submit exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== ANALYTICS & RESULTS =====

  async getStudentResults(req, res) {
    try {
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { classroomId } = req.params;

      const examSessions = await ExamSession.find({
        student: user._id,
        classroom: classroomId,
        status: 'completed'
      })
        .populate('quiz', 'title settings schedule')
        .populate('classroom', 'name subject')
        .select('quiz classroom score totalMarks percentage timeSpent endTime topicsPerformance answers') // ✅ NEW: Include topicsPerformance
        .sort({ endTime: -1 });

      const progress = await analyticsService.getStudentProgress(user._id, classroomId);

      res.json({
        success: true,
        examSessions,
        progress
      });
    } catch (error) {
      console.error('❌ Get student results error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getClassroomAnalytics(req, res) {
    try {
      const { classroomId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const classroom = await Classroom.findOne({
        _id: classroomId,
        teacher: user._id
      });
      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found or access denied'
        });
      }

      // ✅ FIXED: Get analytics with additional data
      const analytics = await analyticsService.getClassroomAnalytics(classroomId);
      
      // ✅ ADDED: Get total quizzes count for this classroom
      const totalQuizzes = await Quiz.countDocuments({ 
        classroom: classroomId,
        status: { $in: ['active', 'completed', 'ended'] }
      });

      // ✅ ADDED: Get all exam sessions for better stats
      const allExamSessions = await ExamSession.find({
        classroom: classroomId,
        status: 'completed'
      }).populate('student', 'username fullName avatar');

      // ✅ FIXED: Calculate additional stats - Get actual student count
      const totalAttempts = allExamSessions.length;
      const uniqueStudentsAttempted = new Set(allExamSessions.map(s => s.student._id.toString())).size;
      
      // ✅ FIXED: Get total students from classroom with proper population
      const classroomWithStudents = await Classroom.findById(classroomId)
        .populate('students.student', '_id');
      const totalStudents = classroomWithStudents?.students?.length || classroom.students?.length || 0;
      const participationRate = totalStudents > 0 ? Math.round((uniqueStudentsAttempted / totalStudents) * 100) : 0;

      // ✅ ADDED: Get recent exam sessions for activity
      const recentExamSessions = await ExamSession.find({
        classroom: classroomId,
        status: 'completed'
      })
        .populate('student', 'username fullName avatar')
        .populate('quiz', 'title')
        .sort({ endTime: -1 })
        .limit(10);

      // ✅ ADDED: Enhanced analytics response
      res.json({
        success: true,
        analytics: {
          ...analytics,
          totalQuizzes, // ✅ Real quiz count
          totalStudents, // ✅ FIXED: Real student count
          totalAttempts,
          uniqueStudentsAttempted,
          participationRate,
          recentExamSessions: recentExamSessions.map(session => ({
            student: session.student,
            quiz: session.quiz,
            score: session.score,
            totalMarks: session.totalMarks,
            percentage: session.percentage,
            completedAt: session.endTime,
            timeSpent: session.timeSpent
          })),
          // ✅ ADDED: Student performance summary
          studentPerformance: analytics.studentProgress.map(progress => ({
            student: progress.student,
            quizzesCompleted: progress.overallStats.completedQuizzes,
            averageScore: Math.round(progress.overallStats.averageScore),
            totalTimeSpent: progress.overallStats.totalTimeSpent,
            weakTopics: progress.weakTopics,
            strongTopics: progress.strongTopics
          })),
          // ✅ ADDED: Topics with most wrong answers
          topicsWithWrongAnswers: analytics.topicsWithWrongAnswers || []
        }
      });
    } catch (error) {
      console.error('❌ Get classroom analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async exportResults(req, res) {
    try {
      const { classroomId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const classroom = await Classroom.findOne({
        _id: classroomId,
        teacher: user._id
      });
      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found or access denied'
        });
      }

      const excelData = await analyticsService.exportResultsToExcel(classroomId);

      res.json({
        success: true,
        data: excelData,
        filename: `classroom-results-${classroom.name}-${new Date().toISOString().split('T')[0]}.json`
      });
    } catch (error) {
      console.error('❌ Export results error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ NEW: Get quiz-specific analytics
  async getQuizAnalytics(req, res) {
    try {
      const { quizId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get quiz details
      const quiz = await Quiz.findById(quizId)
        .populate('classroom', 'name subject')
        .populate('teacher', 'username fullName');
      
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      // ✅ FIXED: Allow students to view quiz analytics if they've attempted it
      if (user.role !== 'teacher') {
        // Check if student has attempted this quiz
        const hasAttempted = await ExamSession.exists({
          quiz: quizId,
          student: user._id,
          status: { $in: ['completed', 'graded'] }
        });

        if (!hasAttempted) {
          return res.status(403).json({
            success: false,
            message: 'You must complete this quiz to view analytics'
          });
        }
      } else {
        // For teachers, verify they own this quiz
        if (quiz.teacher._id.toString() !== user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this quiz analytics'
          });
        }
      }

      // Get all exam sessions for this quiz
      const examSessions = await ExamSession.find({
        quiz: quizId,
        status: { $in: ['completed', 'graded'] }
      })
      .populate('student', 'username fullName avatar email')
      .sort({ percentage: -1, endTime: -1 });

      // ✅ NEW: Get total students in classroom
      const classroomWithStudents = await Classroom.findById(quiz.classroom._id)
        .populate('students.student', '_id');
      const totalStudentsInClassroom = classroomWithStudents?.students?.length || 0;

      // Calculate statistics
      const totalAttempts = examSessions.length;
      const uniqueStudentsAttempted = new Set(examSessions.map(s => s.student._id.toString())).size;
      const studentsNotAttempted = totalStudentsInClassroom - uniqueStudentsAttempted;
      
      const scores = examSessions.map(s => s.percentage || 0);
      const averageScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
      
      // Calculate passing rate
      const passingMarks = quiz.settings?.passingMarks || 0;
      const passedCount = examSessions.filter(s => (s.percentage || 0) >= passingMarks).length;
      const passingRate = totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0;

      // Topic-wise performance
      const topicStats = {};
      examSessions.forEach(session => {
        if (!session.answers || !quiz.questions) return;
        
        const questionMap = {};
        quiz.questions.forEach(q => {
          questionMap[q._id.toString()] = q;
        });

        session.answers.forEach(answer => {
          let topic = 'Unknown';
          if (answer.question && questionMap[answer.question.toString()]) {
            topic = questionMap[answer.question.toString()].topic || 'Unknown';
          }

          if (!topicStats[topic]) {
            topicStats[topic] = {
              topic,
              totalQuestions: 0,
              correctAnswers: 0,
              wrongAnswers: 0,
              studentsWhoGotWrong: new Set()
            };
          }

          topicStats[topic].totalQuestions++;
          if (answer.isCorrect) {
            topicStats[topic].correctAnswers++;
          } else {
            topicStats[topic].wrongAnswers++;
            topicStats[topic].studentsWhoGotWrong.add(session.student._id.toString());
          }
        });
      });

      // Format topic stats
      const topicPerformance = Object.values(topicStats).map(topic => ({
        topic: topic.topic,
        totalQuestions: topic.totalQuestions,
        correctAnswers: topic.correctAnswers,
        wrongAnswers: topic.wrongAnswers,
        accuracy: topic.totalQuestions > 0 
          ? (topic.correctAnswers / topic.totalQuestions) * 100 
          : 0,
        studentsWhoGotWrong: topic.studentsWhoGotWrong.size
      })).sort((a, b) => b.wrongAnswers - a.wrongAnswers);

      // Student performance list
      const studentPerformance = examSessions.map(session => ({
        sessionId: session._id.toString(), // ✅ NEW: Include session ID for matching
        student: {
          _id: session.student._id,
          username: session.student.username,
          fullName: session.student.fullName,
          avatar: session.student.avatar,
          email: session.student.email,
          userId: session.student.userId // ✅ NEW: Include userId for matching
        },
        score: session.score || 0,
        totalMarks: session.totalMarks || 0,
        percentage: session.percentage || 0,
        passed: (session.percentage || 0) >= passingMarks,
        timeSpent: session.timeSpent || 0,
        completedAt: session.endTime || session.completedAt,
        rank: 0 // Will be calculated
      }));

      // Calculate ranks
      studentPerformance.sort((a, b) => b.percentage - a.percentage);
      studentPerformance.forEach((student, index) => {
        student.rank = index + 1;
      });

      // Weak topics (top 5 with most wrong answers)
      const weakTopics = topicPerformance
        .filter(t => t.accuracy < 60)
        .sort((a, b) => b.wrongAnswers - a.wrongAnswers)
        .slice(0, 5);

      res.json({
        success: true,
        analytics: {
          quiz: {
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            totalQuestions: quiz.questions?.length || 0,
            totalMarks: quiz.settings?.totalMarks || quiz.questions?.length || 0,
            passingMarks: passingMarks,
            duration: quiz.settings?.duration || 0,
            classroom: quiz.classroom
          },
          statistics: {
            totalAttempts,
            totalStudents: uniqueStudentsAttempted, // Students who attempted
            totalStudentsInClassroom, // ✅ NEW: Total students in classroom
            studentsNotAttempted, // ✅ NEW: Students who haven't attempted
            averageScore: Math.round(averageScore * 100) / 100,
            highestScore: Math.round(highestScore * 100) / 100,
            lowestScore: Math.round(lowestScore * 100) / 100,
            passingRate: Math.round(passingRate * 100) / 100,
            passedCount,
            failedCount: totalAttempts - passedCount,
            attemptRate: totalStudentsInClassroom > 0 
              ? Math.round((uniqueStudentsAttempted / totalStudentsInClassroom) * 100) 
              : 0 // ✅ NEW: Percentage of students who attempted
          },
          studentPerformance,
          topicPerformance,
          weakTopics
        }
      });
    } catch (error) {
      console.error('❌ Get quiz analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ NEW: Export quiz results to Excel
  async exportQuizResults(req, res) {
    try {
      const { quizId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user || user.role !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: 'Only teachers can export quiz results'
        });
      }

      const quiz = await Quiz.findById(quizId).populate('classroom', 'name');
      if (!quiz || quiz.teacher.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Quiz not found or access denied'
        });
      }

      const examSessions = await ExamSession.find({
        quiz: quizId,
        status: { $in: ['completed', 'graded'] }
      })
      .populate('student', 'username fullName email')
      .sort({ percentage: -1 });

      // Prepare Excel data
      const studentSheet = examSessions.map((session, index) => {
        // Get weak topics for this student
        const weakTopics = [];
        if (session.answers && quiz.questions) {
          const questionMap = {};
          quiz.questions.forEach(q => {
            questionMap[q._id.toString()] = q;
          });

          const topicErrors = {};
          session.answers.forEach(answer => {
            let topic = 'Unknown';
            if (answer.question && questionMap[answer.question.toString()]) {
              topic = questionMap[answer.question.toString()].topic || 'Unknown';
            }
            if (!topicErrors[topic]) {
              topicErrors[topic] = { total: 0, wrong: 0 };
            }
            topicErrors[topic].total++;
            if (!answer.isCorrect) {
              topicErrors[topic].wrong++;
            }
          });

          Object.keys(topicErrors).forEach(topic => {
            const accuracy = (topicErrors[topic].total - topicErrors[topic].wrong) / topicErrors[topic].total * 100;
            if (accuracy < 60) {
              weakTopics.push(topic);
            }
          });
        }

        return {
          'Rank': index + 1,
          'Student Name': session.student?.fullName || 'N/A',
          'Username': session.student?.username || 'N/A',
          'Email': session.student?.email || 'N/A',
          'Score': session.score || 0,
          'Total Marks': session.totalMarks || 0,
          'Percentage': `${Math.round(session.percentage || 0)}%`,
          'Status': (session.percentage || 0) >= (quiz.settings?.passingMarks || 0) ? 'Passed' : 'Failed',
          'Time Spent (minutes)': Math.round((session.timeSpent || 0) / 60),
          'Completed At': session.endTime ? new Date(session.endTime).toLocaleString() : 'N/A',
          'Weak Topics': weakTopics.join(', ') || 'None'
        };
      });

      res.json({
        success: true,
        data: {
          quizTitle: quiz.title,
          quizInfo: {
            'Total Questions': quiz.questions?.length || 0,
            'Total Marks': quiz.settings?.totalMarks || quiz.questions?.length || 0,
            'Passing Marks': quiz.settings?.passingMarks || 0,
            'Duration (minutes)': quiz.settings?.duration || 0
          },
          studentResults: studentSheet,
          summary: {
            totalAttempts: examSessions.length,
            averageScore: examSessions.length > 0
              ? `${Math.round(examSessions.reduce((sum, s) => sum + (s.percentage || 0), 0) / examSessions.length)}%`
              : '0%',
            passingRate: examSessions.length > 0
              ? `${Math.round((examSessions.filter(s => (s.percentage || 0) >= (quiz.settings?.passingMarks || 0)).length / examSessions.length) * 100)}%`
              : '0%'
          }
        },
        filename: `quiz-results-${quiz.title.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.json`
      });
    } catch (error) {
      console.error('❌ Export quiz results error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getLeaderboard(req, res) {
    try {
      const { classroomId } = req.params;

      // ✅ FIXED: Get all completed exam sessions and calculate leaderboard from them
      const examSessions = await ExamSession.find({
        classroom: classroomId,
        status: { $in: ['completed', 'graded'] }
      })
        .populate('student', 'username fullName avatar email')
        .select('student score totalMarks percentage timeSpent endTime')
        .sort({ percentage: -1, timeSpent: 1 });

      // Group by student and calculate averages
      const studentMap = new Map();
      
      examSessions.forEach(session => {
        const studentId = session.student._id.toString();
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            student: session.student,
            scores: [],
            totalTimeSpent: 0,
            completedQuizzes: 0
          });
        }
        
        const studentData = studentMap.get(studentId);
        studentData.scores.push(session.percentage || 0);
        studentData.totalTimeSpent += session.timeSpent || 0;
        studentData.completedQuizzes += 1;
      });

      // Calculate average scores and create leaderboard
      const leaderboard = Array.from(studentMap.values())
        .map(studentData => {
          const averageScore = studentData.scores.length > 0
            ? studentData.scores.reduce((sum, score) => sum + score, 0) / studentData.scores.length
            : 0;
          
          return {
            student: studentData.student,
            averageScore: Math.round(averageScore * 100) / 100,
            completedQuizzes: studentData.completedQuizzes,
            totalTimeSpent: Math.round(studentData.totalTimeSpent / 60) // Convert to minutes
          };
        })
        .sort((a, b) => b.averageScore - a.averageScore)
        .map((item, index) => ({
          rank: index + 1,
          ...item
        }))
        .slice(0, 20);

      res.json({
        success: true,
        leaderboard
      });
    } catch (error) {
      console.error('❌ Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getExamSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;
      const firebaseUserId = req.user?.user_id || req.user?.uid;
      
      const user = await User.findOne({ userId: firebaseUserId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const examSession = await ExamSession.findById(sessionId)
        .populate('student', 'username fullName avatar')
        .populate('quiz', 'title settings questions')
        .populate('classroom', 'name subject');

      if (!examSession) {
        return res.status(404).json({
          success: false,
          message: 'Exam session not found'
        });
      }

      const isOwner = examSession.student._id.toString() === user._id.toString();
      const isTeacher = await Classroom.exists({
        _id: examSession.classroom._id,
        teacher: user._id
      });

      // ✅ NEW: Get total students who attempted this quiz
      const totalAttempts = await ExamSession.countDocuments({
        quiz: examSession.quiz._id,
        status: { $in: ['completed', 'graded'] }
      });

      // ✅ NEW: Calculate student's rank in this quiz
      let studentRank = null;
      if (!isTeacher) {
        // Get all exam sessions for this quiz, sorted by percentage (descending), then by score, then by completion time
        const allSessions = await ExamSession.find({
          quiz: examSession.quiz._id,
          status: { $in: ['completed', 'graded'] }
        })
        .select('percentage score totalMarks student endTime')
        .sort({ percentage: -1, score: -1, endTime: 1 })
        .lean();

        // Find current student's position in sorted list
        const currentStudentId = examSession.student._id.toString();
        const rankIndex = allSessions.findIndex(s => 
          s.student.toString() === currentStudentId
        );
        
        if (rankIndex !== -1) {
          studentRank = rankIndex + 1;
        }
      }

      if (!isOwner && !isTeacher) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this exam session'
        });
      }

      res.json({
        success: true,
        examSession,
        totalAttempts, // ✅ NEW: Total students who attempted this quiz
        studentRank, // ✅ NEW: Student's rank in this quiz
        userRole: isTeacher ? 'teacher' : 'student'
      });
    } catch (error) {
      console.error('❌ Get exam session details error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ClassroomController();