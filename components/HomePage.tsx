
// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiUsers, FiBriefcase, FiSun, FiMoon } from 'react-icons/fi';
import RequesterLoginForm from './RequesterLogin'; // แบบฟอร์มล็อกอินสำหรับผู้สั่งงานทั่วไป
import { User } from '../types';

interface HomePageProps {
  onTeamLogin: () => void;
  onCustomLoginSuccess: (user: User) => void;
  onMicrosoftLogin: () => void;
  onNavigateToRegister: () => void;
  theme: string;
  toggleTheme: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onTeamLogin,
  onCustomLoginSuccess,
  onMicrosoftLogin,
  onNavigateToRegister,
  theme,
  toggleTheme,
}) => {
    
  // เอฟเฟกต์แสงตามเมาส์ (Mouse follow glow effect)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    container.style.setProperty('--mouse-x', `${x}px`);
    container.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <>
      {/* CSS เฉพาะสำหรับหน้า Login (Background Shimmer) */}
      <style>{`
        .login-background-shimmer {
          position: relative;
          overflow: hidden;
        }
        .login-background-shimmer::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1), transparent 80%);
          z-index: 0;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .dark .login-background-shimmer::before {
           background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.06), transparent 80%);
        }
        .login-background-shimmer:hover::before {
          opacity: 1;
        }
      `}</style>
      
      <motion.div
        key="home-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="login-container login-background-shimmer"
        onMouseMove={handleMouseMove}
      >
        {/* ปุ่มสลับธีม */}
        <button
            onClick={toggleTheme}
            className="icon-interactive absolute top-6 right-6 p-3 rounded-full bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 backdrop-blur-sm shadow-lg z-20"
        >
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>

        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring' }}
            className="flex flex-col items-center gap-8 py-12 px-4 z-10"
        >
            {/* โลโก้และชื่อระบบ */}
            <div className="flex justify-center items-center gap-4 text-center">
                 <img 
                    src="https://www.tfac.or.th/upload/9414/c0sN1HN2j5.png" 
                    alt="Logo สภาวิชาชีพบัญชี" 
                    className="w-16 h-16 object-contain"
                />
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                        ระบบจัดการงาน
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        ส่วนงานสื่อสารองค์กร
                    </p>
                     <p className="text-sm text-gray-500 dark:text-gray-400">
                        สภาวิชาชีพบัญชี ในพระบรมราชูปถัมภ์
                    </p>
                </div>
            </div>
            
            {/* ส่วนล็อกอินสำหรับผู้สั่งงาน (Requester) */}
            <RequesterLoginForm 
                onLoginSuccess={onCustomLoginSuccess}
                onMicrosoftLogin={onMicrosoftLogin}
                onNavigateToRegister={onNavigateToRegister}
            />

            {/* ส่วนล็อกอินสำหรับเจ้าหน้าที่ (Team Member) */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="w-full max-w-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-700 rounded-2xl shadow-lg p-4 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-full text-brand-primary">
                        <FiUsers size={24}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">สำหรับเจ้าหน้าที่</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">จัดการงาน</p>
                    </div>
                </div>
                <motion.button 
                    onClick={onTeamLogin}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"
                >
                    เข้าสู่ระบบ <FiArrowRight />
                </motion.button>
            </motion.div>

        </motion.div>
        <footer className="absolute bottom-4 text-center text-xs text-gray-500 dark:text-gray-400 w-full">
            <p>© 2025 PR Task Manager</p>
            <p>Dev by Nattakit Chotikorn</p>
        </footer>
      </motion.div>
    </>
  );
};

export default HomePage;
