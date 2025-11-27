
import { db } from '../firebaseConfig';
import { ContactMessage } from '../types';
import firebase from 'firebase/compat/app';

// --- CONTACT SERVICE (บริการข้อความติดต่อจากผู้ใช้) ---

const MESSAGES_COLLECTION = 'contactMessages';

// ติดตามข้อความติดต่อเข้ามาใหม่
export const onContactMessagesUpdate = (callback: (messages: ContactMessage[]) => void): (() => void) => {
    return db.collection(MESSAGES_COLLECTION).onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
        const messages: ContactMessage[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
        callback(messages);
    });
};

// ส่งข้อความติดต่อใหม่ (จาก ChatBot widget)
export const addContactMessage = async (newMessage: Omit<ContactMessage, 'id'>): Promise<string | null> => {
    try {
        const docRef = await db.collection(MESSAGES_COLLECTION).add(newMessage);
        return docRef.id;
    } catch (e) {
        console.error("Error adding contact message: ", e);
        return null;
    }
};

// อัปเดตสถานะข้อความ (เช่น อ่านแล้ว)
export const updateContactMessage = async (messageId: string, updates: Partial<Omit<ContactMessage, 'id'>>): Promise<void> => {
    try {
        await db.collection(MESSAGES_COLLECTION).doc(messageId).update(updates);
    } catch (e) {
        console.error("Error updating contact message: ", e);
        throw e;
    }
};

// ลบข้อความ
export const deleteContactMessage = async (messageId: string): Promise<void> => {
    try {
        await db.collection(MESSAGES_COLLECTION).doc(messageId).delete();
    } catch(e) {
        console.error("Error deleting contact message: ", e);
        throw e;
    }
};

// ลบข้อความทั้งหมด
export const deleteAllContactMessages = async (): Promise<void> => {
    try {
        const existingDocsSnapshot = await db.collection(MESSAGES_COLLECTION).get();
        if (existingDocsSnapshot.empty) return;

        const batch = db.batch();
        existingDocsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (e) {
        console.error("Error deleting all contact messages: ", e);
        throw e;
    }
};
