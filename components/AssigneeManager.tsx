

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUserPlus, FiEdit, FiTrash2, FiSave, FiXCircle } from 'react-icons/fi';
import { TeamMember } from '../types';

interface AssigneeManagerProps {
  teamMembers: TeamMember[];
  updateTeamMembers: (members: TeamMember[]) => void;
}

const AssigneeManager: React.FC<AssigneeManagerProps> = ({ teamMembers, updateTeamMembers }) => {
  const [newMember, setNewMember] = useState({ name: '', position: '', avatar: '' });
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMember.name.trim() === '' || newMember.position.trim() === '') return;
    const newMemberData: TeamMember = {
      id: `TM${Date.now()}`,
      name: newMember.name.trim(),
      position: newMember.position.trim(),
      avatar: newMember.avatar.trim() || `https://i.pravatar.cc/150?u=TM${Date.now()}`,
    };
    updateTeamMembers([...teamMembers, newMemberData]);
    setNewMember({ name: '', position: '', avatar: '' });
  };

  const handleUpdateMember = () => {
    if (!editingMember || editingMember.name.trim() === '' || editingMember.position.trim() === '') return;
    updateTeamMembers(teamMembers.map(m => m.id === editingMember.id ? editingMember : m));
    setEditingMember(null);
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิกคนนี้?')) {
      updateTeamMembers(teamMembers.filter(m => m.id !== id));
    }
  };

  const isEditing = (member: TeamMember) => editingMember?.id === member.id;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">จัดการผู้รับผิดชอบ</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">เพิ่ม แก้ไข หรือลบสมาชิกในทีมของคุณ</p>

      <form onSubmit={handleAddMember} className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <InputField label="ชื่อสมาชิกใหม่" id="new-name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="เช่น สมศรี มีสุข" required/>
          <InputField label="ตำแหน่ง" id="new-position" value={newMember.position} onChange={(e) => setNewMember({ ...newMember, position: e.target.value })} placeholder="เช่น กราฟิกดีไซเนอร์" required/>
          <InputField label="URL รูปโปรไฟล์ (ไม่บังคับ)" id="new-avatar" value={newMember.avatar} onChange={(e) => setNewMember({ ...newMember, avatar: e.target.value })} placeholder="https://..." />
        </div>
        <button type="submit" className="icon-interactive mt-4 w-full md:w-auto bg-brand-primary text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors font-semibold">
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
            className="flex flex-col md:flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4 w-full md:w-auto">
              <img src={member.avatar} onError={(e) => { e.currentTarget.src = 'https://i.pravatar.cc/150?u=placeholder' }} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-300" />
              <div className="flex-grow">
              {isEditing(member) ? (
                <div className="flex flex-col gap-2">
                   <input type="text" value={editingMember.name} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} className="form-input-sm" />
                   <input type="text" value={editingMember.position} onChange={(e) => setEditingMember({ ...editingMember, position: e.target.value })} className="form-input-sm" />
                   <input type="text" value={editingMember.avatar} onChange={(e) => setEditingMember({ ...editingMember, avatar: e.target.value })} className="form-input-sm" />
                </div>
              ) : (
                <div>
                  <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{member.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.position}</p>
                </div>
              )}
              </div>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              {isEditing(member) ? (
                <>
                  <button onClick={handleUpdateMember} aria-label="Save changes" className="icon-interactive p-2 text-white bg-green-500 hover:bg-green-600 rounded-full"><FiSave size={20} /></button>
                  <button onClick={() => setEditingMember(null)} aria-label="Cancel editing" className="icon-interactive p-2 text-white bg-gray-500 hover:bg-gray-600 rounded-full"><FiXCircle size={20} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditingMember(member)} aria-label={`Edit ${member.name}`} className="icon-interactive p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full"><FiEdit size={20} /></button>
                  <button onClick={() => handleDeleteMember(member.id)} aria-label={`Delete ${member.name}`} className="icon-interactive p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"><FiTrash2 size={20} /></button>
                </>
              )}
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input id={id} {...props} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
    </div>
);

const FormStylesInjector = () => (
    <style>{`
        .form-input-sm {
            padding: 0.25rem 0.5rem;
            border: 1px solid #d1d5db; /* border-gray-300 */
            border-radius: 0.375rem; /* rounded-md */
            background-color: #f9fafb; /* bg-gray-50 */
        }
        .dark .form-input-sm {
            border-color: #4b5563; /* dark:border-gray-600 */
            background-color: #374151; /* dark:bg-gray-700 */
        }
    `}</style>
)


const InjectedAssigneeManager: React.FC<AssigneeManagerProps> = (props) => (
    <>
        <FormStylesInjector />
        <AssigneeManager {...props} />
    </>
)

export default InjectedAssigneeManager;