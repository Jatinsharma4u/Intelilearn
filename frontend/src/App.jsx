// src/App.jsx - UPDATED CLASSROOM ROUTES
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { ProfileProvider } from "./contexts/ProfileContext.jsx";
import { ProgressProvider } from "./contexts/ProgressContext.jsx";
import { FriendProvider } from "./contexts/FriendContext.jsx";
import { CourseProvider } from "./contexts/CourseContext.jsx";
import { ChatProvider } from "./contexts/ChatContext.jsx";
import { ClassroomProvider } from "./contexts/ClassroomContext.jsx";
import LoginForm from "./components/auth/LoginForm.jsx";
import RegisterForm from "./components/auth/RegisterForm.jsx";
import ForgotPassword from "./components/auth/ForgotPassword.jsx";
import EmailVerification from "./components/auth/EmailVerification.jsx";
import AuthGuard from "./components/auth/AuthGuard.jsx";
import ProfileGuard from "./components/profile/ProfileGuard.jsx";
import Home from "./pages/Home.jsx";
import DashboardPage from "./pages/Dashboard.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import CoursePlayer from "./pages/CoursePlayer.jsx";
import CreateCourse from "./pages/CreateCourse.jsx";
import Friends from "./pages/Friends.jsx";
import Chat from "./pages/Chat.jsx";
import Notifications from "./pages/Notifications.jsx";
import Profile from "./pages/Profile.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import Settings from "./pages/Settings.jsx";

// Classroom Pages
import ClassroomHome from "./pages/Classroom/ClassroomHome.jsx";
import ClassroomDetail from "./pages/Classroom/ClassroomDetail.jsx";
import QuizCreator from "./pages/Classroom/QuizCreator.jsx";
import ExamPage from "./pages/Classroom/ExamPage.jsx";
import ExamResults from "./components/classroom/ExamResults.jsx";
import QuizAnalytics from "./components/classroom/QuizAnalytics.jsx";

// Create a component to handle root path redirect
const RootRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user ? "/dashboard" : "/home"} replace />;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <ProfileGuard>
                <DashboardPage />
              </ProfileGuard>
            </AuthGuard>
          }
        />
        
        {/* Course Routes */}
        <Route
          path="/courses"
          element={
            <AuthGuard>
              <ProfileGuard>
                <CourseProvider>
                  <Courses />
                </CourseProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/courses/create"
          element={
            <AuthGuard>
              <ProfileGuard>
                <CourseProvider>
                  <CreateCourse />
                </CourseProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/courses/:courseId"
          element={
            <AuthGuard>
              <ProfileGuard>
                <CourseProvider>
                  <CourseDetail />
                </CourseProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        
        {/* Course Learning Routes */}
        <Route
          path="/courses/:courseId/learn/:moduleIndex/:lessonIndex"
          element={
            <AuthGuard>
              <ProfileGuard>
                <CourseProvider>
                  <CoursePlayer />
                </CourseProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        
        {/* Separate routes for different learning modes */}
        <Route
          path="/courses/:courseId/learn/:moduleIndex/:lessonIndex/quiz"
          element={
            <AuthGuard>
              <ProfileGuard>
                <CourseProvider>
                  <CoursePlayer />
                </CourseProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/courses/:courseId/learn/:moduleIndex/:lessonIndex/flashcards"
          element={
            <AuthGuard>
              <ProfileGuard>
                <CourseProvider>
                  <CoursePlayer />
                </CourseProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/courses/:courseId/learn/:moduleIndex/:lessonIndex/content"
          element={
            <AuthGuard>
              <ProfileGuard>
                <CourseProvider>
                  <CoursePlayer />
                </CourseProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />

        {/* ========== UPDATED CLASSROOM ROUTES ========== */}
        <Route
          path="/classroom"
          element={
            <AuthGuard>
              <ProfileGuard>
                <ClassroomProvider>
                  <ClassroomHome />
                </ClassroomProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/classroom/:classroomId"
          element={
            <AuthGuard>
              <ProfileGuard>
                <ClassroomProvider>
                  <ClassroomDetail />
                </ClassroomProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        {/* FIXED: Match the navigation path from ClassroomDetail */}
        <Route
          path="/classroom/:classroomId/quiz/create"
          element={
            <AuthGuard>
              <ProfileGuard>
                <ClassroomProvider>
                  <QuizCreator />
                </ClassroomProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/exam/:quizId"
          element={
            <AuthGuard>
              <ProfileGuard>
                <ClassroomProvider>
                  <ExamPage />
                </ClassroomProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/exam/results/:sessionId"
          element={
            <AuthGuard>
              <ProfileGuard>
                <ClassroomProvider>
                  <ExamResults />
                </ClassroomProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/quiz/:quizId/analytics"
          element={
            <AuthGuard>
              <ProfileGuard>
                <ClassroomProvider>
                  <QuizAnalytics />
                </ClassroomProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />

        {/* Other Routes */}
        <Route
          path="/friends"
          element={
            <AuthGuard>
              <ProfileGuard>
                <FriendProvider>
                  <Friends />
                </FriendProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/chat"
          element={
            <AuthGuard>
              <ProfileGuard>
                <ChatProvider>
                  <Chat />
                </ChatProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/notifications"
          element={
            <AuthGuard>
              <ProfileGuard>
                <Notifications />
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <ProfileGuard>
                <Profile />
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <AuthGuard>
              <ProfileGuard>
                <FriendProvider>
                  <PublicProfile />
                </FriendProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <ProfileGuard>
                <Settings />
              </ProfileGuard>
            </AuthGuard>
          }
        />

        {/* Wildcard route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ProgressProvider>
          <FriendProvider>
            <CourseProvider>
              <ChatProvider>
                <ClassroomProvider>
                  <AppRoutes />
                </ClassroomProvider>
              </ChatProvider>
            </CourseProvider>
          </FriendProvider>
        </ProgressProvider>
      </ProfileProvider>
    </AuthProvider>
  );
};

export default App;