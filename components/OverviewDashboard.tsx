


import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { FiArchive, FiCheckCircle, FiClock, FiLoader, FiUsers, FiXCircle, FiUser } from 'react-icons/fi';
import { Task, TeamMember, TaskStatus, TaskType } from '../types';
import { TASK_TYPE_COLORS } from '../constants';

interface OverviewDashboardProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onSetFilters: (filters: { [key: string]: string }) => void;
  onSelectTask: (task: Task) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; gradient: string; onClick?: () => void }> = ({ icon, title, value, gradient, onClick }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' }}
    className={`p-6 rounded-xl shadow-lg flex items-center gap-4 text-white cursor-pointer interactive-glow ${gradient}`}
    onClick={onClick}
  >
    <div className="bg-white/20 p-3 rounded-full">
      {icon}
    </div>
    <div>
      <p className="opacity-80 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  </motion.div>
);

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


const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ tasks, teamMembers, onSetFilters, onSelectTask }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const notStartedTasks = tasks.filter(t => t.status === TaskStatus.NOT_STARTED).length;
  const cancelledTasks = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;

  const statusData = [
    { name: TaskStatus.COMPLETED, value: completedTasks, color: '#10b981' },
    { name: TaskStatus.IN_PROGRESS, value: inProgressTasks, color: '#f59e0b' },
    { name: TaskStatus.NOT_STARTED, value: notStartedTasks, color: '#6b7280' },
    { name: TaskStatus.CANCELLED, value: cancelledTasks, color: '#ef4444' },
  ];

  const taskTypeData = Object.values(TaskType)
    .map(type => ({
      name: type,
      count: tasks.filter(t => t.taskType === type).length,
      fill: TASK_TYPE_COLORS[type]?.hex || '#8884d8',
    }))
    .filter(item => item.count > 0);
  
  const upcomingTasks = tasks
    .filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && new Date(t.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const newestTasks = tasks
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const memberWorkload = teamMembers.map(member => ({
    id: member.id,
    name: member.name,
    tasks: tasks.filter(t => t.assigneeId === member.id && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length
  }));

  const handlePieClick = (data: any) => {
     onSetFilters({ status: data.name });
  };
  
  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      onSetFilters({ type: data.activePayload[0].payload.name });
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <StatCard icon={<FiArchive size={24}/>} title="งานทั้งหมด" value={totalTasks} gradient="bg-gradient-to-br from-purple-500 to-indigo-600" />
         <StatCard icon={<FiUsers size={24} />} title="สมาชิกในทีม" value={teamMembers.length} gradient="bg-gradient-to-br from-sky-500 to-cyan-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<FiClock size={24}/>} title="ยังไม่ดำเนินการ" value={notStartedTasks} gradient="bg-gradient-to-br from-gray-500 to-slate-600" onClick={() => onSetFilters({ status: TaskStatus.NOT_STARTED })} />
        <StatCard icon={<FiLoader size={24}/>} title="กำลังดำเนินการ" value={inProgressTasks} gradient="bg-gradient-to-br from-yellow-500 to-amber-600" onClick={() => onSetFilters({ status: TaskStatus.IN_PROGRESS })} />
        <StatCard icon={<FiCheckCircle size={24}/>} title="เสร็จสิ้น" value={completedTasks} gradient="bg-gradient-to-br from-green-500 to-emerald-600" onClick={() => onSetFilters({ status: TaskStatus.COMPLETED })} />
        <StatCard icon={<FiXCircle size={24}/>} title="ยกเลิก" value={cancelledTasks} gradient="bg-gradient-to-br from-red-500 to-rose-600" onClick={() => onSetFilters({ status: TaskStatus.CANCELLED })} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg interactive-glow">
          <h3 className="font-bold text-lg mb-4">สัดส่วนสถานะงาน</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill="#8884d8" labelLine={{ stroke: 'currentColor' }} className="text-gray-500 dark:text-dark-text-muted" onClick={handlePieClick}>
                {statusData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} className="cursor-pointer focus:outline-none" />)}
              </Pie>
              {/* FIX: Removed invalid `className` prop and `itemStyle` to fix TS error and dark mode text color. Text color is now handled by `wrapperClassName`. */}
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} wrapperClassName="dark:!bg-dark-card dark:!border-dark-border dark:!text-dark-text" />
              <Legend wrapperStyle={{cursor: 'pointer'}} onClick={(e) => onSetFilters({status: e.value})}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg interactive-glow">
          <h3 className="font-bold text-lg mb-4">จำนวนงานแต่ละประเภท</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskTypeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" className="dark:stroke-dark-border" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} className="dark:!fill-dark-text-muted" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} className="dark:!fill-dark-text-muted"/>
              {/* FIX: Added `dark:!text-dark-text` to wrapperClassName for consistent dark mode styling. */}
              <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} wrapperClassName="dark:!bg-dark-card dark:!border-dark-border dark:!text-dark-text" contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
              <Bar dataKey="count" name="จำนวนงาน" className="cursor-pointer">
                {taskTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg interactive-glow">
                <h3 className="font-bold text-lg mb-4">🔔 งานใหม่ล่าสุด</h3>
                <ul className="space-y-1">
                    {newestTasks.length > 0 ? newestTasks.map(task => (
                        <li key={task.id} className="flex justify-between items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-muted cursor-pointer" onClick={() => onSelectTask(task)}>
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold truncate">{task.taskTitle}</p>
                                <p className="text-sm text-gray-500 dark:text-dark-text-muted">{task.id}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                                <p className="text-sm text-gray-500 dark:text-dark-text-muted">{new Date(task.timestamp).toLocaleDateString('th-TH')}</p>
                            </div>
                        </li>
                    )) : <p className="text-center text-gray-500 dark:text-dark-text-muted italic py-4">ไม่มีงานใหม่</p>}
                </ul>
            </div>
            <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg interactive-glow">
                <h3 className="font-bold text-lg mb-4">🗓️ งานที่ใกล้ครบกำหนด</h3>
                <ul className="space-y-1">
                    {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                        <li key={task.id} className="flex justify-between items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-muted cursor-pointer" onClick={() => onSelectTask(task)}>
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold truncate">{task.taskTitle}</p>
                                <p className="text-sm text-gray-500 dark:text-dark-text-muted">{task.id}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                                <p className="text-sm font-medium text-red-500">{new Date(task.dueDate).toLocaleDateString('th-TH')}</p>
                            </div>
                        </li>
                    )) : <p className="text-center text-gray-500 dark:text-dark-text-muted italic py-4">ไม่มีงานที่ใกล้ครบกำหนด</p>}
                </ul>
            </div>
        </div>
        <div className="lg:col-span-1 bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg interactive-glow">
          <h3 className="font-bold text-lg mb-4">ภาระงานของสมาชิก</h3>
           <ul className="space-y-1">
            {memberWorkload.map(member => (
                <li key={member.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-muted cursor-pointer" onClick={() => onSetFilters({ assignee: member.id })}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorForString(member.id)} flex-shrink-0`}>
                           <FiUser size={20} className="text-white" />
                        </div>
                        <p className="font-semibold">{member.name}</p>
                    </div>
                    <p className="text-sm font-medium text-brand-primary dark:text-dark-accent">{member.tasks} งาน</p>
                </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;