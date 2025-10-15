
import React, { useState, useRef, useEffect } from 'react';
import { FiSun, FiMoon, FiChevronDown, FiMenu, FiBell, FiX, FiClock, FiUserPlus, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { TeamMember, Notification, NotificationType } from '../types';

// --- NOTIFICATION PANEL COMPONENT (INLINED) ---
interface NotificationPanelProps {
  notifications: Notification[];
  onNotificationClick: (taskId: string) => void;
  onDeleteNotification: (notificationId: string) => void;
  onClearNotifications: () => void;
  onMarkAllRead: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onNotificationClick, onDeleteNotification, onClearNotifications, onMarkAllRead }) => {
    
    const getIconForType = (type: NotificationType) => {
        switch (type) {
            case NotificationType.NEW_ASSIGNMENT: return <FiUserPlus className="text-blue-500" />;
            case NotificationType.DUE_SOON: return <FiClock className="text-yellow-500" />;
            case NotificationType.STATUS_UPDATE: return <FiCheckCircle className="text-green-500" />;
            default: return <FiBell className="text-gray-500" />;
        }
    };
    
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-20 overflow-hidden border border-gray-200 dark:border-gray-600"
        >
            <header className="p-3 border-b border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold">การแจ้งเตือน</h3>
                    <div className="flex gap-2">
                        <button onClick={onMarkAllRead} className="icon-interactive text-xs text-blue-500 hover:underline">อ่านทั้งหมด</button>
                        <button onClick={onClearNotifications} className="icon-interactive text-xs text-red-500 hover:underline">ลบทั้งหมด</button>
                    </div>
                </div>
            </header>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    <ul>
                        {notifications.map(n => (
                            <li key={n.id} className={`border-b border-gray-100 dark:border-gray-600 last:border-b-0 relative group ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                <div onClick={() => onNotificationClick(n.taskId)} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <div className="mt-1 w-5 flex-shrink-0">{getIconForType(n.type)}</div>
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-700 dark:text-gray-200">{n.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString('th-TH')}</p>
                                    </div>
                                </div>
                                <button onClick={() => onDeleteNotification(n.id)} className="icon-interactive absolute top-2 right-2 p-1 rounded-full text-gray-400 bg-transparent hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FiX size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        ไม่มีการแจ้งเตือนใหม่
                    </div>
                )}
            </div>
        </motion.div>
    );
};


interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  currentUser: TeamMember | null;
  teamMembers: TeamMember[];
  setCurrentUser: (user: TeamMember) => void;
  toggleSidebar: () => void;
  notifications: Notification[];
  onNotificationClick: (taskId: string) => void;
  onDeleteNotification: (notificationId: string) => void;
  onClearNotifications: () => void;
  onMarkAllRead: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, currentUser, teamMembers, setCurrentUser, toggleSidebar, notifications, onNotificationClick, onDeleteNotification, onClearNotifications, onMarkAllRead }) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
       if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserChange = (user: TeamMember) => {
    setCurrentUser(user);
    setIsUserDropdownOpen(false);
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-white dark:bg-gray-800 p-4 shadow-sm flex justify-between items-center">
      <div className="flex items-center gap-2">
        <button
            onClick={toggleSidebar}
            aria-label="Open menu"
            className="p-2 -ml-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors md:hidden"
        >
            <FiMenu size={24} />
        </button>
        <div>
            <h2 className="text-xl font-semibold">ยินดีต้อนรับ, {currentUser?.name || 'ทีม'}!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">ภาพรวมงานทั้งหมดของคุณในวันนี้</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="icon-interactive p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>

        <div className="relative" ref={notificationsRef}>
          <div className="relative inline-block">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              aria-label="Toggle notifications"
              className="icon-interactive p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <FiBell size={20} />
            </button>
            {unreadCount > 0 && (
                 <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white dark:ring-gray-800 pointer-events-none">
                    {unreadCount}
                 </span>
            )}
          </div>
           <AnimatePresence>
            {isNotificationsOpen && (
              <NotificationPanel
                notifications={notifications}
                onNotificationClick={onNotificationClick}
                onDeleteNotification={onDeleteNotification}
                onClearNotifications={onClearNotifications}
                onMarkAllRead={onMarkAllRead}
              />
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative" ref={userDropdownRef}>
          <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {currentUser && (
              <>
                <img src={currentUser.avatar} alt="User Avatar" className="w-10 h-10 rounded-full object-cover"/>
                <div className='hidden sm:block'>
                    <p className="font-semibold text-left text-sm">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-left">{currentUser.position}</p>
                </div>
                <FiChevronDown size={16} className={`transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          <AnimatePresence>
            {isUserDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-10 overflow-hidden border border-gray-200 dark:border-gray-600"
              >
                <div className="p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-300 px-2 mb-1">สลับผู้ใช้งาน</p>
                    {teamMembers.map(member => (
                       <button 
                         key={member.id} 
                         onClick={() => handleUserChange(member)}
                         disabled={member.id === currentUser?.id}
                         className="w-full flex items-center gap-3 p-2 rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover"/>
                         <div>
                           <p className="font-medium text-sm">{member.name}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400">{member.position}</p>
                         </div>
                       </button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;