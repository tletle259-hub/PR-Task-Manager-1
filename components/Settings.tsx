import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiInfo, FiSun, FiMoon, FiBell } from 'react-icons/fi';

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
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    return saved !== 'false'; // Default to true
  });

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSoundEnabled', String(newValue));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold">ตั้งค่า</h2>
        
        <SettingsSection icon={<FiEye size={24} />} title="ลักษณะที่ปรากฏและการแจ้งเตือน">
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
            <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                 <div>
                    <p className="font-semibold flex items-center gap-2"><FiBell />เสียงแจ้งเตือน</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">เปิด/ปิดเสียงเมื่อมีงานใหม่เข้ามา</p>
                </div>
                <button
                  onClick={handleSoundToggle}
                  aria-label="Toggle notification sound"
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${
                    soundEnabled ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
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