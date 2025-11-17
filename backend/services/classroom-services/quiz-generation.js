const Quiz = require('../../models/Quiz');
const Classroom = require('../../models/Classroom');

class QuizGenerationService {
  constructor() {
    this.defaultQuizSettings = {
      shuffleQuestions: true,
      showResults: true,
      allowRetakes: false
    };
  }

  async createManualQuiz(quizData, teacherId) {
    try {
      console.log('📝 Creating manual quiz...');
      
      const quiz = new Quiz({
        ...quizData,
        teacher: teacherId,
        createdBy: 'manual'
      });

      await quiz.save();
      console.log('✅ Manual quiz created successfully');
      return quiz;
      
    } catch (error) {
      console.error('❌ Manual quiz creation failed:', error.message);
      throw error;
    }
  }

  async createAIQuiz(aiQuizData, classroomId, teacherId, settings) {
    try {
      console.log('🤖 Creating AI-generated quiz...');
      
      // ✅ FIXED: Ensure exact question count from settings
      const requestedQuestions = settings.numQuestions || 10;
      const actualQuestions = aiQuizData.questions || [];
      
      console.log(`🔢 Question Count: Requested ${requestedQuestions}, Got ${actualQuestions.length}`);
      
      // Limit questions to exactly what was requested
      const limitedQuestions = actualQuestions.slice(0, requestedQuestions);
      
      if (limitedQuestions.length < requestedQuestions) {
        console.warn(`⚠️ Warning: Requested ${requestedQuestions} but only got ${limitedQuestions.length} questions`);
      }

      const quiz = new Quiz({
        title: aiQuizData.title || `AI Quiz - ${new Date().toLocaleDateString()}`,
        description: aiQuizData.description || 'Quiz generated from PDF content',
        classroom: classroomId,
        teacher: teacherId,
        questions: limitedQuestions, // ✅ FIXED: Use limited questions
        topics: aiQuizData.topics || this.extractTopics(limitedQuestions),
        createdBy: 'ai_pdf',
        settings: {
          ...this.defaultQuizSettings,
          totalMarks: limitedQuestions.length, // ✅ FIXED: Based on actual questions
          duration: settings.examTime,
          passingMarks: settings.passingMarks || 40,
          allowRetakes: settings.allowRetakes || false,
          shuffleQuestions: settings.shuffleQuestions || true,
          showResults: settings.showResults || true,
          showAnswers: settings.showAnswers || false
        },
        schedule: {
          startTime: settings.startTime || null,
          endTime: settings.endTime || null,
          timeLimit: settings.timeLimit || settings.examTime
        },
        status: 'draft' // ✅ FIXED: Default status
      });

      await quiz.save();
      console.log('✅ AI quiz created successfully');
      return quiz;
      
    } catch (error) {
      console.error('❌ AI quiz creation failed:', error.message);
      throw error;
    }
  }

  extractTopics(questions) {
    const topics = new Set();
    questions.forEach(q => {
      if (q.topic) topics.add(q.topic);
    });
    return Array.from(topics);
  }

  validateQuizSchedule(startTime, endTime, timeLimit) {
    const now = new Date();
    const start = new Date(startTime);
    
    if (start < now) {
      throw new Error('Quiz start time cannot be in the past');
    }
    
    if (endTime && start >= new Date(endTime)) {
      throw new Error('Start time must be before end time');
    }
    
    if (timeLimit && timeLimit <= 0) {
      throw new Error('Time limit must be positive');
    }
  }

  async getQuizzesByClassroom(classroomId, options = {}) {
    try {
      const { page = 1, limit = 10, status = 'all' } = options;
      const skip = (page - 1) * limit;
      
      // ✅ FIXED: First fetch all quizzes, update their statuses, then filter
      let query = { classroom: classroomId, isActive: true };
      
      // Fetch all quizzes first (without status filter)
      const allQuizzes = await Quiz.find(query)
        .sort({ 'schedule.startTime': 1, createdAt: -1 })
        .populate('teacher', 'username fullName')
        .populate('classroom', 'name subject');
      
      // ✅ FIXED: Update quiz status based on schedule before filtering
      const now = new Date();
      const updatedQuizzes = await Promise.all(
        allQuizzes.map(async (quiz) => {
          if (quiz.schedule) {
            const startTime = quiz.schedule.startTime ? new Date(quiz.schedule.startTime) : null;
            const endTime = quiz.schedule.endTime ? new Date(quiz.schedule.endTime) : null;
            
            let newStatus = quiz.status;
            
            // Only update if not manually set to draft or ended
            if (quiz.status !== 'draft' && quiz.status !== 'ended') {
              if (startTime && now < startTime) {
                newStatus = 'upcoming';
              } else if (endTime && now > endTime) {
                newStatus = 'ended';
              } else if (startTime && now >= startTime && (!endTime || now <= endTime)) {
                newStatus = 'active';
              } else if (!startTime && !endTime) {
                // No schedule, keep current status (likely draft)
                newStatus = quiz.status;
              }
              
              // Update in database if status changed
              if (newStatus !== quiz.status) {
                quiz.status = newStatus;
                await quiz.save();
              }
            }
          } else if (!quiz.schedule && quiz.status !== 'draft') {
            // No schedule but not draft - might need to be set to draft
            // But we'll keep it as is for now
          }
          
          return quiz;
        })
      );
      
      // ✅ FIXED: Now filter by status after updating
      let filteredQuizzes = updatedQuizzes;
      if (status && status !== 'all') {
        filteredQuizzes = updatedQuizzes.filter(quiz => {
          const quizStatus = quiz.status?.toLowerCase();
          return quizStatus === status.toLowerCase();
        });
      }
      
      // Apply pagination
      const total = filteredQuizzes.length;
      const paginatedQuizzes = filteredQuizzes.slice(skip, skip + limit);
      
      return {
        quizzes: paginatedQuizzes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      console.error('❌ Error fetching quizzes:', error.message);
      throw error;
    }
  }

  async getQuizById(quizId) {
    try {
      const quiz = await Quiz.findById(quizId)
        .populate('teacher', 'username fullName avatar')
        .populate('classroom', 'name subject');
      
      if (!quiz) {
        throw new Error('Quiz not found');
      }
      
      return quiz;
    } catch (error) {
      console.error('❌ Error fetching quiz:', error.message);
      throw error;
    }
  }

  async updateQuiz(quizId, updateData, teacherId) {
    try {
      const quiz = await Quiz.findOne({ _id: quizId, teacher: teacherId });
      
      if (!quiz) {
        throw new Error('Quiz not found or access denied');
      }
      
      Object.assign(quiz, updateData);
      await quiz.save();
      
      console.log('✅ Quiz updated successfully');
      return quiz;
    } catch (error) {
      console.error('❌ Error updating quiz:', error.message);
      throw error;
    }
  }

  async deleteQuiz(quizId, teacherId) {
    try {
      const result = await Quiz.findOneAndDelete({ _id: quizId, teacher: teacherId });
      
      if (!result) {
        throw new Error('Quiz not found or access denied');
      }
      
      console.log('✅ Quiz deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting quiz:', error.message);
      throw error;
    }
  }
}

module.exports = new QuizGenerationService();