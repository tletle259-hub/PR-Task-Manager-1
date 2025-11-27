
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPaperclip, FiMessageSquare, FiEdit2, FiTrash2, FiSave, FiBriefcase, FiLink, FiChevronsRight, FiPlus, FiUserPlus, FiUser, FiAlertTriangle } from 'react-icons/fi';
import { Task, TeamMember, TaskStatus, Note, TaskType } from '../types';
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

// Helper Components สำหรับจัดหน้าตา
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
  // Initialize state with normalized data immediately to prevent render crashes
  const [editedTask, setEditedTask] = useState<Task>(() => {
      const initializedTask = { ...task };
      // Ensure assigneeIds is an array
      if (!initializedTask.assigneeIds) {
          // @ts-ignore: handle legacy data
          if (initializedTask.assigneeId) {
             // @ts-ignore
             initializedTask.assigneeIds = [initializedTask.assigneeId];
          } else {
             initializedTask.assigneeIds = [''];
          }
      } 
      // Ensure there is at least one slot for the dropdown
      if (initializedTask.assigneeIds.length === 0) {
          initializedTask.assigneeIds = ['']; 
      }
      return initializedTask;
  });

  const [newNoteText, setNewNoteText] = useState('');
  const [editingNote, setEditingNote] = useState<{ id: string, text: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  
  // State for Cancellation Logic
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Sync state if prop task changes completely (unlikely in modal but good practice)
  useEffect(() => {
      setEditedTask(prev => {
          if (prev.id !== task.id) {
              const initializedTask = { ...task };
              if (!initializedTask.assigneeIds || initializedTask.assigneeIds.length === 0) {
                  // @ts-ignore
                  if (initializedTask.assigneeId) {
                      // @ts-ignore
                      initializedTask.assigneeIds = [initializedTask.assigneeId];
                  } else {
                      initializedTask.assigneeIds = [''];
                  }
              }
              return initializedTask;
          }
          return prev;
      });
      setCancelReason(task.cancellationReason || '');
  }, [task]);

  // ถ้าเป็นงานแบบโปรเจกต์ ให้โหลดงานย่อยอื่นๆ มาแสดงด้วย
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
    // Filter out empty assignee strings before saving
    const cleanedTask = {
        ...editedTask,
        assigneeIds: editedTask.assigneeIds.filter(id => id && id.trim() !== '')
    };
    onSave(cleanedTask);
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

    if (newStatus === TaskStatus.CANCELLED) {
        // If selecting CANCELLED, show modal instead of updating immediately
        setShowCancelReasonModal(true);
        return;
    }

    setEditedTask(prev => ({ ...prev, status: newStatus }));

    // ถ้าเปลี่ยนเป็นเสร็จสิ้น ให้โชว์พลุฉลอง
    if (newStatus === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
        setShowConfetti(true);
        setTimeout(() => {
            setShowConfetti(false);
        }, 2000);
    }
  };

  const confirmCancellation = () => {
      setEditedTask(prev => ({
          ...prev,
          status: TaskStatus.CANCELLED,
          cancellationReason: cancelReason
      }));
      setShowCancelReasonModal(false);
  };

  const cancelCancellation = () => {
      setShowCancelReasonModal(false);
      // Reset logic handled by keeping the original status in state until confirmed
  };

  const handleAddAssignee = () => {
      setEditedTask(prev => ({
          ...prev,
          assigneeIds: [...prev.assigneeIds, '']
      }));
  };

  const handleAssigneeChange = (index: number, value: string) => {
      const newAssignees = [...editedTask.assigneeIds];
      newAssignees[index] = value;
      setEditedTask(prev => ({ ...prev, assigneeIds: newAssignees }));
  };

  const handleRemoveAssignee = (index: number) => {
      const newAssignees = [...editedTask.assigneeIds];
      if (newAssignees.length === 1) {
          // If it's the last one, just clear the value, don't remove the input
          newAssignees[0] = '';
      } else if (index === 0) {
          // If removing the main assignee row but there are others, shift or clear?
          // Better to just clear it to allow changing "Main"
          newAssignees[0] = ''; 
      } else {
          newAssignees.splice(index, 1);
      }
      setEditedTask(prev => ({ ...prev, assigneeIds: newAssignees }));
  };

  // Display Helper: Format ID with Slash
  const getDisplayId = (task: Task) => {
      if (task.id.includes('-')) {
          return task.id.replace('-', '/');
      }
      // If it already has / or looks different, keep it. 
      // Fallback for very old data: append year from timestamp? 
      // No, let's stick to what's there unless it's the new hyphen format.
      return task.id;
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col relative"
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
            <p className="text-sm font-semibold text-blue-500">{getDisplayId(task)}</p>
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
                                const assigneeIds = pt.assigneeIds || [];
                                const assignees = teamMembers.filter(m => assigneeIds.includes(m.id)).map(m => m.name).join(', ');
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
                                                        <span className="font-normal text-xs text-gray-400">({getDisplayId(pt)})</span>
                                                    </p>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-5">
                                                        <span>ประเภท: {taskTypeName}</span>
                                                        <span className="mx-2">|</span>
                                                        <span>ผู้รับผิดชอบ: {assignees || 'ยังไม่มอบหมาย'}</span>
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
                
                {(editedTask.status === TaskStatus.CANCELLED && editedTask.cancellationReason) && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                        <h4 className="text-red-700 dark:text-red-300 font-bold mb-2 flex items-center gap-2"><FiAlertTriangle/> เหตุผลที่ยกเลิก</h4>
                        <p className="text-red-600 dark:text-red-200 text-sm">{editedTask.cancellationReason}</p>
                        <button onClick={() => setShowCancelReasonModal(true)} className="text-xs text-red-500 hover:underline mt-2">แก้ไขเหตุผล</button>
                    </div>
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
                    <div className="space-y-3">
                        {(editedTask.assigneeIds || []).map((assigneeId, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                        <FiUser size={16}/>
                                    </div>
                                    <select
                                        value={assigneeId}
                                        onChange={e => handleAssigneeChange(index, e.target.value)}
                                        className="w-full pl-10 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm appearance-none"
                                    >
                                        <option value="">{index === 0 ? "เลือกผู้รับผิดชอบ (หลัก)" : "เลือกผู้รับผิดชอบร่วม"}</option>
                                        {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.position})</option>)}
                                    </select>
                                </div>
                                {(editedTask.assigneeIds.length > 1 || assigneeId !== '') && (
                                    <button 
                                        onClick={() => handleRemoveAssignee(index)} 
                                        className="p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors flex-shrink-0 border border-transparent hover:border-red-200"
                                        title={index === 0 || editedTask.assigneeIds.length === 1 ? "ล้างข้อมูล" : "ลบผู้รับผิดชอบนี้"}
                                    >
                                        {(index === 0 || editedTask.assigneeIds.length === 1) ? <FiX size={18}/> : <FiTrash2 size={18}/>}
                                    </button>
                                )}
                            </div>
                        ))}
                        <button 
                            onClick={handleAddAssignee}
                            className="w-full py-2 text-sm font-semibold text-brand-primary border border-dashed border-brand-primary/50 rounded-lg hover:bg-brand-primary/5 flex items-center justify-center gap-2 transition-colors"
                        >
                            <FiUserPlus /> เพิ่มผู้รับผิดชอบร่วม
                        </button>
                    </div>
                </EditableField>

                <EditableField label="กำหนดส่ง">
                     <input
                        type="date"
                        value={editedTask.dueDate}
                        onChange={e => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                        className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                </EditableField>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                     <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                        <span><FiMessageSquare className="inline mr-2"/> บันทึกช่วยจำ / ความคืบหน้า</span>
                     </h4>
                     
                     <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                        {editedTask.notes.length === 0 && <p className="text-sm text-gray-400 italic">ยังไม่มีบันทึก</p>}
                        {editedTask.notes.map(note => (
                            <div key={note.id} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-sm relative group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">{note.author}</span>
                                    <span className="text-xs text-gray-500">{new Date(note.timestamp).toLocaleString('th-TH')}</span>
                                </div>
                                {editingNote?.id === note.id ? (
                                    <div className="mt-2">
                                        <textarea 
                                            value={editingNote.text} 
                                            onChange={e => setEditingNote({...editingNote, text: e.target.value})}
                                            className="w-full p-2 border rounded text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700"
                                            rows={2}
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button onClick={handleCancelEditNote} className="text-xs text-gray-500">ยกเลิก</button>
                                            <button onClick={handleSaveNote} className="text-xs text-blue-500 font-bold">บันทึก</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.text}</p>
                                )}
                                
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-black/50 rounded-md shadow-sm">
                                    <button onClick={() => handleStartEditNote(note)} className="p-1 text-blue-500 hover:text-blue-700" title="แก้ไข"><FiEdit2 size={12}/></button>
                                    <button onClick={() => handleDeleteNote(note.id)} className="p-1 text-red-500 hover:text-red-700" title="ลบ"><FiTrash2 size={12}/></button>
                                </div>
                            </div>
                        ))}
                     </div>

                     <div className="flex gap-2">
                        <input
                            type="text"
                            value={newNoteText}
                            onChange={e => setNewNoteText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                            placeholder="พิมพ์บันทึก..."
                            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <button 
                            onClick={handleAddNote}
                            disabled={!newNoteText.trim()}
                            className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            ส่ง
                        </button>
                     </div>
                </div>

            </div>
          </div>
        </main>
        
        <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium transition-colors">
            ปิด
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-lg bg-brand-primary text-white font-bold hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2">
            <FiSave /> บันทึกการเปลี่ยนแปลง
          </button>
        </footer>

        {/* Cancellation Reason Modal Overlay */}
        <AnimatePresence>
            {showCancelReasonModal && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center p-4 rounded-2xl"
                >
                    <motion.div 
                        initial={{ scale: 0.9 }} 
                        animate={{ scale: 1 }} 
                        exit={{ scale: 0.9 }}
                        className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700"
                    >
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <FiAlertTriangle className="text-red-500"/> ระบุเหตุผลการยกเลิก
                        </h3>
                        <textarea
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            placeholder="กรุณาระบุเหตุผลที่ต้องการยกเลิกงานนี้..."
                            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50 dark:bg-gray-900 dark:text-white resize-none"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={cancelCancellation} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                ยกเลิก
                            </button>
                            <button 
                                onClick={confirmCancellation} 
                                disabled={!cancelReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ยืนยันการยกเลิก
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
};

export default TaskModal;