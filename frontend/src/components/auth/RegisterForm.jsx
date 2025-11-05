import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { auth } from "../../utils/firebase";

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setSuccess("✅ Verification email sent! Check inbox or spam.");

      setEmail("");
      setPassword("");
      setConfirmPassword("");

      navigate("/dashboard", { state: { emailNotVerified: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden px-4">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full mix-blend-overlay opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mix-blend-overlay opacity-30 animate-blob animation-delay-2000"></div>

      <div className="relative max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
        <h2 className="text-3xl font-bold mb-6 text-center text-white animate-fadeInUp">
          Create Account
        </h2>

        {error && (
          <div className="bg-red-700 bg-opacity-30 text-red-100 p-2 rounded mb-4 animate-fadeInUp">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-700 bg-opacity-30 text-green-100 p-2 rounded mb-4 animate-fadeInUp">
            {success}
          </div>
        )}

        <form onSubmit={handleEmailSignup} className="space-y-4">
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
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
              isLoading
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-blue-500 hover:to-purple-600 shadow-lg transform hover:scale-105"
            }`}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="my-4 text-center text-gray-300">or</div>

        <button
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className={`w-full py-2 rounded-lg flex justify-center items-center gap-2 text-white font-semibold transition-all ${
            isLoading
              ? "bg-red-300 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 shadow-lg transform hover:scale-105"
          }`}
        >
          <img src="/assets/icons/google.svg" alt="Google" className="w-5 h-5" />
          Sign up with Google
        </button>

        <p className="mt-4 text-center text-gray-300 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
