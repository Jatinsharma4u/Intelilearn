import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { ProfileProvider } from "./contexts/ProfileContext.jsx";
import { ProgressProvider } from "./contexts/ProgressContext.jsx";
import { FriendProvider } from "./contexts/FriendContext.jsx";
import { CourseProvider } from "./contexts/CourseContext.jsx"; // NEW
import LoginForm from "./components/auth/LoginForm.jsx";
import RegisterForm from "./components/auth/RegisterForm.jsx";
import ForgotPassword from "./components/auth/ForgotPassword.jsx";
import EmailVerification from "./components/auth/EmailVerification.jsx";
import AuthGuard from "./components/auth/AuthGuard.jsx";
import ProfileGuard from "./components/profile/ProfileGuard.jsx";
import Home from "./pages/Home.jsx";
import DashboardPage from "./pages/Dashboard.jsx";
import Friends from "./pages/Friends.jsx";
import Chat from "./pages/Chat.jsx";
import Notifications from "./pages/Notifications.jsx";
import Profile from "./pages/Profile.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import Settings from "./pages/Settings.jsx";
import CourseDashboard from "./pages/CourseDashboard.jsx"; // NEW
import CourseCreation from "./pages/CourseCreation.jsx"; // NEW
import CoursePlayer from "./pages/CoursePlayer.jsx"; // NEW

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
                <Chat />
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

        {/* NEW Course Routes */}
        <Route
          path="/courses"
          element={
            <AuthGuard>
              <ProfileGuard>
                <CourseProvider>
                  <CourseDashboard />
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
                  <CourseCreation />
                </CourseProvider>
              </ProfileGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/courses/learn/:courseId"
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
          <CourseProvider> {/* NEW - Wrap entire app with CourseProvider */}
            <AppRoutes />
          </CourseProvider>
        </ProgressProvider>
      </ProfileProvider>
    </AuthProvider>
  );
};

export default App;