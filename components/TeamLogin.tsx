import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLogIn, FiUser, FiLock, FiEye, FiEyeOff, FiChevronLeft, FiSun, FiMoon } from 'react-icons/fi';
import { TeamMember } from '../types';
import { loginWithSecureId } from '../services/authService';

interface TeamLoginProps {
  onLoginSuccess: (user: TeamMember) => void;
  onBack: () => void;
  theme: string;
  toggleTheme: () => void;
}

const TeamLogin: React.FC<TeamLoginProps> = ({ onLoginSuccess, onBack, theme, toggleTheme }) => {
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
      // Convert username to lowercase for case-insensitive matching
      const userProfile = await loginWithSecureId(username.trim().toLowerCase(), password.trim());
      if (userProfile) {
        onLoginSuccess(userProfile);
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      console.error("Custom login error:", err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div
        key="team-login"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="login-container"
    >
       <button
            onClick={toggleTheme}
            className="icon-interactive fixed top-6 right-6 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 backdrop-blur-sm shadow-md"
        >
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>

        <motion.div
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ type: 'spring' }}
             className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative"
        >
             <button onClick={onBack} className="absolute top-4 left-4 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <FiChevronLeft />
             </button>

            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">เข้าสู่ระบบสำหรับเจ้าหน้าที่</h2>
                <p className="text-gray-500 dark:text-gray-400">กรุณากรอก Username และรหัสผ่านของคุณ</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:outline-none"
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
                        className="w-full p-3 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        placeholder="รหัสผ่าน"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                    <FiLogIn />
                    {isVerifying ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                </button>
            </form>
        </motion.div>
    </motion.div>
  );
};

export default TeamLogin;