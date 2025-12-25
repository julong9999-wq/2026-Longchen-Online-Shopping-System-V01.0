import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxznkT-mRzY-RmddsaTsCS0LvvN-_-Me8",
  authDomain: "julong-chen-system-v01.firebaseapp.com",
  projectId: "julong-chen-system-v01",
  storageBucket: "julong-chen-system-v01.firebasestorage.app",
  messagingSenderId: "516975682108",
  appId: "1:516975682108:web:dce3784ac66666e4e25939",
  measurementId: "G-X13S0ZTD81"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
