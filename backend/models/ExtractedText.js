const mongoose = require('mongoose');

const extractedTextSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Course' },
  userId: { type: String, required: true, ref: 'User' },
  originalText: { type: String, required: true },
  cleanedText: { type: String, required: true },
  textChunks: [{
    chunkNumber: Number,
    content: String,
    wordCount: Number,
    topics: [String],
    usedInModules: [Number]
  }],
  chunkingStrategy: {
    totalModules: Number,
    chunksPerModule: Number,
    totalChunks: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExtractedText', extractedTextSchema);