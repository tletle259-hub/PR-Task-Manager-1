
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLogIn, FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { User } from '../types';
import { loginWithUsernamePassword } from '../services/authService';

interface RequesterLoginProps {
  onLoginSuccess: (user: User) => void;
  onMicrosoftLogin: () => void;
  onNavigateToRegister: () => void;
}

const RequesterLoginForm: React.FC<RequesterLoginProps> = ({ onLoginSuccess, onMicrosoftLogin, onNavigateToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    try {
      // เรียกใช้ฟังก์ชัน Login แบบ Custom (Username/Password)
      const userProfile = await loginWithUsernamePassword(username.trim(), password.trim());
      if (userProfile) {
        onLoginSuccess(userProfile);
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const msg = err.message || '';
      
      // ดักจับ Error เรื่อง Permission เพื่อแนะนำผู้ใช้ให้แก้ Database Rules
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
         setError('Permission Denied! ฐานข้อมูลถูกล็อคอยู่\nกรุณาไปที่ Firebase Console > Rules\nเช็คว่ามี allow read, write: if true; \nและอย่าลืมกดปุ่ม "Publish" (เผยแพร่) ที่มุมขวาบน!');
      } else {
         setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="w-full max-w-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-700 rounded-2xl shadow-lg p-8"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">สำหรับผู้สั่งงาน</h2>
        <p className="text-gray-500 dark:text-gray-400">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
      </div>

      {/* แบบฟอร์ม Username/Password */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-secondary focus:outline-none"
            placeholder="Username"
            required
          />
        </div>
        <div className="relative">
          <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-secondary focus:outline-none"
            placeholder="รหัสผ่าน"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center bg-red-100 dark:bg-red-900/30 p-2 rounded whitespace-pre-line">{error}</p>}

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full bg-brand-secondary text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          <FiLogIn />
          {isVerifying ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      
      {/* ตัวเลือก Login อื่นๆ */}
      <div className="flex items-center my-4">
        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
        <span className="mx-4 text-gray-500 dark:text-gray-400 text-sm">หรือ</span>
        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
      </div>

      <button
        onClick={onMicrosoftLogin}
        className="w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
      >
        <img src="https://img.icons8.com/color/16/000000/microsoft.png" alt="Microsoft logo" />
        เข้าสู่ระบบด้วย Microsoft
      </button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        ยังไม่มีบัญชี?{' '}
        <button onClick={onNavigateToRegister} className="font-semibold text-brand-secondary hover:underline">
          ลงทะเบียนที่นี่
        </button>
      </p>
    </motion.div>
  );
};

export default RequesterLoginForm;
