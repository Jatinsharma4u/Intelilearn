require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { spawn } = require('child_process');

// Ensure directories exist
const tempDir = path.join(__dirname, 'temp-uploads');
const coursesDir = path.join(__dirname, 'generated-courses');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(coursesDir)) fs.mkdirSync(coursesDir, { recursive: true });

// Firebase admin
const admin = require("./config/firebase-admin");

// Middleware & routes
const verifyToken = require("./middleware/auth-middleware");
const authRoutes = require("./routes/auth-routes");
const userRoutes = require("./routes/user-routes");
const progressRoutes = require("./routes/progress-routes");
const friendRoutes = require('./routes/friend-routes');
const courseRoutes = require('./routes/course-routes');
const courseProgressRoutes = require('./routes/course-progress-routes'); // NEW

// Express app
const app = express();
const PORT = process.env.PORT || 5000;

// 🔹 Global Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files for generated courses
app.use('/api/generated-courses', express.static(path.join(__dirname, 'generated-courses')));

// 🔹 Simple Health Check
app.get("/api/health", (req, res) => {
  res.json({
    message: "🚀 EduAI Backend is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    pythonService: "http://localhost:5001",
    features: {
      enhancedProgress: true,
      weakTopics: true,
      learningAnalytics: true,
      advancedAI: true
    }
  });
});

// 🔹 Protected routes (require auth)
app.use("/api/auth", verifyToken, authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/progress', verifyToken, progressRoutes); // Dashboard progress
app.use('/api/friends', verifyToken, friendRoutes);
app.use('/api/courses', verifyToken, courseRoutes);
app.use('/api/course-progress', verifyToken, courseProgressRoutes); // NEW: Course-specific progress

// 🔹 MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/eduai-platform",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Check if UserProgress model exists
    try {
      const UserProgress = require('./models/UserProgress');
      console.log('✅ UserProgress model loaded successfully');
    } catch (err) {
      console.log('⚠️ UserProgress model not found - progress tracking will use fallback');
    }
    
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    return false;
  }
};

// 🔹 Start Python Service with better error handling
const startPythonService = () => {
  return new Promise((resolve) => {
    const pythonScriptPath = path.join(__dirname, 'python-services', 'app.py');
    
    console.log('🐍 Starting Enhanced Python AI Service...');
    
    // Check if Python file exists
    if (!fs.existsSync(pythonScriptPath)) {
      console.log('❌ Python service file not found:', pythonScriptPath);
      resolve(null);
      return;
    }

    const pythonProcess = spawn('python', [pythonScriptPath], {
      cwd: path.join(__dirname, 'python-services'),
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
      env: {
        ...process.env,
        PYTHONPATH: path.join(__dirname, 'python-services')
      }
    });

    let pythonOutput = '';
    let isHealthy = false;

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      pythonOutput += output + '\n';
      console.log(`🐍 Python: ${output}`);
      
      if (output.includes('Running on') || output.includes('Starting Python AI Service')) {
        isHealthy = true;
        console.log('✅ Python AI Service started successfully');
      }
      
      if (output.includes('Gemini AI configured successfully')) {
        console.log('✅ Gemini AI configured and ready');
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      console.error(`🐍 Python Error: ${error}`);
      pythonOutput += `ERROR: ${error}\n`;
    });

    pythonProcess.on('close', (code) => {
      console.log(`🐍 Python process exited with code ${code}`);
      
      if (code !== 0 && !isHealthy) {
        console.log('❌ Python service failed to start properly');
        console.log('💡 Checking for missing dependencies...');
        
        // Try to install missing dependencies
        installPythonDependencies()
          .then(() => {
            console.log('🔄 Retrying Python service...');
            setTimeout(() => startPythonService().then(resolve), 3000);
          })
          .catch(err => {
            console.log('❌ Failed to install Python dependencies');
            console.log('⚠️ Course generation will use enhanced fallback mode');
            resolve(null);
          });
      } else {
        resolve(pythonProcess);
      }
    });

    // Give Python more time to start (increased timeout)
    setTimeout(() => {
      if (isHealthy) {
        console.log('✅ Python AI Service confirmed healthy');
      } else {
        console.log('⚠️ Python service might not be running properly');
        console.log('💡 Output so far:', pythonOutput);
      }
      resolve(pythonProcess);
    }, 8000);
  });
};

// 🔹 Install Python dependencies
const installPythonDependencies = async () => {
  return new Promise((resolve, reject) => {
    console.log('📦 Installing Enhanced Python dependencies...');
    
    const requirementsPath = path.join(__dirname, 'python-services', 'requirements.txt');
    
    if (!fs.existsSync(requirementsPath)) {
      console.log('❌ requirements.txt not found');
      reject(new Error('requirements.txt not found'));
      return;
    }

    const pipProcess = spawn('pip', ['install', '-r', 'requirements.txt'], {
      cwd: path.join(__dirname, 'python-services'),
      stdio: 'inherit'
    });

    pipProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Python dependencies installed successfully');
        resolve();
      } else {
        console.log('❌ Failed to install Python dependencies');
        reject(new Error('Pip installation failed'));
      }
    });
  });
};

// 🔹 Check Python service health
const checkPythonHealth = async () => {
  try {
    const response = await fetch('http://localhost:5001/python/health', { 
      timeout: 5000 
    });
    const data = await response.json();
    return { 
      success: true, 
      data,
      features: {
        textExtraction: true,
        courseGeneration: true,
        geminiAI: data.gemini_configured || false
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      features: {
        textExtraction: false,
        courseGeneration: false,
        geminiAI: false
      }
    };
  }
};

// 🔹 Enhanced startup with feature detection
const startServer = async () => {
  console.log('🚀 Starting Enhanced EduAI Backend Server...');
  
  const dbConnected = await connectDB();
  
  if (!dbConnected) {
    console.error("❌ Failed to connect to database. Exiting...");
    process.exit(1);
  }

  // Start Python service
  console.log('🔧 Initializing AI Services...');
  const pythonProcess = await startPythonService();
  
  let pythonHealth = { success: false, features: {} };
  if (pythonProcess) {
    pythonHealth = await checkPythonHealth();
  }

  app.listen(PORT, () => {
    console.log(`\n🎉 ==========================================`);
    console.log(`🚀 ENHANCED EduAI Backend Server Started!`);
    console.log(`==============================================`);
    console.log(`📍 Node.js Port: ${PORT}`);
    console.log(`🐍 Python Port: 5001`);
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
    console.log(`🔗 Frontend: http://localhost:3000`);
    console.log(`📁 Temp Uploads: ${tempDir}`);
    console.log(`📚 Generated Courses: ${coursesDir}`);
    
    // Feature status
    console.log(`\n🔧 FEATURE STATUS:`);
    console.log(`✅ MongoDB: Connected`);
    console.log(`✅ Authentication: Ready`);
    console.log(`✅ Course Management: Enhanced`);
    console.log(`✅ Progress Tracking: Advanced`);
    
    if (pythonHealth.success) {
      console.log(`✅ Python AI Service: Running`);
      console.log(`✅ Text Extraction: ${pythonHealth.features.textExtraction ? 'Ready' : 'Limited'}`);
      console.log(`✅ Course Generation: ${pythonHealth.features.courseGeneration ? 'Ready' : 'Limited'}`);
      console.log(`✅ Gemini AI: ${pythonHealth.features.geminiAI ? 'Connected' : 'Check API Key'}`);
    } else {
      console.log(`❌ Python AI Service: Not available`);
      console.log(`⚠️ Course generation will use enhanced fallback mode`);
    }
    
    console.log(`✅ Weak Topics Detection: Enabled`);
    console.log(`✅ Learning Analytics: Active`);
    console.log(`==============================================\n`);
  });
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔻 Shutting down server gracefully...');
  
  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (err) {
    console.log('⚠️ Error closing MongoDB connection:', err.message);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔻 Server terminated gracefully...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (err) {
    console.log('⚠️ Error closing MongoDB connection:', err.message);
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});