import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBarChart2, FiCheckSquare, FiStar, FiUsers, FiFilePlus, FiCalendar, FiSettings, FiChevronDown, FiInbox } from 'react-icons/fi';
import { Task, TeamMember, TaskStatus, Notification, ContactMessage } from './types';
import { onTasksUpdate, updateTask } from './services/taskService';
import { onTeamMembersUpdate, saveTeamMembers } from './services/teamService';
import { onNotificationsUpdate, saveNotifications } from './services/notificationService';
import { onContactMessagesUpdate, saveContactMessages } from './services/contactService';
import { seedInitialData } from './services/seedService';

import Header from './components/Header';
import OverviewDashboard from './components/OverviewDashboard';
import TaskDashboard from './components/TaskDashboard';
import AssigneeManager from './components/AssigneeManager';
import TaskModal from './components/TaskModal';
import CalendarView from './components/CalendarView';
import Settings from './components/Settings';
import ContactMessages from './components/ContactMessages';

type View = 'dashboard' | 'tasks' | 'starred' | 'assignees' | 'calendar' | 'settings' | 'inbox';

interface TeamAppProps {
  onBackToHome: () => void;
  theme: string;
  toggleTheme: () => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badgeCount?: number }> = ({ icon, label, active, onClick, badgeCount }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 10, scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
        active
          ? 'bg-brand-primary text-white shadow-md'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
  onClick: () => void;
  children: React.ReactNode;
}> = ({ icon, label, active, onClick, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <div
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
          active
            ? 'bg-brand-primary text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <button onClick={onClick} className="flex items-center gap-3 flex-grow">
          <span className="icon-interactive">{icon}</span>
          <span className="font-medium">{label}</span>
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-full hover:bg-white/20 icon-interactive"
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
            ? 'bg-blue-100 dark:bg-blue-900/50 text-brand-primary font-semibold' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
    >
        {label}
    </motion.button>
);


const SidebarContent: React.FC<{ view: View; setView: (view: View) => void; onBackToHome: () => void; onSetFilters: (filters: {[key: string]: string}) => void; activeFilters: {[key: string]: string}; unreadMessagesCount: number; onNavItemClicked?: () => void; }> = ({ view, setView, onBackToHome, onSetFilters, activeFilters, unreadMessagesCount, onNavItemClicked }) => {
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
                className="w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
                <div className="flex items-center gap-3">
                    <img 
                        src="https://eservice.tfac.or.th/check_member/assets/images/logo.png" 
                        alt="Logo สภาวิชาชีพบัญชี" 
                        className="w-12 h-12 object-contain flex-shrink-0"
                    />
                    <div>
                        <p className="font-bold text-brand-primary leading-tight text-sm">ระบบจัดการงาน</p>
                        <p className="font-bold text-brand-primary leading-tight text-sm">ส่วนงานสื่อสารองค์กร</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">สภาวิชาชีพบัญชี ในพระบรมราชูปถัมภ์</p>
                    </div>
                </div>
            </button>
            <nav className="flex-grow p-4 space-y-2">
              <NavItem icon={<FiBarChart2 />} label="Dashboard" active={view === 'dashboard'} onClick={() => { onSetFilters({}); handleNavClick('dashboard'); }} />
              
              <NavDropdown icon={<FiCheckSquare />} label="รายการงาน" active={view === 'tasks'} onClick={() => { onSetFilters({}); handleNavClick('tasks'); }}>
                {Object.values(TaskStatus).map(status => (
                  <NavSubItem key={status} label={status} onClick={() => handleFilterClick(status)} isActive={activeFilters.status === status} />
                ))}
              </NavDropdown>

              <NavItem icon={<FiStar />} label="รายการโปรด" active={view === 'starred'} onClick={() => handleNavClick('starred')} />
              <NavItem icon={<FiCalendar />} label="ปฏิทิน" active={view === 'calendar'} onClick={() => handleNavClick('calendar')} />
              <NavItem icon={<FiUsers />} label="จัดการผู้รับผิดชอบ" active={view === 'assignees'} onClick={() => handleNavClick('assignees')} />
              <NavItem icon={<FiInbox />} label="กล่องข้อความ" active={view === 'inbox'} onClick={() => handleNavClick('inbox')} badgeCount={unreadMessagesCount} />
              <NavItem icon={<FiSettings />} label="ตั้งค่า" active={view === 'settings'} onClick={() => handleNavClick('settings')} />
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={onBackToHome} className="icon-interactive w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <FiFilePlus size={18} /> ระบบแจ้งงาน
                </button>
            </div>
        </>
    );
};

const TeamApp: React.FC<TeamAppProps> = ({ onBackToHome, theme, toggleTheme }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Seed initial data if collections are empty
    seedInitialData().then(() => {
        // Set up real-time listeners
        const unsubTasks = onTasksUpdate(setTasks);
        const unsubMembers = onTeamMembersUpdate((members) => {
            setTeamMembers(members);
            if (!currentUser && members.length > 0) {
                setCurrentUser(members[0]);
            }
        });
        const unsubNotifications = onNotificationsUpdate(setNotifications);
        const unsubMessages = onContactMessagesUpdate(setContactMessages);
        
        setIsLoading(false);

        // Cleanup subscriptions on unmount
        return () => {
            unsubTasks();
            unsubMembers();
            unsubNotifications();
            unsubMessages();
        };
    });
  }, [currentUser]);
  
  const handleUpdateTask = async (updatedTask: Task) => {
    await updateTask(updatedTask);
    setSelectedTask(null);
  };

  const updateTeamMembers = async (updatedMembers: TeamMember[]) => {
    await saveTeamMembers(updatedMembers);
  };

  const updateNotifications = async (updated: Notification[]) => {
    await saveNotifications(updated);
  };
  
  const updateContactMessages = async (updater: (prevMessages: ContactMessage[]) => ContactMessage[]) => {
    // This function needs to get current state to apply updater
    setContactMessages(prevMessages => {
        const newMessages = updater(prevMessages);
        saveContactMessages(newMessages); // async save
        return newMessages;
    });
  };

  const handleNotificationClick = (taskId: string) => {
    const taskToOpen = tasks.find(t => t.id === taskId);
    if (taskToOpen) {
      setSelectedTask(taskToOpen);
      const updatedNotifications = notifications.map(n => n.taskId === taskId ? { ...n, isRead: true } : n);
      saveNotifications(updatedNotifications); // async save
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    saveNotifications(updatedNotifications); // async save
  };

  const handleClearNotifications = () => {
    saveNotifications([]); // async save
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updatedNotifications); // async save
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
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">กำลังเชื่อมต่อฐานข้อมูล...</p>
            </div>
        </div>
    );
  }

  const renderView = () => {
    if (!currentUser) return <div className="text-center p-8">กำลังโหลดข้อมูลผู้ใช้...</div>;
    
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
        return <AssigneeManager teamMembers={teamMembers} updateTeamMembers={updateTeamMembers} />;
      case 'inbox':
        return <ContactMessages messages={contactMessages} updateMessages={updateContactMessages} />;
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
      className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white dark:bg-gray-800 shadow-lg flex-col hidden md:flex">
         <SidebarContent view={view} setView={setView} onBackToHome={onBackToHome} onSetFilters={handleSetFilters} activeFilters={activeFilters} unreadMessagesCount={unreadMessagesCount} />
      </aside>

      {/* Mobile Sidebar */}
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
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 shadow-lg flex flex-col z-40 md:hidden"
            >
              <SidebarContent 
                view={view} 
                setView={setView} 
                onBackToHome={onBackToHome} 
                onSetFilters={handleSetFilters}
                activeFilters={activeFilters}
                unreadMessagesCount={unreadMessagesCount}
                onNavItemClicked={() => setIsSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>


      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          currentUser={currentUser}
          teamMembers={teamMembers}
          setCurrentUser={setCurrentUser}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onDeleteNotification={handleDeleteNotification}
          onClearNotifications={handleClearNotifications}
          onMarkAllRead={handleMarkAllAsRead}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900/50">
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
        {selectedTask && currentUser && (
          <TaskModal
            task={selectedTask}
            teamMembers={teamMembers}
            onClose={() => setSelectedTask(null)}
            onSave={handleUpdateTask}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeamApp;