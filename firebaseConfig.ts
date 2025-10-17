import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA8qWbPzDF3MC7ETKMAs8w-1Wycg3EwaA4",
  authDomain: "pr-taskmanager.firebaseapp.com",
  projectId: "pr-taskmanager",
  storageBucket: "pr-taskmanager.firebasestorage.app",
  messagingSenderId: "318611610697",
  appId: "1:318611610697:web:0532ec7865e8f02855b398",
  measurementId: "G-TRFHW3C1DR"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
