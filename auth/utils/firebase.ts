import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const isDev = import.meta.env.DEV;

// Safe public fallback config for local development so the app runs out of the box
const fallbackConfig = {
  apiKey: 'AIzaSyApqsLcTdAFphSm5SphRY0QPdKpmeLxsus',
  authDomain: 'uni-manager-434801.firebaseapp.com',
  projectId: 'uni-manager-434801',
  storageBucket: 'uni-manager-434801.firebasestorage.app',
  messagingSenderId: '406551904662',
  appId: '1:406551904662:web:196388b7497826de239db7'
};

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    (isDev ? fallbackConfig.apiKey : 'MISSING_API_KEY'),
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    (isDev ? fallbackConfig.authDomain : 'MISSING_AUTH_DOMAIN'),
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    (isDev ? fallbackConfig.projectId : 'MISSING_PROJECT_ID'),
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    (isDev ? fallbackConfig.storageBucket : ''),
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    (isDev ? fallbackConfig.messagingSenderId : ''),
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || (isDev ? fallbackConfig.appId : '')
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider, signInWithPopup };
