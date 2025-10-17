import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiPaperclip, FiX, FiCalendar } from 'react-icons/fi';
import { Task, TaskType, TaskStatus, Attachment, User } from './types';
import { GOOGLE_DRIVE_UPLOAD_URL } from './config';
import { RequesterProfile } from './App';
import { AccountInfo } from '@azure/msal-browser';

interface RequestFormProps {
  onTaskAdded: (task: Task) => void;
  tasks: Task[];
  user: RequesterProfile;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

const RequestForm: React.FC<RequestFormProps> = ({ onTaskAdded, tasks, user }) => {
  const [formData, setFormData] = useState({
    requestType: 'new' as 'new' | 'edit' | 'other',
    requestDate: new Date().toISOString(),
    dueDate: '',
    requesterName: '',
    department: '',
    committee: '',
    requesterEmail: '',
    phone: '',
    taskType: TaskType.OTHER,
    otherTaskTypeName: '',
    taskTitle: '',
    taskDescription: '',
    additionalNotes: '',
    position: '', // Added position to form state
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Populate form with user data from either profile type
    if ('localAccountId' in user) { // MSAL AccountInfo
        setFormData(prev => ({
            ...prev,
            requesterName: user.name || '',
            requesterEmail: user.username,
        }));
    } else { // Custom User
        setFormData(prev => ({
            ...prev,
            requesterName: `${user.firstNameTh} ${user.lastNameTh}`,
            requesterEmail: user.email,
            department: user.department,
            position: user.position,
        }));
    }
  }, [user]);

  const validate = (data = formData) => {
    const errors: { [key: string]: string } = {};

    if (!data.dueDate) {
        errors.dueDate = 'กรุณาเลือกวันที่ต้องการรับงาน';
    } else {
        const requestDateOnly = new Date();
        requestDateOnly.setHours(0, 0, 0, 0);
        if (new Date(data.dueDate) < requestDateOnly) {
            errors.dueDate = 'วันที่ต้องการรับงานต้องไม่เก่ากว่าวันที่สั่งงาน';
        }
    }
    if (!data.requesterName.trim()) errors.requesterName = 'กรุณากรอกชื่อ-สกุล';
    if (!data.department.trim()) errors.department = 'กรุณากรอกสังกัดฝ่าย/ส่วน';
    if (!data.phone.trim()) {
        errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    }
    if (data.taskType === TaskType.OTHER && !data.otherTaskTypeName.trim()) {
        errors.otherTaskTypeName = 'กรุณาระบุประเภทงาน';
    }
    if (!data.taskTitle.trim()) errors.taskTitle = 'กรุณากรอกหัวข้องาน';
    if (!data.taskDescription.trim()) errors.taskDescription = 'กรุณากรอกรายละเอียดงาน';
    
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
     if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    const formErrors = validate();
    if (formErrors[name]) {
         setErrors(prev => ({ ...prev, [name]: formErrors[name] }));
    } else {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({...prev, requestType: e.target.value as 'new' | 'edit' | 'other'}));
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file => file.size <= 100 * 1024 * 1024);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  }, []);
  
  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        const firstErrorField = document.querySelector(`[name="${Object.keys(formErrors)[0]}"]`);
        firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    setIsSubmitting(true);

    try {
        if (!GOOGLE_DRIVE_UPLOAD_URL) {
            console.warn("Google Drive upload URL is not configured. Skipping image uploads.");
        }

        const attachmentPromises = attachments.map(async (file): Promise<Attachment> => {
            if (file.type.startsWith('image/') && GOOGLE_DRIVE_UPLOAD_URL) {
                try {
                    const base64Data = await fileToBase64(file);
                    const response = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
                        method: 'POST',
                        body: JSON.stringify({
                            fileName: file.name,
                            mimeType: file.type,
                            data: base64Data,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Upload failed: ${response.statusText}`);
                    }

                    const result = await response.json();
                    if (result.fileUrl) {
                        return { name: file.name, size: file.size, type: file.type, url: result.fileUrl };
                    }
                } catch (error) {
                    console.error('Error uploading file to Google Drive:', file.name, error);
                }
            }
            return { name: file.name, size: file.size, type: file.type };
        });
        
        const fileData = await Promise.all(attachmentPromises);
        
        const existingIds = tasks.map(t => parseInt(t.id.replace('PR', ''), 10)).filter(id => !isNaN(id));
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        const nextId = `PR${(maxId + 1).toString().padStart(3, '0')}`;
        
        const { position, ...restFormData } = formData;

        const newTask: Task = {
          ...restFormData,
          id: nextId,
          timestamp: new Date().toISOString(),
          attachments: fileData,
          assigneeId: null,
          status: TaskStatus.NOT_STARTED,
          isStarred: false,
          notes: [],
        };
        
        onTaskAdded(newTask);
    } catch (error) {
        console.error("Error during form submission:", error);
        alert('เกิดข้อผิดพลาดในการส่งฟอร์ม กรุณาลองใหม่อีกครั้ง');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <FormSection title="ข้อมูลเบื้องต้น">
            <div className="md:col-span-2">
                <label className="form-label">1. ประเภทการสั่งงาน *</label>
                <div className="flex flex-wrap gap-4 mt-2">
                    <RadioOption name="requestType" value="new" checked={formData.requestType === 'new'} onChange={handleRadioChange} label="สั่งงานใหม่" />
                    <RadioOption name="requestType" value="edit" checked={formData.requestType === 'edit'} onChange={handleRadioChange} label="แก้ไขงาน" />
                    <RadioOption name="requestType" value="other" checked={formData.requestType === 'other'} onChange={handleRadioChange} label="อื่นๆ" />
                </div>
            </div>
            <InputField 
                label="2. วัน/เดือน/ปี (ที่สั่งงานหรือแก้ไขงาน) *" 
                name="requestDate" 
                type="text" 
                value={currentTime.toLocaleString('th-TH', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '')} 
                readOnly 
                className="!bg-gray-100 dark:!bg-gray-700 cursor-not-allowed" 
            />
            <InputField label="3. วัน/เดือน/ปี (ที่ต้องการรับงาน) *" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} onBlur={handleBlur} error={errors.dueDate} required icon={<FiCalendar className="w-5 h-5 text-gray-400" />} />
            <InputField label="4. ชื่อ-สกุล ผู้สั่งงาน *" name="requesterName" value={formData.requesterName} readOnly className="!bg-gray-100 dark:!bg-gray-700 cursor-not-allowed"/>
            <InputField label="5. สังกัดฝ่าย/ส่วน *" name="department" value={formData.department} readOnly className="!bg-gray-100 dark:!bg-gray-700 cursor-not-allowed"/>
            <InputField label="6. เป็นชิ้นงานของคณะกรรมการฯ คณะอนุกรรมการ หรือคณะทำงานใด? (หากไม่มี ไม่ต้องระบุ)" name="committee" value={formData.committee} onChange={handleChange} onBlur={handleBlur} placeholder="เช่น คณะกรรมการกำหนดมาตรฐานการบัญชี"/>
            <InputField label="7. อีเมล *" name="requesterEmail" type="email" value={formData.requesterEmail} readOnly className="!bg-gray-100 dark:!bg-gray-700 cursor-not-allowed" />
            <InputField label="เบอร์โทรศัพท์ *" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} error={errors.phone} required placeholder="เช่น 2546 หรือ 0-2685-2500" />
        </FormSection>

        <FormSection title="รายละเอียดชิ้นงาน">
            <div className="md:col-span-2">
                <label className="form-label">8. ประเภทงานที่ประสงค์รับบริการ *</label>
                <select name="taskType" value={formData.taskType} onChange={handleChange} className="form-input mt-1" required>
                    {Object.values(TaskType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
             {formData.taskType === TaskType.OTHER && (
                 <div className="md:col-span-2">
                    <InputField label="9. งานชนิดอื่น ๆ ที่ไม่มีในตัวเลือก โปรดระบุ.... *" name="otherTaskTypeName" value={formData.otherTaskTypeName} onChange={handleChange} onBlur={handleBlur} error={errors.otherTaskTypeName} required placeholder="ระบุประเภทงานอื่นๆ" />
                </div>
             )}
            <InputField label="หัวข้องาน *" name="taskTitle" value={formData.taskTitle} onChange={handleChange} onBlur={handleBlur} error={errors.taskTitle} required placeholder="เช่น ออกแบบโปสเตอร์งานสัมมนา" wrapperClassName="md:col-span-2"/>
            <div className="md:col-span-2">
                <label className="form-label">รายละเอียดงาน *</label>
                <textarea name="taskDescription" value={formData.taskDescription} onChange={handleChange} onBlur={handleBlur} rows={4} className={`form-input mt-1 focus:outline-none focus:ring-2 ${errors.taskDescription ? 'border-red-500 focus:ring-red-500' : 'focus:ring-brand-secondary'}`} required placeholder="โปรดระบุรายละเอียดของงาน เช่น ขนาด สี รูปแบบ วัตถุประสงค์ ฯลฯ" aria-invalid={!!errors.taskDescription} aria-describedby={errors.taskDescription ? 'taskDescription-error' : undefined}/>
                <AnimatePresence>
                    {errors.taskDescription && (
                    <motion.p
                        id="taskDescription-error"
                        className="mt-1 text-sm text-red-600"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                    >
                        {errors.taskDescription}
                    </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </FormSection>

        <div>
          <label className="form-label">10. กรุณาอัปโหลดข้อมูลประกอบการผลิต แก้ไข และขนาดชิ้นงานได้ที่นี่</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">• ขีดจำกัดจำนวนไฟล์: 10 • ขีดจำกัดขนาดไฟล์เดียว: 100MB • ชนิดไฟล์ที่ได้รับอนุญาต: Word, Excel, PPT, PDF, รูป, วิดีโอ, เสียง</p>
          <div
            onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
            className={`relative rounded-lg p-8 text-center transition-colors border-2 border-dashed ${isDragging ? 'bg-emerald-50 dark:bg-emerald-900/50 border-brand-secondary' : 'border-gray-300 dark:border-gray-600 hover:border-brand-secondary hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
          >
            <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">ลากและวางไฟล์ที่นี่ หรือ <span className="font-semibold text-brand-secondary">คลิกเพื่อเลือกไฟล์</span></p>
            <input type="file" multiple onChange={(e) => handleFileChange(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <div className="flex items-center gap-2 text-sm">
                    <FiPaperclip className="text-gray-500" />
                    <span>{file.name}</span>
                    <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button type="button" onClick={() => removeAttachment(index)} aria-label={`Remove ${file.name}`} className="icon-interactive text-red-500 hover:text-red-700"><FiX /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label className="form-label">11. หมายเหตุเพิ่มเติม (ถ้ามี)</label>
          <textarea name="additionalNotes" value={formData.additionalNotes} onChange={handleChange} onBlur={handleBlur} rows={3} className="form-input mt-1 focus:outline-none focus:ring-2 focus:ring-brand-secondary" placeholder="ข้อมูลเพิ่มเติมที่ต้องการแจ้ง"/>
        </div>

        <div className="text-right pt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isSubmitting}
            className="icon-interactive bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังส่งและอัปโหลด...' : 'ส่งคำร้องขอ'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

// Helper Components
const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-6 border-t border-gray-200 dark:border-gray-700 first:pt-0 first:border-none">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
    </div>
);

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  wrapperClassName?: string;
  error?: string;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ label, wrapperClassName = '', error, icon, ...props }) => {
    const { className, ...restProps } = props;
    return (
        <div className={wrapperClassName}>
            <label htmlFor={props.name} className="form-label">{label}</label>
            <div className="relative mt-1">
                <input
                    id={props.name}
                    {...restProps}
                    className={`form-input !mt-0 w-full focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-brand-secondary'} ${icon ? 'pr-10' : ''} ${className || ''}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${props.name}-error` : undefined}
                />
                {icon && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {icon}
                    </div>
                )}
            </div>
            <AnimatePresence>
                {error && (
                <motion.p
                    id={`${props.name}-error`}
                    className="mt-1 text-sm text-red-600"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                >
                    {error}
                </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};


const RadioOption: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props}) => (
    <label className="flex items-center gap-2 cursor-pointer">
        <input type="radio" {...props} className="w-4 h-4 text-brand-secondary focus:ring-brand-secondary bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600" />
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
    </label>
);

const FormStylesInjector = () => (
    <style>{`
        .form-label {
            display: block;
            font-size: 0.875rem; /* text-sm */
            font-weight: 500; /* font-medium */
            color: #374151; /* text-gray-700 */
        }
        .dark .form-label {
             color: #d1d5db; /* dark:text-gray-300 */
        }
        .form-input {
            width: 100%;
            padding: 0.75rem;
            border-radius: 0.5rem; /* rounded-lg */
            border-width: 1px;
            border-color: #d1d5db; /* border-gray-300 */
            background-color: #f9fafb; /* bg-gray-50 */
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dark .form-input {
            border-color: #4b5563; /* dark:border-gray-600 */
            background-color: #374151; /* dark:bg-gray-700 */
        }
        /* Fix for date picker icon color in dark mode */
        input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(var(--dark-mode-invert, 0));
        }
        .dark {
            --dark-mode-invert: 1;
        }
    `}</style>
)

const InjectedRequestForm: React.FC<RequestFormProps> = (props) => (
    <>
        <FormStylesInjector />
        <RequestForm {...props} />
    </>
)

export default InjectedRequestForm;
