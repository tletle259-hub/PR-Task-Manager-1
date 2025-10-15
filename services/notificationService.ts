import { Notification } from '../types';
import { MOCK_NOTIFICATIONS } from '../constants';
import { getData, saveData } from './dataService';

const NOTIFICATIONS_STORAGE_KEY = 'pr-notifications';

export const getNotifications = (): Notification[] => {
    return getData<Notification[]>(NOTIFICATIONS_STORAGE_KEY, MOCK_NOTIFICATIONS);
};

export const saveNotifications = (notifications: Notification[]): void => {
    saveData<Notification[]>(NOTIFICATIONS_STORAGE_KEY, notifications);
};
