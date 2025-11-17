require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Firebase admin
const admin = require("./config/firebase-admin");

// Middleware
const verifyToken = require("./middleware/auth-middleware");

// Routes
const authRoutes = require("./routes/auth-routes");
const userRoutes = require("./routes/user-routes");
const friendRoutes = require('./routes/friend-routes');
const courseRoutes = require('./routes/course-routes');
const uploadRoutes = require('./routes/upload-routes');
const progressRoutes = require('./routes/progress-routes');
const analyticsRoutes = require('./routes/analytics-routes');
const classroomRoutes = require('./routes/classroom-routes'); // NEW
const weakTopicsRoutes = require('./routes/weaktopics-routes'); // NEW
const tutorRoutes = require('./routes/tutor-routes'); // NEW

// Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------
// 🔹 GLOBAL MIDDLEWARE
// ---------------------------------------------------------------------
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging every request
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl}`);
  next();
});

// ---------------------------------------------------------------------
// 🔹 CHROMADB STATUS CHECK (OPTIONAL - ONLY IF AVAILABLE)
// ---------------------------------------------------------------------
let chromaDBStatus = { connected: false, status: "❌ ChromaDB Not Available" };

async function initializeChromaDB() {
  try {
    const { ChromaClient } = require('chromadb');
    const client = new ChromaClient({ path: "http://localhost:8000" });
    await client.heartbeat();
    chromaDBStatus = { connected: true, status: "✅ ChromaDB Running" };
    console.log("🔗 ChromaDB initialized successfully");
    return true;
  } catch (error) {
    console.log("⚠️  ChromaDB not available:", error.message);
    chromaDBStatus = { connected: false, status: "❌ ChromaDB Not Available", error: error.message };
    return false;
  }
}

// ---------------------------------------------------------------------
// 🔹 ROUTE SETUP - CLASSROOM ROUTES ADDED
// ---------------------------------------------------------------------

// Enhanced Health check
app.get("/api/health", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  const aiStatus = process.env.GEMINI_API_KEY ? "Ready" : "Not Configured";

  res.json({
    message: "🚀 EduAI Backend - Active",
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      database: dbStatus,
      ai: aiStatus,
      chroma_db: chromaDBStatus.status,
      classroom: "✅ Active" // NEW
    }
  });
});

// ChromaDB status check endpoint
app.get("/api/chroma-status", async (req, res) => {
  res.json(chromaDBStatus);
});

// ✅ PUBLIC ROUTES (NO AUTH REQUIRED)
app.get("/api/courses/public", async (req, res) => {
  try {
    const Course = require("./models/Course");
    const publicCourses = await Course.find({
      isPublic: true,
      generationStatus: "completed",
      isGenerating: false
    })
      .select("title description modules settings createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, courses: publicCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/courses/public/:courseId", async (req, res) => {
  try {
    const Course = require("./models/Course");
    const course = await Course.findOne({
      _id: req.params.courseId,
      isPublic: true,
      generationStatus: "completed"
    }).select("-createdBy -generationStatus -isGenerating -originalFile");

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found or not public" });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUBLIC USER PROFILE
app.get("/api/users/public/:userId", async (req, res) => {
  try {
    const User = require("./models/User");
    const user = await User.findOne({ uid: req.params.userId }).select(
      "displayName photoURL bio createdAt publicStats"
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ PROTECTED ROUTES (AUTH REQUIRED) - CLASSROOM ROUTES ADDED
app.use("/api/auth", verifyToken, authRoutes);
app.use("/api/users", verifyToken, userRoutes);
app.use("/api/friends", verifyToken, friendRoutes);
app.use("/api/courses", verifyToken, courseRoutes);
app.use("/api/upload", verifyToken, uploadRoutes);
app.use("/api/progress", verifyToken, progressRoutes);
app.use("/api/analytics", verifyToken, analyticsRoutes);
app.use("/api/classroom", verifyToken, classroomRoutes); // NEW
app.use("/api/weaktopics", verifyToken, weakTopicsRoutes); // NEW
app.use("/api/tutor", verifyToken, tutorRoutes); // NEW

// ---------------------------------------------------------------------
// 🔥 404 HANDLER FOR API ROUTES ONLY
// ---------------------------------------------------------------------
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// ---------------------------------------------------------------------
// 🔹 DATABASE CONNECTION
// ---------------------------------------------------------------------
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/eduai-platform"
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

// ---------------------------------------------------------------------
// 🔹 START SERVER
// ---------------------------------------------------------------------
const startServer = async () => {
  try {
    await connectDB();

    // Try to initialize ChromaDB (optional)
    try {
      await initializeChromaDB();
    } catch (error) {
      console.log("⚠️  Continuing without ChromaDB...");
    }

    app.listen(PORT, () => {
      console.log(`\n🎉 ==========================================`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
      console.log(`📚 ACTIVE ROUTES:`);
      console.log(`   ✅ Auth: /api/auth/*`);
      console.log(`   ✅ Users: /api/users/*`);
      console.log(`   ✅ Courses: /api/courses/*`);
      console.log(`   ✅ Classroom: /api/classroom/*`); // NEW
      console.log(`   🗄️  ChromaDB: ${chromaDBStatus.connected ? '✅ Connected' : '❌ Not Available'}`);
      console.log(`   🔒 All routes require authentication`);
      console.log(`==========================================\n`);
      
      if (!chromaDBStatus.connected) {
        console.log(`💡 To enable ChromaDB:`);
        console.log(`   1. Run: npm install chromadb@1.8.0 --legacy-peer-deps`);
        console.log(`   2. Start ChromaDB: chroma run --path ./chroma-data`);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();