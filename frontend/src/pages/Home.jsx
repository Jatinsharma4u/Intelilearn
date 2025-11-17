import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  Brain, 
  Trophy, 
  Upload, 
  ArrowRight,
  TrendingUp,
  Target,
  Clock,
  Sparkles,
  Moon,
  Sun,
  Play,
  Zap,
  BookOpen,
  Users
} from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = React.useState(false);

  const features = [
    {
      icon: <Upload className="h-8 w-8" />,
      title: "AI Notes to Smart Pack",
      description: "Upload your notes and get AI-generated summaries, flashcards, and quizzes instantly.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Trophy className="h-8 w-8" />,
      title: "Study Room Battles",
      description: "Compete with friends in live quiz battles and climb the leaderboards.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Study Mentor",
      description: "Get personalized learning paths and step-by-step guidance from AI.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Weakness Detector",
      description: "Identify your weak topics and get targeted practice to improve.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Smart Progress Tracking",
      description: "Real-time analytics and insights into your learning journey.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Adaptive Learning",
      description: "AI that adapts to your pace and learning style automatically.",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-purple-900 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900'
    }`}>
      
      {/* Navigation */}
      <nav className={`backdrop-blur-lg sticky top-0 z-50 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900/80 border-b border-gray-700' : 'bg-white/80 border-b border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 p-2 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IntelliLearn
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              {user ? (
                <Link
                  to="/dashboard"
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                >
                  <span className="relative z-10 flex items-center">
                    Dashboard <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      darkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                  >
                    <span className="relative z-10 flex items-center">
                      Get Started <Sparkles className="ml-2 h-4 w-4" />
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Learning Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Learn Smarter,
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Not Harder
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed opacity-90">
            Transform your study sessions with AI-generated content, competitive battles, and personalized mentorship that adapts to your learning style.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            {user ? (
              <Link
                to="/dashboard"
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
              >
                <span className="relative z-10 flex items-center">
                  Continue Learning <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
                >
                  <span className="relative z-10 flex items-center">
                    Start Free Trial <Sparkles className="ml-2 h-5 w-5" />
                  </span>
                </Link>
                <Link
                  to="/login"
                  className={`group px-8 py-4 rounded-2xl text-lg font-semibold border-2 transition-all duration-300 hover:scale-105 ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center">
                    Watch Demo <Play className="ml-2 h-5 w-5" />
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Preview */}
          <div className={`max-w-4xl mx-auto p-8 rounded-3xl backdrop-blur-sm border-2 ${
            darkMode
              ? 'bg-gray-800/30 border-gray-700'
              : 'bg-white/50 border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Instant AI Processing</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Upload notes and get smart study materials in seconds
                </p>
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Personalized Learning</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  AI that adapts to your unique learning style and pace
                </p>
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Collaborative Features</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Study with friends and compete in learning challenges
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Powerful Learning{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Features
              </span>
            </h2>
            <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Everything you need to transform your study routine and achieve academic excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`group relative p-8 rounded-3xl backdrop-blur-sm border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    : 'bg-white/50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                  {feature.title}
                </h3>
                
                <p className={`leading-relaxed ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
                
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`rounded-3xl p-12 backdrop-blur-sm border-2 ${
            darkMode
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/50 border-gray-200'
          }`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Learning Journey?
              </span>
            </h2>
            <p className={`text-xl mb-8 max-w-2xl mx-auto ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Join the future of education with AI-powered learning tools designed for success.
            </p>
            <Link
              to={user ? "/dashboard" : "/register"}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
            >
              <span>{user ? "Continue Learning" : "Start Learning Free"}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 border-t ${
        darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-2 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              IntelliLearn
            </span>
          </div>
          <p className={`max-w-md mx-auto mb-6 leading-relaxed ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Empowering students with AI-driven learning tools and personalized educational experiences.
          </p>
          <div className={`border-t pt-8 ${
            darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'
          }`}>
            <p>© 2024 IntelliLearn. All rights reserved. Built with ❤️ for the future of education.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;