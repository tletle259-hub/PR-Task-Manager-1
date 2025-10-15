import { ContactMessage } from '../types';
import { CONTACT_MESSAGES_STORAGE_KEY } from '../constants';
import { getData, saveData } from './dataService';

export const getContactMessages = (): ContactMessage[] => {
    return getData<ContactMessage[]>(CONTACT_MESSAGES_STORAGE_KEY, []);
};

export const saveContactMessages = (messages: ContactMessage[]): void => {
    saveData<ContactMessage[]>(CONTACT_MESSAGES_STORAGE_KEY, messages);
};

export const addContactMessage = (newMessage: ContactMessage): ContactMessage[] => {
    const messages = getContactMessages();
    const updatedMessages = [...messages, newMessage];
    saveContactMessages(updatedMessages);
    return updatedMessages;
};
