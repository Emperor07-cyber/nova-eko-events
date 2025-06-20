// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA0j7AWq6NxvlCrfU_A5-M_7nAcilMJj6o",
  authDomain: "novaekoevents.firebaseapp.com",
  databaseURL: "https://novaekoevents-default-rtdb.firebaseio.com",
  projectId: "novaekoevents",
  storageBucket: "novaekoevents.firebasestorage.app",
  messagingSenderId: "955833805272",
  appId: "1:955833805272:web:50fb063a01813a26f06aad",
  measurementId: "G-MQSXRWSX55"
};
// Initialize Firebase

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app); // This gives us the realtime DB

export { app, auth, database };
