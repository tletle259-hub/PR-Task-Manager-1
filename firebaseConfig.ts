import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ==========================================================================================
// TODO: REPLACE WITH YOUR FIREBASE PROJECT CONFIGURATION
// 1. Go to your Firebase project settings.
// 2. In the "General" tab, scroll down to "Your apps".
// 3. Click the "Web" app icon (</>).
// 4. Under "Firebase SDK snippet", select the "Config" option.
// 5. Copy the firebaseConfig object and paste it here.
// ==========================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyA8qWbPzDF3MC7ETKMAs8w-1Wycg3EwaA4",
  authDomain: "pr-taskmanager.firebaseapp.com",
  projectId: "pr-taskmanager",
  storageBucket: "pr-taskmanager.firebasestorage.app",
  messagingSenderId: "318611610697",
  appId: "1:318611610697:web:0532ec7865e8f02855b398",
  measurementId: "G-TRFHW3C1DR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// IMPORTANT: For production, you MUST configure Firestore Security Rules
// to prevent unauthorized access to your data.
// Start with test rules, but secure your data before going live.
// Go to Firestore Database > Rules in the Firebase console.
