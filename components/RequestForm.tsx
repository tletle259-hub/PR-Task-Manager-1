// @ts-nocheck
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiPaperclip, FiX, FiCalendar, FiPlus, FiTrash2, FiInfo, FiBriefcase, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import { Task, TaskStatus, Attachment, Department, TaskTypeConfig, SubTask } from '../types';
import { GOOGLE_DRIVE_UPLOAD_URL } from '../config';
import { RequesterProfile } from '../App';
import { v4 as uuidv4 } from 'uuid';
import { onDepartmentsUpdate } from '../services/departmentService';
import SearchableDropdown from './SearchableDropdown';
import { ensureFirebaseAuth } from '../services/authService';

const OTHER_TASK_TYPE_NAME = 'งานชนิดอื่นๆ';

interface RequestFormProps {
  onTaskAdded: (task: Task | Task[]) => void;
  tasks: Task[];
  user: RequesterProfile;
  taskTypeConfigs: TaskTypeConfig[];
}

const getMinDueDate = (leadTimeDays: number | null): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (leadTimeDays === null || leadTimeDays <= 0) {
        return today.toISOString().split('T')[0];
    }
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + leadTimeDays);
    return minDate.toISOString().split('T')[0];
};

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

const RequestForm: React.FC<RequestFormProps> = ({ onTaskAdded, tasks, user, taskTypeConfigs }) => {
  const [formData, setFormData] = useState({
    requestType: 'new' as 'new' | 'edit' | 'other' | 'project',
    requestDate: new Date().toISOString(),
    dueDate: '',
    requesterName: '',
    department: '',
    committee: '',
    requesterEmail: '',
    phone: '',
    taskType: '',
    otherTaskTypeName: '',
    taskTitle: '',
    taskDescription: '',
    additionalNotes: '',
    position: '', 
  });

  const [projectName, setProjectName] = useState('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([
      { id: uuidv4(), taskType: '', otherTaskTypeName: '', taskTitle: '', taskDescription: '', dueDate: '' }
  ]);
  const [minDueDates, setMinDueDates] = useState<{ [key: string]: string }>({ main: getMinDueDate(null) });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    let unsubscribe: () => void;
    const init = async () => {
        await ensureFirebaseAuth();
        unsubscribe = onDepartmentsUpdate((depts: Department[]) => {
          setDepartments(depts.map(d => d.name));
        });
    };
    init();
    return () => { if(unsubscribe) unsubscribe(); };
  }, []);

  useEffect(() => {
    if ('localAccountId' in user) {
        setFormData(prev => ({ ...prev, requesterName: user.name || '', requesterEmail: user.username }));
    } else {
        setFormData(prev => ({ ...prev, requesterName: `${user.firstNameTh} ${user.lastNameTh}`, requesterEmail: user.email, department: user.department, position: user.position }));
    }
  }, [user]);
  
  const departmentOptions = useMemo(() => {
    const optionSet = new Set(departments);
    if (formData.department && !optionSet.has(formData.department)) {
        optionSet.add(formData.department);
    }
    return Array.from(optionSet).sort();
  }, [departments, formData.department]);
  
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.requesterName.trim()) newErrors.requesterName = 'กรุณากรอกชื่อ-สกุล';
    if (!formData.department.trim()) newErrors.department = 'กรุณากรอกสังกัดฝ่าย/ส่วน';
    if (!formData.phone.trim()) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';

    if (formData.requestType === 'project') {
        if (!projectName.trim()) newErrors.projectName = 'กรุณากรอกชื่อโปรเจกต์';
        subTasks.forEach((sub, index) => {
            if (!sub.taskType) newErrors[`subTaskType_${sub.id}`] = `กรุณาเลือกประเภทงานที่ ${index + 1}`;
            if (!sub.taskTitle.trim()) newErrors[`subTaskTitle_${sub.id}`] = `กรุณากรอกหัวข้องานที่ ${index + 1}`;
            if (!sub.taskDescription.trim()) newErrors[`subTaskDescription_${sub.id}`] = `กรุณากรอกรายละเอียดงานที่ ${index + 1}`;
            if (!sub.dueDate) newErrors[`subTaskDueDate_${sub.id}`] = `กรุณาเลือกวันที่ต้องการรับงานที่ ${index + 1}`;
            if (sub.taskType === OTHER_TASK_TYPE_NAME && !sub.otherTaskTypeName.trim()) newErrors[`subTaskOtherType_${sub.id}`] = `กรุณาระบุประเภทงานที่ ${index + 1}`;
        });
    } else {
        if (!formData.taskType) newErrors.taskType = 'กรุณาเลือกประเภทงาน';
        if (!formData.dueDate) newErrors.dueDate = 'กรุณาเลือกวันที่ต้องการรับงาน';
        if (formData.taskType === OTHER_TASK_TYPE_NAME && !formData.otherTaskTypeName.trim()) newErrors.otherTaskTypeName = 'กรุณาระบุประเภทงาน';
        if (!formData.taskTitle.trim()) newErrors.taskTitle = 'กรุณากรอกหัวข้องาน';
        if (!formData.taskDescription.trim()) newErrors.taskDescription = 'กรุณากรอกรายละเอียดงาน';
    }
    
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'taskType') {
        const config = taskTypeConfigs.find(c => c.name === value);
        const leadTime = config?.leadTimeDays ?? null;
        const newMinDate = getMinDueDate(leadTime);
        setMinDueDates(prev => ({ ...prev, main: newMinDate }));

        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (prev.dueDate && prev.dueDate < newMinDate) {
                updated.dueDate = ''; 
            }
            return updated;
        });
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
     if (errors[name]) {
        setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
    }
  };
  
  const handleDropdownChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
    }
  };

  const handleSubTaskChange = (id: string, field: keyof SubTask, value: string) => {
    setSubTasks(prev => prev.map(sub => {
        if (sub.id === id) {
            const updatedSub = { ...sub, [field]: value };
            if (field === 'taskType') {
                const config = taskTypeConfigs.find(c => c.name === value);
                const leadTime = config?.leadTimeDays ?? null;
                const newMinDate = getMinDueDate(leadTime);
                setMinDueDates(prevMin => ({ ...prevMin, [id]: newMinDate }));
                if (updatedSub.dueDate && updatedSub.dueDate < newMinDate) {
                    updatedSub.dueDate = '';
                }
            }
            return updatedSub;
        }
        return sub;
    }));
    const errorKey = `subTask${field.charAt(0).toUpperCase() + field.slice(1)}_${id}`;
    if (errors[errorKey]) {
        setErrors(prevErrors => { const newErrors = {...prevErrors}; delete newErrors[errorKey]; return newErrors; })
    }
  };

  const addSubTask = () => {
      setSubTasks(prev => [...prev, { id: uuidv4(), taskType: '', otherTaskTypeName: '', taskTitle: '', taskDescription: '', dueDate: '' }]);
  };

  const removeSubTask = (id: string) => {
      if (subTasks.length > 1) { setSubTasks(prev => prev.filter(sub => sub.id !== id)); }
  };
  
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({...prev, requestType: e.target.value as 'new' | 'edit' | 'other' | 'project'}));
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      // Limit file size to 30MB (30 * 1024 * 1024 bytes)
      const MAX_SIZE = 30 * 1024 * 1024; 
      const validFiles: File[] = [];
      let hasOversizedFile = false;

      Array.from(files).forEach(file => {
          if (file.size <= MAX_SIZE) {
              validFiles.push(file);
          } else {
              hasOversizedFile = true;
          }
      });

      if (hasOversizedFile) {
          alert("บางไฟล์มีขนาดเกิน 30MB และจะไม่ถูกอัปโหลด");
      }

      setAttachments(prev => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => { setAttachments(prev => prev.filter((_, i) => i !== index)); };
  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.length) { handleFileChange(e.dataTransfer.files); } }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        const firstErrorKey = Object.keys(formErrors)[0];
        const firstErrorField = document.querySelector(`[name="${firstErrorKey}"]`) || document.getElementById(firstErrorKey);
        firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    setIsSubmitting(true);
    try {
        // 1. Upload Attachments
        const attachmentPromises = attachments.map(async (file): Promise<Attachment> => {
            if (GOOGLE_DRIVE_UPLOAD_URL) {
                try {
                    const base64Data = await fileToBase64(file);
                    const response = await fetch(GOOGLE_DRIVE_UPLOAD_URL, { method: 'POST', body: JSON.stringify({ fileName: file.name, mimeType: file.type, data: base64Data }) });
                    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
                    const result = await response.json();
                    if (result.fileUrl) return { name: file.name, size: file.size, type: file.type, url: result.fileUrl };
                } catch (error) { console.error('Error uploading file:', file.name, error); }
            }
            return { name: file.name, size: file.size, type: file.type };
        });
        const fileData = await Promise.all(attachmentPromises);
        
        // 2. Calculate Max ID
        const currentYear = new Date().getFullYear();
        let maxId = 0;
        
        // Regex matches PR numbers for the CURRENT YEAR.
        // Supports both "PRxxx-YYYY" (new) and "PRxxx/YYYY" (legacy display) if saved that way.
        const idPattern = new RegExp(`^PR(\\d+)[\\/-]${currentYear}$`, 'i');

        tasks.forEach(t => {
            const match = t.id.match(idPattern);
            if (match) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > maxId) {
                    maxId = num;
                }
            }
        });

        // 3. Generate Tasks
        let tasksToCreate: Task[] = [];
        let nextSequence = maxId + 1;

        const commonData = {
            timestamp: new Date().toISOString(),
            requesterName: formData.requesterName,
            requesterEmail: formData.requesterEmail,
            department: formData.department,
            committee: formData.committee,
            phone: formData.phone,
            status: TaskStatus.NOT_STARTED,
            assigneeIds: [], // Initialize with empty array
            isStarred: false,
            notes: [],
            attachments: fileData,
            requestType: formData.requestType,
            additionalNotes: formData.additionalNotes || null, // Convert undefined to null
        };

        if (formData.requestType === 'project') {
            const projectId = `PROJ-${Date.now()}`;
            
            tasksToCreate = subTasks.map(sub => {
                // Generate ID: PRxxx-YYYY (e.g., PR001-2025, PR1000-2025)
                const taskId = `PR${nextSequence.toString().padStart(3, '0')}-${currentYear}`;
                nextSequence++;
                return {
                    ...commonData,
                    id: taskId,
                    taskTitle: sub.taskTitle,
                    taskDescription: sub.taskDescription,
                    taskType: sub.taskType === OTHER_TASK_TYPE_NAME ? sub.taskType : sub.taskType,
                    // Convert undefined to null for Firestore compatibility
                    otherTaskTypeName: sub.taskType === OTHER_TASK_TYPE_NAME ? sub.otherTaskTypeName : null,
                    dueDate: sub.dueDate,
                    projectId,
                    projectName: projectName
                };
            });
        } else {
            const taskId = `PR${nextSequence.toString().padStart(3, '0')}-${currentYear}`;
            tasksToCreate = [{
                ...commonData,
                id: taskId,
                taskTitle: formData.taskTitle,
                taskDescription: formData.taskDescription,
                taskType: formData.taskType === OTHER_TASK_TYPE_NAME ? formData.taskType : formData.taskType,
                // Convert undefined to null for Firestore compatibility
                otherTaskTypeName: formData.taskType === OTHER_TASK_TYPE_NAME ? formData.otherTaskTypeName : null,
                dueDate: formData.dueDate,
            }];
        }

        // 4. Submit Tasks
        onTaskAdded(tasksToCreate);

        // 5. Reset Form
        setFormData(prev => ({
            ...prev,
            requestDate: new Date().toISOString(),
            dueDate: '',
            taskType: '',
            otherTaskTypeName: '',
            taskTitle: '',
            taskDescription: '',
            additionalNotes: '',
            committee: '',
        }));
        setAttachments([]);
        setProjectName('');
        setSubTasks([{ id: uuidv4(), taskType: '', otherTaskTypeName: '', taskTitle: '', taskDescription: '', dueDate: '' }]);
        
    } catch (error) {
        console.error("Error submitting task:", error);
        alert("เกิดข้อผิดพลาดในการส่งคำขอ: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-brand-primary p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">แบบฟอร์มขอความอนุเคราะห์</h2>
          <p className="text-blue-100 text-sm mt-1">ส่วนงานสื่อสารองค์กร สภาวิชาชีพบัญชีฯ</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-3xl font-bold">{currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-blue-100 text-sm">{currentTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        {/* Section 1: Requester Info */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4 flex items-center gap-2">
            <FiUser className="text-brand-primary" /> ข้อมูลผู้ขอรับบริการ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">ชื่อ-สกุล ผู้ขอรับบริการ <span className="text-red-500">*</span></label>
              <input type="text" name="requesterName" value={formData.requesterName} onChange={handleChange} className={`form-input mt-1 ${errors.requesterName ? 'border-red-500 ring-red-500' : ''}`} readOnly={!!user.id} />
              {errors.requesterName && <p className="text-red-500 text-xs mt-1">{errors.requesterName}</p>}
            </div>
            <div>
              <label className="form-label">สังกัดฝ่าย/ส่วน <span className="text-red-500">*</span></label>
               <SearchableDropdown
                    name="department"
                    options={departmentOptions}
                    value={formData.department}
                    onChange={(value) => handleDropdownChange('department', value)}
                    error={errors.department}
                    placeholder="เลือกหรือพิมพ์ค้นหา..."
                />
            </div>
            <div>
              <label className="form-label">ในนามคณะกรรมการ/คณะทำงาน (ถ้ามี)</label>
              <input type="text" name="committee" value={formData.committee} onChange={handleChange} placeholder="ระบุชื่อคณะ..." className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">อีเมล <span className="text-red-500">*</span></label>
              <div className="relative">
                  <FiMail className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"/>
                  <input type="email" name="requesterEmail" value={formData.requesterEmail} onChange={handleChange} className="form-input mt-1 pl-10 bg-gray-100 text-gray-600 cursor-not-allowed" readOnly />
              </div>
            </div>
            <div>
              <label className="form-label">เบอร์โทรศัพท์ (มือถือ/ภายใน) <span className="text-red-500">*</span></label>
              <div className="relative">
                  <FiPhone className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"/>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="เช่น 081-234-5678 หรือ ต่อ 1234" className={`form-input mt-1 pl-10 ${errors.phone ? 'border-red-500 ring-red-500' : ''}`} />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
        </section>

        {/* Section 2: Job Details */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4 flex items-center gap-2">
            <FiBriefcase className="text-brand-primary" /> รายละเอียดงาน
          </h3>
          
          {/* Request Type Selector */}
          <div className="mb-6">
            <label className="form-label mb-2">รูปแบบคำขอ</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'new', label: 'งานใหม่ (New)' },
                { id: 'edit', label: 'แก้ไขงานเดิม (Edit)' },
                { id: 'project', label: 'โปรเจกต์ (Project)' },
                { id: 'other', label: 'อื่นๆ (Other)' }
              ].map((type) => (
                <label key={type.id} className={`cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.requestType === type.id ? 'bg-blue-50 border-brand-primary text-brand-primary font-bold shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="requestType" value={type.id} checked={formData.requestType === type.id} onChange={handleRadioChange} className="hidden" />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          {/* Dynamic Content based on Request Type */}
          {formData.requestType === 'project' ? (
             <div className="space-y-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                <div>
                    <label className="form-label">ชื่อโปรเจกต์ <span className="text-red-500">*</span></label>
                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className={`form-input mt-1 ${errors.projectName ? 'border-red-500' : ''}`} placeholder="เช่น งานสัมมนาประจำปี 2568"/>
                    {errors.projectName && <p className="text-red-500 text-xs mt-1">{errors.projectName}</p>}
                </div>

                {subTasks.map((sub, index) => (
                    <div key={sub.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 relative">
                        <h4 className="font-bold text-brand-primary mb-3 flex justify-between items-center">
                            งานย่อยที่ {index + 1}
                            {subTasks.length > 1 && (
                                <button type="button" onClick={() => removeSubTask(sub.id)} className="text-red-500 hover:text-red-700 p-1"><FiTrash2 /></button>
                            )}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">ประเภทงาน <span className="text-red-500">*</span></label>
                                <select value={sub.taskType} onChange={e => handleSubTaskChange(sub.id, 'taskType', e.target.value)} className={`form-input mt-1 ${errors[`subTaskType_${sub.id}`] ? 'border-red-500' : ''}`}>
                                    <option value="">เลือกประเภทงาน</option>
                                    {taskTypeConfigs.map(config => <option key={config.id} value={config.name}>{config.name}</option>)}
                                    <option value={OTHER_TASK_TYPE_NAME}>{OTHER_TASK_TYPE_NAME}</option>
                                </select>
                                {errors[`subTaskType_${sub.id}`] && <p className="text-red-500 text-xs mt-1">{errors[`subTaskType_${sub.id}`]}</p>}
                            </div>
                            {sub.taskType === OTHER_TASK_TYPE_NAME && (
                                <div>
                                    <label className="form-label">ระบุประเภทงาน <span className="text-red-500">*</span></label>
                                    <input type="text" value={sub.otherTaskTypeName} onChange={e => handleSubTaskChange(sub.id, 'otherTaskTypeName', e.target.value)} className={`form-input mt-1 ${errors[`subTaskOtherType_${sub.id}`] ? 'border-red-500' : ''}`} />
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <label className="form-label">หัวข้อชิ้นงาน <span className="text-red-500">*</span></label>
                                <input type="text" value={sub.taskTitle} onChange={e => handleSubTaskChange(sub.id, 'taskTitle', e.target.value)} className={`form-input mt-1 ${errors[`subTaskTitle_${sub.id}`] ? 'border-red-500' : ''}`} placeholder="ระบุชื่อชิ้นงานย่อย"/>
                            </div>
                            <div className="md:col-span-2">
                                <label className="form-label">รายละเอียด <span className="text-red-500">*</span></label>
                                <textarea value={sub.taskDescription} onChange={e => handleSubTaskChange(sub.id, 'taskDescription', e.target.value)} rows={3} className={`form-input mt-1 ${errors[`subTaskDescription_${sub.id}`] ? 'border-red-500' : ''}`} placeholder="รายละเอียดของงานนี้..."/>
                            </div>
                            <div>
                                <label className="form-label">วันที่ต้องการรับงาน <span className="text-red-500">*</span></label>
                                <input type="date" value={sub.dueDate} min={minDueDates[sub.id]} onChange={e => handleSubTaskChange(sub.id, 'dueDate', e.target.value)} className={`form-input mt-1 ${errors[`subTaskDueDate_${sub.id}`] ? 'border-red-500' : ''}`}/>
                            </div>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addSubTask} className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-brand-primary hover:border-brand-primary transition-colors flex items-center justify-center gap-2 font-medium">
                    <FiPlus /> เพิ่มงานย่อย
                </button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="form-label">ประเภทงาน <span className="text-red-500">*</span></label>
                    <select name="taskType" value={formData.taskType} onChange={handleChange} className={`form-input mt-1 ${errors.taskType ? 'border-red-500 ring-red-500' : ''}`}>
                        <option value="">เลือกประเภทงาน</option>
                        {taskTypeConfigs.map(config => (
                            <option key={config.id} value={config.name}>{config.name}</option>
                        ))}
                        <option value={OTHER_TASK_TYPE_NAME}>{OTHER_TASK_TYPE_NAME}</option>
                    </select>
                    {errors.taskType && <p className="text-red-500 text-xs mt-1">{errors.taskType}</p>}
                </div>

                {formData.taskType === OTHER_TASK_TYPE_NAME && (
                    <div>
                        <label className="form-label">ระบุชื่อประเภทงาน <span className="text-red-500">*</span></label>
                        <input type="text" name="otherTaskTypeName" value={formData.otherTaskTypeName} onChange={handleChange} className={`form-input mt-1 ${errors.otherTaskTypeName ? 'border-red-500 ring-red-500' : ''}`} placeholder="เช่น ออกแบบโลโก้, ตัดต่อวิดีโอ" />
                        {errors.otherTaskTypeName && <p className="text-red-500 text-xs mt-1">{errors.otherTaskTypeName}</p>}
                    </div>
                )}

                <div className="md:col-span-2">
                    <label className="form-label">หัวข้อชื่องาน <span className="text-red-500">*</span></label>
                    <input type="text" name="taskTitle" value={formData.taskTitle} onChange={handleChange} placeholder="ระบุชื่อหัวข้องานให้ชัดเจน" className={`form-input mt-1 ${errors.taskTitle ? 'border-red-500 ring-red-500' : ''}`} />
                    {errors.taskTitle && <p className="text-red-500 text-xs mt-1">{errors.taskTitle}</p>}
                </div>

                <div className="md:col-span-2">
                    <label className="form-label">รายละเอียดของงาน <span className="text-red-500">*</span></label>
                    <textarea name="taskDescription" value={formData.taskDescription} onChange={handleChange} rows={4} placeholder="อธิบายรายละเอียดสิ่งที่ต้องการให้ครบถ้วน..." className={`form-input mt-1 ${errors.taskDescription ? 'border-red-500 ring-red-500' : ''}`} />
                    {errors.taskDescription && <p className="text-red-500 text-xs mt-1">{errors.taskDescription}</p>}
                </div>

                <div>
                    <label className="form-label">วันที่ต้องการรับงาน <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <FiCalendar className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"/>
                        <input type="date" name="dueDate" value={formData.dueDate} min={minDueDates.main} onChange={handleChange} className={`form-input mt-1 pl-10 ${errors.dueDate ? 'border-red-500 ring-red-500' : ''}`} />
                    </div>
                    {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
                    {formData.taskType && (
                        <p className="text-xs text-gray-500 mt-1">
                            <FiInfo className="inline mr-1"/>
                            ประเภทงานนี้ต้องจองล่วงหน้าอย่างน้อย {taskTypeConfigs.find(c => c.name === formData.taskType)?.leadTimeDays || 0} วัน
                        </p>
                    )}
                </div>
            </div>
          )}

          {/* Attachments Section */}
          <div className="mt-6">
            <label className="form-label mb-2">ไฟล์แนบ (ถ้ามี)</label>
            <div
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-brand-primary bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'}`}
            >
                <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">ลากและวางไฟล์ที่นี่ หรือ <label className="text-brand-primary cursor-pointer hover:underline"><input type="file" multiple onChange={(e) => handleFileChange(e.target.files)} className="hidden" />คลิกเพื่อเลือกไฟล์</label></p>
                <p className="text-xs text-gray-500 mt-1">รองรับไฟล์ภาพและเอกสาร (สูงสุด 30MB)</p>
            </div>
            {attachments.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {attachments.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-sm">
                            <span className="flex items-center gap-2 truncate"><FiPaperclip /> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700 p-1"><FiX /></button>
                        </li>
                    ))}
                </ul>
            )}
          </div>

          <div className="mt-6">
            <label className="form-label">หมายเหตุเพิ่มเติม</label>
            <textarea name="additionalNotes" value={formData.additionalNotes} onChange={handleChange} rows={2} placeholder="ข้อมูลเพิ่มเติมถึงทีมงาน (ถ้ามี)" className="form-input mt-1" />
          </div>
        </section>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
                {isSubmitting ? (
                    <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> กำลังส่งข้อมูล...</>
                ) : (
                    <>ส่งคำร้องขอ</>
                )}
            </button>
        </div>
      </form>
    </motion.div>
  );
};

export default RequestForm;