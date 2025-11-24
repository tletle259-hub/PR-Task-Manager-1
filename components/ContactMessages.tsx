
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContactMessage } from '../types';
import { FiInbox, FiTrash2, FiChevronDown, FiMail, FiUser, FiClock, FiPhone } from 'react-icons/fi';

interface ContactMessagesProps {
  messages: ContactMessage[];
  onUpdateMessage: (messageId: string, updates: Partial<ContactMessage>) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onClearAllMessages: () => Promise<void>;
}

const ContactMessages: React.FC<ContactMessagesProps> = ({ messages, onUpdateMessage, onDeleteMessage, onClearAllMessages }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // เปิด/ปิด รายละเอียดข้อความ และทำเครื่องหมายว่าอ่านแล้ว
  const handleToggle = (messageId: string) => {
    const newExpandedId = expandedId === messageId ? null : messageId;
    setExpandedId(newExpandedId);

    if (newExpandedId) {
      const message = messages.find(m => m.id === messageId);
      if (message && !message.isRead) {
        onUpdateMessage(messageId, { isRead: true });
      }
    }
  };

  const handleDelete = (messageId: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อความนี้?')) {
      onDeleteMessage(messageId);
    }
  };
  
  const handleClearAll = () => {
     if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อความทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      onClearAllMessages();
    }
  }
  
  // เรียงข้อความใหม่ล่าสุดขึ้นก่อน
  const sortedMessages = [...messages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
            <h2 className="text-3xl font-bold flex items-center gap-3"><FiInbox className="text-brand-primary" />กล่องข้อความ</h2>
            <p className="text-gray-500 dark:text-gray-400">ข้อความจากผู้ใช้งานผ่านฟอร์ม "ติดต่อเจ้าหน้าที่"</p>
        </div>
        {messages.length > 0 && (
             <button onClick={handleClearAll} className="icon-interactive text-sm bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-200 transition-colors">
                <FiTrash2 /> ลบทั้งหมด
            </button>
        )}
      </div>

      <div className="space-y-3">
        {sortedMessages.length > 0 ? (
          sortedMessages.map(message => (
            <div key={message.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleToggle(message.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {!message.isRead && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" title="ยังไม่ได้อ่าน"></div>}
                  <p className={`font-semibold ${message.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>{message.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{new Date(message.timestamp).toLocaleString('th-TH')}</p>
                    <FiChevronDown className={`transition-transform ${expandedId === message.id ? 'rotate-180' : ''}`} />
                </div>
              </button>
              <AnimatePresence>
                {expandedId === message.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 mb-4 text-sm">
                            <strong className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><FiUser/> ผู้ส่ง:</strong> 
                            <span className="dark:text-gray-200 break-all">{message.name}</span>
                            
                            <strong className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><FiPhone/> เบอร์โทรศัพท์:</strong> 
                            <span className="dark:text-gray-200 break-all">{message.phone}</span>
                            
                            <strong className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><FiMail/> อีเมล:</strong> 
                            <span className="dark:text-gray-200 break-all">{message.email}</span>

                            <strong className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><FiClock/> วันที่ส่ง:</strong> 
                            <span className="dark:text-gray-200">{new Date(message.timestamp).toLocaleString('th-TH')}</span>
                        </div>
                        <p className="whitespace-pre-wrap p-4 bg-white dark:bg-gray-800 rounded-md mb-4">{message.message}</p>
                        
                        <div className="text-right mt-4">
                             <button onClick={() => handleDelete(message.id)} className="icon-interactive text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-3 py-1 rounded-md flex items-center gap-1 hover:bg-red-200 transition-colors">
                                <FiTrash2 size={12} /> ลบข้อความนี้
                            </button>
                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FiInbox size={48} className="mx-auto mb-4" />
            <p className="font-semibold">ไม่มีข้อความ</p>
            <p className="text-sm">กล่องข้อความของคุณว่างเปล่า</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactMessages;
