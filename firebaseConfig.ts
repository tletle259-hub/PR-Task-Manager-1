
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

// --- FIREBASE CONFIGURATION ---
// ค่าตั้งค่าสำหรับการเชื่อมต่อกับโปรเจกต์ Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA8qWbPzDF3MC7ETKMAs8w-1Wycg3EwaA4", // คีย์ API
  authDomain: "pr-taskmanager.firebaseapp.com",      // โดเมนสำหรับ Auth
  projectId: "pr-taskmanager",                       // ID โปรเจกต์
  storageBucket: "pr-taskmanager.firebasestorage.app", // ที่เก็บไฟล์ (ถ้าใช้ Storage)
  messagingSenderId: "318611610697",                 // ID สำหรับส่งข้อความ
  appId: "1:318611610697:web:0532ec7865e8f02855b398", // App ID
  measurementId: "G-TRFHW3C1DR"                      // ID สำหรับ Analytics
};

// เริ่มต้นการทำงานของ Firebase App (Compat)
// Check if apps are already initialized to prevent errors in hot-reload
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Export ตัวจัดการ Database (Firestore) และระบบยืนยันตัวตน (Auth) ไปใช้ในไฟล์อื่น
export const db = firebase.firestore();
export const auth = firebase.auth();
