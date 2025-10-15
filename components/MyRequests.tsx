import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiClock, FiCalendar } from 'react-icons/fi';
import { Task, TaskStatus } from '../types';
import { TASK_STATUS_COLORS } from '../constants';

interface MyRequestsProps {
  tasks: Task[];
}

const MyRequests: React.FC<MyRequestsProps> = ({ tasks }) => {
  const [email, setEmail] = useState('');
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  
  useEffect(() => {
    const storedEmail = localStorage.getItem('requesterEmail');
    if (storedEmail) {
      setEmail(storedEmail);
      const filtered = tasks.filter(t => t.requesterEmail.toLowerCase() === storedEmail.toLowerCase());
      setUserTasks(filtered);
      setFilteredTasks(filtered);
    }
  }, [tasks]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredTasks(userTasks);
    } else {
      setFilteredTasks(userTasks.filter(t => t.status === statusFilter));
    }
  }, [statusFilter, userTasks]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if(newEmail.trim() === '') {
        localStorage.removeItem('requesterEmail');
        setUserTasks([]);
        setFilteredTasks([]);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('requesterEmail', email.toLowerCase());
    const filtered = tasks.filter(t => t.requesterEmail.toLowerCase() === email.toLowerCase());
    setUserTasks(filtered);
    setFilteredTasks(filtered);
  };
  
  if (!localStorage.getItem('requesterEmail')) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-4">ติดตามสถานะงานของคุณ</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">กรุณากรอกอีเมลที่ใช้ในการแจ้งงานเพื่อดูรายการงานของคุณ</p>
        <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="your.email@example.com"
            required
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-secondary focus:outline-none"
          />
          <button type="submit" className="icon-interactive bg-brand-secondary text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors">
            ค้นหา
          </button>
        </form>
         {email && userTasks.length === 0 && <p className="mt-4 text-red-500">ไม่พบงานสำหรับอีเมลนี้</p>}
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold">ติดตามสถานะงาน ({userTasks.length})</h2>
        <button onClick={() => { localStorage.removeItem('requesterEmail'); setEmail(''); }} className="text-sm text-blue-500 hover:underline flex-shrink-0">เปลี่ยนอีเมล</button>
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
                    <h3 className="text-xl font-bold mt-1 text-brand-secondary">{task.taskTitle}</h3>
                </div>
                <div className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${TASK_STATUS_COLORS[task.status]} text-center`}>
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