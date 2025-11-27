
import { db } from '../firebaseConfig';
import { Notification } from '../types';
import firebase from 'firebase/compat/app';

// --- NOTIFICATION SERVICE (บริการแจ้งเตือน) ---

const NOTIFICATIONS_COLLECTION = 'notifications';

// เพิ่มการแจ้งเตือนใหม่
export const addNotification = async (notificationData: Omit<Notification, 'id' | 'isRead' | 'timestamp'>): Promise<void> => {
    try {
        await db.collection(NOTIFICATIONS_COLLECTION).add({
            ...notificationData,
            isRead: false, // เริ่มต้นยังไม่อ่าน
            timestamp: new Date().toISOString() // เวลาปัจจุบัน
        });
    } catch (e) {
        console.error("Error adding notification: ", e);
    }
};

// ติดตามการแจ้งเตือนเรียงตามเวลาล่าสุด
export const onNotificationsUpdate = (callback: (notifications: Notification[]) => void): (() => void) => {
    const q = db.collection(NOTIFICATIONS_COLLECTION).orderBy('timestamp', 'desc');
    return q.onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
        const notifications: Notification[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        callback(notifications);
    });
};

// บันทึกสถานะการแจ้งเตือน (เช่น กดอ่านแล้ว หรือลบ)
// ฟังก์ชันนี้ใช้ Batch เพื่อจัดการข้อมูลจำนวนมากในครั้งเดียว
export const saveNotifications = async (notifications: Notification[]): Promise<void> => {
    try {
        const batch = db.batch();
        const existingDocsSnapshot = await db.collection(NOTIFICATIONS_COLLECTION).get();
        
        // ถ้าส่ง Array ว่างมา แปลว่าต้องการลบทั้งหมด
        if (notifications.length === 0) {
            existingDocsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        } else {
            // ซิงค์ข้อมูล: ลบอันที่ไม่มีในลิสต์ และอัปเดตอันที่มี
            const newNotificationsMap = new Map(notifications.map(n => [n.id, n]));

            // ลบ Notification ใน DB ที่ไม่มีอยู่ในรายการใหม่
            existingDocsSnapshot.docs.forEach(doc => {
                if (!newNotificationsMap.has(doc.id)) {
                    batch.delete(doc.ref);
                }
            });
            
            // อัปเดต/เพิ่ม Notification ใหม่
            notifications.forEach(notification => {
                const docRef = db.collection(NOTIFICATIONS_COLLECTION).doc(notification.id);
                batch.set(docRef, notification);
            });
        }

        await batch.commit();
    } catch (e) {
        console.error("Error saving notifications: ", e);
    }
};
