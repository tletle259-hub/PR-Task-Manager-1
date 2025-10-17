import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiSave, FiInfo, FiMail, FiBriefcase, FiEye, FiEyeOff } from 'react-icons/fi';
import { RequesterProfile } from '../App';
import { User } from '../types';
import { updateUser } from '../services/userService';

interface RequesterSettingsProps {
    user: RequesterProfile;
    onProfileUpdate: (updatedProfile: RequesterProfile) => void;
}

const RequesterSettings: React.FC<RequesterSettingsProps> = ({ user, onProfileUpdate }) => {
    const isMsalAccount = 'localAccountId' in user;
    
    const [formData, setFormData] = useState<Partial<User>>({});
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!isMsalAccount) {
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
    }, [user, isMsalAccount]);
    
    useEffect(() => {
        const { firstNameEn, lastNameEn } = formData;
        if (firstNameEn && lastNameEn && !isMsalAccount) {
            const generatedUsername = `${firstNameEn.toLowerCase().trim()}.${lastNameEn.slice(0, 2).toLowerCase().trim()}`;
            if (generatedUsername !== formData.username) {
                setFormData(prev => ({ ...prev, username: generatedUsername }));
            }
        }
    }, [formData.firstNameEn, formData.lastNameEn, isMsalAccount, formData.username]);


    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (isMsalAccount || !('id' in user)) return;

        try {
            await updateUser(user.id, formData);
            const updatedUser = { ...user, ...formData };
            onProfileUpdate(updatedUser);
            setMessage({ type: 'success', text: 'บันทึกข้อมูลส่วนตัวสำเร็จ' });
        } catch (error) {
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        }
    };
    
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (isMsalAccount || !('id' in user)) return;

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

    if (isMsalAccount) {
        return (
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-6">ตั้งค่าบัญชี</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                     <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><FiInfo className="text-blue-500" /> ข้อมูลบัญชี</h3>
                     <p className="text-gray-600 dark:text-gray-400">
                         คุณเข้าสู่ระบบด้วยบัญชี Microsoft ({user.username}).
                         <br/>
                         ข้อมูลส่วนตัวและการตั้งค่ารหัสผ่านจะถูกจัดการผ่านระบบของ Microsoft โดยตรง
                     </p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold">ตั้งค่าบัญชี</h2>

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
                    <InputField label="ส่วนงาน" name="department" value={formData.department || ''} onChange={handleProfileChange} icon={<FiBriefcase />} />
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
