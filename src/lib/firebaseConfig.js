import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAKBxZmyhCW_HBME7zxv39zRzPq6Py5x_E",
  authDomain: "surat-b6804.firebaseapp.com",
  projectId: "surat-b6804",
  storageBucket: "surat-b6804.firebasestorage.app",
  messagingSenderId: "298775800266",
  appId: "1:298775800266:web:a4f61d32d2c705a13ac733",
  measurementId: "G-DQKLCF6DZZ"
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, signInWithPopup, provider };
