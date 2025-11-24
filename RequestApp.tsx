
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilePlus, FiList, FiSettings, FiLogOut, FiSun, FiMoon, FiMenu, FiAlertTriangle } from 'react-icons/fi';
import RequestForm from './components/RequestForm';
import MyRequests from './components/MyRequests';
import RequesterSettings from './components/RequesterSettings';
import { Task, TaskTypeConfig } from './types';
import { addTask, onTasksUpdate } from './services/taskService';
import { onTaskTypeConfigsUpdate } from './services/departmentService';
import { RequesterProfile } from './App';
import ContactWidget from './components/ChatBot';
import { ensureFirebaseAuth } from './services/authService';

type RequesterView = 'form' | 'requests' | 'settings';

interface RequestAppProps {
  currentUser: RequesterProfile;
  onLogout: () => void;
  theme: string;
  toggleTheme: () => void;
  onProfileUpdate: (updatedProfile: RequesterProfile) => void;
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


const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="text-right">
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{time.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-2xl font-bold text-brand-primary">{time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
        </div>
    );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${active ? 'bg-brand-secondary text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
      {icon}
      <span className="font-medium">{label}</span>
    </button>
);

const SidebarContent: React.FC<{
    currentUser: RequesterProfile;
    view: RequesterView;
    setView: (view: RequesterView) => void;
    onLogout: () => void;
    onNavItemClicked?: () => void;
}> = ({ currentUser, view, setView, onLogout, onNavItemClicked }) => {
    
    const handleNavClick = (targetView: RequesterView) => {
        setView(targetView);
        onNavItemClicked?.();
    };
    
    const userName = 'localAccountId' in currentUser ? (currentUser.name || "ผู้ใช้ Microsoft").split(' ')[0] : `${currentUser.firstNameTh}`;
    const userPosition = 'localAccountId' in currentUser ? "N/A" : currentUser.position;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="font-bold text-base sm:text-lg">สวัสดี! {userName}</h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{userPosition}</p>
                    </div>
                </div>
            </div>
            <div className="flex-grow p-4 space-y-2">
                <NavItem icon={<FiFilePlus />} label="แจ้งงานใหม่" active={view === 'form'} onClick={() => handleNavClick('form')} />
                <NavItem icon={<FiList />} label="งานที่สั่งแล้ว" active={view === 'requests'} onClick={() => handleNavClick('requests')} />
                <NavItem icon={<FiSettings />} label="ตั้งค่าโปรไฟล์" active={view === 'settings'} onClick={() => handleNavClick('settings')} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={onLogout} className="icon-interactive w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                    <FiLogOut size={18} /> ออกจากระบบ
                </button>
            </div>
        </div>
    );
};


const RequestApp: React.FC<RequestAppProps> = ({ currentUser, onLogout, theme, toggleTheme, onProfileUpdate }) => {
  const [view, setView] = useState<RequesterView>('form');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTypeConfigs, setTaskTypeConfigs] = useState<TaskTypeConfig[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);

  useEffect(() => {
    let unsubscribeTasks: () => void;
    let unsubscribeConfigs: () => void;

    const init = async () => {
        await ensureFirebaseAuth();
        unsubscribeTasks = onTasksUpdate(setTasks);
        unsubscribeConfigs = onTaskTypeConfigsUpdate(setTaskTypeConfigs);
    };

    init();

    return () => {
        if (unsubscribeTasks) unsubscribeTasks();
        if (unsubscribeConfigs) unsubscribeConfigs();
    };
  }, []);

  const handleTaskAdded = async (tasksToAdd: Task | Task[]) => {
    if (Array.isArray(tasksToAdd)) {
        for (const task of tasksToAdd) {
            await addTask(task);
        }
    } else {
        await addTask(tasksToAdd);
    }
    setShowSuccess(true);
    setTimeout(() => {
        setShowSuccess(false);
        setView('requests');
    }, 3000);
  };
  
  const userEmail = 'localAccountId' in currentUser ? currentUser.username : currentUser.email;
  const userFullName = 'localAccountId' in currentUser ? currentUser.name : `${currentUser.firstNameTh} ${currentUser.lastNameTh}`;


  const renderView = () => {
    switch (view) {
      case 'requests':
        return <MyRequests tasks={tasks} userEmail={userEmail} taskTypeConfigs={taskTypeConfigs} />;
      case 'settings':
          return <RequesterSettings user={currentUser} onProfileUpdate={onProfileUpdate} />;
      case 'form':
      default:
        return <RequestForm onTaskAdded={handleTaskAdded} tasks={tasks} user={currentUser} taskTypeConfigs={taskTypeConfigs} />;
    }
  };

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
    >
      <header className="bg-white dark:bg-gray-900 shadow-md p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-4">
             <button
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open menu"
                className="p-2 -ml-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors md:hidden"
            >
                <FiMenu size={24} />
            </button>
            <div className="flex items-center gap-3">
                 <img 
                    src="https://eservice.tfac.or.th/check_member/assets/images/logo.png" 
                    alt="Logo" 
                    className="w-10 h-10 object-contain hidden sm:block"
                />
                <div>
                     <h1 className="font-bold text-base sm:text-lg leading-tight">แบบฟอร์มสั่งงานและแก้ไขงาน</h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">ส่วนงานสื่อสารองค์กร</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">สภาวิชาชีพบัญชี ในพระบรมราชูปถัมภ์</p>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:block">
                 <Clock />
            </div>
             <div className="flex items-center gap-2 border-l pl-4 border-gray-200 dark:border-gray-600">
                <button onClick={toggleTheme} className="icon-interactive p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    {theme === 'light' ? <FiMoon /> : <FiSun />}
                </button>
                 <div className="text-right hidden sm:block">
                     <p className="font-semibold text-sm">{userFullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                </div>
            </div>
        </div>
      </header>

      <div className="flex">
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
                  className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col z-40 md:hidden"
                >
                  <SidebarContent 
                    currentUser={currentUser}
                    view={view}
                    setView={setView}
                    onLogout={() => setIsLogoutConfirmVisible(true)}
                    onNavItemClicked={() => setIsSidebarOpen(false)}
                   />
                </motion.aside>
              </>
            )}
        </AnimatePresence>

        <aside className="w-64 bg-white dark:bg-gray-900 hidden md:flex flex-col h-[calc(100vh-84px)] sticky top-[84px]">
            <SidebarContent currentUser={currentUser} view={view} setView={setView} onLogout={() => setIsLogoutConfirmVisible(true)} />
        </aside>

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
            <footer className="text-center mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <p>© 2025 PR Task Manager Dev by Nattakit Chotikorn</p>
            </footer>
        </main>
      </div>
       <ContactWidget />

       <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50"
          >
            ส่งคำร้องขอสำเร็จ! กำลังนำคุณไปหน้าติดตามสถานะ...
          </motion.div>
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

export default RequestApp;
