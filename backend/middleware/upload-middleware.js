// middleware/file-upload.js
const multer = require('multer');
const path = require('path');
const CONSTANTS = require('../utils/constants');

// Configure multer for file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (CONSTANTS.UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${CONSTANTS.UPLOAD_LIMITS.ALLOWED_MIME_TYPES.join(', ')} are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: CONSTANTS.UPLOAD_LIMITS.MAX_FILE_SIZE,
    files: CONSTANTS.UPLOAD_LIMITS.MAX_FILES
  },
  fileFilter: fileFilter
});

// Error handling middleware for file upload
const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${CONSTANTS.formatFileSize(CONSTANTS.UPLOAD_LIMITS.MAX_FILE_SIZE)}`
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Too many files. Maximum ${CONSTANTS.UPLOAD_LIMITS.MAX_FILES} file allowed`
      });
    }
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
};

// Validate uploaded file
const validateUploadedFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Additional validation for file content
  if (req.file.size === 0) {
    return res.status(400).json({
      success: false,
      message: 'Uploaded file is empty'
    });
  }

  // Check if file has content (basic check)
  if (req.file.size < 100) { // 100 bytes minimum
    return res.status(400).json({
      success: false,
      message: 'File appears to be too small to contain meaningful content'
    });
  }

  next();
};

// Extract file metadata
const extractFileMetadata = (req, res, next) => {
  if (req.file) {
    req.fileMetadata = {
      originalName: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
      extension: path.extname(req.file.originalname).toLowerCase()
    };
  }
  next();
};

module.exports = {
  upload,
  handleUploadErrors,
  validateUploadedFile,
  extractFileMetadata
};