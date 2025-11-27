
// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArchive, FiCheckCircle, FiClock, FiLoader, FiUsers, FiXCircle, FiUser, FiDownload, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import { Task, TeamMember, TaskStatus, TaskTypeConfig } from '../types';

// --- HELPER FUNCTIONS ---
const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const formatToYyyyMmDd = (date: Date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
};
const MONTH_NAMES_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];


interface OverviewDashboardProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  taskTypeConfigs: TaskTypeConfig[];
  onSetFilters: (filters: { [key: string]: string }) => void;
  onSelectTask: (task: Task) => void;
}

// การ์ดแสดงสถิติตัวเลข
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
    hash = hash & hash;
  }
  const index = Math.abs(hash % BG_COLORS.length);
  return BG_COLORS[index];
};


const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ tasks, teamMembers, taskTypeConfigs, onSetFilters, onSelectTask }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'year' | 'month' | 'day'>('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(formatToYyyyMmDd(new Date()));
  
  const [exportStartDate, setExportStartDate] = useState(() => formatToYyyyMmDd(new Date(new Date().getFullYear(), 0, 1)));
  const [exportEndDate, setExportEndDate] = useState(() => formatToYyyyMmDd(new Date()));
  
  // คำนวณปีที่มีข้อมูล
  const availableYears = useMemo(() => {
    const years = new Set(tasks.map(t => new Date(t.timestamp).getFullYear()));
    if (!years.has(new Date().getFullYear())) {
        years.add(new Date().getFullYear());
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [tasks]);

  // กรองงานตามช่วงเวลาที่เลือก
  const filteredTasks = useMemo(() => {
    if (filterMode === 'all') return tasks;
    return tasks.filter(task => {
        const taskDate = new Date(task.timestamp);
        if (filterMode === 'year') {
            return taskDate.getFullYear() === selectedYear;
        }
        if (filterMode === 'month') {
            return taskDate.getFullYear() === selectedYear && taskDate.getMonth() === selectedMonth;
        }
        if (filterMode === 'day') {
            return formatToYyyyMmDd(taskDate) === selectedDate;
        }
        return true;
    });
  }, [tasks, filterMode, selectedYear, selectedMonth, selectedDate]);


  // คำนวณสถิติ
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const inProgressTasks = filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const notStartedTasks = filteredTasks.filter(t => t.status === TaskStatus.NOT_STARTED).length;
  const cancelledTasks = filteredTasks.filter(t => t.status === TaskStatus.CANCELLED).length;

  // ข้อมูลสำหรับกราฟวงกลม
  const statusData = [
    { name: TaskStatus.COMPLETED, value: completedTasks, color: '#10b981' },
    { name: TaskStatus.IN_PROGRESS, value: inProgressTasks, color: '#f59e0b' },
    { name: TaskStatus.NOT_STARTED, value: notStartedTasks, color: '#6b7280' },
    { name: TaskStatus.CANCELLED, value: cancelledTasks, color: '#ef4444' },
  ];

  // ข้อมูลสำหรับกราฟแท่ง
  const taskTypeData = (taskTypeConfigs || [])
    .map(config => ({
      name: config.name,
      count: filteredTasks.filter(t => t.taskType === config.name).length,
      fill: config.colorHex,
    }))
    .filter(item => item.count > 0);
  
  // Get local date string for comparison (YYYY-MM-DD)
  const now = new Date();
  const localTodayStr = [
        now.getFullYear(),
        ('0' + (now.getMonth() + 1)).slice(-2),
        ('0' + now.getDate()).slice(-2)
  ].join('-');

  // งานใกล้ถึงกำหนด (Future or Today)
  const upcomingTasks = tasks
    .filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && t.dueDate >= localTodayStr)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // งานที่เลยกำหนด (Past)
  const overdueTasks = tasks
    .filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && t.dueDate < localTodayStr)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const newestTasks = filteredTasks
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Update member workload to check array of assignees
  const memberWorkload = (teamMembers || []).map(member => ({
    id: member.id,
    name: member.name,
    tasks: filteredTasks.filter(t => (t.assigneeIds || []).includes(member.id) && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length
  }));

  const handlePieClick = (data: any) => {
     onSetFilters({ status: data.name });
  };
  
  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      onSetFilters({ type: data.activePayload[0].payload.name });
    }
  };

    const getExportDateRangeString = (): string => {
        const start = new Date(exportStartDate);
        const end = new Date(exportEndDate);
        start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
        end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
        const startStr = start.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        const endStr = end.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        return `ข้อมูลตั้งแต่วันที่ ${startStr} ถึงวันที่ ${endStr}`;
    };

    const getTasksInDateRange = () => {
      const start = new Date(exportStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(exportEndDate);
      end.setHours(23, 59, 59, 999);
      return tasks.filter(task => {
          const taskDate = new Date(task.timestamp);
          return taskDate >= start && taskDate <= end;
      });
    };

    const getFilename = (): string => {
        return `Task_Summary_Report_${exportStartDate}_to_${exportEndDate}`;
    };

    // ส่งออกเป็น CSV
    const handleExportCSV = () => {
        if (!exportStartDate || !exportEndDate) {
            alert("กรุณาเลือกช่วงวันที่ก่อนส่งออกรายงาน");
            return;
        }
        const tasksInDateRange = getTasksInDateRange();

        if (tasksInDateRange.length === 0) {
            alert("ไม่มีข้อมูลสำหรับส่งออกในช่วงเวลาที่เลือก");
            return;
        }
        
        const reportTitle = "สรุปรายงานภาระงานส่วนงานสื่อสารองค์กร";
        const dateRange = getExportDateRangeString();
        const exportDate = `วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`;

        let csvContent = `${reportTitle}\n${dateRange}\n${exportDate}\n\n`;

        // Team Overview Section
        const teamOverview = {
            "งานทั้งหมด": tasksInDateRange.length,
            "เสร็จสิ้น": tasksInDateRange.filter(t => t.status === TaskStatus.COMPLETED).length,
            "กำลังดำเนินการ": tasksInDateRange.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
            "ยังไม่ดำเนินการ": tasksInDateRange.filter(t => t.status === TaskStatus.NOT_STARTED).length,
            "ยกเลิก": tasksInDateRange.filter(t => t.status === TaskStatus.CANCELLED).length,
        };
        csvContent += "ภาพรวมของทีมทั้งหมด\n";
        csvContent += Object.keys(teamOverview).join(',') + '\n';
        csvContent += Object.values(teamOverview).map(val => `"${val}"`).join(',') + '\n\n';
        
        // Detailed Task List
        const taskDetailHeaders = ["รหัสงาน", "ชื่องาน", "สถานะ", "วันที่สั่งงาน", "กำหนดส่ง", "ผู้สั่งงาน", "ผู้รับผิดชอบ", "ตำแหน่งผู้รับผิดชอบ"];
        
        csvContent += "รายการงานทั้งหมด (รายบุคคล)\n";
        csvContent += taskDetailHeaders.join(',') + '\n';

        tasksInDateRange.forEach(task => {
            const assigneeIds = task.assigneeIds || [];
            const assignees = teamMembers.filter(m => assigneeIds.includes(m.id));
            const assigneeNames = assignees.map(a => a.name).join('; ');
            const assigneePositions = assignees.map(a => a.position).join('; ');

            const row = [
                task.id,
                task.taskTitle,
                task.status,
                new Date(task.timestamp).toLocaleDateString('th-TH'),
                new Date(task.dueDate).toLocaleDateString('th-TH'),
                task.requesterName,
                assigneeNames || "ยังไม่มอบหมาย",
                assigneePositions || "-",
            ];
            csvContent += row.map(val => `"${val}"`).join(',') + '\n';
        });

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${getFilename()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ส่งออกเป็น Word (HTML Format)
    const handleExportDOC = () => {
        if (!exportStartDate || !exportEndDate) {
            alert("กรุณาเลือกช่วงวันที่ก่อนส่งออกรายงาน");
            return;
        }
        const tasksInDateRange = getTasksInDateRange();

        if (tasksInDateRange.length === 0) {
            alert("ไม่มีข้อมูลสำหรับส่งออกในช่วงเวลาที่เลือก");
            return;
        }

        // --- Data Preparation ---
        const teamOverview = {
            "งานทั้งหมด": tasksInDateRange.length,
            "เสร็จสิ้น": tasksInDateRange.filter(t => t.status === TaskStatus.COMPLETED).length,
            "กำลังดำเนินการ": tasksInDateRange.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
            "ยังไม่ดำเนินการ": tasksInDateRange.filter(t => t.status === TaskStatus.NOT_STARTED).length,
            "ยกเลิก": tasksInDateRange.filter(t => t.status === TaskStatus.CANCELLED).length,
        };

        const individualBreakdown = teamMembers.map(member => {
            // Check if member is in assigneeIds array
            const memberTasks = tasksInDateRange.filter(t => (t.assigneeIds || []).includes(member.id));
            return {
                summary: {
                    "ชื่อ-สกุล": member.name,
                    "ตำแหน่ง": member.position,
                    "งานที่รับผิดชอบ": memberTasks.length,
                    "เสร็จสิ้น": memberTasks.filter(t => t.status === TaskStatus.COMPLETED).length,
                    "กำลังดำเนินการ": memberTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
                },
                tasks: memberTasks.map(t => ({
                    "รหัสงาน": t.id,
                    "ชื่องาน": t.taskTitle,
                    "ผู้สั่งงาน": t.requesterName,
                    "สถานะ": t.status,
                })),
            };
        }).filter(m => m.summary["งานที่รับผิดชอบ"] > 0);

        // --- HTML Generation ---
        const reportTitle = "สรุปรายงานภาระงานส่วนงานสื่อสารองค์กร";
        const dateRange = getExportDateRangeString();
        const exportDate = `วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        
        const teamOverviewHtml = `
            <h2>ภาพรวมของทีมทั้งหมด</h2>
            <table>
                <thead>
                    <tr>${Object.keys(teamOverview).map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    <tr>${Object.values(teamOverview).map(v => `<td>${v}</td>`).join('')}</tr>
                </tbody>
            </table>
        `;

        const individualBreakdownHtml = individualBreakdown.map(memberData => {
            const summaryRow = `<tr>${Object.values(memberData.summary).map(val => `<td>${val}</td>`).join('')}</tr>`;
            
            const tasksList = memberData.tasks.length > 0
                ? `<ul class="task-list">${memberData.tasks.map(t => `<li><strong>${t.รหัสงาน}:</strong> ${t.ชื่องาน} - <i>(${t.สถานะ})</i><br/><small>&nbsp;&nbsp;&nbsp;ผู้สั่งงาน: ${t.ผู้สั่งงาน}</small></li>`).join('')}</ul>`
                : '<p class="no-tasks">- ไม่มี -</p>';

            const tasksRow = `<tr><td colspan="${Object.keys(memberData.summary).length}"><strong>รายละเอียดงาน:</strong>${tasksList}</td></tr>`;

            return `
                <tbody class="member-section">
                    ${summaryRow}
                    ${tasksRow}
                </tbody>
            `;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'TH SarabunPSK', 'Angsana New', sans-serif; font-size: 16pt; color: #333; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 25px; }
                    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; vertical-align: top; }
                    th { background-color: #f2f2f2; font-weight: bold; color: #555; }
                    h1 { font-size: 24pt; font-weight: bold; color: #000; }
                    h2 { font-size: 20pt; font-weight: bold; border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-top: 30px; }
                    h3 { font-size: 18pt; font-weight: bold; }
                    .member-section > tr:first-child > td { font-weight: bold; }
                    .task-list { margin-top: 5px; margin-bottom: 5px; padding-left: 20px; list-style-type: square; }
                    .task-list li { margin-bottom: 8px; }
                    .no-tasks { margin-left: 15px; font-style: italic; color: #888; }
                </style>
            </head>
            <body>
                <h1>${reportTitle}</h1>
                <h3>${dateRange}</h3>
                <p>${exportDate}</p>
                ${teamOverviewHtml}
                <h2>สรุปรายบุคคล</h2>
                <table>
                    <thead>
                        <tr>${Object.keys(individualBreakdown[0]?.summary || {}).map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    ${individualBreakdownHtml}
                </table>
            </body>
            </html>
        `;

        const blob = new Blob(['\uFEFF', htmlContent], { type: 'application/msword' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${getFilename()}.doc`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


  return (
    <div className="space-y-6">
        {/* Filter Bar */}
        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-lg interactive-glow">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-dark-bg/50 rounded-lg">
                    {(['all', 'year', 'month', 'day'] as const).map(mode => (
                         <button key={mode} onClick={() => setFilterMode(mode)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${filterMode === mode ? 'bg-white dark:bg-dark-muted shadow' : 'hover:bg-gray-200 dark:hover:bg-dark-muted/50'}`}>
                            {{all: 'ทั้งหมด', year: 'รายปี', month: 'รายเดือน', day: 'รายวัน'}[mode]}
                        </button>
                    ))}
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={filterMode}
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-2 overflow-hidden mt-2 sm:mt-0"
                    >
                         {filterMode === 'year' && (
                             <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="form-input">
                                 {availableYears.map(year => <option key={year} value={year}>ปี {Number(year) + 543}</option>)}
                             </select>
                         )}
                         {filterMode === 'month' && (
                             <>
                                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="form-input">
                                    {availableYears.map(year => <option key={year} value={year}>ปี {Number(year) + 543}</option>)}
                                </select>
                                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="form-input">
                                    {MONTH_NAMES_TH.map((month, index) => <option key={month} value={index}>{month}</option>)}
                                </select>
                             </>
                         )}
                         {filterMode === 'day' && (
                             <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="form-input" />
                         )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <StatCard icon={<FiArchive size={24}/>} title="งานทั้งหมด (ที่กรอง)" value={totalTasks} gradient="bg-gradient-to-br from-purple-500 to-indigo-600" />
         <StatCard icon={<FiUsers size={24} />} title="สมาชิกในทีม" value={teamMembers.length} gradient="bg-gradient-to-br from-sky-500 to-cyan-500" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<FiClock size={24}/>} title="ยังไม่ดำเนินการ" value={notStartedTasks} gradient="bg-gradient-to-br from-gray-500 to-slate-600" onClick={() => onSetFilters({ status: TaskStatus.NOT_STARTED })} />
        <StatCard icon={<FiLoader size={24}/>} title="กำลังดำเนินการ" value={inProgressTasks} gradient="bg-gradient-to-br from-yellow-500 to-amber-600" onClick={() => onSetFilters({ status: TaskStatus.IN_PROGRESS })} />
        <StatCard icon={<FiCheckCircle size={24}/>} title="เสร็จสิ้น" value={completedTasks} gradient="bg-gradient-to-br from-green-500 to-emerald-600" onClick={() => onSetFilters({ status: TaskStatus.COMPLETED })} />
        <StatCard icon={<FiXCircle size={24}/>} title="ยกเลิก" value={cancelledTasks} gradient="bg-gradient-to-br from-red-500 to-rose-600" onClick={() => onSetFilters({ status: TaskStatus.CANCELLED })} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg interactive-glow">
          <h3 className="font-bold text-lg mb-4">สัดส่วนสถานะงาน</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill="#8884d8" labelLine={{ stroke: 'currentColor' }} className="text-gray-500 dark:text-dark-text-muted" onClick={handlePieClick}>
                {statusData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} className="cursor-pointer focus:outline-none" />)}
              </Pie>
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

      {/* Overdue Tasks Section (New Full-Width Placement - Below Charts) */}
      <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg interactive-glow border-l-4 border-red-500">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
              <FiAlertCircle size={24} /> 🚨 งานที่เลยกำหนด (Overdue)
          </h3>
          {overdueTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {overdueTasks.map(task => (
                      <motion.div 
                          key={task.id}
                          whileHover={{ scale: 1.02 }}
                          className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 cursor-pointer shadow-sm"
                          onClick={() => onSelectTask(task)}
                      >
                          <div className="min-w-0">
                              <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{task.taskTitle}</p>
                              <p className="text-xs text-red-600 dark:text-red-300 flex items-center gap-1">
                                  กำหนดส่ง: {new Date(task.dueDate).toLocaleDateString('th-TH')}
                              </p>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2">
                              <span className="px-2 py-1 text-xs font-bold text-red-600 bg-white dark:bg-black/20 rounded-full border border-red-200">
                                  {task.id}
                              </span>
                              <FiChevronRight className="text-gray-400" />
                          </div>
                      </motion.div>
                  ))}
              </div>
          ) : (
              <p className="text-gray-500 dark:text-dark-text-muted flex items-center gap-2">
                  <FiCheckCircle className="text-green-500"/> เยี่ยมมาก! ไม่มีงานที่เลยกำหนดส่ง
              </p>
          )}
      </div>
      
      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* งานใหม่ล่าสุด */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg interactive-glow">
                <h3 className="font-bold text-lg mb-4">🔔 งานใหม่ล่าสุด </h3>
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
                    )) : <p className="text-center text-gray-500 dark:text-dark-text-muted italic py-4">ไม่มีงานใหม่ในช่วงเวลานี้</p>}
                </ul>
            </div>

            {/* งานใกล้ถึงกำหนด */}
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
          <h3 className="font-bold text-lg mb-4">ภาระงานของสมาชิก </h3>
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

      {/* Export Panel */}
      <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg interactive-glow mt-6">
            <h3 className="text-xl font-bold mb-2">ส่งออกรายงานสรุป</h3>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted mb-4">
                เลือกช่วงวันที่ที่ต้องการเพื่อส่งออกข้อมูลสรุปภาระงานของสมาชิกในทีม 
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 border-b dark:border-dark-border pb-6">
                <div>
                    <label htmlFor="exportStartDate" className="block text-sm font-medium text-gray-600 dark:text-dark-text-muted mb-1">ตั้งแต่วันที่</label>
                    <input
                        type="date"
                        id="exportStartDate"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className="form-input"
                    />
                </div>
                <div>
                    <label htmlFor="exportEndDate" className="block text-sm font-medium text-gray-600 dark:text-dark-text-muted mb-1">ถึงวันที่</label>
                    <input
                        type="date"
                        id="exportEndDate"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="form-input"
                    />
                </div>
            </div>
            <div className="flex flex-wrap gap-4">
                <button onClick={handleExportCSV} className="icon-interactive bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-opacity">
                    <FiDownload />
                    Export as CSV
                </button>
                 <button onClick={handleExportDOC} className="icon-interactive bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-opacity">
                    <FiDownload />
                    Export as DOC
                </button>
            </div>
        </div>
       <style>{`
        .form-input {
            padding: 0.5rem 0.75rem;
            border-radius: 0.5rem;
            border-width: 1px;
            border-color: #d1d5db;
        }
        .dark .form-input {
            border-color: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default OverviewDashboard;
