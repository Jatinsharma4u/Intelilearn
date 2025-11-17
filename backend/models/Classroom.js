const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  subject: String,
  gradeLevel: String,
  code: { type: String, unique: true, required: true },
  joinCode: { type: String, unique: true, sparse: true }, // ✅ ADDED joinCode field
  joinLink: { type: String, unique: true },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  students: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  }],
  settings: {
    allowStudentJoin: { type: Boolean, default: true },
    maxStudents: { type: Number, default: 50 },
    requireApproval: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

classroomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.isNew) {
    this.code = this.generateUniqueCode();
    this.joinCode = this.code; // ✅ SET joinCode same as code
    this.joinLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/classroom/join/${this.code}`;
  }
  next();
});

classroomSchema.methods.generateUniqueCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

classroomSchema.methods.addStudent = function(studentId) {
  if (this.students.length >= this.settings.maxStudents) {
    throw new Error('Classroom is full');
  }
  
  const existingStudent = this.students.find(s => s.student.toString() === studentId.toString());
  if (!existingStudent) {
    this.students.push({ student: studentId });
    return true;
  }
  return false; // Student already exists
};

classroomSchema.methods.isTeacher = function(userId) {
  return this.teacher.toString() === userId.toString();
};

classroomSchema.methods.isStudent = function(userId) {
  return this.students.some(s => s.student.toString() === userId.toString());
};

classroomSchema.methods.getStudentCount = function() {
  return this.students.length;
};

// Static method to find classrooms by teacher
classroomSchema.statics.findByTeacher = function(teacherId) {
  return this.find({ teacher: teacherId }).populate('students.student', 'username fullName avatar');
};

// Static method to find classrooms by student
classroomSchema.statics.findByStudent = function(studentId) {
  return this.find({ 
    'students.student': studentId,
    'students.status': 'active'
  }).populate('teacher', 'username fullName avatar');
};

module.exports = mongoose.models.Classroom || mongoose.model('Classroom', classroomSchema);