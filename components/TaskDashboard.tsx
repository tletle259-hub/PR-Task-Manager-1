import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiStar, FiEdit3, FiTrash2, FiCalendar, FiUser, FiTag, FiChevronDown, FiX, FiAlertTriangle, FiFilter, FiBriefcase, FiGrid, FiList, FiLayout } from 'react-icons/fi';
import { Task, TeamMember, TaskStatus, TaskType } from '../types';
import { TASK_STATUS_COLORS, TASK_TYPE_COLORS, MONTH_NAMES_TH } from '../constants';
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

// --- Color generation for user icons ---
const BG_COLORS = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500'
];

const getColorForString = (str: string) => {
  let hash = 0;
  if (!str || str.length === 0) return BG_COLORS[0];
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash % BG_COLORS.length);
  return BG_COLORS[index];
};


const formatToYyyyMmDd = (date: Date) => date.toISOString().split('T')[0];

const initialFilterState = { status: 'all', type: 'all', assignee: 'all' };
const initialDateFilterState = {
    type: 'timestamp',
    period: 'all',
    date: formatToYyyyMmDd(new Date()),
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
};

// --- NEW FILTER PANEL COMPONENT ---
const FilterPanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (newFilters: typeof initialFilterState, newDateFilter: typeof initialDateFilterState) => void;
    currentFilters: typeof initialFilterState;
    currentDateFilter: typeof initialDateFilterState;
    teamMembers: TeamMember[];
    availableYears: number[];
}> = ({ isOpen, onClose, onApply, currentFilters, currentDateFilter, teamMembers, availableYears }) => {
    const [tempFilters, setTempFilters] = useState(currentFilters);
    const [tempDateFilter, setTempDateFilter] = useState(currentDateFilter);
    
    useEffect(() => {
        setTempFilters(currentFilters);
        setTempDateFilter(currentDateFilter);
    }, [isOpen, currentFilters, currentDateFilter]);

    const handleApply = () => {
        onApply(tempFilters, tempDateFilter);
        onClose();
    };

    const handleClear = () => {
        setTempFilters(initialFilterState);
        setTempDateFilter(initialDateFilterState);
    };

    const handleDateFilterChange = (field: string, value: any) => {
        setTempDateFilter(prev => ({ ...prev, [field]: value }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                 <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/60 z-30"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-dark-card shadow-2xl z-40 flex flex-col"
                    >
                        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
                            <h3 className="text-lg font-bold">ตัวกรอง</h3>
                            <button onClick={onClose} className="icon-interactive p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-muted">
                                <FiX />
                            </button>
                        </header>
                        <main className="p-6 overflow-y-auto flex-grow space-y-6">
                            <FilterSection title="สถานะ">
                                <select value={tempFilters.status} onChange={e => setTempFilters({...tempFilters, status: e.target.value})} className="filter-select">
                                    <option value="all">ทั้งหมด</option>
                                    {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </FilterSection>
                             <FilterSection title="ประเภทงาน">
                                <select value={tempFilters.type} onChange={e => setTempFilters({...tempFilters, type: e.target.value})} className="filter-select">
                                    <option value="all">ทั้งหมด</option>
                                    {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </FilterSection>
                             <FilterSection title="ผู้รับผิดชอบ">
                                <select value={tempFilters.assignee} onChange={e => setTempFilters({...tempFilters, assignee: e.target.value})} className="filter-select">
                                    <option value="all">ทั้งหมด</option>
                                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </FilterSection>
                            <FilterSection title="วันที่">
                                <div className="space-y-4">
                                    <select value={tempDateFilter.type} onChange={e => handleDateFilterChange('type', e.target.value)} className="filter-select">
                                        <option value="timestamp">วันที่สั่ง</option>
                                        <option value="dueDate">กำหนดส่ง</option>
                                    </select>
                                    <select value={tempDateFilter.period} onChange={e => handleDateFilterChange('period', e.target.value)} className="filter-select">
                                        <option value="all">ทั้งหมด</option>
                                        <option value="day">รายวัน</option>
                                        <option value="month">รายเดือน</option>
                                        <option value="year">รายปี</option>
                                    </select>
                                    
                                    {tempDateFilter.period === 'day' && (
                                        <input type="date" value={tempDateFilter.date} onChange={e => handleDateFilterChange('date', e.target.value)} className="filter-select"/>
                                    )}
                                    {tempDateFilter.period === 'month' && (
                                        <div className="flex gap-2">
                                            <select value={tempDateFilter.month} onChange={e => handleDateFilterChange('month', parseInt(e.target.value))} className="filter-select w-full">
                                                {MONTH_NAMES_TH.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                            </select>
                                            <select value={tempDateFilter.year} onChange={e => handleDateFilterChange('year', parseInt(e.target.value))} className="filter-select w-full">
                                                {availableYears.map(y => <option key={y} value={y}>ปี {y + 543}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {tempDateFilter.period === 'year' && (
                                        <select value={tempDateFilter.year} onChange={e => handleDateFilterChange('year', parseInt(e.target.value))} className="filter-select">
                                            {availableYears.map(y => <option key={y} value={y}>ปี {y + 543}</option>)}
                                        </select>
                                    )}
                                </div>
                            </FilterSection>
                        </main>
                        <footer className="p-4 border-t border-gray-200 dark:border-dark-border flex-shrink-0 flex gap-3">
                            <button onClick={handleClear} className="w-full text-center px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-muted font-semibold transition-colors">ล้างตัวกรอง</button>
                            <button onClick={handleApply} className="w-full text-center px-4 py-2.5 rounded-lg bg-brand-primary text-white hover:opacity-90 font-bold transition-opacity">ใช้ตัวกรอง</button>
                        </footer>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

const FilterSection: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
    <div>
        <h4 className="text-sm font-semibold text-gray-500 dark:text-dark-text-muted mb-2">{title}</h4>
        {children}
    </div>
);


// --- TASK VIEW COMPONENTS ---

type ViewMode = 'card' | 'list' | 'column';

interface TaskDashboardProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  filter: 'all' | 'starred';
  initialFilters: { [key: string]: string };
  clearInitialFilters: () => void;
  onSelectTask: (task: Task) => void;
}

const TaskCard: React.FC<{ task: Task; teamMembers: TeamMember[]; onSelectTask: (task: Task) => void; onToggleStar: () => void; onDelete: () => void; isCompact?: boolean; }> = ({ task, teamMembers, onSelectTask, onToggleStar, onDelete, isCompact = false }) => {
    const assignee = teamMembers.find(m => m.id === task.assigneeId);
    const { bg, text, border } = TASK_TYPE_COLORS[task.taskType] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-400' };
    
    return (
        <motion.div
            layout="position"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            whileHover={!isCompact ? { y: -12, scale: 1.05, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`bg-white dark:bg-dark-card rounded-xl shadow-lg flex flex-col justify-between overflow-hidden border-t-4 ${border} interactive-glow`}
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-400 dark:text-dark-text-muted text-sm pt-1">{task.id}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${bg} ${text}`}>{task.taskType}</span>
                        {!isCompact && <div className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${TASK_STATUS_COLORS[task.status]}`}>{task.status}</div>}
                    </div>
                </div>
                
                 {task.projectName && (
                    <div className="mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 dark:text-purple-200 dark:bg-purple-900/50 rounded-md">
                            <FiBriefcase size={12} />
                            {task.projectName}
                        </span>
                    </div>
                )}
                
                <h3 className="font-bold text-lg mt-1 truncate">{task.taskTitle}</h3>
                {!isCompact && <p className="text-sm text-gray-500 dark:text-dark-text-muted h-10 overflow-hidden text-ellipsis">{task.taskDescription}</p>}
                <div className="mt-3 text-xs text-gray-500 dark:text-dark-text-muted">
                    <p><strong>ผู้ขอ:</strong> {task.requesterName} ({task.department})</p>
                </div>
            </div>
            <div className={`mt-4 pt-4 border-t border-gray-100 dark:border-dark-border p-5 ${isCompact ? 'bg-white dark:bg-dark-card' : 'bg-gray-50 dark:bg-dark-card/50'}`}>
                <div className="flex justify-between items-end text-sm">
                     <div className="space-y-1">
                        {!isCompact && <div className="flex items-center gap-2 text-gray-500 dark:text-dark-text-muted text-xs">
                            <FiCalendar size={14} />
                            <span>วันที่สั่ง: {new Date(task.timestamp).toLocaleDateString('th-TH')}</span>
                        </div>}
                        <div className="flex items-center gap-2 text-red-500 font-medium">
                            <FiCalendar size={14} />
                            <span>กำหนดส่ง: {new Date(task.dueDate).toLocaleDateString('th-TH')}</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        {assignee ? (
                           <>
                               <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getColorForString(assignee.id)} flex-shrink-0`}>
                                   <FiUser size={14} className="text-white" />
                               </div>
                               <span className="text-gray-800 dark:text-dark-text">{assignee.name.split(' ')[0]}</span>
                           </>
                        ) : (
                           <div className="flex items-center gap-2 text-gray-400 dark:text-dark-text-muted">
                               <FiUser size={14} />
                               <span>ยังไม่มอบหมาย</span>
                           </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                    <button onClick={onToggleStar} aria-label={task.isStarred ? 'Remove from favorites' : 'Add to favorites'} className={`icon-interactive p-2 rounded-full transition-colors ${task.isStarred ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50' : 'text-gray-400 dark:text-dark-text-muted hover:bg-gray-200 dark:hover:bg-dark-muted'}`}>
                        <FiStar className={`${task.isStarred ? 'fill-current' : ''}`}/>
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => onSelectTask(task)} className="icon-interactive flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-md text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                            <FiEdit3 size={14} /> แก้ไข
                        </button>
                        <button onClick={onDelete} className="icon-interactive flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-md text-sm hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                            <FiTrash2 size={14}/> ลบ
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const TaskListItem: React.FC<{ task: Task; teamMembers: TeamMember[]; onSelectTask: (task: Task) => void; onToggleStar: () => void; onDelete: () => void; }> = ({ task, teamMembers, onSelectTask, onToggleStar, onDelete }) => {
    const assignee = teamMembers.find(m => m.id === task.assigneeId);
    const { bg, text } = TASK_TYPE_COLORS[task.taskType] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
         <motion.div
            layout="position"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-white dark:bg-dark-card rounded-lg shadow p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
            <div className="flex items-center gap-3 flex-grow min-w-0">
                 <button onClick={onToggleStar} aria-label="Toggle star" className={`icon-interactive flex-shrink-0 p-2 rounded-full transition-colors ${task.isStarred ? 'text-yellow-500' : 'text-gray-400 dark:text-dark-text-muted hover:text-yellow-500'}`}>
                    <FiStar size={20} className={`${task.isStarred ? 'fill-current' : ''}`}/>
                </button>
                 <div className="min-w-0 flex-grow">
                    <p className="text-xs text-gray-500 dark:text-dark-text-muted">{task.id}</p>
                    <p className="font-bold truncate text-gray-800 dark:text-dark-text">{task.taskTitle}</p>
                    {task.projectName && (
                        <div className="mt-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 dark:text-purple-200 dark:bg-purple-900/50 rounded-md">
                                <FiBriefcase size={12} />
                                {task.projectName}
                            </span>
                        </div>
                    )}
                 </div>
            </div>
             <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-6 gap-y-2 text-sm w-full sm:w-auto sm:justify-end">
                 <div className={`px-2 py-1 text-xs font-semibold rounded-full ${bg} ${text}`}>{task.taskType}</div>
                 
                 <div className="flex items-center gap-2 w-32">
                     {assignee ? (
                           <>
                               <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getColorForString(assignee.id)} flex-shrink-0`}>
                                   <FiUser size={14} className="text-white" />
                               </div>
                               <span className="text-gray-800 dark:text-dark-text truncate">{assignee.name}</span>
                           </>
                        ) : (
                           <div className="flex items-center gap-2 text-gray-400 dark:text-dark-text-muted">
                               <FiUser size={14} />
                               <span>ยังไม่มอบหมาย</span>
                           </div>
                        )}
                 </div>

                 <div className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${TASK_STATUS_COLORS[task.status]} w-24 text-center`}>{task.status}</div>
                 
                 <div className="text-red-500 font-medium w-28 text-left sm:text-right">
                    <span>{new Date(task.dueDate).toLocaleDateString('th-TH')}</span>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => onSelectTask(task)} className="icon-interactive p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><FiEdit3 /></button>
                    <button onClick={onDelete} className="icon-interactive p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><FiTrash2 /></button>
                </div>
            </div>
         </motion.div>
    );
};

const TaskDashboard: React.FC<TaskDashboardProps> = ({ tasks, teamMembers, filter, initialFilters, clearInitialFilters, onSelectTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState(initialFilterState);
  const [dateFilter, setDateFilter] = useState(initialDateFilterState);
  const [sort, setSort] = useState('newest');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
        setFilters(prev => ({ ...prev, ...initialFilters }));
        clearInitialFilters();
    }
  }, [initialFilters, clearInitialFilters]);
  
  const availableYears = useMemo(() => {
    const years = new Set(tasks.map(t => new Date(t.timestamp).getFullYear()));
    if (!years.has(new Date().getFullYear())) {
        years.add(new Date().getFullYear());
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    if (filter === 'starred') {
      filtered = filtered.filter(t => t.isStarred);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.projectName && t.projectName.toLowerCase().includes(searchTerm.toLowerCase()))
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

    if (dateFilter.period !== 'all') {
        filtered = filtered.filter(task => {
            const dateString = dateFilter.type === 'timestamp' ? task.timestamp : task.dueDate;
            if (dateFilter.period === 'day') {
                return dateString.startsWith(dateFilter.date);
            }
            const dateToCompare = new Date(dateString); 
            if (dateFilter.period === 'month') {
                return dateToCompare.getUTCFullYear() === dateFilter.year && dateToCompare.getUTCMonth() === dateFilter.month;
            }
            if (dateFilter.period === 'year') {
                return dateToCompare.getUTCFullYear() === dateFilter.year;
            }
            return true;
        });
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
  }, [tasks, filter, searchTerm, filters, sort, dateFilter]);

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
  
  const handleApplyFilters = (newFilters: typeof initialFilterState, newDateFilter: typeof initialDateFilterState) => {
      setFilters(newFilters);
      setDateFilter(newDateFilter);
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
  
  const getDateFilterLabel = () => {
    if (dateFilter.period === 'all') return '';
    const dateTypeLabel = dateFilter.type === 'timestamp' ? 'วันที่สั่ง' : 'กำหนดส่ง';
    if (dateFilter.period === 'day') {
        const d = new Date(dateFilter.date);
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        return `${dateTypeLabel}: ${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (dateFilter.period === 'month') {
        return `${dateTypeLabel}: ${MONTH_NAMES_TH[dateFilter.month]} ${dateFilter.year + 543}`;
    }
    if (dateFilter.period === 'year') {
        return `${dateTypeLabel}: ปี ${dateFilter.year + 543}`;
    }
    return 'วันที่';
  };


  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all' || filters.assignee !== 'all' || dateFilter.period !== 'all';
  
  const renderTasks = () => {
      if (filteredAndSortedTasks.length === 0) {
          return <div className="text-center py-12 text-gray-500 dark:text-dark-text-muted"><p>ไม่พบงานที่ตรงกับเงื่อนไข</p></div>;
      }

      switch(viewMode) {
          case 'list':
              return (
                  <div className="space-y-3">
                    {filteredAndSortedTasks.map(task => (
                        <TaskListItem
                            key={task.id}
                            task={task}
                            teamMembers={teamMembers}
                            onSelectTask={onSelectTask}
                            onToggleStar={() => handleToggleStar(task.id)}
                            onDelete={() => setTaskToDelete(task)}
                        />
                    ))}
                  </div>
              );

          case 'column':
               const columnOrder: TaskStatus[] = [TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED];
               const tasksByStatus = columnOrder.reduce((acc, status) => {
                   acc[status] = filteredAndSortedTasks.filter(t => t.status === status);
                   return acc;
               }, {} as Record<TaskStatus, Task[]>);

              return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {columnOrder.map(status => (
                        <div key={status} className="bg-gray-100 dark:bg-dark-bg rounded-lg p-3">
                            <h3 className="font-bold text-center mb-3 p-2 rounded-md text-white" style={{ backgroundColor: TASK_STATUS_COLORS[status].replace('bg-', '').split('-')[0] }}>
                                {status} ({tasksByStatus[status].length})
                            </h3>
                            <div className="space-y-3 h-[calc(100vh-20rem)] overflow-y-auto p-1">
                                {tasksByStatus[status].map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        teamMembers={teamMembers}
                                        onSelectTask={onSelectTask}
                                        onToggleStar={() => handleToggleStar(task.id)}
                                        onDelete={() => setTaskToDelete(task)}
                                        isCompact={true}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                  </div>
              );
              
          case 'card':
          default:
              return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredAndSortedTasks.map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          teamMembers={teamMembers} 
                          onSelectTask={onSelectTask}
                          onToggleStar={() => handleToggleStar(task.id)}
                          onDelete={() => setTaskToDelete(task)}
                        />
                      ))}
                  </div>
              );
      }
  };

  return (
    <div>
      <style>{`
        .filter-select {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          background-color: #f9fafb;
          font-size: 0.875rem;
        }
        .dark .filter-select {
          border-color: #4b5563;
          background-color: #374151;
        }
      `}</style>
      <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-md mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-muted" />
            <input type="text" placeholder="ค้นหา ID, ชื่องาน, ผู้ขอ, ชื่อโปรเจกต์..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 pl-12 border border-gray-300 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-bg focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-accent focus:outline-none" />
          </div>
           <div className="flex items-center gap-2 flex-shrink-0">
                <div className="p-1 bg-gray-200 dark:bg-dark-bg rounded-lg flex items-center">
                    {(['card', 'list', 'column'] as ViewMode[]).map(mode => (
                        <button key={mode} onClick={() => setViewMode(mode)} className={`p-2 rounded-md transition-colors ${viewMode === mode ? 'bg-white dark:bg-dark-muted shadow' : 'text-gray-500 dark:text-dark-text-muted hover:bg-white/50 dark:hover:bg-dark-muted/50'}`}>
                           {mode === 'card' && <FiGrid />}
                           {mode === 'list' && <FiList />}
                           {mode === 'column' && <FiLayout />}
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsFilterPanelOpen(true)} className="icon-interactive flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border bg-white dark:bg-dark-muted border-gray-300 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-border">
                    <FiFilter />
                    ตัวกรอง
                    {hasActiveFilters && <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>}
                </button>
                <select value={sort} onChange={e => setSort(e.target.value)} className="p-3 border border-gray-300 dark:border-dark-border rounded-lg bg-gray-100 dark:bg-dark-muted focus:ring-brand-primary dark:focus:ring-dark-accent text-sm">
                    <option value="newest">เรียง: ใหม่สุด</option>
                    <option value="oldest">เรียง: เก่าสุด</option>
                    <option value="dueDate">เรียง: กำหนดส่ง</option>
                    <option value="id">เรียง: รหัสงาน</option>
                </select>
            </div>
        </div>

        <AnimatePresence>
        {hasActiveFilters && (
            <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="pt-4 border-t border-gray-200 dark:border-dark-border overflow-hidden"
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-dark-text-muted mr-2">ตัวกรองที่ใช้:</span>
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
                     {dateFilter.period !== 'all' && (
                        <ActiveFilterPill 
                            label={getDateFilterLabel()}
                            onRemove={() => setDateFilter(initialDateFilterState)}
                            colorClasses="bg-purple-100 text-purple-800 dark:bg-purple-500/30 dark:text-purple-200"
                        />
                    )}
                </div>
            </motion.div>
        )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            {renderTasks()}
        </motion.div>
      </AnimatePresence>
      
      <FilterPanel 
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        currentDateFilter={dateFilter}
        teamMembers={teamMembers}
        availableYears={availableYears}
      />

      <AnimatePresence>
        {taskToDelete && (
          <ConfirmationModal
            onClose={() => setTaskToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="ยืนยันการลบงาน"
            message={
              <>
                คุณแน่ใจหรือไม่ว่าต้องการลบงาน: <br />
                <strong className="font-semibold text-gray-800 dark:text-dark-text">"{taskToDelete.taskTitle}" ({taskToDelete.id})</strong>?
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