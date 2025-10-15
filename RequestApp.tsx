import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiFilePlus, FiList, FiMenu, FiMessageCircle, FiSun, FiMoon } from 'react-icons/fi';
import { Task } from './types';
import { MOCK_TASKS } from './constants';
import RequestForm from './components/RequestForm';
import MyRequests from './components/MyRequests';
import { default as ContactWidget, ContactForm } from './components/ChatBot';
import PasswordModal from './components/PasswordModal';

interface RequestAppProps {
  onBackToHome: () => void;
  theme: string;
  toggleTheme: () => void;
}

type View = 'form' | 'list' | 'contact';

// --- Reusable NavItem for consistency ---
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 10, scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
        active
          ? 'bg-brand-secondary text-white shadow-md'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <span className="icon-interactive">{icon}</span>
      <span className="font-medium flex-grow">{label}</span>
    </motion.button>
  );
};

// --- Sidebar Content Component ---
const RequestSidebarContent: React.FC<{ view: View; setView: (view: View) => void; onAdminClick: () => void; onNavItemClicked?: () => void; }> = ({ view, setView, onAdminClick, onNavItemClicked }) => {
    const handleNavClick = (targetView: View) => {
        setView(targetView);
        onNavItemClicked?.();
    };

    return (
        <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <img 
                        src="https://eservice.tfac.or.th/check_member/assets/images/logo.png" 
                        alt="Logo สภาวิชาชีพบัญชี" 
                        className="w-12 h-12 object-contain flex-shrink-0"
                    />
                    <div>
                        <p className="font-bold text-brand-secondary leading-tight text-sm">แบบฟอร์มสั่งงานและแก้ไขงาน</p>
                        <p className="font-bold text-brand-secondary leading-tight text-sm">ส่วนงานสื่อสารองค์กร</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">สภาวิชาชีพบัญชี ในพระบรมราชูปถัมภ์</p>
                    </div>
                </div>
            </div>
            <nav className="flex-grow p-4 space-y-2">
              <NavItem icon={<FiFilePlus />} label="แจ้งงานใหม่" active={view === 'form'} onClick={() => handleNavClick('form')} />
              <NavItem icon={<FiList />} label="ติดตามสถานะงาน" active={view === 'list'} onClick={() => handleNavClick('list')} />
              <NavItem icon={<FiMessageCircle />} label="ติดต่อเจ้าหน้าที่" active={view === 'contact'} onClick={() => handleNavClick('contact')} />
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={onAdminClick} className="icon-interactive w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <FiUsers size={18} /> ADMIN
                </button>
            </div>
        </>
    );
};

// --- New Header Component ---
const RequestHeader: React.FC<{
  toggleSidebar: () => void;
  toggleTheme: () => void;
  theme: string;
  view: View;
}> = ({ toggleSidebar, toggleTheme, theme, view }) => {
    const viewTitles: { [key in View]: string } = {
        form: 'แบบฟอร์มสั่งงานและแก้ไขงาน',
        list: 'ติดตามสถานะงาน',
        contact: 'ติดต่อเจ้าหน้าที่ / แจ้งปัญหา'
    };
    return (
        <header className="bg-white dark:bg-gray-800 p-4 shadow-sm flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleSidebar}
                    aria-label="Open menu"
                    className="p-2 -ml-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors md:hidden"
                >
                    <FiMenu size={24} />
                </button>
                 <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{viewTitles[view]}</h1>
            </div>
            <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="icon-interactive p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
                </button>
            </div>
        </header>
    );
};


const RequestApp: React.FC<RequestAppProps> = ({ onBackToHome, theme, toggleTheme }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<View>('form');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    let storedTasks;
    try {
        const rawTasks = localStorage.getItem('pr-tasks');
        storedTasks = rawTasks ? JSON.parse(rawTasks) : null;
    } catch (e) {
        console.error("Error parsing tasks from localStorage:", e);
        storedTasks = null;
        localStorage.removeItem('pr-tasks');
    }
    
    if (storedTasks && Array.isArray(storedTasks)) {
      setTasks(storedTasks);
    } else {
      localStorage.setItem('pr-tasks', JSON.stringify(MOCK_TASKS));
      setTasks(MOCK_TASKS);
    }
  }, []);

  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('pr-tasks', JSON.stringify(updatedTasks));
  };
  
  const handleTaskAdded = (newTask: Task) => {
    const updatedTasks = [...tasks, newTask];
    saveTasks(updatedTasks);
    setView('list');
  };

  const handleAdminAccessSuccess = () => {
      setIsPasswordModalOpen(false);
      onBackToHome();
  };

  return (
    <motion.div
      key="request-app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
        {/* Desktop Sidebar */}
        <aside className="w-72 bg-white dark:bg-gray-800 shadow-lg flex-col hidden md:flex">
            <RequestSidebarContent view={view} setView={setView} onAdminClick={() => setIsPasswordModalOpen(true)} />
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
                      <RequestSidebarContent
                        view={view}
                        setView={setView}
                        onAdminClick={() => setIsPasswordModalOpen(true)}
                        onNavItemClicked={() => setIsSidebarOpen(false)}
                      />
                    </motion.aside>
                </>
            )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <RequestHeader 
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                toggleTheme={toggleTheme}
                theme={theme}
                view={view}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900/50">
                <AnimatePresence mode="wait">
                  {view === 'form' ? (
                    <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <RequestForm onTaskAdded={handleTaskAdded} tasks={tasks} />
                    </motion.div>
                  ) : view === 'list' ? (
                    <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <MyRequests tasks={tasks} />
                    </motion.div>
                  ) : (
                    <motion.div key="contact" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-0 sm:p-8 rounded-2xl shadow-xl">
                            <ContactForm />
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </main>
        </div>
      
      <ContactWidget />

      <PasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handleAdminAccessSuccess}
      />
    </motion.div>
  );
};

export default RequestApp;