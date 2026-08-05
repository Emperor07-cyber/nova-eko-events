import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA0j7AWq6NxvlCrfU_A5-M_7nAcilMJj6o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "novaekoevents.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://novaekoevents-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "novaekoevents",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "novaekoevents.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "955833805272",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:955833805272:web:50fb063a01813a26f06aad",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MQSXRWSX55",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export { app };
