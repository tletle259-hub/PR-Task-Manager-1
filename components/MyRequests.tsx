import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiClock, FiCalendar, FiBriefcase, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { Task, TaskStatus, TaskTypeConfig } from '../types';
import { TASK_STATUS_COLORS } from '../constants';

interface MyRequestsProps {
  tasks: Task[];
  userEmail: string;
  taskTypeConfigs: TaskTypeConfig[];
}

// --- NEW FILTER PANEL COMPONENT ---
const FilterPanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: { status: string; type: string; sortOrder: string }) => void;
    initialFilters: { status: string; type: string; sortOrder: string };
    isStatusVisible: boolean;
    taskTypeConfigs: TaskTypeConfig[];
}> = ({ isOpen, onClose, onApply, initialFilters, isStatusVisible, taskTypeConfigs }) => {
    const [tempFilters, setTempFilters] = useState(initialFilters);

    useEffect(() => {
        setTempFilters(initialFilters);
    }, [initialFilters, isOpen]);

    const handleApply = () => {
        onApply(tempFilters);
        onClose();
    };
    
    const handleClear = () => {
        setTempFilters({ status: 'all', type: 'all', sortOrder: 'newest' });
    }

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
                        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl z-40 flex flex-col"
                    >
                        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold">ตัวกรองและจัดเรียง</h3>
                            <button onClick={onClose} className="icon-interactive p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FiX />
                            </button>
                        </header>
                        <main className="p-6 flex-grow space-y-6 overflow-y-auto">
                            <div>
                                <label htmlFor="sortOrder" className="form-label">เรียงตาม</label>
                                <select id="sortOrder" value={tempFilters.sortOrder} onChange={e => setTempFilters({...tempFilters, sortOrder: e.target.value})} className="filter-select mt-1">
                                    <option value="newest">ใหม่สุด</option>
                                    <option value="oldest">เก่าสุด</option>
                                    <option value="dueDate">กำหนดส่ง</option>
                                </select>
                            </div>
                            {isStatusVisible && (
                                <div>
                                    <label htmlFor="statusFilter" className="form-label">สถานะ</label>
                                    <select id="statusFilter" value={tempFilters.status} onChange={e => setTempFilters({...tempFilters, status: e.target.value})} className="filter-select mt-1">
                                        <option value="all">ทั้งหมด</option>
                                        {Object.values(TaskStatus).map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                             <div>
                                <label htmlFor="typeFilter" className="form-label">ประเภทงาน</label>
                                 <select id="typeFilter" value={tempFilters.type} onChange={e => setTempFilters({...tempFilters, type: e.target.value})} className="filter-select mt-1">
                                     <option value="all">ทั้งหมด</option>
                                     {taskTypeConfigs.map(config => (
                                         <option key={config.id} value={config.name}>{config.name}</option>
                                     ))}
                                </select>
                            </div>
                        </main>
                        <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                            <button onClick={handleClear} className="w-full text-center px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-colors">ล้างค่า</button>
                            <button onClick={handleApply} className="w-full text-center px-4 py-2.5 rounded-lg bg-brand-secondary text-white hover:opacity-90 font-bold transition-opacity">ใช้ตัวกรอง</button>
                        </footer>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


const MyRequests: React.FC<MyRequestsProps> = ({ tasks, userEmail, taskTypeConfigs }) => {
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  // Control states
  const [filters, setFilters] = useState({ status: 'all', type: 'all', sortOrder: 'newest' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterPanelOpen, setFilterPanelOpen] = useState(false);
  const [isStatusVisible, setIsStatusVisible] = useState(true);

  // Effect to get system-wide visibility setting
  useEffect(() => {
    const visibilitySetting = localStorage.getItem('system_status_visibility');
    // Default to true (visible) if the setting is not found or not 'false'
    setIsStatusVisible(visibilitySetting !== 'false');
  }, []);

  // Effect to get user-specific tasks
  useEffect(() => {
    if (userEmail) {
      const filtered = tasks.filter(t => t.requesterEmail.toLowerCase() === userEmail.toLowerCase());
      setUserTasks(filtered);
    }
  }, [tasks, userEmail]);

  // Effect for filtering and sorting logic
  useEffect(() => {
    let processedTasks = [...userTasks];

    // 1. Filter by Status (only if visible)
    if (isStatusVisible && filters.status !== 'all') {
      processedTasks = processedTasks.filter(t => t.status === filters.status);
    }
    
    // 2. Filter by Type
    if (filters.type !== 'all') {
        processedTasks = processedTasks.filter(t => t.taskType === filters.type);
    }

    // 3. Filter by Search Term
    if (searchTerm.trim()) {
      const lowercasedSearch = searchTerm.toLowerCase();
      processedTasks = processedTasks.filter(t => 
        t.taskTitle.toLowerCase().includes(lowercasedSearch) ||
        t.id.toLowerCase().includes(lowercasedSearch) ||
        (t.projectName && t.projectName.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    // 4. Sort
    processedTasks.sort((a, b) => {
        switch (filters.sortOrder) {
            case 'oldest': return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            case 'dueDate': return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            case 'newest':
            default: return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
    });

    setFilteredTasks(processedTasks);
  }, [filters, searchTerm, userTasks, isStatusVisible]);
  
  const handleApplyFilters = (newFilters: { status: string; type: string; sortOrder: string }) => {
      setFilters(newFilters);
  };

  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all' || filters.sortOrder !== 'newest';
  const otherTaskTypeName = "งานชนิดอื่นๆ";

  return (
    <div>
       <style>{`
        .filter-select {
          width: 100%;
          padding: 0.65rem;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db; /* border-gray-300 */
          background-color: #f9fafb; /* bg-gray-50 */
          font-size: 0.875rem; /* text-sm */
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dark .filter-select {
          border-color: #4b5563; /* dark:border-gray-600 */
          background-color: #374151; /* dark:bg-gray-700 */
        }
        .filter-select:focus {
          outline: none;
          --tw-ring-color: #f97316; /* ring-brand-secondary */
          --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
          --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
          box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
        }
      `}</style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold">งานที่สั่งแล้ว ({userTasks.length})</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">แสดงรายการสำหรับ: {userEmail}</p>
      </div>

       <div className="mb-6 p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="relative flex-grow w-full">
                <label htmlFor="search" className="form-label">ค้นหา</label>
                <FiSearch className="absolute left-3 bottom-3 text-gray-400" />
                <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหา ID, ชื่องาน, โปรเจกต์..."
                    className="filter-select !pl-10 mt-1"
                />
            </div>
            <button 
                onClick={() => setFilterPanelOpen(true)}
                className="relative w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold transition-colors"
            >
                <FiFilter />
                <span>ตัวกรอง</span>
                {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full"></span>}
            </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <AnimatePresence>
            {filteredTasks.length > 0 ? filteredTasks.map(task => (
            <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md border-l-4 ${isStatusVisible ? '' : 'border-l-blue-500'}`}
                style={{ borderLeftColor: isStatusVisible ? TASK_STATUS_COLORS[task.status].replace('bg-', '').split('-')[0] : undefined }}
            >
                <div className="flex justify-between items-start">
                <div>
                    <span className="font-bold text-gray-500 dark:text-gray-400 text-sm">{task.id}</span>
                     {task.projectName && (
                        <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 dark:text-purple-200 dark:bg-purple-900/50 rounded-md">
                            <FiBriefcase size={12} />
                            {task.projectName}
                        </span>
                    )}
                    <h3 className="text-xl font-bold mt-1 text-brand-secondary">{task.taskTitle}</h3>
                </div>
                {isStatusVisible && (
                    <div className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${TASK_STATUS_COLORS[task.status]} text-center flex-shrink-0`}>
                        {task.status}
                    </div>
                )}
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{task.taskDescription}</p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2"><FiFileText /> <strong>ประเภท:</strong> {task.taskType === otherTaskTypeName ? task.otherTaskTypeName : task.taskType}</span>
                <span className="flex items-center gap-2"><FiClock /> <strong>วันที่แจ้ง:</strong> {new Date(task.timestamp).toLocaleDateString('th-TH')}</span>
                <span className="flex items-center gap-2"><FiCalendar /> <strong>กำหนดส่ง:</strong> {new Date(task.dueDate).toLocaleDateString('th-TH')}</span>
                </div>
            </motion.div>
            )) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">ไม่พบงานที่ตรงกับเงื่อนไข</p>}
        </AnimatePresence>
      </div>
      <FilterPanel 
        isOpen={isFilterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        isStatusVisible={isStatusVisible}
        taskTypeConfigs={taskTypeConfigs}
      />
    </div>
  );
};

export default MyRequests;