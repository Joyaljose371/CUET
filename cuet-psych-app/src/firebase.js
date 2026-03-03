import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // THIS IS REQUIRED

const firebaseConfig = {
  apiKey: "AIzaSyB2W54dGDIEseyQB3PZhUaK0czGVIylwhI",
  authDomain: "cuet-psych.firebaseapp.com",
  projectId: "cuet-psych",
  storageBucket: "cuet-psych.firebasestorage.app",
  messagingSenderId: "1081489054828",
  appId: "1:1081489054828:web:6a0c22cb10e95bae0e8c49",
  measurementId: "G-YP0LJQRP4Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the database instance
export const db = getFirestore(app);