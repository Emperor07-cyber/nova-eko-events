// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0j7AWq6NxvlCrfU_A5-M_7nAcilMJj6o",
  authDomain: "novaekoevents.firebaseapp.com",
  projectId: "novaekoevents",
  storageBucket: "novaekoevents.firebasestorage.app",
  messagingSenderId: "955833805272",
  appId: "1:955833805272:web:50fb063a01813a26f06aad",
  measurementId: "G-MQSXRWSX55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const database = getDatabase(app);
