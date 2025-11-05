import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../utils/firebase";
import { AuthContext } from "../../contexts/AuthContext";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setError("⚠️ Please verify your email first!");
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden px-4">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full mix-blend-overlay opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mix-blend-overlay opacity-30 animate-blob animation-delay-2000"></div>

      <div className="relative max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-center mb-6 text-white animate-fadeInUp">
          Login to EduAI
        </h2>

        {error && (
          <div className="bg-red-700 bg-opacity-30 text-red-100 p-2 rounded mb-4 animate-fadeInUp">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-600 to-blue-500 hover:from-blue-500 hover:to-purple-600 shadow-lg transform hover:scale-105 transition"
          >
            Login
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 py-2 rounded-lg flex justify-center items-center gap-2 text-white font-semibold bg-red-500 hover:bg-red-600 shadow-lg transform hover:scale-105 transition"
        >
          <img src="/assets/icons/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>

        <div className="mt-4 flex justify-between text-sm text-gray-300">
          <Link to="/forgot-password" className="text-purple-400 hover:underline">
            Forgot Password?
          </Link>
          <Link to="/register" className="text-purple-400 hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
