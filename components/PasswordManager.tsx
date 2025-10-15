import React, { useState, useEffect } from 'react';
import { FiPlus, FiSave, FiTrash2, FiEdit, FiX } from 'react-icons/fi';
import { DEFAULT_ADMIN_PASSWORD } from '../config';

const PASSWORDS_STORAGE_KEY = 'pr-admin-passwords';

const getAdminPasswords = (): string[] => {
    try {
        const storedPasswords = localStorage.getItem(PASSWORDS_STORAGE_KEY);
        if (storedPasswords) {
            const parsed = JSON.parse(storedPasswords);
            if (Array.isArray(parsed) && parsed.length > 0) {
                 return parsed;
            }
        }
        const defaultPasswords = [DEFAULT_ADMIN_PASSWORD];
        localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(defaultPasswords));
        return defaultPasswords;
    } catch (e) {
        return [DEFAULT_ADMIN_PASSWORD];
    }
};

const saveAdminPasswords = (passwords: string[]) => {
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
};

const PasswordManager: React.FC = () => {
    const [passwords, setPasswords] = useState<string[]>([]);
    const [newPassword, setNewPassword] = useState('');
    const [editingState, setEditingState] = useState<{ index: number; value: string } | null>(null);

    useEffect(() => {
        setPasswords(getAdminPasswords());
    }, []);

    const handleAddPassword = () => {
        if (newPassword.trim() && !passwords.includes(newPassword.trim())) {
            const updatedPasswords = [...passwords, newPassword.trim()];
            setPasswords(updatedPasswords);
            saveAdminPasswords(updatedPasswords);
            setNewPassword('');
        }
    };

    const handleEditPassword = () => {
        if (editingState && editingState.value.trim()) {
            const updatedPasswords = [...passwords];
            updatedPasswords[editingState.index] = editingState.value.trim();
            setPasswords(updatedPasswords);
            saveAdminPasswords(updatedPasswords);
            setEditingState(null);
        }
    };

    const handleDeletePassword = (indexToDelete: number) => {
        if (passwords.length <= 1) {
            alert('ต้องมีรหัสผ่านอย่างน้อย 1 รหัส');
            return;
        }
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรหัสผ่านนี้?')) {
            const updatedPasswords = passwords.filter((_, index) => index !== indexToDelete);
            setPasswords(updatedPasswords);
            saveAdminPasswords(updatedPasswords);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    จัดการรหัสผ่านสำหรับเข้าสู่ส่วนของผู้ดูแล รหัสผ่านเหล่านี้จะถูกใช้ในหน้าต่าง "ต้องการรหัสผ่าน"
                </p>
            </div>
            <div className="flex gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="เพิ่มรหัสผ่านใหม่"
                    className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
                <button
                    onClick={handleAddPassword}
                    className="icon-interactive bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors font-semibold"
                >
                    <FiPlus /> เพิ่ม
                </button>
            </div>
            <div className="space-y-2">
                {passwords.map((password, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        {editingState?.index === index ? (
                            <input
                                type="text"
                                value={editingState.value}
                                onChange={(e) => setEditingState({ ...editingState, value: e.target.value })}
                                className="flex-grow p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                                autoFocus
                            />
                        ) : (
                            <p className="font-mono text-gray-700 dark:text-gray-300">{password}</p>
                        )}
                        <div className="flex gap-2 ml-4">
                            {editingState?.index === index ? (
                                <>
                                    <button onClick={handleEditPassword} className="icon-interactive p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900 rounded-full"><FiSave size={18} /></button>
                                    <button onClick={() => setEditingState(null)} className="icon-interactive p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><FiX size={18} /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditingState({ index, value: password })} className="icon-interactive p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full"><FiEdit size={18} /></button>
                                    <button onClick={() => handleDeletePassword(index)} className="icon-interactive p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"><FiTrash2 size={18} /></button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PasswordManager;