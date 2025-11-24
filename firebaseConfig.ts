
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// เริ่มต้นการทำงานของ Firebase App
const app = initializeApp(firebaseConfig);

// Export ตัวจัดการ Database (Firestore) และระบบยืนยันตัวตน (Auth) ไปใช้ในไฟล์อื่น
export const db = getFirestore(app);
export const auth = getAuth(app);
