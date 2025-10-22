import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiPaperclip, FiX, FiCalendar, FiPlus, FiTrash2, FiInfo } from 'react-icons/fi';
import { Task, TaskStatus, Attachment, User, Department, TaskTypeConfig, SubTask } from '../types';
import { GOOGLE_DRIVE_UPLOAD_URL } from '../config';
import { RequesterProfile } from '../App';
import { v4 as uuidv4 } from 'uuid';
import { onDepartmentsUpdate } from '../services/departmentService';
import SearchableDropdown from './SearchableDropdown';

const OTHER_TASK_TYPE_NAME = 'งานชนิดอื่นๆ';

interface RequestFormProps {
  onTaskAdded: (task: Task | Task[]) => void;
  tasks: Task[];
  user: RequesterProfile;
  taskTypeConfigs: TaskTypeConfig[];
}

const getMinDueDate = (leadTimeDays: number | null): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of today
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
    const unsubscribe = onDepartmentsUpdate((depts: Department[]) => {
      setDepartments(depts.map(d => d.name));
    });
    return () => unsubscribe();
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
  
  const dailyUsage = useMemo(() => {
    const counts = new Map<string, number>();
    const todayStr = new Date().toISOString().split('T')[0];
    tasks.forEach(task => {
        if (task.timestamp.startsWith(todayStr)) {
            counts.set(task.taskType, (counts.get(task.taskType) || 0) + 1);
        }
    });
    return counts;
  }, [tasks]);

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
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement>) => {
    const { name } = e.target;
    const formErrors = validate();
    if (formErrors[name]) { setErrors(prev => ({ ...prev, [name]: formErrors[name] })); }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({...prev, requestType: e.target.value as 'new' | 'edit' | 'other' | 'project'}));
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file => file.size <= 100 * 1024 * 1024);
      setAttachments(prev => [...prev, ...newFiles]);
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
        const existingIds = tasks.map(t => parseInt(t.id.replace('PR', ''), 10)).filter(id => !isNaN(id));
        let maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        
        if (formData.requestType === 'project') {
            const projectId = `PROJ${Date.now()}`;
            const projectTasks: Task[] = subTasks.map(sub => {
                maxId++;
                const nextId = `PR${(maxId).toString().padStart(3, '0')}`;
                const taskData: Task = {
                    id: nextId, projectId, projectName,
                    taskTitle: sub.taskTitle, taskDescription: sub.taskDescription, taskType: sub.taskType, dueDate: sub.dueDate,
                    requestType: 'project', requesterName: formData.requesterName, department: formData.department, committee: formData.committee, requesterEmail: formData.requesterEmail, phone: formData.phone, additionalNotes: formData.additionalNotes,
                    timestamp: new Date().toISOString(), attachments: fileData, assigneeId: null, status: TaskStatus.NOT_STARTED, isStarred: false, notes: [],
                };
                if (sub.taskType === OTHER_TASK_TYPE_NAME) taskData.otherTaskTypeName = sub.otherTaskTypeName;
                return taskData;
            });
            onTaskAdded(projectTasks);
        } else {
             maxId++;
             const nextId = `PR${(maxId).toString().padStart(3, '0')}`;
             const { position, ...restFormData } = formData;
             const newTask: Task = {
              ...restFormData, id: nextId, timestamp: new Date().toISOString(), attachments: fileData, assigneeId: null, status: TaskStatus.NOT_STARTED, isStarred: false, notes: [],
            };
            if (newTask.taskType !== OTHER_TASK_TYPE_NAME) delete (newTask as Partial<Task>).otherTaskTypeName;
            onTaskAdded(newTask);
        }
    } catch (error) {
        console.error("Error during form submission:", error);
        alert('เกิดข้อผิดพลาดในการส่งฟอร์ม กรุณาลองใหม่อีกครั้ง');
    } finally { setIsSubmitting(false); }
  };
  
  const mainLeadTime = taskTypeConfigs.find(c => c.name === formData.taskType)?.leadTimeDays;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <FormSection title="ข้อมูลเบื้องต้น">
            <div className="md:col-span-2">
                <label className="form-label">1. ประเภทการสั่งงาน *</label>
                <div className="flex flex-wrap gap-4 mt-2">
                    <RadioOption name="requestType" value="new" checked={formData.requestType === 'new'} onChange={handleRadioChange} label="สั่งงานใหม่" />
                    <RadioOption name="requestType" value="edit" checked={formData.requestType === 'edit'} onChange={handleRadioChange} label="แก้ไขงาน" />
                    <RadioOption name="requestType" value="project" checked={formData.requestType === 'project'} onChange={handleRadioChange} label="สั่งงานเป็นโปรเจกต์" />
                    <RadioOption name="requestType" value="other" checked={formData.requestType === 'other'} onChange={handleRadioChange} label="อื่นๆ" />
                </div>
            </div>
            <InputField 
                label="2. วัน/เดือน/ปี (ที่สั่งงานหรือแก้ไขงาน) *" name="requestDate" type="text" 
                value={currentTime.toLocaleString('th-TH', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '')} 
                readOnly className="!bg-gray-100 dark:!bg-gray-700 cursor-not-allowed" 
            />
            { formData.requestType !== 'project' && (
                <div>
                    <InputField label="3. วัน/เดือน/ปี (ที่ต้องการรับงาน) *" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} onBlur={handleBlur} error={errors.dueDate} required icon={<FiCalendar className="w-5 h-5 text-gray-400" />} min={minDueDates.main} />
                    {mainLeadTime && mainLeadTime > 0 && <p className="text-sm text-blue-600 mt-1 flex items-center gap-1"><FiInfo size={14}/> งานประเภทนี้ใช้เวลาทำอย่างน้อย {mainLeadTime} วัน</p>}
                </div>
            )}

            <InputField label="4. ชื่อ-สกุล ผู้สั่งงาน *" name="requesterName" value={formData.requesterName} readOnly className="!bg-gray-100 dark:!bg-gray-700 cursor-not-allowed"/>
            <div className="">
                <label htmlFor="department" className="form-label">5. ส่วนงาน *</label>
                <SearchableDropdown name="department" options={departmentOptions} value={formData.department} onChange={(value) => handleDropdownChange('department', value)} error={errors.department} onBlur={() => handleBlur({ target: { name: 'department' } } as any)}/>
            </div>
            <InputField label="6. เป็นชิ้นงานของคณะกรรมการฯ คณะอนุกรรมการ หรือคณะทำงานใด? (หากไม่มี ไม่ต้องระบุ)" name="committee" value={formData.committee} onChange={handleChange} onBlur={handleBlur} placeholder="เช่น คณะกรรมการกำหนดมาตรฐานการบัญชี"/>
            <InputField label="7. อีเมล *" name="requesterEmail" type="email" value={formData.requesterEmail} readOnly className="!bg-gray-100 dark:!bg-gray-700 cursor-not-allowed" />
            <InputField label="เบอร์โทรศัพท์ *" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} error={errors.phone} required placeholder="เช่น 2546 หรือ 0-2685-2500" />
        </FormSection>

        <AnimatePresence mode="wait">
        {formData.requestType === 'project' ? (
          <motion.div key="project-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <FormSection title="รายละเอียดโปรเจกต์">
                 <InputField label="ชื่อโปรเจกต์ *" name="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} error={errors.projectName} required placeholder="เช่น งานสัมมนาประจำปี 2568" wrapperClassName="md:col-span-2"/>
                {subTasks.map((subTask, index) => (
                    <motion.div key={subTask.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="md:col-span-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800/50 relative">
                         <div className="flex justify-between items-center"><h4 className="font-bold text-lg text-brand-primary">รายการงานที่ {index + 1}</h4>{subTasks.length > 1 && (<button type="button" onClick={() => removeSubTask(subTask.id)} className="icon-interactive text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 p-1 rounded-full"><FiTrash2 /></button>)}</div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">ประเภทงาน *</label>
                                <select name={`subTaskType_${subTask.id}`} value={subTask.taskType} onChange={(e) => handleSubTaskChange(subTask.id, 'taskType', e.target.value)} className={`form-input mt-1 ${errors[`subTaskType_${subTask.id}`] ? 'border-red-500' : ''}`} required>
                                    <option value="">-- เลือกประเภทงาน --</option>
                                    {taskTypeConfigs.map(config => {
                                        const usage = dailyUsage.get(config.name) || 0;
                                        const isFull = config.isEditable && config.dailyLimit !== null && usage >= config.dailyLimit;
                                        return <option key={config.id} value={config.name} disabled={isFull}>{config.name}{isFull ? ' (โควต้าวันนี้เต็มแล้ว)' : ''}</option>;
                                    })}
                                </select>
                                {errors[`subTaskType_${subTask.id}`] && <p className="text-red-500 text-sm mt-1">{errors[`subTaskType_${subTask.id}`]}</p>}
                            </div>
                            {subTask.taskType === OTHER_TASK_TYPE_NAME && (<InputField label="โปรดระบุประเภทงาน *" id={`subTaskOtherType_${subTask.id}`} value={subTask.otherTaskTypeName} onChange={(e) => handleSubTaskChange(subTask.id, 'otherTaskTypeName', e.target.value)} error={errors[`subTaskOtherType_${subTask.id}`]} required />)}
                         </div>
                         <InputField label="หัวข้องาน *" id={`subTaskTitle_${subTask.id}`} value={subTask.taskTitle} onChange={(e) => handleSubTaskChange(subTask.id, 'taskTitle', e.target.value)} error={errors[`subTaskTitle_${subTask.id}`]} required/>
                        <div className="w-full">
                            <label className="form-label">รายละเอียดงาน *</label>
                            <textarea name={`subTaskDescription_${subTask.id}`} value={subTask.taskDescription} onChange={(e) => handleSubTaskChange(subTask.id, 'taskDescription', e.target.value)} rows={3} className={`form-input mt-1 ${errors[`subTaskDescription_${subTask.id}`] ? 'border-red-500' : ''}`} required />
                            {errors[`subTaskDescription_${subTask.id}`] && <p className="text-red-500 text-sm mt-1">{errors[`subTaskDescription_${subTask.id}`]}</p>}
                        </div>
                        <div>
                            <InputField label="วันที่ต้องการรับงาน *" type="date" name={`subTaskDueDate_${subTask.id}`} value={subTask.dueDate} onChange={(e) => handleSubTaskChange(subTask.id, 'dueDate', e.target.value)} error={errors[`subTaskDueDate_${subTask.id}`]} required icon={<FiCalendar />} min={minDueDates[subTask.id] || getMinDueDate(null)} />
                            {taskTypeConfigs.find(c => c.name === subTask.taskType)?.leadTimeDays as number > 0 && <p className="text-sm text-blue-600 mt-1 flex items-center gap-1"><FiInfo size={14}/> งานประเภทนี้ใช้เวลาทำอย่างน้อย {taskTypeConfigs.find(c => c.name === subTask.taskType)?.leadTimeDays} วัน</p>}
                        </div>
                    </motion.div>
                ))}
                 <div className="md:col-span-2"><button type="button" onClick={addSubTask} className="icon-interactive w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><FiPlus /> เพิ่มรายการงาน</button></div>
            </FormSection>
          </motion.div>
        ) : (
          <motion.div key="single-task-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <FormSection title="รายละเอียดชิ้นงาน">
                <div className="md:col-span-2">
                    <label className="form-label">8. ประเภทงานที่ประสงค์รับบริการ *</label>
                    <select name="taskType" value={formData.taskType} onChange={handleChange} onBlur={handleBlur} className={`form-input mt-1 ${errors.taskType ? 'border-red-500' : ''}`} required>
                        <option value="">-- เลือกประเภทงาน --</option>
                        {taskTypeConfigs.map(config => {
                            const usage = dailyUsage.get(config.name) || 0;
                            const isFull = config.isEditable && config.dailyLimit !== null && usage >= config.dailyLimit;
                            return <option key={config.id} value={config.name} disabled={isFull}>{config.name}{isFull ? ' (โควต้าวันนี้เต็มแล้ว)' : ''}</option>;
                        })}
                    </select>
                    {errors.taskType && <p className="text-red-500 text-sm mt-1">{errors.taskType}</p>}
                </div>
                 {formData.taskType === OTHER_TASK_TYPE_NAME && (
                     <div className="md:col-span-2"><InputField label="9. งานชนิดอื่น ๆ ที่ไม่มีในตัวเลือก โปรดระบุ.... *" name="otherTaskTypeName" value={formData.otherTaskTypeName} onChange={handleChange} onBlur={handleBlur} error={errors.otherTaskTypeName} required placeholder="ระบุประเภทงานอื่นๆ" /></div>
                 )}
                <InputField label="หัวข้องาน *" name="taskTitle" value={formData.taskTitle} onChange={handleChange} onBlur={handleBlur} error={errors.taskTitle} required placeholder="เช่น ออกแบบโปสเตอร์งานสัมมนา" wrapperClassName="md:col-span-2"/>
                <div className="md:col-span-2">
                    <label className="form-label">รายละเอียดงาน *</label>
                    <textarea name="taskDescription" value={formData.taskDescription} onChange={handleChange} onBlur={handleBlur} rows={4} className={`form-input mt-1 focus:outline-none focus:ring-2 ${errors.taskDescription ? 'border-red-500 focus:ring-red-500' : 'focus:ring-brand-secondary'}`} required placeholder="โปรดระบุรายละเอียดของงาน เช่น ขนาด สี รูปแบบ วัตถุประสงค์ ฯลฯ" aria-invalid={!!errors.taskDescription} aria-describedby={errors.taskDescription ? 'taskDescription-error' : undefined}/>
                    <AnimatePresence>{errors.taskDescription && (<motion.p id="taskDescription-error" className="mt-1 text-sm text-red-600" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>{errors.taskDescription}</motion.p>)}</AnimatePresence>
                </div>
            </FormSection>
          </motion.div>
        )}
        </AnimatePresence>

        <div>
          <label className="form-label">10. กรุณาอัปโหลดข้อมูลประกอบการผลิต แก้ไข และขนาดชิ้นงานได้ที่นี่</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">• ขีดจำกัดจำนวนไฟล์: 10 • ขีดจำกัดขนาดไฟล์เดียว: 100MB • ชนิดไฟล์ที่ได้รับอนุญาต: Word, Excel, PPT, PDF, รูป, วิดีโอ, เสียง</p>
          <div onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop} className={`relative rounded-lg p-8 text-center transition-colors border-2 border-dashed ${isDragging ? 'bg-emerald-50 dark:bg-emerald-900/50 border-brand-secondary' : 'border-gray-300 dark:border-gray-600 hover:border-brand-secondary hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">ลากและวางไฟล์ที่นี่ หรือ <span className="font-semibold text-brand-secondary">คลิกเพื่อเลือกไฟล์</span></p>
            <input type="file" multiple onChange={(e) => handleFileChange(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          {attachments.length > 0 && (<div className="mt-4 space-y-2">{attachments.map((file, index) => (<div key={index} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md"><div className="flex items-center gap-2 text-sm"><FiPaperclip className="text-gray-500" /><span>{file.name}</span><span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></div><button type="button" onClick={() => removeAttachment(index)} aria-label={`Remove ${file.name}`} className="icon-interactive text-red-500 hover:text-red-700"><FiX /></button></div>))}</div>)}
        </div>
        
        <div>
          <label className="form-label">11. หมายเหตุเพิ่มเติม (ถ้ามี)</label>
          <textarea name="additionalNotes" value={formData.additionalNotes} onChange={handleChange} onBlur={handleBlur} rows={3} className="form-input mt-1 focus:outline-none focus:ring-2 focus:ring-brand-secondary" placeholder="ข้อมูลเพิ่มเติมที่ต้องการแจ้ง"/>
        </div>

        <div className="text-right pt-4">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={isSubmitting} className="icon-interactive bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
            {isSubmitting ? 'กำลังส่งและอัปโหลด...' : 'ส่งคำร้องขอ'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (<div className="pt-6 border-t border-gray-200 dark:border-gray-700 first:pt-0 first:border-none"><h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">{title}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div></div>);
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string; wrapperClassName?: string; error?: string; icon?: React.ReactNode; }
const InputField: React.FC<InputFieldProps> = ({ label, wrapperClassName = '', error, icon, ...props }) => {
    const { className, ...restProps } = props;
    return (<div className={wrapperClassName}><label htmlFor={props.name || props.id} className="form-label">{label}</label><div className="relative mt-1"><input id={props.name || props.id} {...restProps} className={`form-input !mt-0 w-full focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-brand-secondary'} ${icon ? 'pr-10' : ''} ${className || ''}`} aria-invalid={!!error} aria-describedby={error ? `${props.name}-error` : undefined} />{icon && (<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">{icon}</div>)}</div><AnimatePresence>{error && (<motion.p id={`${props.name}-error`} className="mt-1 text-sm text-red-600" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>{error}</motion.p>)}</AnimatePresence></div>);
};
const RadioOption: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props}) => (<label className="flex items-center gap-2 cursor-pointer"><input type="radio" {...props} className="w-4 h-4 text-brand-secondary focus:ring-brand-secondary bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600" /><span className="text-gray-700 dark:text-gray-300">{label}</span></label>);

export default RequestForm;