import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase } from "firebase/database";

const sharedHanziHeroConfig = {
  apiKey: "AIzaSyD5GTLSvUwNP64SRL9cYRwE0vZCUmi9VVM",
  authDomain: "hanzi-7ff3a.firebaseapp.com",
  databaseURL:
    "https://hanzi-7ff3a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hanzi-7ff3a",
  messagingSenderId: "1022443889912",
  appId: "1:1022443889912:web:adc6196bb0ea94544f870d",
  measurementId: "G-TBP0MSB1T3"
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || sharedHanziHeroConfig.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || sharedHanziHeroConfig.authDomain,
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL || sharedHanziHeroConfig.databaseURL,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || sharedHanziHeroConfig.projectId,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    sharedHanziHeroConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || sharedHanziHeroConfig.appId,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    sharedHanziHeroConfig.measurementId
};

const requiredKeys = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.databaseURL,
  firebaseConfig.projectId,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId
];

export const isFirebaseConfigured = requiredKeys.every(Boolean);

const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = firebaseApp ? getDatabase(firebaseApp) : null;
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
