// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { auth, googleProvider } from "../utils/firebase";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // ✅ Get and store the Firebase ID token
        const token = await currentUser.getIdToken();
        localStorage.setItem('authToken', token);
      } else {
        // ✅ Remove token on logout
        localStorage.removeItem('authToken');
      }
      
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = async (email, password) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    
    // ✅ Get and store token after registration
    const token = await res.user.getIdToken();
    localStorage.setItem('authToken', token);
    
    await sendEmailVerification(res.user);
    return res.user;
  };

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    
    // ✅ Get and store token after login
    const token = await res.user.getIdToken();
    localStorage.setItem('authToken', token);
    
    return res.user;
  };

  const googleSignIn = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    
    // ✅ Get and store token after Google sign in
    const token = await res.user.getIdToken();
    localStorage.setItem('authToken', token);
    
    return res.user;
  };

  const logout = async () => {
    // ✅ Remove token before signing out
    localStorage.removeItem('authToken');
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, googleSignIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook for easy usage
export const useAuth = () => {
  return useContext(AuthContext);
};