import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAuthReady: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthReady(true);
        
        // Use onSnapshot for faster, real-time profile updates
        if (profileUnsubscribe) profileUnsubscribe();
        
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data();
            setProfile(profileData);
            // Cache profile for even faster subsequent loads (optional but helpful)
            localStorage.setItem(`profile_${firebaseUser.uid}`, JSON.stringify(profileData));
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Error syncing user profile:", err);
          setError("Failed to sync user profile.");
          setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthReady(true);
        setLoading(false);
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, error }}>
      {children}
    </AuthContext.Provider>
  );
};
