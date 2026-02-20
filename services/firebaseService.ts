import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Firebase configuration restored to reliable hardcoded values.
 * This resolves issues with unauthorized domains or missing environment variables.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCZig10cQuufE5KsQnzPgaNHwcJAkmpzuc",
  authDomain: "crystal-clawz-studio.firebaseapp.com",
  projectId: "crystal-clawz-studio",
  storageBucket: "crystal-clawz-studio.firebasestorage.app",
  messagingSenderId: "858460510206",
  appId: "1:858460510206:web:e084a72fa748762121d2af"
};

// Singleton initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Initiates Google Sign-In with a popup.
 * Note: If you get auth/unauthorized-domain, add the current preview URL to the 
 * "Authorized domains" list in the Firebase Console (Authentication > Settings).
 */
export const loginWithGoogle = () => {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, googleProvider);
};

export const logout = () => signOut(auth);

export const uploadFileToStorage = (file: File, folder: string = 'uploads'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.debug(`Upload is ${Math.round(progress)}% done`);
      },
      (error) => {
        console.error('Firebase storage upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};
