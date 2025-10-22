import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiSearch } from 'react-icons/fi';

interface SearchableDropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    onBlur?: (e: React.FocusEvent<HTMLButtonElement>) => void;
    name: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, placeholder = "เลือก...", error, onBlur, name }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm('');
    };
    
    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onBlur={onBlur}
                name={name}
                className={`form-input !mt-1 w-full text-left flex justify-between items-center ${error ? 'border-red-500 ring-red-500' : 'focus-within:ring-brand-secondary'} ${!value ? 'text-gray-500 dark:text-gray-400' : ''}`}
            >
                <span className="truncate">{value || placeholder}</span>
                <FiChevronDown className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 w-full bg-white dark:bg-dark-card rounded-lg shadow-xl z-20 border border-gray-200 dark:border-dark-border"
                    >
                        <div className="p-2">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหา..."
                                    autoFocus
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-2 pl-9 border-b border-gray-200 dark:border-dark-border bg-transparent focus:outline-none"
                                />
                            </div>
                        </div>
                        <ul className="max-h-60 overflow-y-auto p-2">
                            {filteredOptions.length > 0 ? filteredOptions.map(option => (
                                <li
                                    key={option}
                                    onClick={() => handleSelect(option)}
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-muted cursor-pointer truncate"
                                >
                                    {option}
                                </li>
                            )) : <li className="p-2 text-center text-gray-500">ไม่พบข้อมูล</li>}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {error && (
                <motion.p
                    id={`${name}-error`}
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

export default SearchableDropdown;
