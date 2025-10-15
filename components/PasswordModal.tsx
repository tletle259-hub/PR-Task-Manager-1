import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { getAdminPasswords } from '../services/securityService';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const validPasswords = await getAdminPasswords();
      if (validPasswords.includes(password)) {
        setError('');
        setPassword('');
        onSuccess();
      } else {
        setError('รหัสผ่านไม่ถูกต้อง!');
      }
    } catch (err) {
        console.error("Error verifying password:", err);
        setError('เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
    } finally {
        setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setError('');
    setPassword('');
    setShowPassword(false);
    onClose();
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <header className="p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <FiLock />
                    ต้องการรหัสผ่าน
                </h3>
                <button onClick={handleClose} className="icon-interactive p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <FiX />
                </button>
            </header>
            <form onSubmit={handleSubmit} className="p-6 pt-0">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                กรุณากรอกรหัสผ่านเพื่อเข้าสู่ส่วนจัดการของผู้ดูแล
              </p>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                  }}
                  className={`w-full p-3 pr-10 border rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:outline-none transition-colors ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-primary'}`}
                  placeholder="กรอกรหัสผ่าน..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm mt-2 text-center"
                    >
                        {error}
                    </motion.p>
                )}
              </AnimatePresence>
              <button
                type="submit"
                disabled={isVerifying}
                className="mt-4 w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {isVerifying ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PasswordModal;