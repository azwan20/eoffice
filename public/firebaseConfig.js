import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKBxZmyhCW_HBME7zxv39zRzPq6Py5x_E",
  authDomain: "surat-b6804.firebaseapp.com",
  projectId: "surat-b6804",
  storageBucket: "surat-b6804.firebasestorage.app",
  messagingSenderId: "298775800266",
  appId: "1:298775800266:web:a4f61d32d2c705a13ac733",
  measurementId: "G-DQKLCF6DZZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const storage = getStorage(app);

const db = getFirestore(app);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, signInWithPopup, provider };