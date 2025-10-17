import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit, FiTrash2, FiSave, FiXCircle, FiKey, FiUser, FiAlertTriangle, FiSearch, FiMail, FiBriefcase } from 'react-icons/fi';
import { User } from '../types';

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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div className="mt-0 text-left flex-grow">
              <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-gray-100" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <footer className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex flex-row-reverse gap-3 rounded-b-2xl">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary sm:mt-0 sm:w-auto sm:text-sm transition-colors"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};


// Color generation for user icons
const BG_COLORS = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500'
];

const getColorForString = (str: string) => {
  let hash = 0;
  if (str.length === 0) return BG_COLORS[0];
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash % BG_COLORS.length);
  return BG_COLORS[index];
};


interface RequesterManagerProps {
  users: User[];
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const RequesterManager: React.FC<RequesterManagerProps> = ({ users, updateUser, deleteUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<(User & { newPassword?: string }) | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    // This effect derives the username from the English names when editing
    if (editingUser) {
        const { firstNameEn = '', lastNameEn = '' } = editingUser;
        if (firstNameEn && lastNameEn && lastNameEn.length >= 2) {
            const generatedUsername = `${firstNameEn.toLowerCase().trim()}.${lastNameEn.slice(0, 2).toLowerCase().trim()}`;
            if (generatedUsername !== editingUser.username) {
                setEditingUser(prev => prev ? { ...prev, username: generatedUsername } : null);
            }
        }
    }
  }, [editingUser?.firstNameEn, editingUser?.lastNameEn]);

  const filteredUsers = useMemo(() => {
    const sortedUsers = [...users].sort((a, b) => a.firstNameTh.localeCompare(b.firstNameTh, 'th'));
    if (!searchTerm) return sortedUsers;
    const lowercasedFilter = searchTerm.toLowerCase();
    return sortedUsers.filter(user =>
      user.firstNameTh.toLowerCase().includes(lowercasedFilter) ||
      user.lastNameTh.toLowerCase().includes(lowercasedFilter) ||
      user.email.toLowerCase().includes(lowercasedFilter) ||
      user.username.toLowerCase().includes(lowercasedFilter)
    );
  }, [users, searchTerm]);

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { newPassword, confirmPassword, ...userData } = editingUser as any;
    const dataToUpdate: Partial<User> = { ...userData };
    
    if (newPassword && newPassword.trim()) {
        dataToUpdate.password = newPassword.trim();
    }
    
    await updateUser(editingUser.id, dataToUpdate);
    setEditingUser(null);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };
  
  const handleStartEditing = (user: User) => {
    setEditingUser({ ...user, newPassword: '' });
  };

  const isEditing = (user: User) => editingUser?.id === user.id;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">จัดการบัญชีผู้สั่งงาน</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">ค้นหา แก้ไข หรือลบบัญชีผู้สั่งงานในระบบ</p>

      <div className="relative mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
            type="text"
            placeholder="ค้นหาจากชื่อ, อีเมล, หรือ username..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        <AnimatePresence>
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            layout
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getColorForString(user.id)} flex-shrink-0`}>
                        <FiUser size={32} className="text-white" />
                    </div>
                    {!isEditing(user) && (
                        <div className="flex-grow">
                             <div>
                                <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{user.firstNameTh} {user.lastNameTh}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.position} ({user.department})</p>
                                <p className="text-xs text-brand-primary font-mono bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded-full inline-block mt-1">@{user.username}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-4 md:mt-0 md:ml-4 flex-shrink-0 self-end md:self-center">
                    {isEditing(user) ? (
                        <>
                        <button onClick={handleUpdateUser} aria-label="Save changes" className="icon-interactive p-2 text-white bg-green-500 hover:bg-green-600 rounded-full"><FiSave size={20} /></button>
                        <button onClick={() => setEditingUser(null)} aria-label="Cancel editing" className="icon-interactive p-2 text-white bg-gray-500 hover:bg-gray-600 rounded-full"><FiXCircle size={20} /></button>
                        </>
                    ) : (
                        <>
                        <button onClick={() => handleStartEditing(user)} aria-label={`Edit ${user.firstNameTh}`} className="icon-interactive p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full"><FiEdit size={20} /></button>
                        <button onClick={() => setUserToDelete(user)} aria-label={`Delete ${user.firstNameTh}`} className="icon-interactive p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"><FiTrash2 size={20} /></button>
                        </>
                    )}
                </div>
            </div>

            <AnimatePresence>
            {isEditing(user) && (
                 <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 overflow-hidden"
                 >
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="ชื่อ (ภาษาไทย)" id={`edit-fn-th-${user.id}`} value={editingUser.firstNameTh} onChange={(e) => setEditingUser({ ...editingUser, firstNameTh: e.target.value })} required />
                        <InputField label="นามสกุล (ภาษาไทย)" id={`edit-ln-th-${user.id}`} value={editingUser.lastNameTh} onChange={(e) => setEditingUser({ ...editingUser, lastNameTh: e.target.value })} required />
                        <InputField label="ชื่อ (ภาษาอังกฤษ)" id={`edit-fn-en-${user.id}`} value={editingUser.firstNameEn} onChange={(e) => setEditingUser({ ...editingUser, firstNameEn: e.target.value })} required />
                        <InputField label="นามสกุล (ภาษาอังกฤษ)" id={`edit-ln-en-${user.id}`} value={editingUser.lastNameEn} onChange={(e) => setEditingUser({ ...editingUser, lastNameEn: e.target.value })} required />
                        <InputField label="ตำแหน่ง" id={`edit-position-${user.id}`} value={editingUser.position} onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })} required icon={<FiBriefcase/>} />
                        <InputField label="ส่วนงาน" id={`edit-department-${user.id}`} value={editingUser.department} onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })} required icon={<FiBriefcase/>} />
                        <InputField label="Email" id={`edit-email-${user.id}`} value={editingUser.email} readOnly icon={<FiMail/>}/>
                        <InputField label="Username" id={`edit-username-${user.id}`} value={editingUser.username || ''} readOnly icon={<FiUser/>} />
                        <InputField label="รหัสผ่านใหม่" type="password" id={`edit-password-${user.id}`} value={editingUser.newPassword || ''} onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })} placeholder="ปล่อยว่างไว้เพื่อคงรหัสเดิม" icon={<FiKey/>} wrapperClassName="md:col-span-2"/>
                     </div>
                 </motion.div>
            )}
            </AnimatePresence>

          </motion.div>
        ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {userToDelete && (
          <ConfirmationModal
            onClose={() => setUserToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="ยืนยันการลบบัญชีผู้สั่งงาน"
            message={
              <>
                คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ: <br />
                <strong className="font-semibold text-gray-800 dark:text-gray-200">"{userToDelete.firstNameTh} {userToDelete.lastNameTh}"</strong>?
                <br />
                การกระทำนี้จะลบบัญชีออกจากระบบอย่างถาวร
              </>
            }
            confirmText="ลบ"
            cancelText="ยกเลิก"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode, wrapperClassName?: string }> = ({ label, id, icon, wrapperClassName, ...props }) => (
    <div className={wrapperClassName}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="relative">
            {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
            <input id={id} {...props} className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-primary focus:outline-none transition read-only:bg-gray-100 read-only:cursor-not-allowed dark:read-only:bg-gray-700 ${icon ? 'pl-9' : ''}`} />
        </div>
    </div>
);

export default RequesterManager;