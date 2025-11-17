const StudentProgress = require('../../models/StudentProgress');
const TopicAnalytics = require('../../models/TopicAnalytics');
const ExamSession = require('../../models/Exam');

class AnalyticsService {
  constructor() {
    this.weakTopicThreshold = 0.6; // 60% accuracy
  }

  async updateStudentProgress(examSession) {
    try {
      const { student, quiz, answers, score, totalMarks, timeSpent } = examSession;
      
      // Find or create student progress
      let progress = await StudentProgress.findOne({
        student: student,
        classroom: quiz.classroom
      });

      if (!progress) {
        progress = new StudentProgress({
          student: student,
          classroom: quiz.classroom
        });
      }

      // Update overall stats
      progress.overallStats.totalQuizzes += 1;
      progress.overallStats.completedQuizzes += 1;
      
      // Calculate new average score
      const totalScore = (progress.overallStats.averageScore * (progress.overallStats.completedQuizzes - 1)) + (score / totalMarks * 100);
      progress.overallStats.averageScore = totalScore / progress.overallStats.completedQuizzes;
      
      progress.overallStats.totalTimeSpent += Math.ceil(timeSpent / 60); // Convert to minutes

      // Update topic performance
      if (answers && answers.length > 0) {
        answers.forEach(answer => {
          if (answer.question && answer.question.topic) {
            const topic = answer.question.topic;
            const answerTime = answer.timeSpent || 0;
            progress.updateTopicPerformance(topic, answer.isCorrect, answerTime);
          }
        });
      }

      // Update weak/strong topics
      progress.updateWeakStrongTopics();

      // Add to recent activity
      progress.recentActivity.unshift({
        quiz: quiz._id,
        score: score,
        totalMarks: totalMarks,
        percentage: (score / totalMarks) * 100,
        completedAt: new Date(),
        timeSpent: timeSpent
      });

      // Keep only last 10 activities
      if (progress.recentActivity.length > 10) {
        progress.recentActivity = progress.recentActivity.slice(0, 10);
      }

      progress.lastUpdated = new Date();
      await progress.save();
      
      // Update classroom topic analytics
      await this.updateTopicAnalytics(quiz.classroom, progress);
      
      console.log('✅ Student progress updated successfully');
      return progress;
      
    } catch (error) {
      console.error('❌ Error updating student progress:', error.message);
      throw error;
    }
  }

  async updateTopicAnalytics(classroomId, studentProgress) {
    try {
      const topics = studentProgress.topicPerformance;
      
      for (const topicPerf of topics) {
        let topicAnalytics = await TopicAnalytics.findOne({
          classroom: classroomId,
          topic: topicPerf.topic
        });

        if (!topicAnalytics) {
          topicAnalytics = new TopicAnalytics({
            classroom: classroomId,
            topic: topicPerf.topic
          });
        }

        // Update overall stats
        topicAnalytics.overallStats.totalAttempts += topicPerf.totalQuestions;
        topicAnalytics.overallStats.correctAttempts += topicPerf.correctAnswers;
        
        if (topicAnalytics.overallStats.totalAttempts > 0) {
          topicAnalytics.overallStats.averageAccuracy = 
            topicAnalytics.overallStats.correctAttempts / topicAnalytics.overallStats.totalAttempts;
        }

        // Update student performance
        const studentPerf = topicAnalytics.studentPerformance.find(
          sp => sp.student.toString() === studentProgress.student.toString()
        );

        if (studentPerf) {
          studentPerf.totalQuestions += topicPerf.totalQuestions;
          studentPerf.correctAnswers += topicPerf.correctAnswers;
          studentPerf.accuracy = studentPerf.correctAnswers / studentPerf.totalQuestions;
          studentPerf.averageTime = topicPerf.averageTime;
        } else {
          topicAnalytics.studentPerformance.push({
            student: studentProgress.student,
            totalQuestions: topicPerf.totalQuestions,
            correctAnswers: topicPerf.correctAnswers,
            accuracy: topicPerf.correctAnswers / topicPerf.totalQuestions,
            averageTime: topicPerf.averageTime
          });
        }

        // Calculate weak topic status
        topicAnalytics.calculateWeakTopicStatus();
        topicAnalytics.lastUpdated = new Date();

        await topicAnalytics.save();
      }
      
    } catch (error) {
      console.error('❌ Error updating topic analytics:', error.message);
      throw error;
    }
  }

  async getClassroomAnalytics(classroomId) {
    try {
      const studentProgress = await StudentProgress.find({ classroom: classroomId })
        .populate('student', 'username fullName avatar');
        
      const topicAnalytics = await TopicAnalytics.find({ classroom: classroomId })
        .sort({ 'overallStats.averageAccuracy': 1 }); // Sort by worst performing first

      const weakTopics = topicAnalytics.filter(topic => topic.isWeakTopic);
      const strongTopics = topicAnalytics.filter(topic => !topic.isWeakTopic);

      const overallStats = this.calculateOverallClassroomStats(studentProgress);
      
      // ✅ ADDED: Calculate topics with most wrong answers
      const topicsWithWrongAnswers = await this.calculateTopicsWithMostWrongAnswers(classroomId);
      
      return {
        studentProgress,
        topicAnalytics,
        weakTopics,
        strongTopics,
        overallStats,
        topicsWithWrongAnswers // ✅ New field
      };
      
    } catch (error) {
      console.error('❌ Error getting classroom analytics:', error.message);
      throw error;
    }
  }

  // ✅ NEW: Calculate topics where most students got wrong answers
  async calculateTopicsWithMostWrongAnswers(classroomId) {
    try {
      // Get all completed exam sessions for this classroom with quiz populated
      const examSessions = await ExamSession.find({
        classroom: classroomId,
        status: { $in: ['completed', 'graded'] }
      })
      .populate('quiz', 'questions'); // questions is embedded, not a reference

      // Aggregate wrong answers by topic
      const topicStats = {};

      examSessions.forEach(session => {
        if (!session.answers || session.answers.length === 0) return;
        if (!session.quiz || !session.quiz.questions) return;

        // Create a map of question ID to question for quick lookup
        const questionMap = {};
        session.quiz.questions.forEach(q => {
          questionMap[q._id.toString()] = q;
        });

        session.answers.forEach(answer => {
          // Get topic from answer.questionText (if stored) or from quiz questions
          let topic = null;
          
          // Try to get topic from the question in quiz
          if (answer.question && questionMap[answer.question.toString()]) {
            topic = questionMap[answer.question.toString()].topic;
          }
          
          // Fallback: check if topic is stored in answer itself
          if (!topic && answer.questionText) {
            // Try to extract from questionText or use a default
            topic = 'Unknown';
          }
          
          // Final fallback
          if (!topic) topic = 'Unknown';

          // Initialize topic stats
          if (!topicStats[topic]) {
            topicStats[topic] = {
              topic,
              totalQuestions: 0,
              wrongAnswers: 0,
              correctAnswers: 0,
              studentsWhoGotWrong: new Set(),
              accuracy: 0
            };
          }

          topicStats[topic].totalQuestions++;
          
          if (!answer.isCorrect) {
            topicStats[topic].wrongAnswers++;
            // Track which student got it wrong
            topicStats[topic].studentsWhoGotWrong.add(session.student.toString());
          } else {
            topicStats[topic].correctAnswers++;
          }
        });
      });

      // Calculate accuracy and format results
      const topicsList = Object.values(topicStats).map(topic => {
        topic.accuracy = topic.totalQuestions > 0 
          ? (topic.correctAnswers / topic.totalQuestions) * 100 
          : 0;
        topic.studentsWhoGotWrongCount = topic.studentsWhoGotWrong.size;
        delete topic.studentsWhoGotWrong; // Remove Set, keep count
        return topic;
      });

      // Sort by: 1) Number of students who got wrong, 2) Wrong answer count, 3) Low accuracy
      topicsList.sort((a, b) => {
        if (b.studentsWhoGotWrongCount !== a.studentsWhoGotWrongCount) {
          return b.studentsWhoGotWrongCount - a.studentsWhoGotWrongCount;
        }
        if (b.wrongAnswers !== a.wrongAnswers) {
          return b.wrongAnswers - a.wrongAnswers;
        }
        return a.accuracy - b.accuracy;
      });

      return topicsList.slice(0, 10); // Top 10 problematic topics
      
    } catch (error) {
      console.error('❌ Error calculating topics with wrong answers:', error.message);
      return [];
    }
  }

  calculateOverallClassroomStats(studentProgress) {
    if (studentProgress.length === 0) {
      return {
        totalStudents: 0,
        averageScore: 0,
        totalQuizzes: 0,
        completionRate: 0,
        totalAttempts: 0
      };
    }

    const totalStudents = studentProgress.length;
    const totalQuizzes = studentProgress.reduce((sum, progress) => 
      sum + progress.overallStats.completedQuizzes, 0
    );
    
    const averageScore = studentProgress.reduce((sum, progress) => 
      sum + progress.overallStats.averageScore, 0
    ) / totalStudents;

    // ✅ FIXED: Better completion rate calculation
    const totalAttempts = studentProgress.reduce((sum, progress) => 
      sum + progress.overallStats.completedQuizzes, 0
    );

    return {
      totalStudents,
      averageScore: Math.round(averageScore * 100) / 100,
      totalQuizzes,
      totalAttempts,
      completionRate: totalStudents > 0 ? Math.round((totalAttempts / (totalStudents * Math.max(totalQuizzes, 1))) * 100) : 0
    };
  }

  async getStudentProgress(studentId, classroomId) {
    try {
      // ✅ FIXED: First try to get from StudentProgress model
      let progress = await StudentProgress.findOne({
        student: studentId,
        classroom: classroomId
      })
      .populate('student', 'username fullName avatar')
      .populate('classroom', 'name subject')
      .populate('recentActivity.quiz', 'title');

      // ✅ NEW: If no progress exists, calculate from exam sessions
      if (!progress) {
        const ExamSession = require('../models/Exam');
        const examSessions = await ExamSession.find({
          student: studentId,
          classroom: classroomId,
          status: { $in: ['completed', 'graded'] }
        })
          .populate('quiz', 'title')
          .sort({ endTime: -1 });

        if (examSessions.length === 0) {
          return {
            student: studentId,
            classroom: classroomId,
            overallStats: {
              totalQuizzes: 0,
              completedQuizzes: 0,
              averageScore: 0,
              totalTimeSpent: 0
            },
            topicPerformance: [],
            weakTopics: [],
            strongTopics: [],
            recentActivity: []
          };
        }

        // Calculate from exam sessions
        const totalQuizzes = examSessions.length;
        const totalScore = examSessions.reduce((sum, session) => sum + (session.percentage || 0), 0);
        const averageScore = totalScore / totalQuizzes;
        const totalTimeSpent = examSessions.reduce((sum, session) => sum + (session.timeSpent || 0), 0) / 60; // Convert to minutes

        // Get recent activity
        const recentActivity = examSessions.slice(0, 10).map(session => ({
          quiz: session.quiz,
          score: session.score || 0,
          totalMarks: session.totalMarks || 0,
          percentage: session.percentage || 0,
          completedAt: session.endTime || new Date(),
          timeSpent: session.timeSpent || 0
        }));

        // Calculate topic performance from all sessions
        const topicMap = {};
        examSessions.forEach(session => {
          if (session.topicsPerformance && session.topicsPerformance.length > 0) {
            session.topicsPerformance.forEach(tp => {
              if (!topicMap[tp.topic]) {
                topicMap[tp.topic] = { correct: 0, total: 0 };
              }
              topicMap[tp.topic].correct += tp.correct || 0;
              topicMap[tp.topic].total += tp.total || 0;
            });
          }
        });

        const topicPerformance = Object.keys(topicMap).map(topic => ({
          topic,
          totalQuestions: topicMap[topic].total,
          correctAnswers: topicMap[topic].correct,
          accuracy: topicMap[topic].total > 0 ? topicMap[topic].correct / topicMap[topic].total : 0,
          averageTime: 0,
          lastAttempt: new Date()
        }));

        // Calculate weak and strong topics
        const weakTopics = topicPerformance
          .filter(tp => tp.accuracy < 0.6 && tp.totalQuestions >= 3)
          .map(tp => tp.topic);
        
        const strongTopics = topicPerformance
          .filter(tp => tp.accuracy >= 0.8 && tp.totalQuestions >= 3)
          .map(tp => tp.topic);

        return {
          student: studentId,
          classroom: classroomId,
          overallStats: {
            totalQuizzes,
            completedQuizzes: totalQuizzes,
            averageScore: Math.round(averageScore * 100) / 100,
            totalTimeSpent: Math.round(totalTimeSpent)
          },
          topicPerformance,
          weakTopics,
          strongTopics,
          recentActivity
        };
      }

      return progress;
    } catch (error) {
      console.error('❌ Error getting student progress:', error.message);
      throw error;
    }
  }

  async exportResultsToExcel(classroomId) {
    try {
      const analytics = await this.getClassroomAnalytics(classroomId);
      
      // Prepare Excel data
      const excelData = this.formatDataForExcel(analytics);
      
      console.log('✅ Results prepared for export');
      return excelData;
      
    } catch (error) {
      console.error('❌ Error exporting results:', error.message);
      throw error;
    }
  }

  formatDataForExcel(analytics) {
    const { studentProgress, topicAnalytics } = analytics;
    
    // Student performance sheet
    const studentSheet = studentProgress.map(progress => ({
      'Student Name': progress.student?.fullName || 'N/A',
      'Username': progress.student?.username || 'N/A',
      'Total Quizzes': progress.overallStats.completedQuizzes,
      'Average Score': `${progress.overallStats.averageScore.toFixed(2)}%`,
      'Total Time Spent': `${Math.round(progress.overallStats.totalTimeSpent)} mins`,
      'Weak Topics': progress.weakTopics.join(', ') || 'None',
      'Strong Topics': progress.strongTopics.join(', ') || 'None'
    }));

    // Topic analytics sheet
    const topicSheet = topicAnalytics.map(topic => ({
      'Topic': topic.topic,
      'Total Attempts': topic.overallStats.totalAttempts,
      'Correct Attempts': topic.overallStats.correctAttempts,
      'Average Accuracy': `${(topic.overallStats.averageAccuracy * 100).toFixed(2)}%`,
      'Weak Topic': topic.isWeakTopic ? 'Yes' : 'No',
      'Students Struggling': topic.weakStudentsCount
    }));

    return {
      studentPerformance: studentSheet,
      topicAnalytics: topicSheet,
      summary: {
        generatedAt: new Date().toISOString(),
        totalStudents: analytics.overallStats.totalStudents,
        classAverage: `${analytics.overallStats.averageScore}%`,
        totalWeakTopics: analytics.weakTopics.length
      }
    };
  }
}

module.exports = new AnalyticsService();