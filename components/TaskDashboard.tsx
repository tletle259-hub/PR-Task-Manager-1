import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiStar, FiEdit3, FiTrash2, FiCalendar, FiUser, FiTag, FiGrid, FiChevronDown, FiX, FiAlertTriangle } from 'react-icons/fi';
import { Task, TeamMember, TaskStatus, TaskType } from '../types';
import { TASK_STATUS_COLORS, TASK_TYPE_COLORS } from '../constants';
import { updateTask, deleteTask } from '../services/taskService';

// --- NEW CONFIRMATION MODAL COMPONENT ---
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


// --- HELPER COMPONENTS ---

// Pill for displaying an active filter
const ActiveFilterPill: React.FC<{ label: string; onRemove: () => void; colorClasses: string }> = ({ label, onRemove, colorClasses }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.5, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.5, x: -10 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${colorClasses}`}
  >
    <span>{label}</span>
    <button onClick={onRemove} className="icon-interactive rounded-full hover:bg-black/20 p-0.5 transition-colors">
      <FiX size={14} />
    </button>
  </motion.div>
);

// Custom dropdown for filtering
const FilterDropdown: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  icon: React.ReactNode;
}> = ({ label, options, selectedValue, onSelect, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = selectedValue !== 'all';

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`icon-interactive flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 ${
          isActive
            ? 'bg-brand-primary text-white border-transparent shadow-md'
            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
        }`}
      >
        {icon}
        <span>{label}</span>
        <FiChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-10 overflow-hidden border border-gray-200 dark:border-gray-600"
          >
            <ul className="max-h-72 overflow-y-auto">
                <li key="all">
                    <button onClick={() => { onSelect('all'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                        ทั้งหมด
                    </button>
                </li>
              {options.map(option => (
                <li key={option.value}>
                  <button
                    onClick={() => { onSelect(option.value); setIsOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      selectedValue === option.value
                        ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// --- ORIGINAL COMPONENTS ---

interface TaskDashboardProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  filter: 'all' | 'starred';
  initialFilters: { [key: string]: string };
  clearInitialFilters: () => void;
  onSelectTask: (task: Task) => void;
}

interface TaskCardProps {
  task: Task;
  teamMembers: TeamMember[];
  onEdit: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, teamMembers, onEdit, onToggleStar, onDelete }) => {
    const assignee = teamMembers.find(m => m.id === task.assigneeId);
    const { bg, text, border } = TASK_TYPE_COLORS[task.taskType] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-400' };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            whileHover={{ 
                y: -12, 
                scale: 1.05, 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col justify-between overflow-hidden border-t-4 ${border}`}
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-500 dark:text-gray-400 text-sm pt-1">{task.id}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${bg} ${text}`}>{task.taskType}</span>
                        <div className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${TASK_STATUS_COLORS[task.status]}`}>{task.status}</div>
                    </div>
                </div>
                
                <h3 className="font-bold text-lg mt-1 truncate">{task.taskTitle}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 h-10 overflow-hidden text-ellipsis">{task.taskDescription}</p>
                 <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <p><strong>ผู้ขอ:</strong> {task.requesterName} ({task.department})</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex justify-between items-end text-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                            <FiCalendar size={14} />
                            <span>วันที่สั่ง: {new Date(task.timestamp).toLocaleDateString('th-TH')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-500 font-medium">
                            <FiCalendar size={14} />
                            <span>กำหนดส่ง: {new Date(task.dueDate).toLocaleDateString('th-TH')}</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        {assignee ? (
                           <>
                               <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full object-cover"/>
                               <span className="text-gray-600 dark:text-gray-300">{assignee.name.split(' ')[0]}</span>
                           </>
                        ) : (
                           <div className="flex items-center gap-2 text-gray-400">
                               <FiUser size={14} />
                               <span>ยังไม่มอบหมาย</span>
                           </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                    <button onClick={onToggleStar} aria-label={task.isStarred ? 'Remove from favorites' : 'Add to favorites'} className={`icon-interactive p-2 rounded-full transition-colors ${task.isStarred ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        <FiStar className={`${task.isStarred ? 'fill-current' : ''}`}/>
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onEdit} className="icon-interactive flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-md text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                            <FiEdit3 size={14} /> แก้ไข
                        </button>
                        <button onClick={onDelete} className="icon-interactive flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 rounded-md text-sm hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                            <FiTrash2 size={14}/> ลบ
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


const TaskDashboard: React.FC<TaskDashboardProps> = ({ tasks, teamMembers, filter, initialFilters, clearInitialFilters, onSelectTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ status: string; type: string; assignee: string }>({ status: 'all', type: 'all', assignee: 'all' });
  const [sort, setSort] = useState('newest');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
        setFilters(prev => ({ ...prev, ...initialFilters }));
        clearInitialFilters();
    }
  }, [initialFilters, clearInitialFilters]);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    if (filter === 'starred') {
      filtered = filtered.filter(t => t.isStarred);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.requesterName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.taskType === filters.type);
    }
    if (filters.assignee !== 'all') {
      filtered = filtered.filter(t => t.assigneeId === filters.assignee);
    }

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'newest': return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest': return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'dueDate': return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'id': return a.id.localeCompare(b.id);
        default: return 0;
      }
    });
  }, [tasks, filter, searchTerm, filters, sort]);

  const handleToggleStar = async (taskId: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (taskToUpdate) {
        await updateTask({ ...taskToUpdate, isStarred: !taskToUpdate.isStarred });
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    await deleteTask(taskToDelete.id);
    setTaskToDelete(null);
  };

  const getStatusPillColor = (status: TaskStatus) => {
    switch (status) {
        case TaskStatus.NOT_STARTED: return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
        case TaskStatus.IN_PROGRESS: return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-500/50 dark:text-yellow-200';
        case TaskStatus.COMPLETED: return 'bg-green-200 text-green-800 dark:bg-green-500/50 dark:text-green-200';
        case TaskStatus.CANCELLED: return 'bg-red-200 text-red-800 dark:bg-red-500/50 dark:text-red-200';
        default: return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
    }
  };

  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all' || filters.assignee !== 'all';

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6">
        <div className="relative mb-4">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="ค้นหา ID, ชื่องาน, ผู้ขอ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown 
                label="สถานะ"
                icon={<FiTag size={16} />}
                options={Object.values(TaskStatus).map(s => ({ value: s, label: s }))}
                selectedValue={filters.status}
                onSelect={value => setFilters({...filters, status: value})}
            />
            <FilterDropdown 
                label="ประเภทงาน"
                icon={<FiGrid size={16} />}
                options={Object.values(TaskType).map(t => ({ value: t, label: t }))}
                selectedValue={filters.type}
                onSelect={value => setFilters({...filters, type: value})}
            />
            <FilterDropdown 
                label="ผู้รับผิดชอบ"
                icon={<FiUser size={16} />}
                options={teamMembers.map(m => ({ value: m.id, label: m.name }))}
                selectedValue={filters.assignee}
                onSelect={value => setFilters({...filters, assignee: value})}
            />
            <div className="flex-grow"></div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">เรียงตาม:</span>
                <select value={sort} onChange={e => setSort(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-brand-primary">
                    <option value="newest">ใหม่สุด</option>
                    <option value="oldest">เก่าสุด</option>
                    <option value="dueDate">กำหนดส่ง</option>
                    <option value="id">รหัสงาน</option>
                </select>
            </div>
        </div>
        <AnimatePresence>
        {hasActiveFilters && (
            <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="pt-4 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">ตัวกรอง:</span>
                    {filters.status !== 'all' && (
                        <ActiveFilterPill 
                            label={`สถานะ: ${filters.status}`}
                            onRemove={() => setFilters({...filters, status: 'all'})}
                            colorClasses={getStatusPillColor(filters.status as TaskStatus)}
                        />
                    )}
                    {filters.type !== 'all' && (
                        <ActiveFilterPill 
                            label={`ประเภท: ${filters.type}`}
                            onRemove={() => setFilters({...filters, type: 'all'})}
                            colorClasses={`${TASK_TYPE_COLORS[filters.type]?.bg || ''} ${TASK_TYPE_COLORS[filters.type]?.text || ''}`}
                        />
                    )}
                    {filters.assignee !== 'all' && (
                        <ActiveFilterPill 
                            label={`ผู้รับผิดชอบ: ${teamMembers.find(m => m.id === filters.assignee)?.name || ''}`}
                            onRemove={() => setFilters({...filters, assignee: 'all'})}
                            colorClasses="bg-blue-100 text-blue-800 dark:bg-blue-500/30 dark:text-blue-200"
                        />
                    )}
                </div>
            </motion.div>
        )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              teamMembers={teamMembers} 
              onEdit={() => onSelectTask(task)}
              onToggleStar={() => handleToggleStar(task.id)}
              onDelete={() => setTaskToDelete(task)}
            />
          ))}
        </div>
      </AnimatePresence>
      
      {filteredAndSortedTasks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>ไม่พบงานที่ตรงกับเงื่อนไข</p>
        </div>
      )}

      <AnimatePresence>
        {taskToDelete && (
          <ConfirmationModal
            onClose={() => setTaskToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="ยืนยันการลบงาน"
            message={
              <>
                คุณแน่ใจหรือไม่ว่าต้องการลบงาน: <br />
                <strong className="font-semibold text-gray-800 dark:text-gray-200">"{taskToDelete.taskTitle}" ({taskToDelete.id})</strong>?
                <br />
                การกระทำนี้ไม่สามารถย้อนกลับได้
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

export default TaskDashboard;