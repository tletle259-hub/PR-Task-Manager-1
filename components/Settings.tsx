import React from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiInfo, FiSun, FiMoon, FiKey } from 'react-icons/fi';
import PasswordManager from './PasswordManager';

const SettingsSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><span className="text-brand-primary">{icon}</span> {title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

interface SettingsProps {
  theme: string;
  toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, toggleTheme }) => {

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold">ตั้งค่า</h2>
        
        <SettingsSection icon={<FiKey size={24} />} title="จัดการรหัสผ่าน">
            <PasswordManager />
        </SettingsSection>

        <SettingsSection icon={<FiEye size={24} />} title="ลักษณะที่ปรากฏ">
            <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                 <div>
                    <p className="font-semibold">ธีมสี</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">เลือกระหว่างธีมสว่างและธีมมืด</p>
                </div>
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
                </button>
            </div>
        </SettingsSection>

        <SettingsSection icon={<FiInfo size={24} />} title="เกี่ยวกับระบบ">
            <div className="text-gray-600 dark:text-gray-400">
                <p><strong>ระบบจัดการงาน ส่วนงานสื่อสารองค์กร</strong></p>
                <p>สภาวิชาชีพบัญชี ในพระบรมราชูปถัมภ์</p>
                <p className="mt-2">เวอร์ชั่น 1.1.0</p>
                <p>© 2025 Nattakit Chotikorn</p>
            </div>
        </SettingsSection>
    </div>
  );
};

export default Settings;