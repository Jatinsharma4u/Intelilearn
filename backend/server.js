require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Firebase admin
const admin = require("./config/firebase-admin");

// Middleware & routes
const verifyToken = require("./middleware/auth-middleware");
const authRoutes = require("./routes/auth-routes");
const userRoutes = require("./routes/user-routes");
const progressRoutes = require("./routes/progress-routes");
const friendRoutes = require('./routes/friend-routes');

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

// 🔹 Public route (health check)
app.get("/api/health", (req, res) => {
  res.json({
    message: "🚀 EduAI Backend is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// 🔹 Protected routes (require auth)
app.use("/api/auth", verifyToken, authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/progress', verifyToken, progressRoutes);
app.use('/api/friends', verifyToken, friendRoutes);

// 🔹 MongoDB connection (Remove deprecated options)
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

// 🔹 Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 Frontend: http://localhost:3000`);
  });
};

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
});