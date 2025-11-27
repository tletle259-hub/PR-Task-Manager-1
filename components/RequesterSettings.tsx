
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiSave, FiInfo, FiMail, FiBriefcase, FiEye, FiEyeOff, FiHelpCircle } from 'react-icons/fi';
import { RequesterProfile } from '../App';
import { User, Department } from '../types';
import { updateUser, getUserByMsalAccountId } from '../services/userService';
import { loginWithMicrosoft, ensureFirebaseAuth } from '../services/authService';
import { onDepartmentsUpdate } from '../services/departmentService';
import SearchableDropdown from './SearchableDropdown';
import UserManualModal from './UserManualModal';


interface RequesterSettingsProps {
    user: RequesterProfile;
    onProfileUpdate: (updatedProfile: RequesterProfile) => void;
}

// Component จัดการการตั้งค่าส่วนตัวของผู้สั่งงาน
const RequesterSettings: React.FC<RequesterSettingsProps> = ({ user, onProfileUpdate }) => {
    const isMsalAccount = 'homeAccountId' in user || ('msalAccountId' in user && !!user.msalAccountId);
    const isCustomUser = 'id' in user;

    const [formData, setFormData] = useState<Partial<User>>({});
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [departments, setDepartments] = useState<string[]>([]);
    const [showManual, setShowManual] = useState(false);

    // โหลดข้อมูลเดิม
    useEffect(() => {
        if (isCustomUser) {
            setFormData({
                firstNameTh: user.firstNameTh,
                lastNameTh: user.lastNameTh,
                firstNameEn: user.firstNameEn,
                lastNameEn: user.lastNameEn,
                position: user.position,
                department: user.department,
                email: user.email,
                username: user.username,
            });
        }
    }, [user, isCustomUser]);

    // โหลดแผนก
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
    
    const departmentOptions = useMemo(() => {
        const optionSet = new Set(departments);
        if (formData.department && !optionSet.has(formData.department)) {
            optionSet.add(formData.department);
        }
        return Array.from(optionSet).sort();
    }, [departments, formData.department]);
    
    // Update Username อัตโนมัติเมื่อเปลี่ยนชื่อ (ถ้ายังไม่เคยผูก MSAL)
    useEffect(() => {
        const { firstNameEn, lastNameEn } = formData;
        if (isCustomUser && !user.msalAccountId && firstNameEn && lastNameEn && lastNameEn.length >= 2) {
            const generatedUsername = `${firstNameEn.toLowerCase().trim()}.${lastNameEn.slice(0, 2).toLowerCase().trim()}`;
            if (generatedUsername !== formData.username) {
                setFormData(prev => ({ ...prev, username: generatedUsername }));
            }
        }
    }, [formData.firstNameEn, formData.lastNameEn, isCustomUser, user, formData.username]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    // บันทึกข้อมูลส่วนตัว
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!isCustomUser) return;

        try {
            await updateUser(user.id, formData);
            const updatedUser = { ...user, ...formData };
            onProfileUpdate(updatedUser);
            setMessage({ type: 'success', text: 'บันทึกข้อมูลส่วนตัวสำเร็จ' });
        } catch (error) {
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        }
    };
    
    // เปลี่ยนรหัสผ่าน
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!isCustomUser) return;

        if(passwordData.newPassword.length < 4) {
             setMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร' });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
            return;
        }

        try {
            await updateUser(user.id, { password: passwordData.newPassword });
            const updatedUser = { ...user, password: passwordData.newPassword };
            onProfileUpdate(updatedUser);
            setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ' });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
        }
    };

    // เชื่อมต่อบัญชี Microsoft
    const handleLinkMicrosoftAccount = async () => {
        setIsLinking(true);
        setMessage(null);
        if (!isCustomUser) return;

        try {
            const msalAccount = await loginWithMicrosoft();
            if (msalAccount) {
                // เช็คว่าบัญชีนี้ผูกกับคนอื่นไปแล้วหรือยัง
                const existingUser = await getUserByMsalAccountId(msalAccount.homeAccountId);
                if (existingUser && existingUser.id !== user.id) {
                    setMessage({ type: 'error', text: 'บัญชี Microsoft นี้ถูกเชื่อมต่อกับบัญชีอื่นแล้ว' });
                    setIsLinking(false);
                    return;
                }
                
                await updateUser(user.id, { msalAccountId: msalAccount.homeAccountId });
                onProfileUpdate({ ...user, msalAccountId: msalAccount.homeAccountId });
                setMessage({ type: 'success', text: 'เชื่อมต่อบัญชี Microsoft สำเร็จ!' });
            }
        } catch (error) {
            console.error("Error linking MSAL account:", error);
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี' });
        } finally {
            setIsLinking(false);
        }
    };
    
    const userEmail = 'email' in user ? user.email : ('username' in user ? user.username : 'N/A');

    // กรณี Login ด้วย Microsoft โดยตรงแต่ยังไม่ได้สร้าง User Profile ในระบบ
    if (!isCustomUser) {
        return (
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-6">ตั้งค่าบัญชี</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                     <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><FiInfo className="text-blue-500" /> ข้อมูลบัญชี</h3>
                     <p className="text-gray-600 dark:text-gray-400">
                         คุณเข้าสู่ระบบด้วยบัญชี Microsoft ({userEmail}).
                         <br/>
                         ข้อมูลส่วนตัวและการตั้งค่ารหัสผ่านจะถูกจัดการผ่านระบบของ Microsoft โดยตรง
                     </p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">ตั้งค่าบัญชี</h2>
                <button 
                    onClick={() => setShowManual(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 rounded-lg font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                    <FiHelpCircle /> คู่มือการใช้งาน
                </button>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}
                >
                    {message.text}
                </motion.div>
            )}

            <motion.form onSubmit={handleProfileSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-3"><FiUser /> ข้อมูลส่วนตัว</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="ชื่อ (ภาษาไทย)" name="firstNameTh" value={formData.firstNameTh || ''} onChange={handleProfileChange} icon={<FiUser />} />
                    <InputField label="นามสกุล (ภาษาไทย)" name="lastNameTh" value={formData.lastNameTh || ''} onChange={handleProfileChange} icon={<FiUser />} />
                    <InputField label="ชื่อ (ภาษาอังกฤษ)" name="firstNameEn" value={formData.firstNameEn || ''} onChange={handleProfileChange} icon={<FiUser />} />
                    <InputField label="นามสกุล (ภาษาอังกฤษ)" name="lastNameEn" value={formData.lastNameEn || ''} onChange={handleProfileChange} icon={<FiUser />} />
                    <InputField label="ตำแหน่ง" name="position" value={formData.position || ''} onChange={handleProfileChange} icon={<FiBriefcase />} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ส่วนงาน</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FiBriefcase /></span>
                             <SearchableDropdown
                                name="department"
                                options={departmentOptions}
                                value={formData.department || ''}
                                onChange={(value) => setFormData(prev => ({...prev, department: value}))}
                                placeholder="เลือกส่วนงาน"
                            />
                        </div>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="อีเมล" name="email" value={formData.email || ''} readOnly icon={<FiMail/>} />
                    <InputField label="Username" name="username" value={formData.username || ''} readOnly icon={<FiUser />} />
                 </div>
                <div className="text-right pt-2">
                    <button type="submit" className="icon-interactive bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-orange-600 transition-colors flex items-center gap-2 ml-auto">
                        <FiSave /> บันทึกข้อมูลส่วนตัว
                    </button>
                </div>
            </motion.form>

            {!user.msalAccountId && (
                 <motion.form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-3"><FiLock /> เปลี่ยนรหัสผ่าน</h3>
                    <div className="relative">
                        <InputField label="รหัสผ่านใหม่" name="newPassword" type={showPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={handlePasswordChange} icon={<FiLock/>} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute bottom-2 right-3 p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                    </div>
                    <div className="relative">
                        <InputField label="ยืนยันรหัสผ่านใหม่" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={handlePasswordChange} icon={<FiLock/>} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute bottom-2 right-3 p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                    </div>
                    <div className="text-right pt-2">
                        <button type="submit" className="icon-interactive bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-orange-600 transition-colors flex items-center gap-2 ml-auto">
                        <FiSave /> เปลี่ยนรหัสผ่าน
                        </button>
                    </div>
                </motion.form>
            )}

            <motion.div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
                 <h3 className="text-xl font-bold flex items-center gap-3">
                    <img src="https://img.icons8.com/color/24/000000/microsoft.png" alt="Microsoft logo" />
                    เชื่อมต่อบัญชี
                </h3>
                {user.msalAccountId ? (
                    <div className="p-4 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg text-sm">
                        <p>บัญชีของคุณเชื่อมต่อกับ Microsoft เรียบร้อยแล้ว ({user.email}).</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">เชื่อมต่อบัญชี Microsoft ของคุณเพื่อการเข้าสู่ระบบที่ง่ายและรวดเร็วยิ่งขึ้น</p>
                        <button 
                            onClick={handleLinkMicrosoftAccount} 
                            disabled={isLinking}
                            className="w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLinking ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อกับ Microsoft'}
                        </button>
                    </div>
                )}
            </motion.div>
            
            <AnimatePresence>
                {showManual && (
                    <UserManualModal isOpen={showManual} onClose={() => setShowManual(false)} role="requester" />
                )}
            </AnimatePresence>
        </div>
    );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: React.ReactNode }> = ({ label, icon, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
            <input {...props} className="w-full p-3 pl-10 rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700 read-only:bg-gray-200 dark:read-only:bg-gray-600 read-only:cursor-not-allowed" />
        </div>
    </div>
);


export default RequesterSettings;
