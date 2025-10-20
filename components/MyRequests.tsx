import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiClock, FiCalendar, FiBriefcase } from 'react-icons/fi';
import { Task, TaskStatus } from '../types';
import { TASK_STATUS_COLORS } from '../constants';

interface MyRequestsProps {
  tasks: Task[];
  userEmail: string;
}

const MyRequests: React.FC<MyRequestsProps> = ({ tasks, userEmail }) => {
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  
  useEffect(() => {
    if (userEmail) {
      const filtered = tasks.filter(t => t.requesterEmail.toLowerCase() === userEmail.toLowerCase())
                           .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setUserTasks(filtered);
    }
  }, [tasks, userEmail]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredTasks(userTasks);
    } else {
      setFilteredTasks(userTasks.filter(t => t.status === statusFilter));
    }
  }, [statusFilter, userTasks]);
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold">ติดตามสถานะงาน ({userTasks.length})</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">แสดงรายการสำหรับ: {userEmail}</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', ...Object.values(TaskStatus)] as const).map(status => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`icon-interactive px-4 py-2 rounded-full text-sm font-semibold transition-colors ${statusFilter === status ? 'bg-brand-secondary text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {status === 'all' ? 'ทั้งหมด' : status}
            </button>
        ))}
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
                className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md border-l-4"
                style={{ borderLeftColor: TASK_STATUS_COLORS[task.status].replace('bg-', '').split('-')[0] }}
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
                <div className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${TASK_STATUS_COLORS[task.status]} text-center flex-shrink-0`}>
                    {task.status}
                </div>
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{task.taskDescription}</p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2"><FiFileText /> <strong>ประเภท:</strong> {task.taskType}</span>
                <span className="flex items-center gap-2"><FiClock /> <strong>วันที่แจ้ง:</strong> {new Date(task.timestamp).toLocaleDateString('th-TH')}</span>
                <span className="flex items-center gap-2"><FiCalendar /> <strong>กำหนดส่ง:</strong> {new Date(task.dueDate).toLocaleDateString('th-TH')}</span>
                </div>
            </motion.div>
            )) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">ไม่พบงานที่ตรงกับเงื่อนไข</p>}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyRequests;