const express = require('express');
const multer = require('multer');
const {
  extractTextFromPDF,
  generateAISummary,
  generateFlashcards,
  generateQuizQuestions
} = require('../controllers/ai-controller');
const authMiddleware = require('../middleware/auth-middleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// Get all uploaded files for user
router.get('/uploaded-files', authMiddleware, async (req, res) => {
  try {
    // TODO: Implement database fetch
    const files = []; // Fetch from MongoDB
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file and start AI processing
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // TODO: Save file info to MongoDB
    const fileData = {
      _id: generateId(),
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      filePath: req.file.path,
      uploadDate: new Date(),
      status: 'processing',
      userId: req.user.uid
    };

    // Start AI processing in background
    processFileWithAI(fileData);

    res.json(fileData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI summary for a file
router.get('/summary/:fileId', authMiddleware, async (req, res) => {
  try {
    // TODO: Fetch from MongoDB
    const summary = "AI generated summary"; // Get from database
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get flashcards for a file
router.get('/flashcards/:fileId', authMiddleware, async (req, res) => {
  try {
    // TODO: Fetch from MongoDB
    const flashcards = []; // Get from database
    res.json({ flashcards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quiz questions for a file
router.get('/quiz/:fileId', authMiddleware, async (req, res) => {
  try {
    // TODO: Fetch from MongoDB
    const questions = []; // Get from database
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a file
router.delete('/files/:fileId', authMiddleware, async (req, res) => {
  try {
    // TODO: Delete from MongoDB and storage
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retry AI processing for a file
router.post('/retry/:fileId', authMiddleware, async (req, res) => {
  try {
    // TODO: Retry AI processing
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to process file with AI (background task)
async function processFileWithAI(fileData) {
  try {
    // 1. Extract text from file
    const extractedText = await extractTextFromPDF(fileData.filePath);
    
    // 2. Generate AI content in parallel
    const [summary, flashcards, quizQuestions] = await Promise.all([
      generateAISummary(extractedText),
      generateFlashcards(extractedText),
      generateQuizQuestions(extractedText)
    ]);

    // 3. Save to database
    // TODO: Update file record in MongoDB
    
    console.log('AI processing completed for file:', fileData.fileName);
  } catch (error) {
    console.error('AI processing failed:', error);
    // TODO: Update status to 'failed' in database
  }
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

module.exports = router;