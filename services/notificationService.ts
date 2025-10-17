import { collection, onSnapshot, addDoc, writeBatch, doc, getDocs, query, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Notification } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';
const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);


export const addNotification = async (notificationData: Omit<Notification, 'id' | 'isRead' | 'timestamp'>): Promise<void> => {
    try {
        await addDoc(notificationsCollectionRef, {
            ...notificationData,
            isRead: false,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Error adding notification: ", e);
    }
};

export const onNotificationsUpdate = (callback: (notifications: Notification[]) => void): (() => void) => {
    const q = query(notificationsCollectionRef, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const notifications: Notification[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        callback(notifications);
    });
};

export const saveNotifications = async (notifications: Notification[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        const existingDocsSnapshot = await getDocs(notificationsCollectionRef);
        
        // If the provided array is empty, it means we should delete all notifications.
        if (notifications.length === 0) {
            existingDocsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        } else {
            // Otherwise, perform a sync: delete old ones, update/add new ones.
            const newNotificationsMap = new Map(notifications.map(n => [n.id, n]));

            // Delete notifications from Firestore that are not in the provided array
            existingDocsSnapshot.docs.forEach(doc => {
                if (!newNotificationsMap.has(doc.id)) {
                    batch.delete(doc.ref);
                }
            });
            
            // Set/Update notifications from the provided array
            notifications.forEach(notification => {
                // Use the notification's own ID to create the doc reference
                const docRef = doc(db, NOTIFICATIONS_COLLECTION, notification.id);
                batch.set(docRef, notification);
            });
        }

        await batch.commit();
    } catch (e) {
        console.error("Error saving notifications: ", e);
    }
};