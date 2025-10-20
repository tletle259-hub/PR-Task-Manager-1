import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiInfo, FiSun, FiMoon, FiBell, FiAlertTriangle, FiCheckSquare } from 'react-icons/fi';

// --- CONFIRMATION MODAL COMPONENT ---
interface ConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
}) => {
  return (
    <motion.div
      key="confirm-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        key="confirm-modal-panel"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-dark-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <FiAlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
            </div>
            <div className="mt-0 text-left flex-grow">
              <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-dark-text" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <footer className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 flex flex-row-reverse gap-3 rounded-b-2xl">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-primary text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-dark-border shadow-sm px-4 py-2 bg-white dark:bg-dark-muted text-base font-medium text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-dark-accent sm:mt-0 sm:w-auto sm:text-sm transition-colors"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};


const SettingsSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg interactive-glow">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><span className="text-brand-primary dark:text-dark-accent">{icon}</span> {title}</h3>
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
  
  const [statusVisible, setStatusVisible] = useState(() => {
    const saved = localStorage.getItem('system_status_visibility');
    return saved !== 'false'; // Default to true
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSoundEnabled', String(newValue));
  };

  const handleVisibilityToggleClick = () => {
      setShowConfirmModal(true);
  };

  const handleConfirmVisibilityChange = () => {
      const newValue = !statusVisible;
      setStatusVisible(newValue);
      localStorage.setItem('system_status_visibility', String(newValue));
      setShowConfirmModal(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold">ตั้งค่า</h2>
        
        <SettingsSection icon={<FiEye size={24} />} title="ลักษณะที่ปรากฏและการแจ้งเตือน">
            <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-dark-border rounded-lg">
                 <div>
                    <p className="font-semibold">ธีมสี</p>
                    <p className="text-sm text-gray-500 dark:text-dark-text-muted">เลือกระหว่างธีมสว่างและธีมมืด</p>
                </div>
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="icon-interactive p-3 rounded-full bg-gray-200 dark:bg-dark-muted hover:bg-gray-300 dark:hover:bg-dark-border transition-colors"
                >
                  {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
                </button>
            </div>
            <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-dark-border rounded-lg">
                 <div>
                    <p className="font-semibold flex items-center gap-2"><FiBell />เสียงแจ้งเตือน</p>
                    <p className="text-sm text-gray-500 dark:text-dark-text-muted">เปิด/ปิดเสียงเมื่อมีงานใหม่เข้ามา</p>
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

        <SettingsSection icon={<FiCheckSquare size={24} />} title="การตั้งค่าการแสดงผลสำหรับผู้สั่งงาน">
            <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-dark-border rounded-lg">
                 <div>
                    <p className="font-semibold">แสดงสถานะการดำเนินงาน</p>
                    <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                        {statusVisible 
                            ? 'เปิด: ผู้สั่งงานจะเห็นสถานะของงาน (เช่น กำลังดำเนินการ, เสร็จสิ้น)' 
                            : 'ปิด: ผู้สั่งงานจะไม่เห็นสถานะของงานทั้งหมดในระบบ'
                        }
                    </p>
                </div>
                 <button
                  onClick={handleVisibilityToggleClick}
                  aria-label="Toggle Requester Status Visibility"
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${
                    statusVisible ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                      statusVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
            </div>
        </SettingsSection>


        <SettingsSection icon={<FiInfo size={24} />} title="เกี่ยวกับระบบ">
            <div className="text-gray-600 dark:text-dark-text-muted">
                <p><strong>ระบบจัดการงาน ส่วนงานสื่อสารองค์กร</strong></p>
                <p>สภาวิชาชีพบัญชี ในพระบรมราชูปถัมภ์</p>
                <p className="mt-2">เวอร์ชั่น 1.1.0</p>
                <p>© 2025 Nattakit Chotikorn</p>
            </div>
        </SettingsSection>

        <AnimatePresence>
            {showConfirmModal && (
                 <ConfirmationModal
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={handleConfirmVisibilityChange}
                    title="ยืนยันการเปลี่ยนแปลง"
                    message={
                        <>
                           คุณต้องการจะ <strong className={statusVisible ? "text-red-600" : "text-green-600"}>
                           {statusVisible ? "ปิด" : "เปิด"}การแสดงผล
                           </strong> สถานะงานสำหรับผู้สั่งงานทั้งหมดใช่หรือไม่?
                           <br/><br/>
                           การเปลี่ยนแปลงนี้จะมีผลกับผู้สั่งงานทุกคนในระบบทันที
                        </>
                    }
                    confirmText="ยืนยัน"
                    cancelText="ยกเลิก"
                />
            )}
        </AnimatePresence>
    </div>
  );
};

export default Settings;