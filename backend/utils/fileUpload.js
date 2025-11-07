const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure temp-uploads directory exists
const tempUploadsDir = path.join(__dirname, '../temp-uploads');
if (!fs.existsSync(tempUploadsDir)) {
  fs.mkdirSync(tempUploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + fileExtension);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload PDF, PPT, DOC, or TXT files.`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files
  }
});

// Main file upload middleware
const handleFileUpload = () => {
  return upload.array('files', 10);
};

// Alternative: Single file upload middleware
const handleSingleFileUpload = (fieldName = 'file') => {
  return upload.single(fieldName);
};

// Error handling wrapper for file uploads
const withFileUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error('File upload error:', err);
        
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 50MB.'
              });
            case 'LIMIT_FILE_COUNT':
              return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum 10 files allowed.'
              });
            case 'LIMIT_UNEXPECTED_FILE':
              return res.status(400).json({
                success: false,
                error: 'Unexpected file field. Please use "files" as field name.'
              });
            default:
              return res.status(400).json({
                success: false,
                error: `File upload error: ${err.message}`
              });
          }
        }
        
        // Handle other errors
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload failed'
        });
      }
      
      // Files uploaded successfully
      if (req.files && req.files.length > 0) {
        console.log(`✅ ${req.files.length} file(s) uploaded successfully`);
        req.files.forEach(file => {
          console.log(`   - ${file.originalname} (${file.size} bytes) -> ${file.filename}`);
        });
      } else if (req.file) {
        console.log(`✅ File uploaded successfully: ${req.file.originalname} (${req.file.size} bytes)`);
      }
      
      next();
    });
  };
};

// Utility function to clean up uploaded files
const cleanupUploadedFiles = (files) => {
  if (!files) return;
  
  const fileArray = Array.isArray(files) ? files : [files];
  
  fileArray.forEach(file => {
    if (file && file.path) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`🧹 Cleaned up file: ${file.path}`);
        }
      } catch (error) {
        console.error('Error cleaning up file:', error);
      }
    }
  });
};

// Get file type icon
const getFileTypeIcon = (mimetype) => {
  const icons = {
    'application/pdf': '📕',
    'application/vnd.ms-powerpoint': '📊',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
    'application/msword': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📄',
    'text/plain': '📝'
  };
  
  return icons[mimetype] || '📁';
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate uploaded files
const validateUploadedFiles = (files) => {
  if (!files || files.length === 0) {
    return { isValid: false, error: 'No files uploaded' };
  }

  const errors = [];
  const maxSize = 50 * 1024 * 1024; // 50MB

  files.forEach(file => {
    if (file.size > maxSize) {
      errors.push(`File "${file.originalname}" is too large (${formatFileSize(file.size)}). Maximum size is 50MB.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

module.exports = {
  upload,
  handleFileUpload,
  handleSingleFileUpload,
  withFileUpload,
  cleanupUploadedFiles,
  getFileTypeIcon,
  formatFileSize,
  validateUploadedFiles
};