
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Department } from '../types';
import { AccountInfo } from '@azure/msal-browser';
import { FiUser, FiBriefcase, FiCheckCircle } from 'react-icons/fi';
import { onDepartmentsUpdate } from '../services/departmentService';
import SearchableDropdown from './SearchableDropdown';
import { ensureFirebaseAuth } from '../services/authService';

interface MicrosoftOnboardingProps {
    msalAccount: AccountInfo;
    onComplete: (profileData: Omit<User, 'id' | 'password' | 'msalAccountId' | 'username' | 'email'>) => void;
    onCancel: () => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: React.ReactNode; error?: string }> = ({ label, icon, error, ...props }) => (
    <div>
        <label htmlFor={props.id} className="form-label mb-1">{label}</label>
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
            <input
                {...props}
                className={`form-input !pl-10 ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-secondary'}`}
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);


const MicrosoftOnboarding: React.FC<MicrosoftOnboardingProps> = ({ msalAccount, onComplete, onCancel }) => {
    const nameParts = msalAccount.name?.split(' ') || ['',''];
    const firstNameEn = nameParts[0];
    const lastNameEn = nameParts.slice(1).join(' ');

    const [formData, setFormData] = useState({
        firstNameTh: '',
        lastNameTh: '',
        firstNameEn: firstNameEn,
        lastNameEn: lastNameEn,
        position: '',
        department: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [departments, setDepartments] = useState<string[]>([]);

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

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.firstNameTh) newErrors.firstNameTh = "กรุณากรอกชื่อจริง";
        if (!formData.lastNameTh) newErrors.lastNameTh = "กรุณากรอกนามสกุล";
        if (!formData.position) newErrors.position = "กรุณากรอกตำแหน่ง";
        if (!formData.department) newErrors.department = "กรุณาเลือกส่วนงาน";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onComplete(formData);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg"
            >
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-center mb-2">ยินดีต้อนรับ!</h2>
                    <p className="text-center text-gray-500 dark:text-dark-text-muted mb-6">กรุณากรอกข้อมูลเพิ่มเติมเพื่อตั้งค่าบัญชีของคุณ</p>
                    <p className="text-center text-sm mb-6 p-3 bg-gray-100 dark:bg-dark-card/50 rounded-lg">
                        เข้าสู่ระบบด้วย: <span className="font-semibold">{msalAccount.username}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="ชื่อ (ภาษาไทย) *" id="firstNameTh" icon={<FiUser />} name="firstNameTh" value={formData.firstNameTh} onChange={handleChange} error={errors.firstNameTh} />
                            <InputField label="นามสกุล (ภาษาไทย) *" id="lastNameTh" icon={<FiUser />} name="lastNameTh" value={formData.lastNameTh} onChange={handleChange} error={errors.lastNameTh} />
                             <InputField label="ชื่อ (ภาษาอังกฤษ)" id="firstNameEn" icon={<FiUser />} name="firstNameEn" value={formData.firstNameEn} onChange={handleChange} error={errors.firstNameEn} />
                            <InputField label="นามสกุล (ภาษาอังกฤษ)" id="lastNameEn" icon={<FiUser />} name="lastNameEn" value={formData.lastNameEn} onChange={handleChange} error={errors.lastNameEn} />
                            <InputField label="ตำแหน่ง *" id="position" icon={<FiBriefcase />} name="position" value={formData.position} onChange={handleChange} error={errors.position} />
                             <div>
                                <label htmlFor="department" className="form-label mb-1">ส่วนงาน *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FiBriefcase /></span>
                                    <SearchableDropdown
                                        name="department"
                                        options={departments}
                                        value={formData.department}
                                        onChange={(value) => setFormData(prev => ({...prev, department: value}))}
                                        error={errors.department}
                                        placeholder="เลือกส่วนงาน"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onCancel} className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-dark-muted font-semibold hover:bg-gray-300 dark:hover:bg-dark-border">
                                ยกเลิก
                            </button>
                            <button type="submit" className="px-6 py-2 rounded-lg bg-brand-primary text-white font-bold hover:bg-blue-700 flex items-center gap-2">
                                <FiCheckCircle /> เสร็จสิ้น
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MicrosoftOnboarding;
