const mongoose = require('mongoose');

const extractedTextSchema = new mongoose.Schema({
  course_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  original_text: { type: String, required: true },
  processed_chunks: [{
    chunk_text: String,
    batch_number: Number,
    module_range: String,
    chunk_order: Number,
    content_quality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    key_concepts: [String],
    word_count: Number
  }],
  total_chunks: { type: Number, default: 0 },
  extraction_metadata: {
    total_files: Number,
    extraction_time: Date,
    processing_level: { type: String, default: 'enhanced' },
    content_analysis: {
      total_words: Number,
      total_sentences: Number,
      avg_sentence_length: Number,
      lexical_diversity: Number,
      content_quality: String
    }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Update timestamp before save
extractedTextSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// ✅ NEW: Virtual for batch statistics
extractedTextSchema.virtual('batch_stats').get(function() {
  if (!this.processed_chunks || this.processed_chunks.length === 0) return {};
  
  const batchStats = {};
  const batches = [...new Set(this.processed_chunks.map(chunk => chunk.batch_number))];
  
  batches.forEach(batch => {
    const batchChunks = this.processed_chunks.filter(chunk => chunk.batch_number === batch);
    batchStats[`batch_${batch}`] = {
      total_chunks: batchChunks.length,
      total_words: batchChunks.reduce((sum, chunk) => sum + (chunk.word_count || 0), 0),
      avg_quality: this.calculateAverageQuality(batchChunks),
      key_concepts: [...new Set(batchChunks.flatMap(chunk => chunk.key_concepts || []))].slice(0, 10)
    };
  });
  
  return batchStats;
});

// ✅ NEW: Method to calculate average quality
extractedTextSchema.methods.calculateAverageQuality = function(chunks) {
  if (!chunks || chunks.length === 0) return 'medium';
  
  const qualityScores = {
    'low': 1,
    'medium': 2,
    'high': 3
  };
  
  const totalScore = chunks.reduce((sum, chunk) => {
    return sum + (qualityScores[chunk.content_quality] || 2);
  }, 0);
  
  const avgScore = totalScore / chunks.length;
  
  if (avgScore >= 2.5) return 'high';
  if (avgScore >= 1.5) return 'medium';
  return 'low';
};

// ✅ NEW: Method to get content summary
extractedTextSchema.methods.getContentSummary = function() {
  return {
    total_chunks: this.total_chunks,
    total_words: this.processed_chunks.reduce((sum, chunk) => sum + (chunk.word_count || 0), 0),
    batches_used: [...new Set(this.processed_chunks.map(chunk => chunk.batch_number))].length,
    overall_quality: this.calculateAverageQuality(this.processed_chunks),
    key_concepts: [...new Set(this.processed_chunks.flatMap(chunk => chunk.key_concepts || []))].slice(0, 15)
  };
};

module.exports = mongoose.model('ExtractedText', extractedTextSchema);