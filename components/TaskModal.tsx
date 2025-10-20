import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPaperclip, FiMessageSquare, FiEdit2, FiTrash2, FiSave, FiXCircle, FiBriefcase, FiLink, FiChevronsRight } from 'react-icons/fi';
import { Task, TeamMember, TaskStatus, TaskType, Note } from '../types';
import { TASK_STATUS_COLORS } from '../constants';
import Confetti from './Confetti';
import { onTasksUpdate } from '../services/taskService';

interface TaskModalProps {
  task: Task;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSave: (task: Task) => void;
  currentUser: TeamMember;
  onSelectTask: (task: Task) => void;
}

const Section: React.FC<{ title: string, children: React.ReactNode, card?: boolean }> = ({ title, children, card = false }) => (
    <div>
        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{title}</h4>
        <div className={card ? "p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30" : ""}>
            {children}
        </div>
    </div>
);

const InfoItem: React.FC<{ label: string, value?: string | React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-2 text-sm py-1.5">
        <p className="col-span-1 font-semibold text-gray-600 dark:text-gray-400">{label}</p>
        <div className="col-span-2 text-gray-800 dark:text-gray-200 break-words">{value || '-'}</div>
    </div>
);

const EditableField: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</label>
        {children}
    </div>
);


const TaskModal: React.FC<TaskModalProps> = ({ task, teamMembers, onClose, onSave, currentUser, onSelectTask }) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNote, setEditingNote] = useState<{ id: string, text: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);

  useEffect(() => {
      setEditedTask(task);
  }, [task]);

  useEffect(() => {
      if(task.projectId) {
          const unsubscribe = onTasksUpdate((allTasks) => {
              const relatedTasks = allTasks.filter(t => t.projectId === task.projectId && t.id !== task.id)
                                          .sort((a,b) => a.id.localeCompare(b.id));
              setProjectTasks(relatedTasks);
          });
          return () => unsubscribe();
      }
  }, [task.projectId, task.id]);


  const handleSave = () => {
    onSave(editedTask);
  };
  
  const handleAddNote = () => {
    if (newNoteText.trim() === '') return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      author: currentUser.name,
      timestamp: new Date().toISOString(),
      text: newNoteText.trim(),
    };
    setEditedTask(prev => ({
        ...prev,
        notes: [...prev.notes, newNote]
    }));
    setNewNoteText('');
  };

  const handleStartEditNote = (note: Note) => {
    setEditingNote({ id: note.id, text: note.text });
  };

  const handleCancelEditNote = () => {
    setEditingNote(null);
  };

  const handleSaveNote = () => {
    if (!editingNote) return;
    setEditedTask(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === editingNote.id ? { ...n, text: editingNote.text } : n),
    }));
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมายเหตุนี้?')) {
      setEditedTask(prev => ({
        ...prev,
        notes: prev.notes.filter(n => n.id !== noteId),
      }));
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    const oldStatus = editedTask.status;

    setEditedTask(prev => ({ ...prev, status: newStatus }));

    if (newStatus === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
        setShowConfetti(true);
        setTimeout(() => {
            setShowConfetti(false);
        }, 2000);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>
      <motion.div
        initial={{ y: "100vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100vh", opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start flex-shrink-0">
          <div className="flex-grow">
            {task.projectName && (
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-1">
                    <FiBriefcase />
                    {task.projectName}
                </p>
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{task.taskTitle}</h2>
            <p className="text-sm font-semibold text-blue-500">{task.id}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="icon-interactive p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-4">
            <FiX size={24} />
          </button>
        </header>

        <main className="p-4 sm:p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
                <Section title="รายละเอียด">
                    <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/30">{task.taskDescription}</p>
                </Section>

                <Section title="ผู้ร้องขอ" card>
                    <InfoItem label="ชื่อ-สกุล" value={task.requesterName} />
                    <InfoItem label="สังกัดฝ่าย/ส่วน" value={task.department} />
                    <InfoItem label="อีเมล" value={<a href={`mailto:${task.requesterEmail}`} className="text-blue-500 hover:underline">{task.requesterEmail}</a>} />
                    <InfoItem label="เบอร์โทรศัพท์" value={task.phone} />
                </Section>
                
                 {projectTasks.length > 0 && (
                    <Section title="ภาพรวมโปรเจกต์" card>
                        <p className="text-xs text-gray-500 mb-2">แสดงรายการงานย่อยอื่น ๆ ในโปรเจกต์เดียวกัน (คลิกเพื่อดูรายละเอียด)</p>
                        <ul className="space-y-2">
                           {projectTasks.map(pt => {
                                const assignee = teamMembers.find(m => m.id === pt.assigneeId);
                                const taskTypeName = pt.taskType === TaskType.OTHER ? pt.otherTaskTypeName : pt.taskType;

                                return (
                                    <li key={pt.id}>
                                        <button 
                                            onClick={() => onSelectTask(pt)}
                                            className="w-full text-left p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                                        >
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 truncate">
                                                        <FiLink size={12}/>
                                                        {pt.taskTitle} 
                                                        <span className="font-normal text-xs text-gray-400">({pt.id})</span>
                                                    </p>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-5">
                                                        <span>ประเภท: {taskTypeName}</span>
                                                        <span className="mx-2">|</span>
                                                        <span>ผู้รับผิดชอบ: {assignee ? assignee.name : 'ยังไม่มอบหมาย'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                    <span className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full ${TASK_STATUS_COLORS[pt.status]}`}>{pt.status}</span>
                                                    <FiChevronsRight className="text-gray-400" />
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </Section>
                 )}

                <Section title="ไฟล์แนบ" card>
                    {task.attachments.length > 0 ? (
                        <ul className="space-y-2">
                            {task.attachments.map((file, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                    <FiPaperclip size={14}/>
                                    {file.url ? (
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={`เปิด ${file.name} ในแท็บใหม่`}>
                                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </a>
                                    ) : (
                                        <span className="truncate text-gray-600 dark:text-gray-400" title="ไม่สามารถดูไฟล์นี้ได้โดยตรง">
                                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-500 italic">ไม่มีไฟล์แนบ</p>}
                </Section>
                 {task.additionalNotes && (
                    <Section title="หมายเหตุเพิ่มเติม (จากผู้แจ้ง)">
                        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/30">{task.additionalNotes}</p>
                    </Section>
                )}
            </div>
            <div className="lg:col-span-2 space-y-6">
                 <EditableField label="สถานะ">
                    <select
                        value={editedTask.status}
                        onChange={handleStatusChange}
                        className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors text-white font-semibold ${TASK_STATUS_COLORS[editedTask.status]}`}
                    >
                        {Object.values(TaskStatus).map(s => <option key={s} value={s} className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-normal">{s}</option>)}
                    </select>
                </EditableField>
                <EditableField label="ผู้รับผิดชอบ">
                     <select
                        value={editedTask.assigneeId || ''}
                        onChange={e => setEditedTask({ ...editedTask, assigneeId: e.target.value || null })}
                        className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    >
                        <option value="">ยังไม่มอบหมาย</option>
                        {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </EditableField>
                 <EditableField label="กำหนดส่ง">
                    <input
                        type="date"
                        value={editedTask.dueDate.split('T')[0]}
                        onChange={e => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                        className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                </EditableField>
                <Section title="ข้อมูลงาน" card>
                    <InfoItem label="วันที่สั่ง" value={new Date(task.timestamp).toLocaleDateString('th-TH')} />
                    <InfoItem label="ประเภทการสั่งงาน" value={task.requestType} />
                    <InfoItem label="ประเภทงาน" value={task.taskType === TaskType.OTHER ? task.otherTaskTypeName : task.taskType} />
                    <InfoItem label="สำหรับคณะ" value={task.committee} />
                </Section>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FiMessageSquare />หมายเหตุของทีม</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {editedTask.notes.length > 0 ? editedTask.notes.map((note) => (
                    <div key={note.id} className="text-sm bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{note.author}</p>
                                <p className="text-xs text-gray-500">{new Date(note.timestamp).toLocaleString('th-TH')}</p>
                            </div>
                            {editingNote?.id !== note.id && (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleStartEditNote(note)} className="icon-interactive p-1 text-gray-500 hover:text-blue-500"><FiEdit2 size={14}/></button>
                                    <button onClick={() => handleDeleteNote(note.id)} className="icon-interactive p-1 text-gray-500 hover:text-red-500"><FiTrash2 size={14}/></button>
                                </div>
                            )}
                        </div>
                         {editingNote?.id === note.id ? (
                            <div>
                                <textarea value={editingNote.text} onChange={(e) => setEditingNote({...editingNote, text: e.target.value})} rows={2} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-1 focus:ring-brand-primary focus:outline-none"/>
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={handleCancelEditNote} className="icon-interactive p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><FiXCircle size={18}/></button>
                                    <button onClick={handleSaveNote} className="icon-interactive p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-full"><FiSave size={18}/></button>
                                </div>
                            </div>
                         ) : (
                            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{note.text}</p>
                         )}
                    </div>
                )) : <p className="text-sm text-gray-500 italic text-center py-4">ยังไม่มีหมายเหตุ</p>}
            </div>
             <div className="flex gap-2 mt-4">
                <textarea value={newNoteText} onChange={e => setNewNoteText(e.target.value)} placeholder="เพิ่มหมายเหตุใหม่..." rows={2} className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary focus:outline-none"/>
                <button onClick={handleAddNote} className="icon-interactive px-5 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors self-start">เพิ่ม</button>
            </div>
          </div>
        </main>

        <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-4 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={onClose} className="icon-interactive px-6 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
            ยกเลิก
          </button>
          <button onClick={handleSave} className="icon-interactive px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
            บันทึก
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default TaskModal;