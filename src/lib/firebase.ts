import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const requiredKeys = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId
];

export const isFirebaseConfigured = requiredKeys.every(Boolean);

const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;

let firebaseReadyPromise: Promise<boolean> | null = null;

export function ensureFirebaseReady(): Promise<boolean> {
  if (!isFirebaseConfigured || !auth) {
    return Promise.resolve(false);
  }

  if (!firebaseReadyPromise) {
    firebaseReadyPromise = (async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        return true;
      } catch (error) {
        console.error("Firebase anonymous auth failed", error);
        return false;
      }
    })();
  }

  return firebaseReadyPromise;
}
