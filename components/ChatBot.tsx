import React, { useState } from 'react';
// Fix: Import Variants type from framer-motion to resolve type error.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiUser, FiMail, FiMessageSquare, FiPhone } from 'react-icons/fi';
import { ContactMessage } from '../types';
import { CONTACT_MESSAGES_STORAGE_KEY } from '../constants';


// A reusable input field component to maintain style consistency
const ContactInputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }> = ({ icon, ...props }) => (
    <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input {...props} className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
    </div>
);

// New component for the contact form, exported for use in other parts of the app.
export const ContactForm: React.FC<{ onSubmitted?: () => void }> = ({ onSubmitted }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || !formData.message || isSubmitting) return;
    
    setIsSubmitting(true);

    const newMessage: ContactMessage = {
        id: `msg-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        message: formData.message,
        timestamp: new Date().toISOString(),
        isRead: false,
    };
    
    try {
        const storedMessagesRaw = localStorage.getItem(CONTACT_MESSAGES_STORAGE_KEY);
        const storedMessages: ContactMessage[] = storedMessagesRaw ? JSON.parse(storedMessagesRaw) : [];
        const updatedMessages = [...storedMessages, newMessage];
        localStorage.setItem(CONTACT_MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages));
    } catch (error) {
        console.error("Failed to save message to localStorage:", error);
    }
    
    setIsSubmitting(false);
    setSubmitSuccess(true);
    
    setTimeout(() => {
        setFormData({ name: '', phone: '', email: '', message: '' });
        setSubmitSuccess(false);
        onSubmitted?.();
    }, 3000);
  };

  if (submitSuccess) {
    return (
        <div className="text-center p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4">
                    <FiSend className="text-green-500" size={32} />
                </div>
            </motion.div>
            <h3 className="text-xl font-bold text-green-500 mb-2">ส่งข้อความสำเร็จ!</h3>
            <p className="text-gray-600 dark:text-gray-400">เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด ขอบคุณค่ะ</p>
        </div>
    );
  }

  return (
    <div className="p-6">
        <h3 className="text-xl font-bold mb-1 text-gray-800 dark:text-gray-100">ติดต่อเจ้าหน้าที่ / แจ้งปัญหา</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">กรุณากรอกข้อมูลด้านล่าง เราจะติดต่อกลับโดยเร็วที่สุด</p>
        <form onSubmit={handleSubmit} className="space-y-4">
            <ContactInputField icon={<FiUser size={18}/>} type="text" placeholder="ชื่อ" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ContactInputField icon={<FiPhone size={18}/>} type="tel" placeholder="เบอร์โทรศัพท์" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                <ContactInputField icon={<FiMail size={18}/>} type="email" placeholder="อีเมล" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400"><FiMessageSquare size={18}/></span>
                 <textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="รายละเอียด" rows={5} required className="resize-none w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
            </div>
            
            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                {!isSubmitting && <FiSend size={18} />}
                {isSubmitting ? 'กำลังส่ง...' : 'ส่ง'}
            </button>
        </form>
    </div>
  );
};

const ContactWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Fix: Explicitly type with Variants to avoid type inference issues with framer-motion.
    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 50, scale: 0.9 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            transition: { type: 'spring', stiffness: 300, damping: 25 }
        },
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={isOpen ? 'ปิดหน้าต่างติดต่อ' : 'เปิดหน้าต่างติดต่อ'}
                    className="bg-brand-primary text-white p-4 rounded-full shadow-lg"
                >
                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={isOpen ? 'x' : 'chat'}
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
                        </motion.div>
                    </AnimatePresence>
                </motion.button>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="fixed bottom-20 right-6 w-full max-w-sm h-full max-h-[650px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden"
                    >
                        <main className="flex-1 overflow-y-auto">
                            <ContactForm onSubmitted={() => setTimeout(() => setIsOpen(false), 1000)} />
                        </main>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ContactWidget;