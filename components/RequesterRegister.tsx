import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUserPlus, FiUser, FiLock, FiEye, FiEyeOff, FiChevronLeft, FiSun, FiMoon, FiMail, FiBriefcase } from 'react-icons/fi';
import { User, Department } from '../types';
import { registerUser } from '../services/authService';
import { onDepartmentsUpdate } from '../services/departmentService';
import SearchableDropdown from './SearchableDropdown';

interface RequesterRegisterProps {
  onRegisterSuccess: (user: User) => void;
  onNavigateToLogin: () => void;
  theme: string;
  toggleTheme: () => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode; error?: string }> = ({ icon, error, ...props }) => (
    <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
            {...props}
            className={`w-full p-3 pl-10 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-secondary'}`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

const RequesterRegister: React.FC<RequesterRegisterProps> = ({ onRegisterSuccess, onNavigateToLogin, theme, toggleTheme }) => {
  const [formData, setFormData] = useState({
    firstNameTh: '',
    lastNameTh: '',
    firstNameEn: '',
    lastNameEn: '',
    position: '',
    department: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onDepartmentsUpdate((depts: Department[]) => {
      setDepartments(depts.map(d => d.name));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const { firstNameEn, lastNameEn } = formData;
    if (firstNameEn && lastNameEn.length >= 2) {
      const generatedUsername = `${firstNameEn.toLowerCase().trim()}.${lastNameEn.slice(0, 2).toLowerCase().trim()}`;
      setFormData(prev => ({ ...prev, username: generatedUsername }));
    } else {
        setFormData(prev => ({ ...prev, username: '' }));
    }
  }, [formData.firstNameEn, formData.lastNameEn]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.firstNameTh) newErrors.firstNameTh = "กรุณากรอกชื่อจริง";
    if (!formData.lastNameTh) newErrors.lastNameTh = "กรุณากรอกนามสกุล";
    if (!formData.firstNameEn) newErrors.firstNameEn = "กรุณากรอกชื่อ (ภาษาอังกฤษ)";
    if (!formData.lastNameEn) newErrors.lastNameEn = "กรุณากรอกนามสกุล (ภาษาอังกฤษ)";
    if (!formData.position) newErrors.position = "กรุณากรอกตำแหน่ง";
    if (!formData.department) newErrors.department = "กรุณาเลือกส่วนงาน";
    if (!formData.email) {
        newErrors.email = "กรุณากรอกอีเมล";
    } else if (!formData.email.endsWith('@tfac.or.th')) {
        newErrors.email = "อีเมลต้องเป็น @tfac.or.th เท่านั้น";
    }
    if (formData.password.length < 4) newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    setErrors({});

    try {
        const { confirmPassword, ...userData } = formData;
        const newUser = await registerUser(userData);
        onRegisterSuccess(newUser);
    } catch (err: any) {
        setErrors({ general: err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  }

  return (
    <motion.div
        key="requester-register"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="login-container py-12"
    >
       <button
            onClick={toggleTheme}
            className="icon-interactive fixed top-6 right-6 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 backdrop-blur-sm shadow-md"
        >
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>

        <motion.div
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ type: 'spring' }}
             className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative"
        >
             <button onClick={onNavigateToLogin} className="absolute top-4 left-4 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <FiChevronLeft />
             </button>

            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ลงทะเบียนสำหรับผู้สั่งงาน</h2>
                <p className="text-gray-500 dark:text-gray-400">สร้างบัญชีใหม่เพื่อเริ่มใช้งาน</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField icon={<FiUser />} placeholder="ชื่อ (ภาษาไทย)" name="firstNameTh" value={formData.firstNameTh} onChange={handleChange} error={errors.firstNameTh} />
                    <InputField icon={<FiUser />} placeholder="นามสกุล (ภาษาไทย)" name="lastNameTh" value={formData.lastNameTh} onChange={handleChange} error={errors.lastNameTh} />
                    <InputField icon={<FiUser />} placeholder="ชื่อ (ภาษาอังกฤษ)" name="firstNameEn" value={formData.firstNameEn} onChange={handleChange} error={errors.firstNameEn} />
                    <InputField icon={<FiUser />} placeholder="นามสกุล (ภาษาอังกฤษ)" name="lastNameEn" value={formData.lastNameEn} onChange={handleChange} error={errors.lastNameEn} />
                    <InputField icon={<FiBriefcase />} placeholder="ตำแหน่ง" name="position" value={formData.position} onChange={handleChange} error={errors.position} />
                    <div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FiBriefcase /></span>
                            <SearchableDropdown
                                name="department"
                                options={departments}
                                value={formData.department}
                                onChange={(value) => setFormData(prev => ({...prev, department: value}))}
                                error={errors.department}
                                placeholder="ส่วนงาน"
                            />
                        </div>
                    </div>
                </div>
                <InputField icon={<FiMail />} type="email" placeholder="อีเมล" name="email" value={formData.email} onChange={handleChange} error={errors.email} />
                
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username (สำหรับเข้าสู่ระบบ)</label>
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FiUser/></span>
                        <input type="text" value={formData.username} readOnly className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 cursor-not-allowed"/>
                    </div>
                </div>

                <div className="relative">
                    <InputField icon={<FiLock />} type={showPassword ? 'text' : 'password'} placeholder="รหัสผ่าน (4 ตัวอักษรขึ้นไป)" name="password" value={formData.password} onChange={handleChange} error={errors.password} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-500">{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                </div>
                <div className="relative">
                    <InputField icon={<FiLock />} type={showPassword ? 'text' : 'password'} placeholder="ยืนยันรหัสผ่าน" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-500">{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                </div>

                {errors.general && <p className="text-red-500 text-sm text-center">{errors.general}</p>}
                
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-secondary text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                    <FiUserPlus />
                    {isSubmitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
                </button>
            </form>
            
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                มีบัญชีอยู่แล้ว?{' '}
                <button onClick={onNavigateToLogin} className="font-semibold text-brand-secondary hover:underline">
                    เข้าสู่ระบบที่นี่
                </button>
            </p>
        </motion.div>
    </motion.div>
  );
};

export default RequesterRegister;
