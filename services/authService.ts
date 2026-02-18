import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebaseService';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const authService = {
  signInWithGoogle: () => signInWithPopup(auth, googleProvider),

  signInWithEmail: (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password),

  signOut: () => signOut(auth),

  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) =>
    onAuthStateChanged(auth, callback),

  getCurrentUser: (): FirebaseUser | null => auth.currentUser,
};
