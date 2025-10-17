import { collection, onSnapshot, getDocs, writeBatch, doc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Notification } from '../types';
import { MOCK_NOTIFICATIONS } from '../constants';

const NOTIFICATIONS_COLLECTION = 'notifications';
const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);

export const seedInitialNotifications = async () => {
    const snapshot = await getDocs(notificationsCollectionRef);
    if (snapshot.empty) {
        console.log("Seeding initial notifications...");
        const batch = writeBatch(db);
        MOCK_NOTIFICATIONS.forEach(notification => {
            const docRef = doc(db, NOTIFICATIONS_COLLECTION, notification.id);
            batch.set(docRef, notification);
        });
        await batch.commit();
    }
};

// Fix: Explicitly type the snapshot parameter as QuerySnapshot<DocumentData> to resolve the type error.
export const onNotificationsUpdate = (callback: (notifications: Notification[]) => void): (() => void) => {
    return onSnapshot(notificationsCollectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
        const notifications: Notification[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        callback(notifications);
    });
};

export const saveNotifications = async (notifications: Notification[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        const existingDocsSnapshot = await getDocs(notificationsCollectionRef);
        
        // Create a map of new notifications for quick lookup
        const newNotificationsMap = new Map(notifications.map(n => [n.id, n]));

        // Delete notifications that are no longer in the new list
        existingDocsSnapshot.docs.forEach(doc => {
            if (!newNotificationsMap.has(doc.id)) {
                batch.delete(doc.ref);
            }
        });
        
        // Set/Update notifications from the new list
        notifications.forEach(notification => {
            const docRef = doc(db, NOTIFICATIONS_COLLECTION, notification.id);
            batch.set(docRef, notification);
        });

        await batch.commit();
    } catch (e) {
        console.error("Error saving notifications: ", e);
    }
};