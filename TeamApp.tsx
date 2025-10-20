import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBarChart2, FiCheckSquare, FiStar, FiUsers, FiCalendar, FiSettings, FiChevronDown, FiInbox, FiLogOut, FiAlertTriangle } from 'react-icons/fi';
import { Task, TeamMember, User, TaskStatus, Notification, ContactMessage, NotificationType } from './types';
import { onTasksUpdate, updateTask } from './services/taskService';
import { onTeamMembersUpdate, addTeamMember, updateTeamMember, deleteTeamMember } from './services/secureIdService';
import { onNotificationsUpdate, saveNotifications, addNotification } from './services/notificationService';
import { onContactMessagesUpdate, updateContactMessage, deleteContactMessage, deleteAllContactMessages } from './services/contactService';
import { onUsersUpdate, updateUser as updateUserService, deleteUser as deleteUserService } from './services/userService';
import { seedInitialData } from './services/seedService';

import Header from './components/Header';
import OverviewDashboard from './components/OverviewDashboard';
import TaskDashboard from './components/TaskDashboard';
import AssigneeManager from './components/AssigneeManager';
import TaskModal from './components/TaskModal';
import CalendarView from './components/CalendarView';
import Settings from './components/Settings';
import ContactMessages from './components/ContactMessages';
import RequesterManager from './components/RequesterManager';

type View = 'dashboard' | 'tasks' | 'starred' | 'assignees' | 'calendar' | 'settings' | 'inbox' | 'requesters';

interface TeamAppProps {
  onLogout: () => void;
  theme: string;
  toggleTheme: () => void;
  currentUser: TeamMember;
}

// --- CONFIRMATION MODAL COMPONENT ---
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

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badgeCount?: number }> = ({ icon, label, active, onClick, badgeCount }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 interactive-glow ${
        active
          ? 'bg-brand-primary text-white shadow-lg dark:bg-dark-accent dark:text-dark-bg'
          : 'text-gray-600 hover:bg-gray-100 dark:text-dark-text-muted dark:hover:bg-dark-card/50'
      }`}
    >
      <span className="icon-interactive">{icon}</span>
      <span className="font-medium flex-grow">{label}</span>
       {badgeCount !== undefined && badgeCount > 0 && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0"
        >
          {badgeCount}
        </motion.span>
      )}
    </motion.button>
  );
};

const NavDropdown: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  children: React.ReactNode;
  onMainClick?: () => void;
}> = ({ icon, label, active, children, onMainClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleMainClick = () => {
    if (onMainClick) {
      onMainClick();
    } else {
      handleToggle();
    }
  };
  
  return (
    <div>
      <div
        onClick={handleMainClick}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 cursor-pointer interactive-glow ${
          active
            ? 'bg-brand-primary text-white shadow-md dark:bg-dark-accent dark:text-dark-bg'
            : 'text-gray-600 hover:bg-gray-100 dark:text-dark-text-muted dark:hover:bg-dark-card/50'
        }`}
      >
        <div className="flex items-center gap-3 flex-grow">
          <span className="icon-interactive">{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
        <button
          onClick={handleToggle}
          className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/20 icon-interactive"
          aria-expanded={isOpen}
        >
          <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-8 overflow-hidden"
          >
            <div className="py-2 space-y-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavSubItem: React.FC<{ label: string; onClick: () => void; isActive: boolean; }> = ({ label, onClick, isActive }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ x: 5 }}
        className={`icon-interactive w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${
            isActive 
            ? 'bg-brand-primary/10 text-brand-primary font-semibold dark:bg-dark-accent/10 dark:text-dark-accent' 
            : 'text-gray-500 hover:bg-gray-100 dark:text-dark-text-muted dark:hover:bg-dark-card/50'
        }`}
    >
        {label}
    </motion.button>
);


const SidebarContent: React.FC<{ view: View; setView: (view: View) => void; onLogout: () => void; onSetFilters: (filters: {[key: string]: string}) => void; activeFilters: {[key: string]: string}; unreadMessagesCount: number; onNavItemClicked?: () => void; }> = ({ view, setView, onLogout, onSetFilters, activeFilters, unreadMessagesCount, onNavItemClicked }) => {
    const handleNavClick = (targetView: View) => {
        setView(targetView);
        onNavItemClicked?.();
    };

    const handleFilterClick = (status: TaskStatus) => {
        onSetFilters({ status: status });
        onNavItemClicked?.();
    }

    return (
        <>
            <button 
                onClick={() => handleNavClick('dashboard')}
                aria-label="Go to dashboard"
                className="w-full text-left p-4 border-b border-gray-200 dark:border-dark-border transition-colors hover:bg-gray-100 dark:hover:bg-dark-card/50"
            >
                <div className="flex items-center gap-3">
                    <img 
                        src="https://eservice.tfac.or.th/check_member/assets/images/logo.png" 
                        alt="Logo สภาวิชาชีพบัญชี" 
                        className="w-12 h-12 object-contain flex-shrink-0 bg-gray-100 dark:bg-white/10 rounded-md p-1"
                    />
                    <div>
                        <p className="font-bold text-brand-primary dark:text-dark-accent leading-tight text-sm">ระบบจัดการงาน</p>
                        <p className="font-bold text-brand-primary dark:text-dark-accent leading-tight text-sm">ส่วนงานสื่อสารองค์กร</p>
                        <p className="text-xs text-gray-500 dark:text-dark-text-muted italic mt-1">สภาวิชาชีพบัญชี ในพระบรมราชูปถัมภ์</p>
                    </div>
                </div>
            </button>
            <nav className="flex-grow p-4 space-y-2">
              <NavItem icon={<FiBarChart2 />} label="Dashboard" active={view === 'dashboard'} onClick={() => { onSetFilters({}); handleNavClick('dashboard'); }} />
              
              <NavDropdown 
                icon={<FiCheckSquare />} 
                label="รายการงาน" 
                active={view === 'tasks'} 
                onMainClick={() => { onSetFilters({}); handleNavClick('tasks'); }}
              >
                {Object.values(TaskStatus).map(status => (
                  <NavSubItem key={status} label={status} onClick={() => handleFilterClick(status)} isActive={activeFilters.status === status} />
                ))}
              </NavDropdown>

              <NavItem icon={<FiStar />} label="รายการโปรด" active={view === 'starred'} onClick={() => handleNavClick('starred')} />
              <NavItem icon={<FiCalendar />} label="ปฏิทิน" active={view === 'calendar'} onClick={() => handleNavClick('calendar')} />
               <NavDropdown icon={<FiUsers />} label="จัดการบัญชี" active={view === 'assignees' || view === 'requesters'}>
                  <NavSubItem 
                    label="ผู้รับผิดชอบ (ทีม)" 
                    onClick={() => handleNavClick('assignees')}
                    isActive={view === 'assignees'}
                  />
                  <NavSubItem 
                    label="ผู้สั่งงาน (ทั่วไป)" 
                    onClick={() => handleNavClick('requesters')}
                    isActive={view === 'requesters'}
                  />
              </NavDropdown>
              <NavItem icon={<FiInbox />} label="กล่องข้อความ" active={view === 'inbox'} onClick={() => handleNavClick('inbox')} badgeCount={unreadMessagesCount} />
              <NavItem icon={<FiSettings />} label="ตั้งค่า" active={view === 'settings'} onClick={() => handleNavClick('settings')} />
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-dark-border">
                <button onClick={onLogout} className="icon-interactive w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                    <FiLogOut size={18} /> ออกจากระบบ
                </button>
            </div>
        </>
    );
};

const TeamApp: React.FC<TeamAppProps> = ({ onLogout, theme, toggleTheme, currentUser }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);
  const isInitialTasksSet = useRef(false);

  const playNotificationSound = () => {
    const soundEnabled = localStorage.getItem('notificationSoundEnabled') !== 'false';
    if (!soundEnabled) return;

    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const playTone = (freq: number, startTime: number, duration: number) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, startTime);
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        }

        const now = audioContext.currentTime;
        playTone(880, now, 0.15); // A5
        playTone(1046.50, now + 0.15, 0.15); // C6

    } catch(e) {
        console.error("Could not play notification sound:", e);
    }
  };

  // Fix: Combined and corrected the two useEffect hooks into one.
  // This resolves multiple compilation errors related to incorrect hook structure,
  // dependency arrays, and variable scoping for cleanup functions.
  useEffect(() => {
    let unsubTasks: () => void;
    let unsubMembers: () => void;
    let unsubNotifications: () => void;
    let unsubMessages: () => void;
    let unsubUsers: () => void;

    seedInitialData().then(() => {
        unsubTasks = onTasksUpdate(newTasks => {
            setTasks(prevTasks => {
                if (!isInitialTasksSet.current) {
                    isInitialTasksSet.current = true;
                } else if (newTasks.length > prevTasks.length) {
                    const oldTaskIds = new Set(prevTasks.map(t => t.id));
                    const addedTasks = newTasks.filter(t => !oldTaskIds.has(t.id));

                    if (addedTasks.length > 0) {
                        addedTasks.forEach(newTask => {
                            addNotification({
                                type: NotificationType.NEW_TASK,
                                message: `มีงานใหม่เข้ามา: "${newTask.taskTitle}"`,
                                taskId: newTask.id,
                            });
                        });
                        playNotificationSound();
                    }
                }
                return newTasks;
            });
        });
        unsubMembers = onTeamMembersUpdate(setTeamMembers);
        unsubNotifications = onNotificationsUpdate(setNotifications);
        unsubMessages = onContactMessagesUpdate(setContactMessages);
        unsubUsers = onUsersUpdate(setUsers);
        
        setIsLoading(false);
    });

    return () => {
        if (unsubTasks) unsubTasks();
        if (unsubMembers) unsubMembers();
        if (unsubNotifications) unsubNotifications();
        if (unsubMessages) unsubMessages();
        if (unsubUsers) unsubUsers();
    };
  }, []);
  
  // Effect for generating "due soon" notifications
  useEffect(() => {
    if (isLoading || !tasks.length) return;

    const DUE_SOON_DAYS_THRESHOLD = 3;
    const now = new Date();

    tasks.forEach(task => {
      if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
        return;
      }

      const dueDate = new Date(task.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (daysUntilDue >= 0 && daysUntilDue <= DUE_SOON_DAYS_THRESHOLD) {
        const hasExistingDueSoonNotif = notifications.some(
          n => n.taskId === task.id && n.type === NotificationType.DUE_SOON
        );

        if (!hasExistingDueSoonNotif) {
          addNotification({
            type: NotificationType.DUE_SOON,
            message: `งาน "${task.taskTitle}" ใกล้จะถึงกำหนดส่งแล้ว`,
            taskId: task.id,
          });
        }
      }
    });
  }, [tasks, isLoading, notifications]);


  const handleUpdateTask = async (updatedTask: Task) => {
    const originalTask = tasks.find(t => t.id === updatedTask.id);

    if (originalTask) {
        // Check for new assignment
        if (!originalTask.assigneeId && updatedTask.assigneeId) {
            const assignee = teamMembers.find(tm => tm.id === updatedTask.assigneeId);
            if(assignee) {
                addNotification({
                    type: NotificationType.NEW_ASSIGNMENT,
                    message: `งาน "${updatedTask.taskTitle}" ถูกมอบหมายให้ ${assignee.name}`,
                    taskId: updatedTask.id,
                });
            }
        }
        
        // Check for status update
        if (originalTask.status !== updatedTask.status) {
            addNotification({
                type: NotificationType.STATUS_UPDATE,
                message: `สถานะของงาน "${updatedTask.taskTitle}" เปลี่ยนเป็น "${updatedTask.status}"`,
                taskId: updatedTask.id,
            });
        }
    }
    
    await updateTask(updatedTask);
    setSelectedTask(null);
  };

  const handleNotificationClick = (taskId: string) => {
    const taskToOpen = tasks.find(t => t.id === taskId);
    if (taskToOpen) {
      setSelectedTask(taskToOpen);
      const updatedNotifications = notifications.map(n => n.taskId === taskId && !n.isRead ? { ...n, isRead: true } : n);
      saveNotifications(updatedNotifications);
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    saveNotifications(updatedNotifications);
  };

  const handleClearNotifications = async () => {
     if(window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบการแจ้งเตือนทั้งหมด?')) {
        await saveNotifications([]);
    }
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updatedNotifications);
  };

  const handleSetFilters = (filters: {[key: string]: string}) => {
    if (Object.keys(filters).length === 0) {
        setActiveFilters({});
    } else {
        setActiveFilters(prev => ({...prev, ...filters}));
    }
    setView('tasks');
  };
  
  const unreadMessagesCount = contactMessages.filter(m => !m.isRead).length;
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-dark-bg">
            <div className="text-center">
                <p className="text-xl font-semibold text-gray-700 dark:text-dark-text">กำลังเชื่อมต่อฐานข้อมูล...</p>
            </div>
        </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <OverviewDashboard 
                  tasks={tasks} 
                  teamMembers={teamMembers} 
                  onSetFilters={handleSetFilters}
                  onSelectTask={setSelectedTask} 
                />;
      case 'tasks':
        return <TaskDashboard 
                  tasks={tasks} 
                  teamMembers={teamMembers} 
                  filter="all" 
                  initialFilters={activeFilters}
                  clearInitialFilters={() => setActiveFilters({})}
                  onSelectTask={setSelectedTask}
                />;
      case 'calendar':
        return <CalendarView
                  tasks={tasks}
                  onSelectTask={setSelectedTask}
                />;
      case 'starred':
        return <TaskDashboard 
                  tasks={tasks} 
                  teamMembers={teamMembers} 
                  filter="starred" 
                  initialFilters={{}}
                  clearInitialFilters={() => {}}
                  onSelectTask={setSelectedTask}
                />;
      case 'assignees':
        return <AssigneeManager 
                  teamMembers={teamMembers} 
                  addTeamMember={addTeamMember}
                  updateTeamMember={updateTeamMember}
                  deleteTeamMember={deleteTeamMember}
                />;
       case 'requesters':
        return <RequesterManager 
                  users={users}
                  updateUser={updateUserService}
                  deleteUser={deleteUserService}
                />;
      case 'inbox':
        return <ContactMessages 
                  messages={contactMessages} 
                  onUpdateMessage={updateContactMessage}
                  onDeleteMessage={deleteContactMessage}
                  onClearAllMessages={deleteAllContactMessages}
               />;
      case 'settings':
        return <Settings theme={theme} toggleTheme={toggleTheme} />;
      default:
        return <OverviewDashboard tasks={tasks} teamMembers={teamMembers} onSetFilters={handleSetFilters} onSelectTask={setSelectedTask}/>;
    }
  };

  return (
    <motion.div
      key="team-app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen bg-gray-100 dark:bg-dark-bg text-gray-900 dark:text-dark-text"
    >
      <aside className="w-72 bg-white dark:bg-dark-card shadow-lg flex-col hidden md:flex border-r border-gray-200 dark:border-dark-border">
         <SidebarContent view={view} setView={setView} onLogout={() => setIsLogoutConfirmVisible(true)} onSetFilters={handleSetFilters} activeFilters={activeFilters} unreadMessagesCount={unreadMessagesCount} />
      </aside>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-dark-card shadow-lg flex flex-col z-40 md:hidden border-r border-gray-200 dark:border-dark-border"
            >
              <SidebarContent 
                view={view} 
                setView={setView} 
                onLogout={() => setIsLogoutConfirmVisible(true)} 
                onSetFilters={handleSetFilters}
                activeFilters={activeFilters}
                unreadMessagesCount={unreadMessagesCount}
                onNavItemClicked={() => setIsSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          currentUser={currentUser}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onDeleteNotification={handleDeleteNotification}
          onClearNotifications={handleClearNotifications}
          onMarkAllRead={handleMarkAllAsRead}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-dark-bg">
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <TaskModal
            task={selectedTask}
            teamMembers={teamMembers}
            onClose={() => setSelectedTask(null)}
            onSave={handleUpdateTask}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLogoutConfirmVisible && (
          <ConfirmationModal
            onClose={() => setIsLogoutConfirmVisible(false)}
            onConfirm={onLogout}
            title="ยืนยันการออกจากระบบ"
            message="คุณต้องการออกจากระบบใช่หรือไม่?"
            confirmText="ออกจากระบบ"
            cancelText="ยกเลิก"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeamApp;
