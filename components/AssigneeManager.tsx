
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUserPlus, FiEdit, FiTrash2, FiSave, FiXCircle, FiKey, FiUser, FiAlertTriangle } from 'react-icons/fi';
import { TeamMember } from '../types';

interface AssigneeManagerProps {
  teamMembers: TeamMember[];
  addTeamMember: (memberData: Omit<TeamMember, 'id' | 'avatar'>) => Promise<void>;
  updateTeamMember: (member: TeamMember) => Promise<void>;
  deleteTeamMember: (memberId: string) => Promise<void>;
}


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
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
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
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
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


const AssigneeManager: React.FC<AssigneeManagerProps> = ({ teamMembers, addTeamMember, updateTeamMember, deleteTeamMember }) => {
  const [newMember, setNewMember] = useState({ username: '', password: '', name: '', position: '' });
  const [editingMember, setEditingMember] = useState<(TeamMember & { newPassword?: string }) | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.username || !newMember.password || !newMember.name || !newMember.position) return;
    try {
      await addTeamMember({
        ...newMember,
        password: newMember.password,
      });
      setNewMember({ username: '', password: '', name: '', position: '' });
    } catch (error: any) {
      alert(`Error creating user: ${error.message}`);
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember || !editingMember.name.trim() || !editingMember.position.trim() || !editingMember.username?.trim()) return;
    
    const memberToUpdate: TeamMember = {
        id: editingMember.id,
        name: editingMember.name,
        position: editingMember.position,
        avatar: editingMember.avatar,
        username: editingMember.username,
    };

    if (editingMember.newPassword && editingMember.newPassword.trim() !== '') {
        memberToUpdate.password = editingMember.newPassword.trim();
    }
    
    await updateTeamMember(memberToUpdate);
    setEditingMember(null);
  };

  const handleConfirmDelete = async () => {
    if (memberToDelete) {
      await deleteTeamMember(memberToDelete.id);
      setMemberToDelete(null);
    }
  };
  
  const handleStartEditing = (member: TeamMember) => {
    setEditingMember({ ...member, newPassword: '' });
  };

  const isEditing = (member: TeamMember) => editingMember?.id === member.id;

  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg max-w-4xl mx-auto interactive-glow">
      <h2 className="text-3xl font-bold mb-2">จัดการผู้รับผิดชอบ</h2>
      <p className="text-gray-500 dark:text-dark-text-muted mb-6">เพิ่ม แก้ไข หรือลบบัญชีผู้ใช้ของทีม</p>

      <form onSubmit={handleAddMember} className="mb-8 p-6 bg-gray-50 dark:bg-dark-bg/50 rounded-lg border border-gray-200 dark:border-dark-border">
        <h3 className="font-semibold mb-4">เพิ่มสมาชิกใหม่</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <InputField label="ชื่อ-นามสกุล" id="new-name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} required/>
          <InputField label="ตำแหน่ง" id="new-position" value={newMember.position} onChange={(e) => setNewMember({ ...newMember, position: e.target.value })} required/>
          <InputField label="Username (สำหรับเข้าระบบ)" id="new-username" value={newMember.username} onChange={(e) => setNewMember({ ...newMember, username: e.target.value })} required icon={<FiUser/>}/>
          <InputField label="รหัสผ่านเริ่มต้น" type="password" id="new-password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} required icon={<FiKey/>} />
        </div>
        <button type="submit" className="icon-interactive mt-4 w-full md:w-auto bg-brand-primary dark:bg-dark-accent text-white dark:text-dark-bg px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-80 transition-opacity font-semibold">
          <FiUserPlus /> เพิ่มสมาชิก
        </button>
      </form>

      <div className="space-y-3">
        <AnimatePresence>
        {teamMembers.map((member) => (
          <motion.div
            key={member.id}
            layout
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            className="flex flex-col p-4 bg-white dark:bg-dark-card rounded-lg shadow border border-gray-200 dark:border-dark-border interactive-glow"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getColorForString(member.id)} flex-shrink-0`}>
                        <FiUser size={32} className="text-white" />
                    </div>
                    {!isEditing(member) && (
                        <div className="flex-grow">
                             <div>
                                <p className="font-bold text-lg text-gray-900 dark:text-dark-text">{member.name}</p>
                                <p className="text-sm text-gray-500 dark:text-dark-text-muted">{member.position}</p>
                                <p className="text-xs text-brand-primary dark:text-dark-accent font-mono bg-blue-100 dark:bg-dark-accent/10 px-2 py-0.5 rounded-full inline-block mt-1">@{member.username}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-4 md:mt-0 md:ml-4 flex-shrink-0 self-end md:self-center">
                    {isEditing(member) ? (
                        <>
                        <button onClick={handleUpdateMember} aria-label="Save changes" className="icon-interactive p-2 text-white bg-green-500 hover:bg-green-600 rounded-full"><FiSave size={20} /></button>
                        <button onClick={() => setEditingMember(null)} aria-label="Cancel editing" className="icon-interactive p-2 text-white bg-gray-500 hover:bg-gray-600 rounded-full"><FiXCircle size={20} /></button>
                        </>
                    ) : (
                        <>
                        <button onClick={() => handleStartEditing(member)} aria-label={`Edit ${member.name}`} className="icon-interactive p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><FiEdit size={20} /></button>
                        <button onClick={() => setMemberToDelete(member)} aria-label={`Delete ${member.name}`} className="icon-interactive p-2 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><FiTrash2 size={20} /></button>
                        </>
                    )}
                </div>
            </div>

            <AnimatePresence>
            {isEditing(member) && (
                 <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full mt-4 pt-4 border-t border-gray-200 dark:border-dark-border overflow-hidden"
                 >
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="ชื่อ-นามสกุล" id={`edit-name-${member.id}`} value={editingMember.name} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} required />
                        <InputField label="ตำแหน่ง" id={`edit-position-${member.id}`} value={editingMember.position} onChange={(e) => setEditingMember({ ...editingMember, position: e.target.value })} required />
                        <InputField label="Username" id={`edit-username-${member.id}`} value={editingMember.username || ''} onChange={(e) => setEditingMember({ ...editingMember, username: e.target.value })} required icon={<FiUser/>} />
                        <InputField label="รหัสผ่านใหม่" type="password" id={`edit-password-${member.id}`} value={editingMember.newPassword || ''} onChange={(e) => setEditingMember({ ...editingMember, newPassword: e.target.value })} placeholder="ปล่อยว่างไว้เพื่อคงรหัสเดิม" icon={<FiKey/>} />
                     </div>
                 </motion.div>
            )}
            </AnimatePresence>

          </motion.div>
        ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {memberToDelete && (
          <ConfirmationModal
            onClose={() => setMemberToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="ยืนยันการลบสมาชิก"
            message={
              <>
                คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิก: <br />
                <strong className="font-semibold text-gray-900 dark:text-dark-text">"{memberToDelete.name}"</strong>?
                <br />
                การกระทำนี้จะลบบัญชีและโปรไฟล์ออกจากระบบอย่างถาวร
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

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode }> = ({ label, id, icon, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 dark:text-dark-text-muted mb-1">{label}</label>
        <div className="relative">
            {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
            <input id={id} {...props} className={`w-full p-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-bg focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-accent focus:outline-none transition ${icon ? 'pl-9' : ''}`} />
        </div>
    </div>
);

export default AssigneeManager;
