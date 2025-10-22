import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiInfo, FiSun, FiMoon, FiBell, FiAlertTriangle, FiCheckSquare, FiBookOpen, FiPlus, FiEdit, FiTrash2, FiSave, FiXCircle } from 'react-icons/fi';
import { Department } from '../types';
import { onDepartmentsUpdate, addDepartment, updateDepartment, deleteDepartment } from '../services/departmentService';


// --- CONFIRMATION MODAL COMPONENT ---
interface ConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  warningLevel?: 'info' | 'danger';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  warningLevel = 'info'
}) => {
  const isDanger = warningLevel === 'danger';
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
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${isDanger ? 'bg-red-100 dark:bg-red-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'} sm:mx-0 sm:h-10 sm:w-10`}>
              <FiAlertTriangle className={`h-6 w-6 ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} aria-hidden="true" />
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
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-brand-primary hover:bg-blue-700 focus:ring-blue-500'}`}
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


const DepartmentManager: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

    useEffect(() => {
        const unsubscribe = onDepartmentsUpdate(setDepartments);
        return () => unsubscribe();
    }, []);

    const handleAdd = async () => {
        if (newDepartmentName.trim()) {
            await addDepartment(newDepartmentName.trim());
            setNewDepartmentName('');
        }
    };

    const handleUpdate = async () => {
        if (editingDepartment && editingDepartment.name.trim()) {
            await updateDepartment(editingDepartment.id, editingDepartment.name.trim());
            setEditingDepartment(null);
        }
    };

    const handleDelete = async () => {
        if (departmentToDelete) {
            await deleteDepartment(departmentToDelete.id);
            setDepartmentToDelete(null);
        }
    };

    return (
        <SettingsSection icon={<FiBookOpen size={24} />} title="จัดการส่วนงาน">
            <div className="flex flex-col sm:flex-row gap-2">
                <input 
                    type="text" 
                    value={newDepartmentName} 
                    onChange={e => setNewDepartmentName(e.target.value)}
                    placeholder="เพิ่มส่วนงานใหม่..."
                    className="form-input flex-grow"
                />
                <button onClick={handleAdd} className="w-full sm:w-auto icon-interactive bg-brand-primary text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    <FiPlus /> เพิ่ม
                </button>
            </div>
            
            <div className="space-y-2 max-h-72 overflow-y-auto border-t border-b dark:border-gray-700 my-4 py-2">
                {departments.map(dept => (
                    <div key={dept.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-muted/30 rounded-lg">
                        {editingDepartment?.id === dept.id ? (
                            <input 
                                type="text"
                                value={editingDepartment.name}
                                autoFocus
                                onBlur={handleUpdate}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                onChange={e => setEditingDepartment({...editingDepartment, name: e.target.value})}
                                className="form-input !py-1"
                            />
                        ) : (
                            <span className="truncate pr-2">{dept.name}</span>
                        )}
                        <div className="flex gap-1 flex-shrink-0">
                            {editingDepartment?.id === dept.id ? (
                                <>
                                    <button onClick={handleUpdate} className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full"><FiSave /></button>
                                    <button onClick={() => setEditingDepartment(null)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600/50 rounded-full"><FiXCircle /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditingDepartment(dept)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><FiEdit /></button>
                                    <button onClick={() => setDepartmentToDelete(dept)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><FiTrash2 /></button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
             <AnimatePresence>
                {departmentToDelete && (
                    <ConfirmationModal
                        onClose={() => setDepartmentToDelete(null)}
                        onConfirm={handleDelete}
                        title="ยืนยันการลบส่วนงาน"
                        message={<>คุณแน่ใจหรือไม่ว่าต้องการลบส่วนงาน: <strong className="font-semibold text-gray-900 dark:text-dark-text">"{departmentToDelete.name}"</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้</>}
                        confirmText="ยืนยันการลบ"
                        cancelText="ยกเลิก"
                        warningLevel="danger"
                    />
                )}
             </AnimatePresence>
        </SettingsSection>
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
        <style>{`.form-input { width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #d1d5db; background-color: #f9fafb; } .dark .form-input { border-color: #4b5563; background-color: #374151; }`}</style>
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

        <DepartmentManager />

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
