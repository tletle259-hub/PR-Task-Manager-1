
import { collection, onSnapshot, addDoc, writeBatch, doc, getDocs, query, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Notification } from '../types';

// --- NOTIFICATION SERVICE (บริการแจ้งเตือน) ---

const NOTIFICATIONS_COLLECTION = 'notifications';
const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);

// เพิ่มการแจ้งเตือนใหม่
export const addNotification = async (notificationData: Omit<Notification, 'id' | 'isRead' | 'timestamp'>): Promise<void> => {
    try {
        await addDoc(notificationsCollectionRef, {
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
    const q = query(notificationsCollectionRef, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const notifications: Notification[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        callback(notifications);
    });
};

// บันทึกสถานะการแจ้งเตือน (เช่น กดอ่านแล้ว หรือลบ)
// ฟังก์ชันนี้ใช้ Batch เพื่อจัดการข้อมูลจำนวนมากในครั้งเดียว
export const saveNotifications = async (notifications: Notification[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        const existingDocsSnapshot = await getDocs(notificationsCollectionRef);
        
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
                const docRef = doc(db, NOTIFICATIONS_COLLECTION, notification.id);
                batch.set(docRef, notification);
            });
        }

        await batch.commit();
    } catch (e) {
        console.error("Error saving notifications: ", e);
    }
};
