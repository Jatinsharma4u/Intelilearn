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

  /* ---------------------------------------------------
      LISTEN TO AUTH CHANGES (Login, Logout, Refresh)
  --------------------------------------------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const token = await currentUser.getIdToken();

        // ⭐ ALWAYS save token + uid + email
        localStorage.setItem("authToken", token);
        localStorage.setItem(
          "firebaseUser",
          JSON.stringify({
            uid: currentUser.uid,
            token,
            email: currentUser.email
          })
        );
      } else {
        // On logout clear storage
        localStorage.removeItem("authToken");
        localStorage.removeItem("firebaseUser");
      }

      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ---------------------------------------------------
      REGISTER
  --------------------------------------------------- */
  const register = async (email, password) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const token = await res.user.getIdToken();

    localStorage.setItem("authToken", token);
    localStorage.setItem(
      "firebaseUser",
      JSON.stringify({
        uid: res.user.uid,
        token,
        email: res.user.email
      })
    );

    await sendEmailVerification(res.user);
    return res.user;
  };

  /* ---------------------------------------------------
      LOGIN
  --------------------------------------------------- */
  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const token = await res.user.getIdToken();

    localStorage.setItem("authToken", token);
    localStorage.setItem(
      "firebaseUser",
      JSON.stringify({
        uid: res.user.uid,
        token,
        email: res.user.email
      })
    );

    return res.user;
  };

  /* ---------------------------------------------------
      GOOGLE SIGN IN
  --------------------------------------------------- */
  const googleSignIn = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const token = await res.user.getIdToken();

    localStorage.setItem("authToken", token);
    localStorage.setItem(
      "firebaseUser",
      JSON.stringify({
        uid: res.user.uid,
        token,
        email: res.user.email
      })
    );

    return res.user;
  };

  /* ---------------------------------------------------
      LOGOUT
  --------------------------------------------------- */
  const logout = async () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("firebaseUser");
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, googleSignIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => useContext(AuthContext);
