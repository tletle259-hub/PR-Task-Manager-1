
import React, { useState, useRef, useEffect } from 'react';
import { FiSun, FiMoon, FiMenu, FiBell, FiX, FiClock, FiUserPlus, FiCheckCircle, FiUser, FiInbox } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { TeamMember, Notification, NotificationType } from '../types';

// --- NOTIFICATION PANEL (หน้าต่างแจ้งเตือนที่ซ่อนอยู่) ---
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
            case NotificationType.NEW_TASK: return <FiInbox className="text-purple-500" />;
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
            className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-dark-card rounded-lg shadow-xl z-20 overflow-hidden border border-gray-200 dark:border-dark-border"
        >
            <header className="p-3 border-b border-gray-200 dark:border-dark-border">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold">การแจ้งเตือน</h3>
                    <div className="flex gap-2">
                        <button onClick={onMarkAllRead} className="icon-interactive text-xs text-brand-primary dark:text-dark-accent hover:underline">อ่านทั้งหมด</button>
                        <button onClick={onClearNotifications} className="icon-interactive text-xs text-red-500 hover:underline">ลบทั้งหมด</button>
                    </div>
                </div>
            </header>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    <ul>
                        {notifications.map(n => (
                            <li key={n.id} className={`border-b border-gray-100 dark:border-dark-muted/20 last:border-b-0 relative group ${!n.isRead ? 'bg-blue-50 dark:bg-dark-accent/10' : ''}`}>
                                <div onClick={() => onNotificationClick(n.taskId)} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-card/50">
                                    <div className="mt-1 w-5 flex-shrink-0">{getIconForType(n.type)}</div>
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-800 dark:text-dark-text">{n.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">{new Date(n.timestamp).toLocaleString('th-TH')}</p>
                                    </div>
                                </div>
                                <button onClick={() => onDeleteNotification(n.id)} className="icon-interactive absolute top-2 right-2 p-1 rounded-full text-gray-400 dark:text-dark-text-muted bg-transparent hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FiX size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-8 text-center text-sm text-gray-500 dark:text-dark-text-muted">
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
  currentUser: TeamMember;
  toggleSidebar: () => void;
  notifications: Notification[];
  onNotificationClick: (taskId: string) => void;
  onDeleteNotification: (notificationId: string) => void;
  onClearNotifications: () => void;
  onMarkAllRead: () => void;
}

// สร้างสีพื้นหลัง Avatar จากชื่อ
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

// --- MAIN HEADER COMPONENT ---
const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, currentUser, toggleSidebar, notifications, onNotificationClick, onDeleteNotification, onClearNotifications, onMarkAllRead }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ปิด Notification Panel เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
       if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // นาฬิกา Realtime
  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formattedDateTime = `${currentTime.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })} เวลา ${currentTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })}`;

  return (
    <header className="bg-white dark:bg-dark-card p-4 shadow-sm flex justify-between items-center border-b border-gray-200 dark:border-dark-border">
      <div className="flex items-center gap-2">
        {/* ปุ่ม Menu สำหรับ Mobile */}
        <button
            onClick={toggleSidebar}
            aria-label="Open menu"
            className="p-2 -ml-2 rounded-full text-gray-500 dark:text-dark-text-muted hover:bg-gray-200 dark:hover:bg-dark-muted transition-colors md:hidden"
        >
            <FiMenu size={24} />
        </button>
        <div>
            <h2 className="text-lg sm:text-xl font-semibold">ยินดีต้อนรับ, {currentUser?.name || 'ทีม'}!</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-muted hidden sm:block">{formattedDateTime}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        {/* ปุ่มเปลี่ยน Theme */}
        <button
          onClick={toggleTheme}
          className="icon-interactive p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-dark-muted dark:hover:bg-dark-border transition-colors"
        >
          {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>

        {/* ปุ่มแจ้งเตือน */}
        <div className="relative" ref={notificationsRef}>
          <div className="relative inline-block">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              aria-label="Toggle notifications"
              className="icon-interactive p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-dark-muted dark:hover:bg-dark-border transition-colors"
            >
              <FiBell size={20} />
            </button>
            {unreadCount > 0 && (
                 <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white dark:ring-dark-card pointer-events-none">
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
        
        {/* โปรไฟล์ผู้ใช้ */}
        <div className="flex items-center gap-2 p-1.5 rounded-lg">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorForString(currentUser.id)} flex-shrink-0`}>
                <FiUser size={20} className="text-white" />
            </div>
            <div className='hidden sm:block'>
                <p className="font-semibold text-left text-sm">{currentUser.name}</p>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted text-left">{currentUser.position}</p>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
