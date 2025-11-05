const admin = require("../config/firebase-admin");

const verifyToken = async (req, res, next) => {
  try {
    console.log("🔐 Auth Middleware - Verifying token");
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No token provided");
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    console.log("📋 Token received:", token.substring(0, 20) + "...");

    // Firebase token verification
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("✅ Token verified for user:", decodedToken.uid);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    res.status(401).json({ error: "Invalid token." });
  }
};

module.exports = verifyToken;