import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in function
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout function
  function logout() {
    return signOut(auth);
  }

  // Change Password (for employees on first login, or owner anytime)
  async function changePassword(newPassword) {
    if (!auth.currentUser) throw new Error("No authenticated user");
    
    // 1. Update in Firebase Auth
    await updatePassword(auth.currentUser, newPassword);

    // 2. Set mustChangePassword to false in Firestore
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userDocRef, {
      mustChangePassword: false
    });

    // 3. Update local user state
    setCurrentUser((prev) => ({
      ...prev,
      mustChangePassword: false
    }));
  }

  // Reset password via email (for Owner)
  function sendOwnerPasswordReset(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch additional user info (role, mustChangePassword) from Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userData
            });
          } else {
            console.error("No Firestore document found for user UID:", user.uid);
            // Default role if not found (fallback)
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              role: "employee",
              mustChangePassword: false
            });
          }
        } catch (error) {
          console.error("Error fetching user role details:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    changePassword,
    sendOwnerPasswordReset,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
