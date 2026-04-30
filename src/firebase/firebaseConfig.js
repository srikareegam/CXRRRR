// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDzOSqADe1xiN1Tvb7EM4cM-iRSbTo6_rI",
  authDomain: "cxr-site-2026.firebaseapp.com",
  projectId: "cxr-site-2026",
  storageBucket: "cxr-site-2026.firebasestorage.app",
  messagingSenderId: "1053317956641",
  appId: "1:1053317956641:web:ab75d210b99364448acf60",
  measurementId: "G-51X8QRF9ZB"
};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
import { GoogleAuthProvider } from "firebase/auth";
export const googleProvider = new GoogleAuthProvider();